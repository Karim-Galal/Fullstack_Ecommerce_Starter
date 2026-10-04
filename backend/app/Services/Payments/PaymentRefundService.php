<?php

namespace App\Services\Payments;

use App\Models\Payment;
use Illuminate\Validation\ValidationException;

class PaymentRefundService
{
    public function __construct(private PaymentGatewayManager $gateways) {}

    public function refund(Payment $payment, ?int $amount = null): array
    {
        if ($payment->status !== 'paid') {
            throw ValidationException::withMessages([
                'payment' => ['Only paid payments can be refunded.'],
            ]);
        }

        return $this->gateways
            ->gateway($payment->gateway)
            ->refund($payment, $amount);
    }
}
