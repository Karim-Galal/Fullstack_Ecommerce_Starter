<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        if (env('INITIAL_MASTER_ADMIN_EMAIL') && env('INITIAL_MASTER_ADMIN_PASSWORD')) {
            User::firstOrCreate(
                ['email' => env('INITIAL_MASTER_ADMIN_EMAIL')],
                [
                    'name' => env('INITIAL_MASTER_ADMIN_NAME', 'Initial Master Admin'),
                    'password' => Hash::make(env('INITIAL_MASTER_ADMIN_PASSWORD')),
                    'role' => 'master_admin',
                    'status' => 'active',
                ]
            );
        }

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
