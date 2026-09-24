<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Category,Product};
use App\Services\StoreContext;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $r, StoreContext $stores)
    {
        $store = $stores->resolve($r);
        return Product::where('store_id', $store->id)->where('is_active', true)->with(['translations','images','category'])->paginate(20);
    }public function show(Request $r, string $identifier, StoreContext $stores)
    {
        $store = $stores->resolve($r);
        $id = (int)Str::afterLast($identifier, '-');
        $slug = Str::beforeLast($identifier, '-');
        return Product::with(['translations','images','category.translations'])->where(['id' => $id,'slug' => $slug,'store_id' => $store->id,'is_active' => true])->firstOrFail();
    }public function adminIndex(Request $r)
    {
        $this->authorize('viewAny', Product::class);
        return Product::where('store_id', $r->user()->store_id)->with('translations', 'images')->paginate(30);
    }public function store(Request $r)
    {
        $this->authorize('create', Product::class);
        $d = $r->validate(['slug' => 'required|alpha_dash|max:180','sku' => 'nullable|max:100','category_id' => 'nullable|integer','price' => 'required|numeric|min:0','stock' => 'required|integer|min:0','is_active' => 'boolean','translations' => 'required|array','translations.*.locale' => 'required|in:en,ar','translations.*.name' => 'required|max:255','translations.*.description' => 'nullable']);
        $this->categoryForStore($d['category_id'] ?? null, $r->user()->store_id);
        $product = Product::create([...collect($d)->except('translations')->all(),'store_id' => $r->user()->store_id]);
        $product->translations()->createMany($d['translations']);
        return response()->json($product->load('translations'), 201);
    }public function update(Request $r, Product $product)
    {
        $this->authorize('update', $product);
        $d = $r->validate(['slug' => 'sometimes|alpha_dash|max:180','sku' => 'nullable|max:100','category_id' => 'nullable|integer','price' => 'sometimes|numeric|min:0','stock' => 'sometimes|integer|min:0','is_active' => 'boolean']);
        if (array_key_exists('category_id', $d)) {
            $this->categoryForStore($d['category_id'], $product->store_id);
        }$product->update($d);
        return $product;
    }public function destroy(Product $product)
    {
        $this->authorize('delete', $product);
        $product->delete();
        return response()->noContent();
    }private function categoryForStore(?int $id, int $storeId): void
    {
        if ($id !== null) {
            Category::where('store_id',$storeId)->findOrFail($id);
        }
    }
}
