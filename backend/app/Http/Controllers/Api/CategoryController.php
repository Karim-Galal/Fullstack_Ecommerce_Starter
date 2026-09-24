<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\StoreContext;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $r, StoreContext $stores)
    {
        $store = $stores->resolve($r);
        return Category::where('store_id', $store->id)->whereNull('parent_id')->where('is_active', true)->with('children.translations', 'translations')->orderBy('sort_order')->get();
    }public function adminIndex(Request $r)
    {
        $this->authorize('viewAny', Category::class);
        return Category::where('store_id', $r->user()->store_id)->with('translations', 'children')->get();
    }public function store(Request $r)
    {
        $this->authorize('create', Category::class);
        $d = $r->validate(['slug' => 'required|alpha_dash','parent_id' => 'nullable|integer','is_active' => 'boolean','translations' => 'required|array','translations.*.locale' => 'required|in:en,ar','translations.*.name' => 'required|max:255']);
        $this->parentForStore($d['parent_id'] ?? null, $r->user()->store_id);
        $c = Category::create([...collect($d)->except('translations')->all(),'store_id' => $r->user()->store_id]);
        $c->translations()->createMany($d['translations']);
        return response()->json($c->load('translations'), 201);
    }public function update(Request $r, Category $category)
    {
        $this->authorize('update', $category);
        $d = $r->validate(['slug' => 'sometimes|alpha_dash','parent_id' => 'nullable|integer','is_active' => 'boolean','sort_order' => 'integer']);
        if (array_key_exists('parent_id', $d)) {
            $this->parentForStore($d['parent_id'], $category->store_id, $category);
        }$category->update($d);
        return $category;
    }public function destroy(Category $category)
    {
        $this->authorize('delete', $category);
        $category->delete();
        return response()->noContent();
    }private function parentForStore(?int $id, int $storeId, ?Category $category = null): void
    {
        if ($id === null) {
            return;
        }$parent = Category::where('store_id', $storeId)->findOrFail($id);
        abort_if($category && $parent->id === $category->id, 422, 'A category cannot be its own parent.');
        while ($category && $parent) {
            abort_if($parent->id === $category->id, 422, 'Category hierarchy cannot contain a cycle.');
            $parent = $parent->parent;
        }
    }
}
