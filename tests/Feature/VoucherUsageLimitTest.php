<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VoucherUsageLimitTest extends TestCase
{
    use RefreshDatabase;

    protected function createProduct(float $price = 1000000, int $stock = 10): Product
    {
        $category = Category::create([
            'name' => 'Ống Kính',
            'slug' => 'ong-kinh',
        ]);

        return Product::create([
            'name' => 'Lens Sony 50mm f/1.8',
            'slug' => 'lens-sony-50mm-' . uniqid(),
            'brand' => 'Sony',
            'category_id' => $category->id,
            'price' => $price,
            'stock' => $stock,
            'status' => 'active',
        ]);
    }

    public function test_valid_voucher_applies_discount_and_increments_used_count(): void
    {
        $product = $this->createProduct(1000000, 5);

        $voucher = Voucher::create([
            'code' => 'DISCOUNT50K',
            'name' => 'Giảm 50K',
            'discount_type' => 'fixed',
            'discount_value' => 50000,
            'min_order_amount' => 500000,
            'usage_limit' => 5,
            'used_count' => 0,
            'status' => 'active',
        ]);

        $payload = [
            'customer_name' => 'Pham Van D',
            'customer_email' => 'phamvand@example.com',
            'customer_phone' => '0933445566',
            'shipping_address' => '321 Hai Ba Trung, Quan 3',
            'city' => 'TP. Ho Chi Minh',
            'payment_method' => 'cod',
            'voucher_code' => 'DISCOUNT50K',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/orders', $payload);

        $response->assertStatus(201);

        $data = $response->json();
        $this->assertEquals(50000, $data['discount_amount']);
        $this->assertEquals(950000, $data['total_amount']);

        // used_count phải tự động tăng lên 1
        $this->assertEquals(1, $voucher->fresh()->used_count);
    }

    public function test_exhausted_voucher_is_rejected_and_aborts_checkout(): void
    {
        $product = $this->createProduct(1000000, 5);

        $voucher = Voucher::create([
            'code' => 'SOLDOUT100K',
            'name' => 'Mã Giới Hạn',
            'discount_type' => 'fixed',
            'discount_value' => 100000,
            'min_order_amount' => 500000,
            'usage_limit' => 1,
            'used_count' => 1, // Đã hết lượt
            'status' => 'active',
        ]);

        $payload = [
            'customer_name' => 'Vo Van E',
            'customer_email' => 'vovane@example.com',
            'customer_phone' => '0977889900',
            'shipping_address' => '555 Vo Van Tan, Quan 3',
            'city' => 'TP. Ho Chi Minh',
            'payment_method' => 'cod',
            'voucher_code' => 'SOLDOUT100K',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/orders', $payload);

        $response->assertStatus(400);

        // used_count không bị thay đổi
        $this->assertEquals(1, $voucher->fresh()->used_count);

        // Không tạo đơn hàng rác
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_voucher_rejected_if_order_amount_is_below_minimum(): void
    {
        $product = $this->createProduct(400000, 5); // Giá 400.000đ

        $voucher = Voucher::create([
            'code' => 'VIPPRO',
            'name' => 'Đơn từ 2 triệu',
            'discount_type' => 'fixed',
            'discount_value' => 200000,
            'min_order_amount' => 2000000, // Yêu cầu tối thiểu 2 triệu
            'usage_limit' => 10,
            'used_count' => 0,
            'status' => 'active',
        ]);

        $payload = [
            'customer_name' => 'Hoang Van F',
            'customer_email' => 'hoangvanf@example.com',
            'customer_phone' => '0911223344',
            'shipping_address' => '777 Cach Mang Thang 8',
            'city' => 'TP. Ho Chi Minh',
            'payment_method' => 'cod',
            'voucher_code' => 'VIPPRO',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/orders', $payload);

        $response->assertStatus(400);
        $this->assertDatabaseCount('orders', 0);
    }
}
