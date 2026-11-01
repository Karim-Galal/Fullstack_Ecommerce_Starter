<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug' => ['sometimes', 'nullable', 'string', 'alpha_dash', 'max:180'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],

            'translations' => ['required', 'array', 'min:1'],
            'translations.*.locale' => ['required', 'string', 'in:en,ar', 'distinct'],
            'translations.*.name' => ['required', 'string', 'max:255'],
            'translations.*.description' => ['nullable', 'string'],
            'translations.*.meta_title' => ['nullable', 'string', 'max:255'],
            'translations.*.meta_description' => ['nullable', 'string', 'max:500'],
        ];
    }
}
