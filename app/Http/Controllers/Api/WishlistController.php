<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class WishlistController extends Controller
{
    protected function resolveUser(Request $request): ?User
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
     * Lấy danh sách sản phẩm yêu thích của người dùng
     */
    public function index(Request $request)
    {
        $user = $this->resolveUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $wishlists = Wishlist::where('user_id', $user->id)
            ->with(['product.category', 'product.brandModel', 'product.images', 'product.specifications'])
            ->latest()
            ->get();

        $products = $wishlists->map(function ($w) {
            $p = $w->product;
            if (!$p) return null;

            $gallery = $p->images ? $p->images->pluck('image_url')->toArray() : [];
            if (empty($gallery) && $p->image_url) {
                $gallery = [$p->image_url];
            }

            return [
                'id' => (string) $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'brand' => $p->brand ?? '',
                'description' => $p->description ?? '',
                'price' => (float) $p->price,
                'original_price' => $p->original_price ? (float) $p->original_price : null,
                'category_id' => (string) $p->category_id,
                'image_url' => $p->image_url ?? ($gallery[0] ?? ''),
                'gallery' => $gallery,
                'rating' => (float) $p->rating,
                'review_count' => (int) $p->review_count,
                'stock' => (int) $p->stock,
                'is_featured' => (bool) $p->is_featured,
                'is_new' => (bool) $p->is_new,
            ];
        })->filter()->values();

        return response()->json($products);
    }

    /**
     * Lấy danh sách ID các sản phẩm đã thích (cho giao diện hiển thị tim đỏ nhanh)
     */
    public function ids(Request $request)
    {
        $user = $this->resolveUser($request);
        if (!$user) {
            return response()->json([]);
        }

        $productIds = Wishlist::where('user_id', $user->id)
            ->pluck('product_id')
            ->map(fn ($id) => (string) $id)
            ->all();

        return response()->json($productIds);
    }

    /**
     * Thêm hoặc xóa sản phẩm khỏi Wishlist
     */
    public function toggle(Request $request)
    {
        $user = $this->resolveUser($request);
        if (!$user) {
            return response()->json([
                'message' => 'Vui lòng đăng nhập để lưu sản phẩm vào danh sách yêu thích.',
            ], 401);
        }

        $request->validate([
            'product_id' => 'required',
        ]);

        $productId = $request->product_id;
        $product = Product::where('id', $productId)->orWhere('slug', $productId)->firstOrFail();

        $existing = Wishlist::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json([
                'in_wishlist' => false,
                'message' => "Đã xóa '{$product->name}' khỏi danh sách yêu thích.",
            ]);
        }

        Wishlist::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
        ]);

        return response()->json([
            'in_wishlist' => true,
            'message' => "Đã thêm '{$product->name}' vào danh sách yêu thích!",
        ]);
    }
}
