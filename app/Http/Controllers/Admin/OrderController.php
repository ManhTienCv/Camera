<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Services\GHNService;

class OrderController extends Controller
{
    private const TABS = [
        'all' => ['label' => 'Tất cả', 'color' => 'blue', 'statuses' => []],
        'pending' => ['label' => 'Chờ xử lý', 'color' => 'slate', 'statuses' => ['pending', 'not_shipped', 'processing']],
        'ready' => ['label' => 'Chờ lấy hàng', 'color' => 'cyan', 'statuses' => ['ready_to_pick']],
        'picking' => ['label' => 'Đang lấy hàng', 'color' => 'cyan', 'statuses' => ['picking']],
        'delivering' => ['label' => 'Đang giao', 'color' => 'amber', 'statuses' => ['shipping', 'delivering', 'picked', 'storing', 'transporting', 'sorting']],
        'delivered' => ['label' => 'Thành công', 'color' => 'green', 'statuses' => ['delivered', 'completed']],
        'return' => ['label' => 'Hoàn hàng', 'color' => 'orange', 'statuses' => ['return', 'returning', 'returned']],
        'cancelled' => ['label' => 'Đã hủy', 'color' => 'red', 'statuses' => ['cancelled']],
    ];

    /**
     * Hiển thị danh sách đơn hàng cho Admin
     */
    public function index(Request $request)
    {
        $query = Order::with(['items.product', 'user'])->orderBy('created_at', 'desc');

        // Tìm kiếm
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('order_code', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_phone', 'like', "%{$search}%")
                  ->orWhere('tracking_code', 'like', "%{$search}%")
                  ->orWhere('id', $search);
            });
        }

        // Lọc theo Tab trạng thái Lab 08
        $activeTab = $request->input('tab', 'all');
        if ($activeTab !== 'all' && isset(self::TABS[$activeTab])) {
            $statuses = self::TABS[$activeTab]['statuses'];
            $query->whereIn('order_status', $statuses);
        }

        // Lọc theo phương thức thanh toán
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        // Lọc theo ngày
        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', Carbon::parse($request->date_from)->startOfDay());
        }
        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', Carbon::parse($request->date_to)->endOfDay());
        }

        $orders = $query->get()->map(function ($order) {
            return [
                'id' => (string) $order->id,
                'order_code' => $order->order_code ?: ('CAM-' . $order->id),
                'customer_name' => $order->customer_name,
                'customer_email' => $order->customer_email,
                'customer_phone' => $order->customer_phone,
                'shipping_address' => $order->shipping_address,
                'city' => $order->city,
                'total_amount' => (float) $order->total_amount,
                'payment_method' => $order->payment_method,
                'payment_status' => $order->payment_status,
                'order_status' => $order->order_status,
                'status' => $order->order_status,
                'tracking_code' => $order->tracking_code,
                'ghn_order_code' => $order->ghn_order_code,
                'cancel_reason' => $order->cancel_reason,
                'created_at' => $order->created_at ? $order->created_at->toIso8601String() : null,
                'item_count' => $order->items->sum('quantity'),
                'items' => $order->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'product_id' => $item->product_id,
                        'name' => $item->name,
                        'price' => (float) $item->price,
                        'quantity' => $item->quantity,
                        'image_url' => $item->image_url,
                    ];
                }),
            ];
        });

        // Đếm số lượng theo từng Tab
        $tabCounts = [];
        $allOrders = Order::all();
        foreach (self::TABS as $key => $tabInfo) {
            if ($key === 'all') {
                $tabCounts[$key] = $allOrders->count();
            } else {
                $tabCounts[$key] = $allOrders->whereIn('order_status', $tabInfo['statuses'])->count();
            }
        }

        $response = [
            'orders' => $orders,
            'tabCounts' => $tabCounts,
            'activeTab' => $activeTab,
        ];

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json($response);
        }

        if (view()->exists('admin.orders.index')) {
            return view('admin.orders.index', compact('orders', 'tabCounts', 'activeTab'));
        }
        if (view()->exists('admin.order.index')) {
            return view('admin.order.index', compact('orders', 'tabCounts', 'activeTab'));
        }

        return response()->json($response);
    }

    /**
     * Chi tiết đơn hàng
     */
    public function show(Request $request, $id)
    {
        $order = Order::with(['items.product', 'user', 'transactions' => fn ($q) => $q->latest()])
            ->where('id', $id)
            ->orWhere('order_code', $id)
            ->firstOrFail();

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json($order);
        }

        if (view()->exists('admin.orders.show')) {
            return view('admin.orders.show', compact('order'));
        }
        if (view()->exists('admin.order.show')) {
            return view('admin.order.show', compact('order'));
        }

        return response()->json($order);
    }

    /**
     * Cập nhật trạng thái đơn hàng (Tuân thủ nghiêm ngặt Lab 08: Đang giao KHÔNG cho hủy)
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string',
        ]);

        $order = Order::findOrFail($id);
        $oldStatus = $order->order_status;
        $newStatus = $request->status;

        // QUY TẮC LAB 08: Nếu đơn hàng ở trạng thái đang giao -> KHÔNG cho Hủy từ Admin
        if (in_array($oldStatus, ['shipping', 'delivering']) && $newStatus === 'cancelled') {
            return response()->json([
                'message' => 'Đơn hàng đang trong quá trình vận chuyển giao hàng, hệ thống không cho phép Hủy!',
            ], 422);
        }

        $order->order_status = $newStatus;

        // Nếu chuyển sang trạng thái đã hủy (khi đơn chưa giao)
        if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
            $order->cancel_reason = $request->input('reason', 'Admin cập nhật hủy đơn');

            // 1. Hoàn lại tồn kho sản phẩm
            foreach ($order->items as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $product->increment('stock', $item->quantity);
                }
            }

            // 2. Nếu có mã vận đơn GHN thật thì gọi hủy GHN
            if ($order->tracking_code && !str_starts_with($order->tracking_code, '#GHN')) {
                try {
                    GHNService::cancelOrder($order->tracking_code);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Admin cancel order on GHN failed: ' . $e->getMessage());
                }
            }
        } elseif ($newStatus === 'completed' || $newStatus === 'delivered') {
            $order->payment_status = 'completed';
        }

        $order->save();

        return response()->json([
            'message' => 'Cập nhật trạng thái đơn hàng thành công!',
            'order' => $order->fresh('items'),
        ]);
    }
}
