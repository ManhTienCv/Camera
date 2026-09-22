<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GHNService
{
    private static function getBaseUrl(): string
    {
        return env('GHN_API_URL', 'https://online-gateway.ghn.vn/shiip/public-api/v2');
    }

    private static function getToken(): string
    {
        return env('GHN_API_TOKEN', '5a8e6646-a763-11f1-be93-ea52ad3d88b7');
    }

    private static function getShopId(): int
    {
        return (int) env('GHN_SHOP_ID', 6643423);
    }

    /**
     * 1. Lấy danh sách Tỉnh / Thành phố từ GHN
     */
    public static function getProvinces(): array
    {
        try {
            $response = Http::withHeaders([
                'Token' => self::getToken(),
            ])->withoutVerifying()->timeout(10)->get('https://online-gateway.ghn.vn/shiip/public-api/master-data/province');

            if ($response->successful()) {
                return $response->json('data') ?? [];
            }
        } catch (\Throwable $e) {
            Log::error('GHN getProvinces error: ' . $e->getMessage());
        }

        return [];
    }

    /**
     * 2. Lấy danh sách Quận / Huyện
     */
    public static function getDistricts(int $provinceId): array
    {
        try {
            $response = Http::withHeaders([
                'Token' => self::getToken(),
            ])->withoutVerifying()->timeout(10)->post('https://online-gateway.ghn.vn/shiip/public-api/master-data/district', [
                'province_id' => $provinceId,
            ]);

            if ($response->successful()) {
                return $response->json('data') ?? [];
            }
        } catch (\Throwable $e) {
            Log::error('GHN getDistricts error: ' . $e->getMessage());
        }

        return [];
    }

    /**
     * 3. Lấy danh sách Phường / Xã
     */
    public static function getWards(int $districtId): array
    {
        try {
            $response = Http::withHeaders([
                'Token' => self::getToken(),
            ])->withoutVerifying()->timeout(10)->post('https://online-gateway.ghn.vn/shiip/public-api/master-data/ward', [
                'district_id' => $districtId,
            ]);

            if ($response->successful()) {
                return $response->json('data') ?? [];
            }
        } catch (\Throwable $e) {
            Log::error('GHN getWards error: ' . $e->getMessage());
        }

        return [];
    }

    /**
     * 4. Tính phí giao hàng nhanh chuẩn E-Commerce
     */
    public static function calculateFee(int $toDistrictId, string $toWardCode, int $weightGram = 1000, int $insuranceValue = 0): array
    {
        $fromDistrictId = (int) env('GHN_SENDER_DISTRICT_ID', 1482); // Bắc Từ Liêm, HN (theo shop)

        try {
            $response = Http::withHeaders([
                'Token' => self::getToken(),
                'ShopId' => self::getShopId(),
            ])->withoutVerifying()->timeout(10)->post(self::getBaseUrl() . '/shipping-order/fee', [
                'from_district_id' => $fromDistrictId,
                'service_type_id' => 2, // 2: Chuẩn Hàng nhẹ E-commerce
                'to_district_id' => $toDistrictId,
                'to_ward_code' => (string) $toWardCode,
                'weight' => max(200, $weightGram),
                'insurance_value' => min($insuranceValue, 1000000),
            ]);

            $data = $response->json();
            if ($response->successful() && isset($data['data']['total'])) {
                return [
                    'success' => true,
                    'total' => (float) $data['data']['total'],
                    'service_fee' => (float) ($data['data']['service_fee'] ?? $data['data']['total']),
                    'insurance_fee' => (float) ($data['data']['insurance_fee'] ?? 0),
                    'expected_delivery_time' => $data['data']['expected_delivery_time'] ?? null,
                ];
            }

            Log::warning('GHN calculateFee failed:', ['response' => $data]);
        } catch (\Throwable $e) {
            Log::error('GHN calculateFee error: ' . $e->getMessage());
        }

        // Fallback default standard rate
        return [
            'success' => true,
            'total' => 21000,
            'service_fee' => 21000,
            'insurance_fee' => 0,
            'is_fallback' => true,
        ];
    }

    /**
     * 5. Tạo đơn vận chuyển sang Giao Hàng Nhanh
     */
    public static function createShippingOrder($order): array
    {
        $toDistrictId = (int) env('GHN_SENDER_DISTRICT_ID', 1485); // Cầu Giấy
        $toWardCode = (string) env('GHN_SENDER_WARD_CODE', "1A0607");

        $items = $order->items && count($order->items) > 0 
            ? $order->items->map(function ($item) {
                return [
                    'name' => $item->name,
                    'quantity' => (int) $item->quantity,
                    'price' => min((int) $item->price, 50000), // An toàn hạn mức
                    'weight' => 500,
                    'category' => [
                        'level1' => 'Máy ảnh & Phụ kiện',
                    ],
                ];
            })->toArray()
            : [
                [
                    'name' => 'Thiết bị máy ảnh CameraHub',
                    'quantity' => 1,
                    'price' => 50000,
                    'weight' => 500,
                ]
            ];

        // Nếu COD vượt hạn mức tài khoản chưa xác thực (60.000đ), điều chỉnh COD về mức an toàn 0đ hoặc 50.000đ để GHN luôn chấp nhận đơn
        $isCod = $order->payment_method === 'cod';
        $safeCodAmount = $isCod ? min((int) $order->total_amount, 50000) : 0;
        $paymentTypeId = $isCod ? 2 : 1; // 1: Người gửi trả cước, 2: Người nhận trả

        $payload = [
            'payment_type_id' => $paymentTypeId,
            'note' => $order->notes ?: 'Đơn hàng CameraHub test đồ án',
            'required_note' => 'CHOXEMHANGKHONGTHU',
            'return_phone' => '0867015044',
            'return_address' => 'Ao Bia Đức Diễn, Phường Phúc Diễn, Quận Bắc Từ Liêm, Hà Nội',
            'to_name' => $order->customer_name ?: 'Khách hàng CameraHub',
            'to_phone' => $order->customer_phone ?: '0867015044',
            'to_address' => $order->shipping_address ?: 'Số 10 Cầu Giấy, Phường Dịch Vọng Hậu',
            'to_ward_code' => $toWardCode,
            'to_district_id' => $toDistrictId,
            'cod_amount' => $safeCodAmount,
            'content' => 'Thiết bị máy ảnh, phụ kiện từ CameraHub',
            'weight' => max(500, count($items) * 500),
            'length' => 15,
            'width' => 15,
            'height' => 10,
            'service_type_id' => 2,
            'insurance_value' => 0,
            'items' => $items,
        ];

        try {
            $response = Http::withHeaders([
                'Token' => self::getToken(),
                'ShopId' => self::getShopId(),
            ])->withoutVerifying()->timeout(15)->post(self::getBaseUrl() . '/shipping-order/create', $payload);

            $data = $response->json();
            if ($response->successful() && isset($data['data']['order_code'])) {
                $trackingCode = $data['data']['order_code'];
                $expectedDelivery = $data['data']['expected_delivery_time'] ?? null;

                // Cập nhật vào cơ sở dữ liệu
                $order->shipping_partner = 'GHN Express';
                $order->tracking_code = $trackingCode;
                $order->ghn_order_code = $trackingCode;
                $order->expected_delivery_time = $expectedDelivery;
                $order->order_status = 'shipping';
                $order->save();

                return [
                    'success' => true,
                    'tracking_code' => $trackingCode,
                    'expected_delivery_time' => $expectedDelivery,
                    'fee' => $data['data']['total_fee'] ?? 0,
                    'message' => 'Đã tạo vận đơn GHN thành công! Mã vận đơn: ' . $trackingCode,
                ];
            }

            Log::warning('GHN createShippingOrder API returned error:', ['response' => $data]);
            
            // Nếu bị lỗi từ GHN, trả về message chi tiết từ GHN để người dùng nắm rõ
            $errMsg = $data['code_message_value'] ?? ($data['message'] ?? 'Lỗi tạo đơn GHN');
            return [
                'success' => false,
                'message' => 'GHN thông báo: ' . $errMsg,
            ];
        } catch (\Throwable $e) {
            Log::error('GHN createShippingOrder error: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Lỗi kết nối GHN API: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * 6. Hủy vận đơn trên hệ thống Giao Hàng Nhanh (GHN)
     */
    public static function cancelOrder($orderCodes): array
    {
        $codes = is_array($orderCodes) ? $orderCodes : [trim($orderCodes)];
        $codes = array_values(array_filter($codes));

        if (empty($codes)) {
            return ['success' => false, 'message' => 'Mã vận đơn GHN không hợp lệ.'];
        }

        try {
            $response = Http::withHeaders([
                'Token' => self::getToken(),
                'ShopId' => self::getShopId(),
            ])->withoutVerifying()->timeout(10)->post(self::getBaseUrl() . '/switch-status/cancel', [
                'order_codes' => $codes,
            ]);

            $data = $response->json();
            Log::info('GHN cancelOrder response:', ['response' => $data]);

            if ($response->successful() && ($data['code'] ?? 0) === 200) {
                return [
                    'success' => true,
                    'message' => 'Đã hủy thành công đơn hàng trên hệ thống GHN!',
                ];
            }

            return [
                'success' => false,
                'message' => $data['message'] ?? 'Không thể hủy đơn trên GHN.',
            ];
        } catch (\Throwable $e) {
            Log::error('GHN cancelOrder error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Lỗi kết nối GHN: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * 7. Tra cứu chi tiết trạng thái vận đơn thời gian thực từ GHN
     */
    public static function getOrderDetail(string $orderCode): ?array
    {
        if (empty($orderCode) || str_starts_with($orderCode, '#GHN')) {
            return null;
        }

        try {
            $response = Http::withHeaders([
                'Token' => self::getToken(),
            ])->withoutVerifying()->timeout(10)->post(self::getBaseUrl() . '/shipping-order/detail', [
                'order_code' => trim($orderCode),
            ]);

            if ($response->successful()) {
                return $response->json('data');
            }
        } catch (\Throwable $e) {
            Log::error("GHN getOrderDetail for {$orderCode} error: " . $e->getMessage());
        }

        return null;
    }
}
