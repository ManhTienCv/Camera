<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ReviewController extends Controller
{
    /**
     * Xác định người dùng đang thực hiện request
     */
    protected function resolveUser(Request $request): ?User
    {
        if (Auth::check()) {
            return Auth::user();
        }

        $authHeader = $request->header('Authorization');
        if ($authHeader && Str::startsWith($authHeader, 'Bearer ')) {
            $token = Str::substr($authHeader, 7);
            return User::resolveByToken($token);
        }

        return null;
    }

    /**
     * Lấy danh sách đánh giá thực tế từ Database kèm phân tích số sao (Storefront)
     */
    public function index($productId)
    {
        $product = Product::where('slug', $productId)->orWhere('id', $productId)->firstOrFail();

        $reviews = Review::where('product_id', $product->id)
            ->where('status', 'approved')
            ->with('user:id,name,avatar_url')
            ->orderBy('created_at', 'desc')
            ->get();

        $count = $reviews->count();

        $breakdown = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
        $withImagesCount = 0;
        $sum = 0;

        $formattedReviews = $reviews->map(function ($rev) use (&$breakdown, &$withImagesCount, &$sum) {
            $star = min(5, max(1, (int) $rev->rating));
            $breakdown[$star] = ($breakdown[$star] ?? 0) + 1;
            $sum += $star;

            $images = is_array($rev->images) ? $rev->images : [];
            if (!empty($images)) {
                $withImagesCount++;
            }

            return [
                'id' => (string) $rev->id,
                'productId' => (string) $rev->product_id,
                'orderId' => $rev->order_id ? (string) $rev->order_id : null,
                'userName' => $rev->customer_name ?: ($rev->user ? $rev->user->name : 'Khách hàng ẩn danh'),
                'userAvatar' => $rev->user ? $rev->user->avatar_url : null,
                'rating' => (int) $rev->rating,
                'variant' => $rev->variant ?: 'Phiên bản tiêu chuẩn',
                'comment' => $rev->comment ?: '',
                'images' => $images,
                'isVerifiedPurchase' => (bool) $rev->is_verified_purchase,
                'helpfulCount' => (int) $rev->helpful_count,
                'adminReply' => $rev->admin_reply,
                'repliedAt' => $rev->replied_at ? $rev->replied_at->format('d/m/Y H:i') : null,
                'createdAt' => $rev->created_at ? $rev->created_at->format('d/m/Y') : now()->format('d/m/Y'),
            ];
        });

        $average = $count > 0 ? round($sum / $count, 1) : 5.0;

        $breakdownPercent = [
            5 => $count > 0 ? round(($breakdown[5] / $count) * 100) : 0,
            4 => $count > 0 ? round(($breakdown[4] / $count) * 100) : 0,
            3 => $count > 0 ? round(($breakdown[3] / $count) * 100) : 0,
            2 => $count > 0 ? round(($breakdown[2] / $count) * 100) : 0,
            1 => $count > 0 ? round(($breakdown[1] / $count) * 100) : 0,
        ];

        return response()->json([
            'reviews' => $formattedReviews,
            'stats' => [
                'average' => $average,
                'count' => $count,
                'breakdown' => $breakdown,
                'breakdownPercent' => $breakdownPercent,
                'withImagesCount' => $withImagesCount,
            ],
        ]);
    }

    /**
     * Gửi đánh giá cho sản phẩm - RÀNG BUỘC PHẢI MUA HÀNG THÀNH CÔNG
     */
    public function store(Request $request, $productId)
    {
        $user = $this->resolveUser($request);
        if (!$user) {
            return response()->json([
                'message' => 'Vui lòng đăng nhập tài khoản để gửi đánh giá sản phẩm.',
            ], 401);
        }

        $product = Product::where('slug', $productId)->orWhere('id', $productId)->firstOrFail();

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:5|max:2000',
            'variant' => 'nullable|string|max:255',
            'images' => 'nullable|array',
            'images.*' => 'string',
        ]);

        // 1. Kiểm tra xem người dùng đã từng mua sản phẩm này trong đơn hàng đã giao thành công hay chưa
        $deliveredOrder = Order::where('user_id', $user->id)
            ->whereIn('order_status', ['delivered', 'completed'])
            ->whereHas('items', function ($q) use ($product) {
                $q->where('product_id', $product->id);
            })
            ->latest()
            ->first();

        if (!$deliveredOrder && $user->role !== 'admin') {
            return response()->json([
                'message' => 'Bạn chỉ có thể đánh giá sau khi đã mua sản phẩm này và đơn hàng được giao thành công.',
            ], 403);
        }

        // 2. Kiểm tra nếu đã đánh giá sản phẩm này trước đó
        $existingReview = Review::where('product_id', $product->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingReview) {
            // Cập nhật đánh giá cũ
            $existingReview->update([
                'rating' => $request->rating,
                'comment' => $request->comment,
                'variant' => $request->input('variant', $existingReview->variant),
                'images' => $request->input('images', $existingReview->images),
                'is_verified_purchase' => true,
                'order_id' => $deliveredOrder ? $deliveredOrder->id : $existingReview->order_id,
            ]);
            $review = $existingReview;
        } else {
            // Tạo mới đánh giá
            $review = Review::create([
                'product_id' => $product->id,
                'user_id' => $user->id,
                'order_id' => $deliveredOrder ? $deliveredOrder->id : null,
                'customer_name' => $user->name,
                'rating' => $request->rating,
                'variant' => $request->input('variant', 'Phiên bản tiêu chuẩn'),
                'comment' => $request->comment,
                'images' => $request->input('images', []),
                'is_verified_purchase' => true,
                'helpful_count' => 0,
                'status' => 'approved',
            ]);
        }

        // 3. Tự động tính toán lại rating trung bình và review_count trong bảng products
        $avgRating = Review::where('product_id', $product->id)
            ->where('status', 'approved')
            ->avg('rating') ?: 5.0;

        $reviewCount = Review::where('product_id', $product->id)
            ->where('status', 'approved')
            ->count();

        $product->update([
            'rating' => round($avgRating, 1),
            'review_count' => $reviewCount,
        ]);

        return response()->json([
            'message' => 'Gửi đánh giá thành công! Cảm ơn bạn đã đóng góp phản hồi.',
            'review' => [
                'id' => (string) $review->id,
                'productId' => (string) $review->product_id,
                'orderId' => $review->order_id ? (string) $review->order_id : null,
                'userName' => $review->customer_name,
                'userAvatar' => $user->avatar_url,
                'rating' => (int) $review->rating,
                'variant' => $review->variant,
                'comment' => $review->comment,
                'images' => $review->images ?: [],
                'isVerifiedPurchase' => (bool) $review->is_verified_purchase,
                'helpfulCount' => (int) $review->helpful_count,
                'createdAt' => $review->created_at->format('d/m/Y'),
            ],
            'newProductStats' => [
                'rating' => round($avgRating, 1),
                'review_count' => $reviewCount,
            ],
        ]);
    }

    /**
     * Bấm hữu ích cho đánh giá
     */
    public function helpful($id)
    {
        $review = Review::findOrFail($id);
        $review->increment('helpful_count');

        return response()->json([
            'success' => true,
            'helpful_count' => (int) $review->helpful_count,
        ]);
    }

    /**
     * =========================================================================
     * ADMIN MANAGEMENT APIs (Khớp 100% media_1790132554619.png)
     * =========================================================================
     */

    /**
     * Lấy danh sách đánh giá trong Admin kèm 4 thẻ thống kê
     */
    public function adminIndex(Request $request)
    {
        $query = Review::with([
            'product:id,name,slug,image_url,sku',
            'user:id,name,email,avatar_url',
        ]);

        // 1. Tìm kiếm theo tên người gửi, nội dung bình luận, hoặc tên sản phẩm
        if ($request->filled('q')) {
            $searchTerm = trim($request->q);
            $query->where(function ($q) use ($searchTerm) {
                $q->where('customer_name', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('comment', 'LIKE', "%{$searchTerm}%")
                  ->orWhereHas('product', function ($pq) use ($searchTerm) {
                      $pq->where('name', 'LIKE', "%{$searchTerm}%")
                        ->orWhere('sku', 'LIKE', "%{$searchTerm}%");
                  });
            });
        }

        // 2. Lọc trạng thái kiểm duyệt (Tất cả, Đang hiển thị, Đã ẩn)
        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'approved') {
                $query->where('status', 'approved');
            } elseif ($request->status === 'hidden') {
                $query->where('status', 'hidden');
            }
        }

        // 3. Lọc theo số sao (Tất cả sao, 5, 4, 3, 2, 1)
        if ($request->filled('rating') && $request->rating !== 'all') {
            $query->where('rating', (int) $request->rating);
        }

        $reviews = $query->orderBy('created_at', 'desc')->get();

        $formatted = $reviews->map(function ($rev) {
            return [
                'id' => (string) $rev->id,
                'customer_name' => $rev->customer_name ?: ($rev->user ? $rev->user->name : 'Khách hàng ẩn danh'),
                'customer_email' => $rev->user ? $rev->user->email : null,
                'customer_avatar' => $rev->user ? $rev->user->avatar_url : null,
                'product_id' => (string) $rev->product_id,
                'product_name' => $rev->product ? $rev->product->name : 'Sản phẩm đã xóa',
                'product_slug' => $rev->product ? $rev->product->slug : '',
                'product_image' => $rev->product ? $rev->product->image_url : '',
                'product_sku' => $rev->product ? $rev->product->sku : null,
                'rating' => (int) $rev->rating,
                'variant' => $rev->variant ?: 'Phiên bản tiêu chuẩn',
                'comment' => $rev->comment ?: '',
                'images' => is_array($rev->images) ? $rev->images : [],
                'is_verified_purchase' => (bool) $rev->is_verified_purchase,
                'helpful_count' => (int) $rev->helpful_count,
                'status' => $rev->status, // 'approved' or 'hidden'
                'admin_reply' => $rev->admin_reply,
                'replied_at' => $rev->replied_at ? $rev->replied_at->format('d/m/Y H:i') : null,
                'created_at' => $rev->created_at ? $rev->created_at->format('d/m/Y H:i') : '',
            ];
        });

        // 4. Tính toán 4 thẻ thống kê trên cùng (media_1790132554619.png)
        $total = Review::count();
        $approvedCount = Review::where('status', 'approved')->count();
        $hiddenCount = Review::where('status', 'hidden')->count();
        $averageRating = $approvedCount > 0 ? round(Review::where('status', 'approved')->avg('rating'), 1) : 5.0;
        $fiveStarCount = Review::where('status', 'approved')->where('rating', 5)->count();

        return response()->json([
            'reviews' => $formatted,
            'stats' => [
                'total' => $total,
                'average' => $averageRating,
                'approved_count' => $approvedCount,
                'hidden_count' => $hiddenCount,
                'five_star_count' => $fiveStarCount,
            ],
        ]);
    }

    /**
     * Chuyển đổi trạng thái Ẩn / Hiển thị đánh giá
     */
    public function adminToggleStatus($id)
    {
        $review = Review::findOrFail($id);
        $review->status = $review->status === 'approved' ? 'hidden' : 'approved';
        $review->save();

        // Đồng bộ lại điểm sao trên bảng sản phẩm
        $product = Product::find($review->product_id);
        if ($product) {
            $avg = Review::where('product_id', $product->id)->where('status', 'approved')->avg('rating') ?: 5.0;
            $count = Review::where('product_id', $product->id)->where('status', 'approved')->count();
            $product->update([
                'rating' => round($avg, 1),
                'review_count' => $count,
            ]);
        }

        return response()->json([
            'message' => $review->status === 'approved' ? 'Đã cho phép hiển thị đánh giá công khai!' : 'Đã ẩn đánh giá khỏi trang web!',
            'status' => $review->status,
        ]);
    }

    /**
     * Admin gửi phản hồi chính thức cho đánh giá của khách
     */
    public function adminReply(Request $request, $id)
    {
        $request->validate([
            'reply' => 'required|string|min:2|max:2000',
        ]);

        $review = Review::findOrFail($id);
        $review->update([
            'admin_reply' => trim($request->reply),
            'replied_at' => now(),
        ]);

        return response()->json([
            'message' => 'Đã gửi phản hồi đánh giá thành công!',
            'admin_reply' => $review->admin_reply,
            'replied_at' => $review->replied_at->format('d/m/Y H:i'),
        ]);
    }

    /**
     * Xóa đánh giá vi phạm
     */
    public function adminDestroy($id)
    {
        $review = Review::findOrFail($id);
        $productId = $review->product_id;
        $review->delete();

        // Đồng bộ lại điểm sao trên bảng sản phẩm
        $product = Product::find($productId);
        if ($product) {
            $avg = Review::where('product_id', $product->id)->where('status', 'approved')->avg('rating') ?: 5.0;
            $count = Review::where('product_id', $product->id)->where('status', 'approved')->count();
            $product->update([
                'rating' => round($avg, 1),
                'review_count' => $count,
            ]);
        }

        return response()->json([
            'message' => 'Đã xóa đánh giá thành công!',
        ]);
    }
}
