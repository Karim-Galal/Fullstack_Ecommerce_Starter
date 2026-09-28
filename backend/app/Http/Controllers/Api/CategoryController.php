<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::whereNull('parent_id')
            ->where('is_active', true)
            ->with([
                'translations',
                'children.translations',
            ])
            ->orderBy('sort_order')
            ->get();

        return CategoryResource::collection($categories);
    }

    public function adminIndex()
    {
        $this->authorize('viewAny', Category::class);

        $categories = Category::with([
            'translations',
            'children.translations',
        ])
            ->orderBy('sort_order')
            ->get();

        return CategoryResource::collection($categories);
    }

    public function store(StoreCategoryRequest $request)
    {
        $this->authorize('create', Category::class);

        $categoryData = $request->validated();

        $this->validateParent($categoryData['parent_id'] ?? null);

        $category = DB::transaction(function () use ($categoryData) {
            $category = Category::create(
                collect($categoryData)
                    ->except('translations')
                    ->all()
            );

            $category->translations()->createMany(
                $categoryData['translations']
            );

            return $category;
        });

        return (new CategoryResource(
            $category->load('translations')
        ))->response()->setStatusCode(201);
    }

    public function update(
        UpdateCategoryRequest $request,
        Category $category
    ) {
        $this->authorize('update', $category);

        $categoryData = $request->validated();

        if (array_key_exists('parent_id', $categoryData)) {
            $this->validateParent(
                $categoryData['parent_id'],
                $category
            );
        }

        $category = DB::transaction(function () use ($category, $categoryData) {
            $translations = $categoryData['translations'] ?? null;

            $category->update(
                collect($categoryData)
                    ->except('translations')
                    ->all()
            );

            if ($translations !== null) {
                foreach ($translations as $translation) {
                    $category->translations()->updateOrCreate(
                        ['locale' => $translation['locale']],
                        [
                            'name' => $translation['name'],
                            'description' => $translation['description'] ?? null,
                            'meta_title' => $translation['meta_title'] ?? null,
                            'meta_description' => $translation['meta_description'] ?? null,
                        ]
                    );
                }
            }

            return $category;
        });

        return new CategoryResource(
            $category->load('translations')
        );
    }

    public function destroy(Category $category)
    {
        $this->authorize('delete', $category);

        $category->delete();

        return response()->noContent();
    }

    private function validateParent(
        ?int $parentId,
        ?Category $category = null
    ): void {
        if ($parentId === null) {
            return;
        }

        $parent = Category::findOrFail($parentId);

        if ($category && $parent->id === $category->id) {
            abort(
                422,
                'A category cannot be its own parent.'
            );
        }

        while ($category && $parent) {
            if ($parent->id === $category->id) {
                abort(
                    422,
                    'Category hierarchy cannot contain a cycle.'
                );
            }

            $parent = $parent->parent;
        }
    }
}
