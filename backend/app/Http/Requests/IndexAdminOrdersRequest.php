<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexAdminOrdersRequest extends FormRequest
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
                'pending',
                'confirmed',
                'shipped',
                'delivered',
                'cancelled',
            ])],
            'created_from' => ['sometimes', 'date'],
            'created_to' => array_filter([
                'sometimes',
                'date',
                $this->filled('created_from') ? 'after_or_equal:created_from' : null,
            ]),
            'sort' => ['sometimes', 'string', Rule::in(['created_at', 'total', 'number', 'status'])],
            'direction' => ['sometimes', 'string', Rule::in(['asc', 'desc'])],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
