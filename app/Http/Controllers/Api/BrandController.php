<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    public function index()
    {
        $brands = Cache::remember('brands_all_cached', 600, function () {
            return Brand::withCount('products')->orderBy('name')->get()->toArray();
        });
        return response()->json(is_array($brands) ? $brands : []);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100|unique:brands,name',
            'description' => 'nullable|string',
            'logo_url' => 'nullable|string',
        ]);

        $name = trim($request->name);
        $brand = Brand::create([
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => $request->description,
            'logo_url' => $request->logo_url,
        ]);

        Cache::forget('brands_all_cached');

        return response()->json([
            'message' => 'Thương hiệu đã được tạo thành công!',
            'brand' => $brand,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $brand = Brand::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:100|unique:brands,name,' . $id,
            'description' => 'nullable|string',
            'logo_url' => 'nullable|string',
        ]);

        if ($request->has('name')) {
            $brand->name = trim($request->name);
            $brand->slug = Str::slug($brand->name);
        }
        if ($request->has('description')) {
            $brand->description = $request->description;
        }
        if ($request->has('logo_url')) {
            $brand->logo_url = $request->logo_url;
        }

        $brand->save();

        if ($request->has('name')) {
            \App\Models\Product::where('brand_id', $brand->id)->update(['brand' => $brand->name]);
        }

        Cache::forget('brands_all_cached');

        return response()->json([
            'message' => 'Cập nhật thương hiệu thành công!',
            'brand' => $brand,
        ]);
    }

    public function destroy($id)
    {
        $brand = Brand::findOrFail($id);

        $productsCount = \App\Models\Product::where('brand_id', $brand->id)->count();
        if ($productsCount > 0) {
            return response()->json([
                'message' => "Không thể xóa thương hiệu '{$brand->name}' vì có {$productsCount} sản phẩm đang thuộc thương hiệu này.",
            ], 422);
        }

        $brand->delete();
        Cache::forget('brands_all_cached');

        return response()->json([
            'message' => 'Đã xóa thương hiệu thành công!',
        ]);
    }
}

