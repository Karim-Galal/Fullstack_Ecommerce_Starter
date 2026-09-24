<?php

namespace Database\Seeders;

use App\Models\{Store,User};
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $store=Store::firstOrCreate(['slug'=>env('INITIAL_STORE_SLUG','starter-store')],['name'=>env('INITIAL_STORE_NAME','Starter Store'),'currency'=>env('STORE_CURRENCY','EGP')]);
        if(env('INITIAL_MASTER_ADMIN_EMAIL') && env('INITIAL_MASTER_ADMIN_PASSWORD')) User::firstOrCreate(['email'=>env('INITIAL_MASTER_ADMIN_EMAIL')],['name'=>env('INITIAL_MASTER_ADMIN_NAME','Initial Master Admin'),'password'=>Hash::make(env('INITIAL_MASTER_ADMIN_PASSWORD')),'store_id'=>$store->id,'role'=>'master_admin','status'=>'active']);

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
