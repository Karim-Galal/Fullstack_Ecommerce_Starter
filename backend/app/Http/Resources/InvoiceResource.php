<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'status' => $this->status,
            'currency' => $this->currency,
            'subtotal' => $this->subtotal,
            'discount_total' => $this->discount_total,
            'shipping_total' => $this->shipping_total,
            'total' => $this->total,
            'issued_at' => $this->issued_at,

            'order' => $this->whenLoaded('order', function () {
                return [
                    'id' => $this->order->id,
                    'number' => $this->order->number,
                    'status' => $this->order->status,
                    'currency' => $this->order->currency,
                    'subtotal' => $this->order->subtotal,
                    'discount_total' => $this->order->discount_total,
                    'shipping_total' => $this->order->shipping_total,
                    'total' => $this->order->total,
                    'shipping_address' => $this->order->shipping_address,
                    'items' => $this->order->relationLoaded('items')
                        ? OrderItemResource::collection($this->order->items)
                        : [],
                    'user' => $this->order->relationLoaded('user')
                        ? [
                            'id' => $this->order->user->id,
                            'name' => $this->order->user->name,
                            'email' => $this->order->user->email,
                        ]
                        : null,
                ];
            }),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
