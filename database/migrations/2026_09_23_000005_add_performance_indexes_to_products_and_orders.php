<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->index(['status', 'created_at'], 'products_status_created_at_idx');
            $table->index(['status', 'price'], 'products_status_price_idx');
            $table->index(['is_featured', 'status'], 'products_featured_status_idx');
            $table->index(['is_new', 'status'], 'products_new_status_idx');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->index('created_at', 'orders_created_at_idx');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_status_created_at_idx');
            $table->dropIndex('products_status_price_idx');
            $table->dropIndex('products_featured_status_idx');
            $table->dropIndex('products_new_status_idx');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_created_at_idx');
        });
    }
};
