<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\User\ChatController as UserChatController;
use App\Http\Controllers\Admin\ChatController as AdminChatController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;

// MoMo User Return Callback Route (Bypass SPA to process transaction state)
Route::get('/payment/momo/callback', [PaymentController::class, 'handleMomoCallback'])->name('payment.momo.callback');

// Google OAuth 2.0 Routes
Route::get('/auth/google/redirect', [\App\Http\Controllers\Api\GoogleAuthController::class, 'redirectToGoogle'])->name('auth.google.redirect');
Route::get('/auth/google/callback', [\App\Http\Controllers\Api\GoogleAuthController::class, 'handleGoogleCallback'])->name('auth.google.callback');
Route::get('/auth/google/demo', [\App\Http\Controllers\Api\GoogleAuthController::class, 'demoGoogleLogin'])->name('auth.google.demo');
Route::get('/api/v1/auth/google/redirect', [\App\Http\Controllers\Api\GoogleAuthController::class, 'redirectToGoogle']);
Route::get('/api/v1/auth/google/callback', [\App\Http\Controllers\Api\GoogleAuthController::class, 'handleGoogleCallback']);
Route::get('/api/v1/auth/google/demo', [\App\Http\Controllers\Api\GoogleAuthController::class, 'demoGoogleLogin']);

// Lab 07: User Chat Routes
Route::prefix('user')->name('user.')->group(function () {
    Route::post('/chat/send', [UserChatController::class, 'send'])->name('chat.send');
    Route::get('/chat/messages', [UserChatController::class, 'getMessages'])->name('chat.messages');
});

// Lab 07 & 08: Admin Web Routes
Route::prefix('admin')->name('admin.')->group(function () {
    // Lab 07: Admin Chat Routes
    Route::get('/chat/users', [AdminChatController::class, 'getUsers'])->name('chat.users');
    Route::get('/chat/messages/{userId}', [AdminChatController::class, 'getMessages'])->name('chat.messages');
    Route::post('/chat/send', [AdminChatController::class, 'send'])->name('chat.send');

    // Lab 08: Admin Reports Routes
    Route::get('/reports', [AdminReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/charts', [AdminReportController::class, 'charts'])->name('reports.charts');

    // Lab 08: Admin Users Routes
    Route::resource('users', AdminUserController::class);

    // Lab 08: Admin Orders Routes
    Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{id}', [AdminOrderController::class, 'show'])->name('orders.show');
    Route::put('/orders/{id}', [AdminOrderController::class, 'updateStatus'])->name('orders.update');

    // Lab 09: Admin Finance Routes (Redirect to unified React SPA Admin)
    Route::get('/finance', function () {
        return redirect('/admin?tab=finance');
    })->name('finance.index');
    Route::get('/finance/transactions', function () {
        return redirect('/admin?tab=finance&subtab=transactions');
    })->name('finance.transactions');
    Route::patch('/finance/{order}/status', [\App\Http\Controllers\Admin\FinanceController::class, 'updateStatus'])->name('finance.update-status');
});

// Main React SPA Entrypoint
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');

