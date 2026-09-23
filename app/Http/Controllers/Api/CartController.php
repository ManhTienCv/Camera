<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Request;

class CartController extends Controller
{
    private function getCart(Request $request)
    {
        $sessionId = $request->header('X-Session-ID') ?: $request->input('session_id');
        if (!$sessionId) {
            $sessionId = 'sess_' . bin2hex(random_bytes(16));
        }

        $cart = Cart::firstOrCreate(['session_id' => $sessionId]);

        return $cart;
    }

    public function show(Request $request)
    {
        $cart = $this->getCart($request);
        $cart->load(['items.product.images', 'items.product.specifications']);

        $items = $cart->items->map(function ($item) {
            $product = $item->product;
            $formattedProduct = null;
            if ($product) {
                $gallery = $product->images->pluck('image_url')->toArray();
                if (empty($gallery) && $product->image_url) {
                    $gallery = [$product->image_url];
                }

                $specs = [];
                foreach ($product->specifications as $spec) {
                    $specs[$spec->spec_key] = $spec->spec_value;
                }

                $formattedProduct = [
                    'id' => (string) $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'brand' => $product->brand ?? '',
                    'description' => $product->description ?? '',
                    'price' => (float) $product->price,
                    'original_price' => $product->original_price ? (float) $product->original_price : null,
                    'category_id' => (string) $product->category_id,
                    'image_url' => $product->image_url ?? ($gallery[0] ?? ''),
                    'gallery' => $gallery,
                    'specs' => $specs,
                    'rating' => (float) $product->rating,
                    'review_count' => (int) $product->review_count,
                    'stock' => (int) $product->stock,
                ];
            }

            return [
                'id' => (string) $item->id,
                'cart_id' => (string) $item->cart_id,
                'product_id' => (string) $item->product_id,
                'quantity' => (int) $item->quantity,
                'created_at' => $item->created_at->toISOString(),
                'product' => $formattedProduct,
            ];
        });

        return response()->json([
            'id' => (string) $cart->id,
            'session_id' => $cart->session_id,
            'items' => $items,
        ]);
    }

    public function addItem(Request $request)
    {
        $request->validate([
            'product_id' => 'required',
            'quantity' => 'nullable|integer|min:1',
        ]);

        $cart = $this->getCart($request);
        $productId = $request->product_id;
        $quantity = (int) $request->input('quantity', 1);

        $product = Product::findOrFail($productId);
        $cartItem = CartItem::where('cart_id', $cart->id)
            ->where('product_id', $productId)
            ->first();

        $currentQty = $cartItem ? $cartItem->quantity : 0;
        if ($currentQty + $quantity > $product->stock) {
            return response()->json([
                'message' => "Số lượng yêu cầu vượt quá tồn kho hiện có ({$product->stock} sản phẩm).",
            ], 400);
        }

        if ($cartItem) {
            $cartItem->quantity += $quantity;
            $cartItem->save();
        } else {
            $cartItem = CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $productId,
                'quantity' => $quantity,
            ]);
        }

        return $this->show($request);
    }

    public function updateItem(Request $request, $id)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $cart = $this->getCart($request);
        $cartItem = CartItem::where('id', $id)->where('cart_id', $cart->id)->firstOrFail();
        $product = Product::findOrFail($cartItem->product_id);

        if ($request->quantity > $product->stock) {
            return response()->json([
                'message' => "Số lượng cập nhật vượt quá tồn kho ({$product->stock} sản phẩm).",
            ], 400);
        }

        $cartItem->quantity = $request->quantity;
        $cartItem->save();

        return $this->show($request);
    }

    public function removeItem(Request $request, $id)
    {
        $cart = $this->getCart($request);
        $cartItem = CartItem::where('id', $id)->where('cart_id', $cart->id)->firstOrFail();
        $cartItem->delete();

        return $this->show($request);
    }

    public function clear(Request $request)
    {
        $cart = $this->getCart($request);
        CartItem::where('cart_id', $cart->id)->delete();

        return response()->json(['message' => 'Cart cleared successfully']);
    }
}
