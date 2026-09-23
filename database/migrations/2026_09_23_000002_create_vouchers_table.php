<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('discount_type', ['fixed', 'percent'])->default('fixed');
            $table->decimal('discount_value', 12, 2); // e.g. 50000 hoặc 5 (5%)
            $table->decimal('min_order_amount', 12, 2)->default(0); // Đơn tối thiểu
            $table->decimal('max_discount_amount', 12, 2)->nullable(); // Giảm tối đa nếu là percent
            $table->unsignedInteger('usage_limit')->default(100); // Số lượt dùng tối đa
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
