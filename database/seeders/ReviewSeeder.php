<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $products = Product::take(5)->get();
        if ($products->isEmpty()) {
            return;
        }

        $users = User::where('role', 'customer')->take(5)->get();
        $user1 = $users->first();
        $user2 = $users->skip(1)->first();

        $sampleReviews = [
            [
                'product_index' => 0,
                'customer_name' => 'Trần Văn Mạnh (Photographer)',
                'rating' => 5,
                'variant' => 'Body Only • Chính Hãng Sony VN',
                'comment' => 'Máy chụp nét đứt tay! Cảm biến fullframe thế hệ mới tái tạo màu da người rất trong và tự nhiên. Hệ thống lấy nét mắt thời gian thực bắt dính chủ thể dù đang di chuyển nhanh. Shop đóng gói bọc chống sốc 4 lớp rất cẩn thận!',
                'images' => [
                    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=800',
                ],
                'is_verified_purchase' => true,
                'helpful_count' => 14,
                'status' => 'approved',
                'admin_reply' => 'CameraHub chân thành cảm ơn anh Mạnh! Chúc anh có thêm nhiều shot ảnh tuyệt tác cùng Sony A7 IV ạ.',
                'replied_at' => now()->subDays(2),
            ],
            [
                'product_index' => 0,
                'customer_name' => 'Hoàng Quốc Bảo',
                'rating' => 5,
                'variant' => 'Kit 24-70mm GM II',
                'comment' => 'Đã thử nghiệm quay video 4K 60fps 10-bit 4:2:2 cho dự án dịch vụ cưới cuối tuần qua, màu S-Cinetone lên rất no và dễ hậu kỳ. Khử noise ISO 6400 vẫn sạch sẽ. Đáng tiền từng xu!',
                'images' => [
                    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800',
                ],
                'is_verified_purchase' => true,
                'helpful_count' => 8,
                'status' => 'approved',
                'admin_reply' => null,
                'replied_at' => null,
            ],
            [
                'product_index' => 1,
                'customer_name' => 'Lê Minh Tuấn',
                'rating' => 4,
                'variant' => 'Bản tiêu chuẩn',
                'comment' => 'Thiết bị hoạt động mượt mà, cảm ứng và giao diện menu thế hệ mới trực quan hơn nhiều. Giao hàng hỏa tốc nhận trong 24h. Chỉ tiếc là hộp không tặng kèm sạc ngoài kép mà phải mua thêm.',
                'images' => [],
                'is_verified_purchase' => true,
                'helpful_count' => 5,
                'status' => 'approved',
                'admin_reply' => 'Dạ CameraHub cảm ơn góp ý của anh Tuấn, shop có sẵn combo dock sạc đôi chính hãng trợ giá 20% khi mua kèm ạ!',
                'replied_at' => now()->subDay(),
            ],
            [
                'product_index' => 2,
                'customer_name' => 'Nguyễn Phương Thảo',
                'rating' => 5,
                'variant' => 'Màu Bạc Vintage • Kèm lens 35mm',
                'comment' => 'Màu ảnh film Fujifilm chụp phát ăn ngay không cần chỉnh màu gì thêm! Đi du lịch cầm chiếc này chụp sống ảo bạn bè ai cũng khen nức nở.',
                'images' => [
                    'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&q=80&w=800',
                ],
                'is_verified_purchase' => true,
                'helpful_count' => 19,
                'status' => 'approved',
                'admin_reply' => null,
                'replied_at' => null,
            ],
            [
                'product_index' => 1,
                'customer_name' => 'Tài khoản spam quảng cáo',
                'rating' => 1,
                'variant' => 'Không xác định',
                'comment' => 'Bán sim số đẹp giá rẻ truy cập ngay website xyz...',
                'images' => [],
                'is_verified_purchase' => false,
                'helpful_count' => 0,
                'status' => 'hidden', // Bi ẩn khỏi trang storefront
                'admin_reply' => null,
                'replied_at' => null,
            ],
        ];

        foreach ($sampleReviews as $data) {
            $p = $products->get($data['product_index']) ?? $products->first();
            Review::create([
                'product_id' => $p->id,
                'user_id' => $user1 ? $user1->id : null,
                'customer_name' => $data['customer_name'],
                'rating' => $data['rating'],
                'variant' => $data['variant'],
                'comment' => $data['comment'],
                'images' => $data['images'],
                'is_verified_purchase' => $data['is_verified_purchase'],
                'helpful_count' => $data['helpful_count'],
                'admin_reply' => $data['admin_reply'],
                'replied_at' => $data['replied_at'],
                'status' => $data['status'],
            ]);

            // Sync rating and review_count on product
            $avg = Review::where('product_id', $p->id)->where('status', 'approved')->avg('rating') ?: 5.0;
            $count = Review::where('product_id', $p->id)->where('status', 'approved')->count();
            $p->update([
                'rating' => round($avg, 1),
                'review_count' => $count,
            ]);
        }
    }
}
