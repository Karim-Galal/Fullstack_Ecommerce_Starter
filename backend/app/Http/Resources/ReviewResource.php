<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'user_id' => $this->user_id,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'status' => $this->status,

            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                ];
            }),

            'product' => $this->whenLoaded('product', function () {
                return [
                    'id' => $this->product->id,
                    'slug' => $this->product->slug,
                ];
            }),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
