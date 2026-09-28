<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductTranslationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'locale' => fake()->randomElement(['en', 'ar']),
            'name' => fake()->words(3, true),
            'description' => fake()->paragraph(),
        ];
    }
}
