<?php

namespace Database\Seeders;

use App\Models\ShippingMethod;
use Illuminate\Database\Seeder;

class ShippingMethodSeeder extends Seeder
{
    public function run(): void
    {
        ShippingMethod::firstOrCreate(
            ['name' => 'Free Shipping'],
            [
                'description' => 'Default shipping method.',
                'price' => 0,
                'is_active' => true,
                'is_default' => true,
            ]
        );
    }
}
