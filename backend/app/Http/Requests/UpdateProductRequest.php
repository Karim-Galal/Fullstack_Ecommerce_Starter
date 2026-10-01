<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sku' => ['sometimes', 'nullable', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($this->route('product'))],
            'category_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],

            'translations' => ['sometimes', 'array', 'min:1'],
            'translations.*.locale' => ['required', 'string', 'in:en,ar', 'distinct'],
            'translations.*.name' => ['required', 'string', 'max:255'],
            'translations.*.description' => ['nullable', 'string'],
            'translations.*.meta_title' => ['nullable', 'string', 'max:255'],
            'translations.*.meta_description' => ['nullable', 'string'],
        ];
    }
}
