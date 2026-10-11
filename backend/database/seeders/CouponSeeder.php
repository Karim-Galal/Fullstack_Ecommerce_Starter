<?php

namespace Database\Seeders;

use App\Models\Coupon;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class CouponSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();
        $products = Product::where('is_active', true)->get();

        if (! $admin || $products->isEmpty()) {
            return;
        }

        $coupons = [
            [
                'code' => 'WELCOME10',
                'discount_type' => 'percentage',
                'discount_amount' => 10.00,
                'minimum_order' => 100.00,
                'usage_limit' => 100,
                'used_count' => 5,
                'starts_at' => now()->subDays(30),
                'expires_at' => now()->addDays(60),
                'is_active' => true,
                'product_ids' => $products->take(5)->pluck('id')->toArray(),
            ],
            [
                'code' => 'SAVE50',
                'discount_type' => 'fixed',
                'discount_amount' => 50.00,
                'minimum_order' => 200.00,
                'usage_limit' => 50,
                'used_count' => 12,
                'starts_at' => now()->subDays(10),
                'expires_at' => now()->addDays(20),
                'is_active' => true,
                'product_ids' => $products->pluck('id')->toArray(),
            ],
            [
                'code' => 'SUMMER20',
                'discount_type' => 'percentage',
                'discount_amount' => 20.00,
                'minimum_order' => 150.00,
                'usage_limit' => 200,
                'used_count' => 45,
                'starts_at' => now()->subDays(5),
                'expires_at' => now()->addDays(90),
                'is_active' => true,
                'product_ids' => $products->whereIn('slug', ['classic-cotton-t-shirt', 'floral-summer-dress', 'canvas-sneakers'])->pluck('id')->toArray(),
            ],
            [
                'code' => 'EXPIRED10',
                'discount_type' => 'percentage',
                'discount_amount' => 10.00,
                'minimum_order' => 50.00,
                'usage_limit' => 100,
                'used_count' => 100,
                'starts_at' => now()->subDays(100),
                'expires_at' => now()->subDays(10),
                'is_active' => true,
                'product_ids' => $products->pluck('id')->toArray(),
            ],
            [
                'code' => 'INACTIVE25',
                'discount_type' => 'percentage',
                'discount_amount' => 25.00,
                'minimum_order' => 300.00,
                'usage_limit' => 25,
                'used_count' => 0,
                'starts_at' => now()->addDays(10),
                'expires_at' => now()->addDays(40),
                'is_active' => false,
                'product_ids' => $products->pluck('id')->toArray(),
            ],
        ];

        foreach ($coupons as $couponData) {
            $productIds = $couponData['product_ids'];
            unset($couponData['product_ids']);

            $coupon = Coupon::updateOrCreate(
                ['code' => $couponData['code']],
                array_merge($couponData, ['created_by' => $admin->id])
            );

            $coupon->products()->sync($productIds);
        }
    }
}