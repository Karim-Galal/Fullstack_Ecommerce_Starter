<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
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
            'shipping_address' => $this->shipping_address,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ] : null),
            'shipping_method' => $this->whenLoaded('shippingMethod', fn () => $this->shippingMethod ? [
                'id' => $this->shippingMethod->id,
                'name' => $this->shippingMethod->name,
                'price' => $this->shippingMethod->price,
            ] : null),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'invoice' => $this->whenLoaded('invoice', fn () => $this->invoice
                ? new InvoiceResource($this->invoice)
                : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,
        ];
    }
}
