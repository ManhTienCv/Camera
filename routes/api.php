<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\AuthController;

Route::prefix('v1')->group(function () {
    // 1. Authentication & Profile
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/send-register-otp', [AuthController::class, 'sendRegisterOtp']);
    Route::post('/auth/register-with-otp', [AuthController::class, 'registerWithOtp']);
    Route::post('/auth/forgot-password/send-otp', [AuthController::class, 'sendForgotPasswordOtp']);
    Route::post('/auth/forgot-password/reset', [AuthController::class, 'resetPasswordWithOtp']);
    Route::post('/auth/send-change-email-otp', [AuthController::class, 'sendChangeEmailOtp']);
    Route::post('/auth/verify-change-email-otp', [AuthController::class, 'verifyChangeEmailOtp']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [AuthController::class, 'changePassword']);
    Route::get('/auth/addresses', [AuthController::class, 'getAddresses']);
    Route::post('/auth/addresses', [AuthController::class, 'createAddress']);
    Route::put('/auth/addresses/{id}', [AuthController::class, 'updateAddress']);
    Route::delete('/auth/addresses/{id}', [AuthController::class, 'deleteAddress']);
    Route::get('/auth/orders', [AuthController::class, 'myOrders']);
    Route::get('/auth/google/redirect', [\App\Http\Controllers\Api\GoogleAuthController::class, 'redirectToGoogle']);
    Route::get('/auth/google/callback', [\App\Http\Controllers\Api\GoogleAuthController::class, 'handleGoogleCallback']);
    Route::get('/auth/google/demo', [\App\Http\Controllers\Api\GoogleAuthController::class, 'demoGoogleLogin']);

    // 2. Categories
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{slug}', [CategoryController::class, 'show']);

    // 3. Brands
    Route::get('/brands', [BrandController::class, 'index']);

    // 4. Products
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/featured', [ProductController::class, 'featured']);
    Route::get('/products/best-sellers', [ProductController::class, 'bestSellers']);
    Route::get('/products/search', [ProductController::class, 'search']);
    Route::get('/products/compare', [ProductController::class, 'compare']);
    Route::get('/products/{slug}/related', [ProductController::class, 'related']);
    Route::get('/products/{slug}', [ProductController::class, 'show']);

    // 4.1 Product Reviews (Real Database)
    Route::get('/products/{id}/reviews', [\App\Http\Controllers\Api\ReviewController::class, 'index']);
    Route::post('/products/{id}/reviews', [\App\Http\Controllers\Api\ReviewController::class, 'store']);
    Route::post('/reviews/{id}/helpful', [\App\Http\Controllers\Api\ReviewController::class, 'helpful']);

    // 4.2 Vouchers / Coupons
    Route::get('/vouchers/available', [\App\Http\Controllers\Api\VoucherController::class, 'available']);
    Route::post('/vouchers/apply', [\App\Http\Controllers\Api\VoucherController::class, 'apply']);

    // 4.3 Wishlists (Danh sách yêu thích)
    Route::get('/wishlist', [\App\Http\Controllers\Api\WishlistController::class, 'index']);
    Route::get('/wishlist/ids', [\App\Http\Controllers\Api\WishlistController::class, 'ids']);
    Route::post('/wishlist/toggle', [\App\Http\Controllers\Api\WishlistController::class, 'toggle']);

    // 4.4 Electronic Warranty Lookup (Tra cứu bảo hành điện tử chính hãng)
    Route::get('/warranty/check', [\App\Http\Controllers\Api\WarrantyController::class, 'check']);

    // 5. Cart
    Route::get('/cart', [CartController::class, 'show']);
    Route::post('/cart/items', [CartController::class, 'addItem']);
    Route::put('/cart/items/{id}', [CartController::class, 'updateItem']);
    Route::delete('/cart/items/{id}', [CartController::class, 'removeItem']);
    Route::delete('/cart', [CartController::class, 'clear']);

    // 6. Orders
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancelOrder']);

    // 7. MoMo Payment Gateway
    Route::post('/payment/momo/create', [\App\Http\Controllers\Api\PaymentController::class, 'createMomoPayment']);
    Route::post('/payment/momo/ipn', [\App\Http\Controllers\Api\PaymentController::class, 'handleMomoIpn']);
    Route::post('/orders/{id}/pay/momo', [\App\Http\Controllers\Api\PaymentController::class, 'payAgain']);

    // 8. Giao Hàng Nhanh (GHN) Express
    Route::get('/shipping/ghn/provinces', [\App\Http\Controllers\Api\ShippingController::class, 'getProvinces']);
    Route::get('/shipping/ghn/districts/{provinceId}', [\App\Http\Controllers\Api\ShippingController::class, 'getDistricts']);
    Route::get('/shipping/ghn/wards/{districtId}', [\App\Http\Controllers\Api\ShippingController::class, 'getWards']);
    Route::post('/shipping/ghn/fee', [\App\Http\Controllers\Api\ShippingController::class, 'calculateFee']);
    Route::post('/shipping/ghn/sync/{id}', [\App\Http\Controllers\Api\ShippingController::class, 'syncGhnOrder']);
    Route::post('/shipping/ghn/webhook', [\App\Http\Controllers\Api\ShippingController::class, 'handleGhnWebhook']);

    // 9. Live Chat APIs (Customer side)
    Route::post('/user/chat/send', [\App\Http\Controllers\User\ChatController::class, 'send']);
    Route::get('/user/chat/messages', [\App\Http\Controllers\User\ChatController::class, 'getMessages']);

    // 10. PROTECTED ADMIN APIS (Requires auth.token and admin role)
    Route::middleware(['auth.token', 'admin'])->group(function () {
        // Products Management
        Route::post('/admin/products', [ProductController::class, 'store']);
        Route::put('/admin/products/{id}', [ProductController::class, 'update']);
        Route::delete('/admin/products/{id}', [ProductController::class, 'destroy']);
        
        // Categories Management
        Route::post('/admin/categories', [CategoryController::class, 'store']);
        Route::put('/admin/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/admin/categories/{id}', [CategoryController::class, 'destroy']);

        // Orders Management
        Route::get('/admin/orders', [\App\Http\Controllers\Admin\OrderController::class, 'index']);
        Route::get('/admin/orders/{id}', [\App\Http\Controllers\Admin\OrderController::class, 'show']);
        Route::put('/admin/orders/{id}', [\App\Http\Controllers\Admin\OrderController::class, 'updateStatus']);
        Route::post('/admin/orders/{id}/confirm-payment', [OrderController::class, 'confirmPayment']);
        Route::post('/admin/orders/{id}/confirm-refund', [\App\Http\Controllers\Admin\OrderController::class, 'confirmRefund']);
        Route::post('/admin/orders/{id}/ghn', [\App\Http\Controllers\Api\ShippingController::class, 'createGhnOrder']);

        // Admin Chat
        Route::get('/admin/chat/users', [\App\Http\Controllers\Admin\ChatController::class, 'getUsers']);
        Route::get('/admin/chat/messages/{userId}', [\App\Http\Controllers\Admin\ChatController::class, 'getMessages']);
        Route::post('/admin/chat/send', [\App\Http\Controllers\Admin\ChatController::class, 'send']);

        // Reports & Charts
        Route::get('/admin/reports', [\App\Http\Controllers\Admin\ReportController::class, 'index']);
        Route::get('/admin/reports/summary', [\App\Http\Controllers\Admin\ReportController::class, 'index']);
        Route::get('/admin/reports/charts', [\App\Http\Controllers\Admin\ReportController::class, 'charts']);

        // User Management
        Route::get('/admin/users', [\App\Http\Controllers\Admin\UserController::class, 'index']);
        Route::post('/admin/users', [\App\Http\Controllers\Admin\UserController::class, 'store']);
        Route::get('/admin/users/{id}', [\App\Http\Controllers\Admin\UserController::class, 'show']);
        Route::put('/admin/users/{id}', [\App\Http\Controllers\Admin\UserController::class, 'update']);
        Route::delete('/admin/users/{id}', [\App\Http\Controllers\Admin\UserController::class, 'destroy']);

        // Vouchers Management (media_1790099989435.png)
        Route::get('/admin/vouchers', [\App\Http\Controllers\Api\VoucherController::class, 'adminIndex']);
        Route::post('/admin/vouchers', [\App\Http\Controllers\Api\VoucherController::class, 'store']);
        Route::put('/admin/vouchers/{id}', [\App\Http\Controllers\Api\VoucherController::class, 'update']);
        Route::patch('/admin/vouchers/{id}/toggle-status', [\App\Http\Controllers\Api\VoucherController::class, 'toggleStatus']);
        Route::delete('/admin/vouchers/{id}', [\App\Http\Controllers\Api\VoucherController::class, 'destroy']);

        // Reviews & Feedback Management (media_1790132554619.png)
        Route::get('/admin/reviews', [\App\Http\Controllers\Api\ReviewController::class, 'adminIndex']);
        Route::patch('/admin/reviews/{id}/toggle-status', [\App\Http\Controllers\Api\ReviewController::class, 'adminToggleStatus']);
        Route::post('/admin/reviews/{id}/reply', [\App\Http\Controllers\Api\ReviewController::class, 'adminReply']);
        Route::delete('/admin/reviews/{id}', [\App\Http\Controllers\Api\ReviewController::class, 'adminDestroy']);

        // Finance & Transactions Management (Lab 09)
        Route::get('/admin/finance/summary', [\App\Http\Controllers\Admin\FinanceController::class, 'index']);
        Route::get('/admin/finance/transactions', [\App\Http\Controllers\Admin\FinanceController::class, 'transactions']);
        Route::patch('/admin/finance/{order}/status', [\App\Http\Controllers\Admin\FinanceController::class, 'updateStatus']);
    });
});
