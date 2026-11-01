<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

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

    public function adminIndex(Request $request)
    {
        $this->authorize('viewAny', Category::class);

        $trashedOnly = filter_var(
            $request->query('trashed', false),
            FILTER_VALIDATE_BOOLEAN
        );

        $categories = Category::with([
            'translations',
            'children.translations',
            'parent.translations',
        ])
            ->when($trashedOnly, fn ($query) => $query->onlyTrashed())
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return CategoryResource::collection($categories);
    }

    public function adminShow(Category $category)
    {
        $this->authorize('view', $category);

        return new CategoryResource(
            $category->load([
                'translations',
                'children.translations',
                'parent.translations',
            ])
        );
    }

    public function store(StoreCategoryRequest $request)
    {
        $this->authorize('create', Category::class);

        $categoryData = $request->validated();

        $this->validateParent($categoryData['parent_id'] ?? null);
        $category = DB::transaction(function () use ($categoryData) {
            $translations = $categoryData['translations'];

            $slugSource = $this->getSlugSource($translations);

            $category = Category::create([
                ...collect($categoryData)
                    ->except('translations', 'slug')
                    ->all(),
                'slug' => Str::slug($slugSource),
            ]);

            $category->translations()->createMany($translations);

            return $category;
        });

        return (new CategoryResource(
            $category->load('translations')
        ))->response()->setStatusCode(201);
    }

    public function update(UpdateCategoryRequest $request, Category $category)
    {
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

            if ($translations !== null) {
                $slugSource = $this->getSlugSource($translations);

                $categoryData['slug'] = Str::slug($slugSource);
            }

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

    public function restore(Category $category)
    {
        $this->authorize('restore', $category);

        if ($category->trashed()) {
            $category->restore();
        }

        return new CategoryResource(
            $category->fresh()->load('translations', 'children.translations')
        );
    }

    public function forceDelete(Category $category)
    {
        $this->authorize('forceDelete', $category);

        if (! $category->trashed()) {
            throw ValidationException::withMessages([
                'category' => [__('api.category_must_be_trashed')],
            ]);
        }

        $hasProducts = $category->products()->withTrashed()->exists();
        $hasChildren = Category::withTrashed()
            ->where('parent_id', $category->id)
            ->exists();

        if ($hasProducts || $hasChildren) {
            throw ValidationException::withMessages([
                'category' => [
                    __('api.category_in_use_cannot_be_deleted'),
                ],
            ]);
        }

        $category->forceDelete();

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
            throw ValidationException::withMessages([
                'parent_id' => [__('api.category_cannot_be_own_parent')],
            ]);
        }

        while ($category && $parent) {
            if ($parent->id === $category->id) {
                throw ValidationException::withMessages([
                    'parent_id' => [__('api.category_hierarchy_cycle')],
                ]);
            }

            $parent = $parent->parent;
        }
    }

    private function getSlugSource(array $translations): string
    {
        foreach ($translations as $translation) {
            if ($translation['locale'] === 'en') {
                return $translation['name'];
            }
        }

        return $translations[0]['name'];
    }
}
