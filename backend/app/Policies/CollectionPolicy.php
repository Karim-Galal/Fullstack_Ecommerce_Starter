<?php

namespace App\Policies;

use App\Models\Collection;
use App\Models\User;

class CollectionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAdmin('collections.view');
    }

    public function view(User $user, Collection $collection): bool
    {
        return $user->canAdmin('collections.view');
    }

    public function create(User $user): bool
    {
        return $user->canAdmin('collections.create');
    }

    public function update(User $user, Collection $collection): bool
    {
        return $user->canAdmin('collections.update');
    }

    public function delete(User $user, Collection $collection): bool
    {
        return $user->canAdmin('collections.delete');
    }
}
