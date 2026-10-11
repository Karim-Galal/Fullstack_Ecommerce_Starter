<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class CategoryTranslationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'locale' => fake()->randomElement(['en', 'ar']),
            'name' => fake()->words(2, true),
            'description' => fake()->optional()->paragraph(),
            'meta_title' => fake()->optional()->words(3, true),
            'meta_description' => fake()->optional()->sentence(),
        ];
    }
}