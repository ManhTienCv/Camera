<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->string('variant')->nullable()->after('rating');
            $table->json('images')->nullable()->after('comment');
            $table->boolean('is_verified_purchase')->default(false)->after('images');
            $table->unsignedInteger('helpful_count')->default(0)->after('is_verified_purchase');
            $table->unsignedBigInteger('order_id')->nullable()->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropColumn(['variant', 'images', 'is_verified_purchase', 'helpful_count', 'order_id']);
        });
    }
};
