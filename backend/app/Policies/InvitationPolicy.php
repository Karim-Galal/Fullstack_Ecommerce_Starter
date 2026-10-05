<?php

namespace App\Policies;

use App\Models\Invitation;
use App\Models\User;

class InvitationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isMasterAdmin();
    }

    public function view(User $user, Invitation $invitation): bool
    {
        return $user->isMasterAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isMasterAdmin();
    }

    public function approve(User $user, Invitation $invitation): bool
    {
        return $user->isMasterAdmin();
    }

    public function reject(User $user, Invitation $invitation): bool
    {
        return $user->isMasterAdmin();
    }

    public function revoke(User $user, Invitation $invitation): bool
    {
        return $user->isMasterAdmin();
    }
}
