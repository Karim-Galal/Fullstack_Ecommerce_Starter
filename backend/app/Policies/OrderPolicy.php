<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAdmin('orders.view');
    }

    public function view(User $user, Order $order): bool
    {
        return $order->user_id === $user->id
            || $user->canAdmin('orders.view');
    }

    public function update(User $user, Order $order): bool
    {
        return $user->canAdmin('orders.update');
    }
}
