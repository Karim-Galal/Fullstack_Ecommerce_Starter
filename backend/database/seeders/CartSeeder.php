<?php

namespace Database\Seeders;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CartSeeder extends Seeder
{
    public function run(): void
    {
        $customers = User::where('role', 'customer')->get();
        $products = Product::where('is_active', true)->where('stock', '>', 0)->get();

        if ($customers->isEmpty() || $products->isEmpty()) {
            return;
        }

        // Create carts for customers
        foreach ($customers as $customer) {
            $cart = Cart::updateOrCreate(
                ['user_id' => $customer->id],
                ['user_id' => $customer->id]
            );

            // Add 1-3 random products to each cart
            $cartProducts = $products->random(fake()->numberBetween(1, min(3, $products->count())));

            foreach ($cartProducts as $product) {
                $quantity = fake()->numberBetween(1, min(5, $product->stock));

                CartItem::updateOrCreate(
                    [
                        'cart_id' => $cart->id,
                        'product_id' => $product->id,
                    ],
                    [
                        'quantity' => $quantity,
                    ]
                );
            }
        }

        // Create a few guest carts
        for ($i = 0; $i < 3; $i++) {
            $guestToken = Str::uuid();
            $cart = Cart::updateOrCreate(
                ['guest_token' => $guestToken],
                ['guest_token' => $guestToken]
            );

            $cartProducts = $products->random(fake()->numberBetween(1, min(3, $products->count())));

            foreach ($cartProducts as $product) {
                $quantity = fake()->numberBetween(1, min(5, $product->stock));

                CartItem::updateOrCreate(
                    [
                        'cart_id' => $cart->id,
                        'product_id' => $product->id,
                    ],
                    [
                        'quantity' => $quantity,
                    ]
                );
            }
        }
    }
}