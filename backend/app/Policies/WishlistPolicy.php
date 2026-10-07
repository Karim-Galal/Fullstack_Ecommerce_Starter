<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Wishlist;

class WishlistPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAdmin('wishlists.view');
    }

    public function view(User $user, Wishlist $wishlist): bool
    {
        return $wishlist->user_id === $user->id
            || $user->canAdmin('wishlists.view');
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function delete(User $user, Wishlist $wishlist): bool
    {
        return $wishlist->user_id === $user->id;
    }
}
