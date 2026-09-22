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
    Route::get('/products/search', [ProductController::class, 'search']);
    Route::get('/products/{slug}', [ProductController::class, 'show']);

    // 5. Cart
    Route::get('/cart', [CartController::class, 'show']);
    Route::post('/cart/items', [CartController::class, 'addItem']);
    Route::put('/cart/items/{id}', [CartController::class, 'updateItem']);
    Route::delete('/cart/items/{id}', [CartController::class, 'removeItem']);
    Route::delete('/cart', [CartController::class, 'clear']);

    // 6. Orders
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders/{id}/confirm-payment', [OrderController::class, 'confirmPayment']);
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
    Route::post('/admin/orders/{id}/ghn', [\App\Http\Controllers\Api\ShippingController::class, 'createGhnOrder']);
    Route::post('/shipping/ghn/sync/{id}', [\App\Http\Controllers\Api\ShippingController::class, 'syncGhnOrder']);
    Route::post('/shipping/ghn/webhook', [\App\Http\Controllers\Api\ShippingController::class, 'handleGhnWebhook']);

    // 9. Admin APIs
    Route::post('/admin/products', [ProductController::class, 'store']);
    Route::put('/admin/products/{id}', [ProductController::class, 'update']);
    Route::delete('/admin/products/{id}', [ProductController::class, 'destroy']);
    
    Route::post('/admin/categories', [CategoryController::class, 'store']);
    Route::put('/admin/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/admin/categories/{id}', [CategoryController::class, 'destroy']);

    Route::get('/admin/orders', [\App\Http\Controllers\Admin\OrderController::class, 'index']);
    Route::get('/admin/orders/{id}', [\App\Http\Controllers\Admin\OrderController::class, 'show']);
    Route::put('/admin/orders/{id}', [\App\Http\Controllers\Admin\OrderController::class, 'updateStatus']);

    // 10. Lab 07: Live Chat APIs (User & Admin)
    Route::post('/user/chat/send', [\App\Http\Controllers\User\ChatController::class, 'send']);
    Route::get('/user/chat/messages', [\App\Http\Controllers\User\ChatController::class, 'getMessages']);
    Route::get('/admin/chat/users', [\App\Http\Controllers\Admin\ChatController::class, 'getUsers']);
    Route::get('/admin/chat/messages/{userId}', [\App\Http\Controllers\Admin\ChatController::class, 'getMessages']);
    Route::post('/admin/chat/send', [\App\Http\Controllers\Admin\ChatController::class, 'send']);

    // 11. Lab 08: Admin Reports & Charts APIs
    Route::get('/admin/reports', [\App\Http\Controllers\Admin\ReportController::class, 'index']);
    Route::get('/admin/reports/summary', [\App\Http\Controllers\Admin\ReportController::class, 'index']);
    Route::get('/admin/reports/charts', [\App\Http\Controllers\Admin\ReportController::class, 'charts']);

    // 12. Lab 08: Admin User Management APIs
    Route::get('/admin/users', [\App\Http\Controllers\Admin\UserController::class, 'index']);
    Route::post('/admin/users', [\App\Http\Controllers\Admin\UserController::class, 'store']);
    Route::get('/admin/users/{id}', [\App\Http\Controllers\Admin\UserController::class, 'show']);
    Route::put('/admin/users/{id}', [\App\Http\Controllers\Admin\UserController::class, 'update']);
    Route::delete('/admin/users/{id}', [\App\Http\Controllers\Admin\UserController::class, 'destroy']);
});
