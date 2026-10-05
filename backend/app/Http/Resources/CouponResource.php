<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CouponResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'discount_type' => $this->discount_type,
            'discount_amount' => $this->discount_amount,
            'minimum_order' => $this->minimum_order,
            'usage_limit' => $this->usage_limit,
            'used_count' => $this->used_count,
            'starts_at' => $this->starts_at,
            'expires_at' => $this->expires_at,
            'is_active' => $this->is_active,
            'created_by' => $this->created_by,
            'products' => ProductResource::collection($this->whenLoaded('products')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
