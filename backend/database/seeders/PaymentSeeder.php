<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        $orders = Order::all();

        if ($orders->isEmpty()) {
            return;
        }

        $gateways = ['stripe', 'paymob'];
        $statuses = ['unpaid', 'pending', 'paid', 'failed', 'refunded', 'expired'];

        foreach ($orders as $order) {
            // Skip if payment already exists for this order
            if ($order->payments()->exists()) {
                continue;
            }

            $status = fake()->randomElement($statuses);
            $gateway = fake()->randomElement($gateways);

            $payment = Payment::create([
                'order_id' => $order->id,
                'amount' => $order->total,
                'currency' => $order->currency,
                'gateway' => $gateway,
                'payment_method' => $gateway === 'stripe' ? 'card' : fake()->randomElement(['card', 'wallet', 'kiosk']),
                'status' => $status,
                'transaction_reference' => Str::uuid(),
                'gateway_reference' => $status !== 'unpaid' ? Str::uuid() : null,
                'paid_at' => in_array($status, ['paid', 'refunded']) ? now()->subDays(fake()->numberBetween(0, 30)) : null,
                'expires_at' => in_array($status, ['pending', 'unpaid']) ? now()->addMinutes(15) : null,
                'gateway_metadata' => $status !== 'unpaid' ? ['payment_intent_id' => 'pi_' . Str::random(24)] : null,
            ]);
        }
    }
}