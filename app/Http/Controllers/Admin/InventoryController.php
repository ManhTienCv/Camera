<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\InventoryMovement;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    /**
     * Sổ cái biến động kho bất biến (Immutable Inventory Ledger)
     */
    public function index(Request $request)
    {
        $query = InventoryMovement::with([
            'product:id,name,image_url,brand,price,stock',
            'order:id,order_code,customer_name',
        ])->latest('id');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->filled('search')) {
            $searchTerm = trim($request->search);
            $query->where(function ($q) use ($searchTerm) {
                $q->where('note', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('actor_name', 'LIKE', "%{$searchTerm}%")
                  ->orWhereHas('product', function ($pq) use ($searchTerm) {
                      $pq->where('name', 'LIKE', "%{$searchTerm}%")
                        ->orWhere('brand', 'LIKE', "%{$searchTerm}%");
                  })
                  ->orWhereHas('order', function ($oq) use ($searchTerm) {
                      $oq->where('order_code', 'LIKE', "%{$searchTerm}%");
                  });
            });
        }

        $perPage = max(10, min(100, (int) $request->input('per_page', 25)));
        $movements = $query->paginate($perPage);

        // Thống kê tổng hợp sổ cái kho
        $stats = [
            'total_movements' => InventoryMovement::count(),
            'total_purchased_qty' => abs((int) InventoryMovement::where('type', 'purchase')->sum('qty_change')),
            'total_restocked_qty' => (int) InventoryMovement::where('type', 'cancel_restock')->sum('qty_change'),
            'total_manual_adjusted' => InventoryMovement::where('type', 'manual_adjust')->count(),
        ];

        return response()->json([
            'data' => $movements->items(),
            'meta' => [
                'current_page' => $movements->currentPage(),
                'last_page' => $movements->lastPage(),
                'per_page' => $movements->perPage(),
                'total' => $movements->total(),
            ],
            'stats' => $stats,
        ]);
    }
}
