<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RefundPaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->canAdmin('payments.refund') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Amount is expressed in major currency units. Omitting it requests
            // a full refund through the configured payment gateway.
            'amount' => [
                'sometimes',
                'nullable',
                'numeric',
                'gt:0',
                function (string $attribute, mixed $value, \Closure $fail) {
                    $payment = $this->route('payment');

                    if (
                        $payment instanceof \App\Models\Payment
                        && (float) $value > (float) $payment->amount
                    ) {
                        $fail(__('api.refund_amount_exceeds_payment'));
                    }
                },
            ],
        ];
    }
}
