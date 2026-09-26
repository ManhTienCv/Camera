<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'type',
        'qty_before',
        'qty_change',
        'qty_after',
        'order_id',
        'actor_id',
        'actor_name',
        'note',
    ];

    protected $casts = [
        'qty_before' => 'integer',
        'qty_change' => 'integer',
        'qty_after' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * Ghi nhận một bút toán biến động kho bất biến (Immutable Ledger Record)
     */
    public static function recordMovement(
        int $productId,
        string $type,
        int $qtyBefore,
        int $qtyChange,
        int $qtyAfter,
        ?int $orderId = null,
        ?int $actorId = null,
        ?string $actorName = null,
        ?string $note = null
    ): self {
        return self::create([
            'product_id' => $productId,
            'type' => $type,
            'qty_before' => $qtyBefore,
            'qty_change' => $qtyChange,
            'qty_after' => $qtyAfter,
            'order_id' => $orderId,
            'actor_id' => $actorId,
            'actor_name' => $actorName,
            'note' => $note,
        ]);
    }
}
