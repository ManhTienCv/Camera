<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'shipping_partner')) {
                $table->string('shipping_partner')->default('GHN Express')->after('shipping_fee');
            }
            if (!Schema::hasColumn('orders', 'tracking_code')) {
                $table->string('tracking_code')->nullable()->after('shipping_partner');
            }
            if (!Schema::hasColumn('orders', 'ghn_order_code')) {
                $table->string('ghn_order_code')->nullable()->after('tracking_code');
            }
            if (!Schema::hasColumn('orders', 'expected_delivery_time')) {
                $table->string('expected_delivery_time')->nullable()->after('ghn_order_code');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['shipping_partner', 'tracking_code', 'ghn_order_code', 'expected_delivery_time']);
        });
    }
};
