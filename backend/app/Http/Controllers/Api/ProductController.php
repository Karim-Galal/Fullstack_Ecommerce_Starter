<?php

namespace App\Http\Controllers\Api;

use App\Filters\Admin\ProductFilter;
use App\Filters\Store\ProductFilter as StoreProductFilter;
use App\Http\Controllers\Controller;
use App\Http\Requests\IndexAdminProductsRequest;
use App\Http\Requests\IndexStoreProductsRequest;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(IndexStoreProductsRequest $request, StoreProductFilter $filter)
    {
        $filters = $request->validated();
        $perPage = (int) ($filters['per_page'] ?? 20);

        return $filter
            ->apply(
                Product::where('is_active', true)
                    ->with(['translations', 'images', 'category']),
                $filters
            )
            ->paginate($perPage);
    }

    public function show(string $identifier)
    {
        return Product::with([
            'translations',
            'images',
            'category.translations',
        ])
            ->where(function ($query) use ($identifier) {
                $query->where('id', $identifier)
                    ->orWhere('slug', $identifier);
            })
            ->where('is_active', true)
            ->firstOrFail();
    }

    public function adminIndex(IndexAdminProductsRequest $request, ProductFilter $filter)
    {
        $this->authorize('viewAny', Product::class);

        $filters = $request->validated();
        $perPage = (int) ($filters['per_page'] ?? 30);

        return $filter
            ->apply(Product::with(['translations', 'images']), $filters)
            ->paginate($perPage);
    }

    public function adminShow(Product $product)
    {
        $this->authorize('view', $product);

        return $product->load([
            'translations',
            'images',
            'category',
            'category.translations',
        ]);
    }

    public function store(StoreProductRequest $request)
    {
        $this->authorize('create', Product::class);

        $productData = $request->validated();
        $translations = $productData['translations'];
        $slugSource = $this->getSlugSource($translations);

        $product = DB::transaction(function () use ($productData, $translations, $slugSource) {
            unset($productData['translations']);

            $product = Product::create([
                ...$productData,
                'slug' => Str::slug($slugSource),
            ]);

            $product->translations()->createMany($translations);

            $product->update([
                'slug' => $product->slug.'-'.$product->id,
            ]);

            return $product;
        });

        return response()->json(
            $product->load('translations'),
            201
        );
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        $this->authorize('update', $product);

        $productData = $request->validated();
        $translations = $productData['translations'] ?? null;

        unset($productData['translations']);

        DB::transaction(function () use ($product, $productData, $translations) {
            if ($translations !== null) {
                $slugSource = $this->getSlugSource($translations);

                $productData['slug'] = Str::slug($slugSource).'-'.$product->id;
            }

            $product->update($productData);

            if ($translations !== null) {
                foreach ($translations as $translationData) {
                    $product->translations()->updateOrCreate(
                        ['locale' => $translationData['locale']],
                        [
                            'name' => $translationData['name'],
                            'description' => $translationData['description'] ?? null,
                            'meta_title' => $translationData['meta_title'] ?? null,
                            'meta_description' => $translationData['meta_description'] ?? null,
                        ]
                    );
                }
            }
        });

        return $product->load('translations');
    }

    public function destroy(Product $product)
    {
        $this->authorize('delete', $product);

        $product->delete();

        return response()->noContent();
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
