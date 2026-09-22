# 📷 CameraHub - Nền Tảng Thương Mại Điện Tử Máy Ảnh & Thiết Bị Nhiếp Ảnh

> **CameraHub** là đồ án Website thương mại điện tử Full-Stack hiện đại dành cho thiết bị máy ảnh, ống kính và phụ kiện nhiếp ảnh cao cấp. Dự án được xây dựng với kiến trúc **Laravel 11 RESTful API + React 18 SPA (Vite + TypeScript + Tailwind CSS v4 + MySQL)**, tích hợp thanh toán thông minh **VietQR**, bảo mật **Email OTP**, định vị **Bản đồ số OpenStreetMap** và hệ thống quản trị **Admin Dashboard** toàn diện.

---

## 🌟 Tính Năng Nổi Bật

### 🛒 1. Trải Nghiệm Khách Hàng (Storefront E-Commerce)
- **Trang chủ & Khám phá**: Hero Banner sống động, Danh mục nổi bật, Bộ sưu tập sản phẩm Flash Sale, Hàng mới về và Sản phẩm bán chạy.
- **Danh mục & Bộ lọc đa năng (Catalog)**: Lọc sản phẩm theo Danh mục, Thương hiệu (Sony, Canon, Nikon, Fujifilm, Leica, DJI, Sigma, Tamron...), lọc theo khoảng giá, phân trang chuẩn 10 sản phẩm/trang.
- **Chi tiết sản phẩm (Product Detail)**: Album ảnh Gallery đa góc chụp, Thông số kỹ thuật (Specs), Tính năng nổi bật (Features), chọn số lượng, kiểm tra tồn kho realtime và sản phẩm tương tự liên quan.
- **Đánh giá & Bình luận (Reviews)**: Hệ thống chấm sao (1-5★), phản hồi kèm hình ảnh thực tế và gắn nhãn *Đã mua hàng chính hãng*.
- **Giỏ hàng & Quản lý phiên (Cart & Session)**: Tự động lưu giỏ hàng theo Session, hỗ trợ cập nhật số lượng và miễn phí vận chuyển cho đơn hàng từ 1.000.000đ.

---

### 💳 2. Thanh Toán Thông Minh VietQR & Đếm Ngược 15 Phút
- **Bản đồ định vị GPS Leaflet**: Kéo ghim toạ độ trên OpenStreetMap để tự động lấy tên đường, số nhà, phường/xã.
- **4 Đơn vị vận chuyển**: Giao Hàng Nhanh (GHN), GHTK, Viettel Post, GrabExpress Hỏa Tốc 2H.
- **Thanh toán VietQR động**: Tự động sinh mã QR ngân hàng Vietcombank (STK: `88888888`, Chủ TK: *NGUYEN MANH TIEN*) kèm nút sao chép 1 chạm.
- **Đồng hồ đếm ngược 15 phút**: Phiên thanh toán được bảo lưu trong 15 phút để bảo vệ số lượng tồn kho.
- **Tự động duyệt đơn hàng trực tuyến**: Bấm xác nhận chuyển khoản thành công sẽ tự động chuyển đơn sang trạng thái `Đang vận chuyển (shipping)` và trừ tồn kho.

---

### 🔐 3. Bảo Mật & Email Xác Thực OTP
- **Xác thực OTP khi đăng ký**: Hệ thống gửi mã OTP 6 số bảo mật với giao diện 6 ô nhập tự nhảy và bộ đếm 60s.
- **Xác thực OTP khi đổi Email**: Đổi địa chỉ email an toàn trong trang Cá nhân qua mã OTP 6 số.
- **Theo dõi lịch sử đơn hàng**: Tra cứu trạng thái đơn (Chờ xử lý, Đang giao, Đã nhận), xem timeline chi tiết hành trình vận chuyển từng bước và gửi đánh giá sau khi nhận hàng.
- **Sổ địa chỉ đa năng**: Thêm, sửa, xóa nhiều địa chỉ nhận hàng, chọn địa chỉ mặc định.

---

### 🛡️ 4. Bảng Điều Khiển Quản Trị (Admin Dashboard)
- **Tổng quan KPI**: Báo cáo doanh thu thực tế, số lượng đơn hàng, biểu đồ tăng trưởng.
- **Quản lý Đơn hàng (Orders)**: Theo dõi phương thức thanh toán, cập nhật trạng thái đơn (Chờ xử lý, Đang giao, Hoàn tất, Đã hủy) và xem modal chi tiết từng sản phẩm.
- **Quản lý Sản phẩm (Products)**: Thêm/sửa/xóa sản phẩm, upload ảnh đại diện và gallery, quản lý thông số kỹ thuật động và tồn kho.
- **Quản lý Danh mục (Categories) & Đánh giá (Reviews) & Cài đặt cửa hàng (Settings)**.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Phân hệ | Công nghệ |
| :--- | :--- |
| **Backend** | Laravel 11, PHP 8.3+, Eloquent ORM, MySQL (XAMPP) |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Lucide Icons, Leaflet |
| **Thanh toán & Bản đồ** | VietQR API (Vietcombank), OpenStreetMap Geocoding API |

---

## 📁 Cấu Trúc Thư Mục Dự Án (Chuẩn Laravel 11 + React)

```text
Camera/
├── app/
│   ├── Http/Controllers/Api/   # AuthController, ProductController, CategoryController, OrderController, CartController
│   └── Models/                 # User, Address, Product, Category, Brand, Order, Cart, Review...
├── database/
│   ├── migrations/             # Migration tạo bảng users, addresses, products, orders, categories...
│   └── seeders/                # CameraStoreSeeder (26 sản phẩm camera + tài khoản admin/customer)
├── resources/
│   ├── css/                    # app.css (Tailwind CSS v4 & theme tùy biến)
│   ├── js/
│   │   ├── components/         # Header, Footer, StarRating, ProductCard, Modals (Auth, Address, Map, Rating)
│   │   │   └── admin/          # Tabs & Modals quản trị Admin (Orders, Products, Dashboard...)
│   │   ├── context/            # CartContext, AuthContext, ToastContext
│   │   ├── lib/                # API client, formatters, settings
│   │   ├── pages/              # Home, Catalog, Detail, Cart, Checkout, OrderSuccess, Orders, Profile, Admin
│   │   ├── services/           # vietqr.service, shipping.service, review.service
│   │   ├── types.ts            # TypeScript interfaces
│   │   └── App.tsx & main.tsx
│   └── views/                  # app.blade.php (Main React SPA View)
├── routes/
│   ├── api.php                 # 36 RESTful API endpoints (/api/v1/...)
│   └── web.php                 # React SPA fallback route
├── package.json                # Frontend dependencies (React, Vite, Framer Motion, Leaflet)
└── composer.json               # Backend dependencies (Laravel 11 framework)
```

---

## 🔑 Tài Khoản Mẫu Đăng Nhập

| Quyền hạn | Email | Mật khẩu | Chức năng |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@camerahub.vn` | `admin123` | Toàn quyền trang Quản trị `/admin` |
| **Khách hàng** | `tien@gmail.com` | `123456` | Khách hàng mua sắm (Đã có sẵn sổ địa chỉ) |

---

## 🚀 Hướng Dẫn Khởi Chạy Dự Án (Chỉ Cần 1 Terminal)

### Cách 1: Khởi chạy chế độ phát triển (Tự động chạy cả Laravel + Vite Live Reload):
Chỉ cần mở **1 Terminal duy nhất** tại thư mục dự án và gõ:
```bash
npm run dev
```

### Cách 2: Khởi chạy trực tiếp bản Production (Đã đóng gói sẵn):
```bash
php artisan serve
```
- Mở trình duyệt truy cập: **http://127.0.0.1:8000**
- Trang Quản trị: **http://127.0.0.1:8000/admin**

---

## 📝 License & Tác Giả
- **Dự án**: CameraHub E-Commerce Platform (Laravel + React)
- **Tác giả**: Nguyễn Mạnh Tiến
- **Bản quyền**: © 2026 CameraHub Vietnam. All rights reserved.
