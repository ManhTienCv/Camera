<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PaymentTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class FinanceController extends Controller
{
    public const STATUSES = [
        'pending' => 'Chờ thanh toán',
        'initiated' => 'Đang chờ MoMo',
        'paid' => 'Đã thanh toán',
        'failed' => 'Thanh toán thất bại',
        'cancelled' => 'Đã hủy',
        'refund_pending' => 'Chờ hoàn tiền',
        'refunded' => 'Đã hoàn tiền',
    ];

    public const COD_TRANSITIONS = [
        'pending' => ['pending', 'paid', 'failed'],
        'failed' => ['failed', 'pending', 'paid'],
        'paid' => ['paid', 'refund_pending'],
        'refund_pending' => ['refund_pending', 'refunded'],
        'refunded' => ['refunded'],
        'cancelled' => ['cancelled'],
    ];

    // Ưu tiên giao dịch đã thu/hoàn tiền; lần thử thanh toán mới không che mất tiền đã thu.
    private const PAYMENT_PRIORITY = "CASE WHEN status IN ('paid', 'refund_pending', 'refunded', 'completed') THEN 0 ELSE 1 END";

    private function ordersQuery()
    {
        $paymentId = DB::table('payment_transactions')
            ->select('id')
            ->whereColumn('order_id', 'orders.id')
            ->orderByRaw(self::PAYMENT_PRIORITY)
            ->orderByDesc('id')
            ->limit(1);

        $orders = DB::table('orders')
            ->leftJoin('payment_transactions as payment', function ($join) use ($paymentId) {
                $join->on('payment.order_id', '=', 'orders.id')->where('payment.id', '=', $paymentId);
            })
            ->select([
                'orders.id',
                'orders.order_code',
                'orders.user_id',
                'orders.customer_name',
                'orders.customer_email',
                'orders.customer_phone',
                'orders.shipping_address',
                'orders.city',
                'orders.payment_method',
                'orders.total_amount',
                'orders.shipping_fee',
                'orders.discount_amount',
                'orders.order_status',
                'orders.created_at',
                'orders.updated_at',
                'orders.customer_name as name',
                'orders.customer_phone as phone',
                'orders.total_amount as total_price',
                'orders.order_status as status',
                'payment.id as payment_id',
                'payment.paid_at',
            ])
            ->selectRaw("COALESCE(payment.gateway, orders.payment_method, CASE WHEN orders.payment_status IN ('paid', 'completed') THEN 'momo' ELSE 'cod' END) as gateway")
            ->selectRaw("COALESCE(
                CASE WHEN payment.status = 'completed' THEN 'paid' ELSE payment.status END,
                CASE WHEN orders.payment_status = 'completed' THEN 'paid' ELSE orders.payment_status END,
                'pending'
            ) as payment_status");

        return DB::query()->fromSub($orders, 'finance_orders');
    }

    private function filteredOrders(Request $request): array
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', ...($request->filled('date_from') ? ['after_or_equal:date_from'] : [])],
            'min_amount' => ['nullable', 'numeric', 'min:0', 'max:9999999999999.99'],
            'max_amount' => ['nullable', 'numeric', 'min:0', 'max:9999999999999.99', ...($request->filled('min_amount') ? ['gte:min_amount'] : [])],
            'gateway' => ['nullable', Rule::in(['cod', 'momo', 'unknown'])],
            'payment_status' => ['nullable', Rule::in(array_keys(self::STATUSES))],
            'sort' => ['nullable', Rule::in(['newest', 'oldest', 'amount_asc', 'amount_desc'])],
            'page' => ['nullable', 'integer', 'min:1'],
        ], [
            'date_to.after_or_equal' => 'Ngày kết thúc phải từ ngày bắt đầu trở đi.',
            'max_amount.gte' => 'Số tiền tối đa phải lớn hơn hoặc bằng số tiền tối thiểu.',
            '*.date_format' => 'Ngày lọc không hợp lệ (định dạng năm-tháng-ngày).',
            '*.numeric' => 'Số tiền phải là một giá trị số.',
            '*.min' => 'Giá trị bộ lọc nhỏ hơn mức cho phép.',
            '*.in' => 'Giá trị bộ lọc không hợp lệ.',
        ]);

        $query = $this->ordersQuery()->where('created_at', '<=', now());

        if ($request->filled('search')) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('customer_name', 'like', '%'.$search.'%')
                    ->orWhere('phone', 'like', '%'.$search.'%')
                    ->orWhere('customer_phone', 'like', '%'.$search.'%')
                    ->orWhere('order_code', 'like', '%'.$search.'%');
                if (ctype_digit(ltrim($search, '#'))) {
                    $q->orWhere('id', ltrim($search, '#'));
                }
            });
        }

        foreach (['gateway', 'payment_status'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $filters[$field]);
            }
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', Carbon::parse($filters['date_from'])->startOfDay());
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<', Carbon::parse($filters['date_to'])->addDay()->startOfDay());
        }

        foreach (['min_amount' => '>=', 'max_amount' => '<='] as $field => $operator) {
            if ($request->filled($field)) {
                $query->where('total_price', $operator, $filters[$field]);
            }
        }

        return [$query, $filters];
    }

    public function index(Request $request)
    {
        [$query, $filters] = $this->filteredOrders($request);

        // Thống kê toàn bộ kết quả lọc; mỗi đơn chỉ tính một lần.
        $summary = (clone $query)->selectRaw('COUNT(*) as order_count, COALESCE(SUM(total_price), 0) as total_amount')->first();

        $statusTotals = (clone $query)->select('payment_status')
            ->selectRaw('COUNT(*) as order_count, SUM(total_price) as total_amount')
            ->groupBy('payment_status')->get()->keyBy('payment_status');

        $methodTotals = (clone $query)->select('gateway')
            ->selectRaw('COUNT(*) as order_count, SUM(total_price) as total_amount')
            ->selectRaw("SUM(CASE WHEN payment_status IN ('paid', 'completed') THEN total_price ELSE 0 END) as paid_amount")
            ->groupBy('gateway')->get()->keyBy('gateway');

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'filters' => $filters,
                'summary' => [
                    'order_count' => (int) ($summary->order_count ?? 0),
                    'total_amount' => (float) ($summary->total_amount ?? 0),
                ],
                'statusTotals' => $statusTotals,
                'methodTotals' => $methodTotals,
                'statuses' => self::STATUSES,
                'methods' => [
                    'cod' => 'COD (Thanh toán khi nhận hàng)',
                    'momo' => 'Ví điện tử MoMo',
                    'unknown' => 'Chưa xác định',
                ],
            ]);
        }

        return view('admin.finance.index', [
            'filters' => $filters,
            'summary' => $summary,
            'statusTotals' => $statusTotals,
            'methodTotals' => $methodTotals,
            'statuses' => self::STATUSES,
            'methods' => [
                'cod' => 'COD (Thanh toán khi nhận hàng)',
                'momo' => 'Ví điện tử MoMo',
                'unknown' => 'Chưa xác định',
            ],
        ]);
    }

    public function transactions(Request $request)
    {
        [$query, $filters] = $this->filteredOrders($request);

        [$column, $direction] = match ($filters['sort'] ?? 'newest') {
            'oldest' => ['created_at', 'asc'],
            'amount_asc' => ['total_price', 'asc'],
            'amount_desc' => ['total_price', 'desc'],
            default => ['created_at', 'desc'],
        };

        $orders = $query->orderBy($column, $direction)->orderBy('id', $direction)->paginate(15)->withQueryString();

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'orders' => $orders,
                'filters' => $filters,
                'statuses' => self::STATUSES,
                'codTransitions' => self::COD_TRANSITIONS,
                'methods' => [
                    'cod' => 'COD',
                    'momo' => 'MoMo',
                    'unknown' => 'Chưa xác định',
                ],
            ]);
        }

        return view('admin.finance.transactions', [
            'orders' => $orders,
            'filters' => $filters,
            'statuses' => self::STATUSES,
            'codTransitions' => self::COD_TRANSITIONS,
            'methods' => [
                'cod' => 'COD',
                'momo' => 'MoMo',
                'unknown' => 'Chưa xác định',
            ],
        ]);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $data = $request->validate([
            'payment_status' => ['required', Rule::in(array_keys(self::COD_TRANSITIONS))],
            'current_payment_status' => ['required', 'string'],
            'current_order_status' => ['required', 'string'],
            'current_payment_id' => ['required', 'integer', 'min:0'],
        ], [
            'payment_status.in' => 'Trạng thái COD không hợp lệ.',
            '*.required' => 'Thiếu thông tin trạng thái. Vui lòng tải lại trang.',
        ]);

        DB::transaction(function () use ($order, $data, $request) {
            $order = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();

            $payment = $order->paymentTransactions()
                ->orderByRaw(self::PAYMENT_PRIORITY)
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();

            $isCod = $payment ? $payment->gateway === 'cod' : in_array($order->payment_method, ['cod', 'cod_ordered', 'cod_paid'], true);
            if (!$isCod) {
                throw ValidationException::withMessages(['payment_status' => 'Chỉ được cập nhật thủ công cho đơn COD.']);
            }

            $currentStatus = $payment?->status ?? ($order->payment_status === 'paid' || $order->payment_status === 'completed' ? 'paid' : 'pending');
            if ($currentStatus === 'completed') {
                $currentStatus = 'paid';
            }

            if ($currentStatus !== $data['current_payment_status'] || $order->order_status !== $data['current_order_status'] || (int) ($payment?->id ?? 0) !== (int) $data['current_payment_id']) {
                throw ValidationException::withMessages(['payment_status' => 'Đơn hàng vừa thay đổi. Vui lòng tải lại trang trước khi cập nhật.']);
            }

            $newStatus = $data['payment_status'];
            if (!in_array($newStatus, self::COD_TRANSITIONS[$currentStatus] ?? [], true)) {
                throw ValidationException::withMessages(['payment_status' => 'Không thể chuyển sang trạng thái thanh toán này.']);
            }

            if ($newStatus === $currentStatus) {
                return;
            }

            if (in_array($newStatus, ['pending', 'paid'], true) && ($order->order_status === 'cancelled' || in_array($order->order_status, ['cancelled', 'return', 'returned'], true))) {
                throw ValidationException::withMessages(['payment_status' => 'Không thể xác nhận thu tiền cho đơn đã hủy hoặc hoàn hàng.']);
            }

            $userDesc = $request->user() ? '#'.$request->user()->id : 'Admin';
            $attributes = [
                'status' => $newStatus,
                'message' => 'Quản trị viên '.$userDesc.' cập nhật: '.(self::STATUSES[$newStatus] ?? $newStatus),
                'paid_at' => $newStatus === 'paid' ? ($payment?->paid_at ?? now()) : $payment?->paid_at,
            ];

            if ($payment) {
                $payment->update($attributes);
            } else {
                $order->paymentTransactions()->create(array_merge($attributes, [
                    'gateway' => 'cod',
                    'amount' => $order->total_amount,
                ]));
            }

            // Đồng bộ trạng thái thanh toán trên bảng orders mà không phá vỡ logic khác
            if ($newStatus === 'paid') {
                $order->update([
                    'payment_status' => 'paid',
                ]);
            } elseif (in_array($newStatus, ['pending', 'failed'], true)) {
                $order->update([
                    'payment_status' => $newStatus,
                ]);
            } elseif (in_array($newStatus, ['refund_pending', 'refunded'], true)) {
                $order->update([
                    'payment_status' => $newStatus,
                ]);
            }
        });

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'message' => 'Đã lưu trạng thái thanh toán đơn COD #'.($order->order_code ?: $order->id).'.',
            ]);
        }

        return back()->with('success', 'Đã lưu trạng thái thanh toán đơn COD #'.($order->order_code ?: $order->id).'.');
    }
}
