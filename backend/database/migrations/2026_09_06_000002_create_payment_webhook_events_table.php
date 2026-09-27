<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_webhook_events', function (Blueprint $t) {
            $t->id();
            $t->string('gateway');
            $t->string('event_id');
            $t->string('payload_hash', 64);
            $t->timestamp('processed_at')->nullable();
            $t->timestamps();
            $t->unique(['gateway', 'event_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_webhook_events');
    }
};
