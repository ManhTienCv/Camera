<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Address;
use App\Models\Order;
use App\Services\EmailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Helper to resolve authenticated user from Bearer token or fallback
     */
    protected function getAuthUser(Request $request): ?User
    {
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
     * Generate and store an auth token for a user
     */
    protected function createToken(User $user): string
    {
        $token = 'camerahub_' . Str::random(40) . '_' . time();
        // Store for 30 days
        Cache::put('auth_token_' . $token, $user->id, now()->addDays(30));
        return $token;
    }

    /**
     * Format user response matching frontend User interface
     */
    protected function formatUser(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'customerCode' => 'CAM-ACC-' . str_pad((string) $user->id, 5, '0', STR_PAD_LEFT),
            'email' => $user->email,
            'fullName' => $user->name,
            'phone' => $user->phone,
            'avatarUrl' => $user->avatar_url,
            'role' => $user->role ?? 'customer',
            'hasPassword' => !empty($user->password),
            'createdAt' => $user->created_at ? $user->created_at->toISOString() : null,
            'totalOrders' => $user->orders()->count(),
            'addresses' => $user->addresses->map(function ($a) {
                return [
                    'id' => (string) $a->id,
                    'userId' => (string) $a->user_id,
                    'label' => $a->label,
                    'recipientName' => $a->recipient_name,
                    'phone' => $a->phone,
                    'address' => $a->address,
                    'city' => $a->city,
                    'isDefault' => (bool) $a->is_default,
                    'createdAt' => $a->created_at ? $a->created_at->toISOString() : null,
                ];
            })->toArray(),
        ];
    }

    // 1. REGISTER
    public function register(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:6',
            'fullName' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $email = strtolower(trim($request->email));

        if (User::where('email', $email)->exists()) {
            return response()->json(['message' => 'Email này đã được đăng ký trên hệ thống.'], 400);
        }

        $user = User::create([
            'name' => trim($request->fullName),
            'email' => $email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone ? trim($request->phone) : null,
            'role' => 'customer',
        ]);

        $token = $this->createToken($user);

        return response()->json([
            'message' => 'Đăng ký tài khoản thành công!',
            'token' => $token,
            'user' => $this->formatUser($user),
        ], 201);
    }

    // 1.1 SEND REGISTER OTP
    public function sendRegisterOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:255',
        ]);

        $email = strtolower(trim($request->email));

        if (User::where('email', $email)->exists()) {
            return response()->json(['message' => 'Email này đã được đăng ký tài khoản trên hệ thống.'], 400);
        }

        $otp = (string) random_int(100000, 999999);
        Cache::put('reg_otp_' . $email, $otp, now()->addMinutes(5));

        // Gửi email thực tế qua Gmail SMTP
        $sent = EmailService::sendRegisterOtp($email, $request->fullName ?? '', $otp);

        return response()->json([
            'message' => $sent 
                ? 'Mã xác thực OTP đã được gửi trực tiếp tới email ' . $email . ' của bạn.' 
                : 'Đã tạo mã xác thực. Vui lòng kiểm tra hộp thư email của bạn.',
            'email' => $email,
        ]);
    }

    // 1.2 REGISTER WITH OTP
    public function registerWithOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:6',
            'fullName' => 'required|string|max:255',
            'otp' => 'required|string|size:6',
            'phone' => 'nullable|string|max:20',
        ]);

        $email = strtolower(trim($request->email));
        $cachedOtp = Cache::get('reg_otp_' . $email);

        if (!$cachedOtp || $cachedOtp !== trim($request->otp)) {
            return response()->json(['message' => 'Mã OTP không chính xác hoặc đã hết hạn (5 phút).'], 400);
        }

        if (User::where('email', $email)->exists()) {
            return response()->json(['message' => 'Email này đã được đăng ký trên hệ thống.'], 400);
        }

        $user = User::create([
            'name' => trim($request->fullName),
            'email' => $email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone ? trim($request->phone) : null,
            'role' => 'customer',
        ]);

        Cache::forget('reg_otp_' . $email);
        $token = $this->createToken($user);

        return response()->json([
            'message' => 'Xác thực OTP & Đăng ký tài khoản thành công!',
            'token' => $token,
            'user' => $this->formatUser($user),
        ], 201);
    }

    // 2. LOGIN
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $email = strtolower(trim($request->email));
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Email hoặc mật khẩu không chính xác.'], 401);
        }

        $token = $this->createToken($user);

        return response()->json([
            'message' => 'Đăng nhập thành công!',
            'token' => $token,
            'user' => $this->formatUser($user),
        ]);
    }

    // 2.1 SEND FORGOT PASSWORD OTP
    public function sendForgotPasswordOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:255',
        ]);

        $email = strtolower(trim($request->email));
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json(['message' => 'Không tìm thấy tài khoản nào liên kết với email này.'], 404);
        }

        $otp = (string) random_int(100000, 999999);
        Cache::put('forgot_pass_otp_' . $email, $otp, now()->addMinutes(5));

        $sent = EmailService::sendForgotPasswordOtp($email, $user->name, $otp);

        return response()->json([
            'message' => $sent 
                ? 'Mã OTP đặt lại mật khẩu đã được gửi tới email ' . $email . ' của bạn.' 
                : 'Mã xác thực OTP đã được tạo. Vui lòng kiểm tra hộp thư email của bạn.',
            'email' => $email,
        ]);
    }

    // 2.2 RESET PASSWORD WITH OTP
    public function resetPasswordWithOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:255',
            'otp' => 'required|string|size:6',
            'newPassword' => 'required|string|min:6',
        ]);

        $email = strtolower(trim($request->email));
        $cachedOtp = Cache::get('forgot_pass_otp_' . $email);

        if (!$cachedOtp || $cachedOtp !== trim($request->otp)) {
            return response()->json(['message' => 'Mã OTP không chính xác hoặc đã hết hạn (5 phút).'], 400);
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            return response()->json(['message' => 'Tài khoản không tồn tại trên hệ thống.'], 404);
        }

        $user->password = Hash::make($request->newPassword);
        $user->save();

        Cache::forget('forgot_pass_otp_' . $email);

        $token = $this->createToken($user);

        return response()->json([
            'message' => 'Đặt lại mật khẩu thành công!',
            'token' => $token,
            'user' => $this->formatUser($user),
        ]);
    }

    // 3. GET PROFILE (ME)
    public function me(Request $request)
    {
        $user = $this->getAuthUser($request);

        if (!$user) {
            return response()->json(['message' => 'Chưa đăng nhập.'], 401);
        }

        return response()->json($this->formatUser($user));
    }

    // 4. UPDATE PROFILE
    public function updateProfile(Request $request)
    {
        $user = $this->getAuthUser($request);

        if (!$user) {
            return response()->json(['message' => 'Chưa đăng nhập.'], 401);
        }

        if ($request->has('fullName') && !empty($request->fullName)) {
            $user->name = trim($request->fullName);
        }

        if ($request->has('phone')) {
            $user->phone = trim($request->phone);
        }

        if ($request->has('avatarUrl')) {
            $user->avatar_url = $request->avatarUrl;
        }

        if ($request->has('newPassword') && !empty($request->newPassword)) {
            if (!empty($user->password)) {
                if (!$request->has('currentPassword') || !Hash::check($request->currentPassword, $user->password)) {
                    return response()->json(['message' => 'Mật khẩu hiện tại không chính xác.'], 400);
                }
            }
            $user->password = Hash::make($request->newPassword);
        }

        $user->save();

        return response()->json([
            'message' => 'Cập nhật thông tin thành công!',
            'user' => $this->formatUser($user->fresh()),
        ]);
    }

    // 4.0 CHANGE PASSWORD
    public function changePassword(Request $request)
    {
        $user = $this->getAuthUser($request);

        if (!$user) {
            return response()->json(['message' => 'Chưa đăng nhập.'], 401);
        }

        $request->validate([
            'newPassword' => 'required|string|min:6',
        ]);

        if (!empty($user->password)) {
            if (!$request->has('currentPassword') || !Hash::check($request->currentPassword, $user->password)) {
                return response()->json(['message' => 'Mật khẩu hiện tại không chính xác.'], 400);
            }
        }

        $user->password = Hash::make($request->newPassword);
        $user->save();

        return response()->json([
            'message' => 'Đổi mật khẩu thành công!',
            'user' => $this->formatUser($user->fresh()),
        ]);
    }

    // 4.1 SEND CHANGE EMAIL OTP
    public function sendChangeEmailOtp(Request $request)
    {
        $user = $this->getAuthUser($request);

        if (!$user) {
            return response()->json(['message' => 'Chưa đăng nhập.'], 401);
        }

        $request->validate([
            'newEmail' => 'required|email|max:255',
        ]);

        $newEmail = strtolower(trim($request->newEmail));

        if (User::where('email', $newEmail)->where('id', '!=', $user->id)->exists()) {
            return response()->json(['message' => 'Địa chỉ email này đã có tài khoản khác sử dụng.'], 400);
        }

        $otp = (string) random_int(100000, 999999);
        Cache::put('change_email_otp_' . $user->id, [
            'otp' => $otp,
            'newEmail' => $newEmail,
        ], now()->addMinutes(5));

        // Gửi email thực tế qua Gmail SMTP
        $sent = EmailService::sendChangeEmailOtp($newEmail, $user->name, $otp);

        return response()->json([
            'message' => $sent 
                ? 'Mã xác thực OTP đã được gửi đến email mới ' . $newEmail . '.' 
                : 'Đã tạo mã xác thực. Vui lòng kiểm tra email của bạn.',
            'newEmail' => $newEmail,
        ]);
    }

    // 4.2 VERIFY CHANGE EMAIL OTP
    public function verifyChangeEmailOtp(Request $request)
    {
        $user = $this->getAuthUser($request);

        if (!$user) {
            return response()->json(['message' => 'Chưa đăng nhập.'], 401);
        }

        $request->validate([
            'newEmail' => 'required|email|max:255',
            'otp' => 'required|string|size:6',
        ]);

        $newEmail = strtolower(trim($request->newEmail));
        $cached = Cache::get('change_email_otp_' . $user->id);

        if (!$cached || ($cached['otp'] ?? '') !== trim($request->otp) || ($cached['newEmail'] ?? '') !== $newEmail) {
            return response()->json(['message' => 'Mã OTP không chính xác hoặc đã hết hạn.'], 400);
        }

        $user->email = $newEmail;
        $user->save();

        Cache::forget('change_email_otp_' . $user->id);

        return response()->json([
            'message' => 'Cập nhật địa chỉ email thành công!',
            'user' => $this->formatUser($user->fresh()),
        ]);
    }

    // 5. GET ADDRESSES
    public function getAddresses(Request $request)
    {
        $user = $this->getAuthUser($request);

        if (!$user) {
            return response()->json([]);
        }

        $addresses = $user->addresses()->get()->map(function ($a) {
            return [
                'id' => (string) $a->id,
                'userId' => (string) $a->user_id,
                'label' => $a->label,
                'recipientName' => $a->recipient_name,
                'phone' => $a->phone,
                'address' => $a->address,
                'city' => $a->city,
                'isDefault' => (bool) $a->is_default,
                'createdAt' => $a->created_at ? $a->created_at->toISOString() : null,
            ];
        });

        return response()->json($addresses);
    }

    // 6. CREATE ADDRESS
    public function createAddress(Request $request)
    {
        $user = $this->getAuthUser($request);

        if (!$user) {
            return response()->json(['message' => 'Chưa đăng nhập.'], 401);
        }

        $request->validate([
            'recipientName' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:500',
            'city' => 'nullable|string|max:100',
            'label' => 'nullable|string|max:100',
            'isDefault' => 'nullable|boolean',
        ]);

        $isDefault = $request->boolean('isDefault');
        if ($isDefault || $user->addresses()->count() === 0) {
            $user->addresses()->update(['is_default' => false]);
            $isDefault = true;
        }

        $address = $user->addresses()->create([
            'label' => $request->input('label', 'Nhà riêng'),
            'recipient_name' => trim($request->recipientName),
            'phone' => trim($request->phone),
            'address' => trim($request->address),
            'city' => $request->input('city', 'Hà Nội'),
            'is_default' => $isDefault,
        ]);

        return response()->json([
            'message' => 'Thêm địa chỉ nhận hàng thành công!',
            'address' => [
                'id' => (string) $address->id,
                'userId' => (string) $address->user_id,
                'label' => $address->label,
                'recipientName' => $address->recipient_name,
                'phone' => $address->phone,
                'address' => $address->address,
                'city' => $address->city,
                'isDefault' => (bool) $address->is_default,
                'createdAt' => $address->created_at->toISOString(),
            ],
        ], 201);
    }

    // 7. UPDATE ADDRESS
    public function updateAddress(Request $request, $id)
    {
        $user = $this->getAuthUser($request);

        if (!$user) {
            return response()->json(['message' => 'Chưa đăng nhập.'], 401);
        }

        $address = $user->addresses()->findOrFail($id);

        if ($request->boolean('isDefault')) {
            $user->addresses()->where('id', '!=', $id)->update(['is_default' => false]);
            $address->is_default = true;
        } elseif ($request->has('isDefault')) {
            $address->is_default = $request->boolean('isDefault');
        }

        if ($request->has('label')) $address->label = $request->label;
        if ($request->has('recipientName')) $address->recipient_name = trim($request->recipientName);
        if ($request->has('phone')) $address->phone = trim($request->phone);
        if ($request->has('address')) $address->address = trim($request->address);
        if ($request->has('city')) $address->city = trim($request->city);

        $address->save();

        return response()->json([
            'message' => 'Cập nhật địa chỉ thành công!',
            'address' => [
                'id' => (string) $address->id,
                'userId' => (string) $address->user_id,
                'label' => $address->label,
                'recipientName' => $address->recipient_name,
                'phone' => $address->phone,
                'address' => $address->address,
                'city' => $address->city,
                'isDefault' => (bool) $address->is_default,
            ],
        ]);
    }

    // 8. DELETE ADDRESS
    public function deleteAddress(Request $request, $id)
    {
        $user = $this->getAuthUser($request);

        if (!$user) {
            return response()->json(['message' => 'Chưa đăng nhập.'], 401);
        }

        $address = $user->addresses()->findOrFail($id);
        $address->delete();

        return response()->json(['message' => 'Xóa địa chỉ thành công!']);
    }

    // 9. GET MY ORDERS
    public function myOrders(Request $request)
    {
        $user = $this->getAuthUser($request);

        if (!$user) {
            return response()->json([]);
        }

        $orders = Order::with('items')
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('customer_email', $user->email);
            })
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($order) {
                return [
                    'id' => (string) $order->id,
                    'order_code' => $order->order_code,
                    'session_id' => $order->session_id,
                    'customer_name' => $order->customer_name,
                    'customer_email' => $order->customer_email,
                    'customer_phone' => $order->customer_phone,
                    'shipping_address' => $order->shipping_address,
                    'city' => $order->city,
                    'payment_method' => $order->payment_method,
                    'payment_status' => $order->payment_status,
                    'total_amount' => (float) $order->total_amount,
                    'status' => $order->order_status,
                    'created_at' => $order->created_at ? $order->created_at->toISOString() : null,
                    'items' => $order->items->map(function ($i) {
                        return [
                            'product_id' => (string) $i->product_id,
                            'name' => $i->name,
                            'price' => (float) $i->price,
                            'quantity' => (int) $i->quantity,
                            'image_url' => $i->image_url ?? '',
                        ];
                    }),
                ];
            });

        return response()->json($orders);
    }
}
