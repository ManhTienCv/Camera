<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_code',
        'session_id',
        'user_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'shipping_address',
        'city',
        'payment_method',
        'payment_status',
        'total_amount',
        'shipping_fee',
        'discount_amount',
        'order_status',
        'notes',
        'shipping_partner',
        'tracking_code',
        'ghn_order_code',
        'expected_delivery_time',
        'cancel_reason',
    ];

    protected $casts = [
        'total_amount' => 'float',
        'shipping_fee' => 'float',
        'discount_amount' => 'float',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
