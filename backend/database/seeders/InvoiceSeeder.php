<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Services\InvoiceService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class InvoiceSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $orders = Order::query()
            ->where('status', 'confirmed')
            ->whereDoesntHave('invoice')
            ->get();

        $service = app(InvoiceService::class);

        foreach ($orders as $order) {
            $service->issueForOrder($order);
        }
    }
}
