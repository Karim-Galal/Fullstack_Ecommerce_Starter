<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'rating' => ['sometimes', 'integer', 'between:1,5'],
            'comment' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }
}
