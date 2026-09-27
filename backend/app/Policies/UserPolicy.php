<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function manageStaff(User $user): bool
    {
        return $user->isMasterAdmin();
    }

    public function update(User $user, User $target): bool
    {
        return $user->isMasterAdmin() && $target->role !== 'master_admin';
    }

    public function delete(User $user, User $target): bool
    {
        return $this->update($user, $target);
    }
}
