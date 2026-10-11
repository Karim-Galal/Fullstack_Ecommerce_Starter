<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            CollectionSeeder::class,
            ShippingMethodSeeder::class,
            AddressSeeder::class,
            CartSeeder::class,
            OrderSeeder::class,
            PaymentSeeder::class,
            CouponSeeder::class,
            OfferSeeder::class,
            ReviewSeeder::class,
            InvitationSeeder::class,
            WishlistSeeder::class,
            ProductImageSeeder::class,
        ]);
    }
}
