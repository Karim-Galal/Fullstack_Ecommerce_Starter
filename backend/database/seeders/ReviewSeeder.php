<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $customers = User::where('role', 'customer')->get();
        $products = Product::where('is_active', true)->get();

        if ($customers->isEmpty() || $products->isEmpty()) {
            return;
        }

        $statuses = ['pending', 'approved', 'rejected'];

        foreach ($customers as $customer) {
            // Get products this customer has purchased (orders with confirmed status)
            $purchasedProductIds = Order::where('user_id', $customer->id)
                ->where('status', 'confirmed')
                ->with('items.product')
                ->get()
                ->flatMap(fn ($order) => $order->items->pluck('product_id'))
                ->unique();

            $purchasedProducts = $products->whereIn('id', $purchasedProductIds);

            if ($purchasedProducts->isEmpty()) {
                // If no confirmed orders, allow reviewing any active product for demo
                $purchasedProducts = $products;
            }

            // Create 1-3 reviews per customer
            $reviewCount = fake()->numberBetween(1, min(3, $purchasedProducts->count()));

            $reviewProducts = $purchasedProducts->random($reviewCount);

            foreach ($reviewProducts as $product) {
                // Check if review already exists
                $existing = Review::where('user_id', $customer->id)
                    ->where('product_id', $product->id)
                    ->first();

                if ($existing) {
                    continue;
                }

                Review::create([
                    'user_id' => $customer->id,
                    'product_id' => $product->id,
                    'rating' => fake()->numberBetween(3, 5),
                    'comment' => fake()->optional(0.8)->paragraph(),
                    'status' => fake()->randomElement($statuses),
                ]);
            }
        }
    }
}