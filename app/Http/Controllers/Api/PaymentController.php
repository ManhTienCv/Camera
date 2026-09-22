<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Services\MomoService;
use App\Services\GHNService;
use App\Services\EmailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    protected MomoService $momoService;

    public function __construct(MomoService $momoService)
    {
        $this->momoService = $momoService;
    }

    /**
     * 1. Khởi tạo giao dịch thanh toán MoMo (lần đầu)
     */
    public function createMomoPayment(Request $request)
    {
        $request->validate([
            'order_id' => 'required',
            'redirect_url' => 'nullable|string',
        ]);

        $order = Order::where('id', $request->order_id)
            ->orWhere('order_code', $request->order_id)
            ->firstOrFail();

        $redirectUrl = $request->redirect_url ?: url('/payment/momo/callback');

        // Tạo bản ghi nhật ký giao dịch tài chính
        $transaction = PaymentTransaction::create([
            'order_id' => $order->id,
            'gateway' => 'momo',
            'amount' => $order->total_amount,
            'status' => 'pending',
            'message' => 'Khởi tạo thanh toán Ví MoMo',
        ]);

        $result = $this->momoService->createPayment($order, $transaction, $redirectUrl);

        if ($result['success'] && !empty($result['payUrl'])) {
            $order->payment_method = 'momo';
            $order->save();

            return response()->json([
                'success' => true,
                'payUrl' => $result['payUrl'],
                'qrCodeUrl' => $result['qrCodeUrl'] ?? null,
                'deeplink' => $result['deeplink'] ?? null,
                'transaction_id' => $transaction->id,
                'order' => [
                    'id' => (string) $order->id,
                    'order_code' => $order->order_code,
                    'total_amount' => (float) $order->total_amount,
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $result['message'] ?? 'Không thể khởi tạo link thanh toán MoMo.',
        ], 400);
    }

    /**
     * 2. Thanh toán lại bằng MoMo (Pay Again - Chuẩn Lab 06 Mục 3)
     * Khi khách thanh toán thất bại hoặc hủy trên MoMo, gọi hàm này để thử lại mà không tạo đơn hàng mới!
     */
    public function payAgain(Request $request, $orderId)
    {
        $order = Order::where('id', $orderId)
            ->orWhere('order_code', $orderId)
            ->firstOrFail();

        if ($order->payment_status === 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng này đã được thanh toán hoàn tất trước đó.',
            ], 400);
        }

        if ($order->order_status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng này đã bị hủy, không thể thanh toán lại.',
            ], 400);
        }

        $redirectUrl = $request->input('redirect_url') ?: url('/payment/momo/callback');

        // Tạo bản ghi giao dịch mới cho lần thử này
        $transaction = PaymentTransaction::create([
            'order_id' => $order->id,
            'gateway' => 'momo',
            'amount' => $order->total_amount,
            'status' => 'pending',
            'message' => 'Thử thanh toán lại qua Ví MoMo',
        ]);

        $result = $this->momoService->createPayment($order, $transaction, $redirectUrl);

        if ($result['success'] && !empty($result['payUrl'])) {
            $order->payment_method = 'momo';
            $order->save();

            return response()->json([
                'success' => true,
                'payUrl' => $result['payUrl'],
                'qrCodeUrl' => $result['qrCodeUrl'] ?? null,
                'deeplink' => $result['deeplink'] ?? null,
                'order_id' => (string) $order->id,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $result['message'] ?? 'Không thể khởi tạo thanh toán lại qua MoMo.',
        ], 400);
    }

    /**
     * 3. Webhook IPN nhận từ MoMo server
     */
    public function handleMomoIpn(Request $request)
    {
        Log::info('MoMo IPN Callback Received:', $request->except('signature'));

        $data = $request->all();

        // 1. Kiểm tra chữ ký bảo mật IPN
        if (!$this->momoService->isValidResponse($data)) {
            Log::warning('MoMo IPN Invalid Signature!');
            return response()->json(['message' => 'Invalid signature'], 400);
        }

        $orderId = $this->momoService->orderId($data);
        $gatewayOrderId = $data['orderId'] ?? '';

        // Tìm transaction tương ứng
        $transaction = PaymentTransaction::where('gateway', 'momo')
            ->where(function ($q) use ($gatewayOrderId, $orderId) {
                $q->where('gateway_order_id', $gatewayOrderId);
                if ($orderId) {
                    $q->orWhere('order_id', $orderId);
                }
            })
            ->latest()
            ->first();

        $order = null;
        if ($transaction) {
            $order = Order::find($transaction->order_id);
        } elseif ($orderId) {
            $order = Order::find($orderId);
        }

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if ($this->momoService->isSuccessful($data)) {
            if ($transaction) {
                $this->momoService->markPaid($transaction, $data);
            }

            $order->payment_status = 'completed';
            $order->order_status = 'shipping'; // Duyệt sang vận chuyển
            $order->payment_method = 'momo';
            $order->save();

            // Tự động khởi tạo vận đơn GHN sau khi thanh toán MoMo thành công (Lab 06 Mục 3)
            if (empty($order->tracking_code)) {
                try {
                    GHNService::createShippingOrder($order);
                } catch (\Throwable $e) {
                    Log::error('Auto GHN create after MoMo paid error: ' . $e->getMessage());
                }
            }

            // Gửi email hóa đơn xác nhận tự động
            try {
                EmailService::sendOrderConfirmation($order->fresh('items'));
            } catch (\Throwable $e) {
                Log::error('Send order confirmation email on MoMo IPN error: ' . $e->getMessage());
            }

            Log::info("MoMo Order #{$order->id} ({$order->order_code}) paid successfully!");
        } else {
            if ($transaction) {
                $this->momoService->markFailed($transaction, $data);
            }

            $order->payment_status = 'failed';
            $order->save();
            Log::warning("MoMo Order #{$order->id} payment failed! Code: " . ($data['resultCode'] ?? -1));
        }

        return response()->json(['message' => 'IPN Processed successfully'], 200);
    }

    /**
     * 4. Callback khi khách thanh toán xong quay về Website
     */
    public function handleMomoCallback(Request $request)
    {
        $data = $request->all();
        Log::info('MoMo User Return Callback:', $data);

        $orderId = $this->momoService->orderId($data);
        $order = $orderId ? Order::find($orderId) : null;

        if (!$order && isset($data['orderId'])) {
            $transaction = PaymentTransaction::where('gateway_order_id', $data['orderId'])->first();
            if ($transaction) {
                $order = Order::find($transaction->order_id);
            }
        }

        if (!$order) {
            return redirect('/orders');
        }

        if ($this->momoService->isValidResponse($data) && $this->momoService->isSuccessful($data)) {
            $transaction = PaymentTransaction::where('order_id', $order->id)->latest()->first();
            if ($transaction) {
                $this->momoService->markPaid($transaction, $data);
            }

            $order->payment_status = 'completed';
            $order->order_status = 'shipping';
            $order->save();

            if (empty($order->tracking_code)) {
                try {
                    GHNService::createShippingOrder($order);
                } catch (\Throwable $e) {
                    Log::error('Auto GHN create after MoMo callback error: ' . $e->getMessage());
                }
            }

            return redirect('/order-success?id=' . $order->id . '&momo=1');
        }

        // Trường hợp giao dịch thất bại hoặc người dùng bấm Hủy
        $transaction = PaymentTransaction::where('order_id', $order->id)->latest()->first();
        if ($transaction) {
            $this->momoService->markFailed($transaction, $data);
        }

        $order->payment_status = 'failed';
        $order->save();

        return redirect('/orders?momo_failed=1&order_id=' . $order->id);
    }
}
