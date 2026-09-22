<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'images', 'specifications', 'features']);

        if (!$request->has('include_inactive')) {
            $query->where('status', 'active');
        }

        if ($request->has('category') && !empty($request->category)) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->category);
            });
        }

        if ($request->has('brand') && !empty($request->brand)) {
            $query->where(function ($q) use ($request) {
                $q->where('brand', 'LIKE', '%' . $request->brand . '%')
                  ->orWhereHas('brandModel', function ($bq) use ($request) {
                      $bq->where('slug', $request->brand);
                  });
            });
        }

        if ($request->has('q') && !empty($request->q)) {
            $searchTerm = $request->q;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('description', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('sku', 'LIKE', "%{$searchTerm}%");
            });
        }

        if ($request->has('sort')) {
            switch ($request->sort) {
                case 'price-asc':
                    $query->orderBy('price', 'asc');
                    break;
                case 'price-desc':
                    $query->orderBy('price', 'desc');
                    break;
                case 'rating':
                    $query->orderBy('rating', 'desc');
                    break;
                case 'newest':
                default:
                    $query->orderBy('created_at', 'desc');
                    break;
            }
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $products = $query->get()->map(function ($product) {
            return $this->formatProduct($product);
        });

        return response()->json($products);
    }

    public function featured(Request $request)
    {
        $type = $request->get('type', 'featured');

        $query = Product::where('status', 'active')->with(['images', 'specifications', 'features']);

        if ($type === 'new') {
            $query->where('is_new', true);
        } else {
            $query->where('is_featured', true);
        }

        $products = $query->take(8)->get()->map(function ($product) {
            return $this->formatProduct($product);
        });

        return response()->json($products);
    }

    public function search(Request $request)
    {
        $q = $request->get('q', '');
        if (empty($q)) {
            return response()->json([]);
        }

        $products = Product::where('status', 'active')
            ->where(function ($query) use ($q) {
                $query->where('name', 'LIKE', "%{$q}%")
                      ->orWhere('description', 'LIKE', "%{$q}%")
                      ->orWhere('brand', 'LIKE', "%{$q}%");
            })
            ->with(['images', 'specifications', 'features'])
            ->get()
            ->map(function ($product) {
                return $this->formatProduct($product);
            });

        return response()->json($products);
    }

    public function show($slug)
    {
        $product = Product::where('slug', $slug)->orWhere('id', $slug)
            ->with(['category', 'images', 'specifications', 'features', 'reviews'])
            ->firstOrFail();

        return response()->json($this->formatProduct($product));
    }

    // Admin APIs
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required',
            'price' => 'required|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'brand' => 'nullable|string',
            'stock' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
        ]);

        $slug = Str::slug($request->name) . '-' . Str::random(5);
        $imageUrl = $request->image_url ?: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000';

        $product = Product::create([
            'name' => $request->name,
            'slug' => $slug,
            'brand' => $request->input('brand', 'Khác'),
            'category_id' => $request->category_id,
            'sku' => 'CAM-' . strtoupper(Str::random(6)),
            'description' => $request->input('description', ''),
            'price' => $request->price,
            'original_price' => $request->original_price,
            'image_url' => $imageUrl,
            'stock' => $request->input('stock', 10),
            'rating' => 5.0,
            'review_count' => 0,
            'is_featured' => $request->input('is_featured', false),
            'is_new' => true,
            'status' => $request->input('status', 'active'),
        ]);

        // Save gallery images
        if ($request->has('gallery') && is_array($request->gallery)) {
            foreach ($request->gallery as $idx => $gUrl) {
                if (!empty($gUrl)) {
                    \App\Models\ProductImage::create([
                        'product_id' => $product->id,
                        'image_url' => $gUrl,
                        'is_primary' => $idx === 0,
                        'display_order' => $idx,
                    ]);
                }
            }
        } elseif ($imageUrl) {
            \App\Models\ProductImage::create([
                'product_id' => $product->id,
                'image_url' => $imageUrl,
                'is_primary' => true,
                'display_order' => 0,
            ]);
        }

        // Save features
        if ($request->has('features') && is_array($request->features)) {
            foreach ($request->features as $idx => $feat) {
                if (!empty(trim($feat))) {
                    \App\Models\ProductFeature::create([
                        'product_id' => $product->id,
                        'feature_text' => trim($feat),
                        'display_order' => $idx,
                    ]);
                }
            }
        }

        // Save specs
        if ($request->has('specs') && is_array($request->specs)) {
            foreach ($request->specs as $key => $val) {
                if (!empty(trim($key)) && !empty(trim($val))) {
                    \App\Models\ProductSpecification::create([
                        'product_id' => $product->id,
                        'spec_key' => trim($key),
                        'spec_value' => trim($val),
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Sản phẩm đã được thêm thành công!',
            'product' => $this->formatProduct($product->fresh(['images', 'specifications', 'features'])),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0',
        ]);

        if ($request->has('name') && $request->name !== $product->name) {
            $product->name = $request->name;
            $product->slug = Str::slug($request->name) . '-' . Str::random(5);
        }

        if ($request->has('brand')) $product->brand = $request->brand;
        if ($request->has('category_id')) $product->category_id = $request->category_id;
        if ($request->has('price')) $product->price = $request->price;
        if ($request->has('original_price')) $product->original_price = $request->original_price;
        if ($request->has('stock')) $product->stock = $request->stock;
        if ($request->has('description')) $product->description = $request->description;
        if ($request->has('image_url')) $product->image_url = $request->image_url;
        if ($request->has('status')) $product->status = $request->status;

        $product->save();

        // Save gallery images
        if ($request->has('gallery') && is_array($request->gallery)) {
            \App\Models\ProductImage::where('product_id', $product->id)->delete();
            foreach ($request->gallery as $idx => $gUrl) {
                if (!empty($gUrl)) {
                    \App\Models\ProductImage::create([
                        'product_id' => $product->id,
                        'image_url' => $gUrl,
                        'is_primary' => $idx === 0,
                        'display_order' => $idx,
                    ]);
                }
            }
        }

        // Save features
        if ($request->has('features') && is_array($request->features)) {
            \App\Models\ProductFeature::where('product_id', $product->id)->delete();
            foreach ($request->features as $idx => $feat) {
                if (!empty(trim($feat))) {
                    \App\Models\ProductFeature::create([
                        'product_id' => $product->id,
                        'feature_text' => trim($feat),
                        'display_order' => $idx,
                    ]);
                }
            }
        }

        // Save specs
        if ($request->has('specs') && is_array($request->specs)) {
            \App\Models\ProductSpecification::where('product_id', $product->id)->delete();
            foreach ($request->specs as $key => $val) {
                if (!empty(trim($key)) && !empty(trim($val))) {
                    \App\Models\ProductSpecification::create([
                        'product_id' => $product->id,
                        'spec_key' => trim($key),
                        'spec_value' => trim($val),
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Cập nhật sản phẩm thành công!',
            'product' => $this->formatProduct($product->fresh(['images', 'specifications', 'features'])),
        ]);
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json([
            'message' => 'Đã xóa sản phẩm thành công!',
        ]);
    }

    private function formatProduct(Product $product)
    {
        $gallery = $product->images->pluck('image_url')->toArray();
        if (empty($gallery) && $product->image_url) {
            $gallery = [$product->image_url];
        }

        $specs = [];
        foreach ($product->specifications as $spec) {
            $specs[$spec->spec_key] = $spec->spec_value;
        }

        $features = $product->features->pluck('feature_text')->toArray();

        return [
            'id' => (string) $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'brand' => $product->brand ?? ($product->brandModel ? $product->brandModel->name : 'N/A'),
            'description' => $product->description ?? '',
            'price' => (float) $product->price,
            'original_price' => $product->original_price ? (float) $product->original_price : null,
            'category_id' => (string) $product->category_id,
            'category_name' => $product->category ? $product->category->name : 'N/A',
            'image_url' => $product->image_url ?? ($gallery[0] ?? ''),
            'gallery' => $gallery,
            'specs' => $specs,
            'features' => $features,
            'rating' => (float) $product->rating,
            'review_count' => (int) $product->review_count,
            'stock' => (int) $product->stock,
            'status' => $product->status ?? 'active',
            'is_featured' => (bool) $product->is_featured,
            'is_new' => (bool) $product->is_new,
            'created_at' => $product->created_at ? $product->created_at->toISOString() : now()->toISOString(),
        ];
    }
}
