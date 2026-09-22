<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\GHNService;
use Illuminate\Http\Request;

class ShippingController extends Controller
{
    /**
     * Lấy danh sách Tỉnh/Thành phố từ GHN
     */
    public function getProvinces()
    {
        $provinces = GHNService::getProvinces();
        return response()->json($provinces);
    }

    /**
     * Lấy danh sách Quận/Huyện
     */
    public function getDistricts($provinceId)
    {
        $districts = GHNService::getDistricts((int) $provinceId);
        return response()->json($districts);
    }

    /**
     * Lấy danh sách Phường/Xã
     */
    public function getWards($districtId)
    {
        $wards = GHNService::getWards((int) $districtId);
        return response()->json($wards);
    }

    /**
     * Tính phí giao hàng nhanh GHN
     */
    public function calculateFee(Request $request)
    {
        $request->validate([
            'district_id' => 'required|integer',
            'ward_code' => 'required|string',
            'insurance_value' => 'nullable|numeric',
        ]);

        $districtId = (int) $request->district_id;
        $wardCode = (string) $request->ward_code;
        $insuranceValue = (int) ($request->insurance_value ?? 0);

        $result = GHNService::calculateFee($districtId, $wardCode, 1000, $insuranceValue);

        return response()->json($result);
    }

    /**
     * Admin tạo vận đơn Giao Hàng Nhanh
     */
    public function createGhnOrder(Request $request, $orderId)
    {
        $order = Order::with('items')
            ->where('id', $orderId)
            ->orWhere('order_code', $orderId)
            ->firstOrFail();

        $result = GHNService::createShippingOrder($order);

        return response()->json([
            'success' => $result['success'] ?? true,
            'message' => $result['message'] ?? 'Đã tạo vận đơn GHN thành công!',
            'tracking_code' => $result['tracking_code'] ?? null,
            'expected_delivery_time' => $result['expected_delivery_time'] ?? null,
            'order' => [
                'id' => (string) $order->id,
                'order_code' => $order->order_code,
                'status' => $order->order_status,
                'shipping_partner' => $order->shipping_partner,
                'tracking_code' => $order->tracking_code,
            ],
        ]);
    }

    /**
     * Đồng bộ trạng thái đơn hàng thời gian thực từ GHN
     */
    public function syncGhnOrder($orderId)
    {
        $order = Order::with('items')
            ->where('id', $orderId)
            ->orWhere('order_code', $orderId)
            ->firstOrFail();

        if (empty($order->tracking_code) || str_starts_with($order->tracking_code, '#GHN')) {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng này chưa có mã vận đơn thực tế trên GHN để đồng bộ.',
                'order' => $order,
            ]);
        }

        $detail = GHNService::getOrderDetail($order->tracking_code);
        if (!$detail) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy thông tin vận đơn trên hệ thống GHN.',
                'order' => $order,
            ]);
        }

        $ghnStatus = strtolower($detail['status'] ?? '');
        $oldStatus = $order->order_status;
        $updated = false;

        // Nếu GHN báo đã hủy
        if (in_array($ghnStatus, ['cancel', 'cancelled']) && $oldStatus !== 'cancelled') {
            foreach ($order->items as $item) {
                $prod = \App\Models\Product::find($item->product_id);
                if ($prod) {
                    $prod->increment('stock', $item->quantity);
                }
            }
            $order->order_status = 'cancelled';
            $order->cancel_reason = 'Đồng bộ từ GHN: Đơn hàng đã bị hủy trên hệ thống vận chuyển.';
            $order->save();
            $updated = true;
        } elseif (in_array($ghnStatus, ['delivered', 'finish']) && $oldStatus !== 'delivered') {
            $order->order_status = 'delivered';
            $order->payment_status = 'completed';
            $order->save();
            $updated = true;
        }

        return response()->json([
            'success' => true,
            'message' => $updated ? 'Đã đồng bộ trạng thái mới từ GHN!' : 'Trạng thái đơn hàng đang khớp với GHN (' . ($detail['status'] ?? 'N/A') . ').',
            'ghn_status' => $detail['status'] ?? null,
            'order' => $order->fresh('items'),
        ]);
    }

    /**
     * Webhook nhận thông báo tự động từ GHN khi trạng thái vận chuyển thay đổi
     */
    public function handleGhnWebhook(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('GHN Webhook Received:', $request->all());

        $orderCode = $request->input('OrderCode') ?: $request->input('order_code');
        $status = strtolower($request->input('Status') ?: $request->input('status') ?: '');

        if ($orderCode) {
            $order = Order::with('items')->where('tracking_code', $orderCode)->first();
            if ($order) {
                if (in_array($status, ['cancel', 'cancelled']) && $order->order_status !== 'cancelled') {
                    foreach ($order->items as $item) {
                        $prod = \App\Models\Product::find($item->product_id);
                        if ($prod) {
                            $prod->increment('stock', $item->quantity);
                        }
                    }
                    $order->order_status = 'cancelled';
                    $order->cancel_reason = 'GHN Webhook: Đã hủy trên hệ thống GHN';
                    $order->save();
                } elseif (in_array($status, ['delivered', 'finish'])) {
                    $order->order_status = 'delivered';
                    $order->payment_status = 'completed';
                    $order->save();
                }
            }
        }

        return response()->json(['code' => 200, 'message' => 'success']);
    }
}
