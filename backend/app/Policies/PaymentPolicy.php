<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAdmin('payments.view');
    }

    public function view(User $user, Payment $payment): bool
    {
        return $user->canAdmin('payments.view');
    }

    public function refund(User $user, Payment $payment): bool
    {
        return $user->canAdmin('payments.refund');
    }
}
