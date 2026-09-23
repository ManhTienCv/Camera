<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Models\User;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json([
                'message' => 'Unauthorized: Vui lòng cung cấp mã xác thực Bearer Token hợp lệ.',
            ], 401);
        }

        $token = substr($authHeader, 7);
        $user = null;

        // 1. Xác thực HMAC Signed Token (Bền vững, không phụ thuộc Cache)
        if (str_contains($token, '.')) {
            $tokenRaw = str_starts_with($token, 'camerahub_') ? substr($token, 10) : $token;
            $parts = explode('.', $tokenRaw, 2);
            if (count($parts) === 2) {
                [$payloadEncoded, $signature] = $parts;
                $appKey = config('app.key') ?: 'camerahub_default_secret_key_2026';
                $expectedSig = hash_hmac('sha256', $payloadEncoded, $appKey);
                if (hash_equals($expectedSig, $signature)) {
                    $payload = json_decode(base64_decode($payloadEncoded), true);
                    if (is_array($payload) && !empty($payload['uid'])) {
                        // Kiểm tra thời hạn nếu có (mặc định 30 ngày)
                        $exp = $payload['exp'] ?? 0;
                        if (!$exp || $exp >= time()) {
                            if (!Cache::has('revoked_token_' . $signature)) {
                                $user = User::find($payload['uid']);
                            }
                        }
                    }
                }
            }
        }

        // 2. Fallback sang Cache kiểm tra cho các token dạng cũ (legacy)
        if (!$user) {
            $userId = Cache::get('auth_token_' . $token);
            if ($userId) {
                $user = User::find($userId);
            }
        }

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized: Phiên đăng nhập đã hết hạn hoặc không tồn tại.',
            ], 401);
        }

        // Gắn user vào request
        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
