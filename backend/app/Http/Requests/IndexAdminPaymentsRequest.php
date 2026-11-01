<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexAdminPaymentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'string', Rule::in([
                'unpaid',
                'pending',
                'paid',
                'failed',
                'refunded',
                'expired',
            ])],
            'gateway' => ['sometimes', 'string', Rule::in(['stripe', 'paymob'])],
            'created_from' => ['sometimes', 'date'],
            'created_to' => array_filter([
                'sometimes',
                'date',
                $this->filled('created_from') ? 'after_or_equal:created_from' : null,
            ]),
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
