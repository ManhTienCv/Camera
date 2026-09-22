<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'CameraHub')</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        #chat-box { position: fixed; bottom: 20px; right: 20px; z-index: 1050; }
        #chat-popup { width: 340px; height: 460px; display: none; position: fixed; bottom: 80px; right: 20px; z-index: 1051; }
        #chat-messages { height: 330px; overflow-y: auto; padding: 12px; font-size: 13px; }
        .message-row { margin-bottom: 8px; padding: 6px 10px; border-radius: 8px; max-width: 85%; }
        .user-msg { background-color: #e0f2fe; color: #0369a1; margin-left: auto; text-align: right; }
        .admin-msg { background-color: #f1f5f9; color: #334155; margin-right: auto; text-align: left; }
    </style>
</head>
<body class="bg-light">
    @yield('content')

    <!-- USER Live Chat Popup (Lab 07) -->
    @auth
    <div id="chat-box">
        <button id="chat-toggle" class="btn btn-primary rounded-circle shadow p-3">💬 Chat</button>

        <div id="chat-popup" class="card shadow-lg" style="display:none; border-radius: 10px;">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <span><i class="fa-solid fa-headset me-2"></i>Hỗ trợ khách hàng</span>
                <button id="chat-close" class="btn btn-sm btn-light py-0 px-2">&times;</button>
            </div>

            <div id="chat-messages" class="card-body">
                <small class="text-muted">Đang tải lịch sử...</small>
            </div>

            <div class="card-footer bg-white">
                <div class="input-group">
                    <input type="text" id="chat-input" class="form-control" placeholder="Nhập tin nhắn..." autocomplete="off">
                    <button id="send-btn" class="btn btn-success">Gửi</button>
                </div>
            </div>
        </div>
    </div>
    @endauth

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
    document.addEventListener("DOMContentLoaded", function () {
        const toggleBtn = document.getElementById("chat-toggle");
        const chatPopup = document.getElementById("chat-popup");
        const closeBtn = document.getElementById("chat-close");
        const sendBtn = document.getElementById("send-btn");
        const input = document.getElementById("chat-input");
        const chatBox = document.getElementById("chat-messages");

        if (!toggleBtn) return; // Nếu khách chưa đăng nhập thì không chạy script chat

        // --- MỞ / ĐÓNG CHAT ---
        toggleBtn.onclick = () => {
            chatPopup.style.display = "block";
            toggleBtn.style.display = "none";
            loadMessages();
        };

        closeBtn.onclick = () => {
            chatPopup.style.display = "none";
            toggleBtn.style.display = "block";
        };

        // --- LOAD TIN NHẮN ---
        function loadMessages() {
            fetch("{{ route('user.chat.messages') }}")
                .then(res => res.json()).then(messages => {
                    let html = "";
                    if (!messages || messages.length === 0) {
                        html = "<div class='text-center text-muted mt-5'><small>Bắt đầu cuộc trò chuyện với Admin</small></div>";
                    } else {
                        messages.forEach(msg => {
                            const isMe = msg.sender_id == "{{ Auth::id() }}";
                            html += `
                                <div class="message-row ${isMe ? 'user-msg' : 'admin-msg'}">
                                    <strong>${isMe ? 'Bạn' : 'Admin'}:</strong> ${msg.content}
                                </div>
                            `;
                        });
                    }
                    chatBox.innerHTML = html;
                    chatBox.scrollTop = chatBox.scrollHeight;
                })
                .catch(err => console.error("Lỗi tải tin nhắn:", err));
        }

        // --- GỬI TIN NHẮN ---
        function sendMessage() {
            let message = input.value.trim();
            if (message === "") return;

            input.disabled = true;
            sendBtn.disabled = true;

            fetch("{{ route('user.chat.send') }}", {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ message: message })
            })
                .then(res => res.json())
                .then(data => {
                    input.value = "";
                    input.disabled = false;
                    sendBtn.disabled = false;
                    input.focus();
                    loadMessages();
                })
                .catch(err => {
                    console.error("Lỗi gửi tin:", err);
                    input.disabled = false;
                    sendBtn.disabled = false;
                });
        }

        sendBtn.onclick = sendMessage;
        input.addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                sendMessage();
            }
        });

        // --- AUTO REFRESH (3 giây/lần) ---
        setInterval(() => {
            if (chatPopup.style.display === "block") {
                loadMessages();
            }
        }, 3000);
    });
    </script>
</body>
</html>
