<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index()
    {
        return Product::where('is_active', true)
            ->with(['translations', 'images', 'category'])
            ->paginate(20);
    }

    public function show(string $identifier)
    {
        $productId = (int) Str::afterLast($identifier, '-');
        $slug = Str::beforeLast($identifier, '-');

        return Product::with([
            'translations',
            'images',
            'category.translations',
        ])
            ->where([
                'id' => $productId,
                'slug' => $slug,
                'is_active' => true,
            ])
            ->firstOrFail();
    }

    public function adminIndex()
    {
        $this->authorize('viewAny', Product::class);

        return Product::with(['translations', 'images'])
            ->paginate(30);
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
