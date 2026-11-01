<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexAdminOffersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', Rule::in(['0', '1', 'true', 'false'])],
            'type' => ['sometimes', 'string', Rule::in(['percentage', 'fixed', 'buy_x_get_y'])],
            'trashed' => ['sometimes', Rule::in(['0', '1', 'true', 'false'])],
            'sort' => ['sometimes', 'string', Rule::in(['created_at', 'name', 'starts_at', 'ends_at'])],
            'direction' => ['sometimes', 'string', Rule::in(['asc', 'desc'])],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
