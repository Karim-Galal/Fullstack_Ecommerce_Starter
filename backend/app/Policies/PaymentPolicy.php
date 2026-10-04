<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function view(User $user, Payment $payment): bool
    {
        return $payment->order->user_id === $user->id;
    }

    public function initiate(User $user, Payment $payment): bool
    {
        return $payment->order->user_id === $user->id;
    }

    public function refund(User $user, Payment $payment): bool
    {
        return $user->isMasterAdmin() || ($user->isActiveStaff() && $user->canAdmin('payments.refund'));
    }
}
