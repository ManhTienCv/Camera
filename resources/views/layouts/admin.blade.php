<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Admin Dashboard') - CameraHub</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2">
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png?v=2">
    <link rel="shortcut icon" href="/favicon.ico?v=2">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2">
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        html { zoom: 0.9; }
        body { background-color: #f8fafc; font-family: 'Be Vietnam Pro', system-ui, sans-serif; min-height: calc(100vh / 0.9); }
        .sidebar { min-height: calc(100vh / 0.9); background: #0f172a; color: #fff; }
        .sidebar .nav-link { color: #94a3b8; padding: 0.75rem 1.25rem; font-weight: 500; border-radius: 8px; margin-bottom: 4px; }
        .sidebar .nav-link:hover, .sidebar .nav-link.active { color: #fff; background-color: #1e293b; }
        .sidebar .nav-link i { width: 24px; }
        .brand-logo { padding: 1.5rem 1.25rem; font-size: 1.25rem; font-weight: 700; color: #fff; border-bottom: 1px solid #1e293b; }
        .brand-logo span { color: #f97316; }
        #admin-chat-box { position: fixed; bottom: 20px; right: 20px; z-index: 1050; }
        #chat-popup { width: 360px; height: 500px; display: none; position: fixed; bottom: 80px; right: 20px; z-index: 1051; }
        #user-list { max-height: 120px; overflow-y: auto; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
        .user-item { padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        .user-item:hover, .user-item.active { background: #cbd5e1; font-weight: 600; }
        #chat-messages { height: 260px; overflow-y: auto; padding: 10px; font-size: 13px; }
        .msg-row { margin-bottom: 6px; word-break: break-word; }
    </style>
</head>
<body>
<div class="container-fluid">
    <div class="row">
        <!-- Sidebar -->
        <div class="col-md-3 col-lg-2 px-0 sidebar d-none d-md-block">
            <div class="brand-logo">
                <i class="fa-solid fa-camera-retro me-2"></i>Camera<span>Hub</span>
            </div>
            <div class="p-3">
                <ul class="nav flex-column">
                    <li class="nav-item">
                        <a class="nav-link {{ request()->is('admin') ? 'active' : '' }}" href="/admin">
                            <i class="fa-solid fa-gauge me-2"></i>Trang tổng quan (SPA)
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link {{ request()->is('admin/orders*') ? 'active' : '' }}" href="{{ route('admin.orders.index') }}">
                            <i class="fa-solid fa-cart-shopping me-2"></i>Quản lý đơn hàng
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link {{ request()->is('admin/reports*') ? 'active' : '' }}" href="{{ route('admin.reports.index') }}">
                            <i class="fa-solid fa-chart-line me-2"></i>Báo cáo & Doanh thu
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link {{ request()->is('admin/users*') ? 'active' : '' }}" href="{{ route('admin.users.index') }}">
                            <i class="fa-solid fa-users me-2"></i>Quản lý người dùng
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/admin?tab=finance">
                            <i class="fa-solid fa-wallet me-2"></i>Thống kê tài chính
                        </a>
                    </li>
                    <li class="nav-item mt-3 pt-3 border-top border-secondary">
                        <a class="nav-link text-warning" href="/">
                            <i class="fa-solid fa-arrow-left me-2"></i>Về cửa hàng
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Main Content -->
        <div class="col-md-9 col-lg-10 ms-auto py-4 px-4">
            @yield('content')
        </div>
    </div>
</div>

<!-- Admin Live Chat Widget (Lab 07) -->
<div id="admin-chat-box">
    <button id="chat-toggle" class="btn btn-dark shadow rounded-pill px-3 py-2">
        <i class="fa-regular fa-comment-dots me-1"></i> 💬 Chat Khách hàng
    </button>

    <div id="chat-popup" class="card shadow-lg">
        <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center">
            <strong><i class="fa-solid fa-headset me-2"></i>Hỗ trợ trực tuyến</strong>
            <button id="chat-close" class="btn btn-sm btn-outline-light py-0 px-2">&times;</button>
        </div>

        <div id="user-list">
            <div class="p-2 text-center text-muted"><small>Đang tải danh sách...</small></div>
        </div>

        <div id="chat-messages">
            <div class="text-center mt-5 text-muted">Chọn một khách hàng để xem tin nhắn</div>
        </div>

        <div class="card-footer bg-white">
            <div class="input-group">
                <input type="text" id="chat-input" class="form-control form-control-sm" placeholder="Nhập câu trả lời...">
                <button id="send-btn" class="btn btn-success btn-sm px-3">Gửi</button>
            </div>
        </div>
    </div>
</div>

<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script>
let currentUserId = null;
const chatPopup = document.getElementById("chat-popup");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");

if (document.getElementById("chat-toggle")) {
    document.getElementById("chat-toggle").onclick = () => {
        chatPopup.style.display = "block";
        loadUsers();
    };

    document.getElementById("chat-close").onclick = () => {
        chatPopup.style.display = "none";
    };

    function loadUsers() {
        fetch("{{ route('admin.chat.users') }}")
            .then(res => res.json())
            .then(users => {
                let html = "";
                users.forEach(user => {
                    let activeClass = (currentUserId == user.id) ? 'active' : '';
                    html += `<div class="user-item ${activeClass}" onclick="selectUser(${user.id}, this)">
                                <strong>${user.name}</strong> ${user.unread_count > 0 ? '<span class="badge bg-danger ms-1">' + user.unread_count + '</span>' : ''}
                            </div>`;
                });
                document.getElementById("user-list").innerHTML = html || '<div class="p-2 text-muted text-center">Chưa có hội thoại</div>';
            })
            .catch(err => console.error("Lỗi tải users:", err));
    }

    window.selectUser = function(userId, element) {
        currentUserId = userId;
        document.querySelectorAll('.user-item').forEach(el => el.classList.remove('active'));
        if (element) element.classList.add('active');
        loadMessages();
    };

    function loadMessages() {
        if (!currentUserId) return;

        fetch(`/admin/chat/messages/${currentUserId}`)
            .then(res => res.json())
            .then(messages => {
                chatMessages.innerHTML = "";
                if (!messages || messages.length === 0) {
                    chatMessages.innerHTML = '<div class="text-center text-muted mt-4">Chưa có tin nhắn</div>';
                    return;
                }
                const currentAdminId = {{ Auth::id() ?? 1 }};
                messages.forEach(msg => {
                    let isMe = msg.sender_id == currentAdminId;
                    let senderName = isMe ? "Bạn" : (msg.sender ? msg.sender.name : "Khách hàng");
                    let color = isMe ? "#2563eb" : "#0f172a";

                    const row = document.createElement('div');
                    row.className = 'msg-row';
                    row.style.color = color;

                    const strong = document.createElement('strong');
                    strong.textContent = senderName + ': ';
                    row.appendChild(strong);

                    const contentSpan = document.createElement('span');
                    contentSpan.textContent = msg.content;
                    row.appendChild(contentSpan);

                    chatMessages.appendChild(row);
                });
                chatMessages.scrollTop = chatMessages.scrollHeight;
            })
            .catch(err => console.error("Lỗi tải tin nhắn:", err));
    }

    function sendMessage() {
        let message = chatInput.value.trim();
        if (!message || !currentUserId) return;

        fetch("{{ route('admin.chat.send') }}", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({
                message: message,
                user_id: currentUserId
            })
        }).then(res => res.json())
            .then(data => {
                chatInput.value = "";
                loadMessages();
            })
            .catch(err => console.error("Lỗi gửi tin:", err));
    }

    document.getElementById("send-btn").onclick = sendMessage;
    chatInput.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };

    setInterval(() => {
        if (chatPopup.style.display === "block") {
            loadMessages();
            loadUsers();
        }
    }, 3000);
}
</script>
@yield('scripts')
</body>
</html>
