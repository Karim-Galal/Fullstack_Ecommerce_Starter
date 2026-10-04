<?php

namespace App\Services\Payments;

use App\Models\Payment;
use Illuminate\Validation\ValidationException;

class PaymentInitiationService
{
    public function __construct(private PaymentGatewayManager $gateways) {}

    public function initiate(Payment $payment): array
    {
        if ($payment->status !== 'pending') {
            throw ValidationException::withMessages([
                'payment' => ['Only pending payments can be initiated.'],
            ]);
        }

        if ($payment->expires_at && $payment->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'payment' => ['This payment has expired and cannot be initiated.'],
            ]);
        }

        // If payment already has gateway reference and client_secret, return existing info
        if ($payment->gateway_reference && ($payment->gateway_metadata['client_secret'] ?? null)) {
            return [
                'gateway' => $payment->gateway,
                'status' => $payment->status,
                'client_secret' => $payment->gateway_metadata['client_secret'],
                'gateway_reference' => $payment->gateway_reference,
            ];
        }

        $payment->loadMissing('order.items', 'order.user');

        $result = $this->gateways
            ->gateway($payment->gateway)
            ->createPayment($payment, $payment->order);

        $payment->update([
            'gateway_reference' => $result['gateway_reference'] ?: $payment->gateway_reference,
            'gateway_metadata' => array_merge(
                $payment->gateway_metadata ?? [],
                $result['metadata'] ?? []
            ),
        ]);

        return [
            'gateway' => $payment->gateway,
            'status' => $result['status'],
            'client_secret' => $result['client_secret'] ?? null,
            'gateway_reference' => $payment->gateway_reference,
        ];
    }
}
