<?php

namespace App\Services\Payments;

use App\Jobs\IssueOrderInvoice;
use App\Jobs\SendOrderConfirmation;
use App\Models\InvoiceIssuance;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
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

    public function apply(Payment $payment, string $status, ?string $gatewayReference = null, array $metadata = []): Payment
    {
        return DB::transaction(function () use ($payment, $status, $gatewayReference, $metadata) {
            // Lock the order before the payment row. Order cancellation uses the
            // same order -> payments lock order, which avoids deadlocks between
            // admin cancellations, gateway callbacks, and expiry workers.
            $order = Order::withTrashed()
                ->lockForUpdate()
                ->findOrFail($payment->order_id);

            $payment = Payment::lockForUpdate()->findOrFail($payment->id);
            $payment->setRelation('order', $order);

            // Refunds are validated against the payment amount by the refund
            // endpoint, not against the order total, so the gateway amount
            // consistency check only applies to payment confirmations.
            if ($status !== 'refunded') {
                $this->validateAmount($payment);
            }

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
                $this->handlePaid($payment, $order);
            }

            if ($status === 'expired') {
                $this->handleExpired($payment, $order);
            }

            if ($status === 'failed' && $payment->order->user) {
                $payment->order->user->notify(
                    new PaymentFailedNotification($payment->order)
                );
            }

            return $payment;
        });
    }

    /**
     * A successful gateway callback for a cancelled order is kept as a paid
     * payment for manual financial reconciliation, but it must not resurrect
     * the order or emit invoice/confirmation side effects.
     */
    private function handlePaid(Payment $payment, Order $order): void
    {
        if ($order->status === 'cancelled') {
            Log::warning('Payment succeeded for a cancelled order; manual reconciliation required', [
                'payment_id' => $payment->id,
                'order_id' => $order->id,
            ]);

            return;
        }

        $order->update(['status' => 'confirmed']);

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

        if ($order->user) {
            $order->user->notify(
                new PaymentConfirmedNotification($order)
            );
        }
    }

    /**
     * Expiring one payment attempt must not restock the order while another
     * attempt can still succeed. A failed attempt remains eligible for a late
     * gateway success (`failed -> paid`), so it counts as a remaining attempt.
     * Stock is restored only when no such attempt remains for the order.
     */
    private function handleExpired(Payment $payment, Order $order): void
    {
        if ($order->status !== 'cancelled') {
            $otherAttemptsRemain = $order->payments()
                ->whereKeyNot($payment->id)
                ->whereIn('status', ['unpaid', 'pending', 'failed'])
                ->lockForUpdate()
                ->exists();

            if (! $otherAttemptsRemain) {
                $this->restoreStock($order);
            }
        }

        if ($order->user) {
            $order->user->notify(
                new PaymentExpiredNotification($order)
            );
        }
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

    private function restoreStock(Order $order): void
    {
        // The order row is already locked by apply(), so this guard is safe
        // against concurrent cancellations and expiration workers.
        if ($order->stock_restored_at !== null) {
            return;
        }

        foreach ($order->items()->get() as $item) {
            if ($item->product_id === null) {
                continue;
            }

            Product::withTrashed()
                ->whereKey($item->product_id)
                ->increment('stock', $item->quantity);
        }

        $order->forceFill(['stock_restored_at' => now()])->save();
    }
}
