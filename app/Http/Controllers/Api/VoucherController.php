<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\Request;

class VoucherController extends Controller
{
    /**
     * Lấy danh sách các mã giảm giá đang mở (Phía Khách hàng)
     */
    public function available()
    {
        $vouchers = Voucher::where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->where(function ($q) {
                $q->where('usage_limit', 0)->orWhereRaw('used_count < usage_limit');
            })
            ->orderBy('min_order_amount', 'asc')
            ->get();

        return response()->json($vouchers);
    }

    /**
     * Áp dụng mã giảm giá khi đặt hàng
     */
    public function apply(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'order_amount' => 'required|numeric|min:0',
        ]);

        $code = strtoupper(trim($request->code));
        $orderAmount = (float) $request->order_amount;

        $voucher = Voucher::where('code', $code)->first();

        if (!$voucher) {
            return response()->json([
                'valid' => false,
                'message' => 'Mã giảm giá không tồn tại hoặc không chính xác.',
            ], 404);
        }

        $validation = $voucher->isValid($orderAmount);
        if (!$validation['valid']) {
            return response()->json([
                'valid' => false,
                'message' => $validation['message'],
            ], 400);
        }

        $discountAmount = $voucher->calculateDiscount($orderAmount);
        $finalAmount = max(0, $orderAmount - $discountAmount);

        return response()->json([
            'valid' => true,
            'message' => 'Áp dụng mã ưu đãi thành công!',
            'voucher' => [
                'code' => $voucher->code,
                'name' => $voucher->name,
                'discount_type' => $voucher->discount_type,
                'discount_value' => (float) $voucher->discount_value,
                'discount_amount' => $discountAmount,
                'final_amount' => $finalAmount,
            ],
        ]);
    }

    /**
     * Danh sách voucher trong Admin Panel (Kèm bộ lọc & 3 thẻ thống kê)
     */
    public function adminIndex(Request $request)
    {
        $query = Voucher::query();

        // 1. Tìm kiếm theo mã hoặc tên chương trình
        if ($request->filled('q')) {
            $searchTerm = trim($request->q);
            $query->where(function ($q) use ($searchTerm) {
                $q->where('code', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('name', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('description', 'LIKE', "%{$searchTerm}%");
            });
        }

        // 2. Lọc trạng thái (Tất cả, Đang hiệu lực, Tạm ngưng)
        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'active') {
                $query->where('status', 'active');
            } elseif ($request->status === 'inactive') {
                $query->where('status', 'inactive');
            }
        }

        $vouchers = $query->orderBy('created_at', 'desc')->get();

        // 3. Tính toán 3 chỉ số thống kê cho hàng thẻ trên cùng
        $totalVouchers = Voucher::count();
        $activeVouchers = Voucher::where('status', 'active')->count();
        $totalUsed = (int) Voucher::sum('used_count');

        return response()->json([
            'vouchers' => $vouchers,
            'stats' => [
                'total_vouchers' => $totalVouchers,
                'active_vouchers' => $activeVouchers,
                'total_used' => $totalUsed,
            ],
        ]);
    }

    /**
     * Tạo voucher mới trong Admin
     */
    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:50|unique:vouchers,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'discount_type' => 'required|in:fixed,percent',
            'discount_value' => 'required|numeric|min:1',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:0',
            'expires_at' => 'nullable|date',
            'status' => 'nullable|in:active,inactive',
        ]);

        $voucher = Voucher::create([
            'code' => strtoupper(trim($request->code)),
            'name' => trim($request->name),
            'description' => $request->description ? trim($request->description) : null,
            'discount_type' => $request->discount_type,
            'discount_value' => (float) $request->discount_value,
            'min_order_amount' => (float) ($request->min_order_amount ?? 0),
            'max_discount_amount' => $request->max_discount_amount ? (float) $request->max_discount_amount : null,
            'usage_limit' => (int) ($request->usage_limit ?? 100),
            'used_count' => 0,
            'expires_at' => $request->expires_at ? date('Y-m-d H:i:s', strtotime($request->expires_at)) : null,
            'status' => $request->status ?? 'active',
        ]);

        return response()->json([
            'message' => 'Tạo mã voucher khuyến mãi mới thành công!',
            'voucher' => $voucher,
        ], 201);
    }

    /**
     * Cập nhật voucher
     */
    public function update(Request $request, $id)
    {
        $voucher = Voucher::findOrFail($id);

        $request->validate([
            'code' => 'required|string|max:50|unique:vouchers,code,' . $voucher->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'discount_type' => 'required|in:fixed,percent',
            'discount_value' => 'required|numeric|min:1',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:0',
            'expires_at' => 'nullable|date',
            'status' => 'nullable|in:active,inactive',
        ]);

        $voucher->update([
            'code' => strtoupper(trim($request->code)),
            'name' => trim($request->name),
            'description' => $request->description ? trim($request->description) : null,
            'discount_type' => $request->discount_type,
            'discount_value' => (float) $request->discount_value,
            'min_order_amount' => (float) ($request->min_order_amount ?? 0),
            'max_discount_amount' => $request->max_discount_amount ? (float) $request->max_discount_amount : null,
            'usage_limit' => (int) ($request->usage_limit ?? 100),
            'expires_at' => $request->expires_at ? date('Y-m-d H:i:s', strtotime($request->expires_at)) : null,
            'status' => $request->status ?? $voucher->status,
        ]);

        return response()->json([
            'message' => 'Cập nhật thông tin voucher thành công!',
            'voucher' => $voucher,
        ]);
    }

    /**
     * Bật / Tắt trạng thái hoạt động của voucher
     */
    public function toggleStatus($id)
    {
        $voucher = Voucher::findOrFail($id);
        $voucher->status = $voucher->status === 'active' ? 'inactive' : 'active';
        $voucher->save();

        return response()->json([
            'message' => $voucher->status === 'active' ? 'Đã kích hoạt voucher!' : 'Đã tạm ngưng voucher!',
            'voucher' => $voucher,
        ]);
    }

    /**
     * Xóa voucher
     */
    public function destroy($id)
    {
        $voucher = Voucher::findOrFail($id);
        $voucher->delete();

        return response()->json([
            'message' => "Đã xóa mã voucher '{$voucher->code}' thành công!",
        ]);
    }
}
