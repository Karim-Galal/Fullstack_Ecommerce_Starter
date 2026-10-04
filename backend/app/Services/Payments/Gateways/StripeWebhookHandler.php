<?php

namespace App\Services\Payments\Gateways;

use App\Models\Payment;
use Illuminate\Http\Request;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;
use UnexpectedValueException;

class StripeWebhookHandler
{
    public function handle(Request $request): array
    {
        $secret = config('services.stripe.webhook_secret');
        $signature = $request->header('Stripe-Signature');
        $payload = $request->getContent();

        try {
            $event = Webhook::constructEvent($payload, $signature, $secret);
        } catch (UnexpectedValueException|SignatureVerificationException $e) {
            abort(400, 'Invalid Stripe webhook.');
        }

        $object = $event->data->object;

        return match ($event->type) {
            'payment_intent.succeeded' => $this->paymentIntent($event->id, $object, 'paid'),
            'payment_intent.payment_failed' => $this->paymentIntent($event->id, $object, 'failed'),
            'charge.refunded' => $this->refunded($event->id, $object),
            default => [
                'event_id' => $event->id,
                'status' => null,
                'payment' => null,
                'metadata' => ['event_type' => $event->type],
            ],
        };
    }

    private function paymentIntent(string $eventId, object $intent, string $status): array
    {
        $payment = Payment::where('gateway', 'stripe')
            ->where('gateway_reference', $intent->id)
            ->firstOrFail();

        $this->assertAmount($intent->amount_received ?: $intent->amount, $payment);

        return [
            'event_id' => $eventId,
            'status' => $status,
            'payment' => $payment,
            'gateway_reference' => $intent->id,
            'metadata' => [
                'stripe_event_id' => $eventId,
                'payment_intent_id' => $intent->id,
            ],
        ];
    }

    private function refunded(string $eventId, object $charge): array
    {
        $paymentIntentId = $charge->payment_intent;

        $payment = Payment::where('gateway', 'stripe')
            ->where('gateway_reference', $paymentIntentId)
            ->firstOrFail();

        return [
            'event_id' => $eventId,
            'status' => 'refunded',
            'payment' => $payment,
            'gateway_reference' => $charge->id,
            'metadata' => [
                'stripe_event_id' => $eventId,
                'refund_charge_id' => $charge->id,
            ],
        ];
    }

    private function assertAmount(int $minorAmount, Payment $payment): void
    {
        if ((int) $minorAmount !== (int) round((float) $payment->amount * 100)) {
            abort(422, 'Payment amount mismatch.');
        }
    }
}
