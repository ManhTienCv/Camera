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

use App\Models\Review;

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

    /**
     * PRIORITY 1 TESTS (Admin & Customer Critical Alerts)
     */
    public function test_send_admin_new_order_alert_email(): void
    {
        $order = $this->createSampleOrder();

        $result = EmailService::sendAdminNewOrderAlert($order);

        $this->assertTrue($result);
    }

    public function test_send_admin_low_stock_alert_email(): void
    {
        $category = Category::create([
            'name' => 'Máy ảnh Canon',
            'slug' => 'may-anh-canon-' . uniqid(),
        ]);

        $product = Product::create([
            'name' => 'Canon EOS R6 Mark II',
            'slug' => 'canon-eos-r6-mark-ii-' . uniqid(),
            'brand' => 'Canon',
            'category_id' => $category->id,
            'price' => 58900000,
            'stock' => 1,
            'status' => 'active',
        ]);

        // Thử cảnh báo sắp hết (1 chiếc)
        $resLow = EmailService::sendAdminLowStockAlert($product, 1);
        $this->assertTrue($resLow);

        // Thử cảnh báo hết hàng hoàn toàn (0 chiếc)
        $resOut = EmailService::sendAdminLowStockAlert($product, 0);
        $this->assertTrue($resOut);
    }

    public function test_send_admin_refund_request_alert_email(): void
    {
        $order = $this->createSampleOrder();
        $order->bank_name = 'MB Bank';
        $order->bank_account_number = '0988888888';
        $order->bank_account_holder = 'NGUYEN VAN A';
        $order->save();

        $result = EmailService::sendAdminRefundRequestAlert($order, 'Khách muốn đổi sang dòng máy cao cấp hơn');

        $this->assertTrue($result);
    }

    public function test_send_refund_confirmation_email(): void
    {
        $order = $this->createSampleOrder();
        $order->bank_name = 'Techcombank';
        $order->bank_account_number = '19036789123456';
        $order->bank_account_holder = 'NGUYEN VAN A';
        $order->save();

        $result = EmailService::sendRefundConfirmation($order, 'FT261010887766');

        $this->assertTrue($result);
    }

    /**
     * PRIORITY 2 TESTS (Security & Customer Engagement)
     */
    public function test_send_password_changed_notification_email(): void
    {
        $user = User::create([
            'name' => 'Pham Quoc Bao',
            'email' => 'bao.test@example.com',
            'password' => bcrypt('oldPassword123'),
            'role' => 'customer',
        ]);

        $result = EmailService::sendPasswordChangedNotification($user, '118.69.10.20', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');

        $this->assertTrue($result);
    }

    public function test_send_review_reply_notification_email(): void
    {
        $user = User::create([
            'name' => 'Hoang Thao',
            'email' => 'thao.test@example.com',
            'password' => bcrypt('password123'),
            'role' => 'customer',
        ]);

        $order = $this->createSampleOrder();

        $product = Product::first();

        $review = Review::create([
            'product_id' => $product->id,
            'user_id' => $user->id,
            'order_id' => $order->id,
            'customer_name' => $user->name,
            'rating' => 5,
            'comment' => 'Máy ảnh chụp siêu nét, lấy nét mắt cực nhanh!',
            'status' => 'approved',
        ]);

        $result = EmailService::sendReviewReplyNotification($review->fresh(['user', 'product', 'order']), 'Dạ cảm ơn anh/chị Thảo đã tin tưởng CameraHub ạ!');

        $this->assertTrue($result);
    }
}
