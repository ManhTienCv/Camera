<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Thêm các trường hoàn tiền và index cho bảng orders
        Schema::table('orders', function (Blueprint $table) {
            $table->string('bank_name')->nullable()->after('notes');
            $table->string('bank_account_number')->nullable()->after('bank_name');
            $table->string('bank_account_holder')->nullable()->after('bank_account_number');
            $table->string('refund_ref_code')->nullable()->after('bank_account_holder');
            $table->timestamp('refunded_at')->nullable()->after('refund_ref_code');

            $table->index('order_status');
            $table->index(['user_id', 'order_status']);
        });

        // 2. Thêm index hiệu năng cho bảng products
        Schema::table('products', function (Blueprint $table) {
            $table->index(['status', 'category_id', 'brand_id']);
            $table->index('price');
        });

        // 3. Thêm composite index cho bảng messages (Lab 07 / Mục tiêu 6)
        Schema::table('messages', function (Blueprint $table) {
            $table->index(['sender_id', 'receiver_id', 'created_at']);
            $table->index('is_read');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['sender_id', 'receiver_id', 'created_at']);
            $table->dropIndex(['is_read']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['status', 'category_id', 'brand_id']);
            $table->dropIndex(['price']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['order_status']);
            $table->dropIndex(['user_id', 'order_status']);
            $table->dropColumn([
                'bank_name',
                'bank_account_number',
                'bank_account_holder',
                'refund_ref_code',
                'refunded_at',
            ]);
        });
    }
};
