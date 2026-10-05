<?php

namespace Database\Factories;

use App\Models\Coupon;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Coupon>
 */
class CouponFactory extends Factory
{
    protected $model = Coupon::class;

    public function definition(): array
    {
        $startsAt = fake()->dateTimeBetween('-1 month', '+1 month');
        $expiresAt = fake()->dateTimeBetween(
            $startsAt,
            '+1 year'
        );

        $discountType = fake()->randomElement([
            'percentage',
            'fixed',
        ]);

        return [
            'created_by' => User::factory(),
            'code' => strtoupper(fake()->unique()->bothify('???-####')),
            'discount_type' => $discountType,
            'discount_amount' => $discountType === 'percentage'
                ? fake()->randomFloat(2, 5, 100)
                : fake()->randomFloat(2, 5, 100),
            'minimum_order' => fake()->optional()->randomFloat(2, 50, 500),
            'usage_limit' => fake()->optional()->numberBetween(1, 100),
            'used_count' => 0,
            'starts_at' => $startsAt,
            'expires_at' => $expiresAt,
            'is_active' => true,
        ];
    }
}
