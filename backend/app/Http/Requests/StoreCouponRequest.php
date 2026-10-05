<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'code'            => 'required|string|max:255|unique:coupons,code',
            'discount_type'   => 'required|string|in:percentage,fixed',
            'discount_amount' => 'required|numeric|gt:0',
            'minimum_order'   => 'nullable|numeric|min:0',
            'usage_limit'     => 'nullable|integer|min:1',
            'starts_at'       => 'nullable|date',
            'expires_at'      => 'nullable|date|after_or_equal:starts_at',
            'is_active'       => 'sometimes|boolean',
            'product_ids'     => 'required|array|min:1',
            'product_ids.*'   => 'integer|distinct|exists:products,id',
        ];

        if ($this->input('discount_type') === 'percentage') {
            $rules['discount_amount'] .= '|lte:100';
        }

        return $rules;
    }
}
