<?php

namespace Database\Factories;

use App\Models\Collection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CollectionTranslation>
 */
class CollectionTranslationFactory extends Factory
{
    protected $model = \App\Models\CollectionTranslation::class;

    public function definition(): array
    {
        return [
            'collection_id' => Collection::factory(),
            'locale' => fake()->randomElement(['en', 'ar']),
            'name' => fake()->words(3, true),
            'description' => fake()->optional()->paragraph(),
            'meta_title' => fake()->optional()->words(3, true),
            'meta_description' => fake()->optional()->sentence(),
        ];
    }
}