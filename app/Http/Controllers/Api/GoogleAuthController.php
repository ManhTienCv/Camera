<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
    /**
     * Chuyển hướng người dùng sang trang đăng nhập của Google
     */
    public function redirectToGoogle()
    {
        $clientId = config('services.google.client_id');
        $redirectUri = config('services.google.redirect');

        if (!$clientId || empty($clientId) || $clientId === 'your_google_client_id_here') {
            return redirect('/?auth_error=' . urlencode('Chưa cấu hình GOOGLE_CLIENT_ID trong file .env của hệ thống.'));
        }

        $state = Str::random(40);
        Cache::put('google_oauth_state_' . $state, true, now()->addMinutes(15));

        $queryParams = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'openid profile email',
            'access_type' => 'offline',
            'state' => $state,
            'prompt' => 'select_account',
        ]);

        return redirect('https://accounts.google.com/o/oauth2/v2/auth?' . $queryParams);
    }

    /**
     * Tiếp nhận callback chuyển hướng từ Google khi người dùng hoàn tất đăng nhập
     */
    public function handleGoogleCallback(Request $request)
    {
        if ($request->has('error')) {
            $err = $request->get('error_description', $request->get('error', 'Đăng nhập Google bị hủy.'));
            return redirect('/?auth_error=' . urlencode($err));
        }

        $code = $request->input('code');
        if (!$code) {
            return redirect('/?auth_error=' . urlencode('Không nhận được mã xác thực (authorization code) từ Google.'));
        }

        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');
        $redirectUri = config('services.google.redirect');

        try {
            // 1. Đổi code lấy access_token từ Google API
            $tokenResponse = Http::asForm()->timeout(15)->post('https://oauth2.googleapis.com/token', [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'code' => $code,
                'redirect_uri' => $redirectUri,
                'grant_type' => 'authorization_code',
            ]);

            if (!$tokenResponse->successful()) {
                $errBody = $tokenResponse->json();
                $msg = $errBody['error_description'] ?? $errBody['error'] ?? 'Lỗi xác thực mã với Google OAuth.';
                return redirect('/?auth_error=' . urlencode($msg));
            }

            $tokenData = $tokenResponse->json();
            $accessToken = $tokenData['access_token'] ?? null;

            if (!$accessToken) {
                return redirect('/?auth_error=' . urlencode('Không tìm thấy access_token trong phản hồi từ Google.'));
            }

            // 2. Lấy thông tin hồ sơ người dùng từ Google UserInfo API
            $userResponse = Http::withToken($accessToken)
                ->timeout(15)
                ->get('https://www.googleapis.com/oauth2/v3/userinfo');

            if (!$userResponse->successful()) {
                return redirect('/?auth_error=' . urlencode('Không thể lấy thông tin tài khoản từ máy chủ Google.'));
            }

            $googleData = $userResponse->json();
            $googleId = $googleData['sub'] ?? null;
            $email = isset($googleData['email']) ? strtolower(trim($googleData['email'])) : null;
            $name = $googleData['name'] ?? 'Google User';
            $avatar = $googleData['picture'] ?? null;

            if (!$email) {
                return redirect('/?auth_error=' . urlencode('Tài khoản Google này không có quyền truy cập email công khai.'));
            }

            // 3. Tìm hoặc tạo mới người dùng trong cơ sở dữ liệu
            $user = User::where('google_id', $googleId)
                ->orWhere('email', $email)
                ->first();

            if ($user) {
                $user->update([
                    'google_id' => $googleId,
                    'avatar_url' => $user->avatar_url ?: $avatar,
                ]);
            } else {
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make(Str::random(32)),
                    'google_id' => $googleId,
                    'avatar_url' => $avatar,
                    'role' => 'customer',
                    'email_verified_at' => now(),
                ]);
            }

            // 4. Khởi tạo mã Auth Token cho hệ thống CameraHub (lưu Cache 30 ngày)
            $token = 'camerahub_' . Str::random(40) . '_' . time();
            Cache::put('auth_token_' . $token, $user->id, now()->addDays(30));

            // 5. Chuyển hướng người dùng về trang chủ kèm token
            return redirect('/?google_token=' . $token . '&google_name=' . urlencode($user->name));
        } catch (\Throwable $e) {
            return redirect('/?auth_error=' . urlencode('Lỗi hệ thống trong quá trình đăng nhập Google: ' . $e->getMessage()));
        }
    }

    /**
     * Đăng nhập mô phỏng Google dùng cho môi trường thử nghiệm khi chưa có Client ID
     */
    public function demoGoogleLogin()
    {
        $demoEmail = 'google.photographer@gmail.com';
        $user = User::where('email', $demoEmail)->first();

        if (!$user) {
            $user = User::create([
                'name' => 'Trần Đức Minh (Google User)',
                'email' => $demoEmail,
                'password' => Hash::make('Demo@Google123'),
                'google_id' => 'google_demo_1098273645123',
                'avatar_url' => 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
                'role' => 'customer',
                'phone' => '0912345678',
                'email_verified_at' => now(),
            ]);
        }

        $token = 'camerahub_' . Str::random(40) . '_' . time();
        Cache::put('auth_token_' . $token, $user->id, now()->addDays(30));

        return redirect('/?google_token=' . $token . '&google_name=' . urlencode($user->name));
    }
}
