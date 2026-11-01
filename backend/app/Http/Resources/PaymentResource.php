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
            'expires_at' => $this->expires_at,
            'order' => $this->whenLoaded('order', fn () => $this->order ? [
                'id' => $this->order->id,
                'number' => $this->order->number,
                'status' => $this->order->status,
                'total' => $this->order->total,
                'user' => $this->order->relationLoaded('user') && $this->order->user ? [
                    'id' => $this->order->user->id,
                    'name' => $this->order->user->name,
                    'email' => $this->order->user->email,
                ] : null,
            ] : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,
        ];
    }
}
