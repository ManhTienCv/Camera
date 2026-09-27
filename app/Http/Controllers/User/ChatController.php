<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    /**
     * Helper resolve current user (session or bearer token)
     */
    protected function resolveUser(Request $request): ?User
    {
        if (Auth::check()) {
            return Auth::user();
        }

        $authHeader = $request->header('Authorization');
        if ($authHeader && Str::startsWith($authHeader, 'Bearer ')) {
            $token = Str::substr($authHeader, 7);
            return User::resolveByToken($token);
        }

        return null;
    }

    /**
     * Gửi tin nhắn từ User tới Admin
     */
    public function send(Request $request)
    {
        $user = $this->resolveUser($request);
        if (!$user) {
            return response()->json(['error' => 'Bạn cần đăng nhập để gửi tin nhắn hỗ trợ.'], 401);
        }

        // 1. Lấy nội dung từ request
        $messageText = trim((string) ($request->input('message') ?: $request->input('content') ?: ''));

        // 2. Kiểm tra nội dung trống hoặc vượt quá độ dài
        if (empty($messageText)) {
            return response()->json([
                'message' => 'Nội dung tin nhắn không được để trống.',
                'error' => 'Nội dung tin nhắn không được để trống',
            ], 400);
        }

        if (mb_strlen($messageText) > 500) {
            return response()->json([
                'message' => 'Tin nhắn quá dài (tối đa 500 ký tự). Vui lòng rút ngắn nội dung.',
                'error' => 'Tin nhắn quá dài',
            ], 422);
        }

        // 3. Lớp chống Spam 1: Cooldown Timer tối thiểu 2 giây giữa 2 tin nhắn liên tiếp
        $lastSentKey = 'user_chat_last_time_' . $user->id;
        $lastSentTime = Cache::get($lastSentKey);
        if ($lastSentTime && (microtime(true) - (float) $lastSentTime) < 2.0) {
            return response()->json([
                'message' => 'Bạn gửi tin nhắn quá nhanh. Vui lòng đợi 2 giây trước khi gửi tiếp.',
                'error' => 'Too fast',
            ], 429);
        }

        // 4. Lớp chống Spam 2: Rate Limiting theo phút (Tối đa 10 tin nhắn / 1 phút)
        $rateKey = 'chat_send_burst:' . $user->id;
        if (\Illuminate\Support\Facades\RateLimiter::tooManyAttempts($rateKey, 10)) {
            $seconds = \Illuminate\Support\Facades\RateLimiter::availableIn($rateKey);
            return response()->json([
                'message' => "Bạn đã gửi quá nhiều tin nhắn. Vui lòng tạm nghỉ {$seconds} giây trước khi gửi tiếp.",
                'error' => 'Too many requests',
            ], 429);
        }
        \Illuminate\Support\Facades\RateLimiter::hit($rateKey, 60);

        // 5. Lớp chống Spam 3: Chống gửi nội dung trùng lặp liên tiếp trong 30 giây
        $lastMsg = Message::where('sender_id', $user->id)->latest('id')->first();
        if ($lastMsg && $lastMsg->created_at && $lastMsg->created_at->diffInSeconds(now()) < 30) {
            if (mb_strtolower(trim($lastMsg->content)) === mb_strtolower($messageText)) {
                return response()->json([
                    'message' => 'Bạn vừa gửi nội dung này rồi. Vui lòng không gửi lặp lại và chờ chuyên viên phản hồi nhé!',
                    'error' => 'Duplicate message',
                ], 422);
            }
        }

        // 6. Xác định Admin nhận tin
        $admin = User::where('role', 'admin')->first();
        $receiverId = $admin ? $admin->id : 1;

        try {
            // Cập nhật timestamp gửi gần nhất
            Cache::put($lastSentKey, microtime(true), 60);

            // 7. Lưu tin nhắn của User vào Database
            $message = Message::create([
                'sender_id' => $user->id,
                'receiver_id' => $receiverId,
                'content' => $messageText,
                'is_read' => false,
            ]);

            // 8. Tự động phản hồi tin nhắn chào (Auto-responder) nếu cuộc trò chuyện mới hoặc chưa có admin rep trong 6 giờ
            $hasRecentAdminReply = Message::where('sender_id', $receiverId)
                ->where('receiver_id', $user->id)
                ->where('created_at', '>=', now()->subHours(6))
                ->exists();

            if (!$hasRecentAdminReply) {
                $customerName = $user->name ?: 'quý khách';
                $greeting = "Xin chào {$customerName}! CameraHub đã tiếp nhận yêu cầu của bạn. Chuyên viên tư vấn thường phản hồi trong vòng 3 - 5 phút. Nếu cần hỗ trợ khẩn cấp về đơn hàng, bạn có thể gửi kèm Mã đơn hàng hoặc Số điện thoại tại đây nhé!";

                Message::create([
                    'sender_id' => $receiverId,
                    'receiver_id' => $user->id,
                    'content' => $greeting,
                    'is_read' => false,
                ]);
            }

            return response()->json($message->load(['sender', 'receiver']));
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Không thể gửi tin nhắn: ' . $e->getMessage(),
                'error' => 'Không thể gửi tin nhắn: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy lịch sử chat giữa User hiện tại và Admin
     */
    public function getMessages(Request $request)
    {
        $user = $this->resolveUser($request);
        if (!$user) {
            return response()->json([]);
        }

        $userId = $user->id;

        // Tìm Admin để lọc tin nhắn qua lại
        $admin = User::where('role', 'admin')->first();
        $adminId = $admin ? $admin->id : 1;

        // Lấy toàn bộ hội thoại giữa 2 người hoặc tin nhắn mới sau after_id
        $query = Message::with(['sender:id,name,email,avatar_url', 'receiver:id,name,email,avatar_url'])
            ->where(function ($q) use ($userId, $adminId) {
                $q->where(function ($sub) use ($userId, $adminId) {
                    $sub->where('sender_id', $userId)->where('receiver_id', $adminId);
                })->orWhere(function ($sub) use ($userId, $adminId) {
                    $sub->where('sender_id', $adminId)->where('receiver_id', $userId);
                });
            });

        // MỤC TIÊU 6: Hỗ trợ after_id để giảm 90% tải server khi polling
        if ($request->filled('after_id')) {
            $query->where('id', '>', (int) $request->after_id);
        }

        $messages = $query->orderBy('created_at', 'asc')->get();

        return response()->json($messages);
    }
}
