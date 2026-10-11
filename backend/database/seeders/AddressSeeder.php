<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Seeder;

class AddressSeeder extends Seeder
{
    public function run(): void
    {
        $customers = User::where('role', 'customer')->get();

        if ($customers->isEmpty()) {
            return;
        }

        $addresses = [
            [
                'user_email' => 'customer1@gmail.com',
                'name' => 'Customer One',
                'phone' => '+201000000001',
                'line1' => '123 Main Street',
                'line2' => 'Apt 4B',
                'city' => 'Cairo',
                'country' => 'EG',
                'postal_code' => '11511',
                'is_default' => true,
            ],
            [
                'user_email' => 'customer1@gmail.com',
                'name' => 'Customer One - Work',
                'phone' => '+201000000002',
                'line1' => '456 Business Ave',
                'line2' => 'Floor 10',
                'city' => 'Cairo',
                'country' => 'EG',
                'postal_code' => '11512',
                'is_default' => false,
            ],
            [
                'user_email' => 'customer2@gmail.com',
                'name' => 'Customer Two',
                'phone' => '+201000000003',
                'line1' => '789 Palm Street',
                'line2' => null,
                'city' => 'Alexandria',
                'country' => 'EG',
                'postal_code' => '21511',
                'is_default' => true,
            ],
            [
                'user_email' => 'customer3@gmail.com',
                'name' => 'Customer Three',
                'phone' => '+201000000004',
                'line1' => '321 Nile Corniche',
                'line2' => 'Villa 5',
                'city' => 'Giza',
                'country' => 'EG',
                'postal_code' => '12511',
                'is_default' => true,
            ],
            [
                'user_email' => 'customer4@gmail.com',
                'name' => 'Customer Four',
                'phone' => '+201000000005',
                'line1' => '555 Downtown Blvd',
                'line2' => 'Suite 200',
                'city' => 'Cairo',
                'country' => 'EG',
                'postal_code' => '11513',
                'is_default' => true,
            ],
            [
                'user_email' => 'customer5@gmail.com',
                'name' => 'Customer Five',
                'phone' => '+201000000006',
                'line1' => '999 Garden City',
                'line2' => null,
                'city' => 'Cairo',
                'country' => 'EG',
                'postal_code' => '11514',
                'is_default' => true,
            ],
        ];

        foreach ($addresses as $addressData) {
            $user = $customers->where('email', $addressData['user_email'])->first();
            if (! $user) {
                continue;
            }

            $userEmail = $addressData['user_email'];
            unset($addressData['user_email']);

            // Check if this exact address already exists for this user
            $existing = Address::where('user_id', $user->id)
                ->where('line1', $addressData['line1'])
                ->where('city', $addressData['city'])
                ->first();

            if (! $existing) {
                Address::create(array_merge($addressData, ['user_id' => $user->id]));
            }
        }
    }
}