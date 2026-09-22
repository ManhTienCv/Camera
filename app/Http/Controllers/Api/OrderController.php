<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use App\Services\EmailService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

class OrderController extends Controller
{
    protected function formatOrder(Order $order): array
    {
        return [
            'id' => (string) $order->id,
            'order_code' => $order->order_code,
            'session_id' => $order->session_id,
            'customer_name' => $order->customer_name,
            'customer_email' => $order->customer_email,
            'customer_phone' => $order->customer_phone,
            'shipping_address' => $order->shipping_address,
            'city' => $order->city,
            'payment_method' => $order->payment_method ?? 'cod',
            'payment_status' => $order->payment_status ?? 'pending',
            'total_amount' => (float) $order->total_amount,
            'shipping_fee' => (float) ($order->shipping_fee ?? 0),
            'discount_amount' => (float) ($order->discount_amount ?? 0),
            'shipping_partner' => $order->shipping_partner ?? 'GHN Express',
            'tracking_code' => $order->tracking_code ?? null,
            'ghn_order_code' => $order->ghn_order_code ?? null,
            'expected_delivery_time' => $order->expected_delivery_time ?? null,
            'status' => $order->order_status,
            'notes' => $order->notes ?? '',
            'created_at' => $order->created_at ? $order->created_at->toISOString() : now()->toISOString(),
            'items' => $order->items->map(function ($i) {
                return [
                    'product_id' => (string) $i->product_id,
                    'name' => $i->name,
                    'price' => (float) $i->price,
                    'quantity' => (int) $i->quantity,
                    'image_url' => $i->image_url ?? '',
                ];
            })->toArray(),
        ];
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'required|string|max:20',
            'shipping_address' => 'required|string|max:500',
            'city' => 'required|string|max:100',
            'payment_method' => 'nullable|string',
            'items' => 'required|array|min:1',
        ]);

        $sessionId = $request->header('X-Session-ID') ?: $request->input('session_id') ?: 'guest_session';
        $orderCode = 'CAM-' . strtoupper(Str::random(8));

        // Resolve user if token present
        $userId = null;
        $authHeader = $request->header('Authorization');
        if ($authHeader && Str::startsWith($authHeader, 'Bearer ')) {
            $token = Str::substr($authHeader, 7);
            $userId = Cache::get('auth_token_' . $token);
        }
        if (!$userId) {
            $userByEmail = User::where('email', strtolower(trim($request->customer_email)))->first();
            if ($userByEmail) {
                $userId = $userByEmail->id;
            }
        }

        $totalAmount = 0;
        $orderItemsData = [];
        $stockUpdates = [];

        foreach ($request->items as $item) {
            $product = Product::find($item['product_id']);
            if (!$product) {
                continue;
            }

            $quantity = max(1, (int) $item['quantity']);

            // Inventory check
            if ($product->stock < $quantity) {
                return response()->json([
                    'message' => "Sản phẩm \"{$product->name}\" không đủ số lượng. Kho chỉ còn {$product->stock} sản phẩm.",
                ], 400);
            }

            $price = (float) $product->price;
            $totalAmount += $price * $quantity;

            $orderItemsData[] = [
                'product_id' => $product->id,
                'name' => $product->name,
                'price' => $price,
                'quantity' => $quantity,
                'image_url' => $product->image_url ?? '',
            ];

            $stockUpdates[] = [
                'product' => $product,
                'quantity' => $quantity,
            ];
        }

        if (empty($orderItemsData)) {
            return response()->json(['message' => 'Không có sản phẩm hợp lệ trong đơn hàng'], 400);
        }

        $order = Order::create([
            'order_code' => $orderCode,
            'session_id' => $sessionId,
            'user_id' => $userId,
            'customer_name' => $request->customer_name,
            'customer_email' => $request->customer_email,
            'customer_phone' => $request->customer_phone,
            'shipping_address' => $request->shipping_address,
            'city' => $request->city,
            'payment_method' => $request->input('payment_method', 'cod'),
            'payment_status' => 'pending',
            'total_amount' => $totalAmount,
            'shipping_fee' => 0,
            'discount_amount' => 0,
            'order_status' => 'pending',
            'notes' => $request->input('notes', ''),
        ]);

        foreach ($orderItemsData as $itemData) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $itemData['product_id'],
                'name' => $itemData['name'],
                'price' => $itemData['price'],
                'quantity' => $itemData['quantity'],
                'image_url' => $itemData['image_url'],
            ]);
        }

        // Decrement stock
        foreach ($stockUpdates as $up) {
            $up['product']->decrement('stock', $up['quantity']);
        }

        // Clear cart for session
        $cart = Cart::where('session_id', $sessionId)->first();
        if ($cart) {
            CartItem::where('cart_id', $cart->id)->delete();
        }

        $order->load('items');

        // Ghi nhận nhật ký tài chính PaymentTransaction chuẩn Lab 06
        $paymentMethod = $order->payment_method ?: 'cod';
        \App\Models\PaymentTransaction::create([
            'order_id' => $order->id,
            'gateway' => $paymentMethod,
            'amount' => $order->total_amount,
            'status' => 'pending',
            'message' => $paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Khởi tạo thanh toán trực tuyến',
        ]);

        // Nhánh COD: Tự động khởi tạo vận đơn GHN ngay lập tức theo Lab 06
        if ($paymentMethod === 'cod') {
            try {
                \App\Services\GHNService::createShippingOrder($order);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Auto GHN create on COD order failed: ' . $e->getMessage());
            }
        }

        // Gửi email xác nhận đơn hàng qua Gmail SMTP
        EmailService::sendOrderConfirmation($order);

        return response()->json($this->formatOrder($order->fresh('items')), 201);
    }

    public function show($id)
    {
        $order = Order::with('items')->where('id', $id)->orWhere('order_code', $id)->firstOrFail();

        return response()->json($this->formatOrder($order));
    }

    public function index()
    {
        $orders = Order::with('items')->orderBy('created_at', 'desc')->get()->map(function ($order) {
            $data = $this->formatOrder($order);
            $data['item_count'] = $order->items->sum('quantity');
            return $data;
        });

        return response()->json($orders);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string',
        ]);

        $order = Order::findOrFail($id);
        $oldStatus = $order->order_status;
        $newStatus = $request->status;

        $order->order_status = $newStatus;

        // Nếu chuyển sang trạng thái đã hủy
        if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
            $order->cancel_reason = $request->input('reason', 'Admin cập nhật hủy đơn');

            // 1. Hoàn lại kho sản phẩm
            foreach ($order->items as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $product->increment('stock', $item->quantity);
                }
            }

            // 2. Nếu đã có mã vận đơn GHN thì gọi API hủy đơn trên GHN
            if ($order->tracking_code && !str_starts_with($order->tracking_code, '#GHN')) {
                try {
                    \App\Services\GHNService::cancelOrder($order->tracking_code);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Cancel order on GHN failed: ' . $e->getMessage());
                }
            }
        }

        $order->save();

        return response()->json([
            'message' => 'Cập nhật trạng thái đơn hàng thành công!',
            'order' => $this->formatOrder($order->fresh('items')),
        ]);
    }

    public function confirmPayment($id)
    {
        $order = Order::where('id', $id)->orWhere('order_code', $id)->firstOrFail();

        $order->payment_status = 'completed';
        $order->order_status = 'shipping'; // Auto approved and set to shipping
        $order->save();

        return response()->json([
            'message' => 'Xác nhận thanh toán thành công! Đơn hàng đã được tự động duyệt.',
            'order' => $this->formatOrder($order->fresh('items')),
        ]);
    }

    public function cancelOrder(Request $request, $id)
    {
        $order = Order::where('id', $id)->orWhere('order_code', $id)->firstOrFail();

        // Không cho phép hủy nếu đơn đã hoàn tất giao hàng hoặc đã hủy trước đó
        if (in_array($order->order_status, ['delivered', 'cancelled'])) {
            return response()->json([
                'message' => 'Đơn hàng này đã kết thúc hoặc đã bị hủy trước đó.',
            ], 400);
        }

        // 1. Hoàn lại tồn kho sản phẩm
        foreach ($order->items as $item) {
            $product = Product::find($item->product_id);
            if ($product) {
                $product->increment('stock', $item->quantity);
            }
        }

        // 2. Gọi GHN API hủy vận đơn nếu có mã thật
        if ($order->tracking_code && !str_starts_with($order->tracking_code, '#GHN')) {
            try {
                \App\Services\GHNService::cancelOrder($order->tracking_code);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Cancel order on GHN failed: ' . $e->getMessage());
            }
        }

        $order->order_status = 'cancelled';
        if ($request->filled('reason')) {
            $reason = trim($request->input('reason'));
            $order->cancel_reason = $reason;
            $order->notes = ($order->notes ? $order->notes . ' | ' : '') . 'Lý do hủy: ' . $reason;
        } else {
            $order->cancel_reason = 'Khách hàng yêu cầu hủy đơn';
        }
        $order->save();

        return response()->json([
            'message' => 'Đã hủy đơn hàng thành công! Số lượng sản phẩm đã được hoàn lại kho.',
            'order' => $this->formatOrder($order->fresh('items')),
        ]);
    }
}
