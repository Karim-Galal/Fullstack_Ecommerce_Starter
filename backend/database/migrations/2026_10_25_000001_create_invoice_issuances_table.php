<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_issuances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->unique()
                ->constrained()
                ->restrictOnDelete();

            $table->string('status', 20)->default('pending');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('available_at')->nullable();
            $table->timestamp('last_attempted_at')->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->text('last_error')->nullable();

            $table->timestamps();

            $table->index(['status', 'available_at']);
        });

        DB::table('invoice_issuances')->insertUsing(
            ['order_id', 'status', 'available_at', 'created_at', 'updated_at'],
            DB::table('orders')
                ->select([
                    'orders.id',
                    DB::raw("'pending'"),
                    DB::raw('CURRENT_TIMESTAMP'),
                    DB::raw('CURRENT_TIMESTAMP'),
                    DB::raw('CURRENT_TIMESTAMP'),
                ])
                ->where('orders.status', 'confirmed')
                ->whereExists(function ($query) {
                    $query->selectRaw('1')
                        ->from('payments')
                        ->whereColumn('payments.order_id', 'orders.id')
                        ->where('payments.status', 'paid');
                })
                ->whereNotExists(function ($query) {
                    $query->selectRaw('1')
                        ->from('invoices')
                        ->whereColumn('invoices.order_id', 'orders.id');
                })
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_issuances');
    }
};
