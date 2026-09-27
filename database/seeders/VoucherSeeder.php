<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Voucher;
use Carbon\Carbon;

class VoucherSeeder extends Seeder
{
    public function run(): void
    {
        $vouchers = [
            [
                'code' => 'WELCOME50K',
                'name' => 'Ưu đãi chào mừng thành viên mới',
                'description' => 'Giảm ngay 50.000₫ cho đơn hàng từ 500.000₫',
                'discount_type' => 'fixed',
                'discount_value' => 50000,
                'min_order_amount' => 500000,
                'max_discount_amount' => null,
                'usage_limit' => 500,
                'used_count' => 0,
                'expires_at' => Carbon::now()->addMonths(6),
                'status' => 'active',
            ],
            [
                'code' => 'CAMERAHUB100K',
                'name' => 'Tri ân khách hàng mua máy ảnh',
                'description' => 'Giảm ngay 100.000₫ cho đơn hàng từ 2.000.000₫',
                'discount_type' => 'fixed',
                'discount_value' => 100000,
                'min_order_amount' => 2000000,
                'max_discount_amount' => null,
                'usage_limit' => 200,
                'used_count' => 0,
                'expires_at' => Carbon::now()->addMonths(6),
                'status' => 'active',
            ],
            [
                'code' => 'SONYVIP5',
                'name' => 'Voucher đặc quyền máy ảnh Sony',
                'description' => 'Giảm 5% (tối đa 500.000₫) cho đơn hàng từ 5.000.000₫',
                'discount_type' => 'percent',
                'discount_value' => 5,
                'min_order_amount' => 5000000,
                'max_discount_amount' => 500000,
                'usage_limit' => 100,
                'used_count' => 0,
                'expires_at' => Carbon::now()->addMonths(6),
                'status' => 'active',
            ],
            [
                'code' => 'FREESHIP30K',
                'name' => 'Hỗ trợ phí vận chuyển toàn quốc',
                'description' => 'Giảm 30.000₫ phí ship cho đơn từ 300.000₫',
                'discount_type' => 'fixed',
                'discount_value' => 30000,
                'min_order_amount' => 300000,
                'max_discount_amount' => null,
                'usage_limit' => 1000,
                'used_count' => 0,
                'expires_at' => Carbon::now()->addMonths(12),
                'status' => 'active',
            ],
            [
                'code' => 'CANONPRO500K',
                'name' => 'Đặc quyền hệ sinh thái Canon EOS',
                'description' => 'Giảm 500.000₫ cho thân máy hoặc ống kính Canon từ 10.000.000₫',
                'discount_type' => 'fixed',
                'discount_value' => 500000,
                'min_order_amount' => 10000000,
                'max_discount_amount' => null,
                'usage_limit' => 150,
                'used_count' => 0,
                'expires_at' => Carbon::now()->addMonths(6),
                'status' => 'active',
            ],
            [
                'code' => 'FUJIFILM200K',
                'name' => 'Cộng đồng Nhiếp ảnh Fujifilm',
                'description' => 'Giảm 200.000₫ cho máy ảnh và phụ kiện Fujifilm từ 3.000.000₫',
                'discount_type' => 'fixed',
                'discount_value' => 200000,
                'min_order_amount' => 3000000,
                'max_discount_amount' => null,
                'usage_limit' => 200,
                'used_count' => 0,
                'expires_at' => Carbon::now()->addMonths(6),
                'status' => 'active',
            ],
            [
                'code' => 'NIKONZ300K',
                'name' => 'Ưu đãi dòng máy Nikon Z Series',
                'description' => 'Giảm 300.000₫ cho máy ảnh và ống kính Nikon Z từ 8.000.000₫',
                'discount_type' => 'fixed',
                'discount_value' => 300000,
                'min_order_amount' => 8000000,
                'max_discount_amount' => null,
                'usage_limit' => 100,
                'used_count' => 0,
                'expires_at' => Carbon::now()->addMonths(6),
                'status' => 'active',
            ],
            [
                'code' => 'DJIFLY500K',
                'name' => 'Khám phá bầu trời cùng DJI',
                'description' => 'Giảm 500.000₫ cho Flycam Drone & Gimbal chống rung từ 12.000.000₫',
                'discount_type' => 'fixed',
                'discount_value' => 500000,
                'min_order_amount' => 12000000,
                'max_discount_amount' => null,
                'usage_limit' => 100,
                'used_count' => 0,
                'expires_at' => Carbon::now()->addMonths(6),
                'status' => 'active',
            ],
            [
                'code' => 'FLASHVIP10',
                'name' => 'Nâng cấp Phụ kiện Nhiếp ảnh',
                'description' => 'Giảm 10% (tối đa 300.000₫) cho toàn bộ phụ kiện máy ảnh từ 1.000.000₫',
                'discount_type' => 'percent',
                'discount_value' => 10,
                'min_order_amount' => 1000000,
                'max_discount_amount' => 300000,
                'usage_limit' => 300,
                'used_count' => 0,
                'expires_at' => Carbon::now()->addMonths(6),
                'status' => 'active',
            ],
            [
                'code' => 'MEGASALE1M',
                'name' => 'Gói Đầu tư Nhiếp ảnh Chuyên nghiệp',
                'description' => 'Giảm ngay 1.000.000₫ cho đơn hàng combo thiết bị từ 25.000.000₫',
                'discount_type' => 'fixed',
                'discount_value' => 1000000,
                'min_order_amount' => 25000000,
                'max_discount_amount' => null,
                'usage_limit' => 50,
                'used_count' => 0,
                'expires_at' => Carbon::now()->addMonths(6),
                'status' => 'active',
            ],
        ];

        foreach ($vouchers as $v) {
            Voucher::updateOrCreate(['code' => $v['code']], $v);
        }
    }
}
