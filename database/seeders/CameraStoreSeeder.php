<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductSpecification;
use App\Models\ProductFeature;
use App\Models\User;
use App\Models\Address;
use Illuminate\Support\Facades\Hash;

class CameraStoreSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Categories
        $categories = [
            [
                'name' => 'Máy ảnh Mirrorless',
                'slug' => 'may-anh-mirrorless',
                'description' => 'Máy ảnh không gương lật nhỏ gọn, hiệu năng đỉnh cao với cảm biến Full-frame và APS-C tân tiến.',
                'icon' => 'Camera',
                'display_order' => 1,
            ],
            [
                'name' => 'Máy ảnh DSLR',
                'slug' => 'may-anh-dslr',
                'description' => 'Dòng máy ảnh phản xạ ống kính đơn kỹ thuật số truyền thống bền bỉ và pin thời lượng cao.',
                'icon' => 'Camera',
                'display_order' => 2,
            ],
            [
                'name' => 'Ống kính (Lens)',
                'slug' => 'ong-kinh-lens',
                'description' => 'Ống kính góc rộng, tele, portrait khẩu lớn chính hãng cho Sony, Canon, Nikon, Fujifilm.',
                'icon' => 'Disc',
                'display_order' => 3,
            ],
            [
                'name' => 'Flycam & Drone',
                'slug' => 'flycam-drone',
                'description' => 'Thiết bị quay phim trên không chuyên nghiệp từ DJI hỗ trợ 4K 60fps & quay dọc 4K HDR.',
                'icon' => 'Navigation',
                'display_order' => 4,
            ],
            [
                'name' => 'Phụ kiện Camera',
                'slug' => 'phu-kien-camera',
                'description' => 'Chân máy Gimbal, Thẻ nhớ tốc độ cao SanDisk, Túi chống sốc Peak Design, Pin sạc.',
                'icon' => 'Briefcase',
                'display_order' => 5,
            ],
        ];

        $catModels = [];
        foreach ($categories as $cat) {
            $catModels[$cat['slug']] = Category::firstOrCreate(['slug' => $cat['slug']], $cat);
        }

        // 2. Brands
        $brands = [
            ['name' => 'Sony', 'slug' => 'sony', 'description' => 'Thương hiệu máy ảnh mirrorless hàng đầu thế giới với hệ thống lấy nét AF nhận diện AI.'],
            ['name' => 'Canon', 'slug' => 'canon', 'description' => 'Hệ sinh thái máy ảnh EOS R & Ống kính RF cao cấp với màu sắc chân thực.'],
            ['name' => 'Nikon', 'slug' => 'nikon', 'description' => 'Hệ thống Nikon Z-mount sắc nét vượt trội cho nhiếp ảnh gia phong cảnh và thể thao.'],
            ['name' => 'Fujifilm', 'slug' => 'fujifilm', 'description' => 'Máy ảnh phong cách Retro tích hợp bộ giả lập màu phim độc quyền huyền thoại.'],
            ['name' => 'DJI', 'slug' => 'dji', 'description' => 'Dẫn đầu công nghệ Flycam, Drone và Gimbal chống rung chuyên nghiệp.'],
            ['name' => 'Sigma', 'slug' => 'sigma', 'description' => 'Dòng ống kính Sigma Art sắc nét đỉnh cao với khẩu độ siêu lớn f/1.4.'],
            ['name' => 'Tamron', 'slug' => 'tamron', 'description' => 'Ống kính zoom nhỏ gọn, sắc nét vượt trội cho máy ảnh Sony & Nikon.'],
            ['name' => 'GoPro', 'slug' => 'gopro', 'description' => 'Camera hành động chống nước và chống rung HyperSmooth bá chủ.'],
            ['name' => 'Panasonic', 'slug' => 'panasonic', 'description' => 'Dòng máy ảnh quay phim chuyên nghiệp Lumix S & GH Series.'],
            ['name' => 'Leica', 'slug' => 'leica', 'description' => 'Thương hiệu máy ảnh xa xỉ đẳng cấp từ Đức.'],
            ['name' => 'SanDisk', 'slug' => 'sandisk', 'description' => 'Thẻ nhớ tốc độ cao uy tín cho quay video 4K & 8K RAW.'],
            ['name' => 'Peak Design', 'slug' => 'peak-design', 'description' => 'Túi máy ảnh và dây đeo thao tác nhanh cao cấp từ Mỹ.'],
        ];

        $brandModels = [];
        foreach ($brands as $b) {
            $brandModels[$b['slug']] = Brand::firstOrCreate(['slug' => $b['slug']], $b);
        }

        // 3. Products (26 Products total)
        $productsData = [
            // 1
            [
                'name' => 'Sony Alpha A7 Mark IV (Body)',
                'slug' => 'sony-alpha-a7-mark-iv-body',
                'brand_slug' => 'sony',
                'category_slug' => 'may-anh-mirrorless',
                'sku' => 'SONY-A7M4',
                'description' => 'Sony Alpha A7 IV là chiếc máy ảnh Full-frame hybrid hoàn hảo kết hợp khả năng chụp ảnh 33MP sắc nét và quay video 4K 60p 10-bit 4:2:2 đỉnh cao. Hỗ trợ hệ thống lấy nét tự động AI Real-time Eye AF mới nhất.',
                'price' => 54990000,
                'original_price' => 59990000,
                'image_url' => 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000',
                'stock' => 15,
                'rating' => 4.9,
                'review_count' => 128,
                'is_featured' => true,
                'is_new' => true,
                'gallery' => [
                    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000',
                    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Cảm biến' => 'Full-frame Exmor R CMOS 33MP',
                    'Bộ xử lý' => 'BIONZ XR tiên tiến',
                    'Quay video' => '4K 60p 10-bit 4:2:2, S-Cinetone',
                    'Chống rung' => 'SteadyShot 5 trục 5.5 stops',
                    'Lấy nét' => '759 điểm AF, Eye AF nhận diện Người/Động vật/Chim',
                ],
                'features' => [
                    'Cảm biến Full-frame chiếu sáng sau 33.0 Megapixel',
                    'Bộ xử lý BIONZ XR nhanh gấp 8 lần thế hệ trước',
                    'Chế độ xem trực tiếp không chớp nháy (No Blackout)',
                ],
            ],
            // 2
            [
                'name' => 'Canon EOS R6 Mark II (Body)',
                'slug' => 'canon-eos-r6-mark-ii-body',
                'brand_slug' => 'canon',
                'category_slug' => 'may-anh-mirrorless',
                'sku' => 'CANON-R6M2',
                'description' => 'Canon EOS R6 II trang bị cảm biến 24.2MP cùng khả năng chụp liên tiếp tốc độ đỉnh cao 40fps màn trập điện tử. Quay video 4K 60p không bị crop toàn cảm biến với màu sắc Canon Log 3 đỉnh cao.',
                'price' => 58900000,
                'original_price' => 63500000,
                'image_url' => 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
                'stock' => 0,
                'rating' => 4.8,
                'review_count' => 95,
                'is_featured' => true,
                'is_new' => true,
                'gallery' => [
                    'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Cảm biến' => 'Full-frame CMOS 24.2 MP',
                    'Tốc độ chụp' => '40 fps màn trập điện tử',
                    'Quay video' => '4K 60p không crop 6K oversampling',
                    'Chống rung' => 'IBIS kết hợp Lens chống rung tới 8 stops',
                ],
                'features' => [
                    'Lấy nét Dual Pixel CMOS AF II bắt nét theo dõi phương tiện',
                    'Tự động bù trừ quang học Focus Breathing Compensation',
                ],
            ],
            // 3
            [
                'name' => 'Fujifilm X-T5 (Body) - Bạc',
                'slug' => 'fujifilm-x-t5-body-silver',
                'brand_slug' => 'fujifilm',
                'category_slug' => 'may-anh-mirrorless',
                'sku' => 'FUJI-XT5-SILVER',
                'description' => 'Fujifilm X-T5 mang thiết kế quay số cổ điển nguyên bản với cảm biến APS-C X-Trans CMOS 5 HR độ phân giải siêu cao 40.2 MP. Tích hợp 19 chế độ giả lập màu phim độc quyền của Fujifilm.',
                'price' => 43900000,
                'original_price' => 46900000,
                'image_url' => 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=1000',
                'stock' => 8,
                'rating' => 5.0,
                'review_count' => 84,
                'is_featured' => true,
                'is_new' => false,
                'gallery' => [
                    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Cảm biến' => 'APS-C X-Trans CMOS 5 HR 40.2 MP',
                    'Bộ xử lý' => 'X-Processor 5',
                    'Chống rung' => 'IBIS trong thân máy 7.0 stops',
                    'Giả lập phim' => '19 chế độ (Classic Chrome, Nostalgic Neg...)',
                ],
                'features' => [
                    'Độ phân giải 40.2MP cao nhất dòng máy APS-C',
                    'Bánh xe chỉnh ISO, Tốc độ shutter quay cơ học trực quan',
                ],
            ],
            // 4
            [
                'name' => 'Nikon Z6 III (Body)',
                'slug' => 'nikon-z6-iii-body',
                'brand_slug' => 'nikon',
                'category_slug' => 'may-anh-mirrorless',
                'sku' => 'NIKON-Z6M3',
                'description' => 'Nikon Z6 III ứng dụng cảm biến Partially-stacked Full-frame đầu tiên thế giới giúp tốc độ đọc dữ liệu cực nhanh. Quay phim 6K N-RAW và EVF siêu sáng 4000 nits.',
                'price' => 62500000,
                'original_price' => 66000000,
                'image_url' => 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&q=80&w=1000',
                'stock' => 5,
                'rating' => 4.9,
                'review_count' => 42,
                'is_featured' => true,
                'is_new' => true,
                'gallery' => [
                    'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Cảm biến' => 'Partially-stacked Full-frame CMOS 24.5 MP',
                    'Bộ xử lý' => 'EXPEED 7',
                    'Quay video' => '6K 60p N-RAW internal, 4K 120p',
                ],
                'features' => [
                    'Cảm biến bán xếp chồng (Partially stacked) cho tốc độ vượt trội',
                    'Kính ngắm EVF hiển thị màu dải DCI-P3 chân thực',
                ],
            ],
            // 5
            [
                'name' => 'Sony Alpha A7R Mark V (Body)',
                'slug' => 'sony-alpha-a7r-v-body',
                'brand_slug' => 'sony',
                'category_slug' => 'may-anh-mirrorless',
                'sku' => 'SONY-A7R5',
                'description' => 'Quái vật độ phân giải 61.0 Megapixel kết hợp chíp vi xử lý AI AF chuyên biệt. Khả năng quay video 8K 24p và chống rung cảm biến 8 stops vô địch.',
                'price' => 84900000,
                'original_price' => 89900000,
                'image_url' => 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000',
                'stock' => 6,
                'rating' => 5.0,
                'review_count' => 64,
                'is_featured' => true,
                'is_new' => true,
                'gallery' => [
                    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Cảm biến' => 'Full-frame BSI Exmor R 61.0 MP',
                    'Quay video' => '8K 24p, 4K 60p 10-bit 4:2:2',
                    'Chip AI' => 'AI Processing Unit nhận diện hình thể người & động vật',
                ],
                'features' => [
                    'Màn hình 4 trục lật đa góc linh hoạt nhất thế giới',
                    'Chụp hình chụp ghép Pixel Shift 240 Megapixel',
                ],
            ],
            // 6
            [
                'name' => 'Canon EOS R5 Mark II (Body)',
                'slug' => 'canon-eos-r5-mark-ii-body',
                'brand_slug' => 'canon',
                'category_slug' => 'may-anh-mirrorless',
                'sku' => 'CANON-R5M2',
                'description' => 'Siêu phẩm Full-frame Back-illuminated Stacked CMOS 45MP, quay phim 8K 60p RAW nội bộ và tính năng Eye Control AF điều khiển điểm lấy nét bằng mắt nhìn.',
                'price' => 102000000,
                'original_price' => 108000000,
                'image_url' => 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
                'stock' => 4,
                'rating' => 5.0,
                'review_count' => 31,
                'is_featured' => true,
                'is_new' => true,
                'gallery' => [
                    'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Cảm biến' => 'Stacked Full-frame CMOS 45.0 MP',
                    'Tốc độ chụp' => '30 fps màn trập điện tử',
                    'Quay video' => '8K 60p RAW, 4K 120p S-RAW',
                ],
                'features' => [
                    'Công nghệ Eye Control AF điều chỉnh góc nhìn mắt người dùng',
                    'Tính năng Upscaling 179MP bằng Deep Learning ngay trên máy',
                ],
            ],
            // 7
            [
                'name' => 'Fujifilm X100VI (Bạc / Đen)',
                'slug' => 'fujifilm-x100vi-silver',
                'brand_slug' => 'fujifilm',
                'category_slug' => 'may-anh-mirrorless',
                'sku' => 'FUJI-X100VI',
                'description' => 'Chiếc máy ảnh Compact huyền thoại cháy hàng toàn cầu với cảm biến 40.2MP, ống kính cố định 23mm f/2.0 II và chống rung IBIS 6 stops.',
                'price' => 47900000,
                'original_price' => 52000000,
                'image_url' => 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=1000',
                'stock' => 3,
                'rating' => 5.0,
                'review_count' => 150,
                'is_featured' => true,
                'is_new' => true,
                'gallery' => [
                    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Cảm biến' => 'APS-C X-Trans CMOS 5 HR 40.2 MP',
                    'Ống kính' => 'Fujinon 23mm f/2.0 II (tương đương 35mm)',
                    'Giả lập phim' => '20 chế độ giả lập bao gồm Reala Ace',
                ],
                'features' => [
                    'Kính ngắm Hybrid OVF / EVF độc đáo chuyển đổi 1 chạm',
                    'Kính lọc ND 4-stop tích hợp sẵn trong lens',
                ],
            ],
            // 8
            [
                'name' => 'Panasonic Lumix S5 II (Body)',
                'slug' => 'panasonic-lumix-s5-ii-body',
                'brand_slug' => 'panasonic',
                'category_slug' => 'may-anh-mirrorless',
                'sku' => 'PANA-S5M2',
                'description' => 'Máy ảnh Full-frame đầu tiên của Panasonic sở hữu công nghệ lấy nét Phase Hybrid AF cực nhanh và quạt tản nhiệt quay video 4K/6K không giới hạn thời gian.',
                'price' => 42900000,
                'original_price' => 46500000,
                'image_url' => 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&q=80&w=1000',
                'stock' => 7,
                'rating' => 4.8,
                'review_count' => 38,
                'is_featured' => false,
                'is_new' => false,
                'gallery' => [
                    'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Cảm biến' => 'Full-frame CMOS 24.2 MP',
                    'Quay video' => '6K 30p 10-bit, 4K 60p 10-bit V-Log',
                    'Lấy nét' => '779 điểm Phase Detection AF',
                ],
                'features' => [
                    'Tích hợp quạt tản nhiệt giúp quay video liên tục không quá nhiệt',
                    'Công nghệ chống rung Active I.S. vô địch khi đi bộ',
                ],
            ],
            // 9
            [
                'name' => 'Leica Q3 (Body) - Đen',
                'slug' => 'leica-q3-black',
                'brand_slug' => 'leica',
                'category_slug' => 'may-anh-mirrorless',
                'sku' => 'LEICA-Q3',
                'description' => 'Đỉnh cao máy ảnh xa xỉ từ Đức với cảm biến Full-frame 60MP BSI, ống kính đỉnh cao Leica Summilux 28mm f/1.7 ASPH và sạc không dây Qi.',
                'price' => 165000000,
                'original_price' => 175000000,
                'image_url' => 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000',
                'stock' => 2,
                'rating' => 5.0,
                'review_count' => 18,
                'is_featured' => true,
                'is_new' => true,
                'gallery' => [
                    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Cảm biến' => 'Full-frame BSI CMOS 60 MP',
                    'Ống kính' => 'Summilux 28mm f/1.7 ASPH',
                    'Quay video' => '8K 30p 10-bit, C4K 60p',
                ],
                'features' => [
                    'Vỏ máy làm bằng hợp kim Magie gia công thủ công tại Wetzlar, Đức',
                    'Khả năng Zoom kỹ thuật số 35mm, 50mm, 75mm và 90mm',
                ],
            ],
            // 10
            [
                'name' => 'Canon EOS 90D Kit EF-S 18-135mm USM',
                'slug' => 'canon-eos-90d-kit-18-135mm',
                'brand_slug' => 'canon',
                'category_slug' => 'may-anh-dslr',
                'sku' => 'CANON-90D-KIT',
                'description' => 'Chiếc DSLR bán chuyên mạnh mẽ nhất với cảm biến APS-C 32.5 MP, chụp liên tiếp 10fps và kính ngắm quang học 100% tầm nhìn.',
                'price' => 33500000,
                'original_price' => 36500000,
                'image_url' => 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
                'stock' => 9,
                'rating' => 4.7,
                'review_count' => 54,
                'is_featured' => false,
                'is_new' => false,
                'gallery' => [
                    'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Cảm biến' => 'APS-C CMOS 32.5 MP',
                    'Quay video' => '4K 30p không crop, Full HD 120p',
                    'Thời lượng pin' => '1300 tấm ảnh mỗi lần sạc',
                ],
                'features' => [
                    'Lấy nét Dual Pixel CMOS AF 45 điểm Cross-type',
                    'Kháng bụi và nước cho môi trường khắc nghiệt',
                ],
            ],
            // 11
            [
                'name' => 'Nikon D850 (Body) FX Full-Frame',
                'slug' => 'nikon-d850-body-fx',
                'brand_slug' => 'nikon',
                'category_slug' => 'may-anh-dslr',
                'sku' => 'NIKON-D850',
                'description' => 'Huyền thoại DSLR Full-frame 45.7MP tốt nhất lịch sử nhiếp ảnh. ISO 64 nguyên bản cho chất lượng hình ảnh sắc nét tối thượng.',
                'price' => 56000000,
                'original_price' => 61000000,
                'image_url' => 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&q=80&w=1000',
                'stock' => 5,
                'rating' => 5.0,
                'review_count' => 88,
                'is_featured' => false,
                'is_new' => false,
                'gallery' => [
                    'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Cảm biến' => 'FX Full-Frame BSI CMOS 45.7 MP',
                    'Hệ thống AF' => '153 điểm lấy nét từ Nikon D5',
                    'Tốc độ chụp' => '7 fps (9 fps với grip pin MB-D18)',
                ],
                'features' => [
                    'ISO nguyên bản cực thấp ISO 64 tăng chi tiết vùng tối',
                    'Màn hình cảm ứng lật 3.2 inch sắc nét',
                ],
            ],
            // 12
            [
                'name' => 'Ống kính Sigma 24-70mm f/2.8 DG DN Art (Ngàm Sony E)',
                'slug' => 'sigma-24-70mm-f2-8-dg-dn-art-sony-e',
                'brand_slug' => 'sigma',
                'category_slug' => 'ong-kinh-lens',
                'sku' => 'SIGMA-2470-E',
                'description' => 'Ống kính Zoom đa dụng cao cấp dải tiêu cự vàng 24-70mm với khẩu độ cố định f/2.8 sắc nét hoàn hảo từ tâm ra rìa cho máy ảnh Full-frame Sony E.',
                'price' => 24500000,
                'original_price' => 26900000,
                'image_url' => 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
                'stock' => 20,
                'rating' => 4.8,
                'review_count' => 76,
                'is_featured' => false,
                'is_new' => false,
                'gallery' => [
                    'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Tiêu cự' => '24-70mm',
                    'Khẩu độ' => 'f/2.8 - f/22',
                    'Ngàm' => 'Sony E-mount (Full-frame)',
                ],
                'features' => [
                    'Thấu kính FLD & SLD triệt tiêu hiện tượng quang sai',
                    'Lớp phủ Super Multi-Layer Coating chống lóa',
                ],
            ],
            // 13
            [
                'name' => 'Ống kính Canon RF 24-70mm f/2.8L IS USM',
                'slug' => 'canon-rf-24-70mm-f2-8l-is-usm',
                'brand_slug' => 'canon',
                'category_slug' => 'ong-kinh-lens',
                'sku' => 'CANON-RF-2470',
                'description' => 'Ống kính Zoom tiêu chuẩn dòng L cao cấp nhất của Canon cho máy ảnh ngàm RF. Tích hợp chống rung quang học IS 5 stops và mô-tơ lấy nét siêu tốc Nano USM.',
                'price' => 54900000,
                'original_price' => 58500000,
                'image_url' => 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
                'stock' => 11,
                'rating' => 4.9,
                'review_count' => 62,
                'is_featured' => true,
                'is_new' => false,
                'gallery' => [
                    'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Tiêu cự' => '24-70mm',
                    'Khẩu độ' => 'f/2.8 cố định',
                    'Chống rung' => 'IS 5 stops',
                    'Ngàm' => 'Canon RF (Full-frame)',
                ],
                'features' => [
                    'Vòng xoay Control Ring tùy chỉnh gán khẩu độ / ISO',
                    'Lớp phủ Fluorine chống bám vân tay và hạt nước',
                ],
            ],
            // 14
            [
                'name' => 'Ống kính Sony FE 70-200mm f/2.8 GM OSS II',
                'slug' => 'sony-fe-70-200mm-f2-8-gm-oss-ii',
                'brand_slug' => 'sony',
                'category_slug' => 'ong-kinh-lens',
                'sku' => 'SONY-70200-GM2',
                'description' => 'Ống kính Tele Zoom hàng đầu thế giới nhẹ hơn 29% so với thế hệ 1. Sở hữu 4 mô-tơ XD Linear cực mạnh bắt nét chim bay và thể thao.',
                'price' => 64900000,
                'original_price' => 69000000,
                'image_url' => 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
                'stock' => 7,
                'rating' => 5.0,
                'review_count' => 45,
                'is_featured' => true,
                'is_new' => true,
                'gallery' => [
                    'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Tiêu cự' => '70-200mm',
                    'Khẩu độ' => 'f/2.8 cố định',
                    'Trọng lượng' => 'Chỉ 1045g (nhẹ nhất phân khúc)',
                    'Ngàm' => 'Sony FE (Full-frame)',
                ],
                'features' => [
                    '4 mô-tơ XD Linear cho khả năng AF nhanh gấp 4 lần',
                    'Vòng chỉnh khẩu cơ học với công tắc De-click cho quay phim',
                ],
            ],
            // 15
            [
                'name' => 'Ống kính Fujifilm XF 33mm f/1.4 R LM WR',
                'slug' => 'fujifilm-xf-33mm-f1-4-r-lm-wr',
                'brand_slug' => 'fujifilm',
                'category_slug' => 'ong-kinh-lens',
                'sku' => 'FUJI-XF33',
                'description' => 'Ống kính Fix tiêu chuẩn góc nhìn 50mm tương đương chuẩn nhiếp ảnh đời thường. Khẩu độ f/1.4 siêu lớn cho hiệu ứng xóa phông dịu mắt.',
                'price' => 19500000,
                'original_price' => 21500000,
                'image_url' => 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
                'stock' => 14,
                'rating' => 4.9,
                'review_count' => 50,
                'is_featured' => false,
                'is_new' => false,
                'gallery' => [
                    'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Tiêu cự' => '33mm (tương đương 50mm Full-frame)',
                    'Khẩu độ' => 'f/1.4 - f/16',
                    'Ngàm' => 'Fujifilm X-mount',
                ],
                'features' => [
                    'Mô-tơ tuyến tính LM bắt nét êm ái thích hợp quay vlog',
                    'Chống chịu thời tiết WR hoạt động ở -10°C',
                ],
            ],
            // 16
            [
                'name' => 'Ống kính Tamron 28-75mm f/2.8 Di III VXD G2 (Sony E)',
                'slug' => 'tamron-28-75mm-f2-8-g2-sony-e',
                'brand_slug' => 'tamron',
                'category_slug' => 'ong-kinh-lens',
                'sku' => 'TAMRON-2875-G2',
                'description' => 'Ống kính Zoom bán chạy nhất phân khúc với độ sắc nét cải tiến đột phá ở phiên bản G2. Thấu kính nhỏ gọn hoàn hảo cho du lịch.',
                'price' => 21500000,
                'original_price' => 23900000,
                'image_url' => 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
                'stock' => 18,
                'rating' => 4.8,
                'review_count' => 92,
                'is_featured' => true,
                'is_new' => false,
                'gallery' => [
                    'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Tiêu cự' => '28-75mm',
                    'Khẩu độ' => 'f/2.8 cố định',
                    'Mô-tơ AF' => 'VXD tuyến tính siêu êm',
                ],
                'features' => [
                    'Khoảng cách lấy nét tối thiểu chỉ 18cm',
                    'Cổng USB-C kết nối trực tiếp phần mềm Tamron Lens Utility',
                ],
            ],
            // 17
            [
                'name' => 'Flycam DJI Mini 4 Pro (DJI RC 2 Smart Controller)',
                'slug' => 'dji-mini-4-pro-rc2',
                'brand_slug' => 'dji',
                'category_slug' => 'flycam-drone',
                'sku' => 'DJI-MINI4-RC2',
                'description' => 'DJI Mini 4 Pro siêu nhẹ dưới 249g được trang bị hệ thống cảm biến va chạm đa hướng 360 độ, camera 4K 60fps HDR hỗ trợ quay dọc True Vertical Shooting và truyền sóng O4 xa 20km.',
                'price' => 21990000,
                'original_price' => 23500000,
                'image_url' => 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                'stock' => 12,
                'rating' => 4.9,
                'review_count' => 110,
                'is_featured' => true,
                'is_new' => true,
                'gallery' => [
                    'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Trọng lượng' => '< 249 gram',
                    'Cảm biến camera' => '1/1.3-inch CMOS 48 MP',
                    'Quay video' => '4K 60fps HDR, 4K 100fps Slow Motion',
                ],
                'features' => [
                    'Trọng lượng dưới 249g không cần cấp phép bay nhiều quốc gia',
                    'Quay dọc True Vertical Shooting 4K tối ưu cho TikTok/Reels',
                ],
            ],
            // 18
            [
                'name' => 'Flycam DJI Air 3 Fly More Combo (Tay cầm DJI RC 2)',
                'slug' => 'dji-air-3-fly-more-combo-rc2',
                'brand_slug' => 'dji',
                'category_slug' => 'flycam-drone',
                'sku' => 'DJI-AIR3-COMBO',
                'description' => 'Flycam 2 camera chính độc đáo với Camera góc rộng 24mm và Tele 70mm zoom 3x. Khả năng kháng gió tốt và thời lượng bay ấn tượng 46 phút.',
                'price' => 32900000,
                'original_price' => 35500000,
                'image_url' => 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                'stock' => 8,
                'rating' => 4.9,
                'review_count' => 67,
                'is_featured' => true,
                'is_new' => true,
                'gallery' => [
                    'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Camera kép' => '1/1.3-inch CMOS 48MP (Góc rộng 24mm & Tele 70mm)',
                    'Thời gian bay' => 'Tối đa 46 phút mỗi viên pin',
                    'Truyền sóng' => 'DJI O4 20 km 1080p 60fps',
                ],
                'features' => [
                    'Chế độ quay video 4K 100fps hoặc 4K 60fps HDR cả 2 camera',
                    'Hub sạc tích hợp tính năng dồn dung lượng pin thông minh',
                ],
            ],
            // 19
            [
                'name' => 'Flycam DJI Mavic 3 Pro Cine Premium Combo',
                'slug' => 'dji-mavic-3-pro-cine-combo',
                'brand_slug' => 'dji',
                'category_slug' => 'flycam-drone',
                'sku' => 'DJI-MAVIC3-CINE',
                'description' => 'Đỉnh cao flycam điện ảnh với 3 camera tích hợp ống kính Hasselblad 4/3 CMOS. Hỗ trợ ghi hình mã hóa Apple ProRes 422 HQ và ổ cứng SSD 1TB nội bộ.',
                'price' => 112000000,
                'original_price' => 119000000,
                'image_url' => 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                'stock' => 3,
                'rating' => 5.0,
                'review_count' => 24,
                'is_featured' => true,
                'is_new' => true,
                'gallery' => [
                    'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Camera chính' => 'Hasselblad 4/3 CMOS 20MP',
                    'Camera Tele' => 'Medium Tele 70mm 3x & Tele 166mm 7x',
                    'Định dạng' => 'Apple ProRes 422 HQ / 422 / 422 LT',
                ],
                'features' => [
                    'Ổ cứng SSD 1TB tốc độ cao tích hợp sẵn trong drone',
                    'Dải tương phản động 12.8 stops tái tạo màu sắc chuẩn Hasselblad',
                ],
            ],
            // 20
            [
                'name' => 'GoPro Hero 12 Black Special Bundle',
                'slug' => 'gopro-hero-12-black-bundle',
                'brand_slug' => 'gopro',
                'category_slug' => 'phu-kien-camera',
                'sku' => 'GOPRO-HERO12-BD',
                'description' => 'Camera hành động mạnh nhất với khả năng chống rung HyperSmooth 6.0, quay video 5.3K 60fps, màu 10-bit GP-Log và thời lượng pin gấp đôi nhờ pin Enduro.',
                'price' => 11990000,
                'original_price' => 13500000,
                'image_url' => 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                'stock' => 25,
                'rating' => 4.8,
                'review_count' => 140,
                'is_featured' => true,
                'is_new' => true,
                'gallery' => [
                    'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Quay video' => '5.3K 60fps, 4K 120fps, 2.7K 240fps',
                    'Chống nước' => 'Trực tiếp 10m không cần vỏ bảo vệ',
                    'Chống rung' => 'HyperSmooth 6.0 AutoBoost',
                ],
                'features' => [
                    'Kết nối tai nghe Bluetooth AirPods âm thanh không dây',
                    'Khả năng quay video tỷ lệ 8:7 khổ dọc linh hoạt',
                ],
            ],
            // 21
            [
                'name' => 'Camera bỏ túi DJI Osmo Pocket 3 Creator Combo',
                'slug' => 'dji-osmo-pocket-3-creator-combo',
                'brand_slug' => 'dji',
                'category_slug' => 'phu-kien-camera',
                'sku' => 'DJI-POCKET3-COMBO',
                'description' => 'Camera gimbal bỏ túi hot nhất năm với cảm biến 1-inch CMOS 4K 120fps, màn hình cảm ứng xoay 2-inch cực nhạy và micro không dây DJI Mic 2 đi kèm.',
                'price' => 15890000,
                'original_price' => 16900000,
                'image_url' => 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                'stock' => 15,
                'rating' => 5.0,
                'review_count' => 180,
                'is_featured' => true,
                'is_new' => true,
                'gallery' => [
                    'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Cảm biến' => '1-inch CMOS 4K 120fps',
                    'Màn hình' => 'OLED 2.0 inch xoay ngang/dọc',
                    'Chống rung' => 'Gimbal cơ học 3 trục',
                ],
                'features' => [
                    'Lấy nét toàn điểm Fast Full-Pixel Focus',
                    'Đi kèm Micro không dây DJI Mic 2 thu âm lọc gió chuyên nghiệp',
                ],
            ],
            // 22
            [
                'name' => 'Gimbal chống rung DJI RS 4 Pro (Combos)',
                'slug' => 'dji-rs-4-pro-combo',
                'brand_slug' => 'dji',
                'category_slug' => 'phu-kien-camera',
                'sku' => 'DJI-RS4-PRO',
                'description' => 'Gimbal chống rung chuyên nghiệp làm bằng sợi Carbon chịu tải đến 4.5kg. Tích hợp động cơ lấy nét LiDAR lấy nét tự động cho ống kính cơ.',
                'price' => 22990000,
                'original_price' => 24500000,
                'image_url' => 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                'stock' => 8,
                'rating' => 4.9,
                'review_count' => 35,
                'is_featured' => false,
                'is_new' => true,
                'gallery' => [
                    'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Tải trọng' => 'Tối đa 4.5 kg (Chịu được Cinema Camera)',
                    'Chất liệu' => 'Tay cắm bằng sợi Carbon cao cấp',
                    'Khóa trục' => 'Khóa tự động Auto-lock thế hệ 2',
                ],
                'features' => [
                    'Thuật toán chống rung RS Stabilization Algorithm thế hệ 4',
                    'Màn hình cảm ứng OLED hiển thị thông số trực quan',
                ],
            ],
            // 23
            [
                'name' => 'Thẻ nhớ SanDisk Extreme Pro 128GB SDXC UHS-I 200MB/s',
                'slug' => 'sandisk-extreme-pro-128gb-sdxc',
                'brand_slug' => 'sandisk',
                'category_slug' => 'phu-kien-camera',
                'sku' => 'SANDISK-128GB',
                'description' => 'Thẻ nhớ SD tốc độ đọc lên đến 200MB/s và ghi 140MB/s chuyên dụng cho chụp ảnh liên tiếp RAW và quay video 4K UHD mượt mà.',
                'price' => 790000,
                'original_price' => 950000,
                'image_url' => 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                'stock' => 50,
                'rating' => 4.9,
                'review_count' => 310,
                'is_featured' => false,
                'is_new' => false,
                'gallery' => [
                    'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Dung lượng' => '128 GB',
                    'Tốc độ đọc' => 'Tối đa 200 MB/s',
                    'Chuẩn tốc độ' => 'U3, V30, C10, UHS-I',
                ],
                'features' => [
                    'Kháng nước, chống sốc, chống tia X-ray và nhiệt độ khắc nghiệt',
                    'Tặng kèm phần mềm khôi phục dữ liệu RescuePRO Deluxe 2 năm',
                ],
            ],
            // 24
            [
                'name' => 'Thẻ nhớ SanDisk Extreme Pro CFexpress Type B 512GB',
                'slug' => 'sandisk-cfexpress-type-b-512gb',
                'brand_slug' => 'sandisk',
                'category_slug' => 'phu-kien-camera',
                'sku' => 'SANDISK-CFE-512',
                'description' => 'Thẻ nhớ chuẩn CFexpress Type B siêu tốc độ đọc 1700MB/s chuyên dành cho máy ảnh Full-frame cao cấp quay phim 8K RAW & 4K 120p.',
                'price' => 6500000,
                'original_price' => 7200000,
                'image_url' => 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                'stock' => 12,
                'rating' => 5.0,
                'review_count' => 42,
                'is_featured' => false,
                'is_new' => false,
                'gallery' => [
                    'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Dung lượng' => '512 GB',
                    'Tốc độ đọc' => '1700 MB/s',
                    'Tốc độ ghi' => '1400 MB/s',
                ],
                'features' => [
                    'Đạt hiệu năng tối ưu ghi video RAW không bị rớt khung hình (Dropped Frames)',
                ],
            ],
            // 25
            [
                'name' => 'Túi máy ảnh Peak Design Everyday Backpack 20L V2',
                'slug' => 'peak-design-everyday-backpack-20l-v2',
                'brand_slug' => 'peak-design',
                'category_slug' => 'phu-kien-camera',
                'sku' => 'PEAK-BP-20L',
                'description' => 'Balo máy ảnh cao cấp thông minh với vách ngăn FlexFold linh hoạt, khóa MagLatch thao tác mở cực nhanh và vải nylon 400D chống nước 100%.',
                'price' => 7490000,
                'original_price' => 8200000,
                'image_url' => 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                'stock' => 10,
                'rating' => 4.9,
                'review_count' => 78,
                'is_featured' => true,
                'is_new' => false,
                'gallery' => [
                    'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Dung lượng' => '20 Lít (Sức chứa 2 Body + 4 Lens + Laptop 15")',
                    'Chất liệu' => 'Vải 400D đôi tái chế chống thấm nước',
                    'Màu sắc' => 'Xám Charcoal / Đen / Khaki',
                ],
                'features' => [
                    'Vách ngăn FlexFold tùy biến theo kích thước từng ống kính',
                    'Được bảo hành trọn đời từ Peak Design USA',
                ],
            ],
            // 26
            [
                'name' => 'Dây đeo thao tác nhanh Peak Design Slide Camera Strap V4',
                'slug' => 'peak-design-slide-strap-v4',
                'brand_slug' => 'peak-design',
                'category_slug' => 'phu-kien-camera',
                'sku' => 'PEAK-SLIDE-V4',
                'description' => 'Dây đeo máy ảnh đeo chéo vai chuyên nghiệp với khóa Anchor Link độc quyền chịu lực đến 90kg. Tháo lắp thao tác 1 giây tiện lợi.',
                'price' => 1890000,
                'original_price' => 2100000,
                'image_url' => 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                'stock' => 30,
                'rating' => 5.0,
                'review_count' => 165,
                'is_featured' => false,
                'is_new' => false,
                'gallery' => [
                    'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
                ],
                'specs' => [
                    'Tải trọng' => '90 kg (Sợi Dyneema siêu bền)',
                    'Độ rộng dây' => '45 mm êm ái cho vai',
                ],
                'features' => [
                    'Anchor Link chốt cài an toàn cảnh báo độ mòn dây',
                    'Hai mặt đệm 1 mặt trơn lướt và 1 mặt cao su chống trượt',
                ],
            ],
        ];

        foreach ($productsData as $pData) {
            $category = $catModels[$pData['category_slug']];
            $brand = $brandModels[$pData['brand_slug']];

            $product = Product::firstOrCreate(
                ['slug' => $pData['slug']],
                [
                    'name' => $pData['name'],
                    'brand' => $brand->name,
                    'brand_id' => $brand->id,
                    'category_id' => $category->id,
                    'sku' => $pData['sku'],
                    'description' => $pData['description'],
                    'price' => $pData['price'],
                    'original_price' => $pData['original_price'],
                    'image_url' => $pData['image_url'],
                    'stock' => $pData['stock'],
                    'rating' => $pData['rating'],
                    'review_count' => $pData['review_count'],
                    'is_featured' => $pData['is_featured'],
                    'is_new' => $pData['is_new'],
                    'status' => 'active',
                ]
            );

            // Add Product Images if not existing
            if ($product->images()->count() === 0) {
                foreach ($pData['gallery'] as $idx => $gUrl) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'image_url' => $gUrl,
                        'is_primary' => $idx === 0,
                        'display_order' => $idx + 1,
                    ]);
                }
            }

            // Add Specs if not existing
            if ($product->specifications()->count() === 0) {
                foreach ($pData['specs'] as $key => $val) {
                    ProductSpecification::create([
                        'product_id' => $product->id,
                        'spec_key' => $key,
                        'spec_value' => $val,
                    ]);
                }
            }

            // Add Features if not existing
            if ($product->features()->count() === 0) {
                foreach ($pData['features'] as $idx => $featText) {
                    ProductFeature::create([
                        'product_id' => $product->id,
                        'feature_text' => $featText,
                        'display_order' => $idx + 1,
                    ]);
                }
            }
        }

        // 4. Default Users & Addresses
        $admin = User::firstOrCreate(
            ['email' => 'admin@camerahub.vn'],
            [
                'name' => 'Quản Trị Viên CameraHub',
                'password' => Hash::make('admin123'),
                'phone' => '0988888888',
                'role' => 'admin',
            ]
        );

        $customer = User::firstOrCreate(
            ['email' => 'tien@gmail.com'],
            [
                'name' => 'Nguyễn Mạnh Tiến',
                'password' => Hash::make('123456'),
                'phone' => '0987654321',
                'role' => 'customer',
            ]
        );

        $demoCustomer = User::firstOrCreate(
            ['email' => 'customer@demopick.vn'],
            [
                'name' => 'Nguyễn Mạnh Tiến (Demo)',
                'password' => Hash::make('123456'),
                'phone' => '0988888888',
                'role' => 'customer',
            ]
        );

        if ($demoCustomer->addresses()->count() === 0) {
            Address::create([
                'user_id' => $demoCustomer->id,
                'label' => 'Nhà riêng',
                'recipient_name' => 'Nguyễn Mạnh Tiến',
                'phone' => '0988888888',
                'address' => 'Số 10 Đường Cầu Giấy, Phường Dịch Vọng',
                'city' => 'Hà Nội',
                'is_default' => true,
            ]);
        }

        if ($customer->addresses()->count() === 0) {
            Address::create([
                'user_id' => $customer->id,
                'label' => 'Nhà riêng',
                'recipient_name' => 'Nguyễn Mạnh Tiến',
                'phone' => '0987654321',
                'address' => 'Số 10 Đường Cầu Giấy, Phường Dịch Vọng',
                'city' => 'Hà Nội',
                'is_default' => true,
            ]);

            Address::create([
                'user_id' => $customer->id,
                'label' => 'Studio / Showroom',
                'recipient_name' => 'Nguyễn Mạnh Tiến (Studio)',
                'phone' => '0912345678',
                'address' => 'Số 25 Phố Lý Thường Kiệt, Hàng Bài',
                'city' => 'Hà Nội',
                'is_default' => false,
            ]);
        }
    }
}
