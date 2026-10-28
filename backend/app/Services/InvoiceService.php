<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InvoiceService
{
    public function issueForOrder(Order $order): Invoice
    {
        return DB::transaction(function () use ($order) {
            $order = Order::withTrashed()
                ->lockForUpdate()
                ->findOrFail($order->getKey());

            $invoice = Invoice::withTrashed()
                ->where('order_id', $order->id)
                ->first();

            if ($invoice) {
                if ($invoice->trashed()) {
                    $invoice->restore();
                }

                return $invoice;
            }

            if ($order->status !== 'confirmed') {
                throw ValidationException::withMessages([
                    'order' => [__('api.invoice_order_not_confirmed')],
                ]);
            }

            return Invoice::create([
                'order_id' => $order->id,
                'number' => $this->numberFor($order),
                'status' => 'issued',
                'currency' => $order->currency,
                'subtotal' => $order->subtotal,
                'discount_total' => $order->discount_total,
                'shipping_total' => $order->shipping_total,
                'total' => $order->total,
                'issued_at' => now(),
            ]);
        });
    }

    private function numberFor(Order $order): string
    {
        $suffix = str_starts_with($order->number, 'ORD-')
            ? substr($order->number, 4)
            : $order->number;

        return 'INV-'.$suffix;
    }
}
