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
            $userId = Cache::get('auth_token_' . $token);
            if ($userId) {
                return User::find($userId);
            }
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
        $messageText = $request->input('message') ?: $request->input('content');

        // 2. Kiểm tra nội dung trống
        if (empty(trim($messageText))) {
            return response()->json(['error' => 'Nội dung tin nhắn không được để trống'], 400);
        }

        // 3. Xác định Admin nhận tin
        $admin = User::where('role', 'admin')->first();
        $receiverId = $admin ? $admin->id : 1;

        try {
            // 4. Lưu tin nhắn vào Database
            $message = Message::create([
                'sender_id' => $user->id,
                'receiver_id' => $receiverId,
                'content' => trim($messageText),
                'is_read' => false,
            ]);

            return response()->json($message->load(['sender', 'receiver']));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Không thể gửi tin nhắn: ' . $e->getMessage()], 500);
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
