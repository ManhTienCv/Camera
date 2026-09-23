<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    public function index()
    {
        $brands = \Illuminate\Support\Facades\Cache::remember('brands_all_cached', 600, function () {
            return Brand::orderBy('name')->get()->toArray();
        });
        return response()->json(is_array($brands) ? $brands : []);
    }
}
