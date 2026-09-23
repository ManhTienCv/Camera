<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use App\Models\PaymentTransaction;
use App\Services\EmailService;
use App\Services\GHNService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    /**
     * Xác định người dùng đang thực hiện request (Bearer Token hoặc Session)
     */
    protected function resolveCurrentUser(Request $request): ?User
    {
        if (Auth::check()) {
            return Auth::user();
        }

        $authHeader = $request->header('Authorization');
        if ($authHeader && Str::startsWith($authHeader, 'Bearer ')) {
            $token = Str::substr($authHeader, 7);
            $userId = Cache::get('auth_token_' . $token);
            if ($userId) {
                return User::find($userId);
            }
        }

        return null;
    }

    /**
     * Che mờ tên khách hàng (Nguyễn Văn Nam -> Nguyễn *** Nam)
     */
    protected function maskName(?string $name): string
    {
        if (empty($name)) return 'Khách hàng';
        $parts = preg_split('/\s+/', trim($name));
        if (count($parts) <= 1) {
            $len = mb_strlen($name);
            if ($len <= 2) return mb_substr($name, 0, 1) . '*';
            return mb_substr($name, 0, 1) . '***' . mb_substr($name, -1);
        }
        $first = array_shift($parts);
        $last = array_pop($parts);
        return $first . ' *** ' . $last;
    }

    /**
     * Che mờ số điện thoại (0912345678 -> 091****678)
     */
    protected function maskPhone(?string $phone): string
    {
        if (empty($phone)) return '09******';
        $cleaned = preg_replace('/[^\d+]/', '', $phone);
        $len = strlen($cleaned);
        if ($len < 6) return substr($cleaned, 0, 2) . '****';
        return substr($cleaned, 0, 3) . '****' . substr($cleaned, -3);
    }

    /**
     * Che mờ email (customer@gmail.com -> cu***@gmail.com)
     */
    protected function maskEmail(?string $email): string
    {
        if (empty($email) || !str_contains($email, '@')) return '***@***.com';
        [$local, $domain] = explode('@', $email, 2);
        $maskedLocal = strlen($local) <= 2 ? substr($local, 0, 1) . '***' : substr($local, 0, 2) . '***';
        return $maskedLocal . '@' . $domain;
    }

    /**
     * Định dạng dữ liệu đơn hàng (áp dụng kiểm tra quyền sở hữu & PII Masking)
     */
    protected function formatOrder(Order $order, bool $isAuthorized = true): array
    {
        return [
            'id' => (string) $order->id,
            'order_code' => $order->order_code,
            'session_id' => $isAuthorized ? $order->session_id : null,
            'customer_name' => $isAuthorized ? $order->customer_name : $this->maskName($order->customer_name),
            'customer_email' => $isAuthorized ? $order->customer_email : $this->maskEmail($order->customer_email),
            'customer_phone' => $isAuthorized ? $order->customer_phone : $this->maskPhone($order->customer_phone),
            'shipping_address' => $isAuthorized ? $order->shipping_address : ('*** ' . ($order->city ?: 'Việt Nam')),
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
            'order_status' => $order->order_status,
            'cancel_reason' => $order->cancel_reason ?? null,
            'bank_name' => $isAuthorized ? $order->bank_name : null,
            'bank_account_number' => $isAuthorized ? $order->bank_account_number : null,
            'bank_account_holder' => $isAuthorized ? $order->bank_account_holder : null,
            'refund_ref_code' => $isAuthorized ? $order->refund_ref_code : null,
            'refunded_at' => $isAuthorized && $order->refunded_at ? $order->refunded_at->toISOString() : null,
            'notes' => $isAuthorized ? ($order->notes ?? '') : '',
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

    /**
     * MỤC TIÊU 1: CHỐNG BÁN ÂM TỒN KHO (RACE CONDITION) TRONG DB::TRANSACTION
     */
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

        // Xác định user_id
        $currentUser = $this->resolveCurrentUser($request);
        $userId = $currentUser ? $currentUser->id : null;
        if (!$userId) {
            $userByEmail = User::where('email', strtolower(trim($request->customer_email)))->first();
            if ($userByEmail) {
                $userId = $userByEmail->id;
            }
        }

        try {
            $order = DB::transaction(function () use ($request, $sessionId, $orderCode, $userId) {
                $totalAmount = 0;
                $orderItemsData = [];

                // 1. Kiểm tra tồn kho và TRỪ KHO NGUYÊN TỬ (Atomic Conditional Decrement)
                foreach ($request->items as $item) {
                    $productId = $item['product_id'] ?? null;
                    $quantity = max(1, (int) ($item['quantity'] ?? 1));

                    $product = Product::find($productId);
                    if (!$product) {
                        throw new \Exception("Sản phẩm ID #{$productId} không tồn tại trên hệ thống!");
                    }

                    // Atomic update: Chỉ decrement nếu stock >= quantity trong cùng 1 query InnoDB
                    $affected = Product::where('id', $product->id)
                        ->where('stock', '>=', $quantity)
                        ->decrement('stock', $quantity);

                    if (!$affected) {
                        throw new \Exception("Sản phẩm \"{$product->name}\" vừa hết hàng hoặc không đủ số lượng trong kho!");
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
                }

                if (empty($orderItemsData)) {
                    throw new \Exception('Không có sản phẩm hợp lệ trong đơn hàng');
                }

                // 2. Kiểm tra và áp dụng Voucher (nếu có)
                $discountAmount = 0;
                $voucherCode = $request->filled('voucher_code') ? strtoupper(trim($request->voucher_code)) : null;
                if ($voucherCode) {
                    $voucher = \App\Models\Voucher::where('code', $voucherCode)->first();
                    if ($voucher) {
                        $check = $voucher->isValid($totalAmount);
                        if ($check['valid']) {
                            $discountAmount = $voucher->calculateDiscount($totalAmount);
                            $voucher->increment('used_count');
                        }
                    }
                }

                $finalAmount = max(0, $totalAmount - $discountAmount);

                // 3. Tạo đơn hàng Order
                $paymentMethod = $request->input('payment_method', 'cod');
                $newOrder = Order::create([
                    'order_code' => $orderCode,
                    'session_id' => $sessionId,
                    'user_id' => $userId,
                    'customer_name' => $request->customer_name,
                    'customer_email' => $request->customer_email,
                    'customer_phone' => $request->customer_phone,
                    'shipping_address' => $request->shipping_address,
                    'city' => $request->city,
                    'payment_method' => $paymentMethod,
                    'payment_status' => 'pending',
                    'total_amount' => $finalAmount,
                    'shipping_fee' => 0,
                    'discount_amount' => $discountAmount,
                    'order_status' => 'pending',
                    'notes' => $request->input('notes', ''),
                ]);

                // 3. Tạo các chi tiết đơn hàng OrderItem
                foreach ($orderItemsData as $itemData) {
                    OrderItem::create([
                        'order_id' => $newOrder->id,
                        'product_id' => $itemData['product_id'],
                        'name' => $itemData['name'],
                        'price' => $itemData['price'],
                        'quantity' => $itemData['quantity'],
                        'image_url' => $itemData['image_url'],
                    ]);
                }

                // 4. Xóa giỏ hàng sau khi tạo đơn thành công
                $cart = Cart::where('session_id', $sessionId)->first();
                if ($cart) {
                    CartItem::where('cart_id', $cart->id)->delete();
                }

                // 5. Ghi nhận nhật ký tài chính PaymentTransaction
                PaymentTransaction::create([
                    'order_id' => $newOrder->id,
                    'gateway' => $paymentMethod,
                    'amount' => $newOrder->total_amount,
                    'status' => 'pending',
                    'message' => $paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Khởi tạo thanh toán trực tuyến',
                ]);

                return $newOrder;
            });

            // Sau khi commit transaction thành công:
            // Tự động đẩy vận đơn GHN nếu là COD
            if ($order->payment_method === 'cod') {
                try {
                    GHNService::createShippingOrder($order);
                } catch (\Throwable $e) {
                    Log::warning('Auto GHN create on COD order failed: ' . $e->getMessage());
                }
            }

            // Gửi email xác nhận đơn hàng qua SMTP
            try {
                EmailService::sendOrderConfirmation($order->fresh('items'));
            } catch (\Throwable $e) {
                Log::warning('Send order confirmation email failed: ' . $e->getMessage());
            }

            return response()->json($this->formatOrder($order->fresh('items'), true), 201);
        } catch (\Throwable $e) {
            Log::error('Order creation failed: ' . $e->getMessage());
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * MỤC TIÊU 4: BẢO VỆ DỮ LIỆU CÁ NHÂN & CHỐNG IDOR (PII PROTECTION)
     */
    public function show(Request $request, $id)
    {
        $order = Order::with('items')->where('id', $id)->orWhere('order_code', $id)->firstOrFail();

        $currentUser = $this->resolveCurrentUser($request);
        $isAuthorized = false;

        if ($currentUser) {
            // Admin hoặc người sở hữu đơn hàng được xem đầy đủ
            $isAuthorized = ($currentUser->role === 'admin') || ((int) $currentUser->id === (int) $order->user_id);
        }

        return response()->json($this->formatOrder($order, $isAuthorized));
    }

    public function index(Request $request)
    {
        $currentUser = $this->resolveCurrentUser($request);
        $isAdmin = $currentUser && $currentUser->role === 'admin';

        $orders = Order::with('items')->orderBy('created_at', 'desc')->get()->map(function ($order) use ($currentUser, $isAdmin) {
            $isAuthorized = $isAdmin || ($currentUser && (int) $currentUser->id === (int) $order->user_id);
            $data = $this->formatOrder($order, $isAuthorized);
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

        // Nếu chuyển sang trạng thái đã hủy
        if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
            $order->cancel_reason = $request->input('reason', 'Admin cập nhật hủy đơn');

            // 1. Hoàn lại kho sản phẩm
            foreach ($order->items as $item) {
                Product::where('id', $item->product_id)->increment('stock', $item->quantity);
            }

            // 2. Nếu đã có mã vận đơn GHN thì gọi API hủy đơn trên GHN
            if ($order->tracking_code && !str_starts_with($order->tracking_code, '#GHN')) {
                try {
                    GHNService::cancelOrder($order->tracking_code);
                } catch (\Throwable $e) {
                    Log::warning('Cancel order on GHN failed: ' . $e->getMessage());
                }
            }
        }

        $order->order_status = $newStatus;
        $order->save();

        return response()->json([
            'message' => 'Cập nhật trạng thái đơn hàng thành công!',
            'order' => $this->formatOrder($order->fresh('items'), true),
        ]);
    }

    public function confirmPayment($id)
    {
        $order = Order::where('id', $id)->orWhere('order_code', $id)->firstOrFail();

        $order->payment_status = 'completed';
        $order->order_status = 'shipping'; // Tự động duyệt sang shipping
        $order->save();

        return response()->json([
            'message' => 'Xác nhận thanh toán thành công! Đơn hàng đã được tự động duyệt.',
            'order' => $this->formatOrder($order->fresh('items'), true),
        ]);
    }

    /**
     * MỤC TIÊU 3: HOÀN THIỆN LUỒNG HỦY ĐƠN & TÀI CHÍNH (COD VS ONLINE REFUND_PENDING)
     */
    public function cancelOrder(Request $request, $id)
    {
        $order = Order::where('id', $id)->orWhere('order_code', $id)->firstOrFail();

        // 1. Chặn hủy nếu đơn đã hoàn tất giao hàng hoặc đã hủy trước đó
        if (in_array($order->order_status, ['delivered', 'cancelled'])) {
            return response()->json([
                'message' => 'Đơn hàng này đã kết thúc hoặc đã bị hủy trước đó.',
            ], 400);
        }

        // 2. Chặn hủy nếu đang giao hàng
        if (in_array($order->order_status, ['shipping', 'delivering'])) {
            return response()->json([
                'message' => 'Đơn hàng đang trong quá trình vận chuyển giao hàng, hệ thống không cho phép Hủy!',
            ], 400);
        }

        $reason = $request->filled('reason') ? trim($request->input('reason')) : 'Khách hàng yêu cầu hủy đơn';

        // 3. Phân biệt luồng Online đã thanh toán vs Đơn COD
        $isOnlinePaid = in_array($order->payment_status, ['paid', 'completed']) ||
            ($order->payment_method !== 'cod' && in_array($order->payment_status, ['paid', 'completed']));

        if ($isOnlinePaid) {
            // YÊU CẦU: Nhập thông tin tài khoản hoàn tiền
            $request->validate([
                'bank_name' => 'required|string|max:100',
                'bank_account_number' => 'required|string|max:50',
                'bank_account_holder' => 'required|string|max:100',
            ], [
                'bank_name.required' => 'Vui lòng cung cấp tên ngân hàng nhận tiền hoàn.',
                'bank_account_number.required' => 'Vui lòng cung cấp số tài khoản nhận tiền hoàn.',
                'bank_account_holder.required' => 'Vui lòng cung cấp tên chủ tài khoản nhận tiền hoàn.',
            ]);

            // Hoàn lại tồn kho cho sản phẩm
            foreach ($order->items as $item) {
                Product::where('id', $item->product_id)->increment('stock', $item->quantity);
            }

            // Hủy vận đơn GHN nếu có
            if ($order->tracking_code && !str_starts_with($order->tracking_code, '#GHN')) {
                try {
                    GHNService::cancelOrder($order->tracking_code);
                } catch (\Throwable $e) {
                    Log::warning('Cancel order on GHN failed: ' . $e->getMessage());
                }
            }

            // Chuyển sang refund_pending để Admin duyệt hoàn tiền
            $order->order_status = 'refund_pending';
            $order->payment_status = 'refund_pending';
            $order->bank_name = trim($request->bank_name);
            $order->bank_account_number = trim($request->bank_account_number);
            $order->bank_account_holder = trim($request->bank_account_holder);
            $order->cancel_reason = $reason;
            $order->notes = ($order->notes ? $order->notes . ' | ' : '') . 'Yêu cầu hoàn tiền về STK: ' . $order->bank_account_number . ' (' . $order->bank_name . ' - ' . $order->bank_account_holder . '). Lý do: ' . $reason;
            $order->save();

            // Lưu log giao dịch hoàn tiền
            PaymentTransaction::create([
                'order_id' => $order->id,
                'gateway' => $order->payment_method ?: 'online',
                'amount' => $order->total_amount,
                'status' => 'refund_pending',
                'message' => "Khách yêu cầu hoàn tiền về STK {$order->bank_account_number} ({$order->bank_name}) - {$order->bank_account_holder}",
            ]);

            return response()->json([
                'message' => 'Đã tiếp nhận yêu cầu hủy đơn và hoàn tiền! Số lượng sản phẩm đã được hoàn lại kho. Ban quản trị sẽ chuyển khoản hoàn tiền vào số tài khoản của bạn trong 24h.',
                'order' => $this->formatOrder($order->fresh('items'), true),
            ]);
        }

        // 4. Nhánh COD hoặc chưa thanh toán: Hủy ngay lập tức
        foreach ($order->items as $item) {
            Product::where('id', $item->product_id)->increment('stock', $item->quantity);
        }

        if ($order->tracking_code && !str_starts_with($order->tracking_code, '#GHN')) {
            try {
                GHNService::cancelOrder($order->tracking_code);
            } catch (\Throwable $e) {
                Log::warning('Cancel order on GHN failed: ' . $e->getMessage());
            }
        }

        $order->order_status = 'cancelled';
        $order->cancel_reason = $reason;
        $order->notes = ($order->notes ? $order->notes . ' | ' : '') . 'Lý do hủy: ' . $reason;
        $order->save();

        return response()->json([
            'message' => 'Đã hủy đơn hàng thành công! Số lượng sản phẩm đã được hoàn lại kho.',
            'order' => $this->formatOrder($order->fresh('items'), true),
        ]);
    }
}
