<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAdmin('users.view');
    }

    public function create(User $user): bool
    {
        return $user->isMasterAdmin();
    }

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

    public function restore(User $user, User $target): bool
    {
        return $user->isMasterAdmin();
    }

    public function forceDelete(User $user, User $target): bool
    {
        return $this->update($user, $target);
    }
}
