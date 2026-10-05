<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', Rule::in(['percentage', 'fixed', 'buy_x_get_y'])],
            'value' => ['nullable', 'numeric', 'gt:0'],
            'buy_quantity' => ['nullable', 'integer', 'min:1'],
            'get_quantity' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['sometimes', 'boolean'],
            'product_ids' => ['required', 'array', 'min:1'],
            'product_ids.*' => ['integer', 'distinct', 'exists:products,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $type = $this->input('type');

            if (in_array($type, ['percentage', 'fixed'], true) && ! $this->filled('value')) {
                $validator->errors()->add('value', 'The value field is required for this offer type.');
            }

            if ($type === 'percentage' && (float) $this->input('value') > 100) {
                $validator->errors()->add('value', 'The percentage value may not exceed 100.');
            }

            if ($type === 'buy_x_get_y') {
                if (! $this->filled('buy_quantity')) {
                    $validator->errors()->add('buy_quantity', 'The buy quantity is required for this offer type.');
                }

                if (! $this->filled('get_quantity')) {
                    $validator->errors()->add('get_quantity', 'The get quantity is required for this offer type.');
                }
            }
        });
    }
}
