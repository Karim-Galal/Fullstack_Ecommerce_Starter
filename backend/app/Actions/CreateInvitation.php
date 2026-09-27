<?php

namespace App\Actions;

use App\Models\Invitation;
use App\Models\User;
use Illuminate\Support\Str;

class CreateInvitation
{
    public function handle(User $creator, string $email, string $type): array
    {
        $token = Str::random(80);
        $invitation = Invitation::create([
            'invited_email' => mb_strtolower($email),
            'token_hash' => hash('sha256', $token),
            'type' => $type,
            'created_by' => $creator->id,
            'expires_at' => now()->addDays((int) config('ecommerce.invitation_days', 7)),
        ]);

        return [$invitation, $token];
    }
}
