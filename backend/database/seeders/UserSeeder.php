<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Master Admin
        User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'Master Admin',
                'password' => Hash::make('12345678'),
                'role' => 'master_admin',
                'status' => 'active',
                'email_verified_at' => now(),
                'permissions' => [],
            ]
        );

        // Staff 1
        User::updateOrCreate(
            ['email' => 'staff1@gmail.com'],
            [
                'name' => 'Staff One',
                'password' => Hash::make('12345678'),
                'role' => 'staff',
                'status' => 'active',
                'email_verified_at' => now(),
                'permissions' => [
                    'products.view',
                    'products.create',
                    'products.update',
                    'products.delete',
                    'categories.view',
                    'categories.create',
                    'categories.update',
                    'categories.delete',
                ],
            ]
        );

        // Staff 2
        User::updateOrCreate(
            ['email' => 'staff2@gmail.com'],
            [
                'name' => 'Staff Two',
                'password' => Hash::make('12345678'),
                'role' => 'staff',
                'status' => 'active',
                'email_verified_at' => now(),
                'permissions' => [
                    'products.view',
                    'products.create',
                    'products.update',
                    'products.delete',
                    'categories.view',
                    'categories.create',
                    'categories.update',
                    'categories.delete',
                ],
            ]
        );

        // Staff 3
        User::updateOrCreate(
            ['email' => 'staff3@gmail.com'],
            [
                'name' => 'Staff Three',
                'password' => Hash::make('12345678'),
                'role' => 'staff',
                'status' => 'active',
                'email_verified_at' => now(),
                'permissions' => [
                    'products.view',
                    'products.create',
                    'products.update',
                    'products.delete',
                    'categories.view',
                    'categories.create',
                    'categories.update',
                    'categories.delete',
                ],
            ]
        );

        // Customer 1
        User::updateOrCreate(
            ['email' => 'customer1@gmail.com'],
            [
                'name' => 'Customer One',
                'password' => Hash::make('12345678'),
                'role' => 'customer',
                'status' => 'active',
                'email_verified_at' => now(),
                'permissions' => [],
            ]
        );

        // Customer 2
        User::updateOrCreate(
            ['email' => 'customer2@gmail.com'],
            [
                'name' => 'Customer Two',
                'password' => Hash::make('12345678'),
                'role' => 'customer',
                'status' => 'active',
                'email_verified_at' => now(),
                'permissions' => [],
            ]
        );

        // Customer 3
        User::updateOrCreate(
            ['email' => 'customer3@gmail.com'],
            [
                'name' => 'Customer Three',
                'password' => Hash::make('12345678'),
                'role' => 'customer',
                'status' => 'active',
                'email_verified_at' => now(),
                'permissions' => [],
            ]
        );

        // Customer 4
        User::updateOrCreate(
            ['email' => 'customer4@gmail.com'],
            [
                'name' => 'Customer Four',
                'password' => Hash::make('12345678'),
                'role' => 'customer',
                'status' => 'active',
                'email_verified_at' => now(),
                'permissions' => [],
            ]
        );

        // Customer 5
        User::updateOrCreate(
            ['email' => 'customer5@gmail.com'],
            [
                'name' => 'Customer Five',
                'password' => Hash::make('12345678'),
                'role' => 'customer',
                'status' => 'active',
                'email_verified_at' => now(),
                'permissions' => [],
            ]
        );
    }
}