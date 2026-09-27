<?php

namespace Database\Factories;

use App\Models\Coupon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Coupon>
 */
class CouponFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Coupon::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->bothify('???-####')),
            'discount_type' => fake()->randomElement(['percentage', 'fixed']),
            'discount_amount' => fake()->randomFloat(2, 5, 100),
            'minimum_order' => fake()->optional()->randomFloat(2, 50, 500),
            'usage_limit' => fake()->optional()->numberBetween(1, 100),
            'used_count' => 0,
            'starts_at' => fake()->optional()->dateTimeBetween('-1 month', '+1 month'),
            'expires_at' => fake()->optional()->dateTimeBetween('+1 month', '+1 year'),
            'is_active' => true,
        ];
    }
}
