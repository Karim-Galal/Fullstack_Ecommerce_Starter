<?php

namespace Database\Seeders;

use App\Models\Invitation;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class InvitationSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();

        if (! $admin) {
            return;
        }

        $invitations = [
            [
                'invited_email' => 'newstaff1@example.com',
                'type' => 'staff',
                'status' => 'pending',
                'expires_at' => now()->addDays(7),
            ],
            [
                'invited_email' => 'newstaff2@example.com',
                'type' => 'staff',
                'status' => 'accepted',
                'expires_at' => now()->addDays(7),
                'accepted_at' => now()->subDays(2),
            ],
            [
                'invited_email' => 'newmaster@example.com',
                'type' => 'master_admin',
                'status' => 'pending',
                'expires_at' => now()->addDays(7),
            ],
            [
                'invited_email' => 'rejectedstaff@example.com',
                'type' => 'staff',
                'status' => 'rejected',
                'expires_at' => now()->subDays(1),
                'rejected_at' => now()->subDays(1),
            ],
            [
                'invited_email' => 'revokedstaff@example.com',
                'type' => 'staff',
                'status' => 'revoked',
                'expires_at' => now()->addDays(7),
                'revoked_at' => now()->subDays(3),
            ],
        ];

        foreach ($invitations as $invitationData) {
            $token = Str::random(40);

            Invitation::updateOrCreate(
                ['invited_email' => $invitationData['invited_email']],
                array_merge($invitationData, [
                    'token_hash' => hash('sha256', $token),
                    'created_by' => $admin->id,
                ])
            );
        }
    }
}