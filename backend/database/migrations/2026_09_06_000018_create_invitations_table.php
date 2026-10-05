<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitations', function (Blueprint $table) {
            $table->id();
            $table->string('invited_email');
            $table->string('token_hash', 64)->unique();
            $table->string('type')->default('staff');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('pending')->index();
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
            $table->index('invited_email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitations');
    }
};
