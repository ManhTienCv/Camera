<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>CameraHub - Xác thực Google</title>
</head>
<body style="background:#151513;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;overflow:hidden;">
    <div style="text-align:center;padding:20px;">
        @if(!empty($error))
            <div style="width:48px;height:48px;border-radius:50%;background:#fee2e2;color:#dc2626;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;font-weight:bold;">!</div>
            <h3 style="font-size:16px;margin:0 0 8px;color:#f87171;">Đăng nhập không thành công</h3>
            <p style="font-size:13px;color:#9ca3af;margin:0 0 16px;max-width:320px;">{{ $error }}</p>
        @else
            <div style="width:44px;height:44px;border:3px solid #e85d1b;border-top-color:transparent;border-radius:50%;animation:camerahub-spin 0.8s linear infinite;margin:0 auto 16px;"></div>
            <h3 style="font-size:15px;margin:0 0 6px;color:#f5f5f4;">Đang đồng bộ tài khoản...</h3>
            <p style="font-size:12px;color:#a8a29e;margin:0;">Vui lòng chờ trong giây lát</p>
        @endif
    </div>
    <style>@keyframes camerahub-spin{to{transform:rotate(360deg)}}</style>
    <script>
        (function() {
            @if(!empty($error))
                const errorPayload = {
                    type: 'GOOGLE_AUTH_ERROR',
                    message: {!! json_encode($error) !!}
                };
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage(errorPayload, window.location.origin);
                    setTimeout(() => window.close(), 1200);
                } else {
                    setTimeout(() => {
                        window.location.href = '/?auth_error=' + encodeURIComponent({!! json_encode($error) !!});
                    }, 1500);
                }
            @else
                const authPayload = {
                    type: 'GOOGLE_AUTH_SUCCESS',
                    token: {!! json_encode($token) !!},
                    user: {!! json_encode($userData) !!},
                    isNewUser: {{ $isNewUser ? 'true' : 'false' }}
                };
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage(authPayload, window.location.origin);
                    setTimeout(() => window.close(), 300);
                } else {
                    window.location.href = '/?google_token=' + encodeURIComponent({!! json_encode($token) !!}) +
                        '&google_name=' + encodeURIComponent({!! json_encode($userData['fullName'] ?? '') !!}) +
                        '&is_new=' + ({{ $isNewUser ? '1' : '0' }});
                }
            @endif
        })();
    </script>
</body>
</html>
