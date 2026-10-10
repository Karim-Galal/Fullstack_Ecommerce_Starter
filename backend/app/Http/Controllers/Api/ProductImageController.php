<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductImageResource;
use App\Jobs\ProcessProductImage;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductImageCleanup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProductImageController extends Controller
{
    public function store(Request $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $validated = $request->validate([
            'images' => [
                'required',
                'array',
                'min:1',
                'max:' . config('product-images.max_batch_size'),
            ],
            'images.*' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:' . config('product-images.max_upload_kb'),
            ],
            'alt' => ['nullable', 'string', 'max:255'],
        ]);

        $disk = config('product-images.disk');
        $createdImages = [];

        foreach ($validated['images'] as $file) {
            $path = $file->store(
                "products/{$product->id}/originals",
                $disk,
            );

            $image = $product->images()->create([
                'path' => $path,
                'disk' => $disk,
                'processing_status' => 'pending',
                'alt' => $validated['alt'] ?? null,
                'sort_order' => (
                    (int) $product->images()->max('sort_order')
                ) + 1,
                'is_primary' => false,
            ]);

            ProcessProductImage::dispatch($image->id);

            $createdImages[] = $image;
        }

        return response()->json([
            'message' => 'Images uploaded and queued for processing.',
            'data' => ProductImageResource::collection(
                collect($createdImages)
            ),
        ], 202);
    }

    public function replace(
        Request $request,
        Product $product,
        ProductImage $image,
    ): JsonResponse {
        $this->authorize('update', $product);

        if ($image->product_id !== $product->id) {
            return response()->json([
                'message' => 'The image does not belong to this product.',
            ], 404);
        }

        if ($image->processing_status !== 'ready') {
            return response()->json([
                'message' => 'Only a processed image can be replaced.',
            ], 422);
        }

        $validated = $request->validate([
            'image' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:' . config('product-images.max_upload_kb'),
            ],
            'alt' => ['nullable', 'string', 'max:255'],
        ]);

        $disk = config('product-images.disk');

        $path = $validated['image']->store(
            "products/{$product->id}/originals",
            $disk,
        );

        $replacement = $product->images()->create([
            'path' => $path,
            'disk' => $disk,
            'processing_status' => 'pending',
            'alt' => $validated['alt'] ?? $image->alt,
            'sort_order' => $image->sort_order,
            'is_primary' => false,
        ]);

        ProcessProductImage::dispatch(
            $replacement->id,
            $image->id,
        );

        return response()->json([
            'message' => 'Replacement uploaded and queued for processing.',
            'data' => new ProductImageResource($replacement),
        ], 202);
    }

    public function update(
        Request $request,
        Product $product,
        ProductImage $image,
    ): JsonResponse {
        $this->authorize('update', $product);

        if ($image->product_id !== $product->id) {
            return response()->json([
                'message' => 'The image does not belong to this product.',
            ], 404);
        }

        $validated = $request->validate([
            'alt' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_primary' => ['sometimes', 'boolean'],
        ]);

        DB::transaction(function () use ($product, $image, $validated) {
            if (($validated['is_primary'] ?? false) === true) {
                ProductImage::query()
                    ->where('product_id', $product->id)
                    ->where('processing_status', 'ready')
                    ->update(['is_primary' => false]);
            }

            $image->update($validated);
        });

        return response()->json([
            'message' => 'Product image updated successfully.',
            'data' => new ProductImageResource($image->fresh()),
        ]);
    }

    public function destroy(
        Product $product,
        ProductImage $image,
    ): JsonResponse {
        $this->authorize('update', $product);

        if ($image->product_id !== $product->id) {
            return response()->json([
                'message' => 'The image does not belong to this product.',
            ], 404);
        }

        DB::transaction(function () use ($product, $image) {
            $wasPrimary = $image->is_primary;

            $paths = array_values(array_filter([
                $image->path,
                ...array_values($image->variants ?? []),
            ]));

            $image->delete();

            ProductImageCleanup::create([
                'disk' => $image->disk,
                'paths' => $paths,
                'delete_after' => now()->addDays(
                    config('product-images.retention_days')
                ),
            ]);

            if ($wasPrimary) {
                /** @var ProductImage|null $nextImage */
                $nextImage = $product->images()
                    ->where('processing_status', 'ready')
                    ->orderBy('sort_order')
                    ->first();

                $nextImage?->update(['is_primary' => true]);
            }
        });

        return response()->json([
            'message' => 'Image deleted. Its files will be permanently removed after the retention period.',
        ]);
    }
}
