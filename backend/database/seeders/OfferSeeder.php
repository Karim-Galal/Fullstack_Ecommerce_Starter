<?php

namespace Database\Seeders;

use App\Models\Offer;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class OfferSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();
        $products = Product::where('is_active', true)->get();

        if (! $admin || $products->isEmpty()) {
            return;
        }

        $offers = [
            [
                'name' => 'Summer Sale - 15% Off',
                'type' => 'percentage',
                'value' => 15.00,
                'buy_quantity' => null,
                'get_quantity' => null,
                'starts_at' => now()->subDays(5),
                'ends_at' => now()->addDays(30),
                'is_active' => true,
                'product_ids' => $products->whereIn('slug', [
                    'classic-cotton-t-shirt',
                    'floral-summer-dress',
                    'canvas-sneakers',
                    'wool-blend-sweater',
                ])->pluck('id')->toArray(),
            ],
            [
                'name' => 'Electronics Special - $99.99',
                'type' => 'fixed_price',
                'value' => 99.99,
                'buy_quantity' => null,
                'get_quantity' => null,
                'starts_at' => now()->subDays(10),
                'ends_at' => now()->addDays(20),
                'is_active' => true,
                'product_ids' => $products->whereIn('slug', [
                    'wireless-headphones-x1',
                    'usb-c-charging-cable-2m',
                ])->pluck('id')->toArray(),
            ],
            [
                'name' => 'Buy 2 Get 1 Free - Shoes',
                'type' => 'buy_x_get_y',
                'value' => null,
                'buy_quantity' => 2,
                'get_quantity' => 1,
                'starts_at' => now()->subDays(2),
                'ends_at' => now()->addDays(14),
                'is_active' => true,
                'product_ids' => $products->whereIn('slug', [
                    'running-sneakers-pro',
                    'leather-casual-loafers',
                    'canvas-sneakers',
                ])->pluck('id')->toArray(),
            ],
            [
                'name' => 'Future Sale - 30% Off',
                'type' => 'percentage',
                'value' => 30.00,
                'buy_quantity' => null,
                'get_quantity' => null,
                'starts_at' => now()->addDays(30),
                'ends_at' => now()->addDays(60),
                'is_active' => true,
                'product_ids' => $products->pluck('id')->toArray(),
            ],
            [
                'name' => 'Expired Offer - 20% Off',
                'type' => 'percentage',
                'value' => 20.00,
                'buy_quantity' => null,
                'get_quantity' => null,
                'starts_at' => now()->subDays(60),
                'ends_at' => now()->subDays(10),
                'is_active' => true,
                'product_ids' => $products->take(3)->pluck('id')->toArray(),
            ],
        ];

        foreach ($offers as $offerData) {
            $productIds = $offerData['product_ids'];
            unset($offerData['product_ids']);

            $offer = Offer::updateOrCreate(
                ['name' => $offerData['name']],
                array_merge($offerData, ['created_by' => $admin->id])
            );

            $offer->products()->sync($productIds);
        }
    }
}