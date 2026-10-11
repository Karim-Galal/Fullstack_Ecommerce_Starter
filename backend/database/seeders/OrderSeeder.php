<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $customers = User::where('role', 'customer')->get();
        $products = Product::where('is_active', true)->get();
        $shippingMethods = ShippingMethod::where('is_active', true)->get();

        if ($customers->isEmpty() || $products->isEmpty() || $shippingMethods->isEmpty()) {
            return;
        }

        $defaultShippingMethod = $shippingMethods->where('is_default', true)->first();
        if (! $defaultShippingMethod) {
            $defaultShippingMethod = $shippingMethods->first();
        }

        $statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

        foreach ($customers as $customer) {
            // Create 1-3 orders per customer
            $orderCount = fake()->numberBetween(1, 3);

            for ($i = 0; $i < $orderCount; $i++) {
                $status = fake()->randomElement($statuses);
                $orderProducts = $products->random(fake()->numberBetween(1, min(4, $products->count())));

                $subtotal = 0;
                $orderItems = [];

                foreach ($orderProducts as $product) {
                    $quantity = fake()->numberBetween(1, 3);
                    $unitPrice = (float) $product->price;
                    $lineTotal = round($unitPrice * $quantity, 2);
                    $subtotal += $lineTotal;

                    $orderItems[] = [
                        'product_id' => $product->id,
                        'name' => $product->translations()->where('locale', 'en')->first()?->name ?? $product->slug,
                        'sku' => $product->sku,
                        'unit_price' => $unitPrice,
                        'quantity' => $quantity,
                        'line_total' => $lineTotal,
                    ];
                }

                $discountTotal = round($subtotal * fake()->randomFloat(2, 0, 0.15), 2);
                $shippingTotal = (float) $defaultShippingMethod->price;
                $total = round($subtotal - $discountTotal + $shippingTotal, 2);

                $order = Order::create([
                    'user_id' => $customer->id,
                    'shipping_method_id' => $defaultShippingMethod->id,
                    'number' => 'ORD-' . now()->format('Ymd') . '-' . Str::upper(Str::random(8)),
                    'status' => $status,
                    'currency' => 'EGP',
                    'subtotal' => round($subtotal, 2),
                    'discount_total' => $discountTotal,
                    'shipping_total' => $shippingTotal,
                    'total' => $total,
                    'shipping_address' => [
                        'name' => $customer->name,
                        'phone' => '+201000000001',
                        'line1' => '123 Main Street',
                        'city' => 'Cairo',
                        'country' => 'EG',
                    ],
                ]);

                foreach ($orderItems as $itemData) {
                    OrderItem::create(array_merge($itemData, ['order_id' => $order->id]));
                }
            }
        }
    }
}