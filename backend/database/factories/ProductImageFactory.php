<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductImage>
 */
class ProductImageFactory extends Factory
{
    protected $model = ProductImage::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'path' => 'products/' . fake()->uuid() . '.webp',
            'disk' => 'public',
            'processing_status' => 'ready',
            'variants' => [
                'thumbnail' => 'products/' . fake()->uuid() . '/thumbnail.webp',
                'card' => 'products/' . fake()->uuid() . '/card.webp',
                'detail' => 'products/' . fake()->uuid() . '/detail.webp',
            ],
            'alt' => fake()->optional()->words(3, true),
            'sort_order' => fake()->numberBetween(0, 10),
            'is_primary' => false,
        ];
    }

    public function primary(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_primary' => true,
        ]);
    }
}