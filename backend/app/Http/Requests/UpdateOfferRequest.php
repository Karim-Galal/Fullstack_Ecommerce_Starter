<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'type' => ['sometimes', 'string', Rule::in(['percentage', 'fixed', 'buy_x_get_y'])],
            'value' => ['nullable', 'numeric', 'gt:0'],
            'buy_quantity' => ['nullable', 'integer', 'min:1'],
            'get_quantity' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['sometimes', 'boolean'],
            'product_ids' => ['sometimes', 'array', 'min:1'],
            'product_ids.*' => ['integer', 'distinct', 'exists:products,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $offer = $this->route('offer');

            $type = $this->has('type')
                ? $this->input('type')
                : $offer?->type;

            $value = $this->has('value')
                ? $this->input('value')
                : $offer?->value;

            if (in_array($type, ['percentage', 'fixed'], true) && $value === null) {
                $validator->errors()->add('value', 'The value field is required for this offer type.');
            }

            if ($type === 'percentage' && $value !== null && (float) $value > 100) {
                $validator->errors()->add('value', 'The percentage value may not exceed 100.');
            }

            if ($type === 'buy_x_get_y') {
                $buyQuantity = $this->has('buy_quantity')
                    ? $this->input('buy_quantity')
                    : $offer?->buy_quantity;

                $getQuantity = $this->has('get_quantity')
                    ? $this->input('get_quantity')
                    : $offer?->get_quantity;

                if (! $buyQuantity) {
                    $validator->errors()->add('buy_quantity', 'The buy quantity is required for this offer type.');
                }

                if (! $getQuantity) {
                    $validator->errors()->add('get_quantity', 'The get quantity is required for this offer type.');
                }
            }
        });
    }
}
