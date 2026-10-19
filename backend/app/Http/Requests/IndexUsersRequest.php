<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexUsersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'role' => ['sometimes', 'string', Rule::in(['master_admin', 'staff', 'customer'])],
            'status' => ['sometimes', 'string', Rule::in(['active', 'inactive', 'pending_approval'])],
            'email_verified' => ['sometimes', Rule::in(['0', '1', 'true', 'false'])],
            'created_from' => ['sometimes', 'date'],
            'created_to' => array_filter([
                'sometimes',
                'date',
                $this->filled('created_from') ? 'after_or_equal:created_from' : null,
            ]),
            'sort' => ['sometimes', 'string', Rule::in(['name', 'email', 'role', 'status', 'created_at'])],
            'direction' => ['sometimes', 'string', Rule::in(['asc', 'desc'])],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
