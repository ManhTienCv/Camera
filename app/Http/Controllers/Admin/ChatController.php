<?php

namespace App\Http\Controllers\Admin;

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
     * Helper resolve current admin (session or bearer token or fallback to admin user)
     */
    protected function resolveAdmin(Request $request): User
    {
        if (Auth::check() && Auth::user()->role === 'admin') {
            return Auth::user();
        }

        $authHeader = $request->header('Authorization');
        if ($authHeader && Str::startsWith($authHeader, 'Bearer ')) {
            $token = Str::substr($authHeader, 7);
            $user = User::resolveByToken($token);
            if ($user) return $user;
        }

        // Fallback to default admin in database
        $admin = User::where('role', 'admin')->first();
        return $admin ?: User::first();
    }

    /**
     * Lấy danh sách những User đã từng nhắn tin với Admin
     */
    public function getUsers(Request $request)
    {
        $admin = $this->resolveAdmin($request);
        $adminId = $admin->id;

        // Tìm tất cả ID của người dùng có tương tác với admin
        $userIds = Message::where('receiver_id', $adminId)
            ->orWhere('sender_id', $adminId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($msg) use ($adminId) {
                return $msg->sender_id == $adminId ? $msg->receiver_id : $msg->sender_id;
            })
            ->unique()
            ->filter(fn ($id) => $id != $adminId)
            ->values()
            ->toArray();

        // Lấy thông tin chi tiết các User đó kèm số tin chưa đọc và tin nhắn mới nhất
        $users = User::whereIn('id', $userIds)
            ->select('id', 'name', 'email', 'avatar_url', 'created_at')
            ->get()
            ->map(function ($u) use ($adminId) {
                $lastMsg = Message::where(function ($q) use ($u, $adminId) {
                    $q->where('sender_id', $u->id)->where('receiver_id', $adminId);
                })->orWhere(function ($q) use ($u, $adminId) {
                    $q->where('sender_id', $adminId)->where('receiver_id', $u->id);
                })->latest()->first();

                $unreadCount = Message::where('sender_id', $u->id)
                    ->where('receiver_id', $adminId)
                    ->where('is_read', false)
                    ->count();

                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'avatar_url' => $u->avatar_url,
                    'last_message' => $lastMsg ? $lastMsg->content : '',
                    'last_message_time' => $lastMsg ? $lastMsg->created_at->diffForHumans() : '',
                    'unread_count' => $unreadCount,
                ];
            });

        return response()->json($users);
    }

    /**
     * Lấy lịch sử tin nhắn của một User cụ thể
     */
    public function getMessages(Request $request, $userId)
    {
        $admin = $this->resolveAdmin($request);
        $adminId = $admin->id;

        // Đánh dấu tin nhắn từ user này gửi cho admin là đã đọc
        Message::where('sender_id', $userId)
            ->where('receiver_id', $adminId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $query = Message::with(['sender:id,name,email,avatar_url', 'receiver:id,name,email,avatar_url'])
            ->where(function ($q) use ($userId, $adminId) {
                $q->where(function ($sub) use ($userId, $adminId) {
                    $sub->where('sender_id', $userId)->where('receiver_id', $adminId);
                })->orWhere(function ($sub) use ($userId, $adminId) {
                    $sub->where('sender_id', $adminId)->where('receiver_id', $userId);
                });
            });

        // MỤC TIÊU 6: Hỗ trợ after_id cho Admin console polling
        if ($request->filled('after_id')) {
            $query->where('id', '>', (int) $request->after_id);
        }

        $messages = $query->orderBy('created_at', 'asc')->get();

        return response()->json($messages);
    }

    /**
     * Admin gửi tin nhắn phản hồi
     */
    public function send(Request $request)
    {
        $admin = $this->resolveAdmin($request);

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'message' => 'required|string',
        ]);

        $message = Message::create([
            'sender_id' => $admin->id,
            'receiver_id' => $request->user_id,
            'content' => trim($request->message),
            'is_read' => false,
        ]);

        return response()->json($message->load(['sender', 'receiver']));
    }
}
