<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $r)
    {
        return Category::whereNull('parent_id')->where('is_active', true)->with('children.translations', 'translations')->orderBy('sort_order')->get();
    }

    public function adminIndex(Request $r)
    {
        $this->authorize('viewAny', Category::class);

        return Category::with('translations', 'children')->get();
    }

    public function store(Request $r)
    {
        $this->authorize('create', Category::class);
        $d = $r->validate([
            'slug' => 'required|alpha_dash',
            'parent_id' => 'nullable|integer',
            'is_active' => 'boolean',
            'translations' => 'required|array',
            'translations.*.locale' => 'required|in:en,ar',
            'translations.*.name' => 'required|max:255',
        ]);
        $this->validateParent($d['parent_id'] ?? null);
        $c = Category::create(collect($d)->except('translations')->all());
        $c->translations()->createMany($d['translations']);

        return response()->json($c->load('translations'), 201);
    }

    public function update(Request $r, Category $category)
    {
        $this->authorize('update', $category);
        $d = $r->validate([
            'slug' => 'sometimes|alpha_dash',
            'parent_id' => 'nullable|integer',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);
        if (array_key_exists('parent_id', $d)) {
            $this->validateParent($d['parent_id'], $category);
        }
        $category->update($d);

        return $category;
    }

    public function destroy(Category $category)
    {
        $this->authorize('delete', $category);
        $category->delete();

        return response()->noContent();
    }

    private function validateParent(?int $id, ?Category $category = null): void
    {
        if ($id === null) {
            return;
        }
        $parent = Category::findOrFail($id);
        abort_if($category && $parent->id === $category->id, 422, 'A category cannot be its own parent.');
        while ($category && $parent) {
            abort_if($parent->id === $category->id, 422, 'Category hierarchy cannot contain a cycle.');
            $parent = $parent->parent;
        }
    }
}
