<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\EmailService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EmailNotificationFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    protected function createSampleOrder(): Order
    {
        $category = Category::create([
            'name' => 'Ống kính Sony',
            'slug' => 'ong-kinh-sony',
        ]);

        $product = Product::create([
            'name' => 'Sony FE 24-70mm F2.8 GM II',
            'slug' => 'sony-fe-24-70mm-f2-8-gm-ii-' . uniqid(),
            'brand' => 'Sony',
            'category_id' => $category->id,
            'price' => 49990000,
            'stock' => 5,
            'status' => 'active',
        ]);

        $order = Order::create([
            'order_code' => 'ORD-MAIL-TEST-1',
            'customer_name' => 'Nguyen Van A',
            'customer_email' => 'customer.test@example.com',
            'customer_phone' => '0988888888',
            'shipping_address' => '10 Cầu Giấy',
            'city' => 'Hà Nội',
            'payment_method' => 'cod',
            'payment_status' => 'pending',
            'total_amount' => 49990000,
            'order_status' => 'pending',
            'tracking_code' => 'GHN123456789',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'name' => $product->name,
            'price' => $product->price,
            'quantity' => 1,
            'image_url' => '',
        ]);

        return $order->fresh(['items.product']);
    }

    public function test_send_order_confirmation_email(): void
    {
        $order = $this->createSampleOrder();

        $result = EmailService::sendOrderConfirmation($order);

        $this->assertTrue($result);
    }

    public function test_send_order_status_updated_emails_across_stages(): void
    {
        $order = $this->createSampleOrder();

        // 1. Stage: Processing (Chuẩn bị hàng)
        $res1 = EmailService::sendOrderStatusUpdated($order, 'processing');
        $this->assertTrue($res1);

        // 2. Stage: Shipping (Đang giao hàng)
        $res2 = EmailService::sendOrderStatusUpdated($order, 'shipping');
        $this->assertTrue($res2);

        // 3. Stage: Completed (Giao hàng thành công)
        $res3 = EmailService::sendOrderStatusUpdated($order, 'completed');
        $this->assertTrue($res3);

        // 4. Stage: Cancelled (Đã hủy đơn)
        $res4 = EmailService::sendOrderStatusUpdated($order, 'cancelled', 'Khách đổi ý');
        $this->assertTrue($res4);
    }

    public function test_send_welcome_registration_email(): void
    {
        $user = User::create([
            'name' => 'Tran Thi Huong',
            'email' => 'huong.test@example.com',
            'password' => bcrypt('password123'),
            'role' => 'customer',
        ]);

        $result = EmailService::sendWelcomeRegistration($user);

        $this->assertTrue($result);
    }

    public function test_send_login_notification_email(): void
    {
        $user = User::create([
            'name' => 'Le Van Minh',
            'email' => 'minh.test@example.com',
            'password' => bcrypt('password123'),
            'role' => 'customer',
        ]);

        $result = EmailService::sendLoginNotification($user, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

        $this->assertTrue($result);
    }
}
