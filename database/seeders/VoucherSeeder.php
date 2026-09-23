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
                'used_count' => 12,
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
                'used_count' => 35,
                'expires_at' => Carbon::now()->addMonths(3),
                'status' => 'active',
            ],
            [
                'code' => 'SONYVIP5',
                'name' => 'Voucher siêu cấp thiết bị cao cấp',
                'description' => 'Giảm 5% (tối đa 500.000₫) cho đơn hàng từ 5.000.000₫',
                'discount_type' => 'percent',
                'discount_value' => 5,
                'min_order_amount' => 5000000,
                'max_discount_amount' => 500000,
                'usage_limit' => 100,
                'used_count' => 8,
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
                'used_count' => 64,
                'expires_at' => Carbon::now()->addMonths(12),
                'status' => 'active',
            ],
        ];

        foreach ($vouchers as $v) {
            Voucher::updateOrCreate(['code' => $v['code']], $v);
        }
    }
}
