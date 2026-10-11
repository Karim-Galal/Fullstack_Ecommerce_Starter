<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;

class ProductImageSeeder extends Seeder
{
    public function run(): void
    {
        $products = Product::where('is_active', true)->get();

        if ($products->isEmpty()) {
            return;
        }

        foreach ($products as $product) {
            // Add 1-3 images per product
            $imageCount = fake()->numberBetween(1, 3);

            for ($i = 0; $i < $imageCount; $i++) {
                $uuid = fake()->uuid();
                $image = ProductImage::updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'path' => "products/{$product->id}/originals/{$uuid}.webp",
                    ],
                    [
                        'disk' => 'public',
                        'processing_status' => 'ready',
                        'variants' => [
                            'thumbnail' => "products/{$product->id}/images/{$uuid}/thumbnail.webp",
                            'card' => "products/{$product->id}/images/{$uuid}/card.webp",
                            'detail' => "products/{$product->id}/images/{$uuid}/detail.webp",
                        ],
                        'alt' => fake()->optional()->words(3, true),
                        'sort_order' => $i,
                        'is_primary' => $i === 0,
                    ]
                );
            }
        }
    }
}