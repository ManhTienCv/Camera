<?php

namespace App\Services;

use App\Models\Order;
use App\Models\PaymentTransaction;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MomoService
{
    /**
     * Tạo yêu cầu thanh toán MoMo kết hợp lưu vết PaymentTransaction chuẩn Lab 06
     */
    public function createPayment(Order $order, PaymentTransaction $transaction, ?string $customRedirectUrl = null): array
    {
        $endpoint = config('services.momo.endpoint', 'https://test-payment.momo.vn/v2/gateway/api/create');
        $partnerCode = config('services.momo.partner_code', env('MOMO_PARTNER_CODE', ''));
        $accessKey = config('services.momo.access_key', env('MOMO_ACCESS_KEY', ''));
        $secretKey = config('services.momo.secret_key', env('MOMO_SECRET_KEY', ''));

        $orderInfo = 'Thanh toan don hang #' . ($order->order_code ?: $order->id);
        $rawAmount = (int) round($order->total_amount);
        // MoMo Sandbox (test-payment.momo.vn) giới hạn giao dịch từ 1.000 đến 50.000.000 VND
        if ($rawAmount > 50000000 && str_contains($endpoint, 'test-payment.momo.vn')) {
            $amount = '50000000';
        } elseif ($rawAmount < 1000) {
            $amount = '1000';
        } else {
            $amount = (string) $rawAmount;
        }

        $gatewayOrderId = $order->id . '_' . $transaction->id . '_' . time();
        $redirectUrl = $customRedirectUrl ?: config('services.momo.redirect_url', url('/payment/momo/callback'));
        $ipnUrl = config('services.momo.ipn_url', url('/api/v1/payment/momo/ipn'));
        $extraData = (string) $order->id;
        $requestId = (string) time();
        $requestType = config('services.momo.request_type', env('MOMO_REQUEST_TYPE', 'payWithMethod'));

        $rawHash = 'accessKey=' . $accessKey .
            '&amount=' . $amount .
            '&extraData=' . $extraData .
            '&ipnUrl=' . $ipnUrl .
            '&orderId=' . $gatewayOrderId .
            '&orderInfo=' . $orderInfo .
            '&partnerCode=' . $partnerCode .
            '&redirectUrl=' . $redirectUrl .
            '&requestId=' . $requestId .
            '&requestType=' . $requestType;

        $signature = hash_hmac('sha256', $rawHash, $secretKey);

        $payload = [
            'partnerCode' => $partnerCode,
            'partnerName' => 'CameraHub Store',
            'storeId' => 'CameraHub01',
            'requestId' => $requestId,
            'amount' => (int) $amount,
            'orderId' => $gatewayOrderId,
            'orderInfo' => $orderInfo,
            'redirectUrl' => $redirectUrl,
            'ipnUrl' => $ipnUrl,
            'lang' => 'vi',
            'extraData' => $extraData,
            'requestType' => $requestType,
            'signature' => $signature,
        ];

        $transaction->update([
            'gateway_order_id' => $gatewayOrderId,
            'request_payload' => $payload,
        ]);

        try {
            $verifySsl = filter_var(config('services.momo.verify_ssl', false), FILTER_VALIDATE_BOOLEAN);
            $response = Http::withOptions([
                'verify' => $verifySsl,
                'timeout' => 12,
            ])->post($endpoint, $payload);

            $result = $response->json() ?? [];

            $transaction->update([
                'response_payload' => $result,
                'result_code' => isset($result['resultCode']) ? (int) $result['resultCode'] : null,
                'message' => $result['message'] ?? null,
                'status' => isset($result['payUrl']) ? 'initiated' : 'failed',
            ]);

            if (isset($result['payUrl'])) {
                return [
                    'success' => true,
                    'payUrl' => $result['payUrl'],
                    'qrCodeUrl' => $result['qrCodeUrl'] ?? null,
                    'deeplink' => $result['deeplink'] ?? null,
                    'orderId' => $gatewayOrderId,
                    'amount' => (int) $amount,
                    'message' => $result['message'] ?? 'Thành công',
                ];
            }

            Log::warning('MoMo API returned warning:', ['response' => $result]);
        } catch (\Throwable $e) {
            Log::error('MoMo connection error: ' . $e->getMessage());
        }

        return [
            'success' => false,
            'message' => $result['message'] ?? 'Không thể khởi tạo liên kết thanh toán MoMo Sandbox. Vui lòng thử lại.',
        ];
    }

    /**
     * Kiểm tra MoMo có báo thanh toán thành công hay không (resultCode == 0)
     */
    public function isSuccessful(array $payload): bool
    {
        return (string) ($payload['resultCode'] ?? '') === '0';
    }

    /**
     * Cập nhật giao dịch sau khi MoMo thanh toán thành công
     */
    public function markPaid(PaymentTransaction $transaction, array $payload): void
    {
        $transaction->update([
            'transaction_id' => $payload['transId'] ?? ($payload['orderId'] ?? null),
            'result_code' => (int) ($payload['resultCode'] ?? 0),
            'message' => $payload['message'] ?? 'Thanh toán thành công',
            'response_payload' => $payload,
            'status' => 'paid',
            'paid_at' => Carbon::now(),
        ]);
    }

    /**
     * Cập nhật giao dịch thất bại hoặc bị hủy
     */
    public function markFailed(PaymentTransaction $transaction, array $payload): void
    {
        $transaction->update([
            'transaction_id' => $payload['transId'] ?? null,
            'result_code' => isset($payload['resultCode']) ? (int) $payload['resultCode'] : null,
            'message' => $payload['message'] ?? 'Giao dịch thất bại',
            'response_payload' => $payload,
            'status' => 'failed',
        ]);
    }

    /**
     * Kiểm tra callback MoMo thành công đầy đủ (chữ ký hợp lệ và resultCode == 0)
     */
    public function isValidSuccessfulResponse(array $payload): bool
    {
        return $this->isValidResponse($payload) && $this->isSuccessful($payload);
    }

    /**
     * Kiểm tra tính hợp lệ của chữ ký HMAC-SHA256 phản hồi từ MoMo
     */
    public function isValidResponse(array $payload): bool
    {
        if (!isset($payload['signature'])) {
            return false;
        }

        $accessKey = config('services.momo.access_key', env('MOMO_ACCESS_KEY', ''));
        $secretKey = config('services.momo.secret_key', env('MOMO_SECRET_KEY', ''));

        $rawHash = 'accessKey=' . $accessKey .
            '&amount=' . ($payload['amount'] ?? '') .
            '&extraData=' . ($payload['extraData'] ?? '') .
            '&message=' . ($payload['message'] ?? '') .
            '&orderId=' . ($payload['orderId'] ?? '') .
            '&orderInfo=' . ($payload['orderInfo'] ?? '') .
            '&orderType=' . ($payload['orderType'] ?? '') .
            '&partnerCode=' . ($payload['partnerCode'] ?? '') .
            '&payType=' . ($payload['payType'] ?? '') .
            '&requestId=' . ($payload['requestId'] ?? '') .
            '&responseTime=' . ($payload['responseTime'] ?? '') .
            '&resultCode=' . ($payload['resultCode'] ?? '') .
            '&transId=' . ($payload['transId'] ?? '');

        return hash_equals(
            hash_hmac('sha256', $rawHash, $secretKey),
            (string) $payload['signature']
        );
    }

    /**
     * Lấy ID đơn hàng nội bộ từ extraData
     */
    public function orderId(array $payload): ?int
    {
        $orderId = $payload['extraData'] ?? null;
        return is_numeric($orderId) ? (int) $orderId : null;
    }
}
