<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('gateway'); // phân biệt các cổng: momo, cod, vietqr, vnpay,...
            $table->string('gateway_order_id')->nullable()->index(); // ID đơn hàng từ cổng thanh toán
            $table->string('transaction_id')->nullable()->index(); // ID giao dịch từ cổng thanh toán (transId)
            $table->decimal('amount', 15, 2); // số tiền thanh toán
            $table->string('status')->default('pending'); // pending, completed, failed, cancelled,...
            $table->integer('result_code')->nullable(); // mã kết quả (0 là thành công)
            $table->string('message')->nullable(); // thông điệp phản hồi
            $table->json('request_payload')->nullable(); // dữ liệu gửi sang cổng
            $table->json('response_payload')->nullable(); // dữ liệu phản hồi từ cổng
            $table->timestamp('paid_at')->nullable(); // thời gian thanh toán thành công
            $table->timestamps();

            $table->index(['gateway', 'gateway_order_id']);
            $table->index(['order_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
