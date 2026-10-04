<?php

namespace App\Services\Payments\Gateways;

use App\Models\Order;
use App\Models\Payment;
use Stripe\StripeClient;

class StripeGateway
{
    private StripeClient $stripe;

    public function __construct()
    {
        $this->stripe = new StripeClient(config('services.stripe.secret'));
    }

    public function createPayment(Payment $payment, Order $order): array
    {
        $intent = $this->stripe->paymentIntents->create([
            'amount' => $this->toMinorUnits($payment->amount),
            'currency' => strtolower($payment->currency),
            'automatic_payment_methods' => ['enabled' => true],
            'metadata' => [
                'transaction_reference' => $payment->transaction_reference,
                'order_id' => (string) $order->id,
            ],
        ]);

        return [
            'gateway_reference' => $intent->id,
            'client_secret' => $intent->client_secret,
            'status' => $intent->status,
            'metadata' => [
                'payment_intent_id' => $intent->id,
            ],
        ];
    }

    public function refund(Payment $payment, ?int $amount = null): array
    {
        $params = [
            'payment_intent' => $payment->gateway_reference,
        ];

        if ($amount !== null) {
            $params['amount'] = $amount;
        }

        $refund = $this->stripe->refunds->create($params);

        return [
            'id' => $refund->id,
            'status' => $refund->status,
            'amount' => $refund->amount,
        ];
    }

    private function toMinorUnits(string|float $amount): int
    {
        return (int) round((float) $amount * 100);
    }
}
