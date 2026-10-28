<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAdmin('invoices.view');
    }

    public function view(User $user, Invoice $invoice): bool
    {
        return $invoice->order?->user_id === $user->id
            || $user->canAdmin('invoices.view');
    }
}
