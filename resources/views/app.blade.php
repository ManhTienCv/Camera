<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CameraHub - Nền Tảng Thương Mại Điện Tử Máy Ảnh & Thiết Bị Nhiếp Ảnh</title>
    <meta name="description" content="Chuyên máy ảnh Mirrorless, DSLR, Flycam DJI, Ống kính Sony Canon Nikon Fujifilm chính hãng giá tốt nhất.">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2">
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png?v=2">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2">
    <link rel="shortcut icon" href="/favicon.ico?v=2">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2">
    <meta name="apple-mobile-web-app-title" content="CameraHub">
    <link rel="manifest" href="/site.webmanifest">
    <meta name="theme-color" content="#e85d1b">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
    
    <script>
        (function() {
            try {
                var isAdmin = window.location.pathname.indexOf('/admin') === 0;
                var key = isAdmin ? 'camerahub_admin_theme' : 'camerahub_client_theme';
                var saved = localStorage.getItem(key);
                if (saved === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            } catch (e) {}
        })();
    </script>

    {{-- TẦNG CẦU NỐI HYBRID: View Transitions API & Top Progress Loading Bar --}}
    <style>
        /* Hỗ trợ Cross-Document View Transitions khi chuyển giữa Blade SSR và React SPA */
        @view-transition {
            navigation: auto;
        }

        ::view-transition-old(root) {
            animation: 180ms cubic-bezier(0.4, 0, 1, 1) both hybrid-fade-out;
        }

        ::view-transition-new(root) {
            animation: 260ms cubic-bezier(0, 0, 0.2, 1) both hybrid-fade-in;
        }

        @keyframes hybrid-fade-out {
            from {
                opacity: 1;
                transform: scale(1);
            }
            to {
                opacity: 0;
                transform: scale(0.995);
            }
        }

        @keyframes hybrid-fade-in {
            from {
                opacity: 0;
                transform: scale(1.005);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        /* Tôn trọng cài đặt giảm chuyển động của người dùng */
        @media (prefers-reduced-motion: reduce) {
            ::view-transition-group(*),
            ::view-transition-old(*),
            ::view-transition-new(*) {
                animation: none !important;
            }
        }

        /* Thanh Top Progress Bar mỏng nhẹ hiển thị khi bắt đầu điều hướng */
        #hybrid-top-progress {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 2.5px;
            background: linear-gradient(90deg, #e85d1b, #f97316, #fb923c);
            z-index: 999999;
            transform-origin: 0% 50%;
            transform: scaleX(0);
            opacity: 0;
            transition: transform 0.22s ease-out, opacity 0.18s ease-in-out;
            pointer-events: none;
            box-shadow: 0 0 10px rgba(232, 93, 27, 0.6);
        }

        #hybrid-top-progress.is-loading {
            opacity: 1;
        }
    </style>

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/main.tsx'])
</head>
<body class="bg-cream-50 text-ink-800 antialiased min-h-screen">
    {{-- Thanh Top Loading Bar của tầng cầu nối Hybrid --}}
    <div id="hybrid-top-progress" role="progressbar" aria-label="Đang nạp trang"></div>

    <div id="root"></div>

    {{-- Script quản lý tiến trình nạp trang Hybrid --}}
    <script>
        (function() {
            var bar = document.getElementById('hybrid-top-progress');
            var timer = null;
            var progress = 0;

            function setProgress(p) {
                if (!bar) return;
                progress = p;
                bar.style.transform = 'scaleX(' + p + ')';
            }

            window.startTopProgress = function() {
                if (!bar) bar = document.getElementById('hybrid-top-progress');
                if (!bar) return;
                clearInterval(timer);
                bar.classList.add('is-loading');
                setProgress(0.2);
                timer = setInterval(function() {
                    if (progress < 0.85) {
                        setProgress(progress + (0.9 - progress) * 0.12);
                    }
                }, 120);
            };

            window.finishTopProgress = function() {
                if (!bar) return;
                clearInterval(timer);
                setProgress(1);
                setTimeout(function() {
                    bar.classList.remove('is-loading');
                    setTimeout(function() {
                        setProgress(0);
                    }, 200);
                }, 180);
            };

            // Khi người dùng bấm chuyển trang ngoài React SPA (như sang màn hình SSR Blade)
            window.addEventListener('beforeunload', function() {
                window.startTopProgress();
            });

            // Bắt sự kiện click các liên kết nội bộ hướng tới trang SSR
            document.addEventListener('click', function(e) {
                var anchor = e.target && e.target.closest ? e.target.closest('a') : null;
                if (!anchor || !anchor.href) return;
                if (anchor.target && anchor.target !== '_self') return;
                if (anchor.hasAttribute('download')) return;

                if (anchor.href.indexOf(window.location.origin) === 0) {
                    var path = anchor.pathname;
                    // Nếu là đường dẫn hướng sang Blade SSR hoặc OAuth
                    if (path.indexOf('/admin/reports') === 0 || 
                        path.indexOf('/admin/users') === 0 || 
                        path.indexOf('/admin/orders') === 0 ||
                        path.indexOf('/auth/google') === 0 ||
                        path.indexOf('/payment/momo/callback') === 0) {
                        window.startTopProgress();
                    }
                }
            });

            // Khi React SPA hoàn tất đổi trang nội bộ
            window.addEventListener('camerahub_route_change', function() {
                window.finishTopProgress();
            });
        })();
    </script>
</body>
</html>
