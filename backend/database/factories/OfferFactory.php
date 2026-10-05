<?php

namespace Database\Factories;

use App\Models\Offer;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Offer>
 */
class OfferFactory extends Factory
{
    protected $model = Offer::class;

    public function definition(): array
    {
        $type = fake()->randomElement([
            'percentage',
            'fixed',
            'buy_x_get_y',
        ]);

        return [
            'created_by' => User::factory(),
            'name' => fake()->sentence(3),
            'type' => $type,
            'value' => in_array($type, ['percentage', 'fixed'], true)
                ? fake()->randomFloat(2, 5, 100)
                : null,
            'buy_quantity' => $type === 'buy_x_get_y'
                ? fake()->numberBetween(1, 5)
                : null,
            'get_quantity' => $type === 'buy_x_get_y'
                ? fake()->numberBetween(1, 3)
                : null,
            'starts_at' => now(),
            'ends_at' => now()->addMonths(3),
            'is_active' => true,
        ];
    }

    public function withProducts(int $count = 1): static
    {
        return $this->afterCreating(function (Offer $offer) use ($count) {
            $offer->products()->attach(
                Product::factory()->count($count)->create()
            );
        });
    }
}
