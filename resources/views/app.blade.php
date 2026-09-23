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
    @vite(['resources/css/app.css', 'resources/js/main.tsx'])
</head>
<body class="bg-cream-50 text-ink-800 antialiased min-h-screen">
    <div id="root"></div>
</body>
</html>
