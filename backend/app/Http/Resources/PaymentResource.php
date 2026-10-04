<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'gateway' => $this->gateway,
            'payment_method' => $this->payment_method,
            'status' => $this->status,
            'transaction_reference' => $this->transaction_reference,
            'gateway_reference' => $this->gateway_reference,
            'paid_at' => $this->paid_at,
        ];
    }
}
