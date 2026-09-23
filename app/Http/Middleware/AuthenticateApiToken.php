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
        $user = User::resolveByToken($token);

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
