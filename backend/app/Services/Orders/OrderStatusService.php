<?php

namespace App\Services\Orders;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderStatusService
{
    /**
     * Forward, non-financial transitions are safe. Cancellation is limited to
     * unpaid/pending orders so that a paid order must go through the payment
     * refund workflow instead of silently discarding its financial record.
     */
    private const TRANSITIONS = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['shipped'],
        'shipped' => ['delivered'],
        'delivered' => [],
        'cancelled' => [],
    ];

    public function update(Order $order, string $status): Order
    {
        return DB::transaction(function () use ($order, $status) {
            // The order row is locked before any payment rows so that this
            // transaction and PaymentStateService share the same lock order.
            $order = Order::query()
                ->lockForUpdate()
                ->findOrFail($order->id);

            if ($order->status === $status) {
                return $order;
            }

            if (! in_array($status, self::TRANSITIONS[$order->status] ?? [], true)) {
                throw ValidationException::withMessages([
                    'status' => [__('api.order_invalid_status_transition')],
                ]);
            }

            if ($status === 'cancelled') {
                $this->cancel($order);
            }

            $order->update(['status' => $status]);

            return $order->fresh();
        });
    }

    private function cancel(Order $order): void
    {
        $payments = $order->payments()
            ->lockForUpdate()
            ->get();

        // A paid order must be refunded through the payment workflow. This also
        // prevents a paid callback from being overwritten by a cancellation
        // that raced with it.
        if ($payments->contains('status', 'paid')) {
            throw ValidationException::withMessages([
                'status' => [__('api.order_cannot_cancel_paid')],
            ]);
        }

        $this->restoreStock($order);

        $order->payments()
            ->whereIn('status', ['unpaid', 'pending'])
            ->update(['status' => 'failed']);
    }

    private function restoreStock(Order $order): void
    {
        // The order row is locked by the caller, so this check is safe against
        // concurrent cancellation/expiration workers.
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
