<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Payment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'amount' => fake()->randomFloat(2, 50, 5000),
            'currency' => 'EGP',
            'gateway' => fake()->randomElement(['stripe', 'paymob']),
            'payment_method' => fake()->optional()->word(),
            'status' => fake()->randomElement(['unpaid', 'pending', 'paid', 'failed', 'refunded']),
            'transaction_reference' => Str::uuid(),
            'gateway_reference' => fake()->optional()->uuid(),
            'paid_at' => fake()->optional()->dateTimeBetween('-1 month', 'now'),
            'gateway_metadata' => null,
        ];
    }
}
