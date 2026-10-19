<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexStoreProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'collection_id' => ['sometimes', 'integer', 'exists:collections,id'],
            'min_price' => ['sometimes', 'numeric', 'min:0'],
            'max_price' => array_filter([
                'sometimes',
                'numeric',
                'min:0',
                $this->filled('min_price') ? 'gte:min_price' : null,
            ]),
            'in_stock' => ['sometimes', Rule::in(['0', '1', 'true', 'false'])],
            'sort' => ['sometimes', 'string', Rule::in(['price', 'created_at'])],
            'direction' => ['sometimes', 'string', Rule::in(['asc', 'desc'])],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
