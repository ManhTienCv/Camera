<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::withCount('products')->orderBy('display_order')->get();
        return response()->json($categories);
    }

    public function show($slug)
    {
        $category = Category::where('slug', $slug)->orWhere('id', $slug)->firstOrFail();
        $products = $category->products()->where('status', 'active')->with(['images', 'specifications'])->get();

        return response()->json([
            'category' => $category,
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $category = Category::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
            'icon' => $request->input('icon', 'Camera'),
            'display_order' => Category::max('display_order') + 1,
        ]);

        return response()->json([
            'message' => 'Danh mục đã được tạo thành công!',
            'category' => $category,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        if ($request->has('name')) {
            $category->name = $request->name;
            $category->slug = Str::slug($request->name);
        }
        if ($request->has('description')) $category->description = $request->description;
        if ($request->has('icon')) $category->icon = $request->icon;

        $category->save();

        return response()->json([
            'message' => 'Cập nhật danh mục thành công!',
            'category' => $category,
        ]);
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        $category->delete();

        return response()->json([
            'message' => 'Đã xóa danh mục thành công!',
        ]);
    }
}
