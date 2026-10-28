<?php

namespace App\Services\Payments;

use App\Jobs\IssueOrderInvoice;
use App\Jobs\SendOrderConfirmation;
use App\Models\InvoiceIssuance;
use App\Models\Payment;
use App\Notifications\PaymentConfirmedNotification;
use App\Notifications\PaymentExpiredNotification;
use App\Notifications\PaymentFailedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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

                $issuance = InvoiceIssuance::firstOrCreate(
                    ['order_id' => $payment->order_id],
                    [
                        'status' => InvoiceIssuance::STATUS_PENDING,
                        'available_at' => now(),
                    ]
                );

                if ($issuance->status !== InvoiceIssuance::STATUS_ISSUED) {
                    DB::afterCommit(function () use ($issuance) {
                        try {
                            IssueOrderInvoice::dispatch($issuance->id);
                        } catch (\Throwable $exception) {
                            Log::error('Failed to dispatch invoice issuance', [
                                'issuance_id' => $issuance->id,
                                'order_id' => $issuance->order_id,
                                'error' => $exception->getMessage(),
                            ]);
                        }
                    });
                }

                SendOrderConfirmation::dispatch($payment->order_id)->afterCommit();

                if ($payment->order->user) {
                    $payment->order->user->notify(
                        new PaymentConfirmedNotification($payment->order)
                    );
                }
            }

            if ($status === 'expired') {
                $this->restoreStock($payment);

                if ($payment->order->user) {
                    $payment->order->user->notify(
                        new PaymentExpiredNotification($payment->order)
                    );
                }
            }

            if ($status === 'failed' && $payment->order->user) {
                $payment->order->user->notify(
                    new PaymentFailedNotification($payment->order)
                );
            }

            return $payment;
        });
    }

    private function validateAmount(Payment $payment): void
    {
        if (round((float) $payment->amount, 2) !== round((float) $payment->order->total, 2)) {
            throw ValidationException::withMessages([
                'payment' => [__('api.payment_amount_mismatch')],
            ]);
        }
    }

    private function validateTransition(string $current, string $next): void
    {
        if (! in_array($next, $this->allowedTransitions[$current] ?? [], true)) {
            throw ValidationException::withMessages([
                'payment' => [__('api.payment_invalid_state_transition')],
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
