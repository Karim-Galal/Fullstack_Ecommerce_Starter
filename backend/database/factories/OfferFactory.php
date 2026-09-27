<?php

namespace Database\Factories;

use App\Models\Offer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Offer>
 */
class OfferFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Offer::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = fake()->randomElement(['percentage', 'fixed_price', 'buy_x_get_y']);

        return [
            'name' => fake()->sentence(3),
            'type' => $type,
            'value' => $type === 'fixed_price' ? fake()->randomFloat(2, 10, 1000) : fake()->randomFloat(2, 5, 50),
            'buy_quantity' => $type === 'buy_x_get_y' ? fake()->numberBetween(1, 5) : null,
            'get_quantity' => $type === 'buy_x_get_y' ? fake()->numberBetween(1, 3) : null,
            'starts_at' => fake()->optional()->dateTimeBetween('-1 month', '+1 month'),
            'ends_at' => fake()->optional()->dateTimeBetween('+1 month', '+1 year'),
            'is_active' => true,
        ];
    }
}
