<?php

namespace App\Policies;

use App\Models\Offer;
use App\Models\User;

class OfferPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAdmin('offers.view');
    }

    public function view(User $user, Offer $offer): bool
    {
        return $user->canAdmin('offers.view');
    }

    public function create(User $user): bool
    {
        return $user->canAdmin('offers.create');
    }

    public function update(User $user, Offer $offer): bool
    {
        return $user->canAdmin('offers.update');
    }

    public function delete(User $user, Offer $offer): bool
    {
        return $user->canAdmin('offers.delete');
    }

    public function restore(User $user, Offer $offer): bool
    {
        return $this->update($user, $offer);
    }

    public function forceDelete(User $user, Offer $offer): bool
    {
        return $this->delete($user, $offer);
    }
}
