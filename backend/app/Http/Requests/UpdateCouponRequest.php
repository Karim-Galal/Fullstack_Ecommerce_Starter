<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $coupon = $this->route('coupon');

        $rules = [
            'code'            => ['sometimes', 'string', 'max:255', Rule::unique('coupons', 'code')->ignore($coupon)],
            'discount_type'   => ['sometimes', 'string', 'in:percentage,fixed'],
            'discount_amount' => ['sometimes', 'numeric', 'gt:0'],
            'minimum_order'   => ['nullable', 'numeric', 'min:0'],
            'usage_limit'     => ['nullable', 'integer', 'min:1'],
            'starts_at'       => ['nullable', 'date'],
            'expires_at'      => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active'       => ['sometimes', 'boolean'],
            'product_ids'     => ['sometimes', 'array', 'min:1'],
            'product_ids.*'   => ['integer', 'distinct', 'exists:products,id'],
        ];

        $discountType = $this->has('discount_type')
            ? $this->input('discount_type')
            : $coupon?->discount_type;

        if ($discountType === 'percentage') {
            $rules['discount_amount'][] = 'lte:100';
        }

        if (! $this->has('starts_at') && $coupon?->starts_at) {
            $rules['expires_at'][] = 'after_or_equal:'.$coupon->starts_at->toDateTimeString();
        }

        return $rules;
    }
}
