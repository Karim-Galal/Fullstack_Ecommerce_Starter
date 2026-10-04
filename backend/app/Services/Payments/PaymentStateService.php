<?php

namespace App\Services\Payments;

use App\Jobs\SendOrderConfirmation;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentStateService
{
    private array $allowedTransitions = [
        'unpaid' => ['pending', 'paid', 'failed'],
        'pending' => ['paid', 'failed', 'expired'],
        'failed' => ['paid'],
        'paid' => ['refunded'],
        'refunded' => [],
        'expired' => [],
    ];

    public function apply(Payment $payment, string $status, ?string $gatewayReference, array $metadata = []): Payment
    {
        return DB::transaction(function () use ($payment, $status, $gatewayReference, $metadata) {
            $payment = Payment::lockForUpdate()->with('order.items.product')->findOrFail($payment->id);

            $this->validateAmount($payment);

            if ($payment->status === $status) {
                return $payment;
            }

            $this->validateTransition($payment->status, $status);

            $payment->forceFill([
                'status' => $status,
                'gateway_reference' => $gatewayReference ?: $payment->gateway_reference,
                'paid_at' => $status === 'paid' ? now() : $payment->paid_at,
                'gateway_metadata' => array_merge($payment->gateway_metadata ?? [], $metadata),
            ])->save();

            if ($status === 'paid') {
                $payment->order->update(['status' => 'confirmed']);

                SendOrderConfirmation::dispatch($payment->order_id)->afterCommit();
            }

            if ($status === 'expired') {
                $this->restoreStock($payment);
            }

            return $payment;
        });
    }

    private function validateAmount(Payment $payment): void
    {
        if (round((float) $payment->amount, 2) !== round((float) $payment->order->total, 2)) {
            throw ValidationException::withMessages([
                'payment' => ['Payment amount does not match its order.'],
            ]);
        }
    }

    private function validateTransition(string $current, string $next): void
    {
        if (! in_array($next, $this->allowedTransitions[$current] ?? [], true)) {
            throw ValidationException::withMessages([
                'payment' => ['Invalid payment state transition.'],
            ]);
        }
    }

    private function restoreStock(Payment $payment): void
    {
        foreach ($payment->order->items as $item) {
            if ($item->product) {
                $item->product->increment('stock', $item->quantity);
            }
        }
    }
}
