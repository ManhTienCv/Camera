<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderCheckoutAtomicityTest extends TestCase
{
    use RefreshDatabase;

    protected function createSampleProduct(int $stock = 10): Product
    {
        $category = Category::create([
            'name' => 'Máy Ảnh Mirrorless',
            'slug' => 'may-anh-mirrorless',
        ]);

        return Product::create([
            'name' => 'Sony Alpha A7 IV',
            'slug' => 'sony-alpha-a7-iv-' . uniqid(),
            'brand' => 'Sony',
            'category_id' => $category->id,
            'price' => 52000000,
            'stock' => $stock,
            'status' => 'active',
        ]);
    }

    public function test_successful_checkout_atomically_decrements_stock_and_records_inventory_movement(): void
    {
        $product = $this->createSampleProduct(5);

        $payload = [
            'customer_name' => 'Nguyen Van A',
            'customer_email' => 'nguyenvana@example.com',
            'customer_phone' => '0987654321',
            'shipping_address' => '123 Nguyen Hue, Quan 1',
            'city' => 'TP. Ho Chi Minh',
            'payment_method' => 'cod',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/orders', $payload);

        $response->assertStatus(201);

        // 1. Kiểm tra tồn kho bị trừ chính xác
        $this->assertEquals(3, $product->fresh()->stock);

        // 2. Kiểm tra ghi sổ cái biến động kho bất biến
        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $product->id,
            'type' => 'purchase',
            'qty_before' => 5,
            'qty_change' => -2,
            'qty_after' => 3,
        ]);
    }

    public function test_checkout_fails_atomically_when_requested_quantity_exceeds_stock(): void
    {
        $product = $this->createSampleProduct(1);

        $payload = [
            'customer_name' => 'Tran Thi B',
            'customer_email' => 'tranthib@example.com',
            'customer_phone' => '0901234567',
            'shipping_address' => '456 Le Loi, Quan 1',
            'city' => 'TP. Ho Chi Minh',
            'payment_method' => 'cod',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 5, // Vượt quá tồn kho chỉ có 1
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/orders', $payload);

        $response->assertStatus(400);

        // Tồn kho phải giữ nguyên, tuyệt đối không bị bán âm
        $this->assertEquals(1, $product->fresh()->stock);

        // Không sinh đơn hàng nào
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_order_cancellation_restores_inventory_and_records_cancel_restock(): void
    {
        $product = $this->createSampleProduct(10);
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken();

        // Giả lập đã trừ kho 2 máy cho đơn hàng
        $product->decrement('stock', 2);
        $this->assertEquals(8, $product->fresh()->stock);

        $order = Order::create([
            'order_code' => 'CAM-TESTRESTOCK',
            'customer_name' => 'Le Van C',
            'customer_email' => 'levanc@example.com',
            'customer_phone' => '0912345678',
            'shipping_address' => '789 Dien Bien Phu',
            'city' => 'TP. Ho Chi Minh',
            'payment_method' => 'cod',
            'total_amount' => 104000000,
            'order_status' => 'pending',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'name' => $product->name,
            'price' => $product->price,
            'quantity' => 2,
        ]);

        // Admin thực hiện hủy đơn hàng
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/v1/admin/orders/{$order->id}", [
                'status' => 'cancelled',
                'reason' => 'Khách hàng đổi ý mua máy khác',
            ]);

        $response->assertStatus(200);

        // Kiểm tra tồn kho được hoàn trả lại thành 10
        $this->assertEquals(10, $product->fresh()->stock);

        // Kiểm tra bút toán hoàn kho trong sổ cái
        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $product->id,
            'type' => 'cancel_restock',
            'qty_before' => 8,
            'qty_change' => 2,
            'qty_after' => 10,
            'order_id' => $order->id,
        ]);
    }
}
