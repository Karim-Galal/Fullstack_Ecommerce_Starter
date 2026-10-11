<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class WishlistSeeder extends Seeder
{
    public function run(): void
    {
        $customers = User::where('role', 'customer')->get();
        $products = Product::where('is_active', true)->get();

        if ($customers->isEmpty() || $products->isEmpty()) {
            return;
        }

        foreach ($customers as $customer) {
            // Add 2-5 random products to wishlist
            $wishlistCount = fake()->numberBetween(2, min(5, $products->count()));
            $wishlistProducts = $products->random($wishlistCount);

            foreach ($wishlistProducts as $product) {
                $customer->wishlist()->syncWithoutDetaching([$product->id]);
            }
        }
    }
}