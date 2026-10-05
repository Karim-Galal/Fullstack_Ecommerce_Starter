<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'type' => $this->input('type', 'staff'),
        ]);
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'type' => ['required', 'in:staff,master_admin'],
        ];
    }
}
