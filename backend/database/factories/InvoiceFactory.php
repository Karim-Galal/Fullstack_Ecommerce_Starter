<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Invoice::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 50, 5000);
        $discount = fake()->randomFloat(2, 0, $subtotal * 0.2);
        $shipping = fake()->randomFloat(2, 0, 50);
        $total = $subtotal - $discount + $shipping;

        return [
            'order_id' => Order::factory(),
            'number' => 'INV-'.now()->format('Ymd').'-'.Str::upper(Str::random(8)),
            'status' => 'issued',
            'currency' => 'EGP',
            'subtotal' => $subtotal,
            'discount_total' => $discount,
            'shipping_total' => $shipping,
            'total' => $total,
            'issued_at' => now(),
        ];
    }
}
