<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'discount_type',
        'discount_value',
        'min_order_amount',
        'max_discount_amount',
        'usage_limit',
        'used_count',
        'expires_at',
        'status',
    ];

    protected $casts = [
        'discount_value' => 'float',
        'min_order_amount' => 'float',
        'max_discount_amount' => 'float',
        'usage_limit' => 'integer',
        'used_count' => 'integer',
        'expires_at' => 'datetime',
    ];

    public function isValid(float $orderAmount): array
    {
        if ($this->status !== 'active') {
            return ['valid' => false, 'message' => 'Mã giảm giá này hiện không khả dụng.'];
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return ['valid' => false, 'message' => 'Mã giảm giá đã hết hạn sử dụng.'];
        }

        if ($this->usage_limit > 0 && $this->used_count >= $this->usage_limit) {
            return ['valid' => false, 'message' => 'Mã giảm giá đã hết lượt sử dụng.'];
        }

        if ($orderAmount < $this->min_order_amount) {
            $formattedMin = number_format($this->min_order_amount, 0, ',', '.') . '₫';
            return ['valid' => false, 'message' => "Mã chỉ áp dụng cho đơn hàng từ {$formattedMin} trở lên."];
        }

        return ['valid' => true, 'message' => 'Áp dụng mã giảm giá thành công!'];
    }

    public function calculateDiscount(float $orderAmount): float
    {
        if ($this->discount_type === 'percent') {
            $discount = ($orderAmount * $this->discount_value) / 100;
            if ($this->max_discount_amount && $this->max_discount_amount > 0) {
                $discount = min($discount, $this->max_discount_amount);
            }
            return round($discount);
        }

        return min($this->discount_value, $orderAmount);
    }
}
