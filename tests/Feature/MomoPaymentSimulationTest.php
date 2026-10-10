<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PaymentTransaction;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MomoPaymentSimulationTest extends TestCase
{
    use RefreshDatabase;

    protected function createSampleOrder(): Order
    {
        $category = Category::create([
            'name' => 'Máy ảnh DSLR',
            'slug' => 'may-anh-dslr',
        ]);

        $product = Product::create([
            'name' => 'Canon EOS R6 Mark II',
            'slug' => 'canon-eos-r6-mark-ii-' . uniqid(),
            'brand' => 'Canon',
            'category_id' => $category->id,
            'price' => 45000000,
            'stock' => 10,
            'status' => 'active',
        ]);

        $order = Order::create([
            'order_code' => 'ORD-MOMO-TEST-' . time(),
            'customer_name' => 'Tran Thi B',
            'customer_email' => 'tranthib@example.com',
            'customer_phone' => '0912345678',
            'shipping_address' => '456 Le Loi, Quan 1',
            'city' => 'TP. Ho Chi Minh',
            'payment_method' => 'momo',
            'payment_status' => 'pending',
            'total_amount' => 45000000,
            'order_status' => 'pending',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'name' => $product->name,
            'price' => $product->price,
            'quantity' => 1,
            'image_url' => '',
        ]);

        return $order;
    }

    public function test_simulate_momo_payment_updates_order_status_and_records_transaction(): void
    {
        $order = $this->createSampleOrder();

        $payload = [
            'order_id' => $order->id,
            'payment_type' => 'atm',
            'bank_code' => 'NCB',
            'card_number' => '9704 0000 0000 0018',
            'card_holder' => 'NGUYEN VAN A',
        ];

        $response = $this->postJson('/api/v1/payment/momo/simulate', $payload);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);

        // Kiểm tra trạng thái đơn hàng được cập nhật
        $freshOrder = $order->fresh();
        $this->assertEquals('paid', $freshOrder->payment_status);
        $this->assertEquals('shipping', $freshOrder->order_status);
        $this->assertEquals('momo', $freshOrder->payment_method);

        // Kiểm tra PaymentTransaction được ghi nhận
        $transaction = PaymentTransaction::where('order_id', $order->id)->first();
        $this->assertNotNull($transaction);
        $this->assertEquals('momo', $transaction->gateway);
        $this->assertEquals('paid', $transaction->status);
        $this->assertEquals(45000000, (float) $transaction->amount);
        $this->assertStringContainsString('Napas', $transaction->message);
    }

    public function test_cannot_simulate_payment_for_cancelled_order(): void
    {
        $order = $this->createSampleOrder();
        $order->order_status = 'cancelled';
        $order->save();

        $response = $this->postJson('/api/v1/payment/momo/simulate', [
            'order_id' => $order->id,
            'payment_type' => 'qr',
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'success' => false,
            'message' => 'Không thể thanh toán cho đơn hàng đã bị hủy.',
        ]);
    }
}
