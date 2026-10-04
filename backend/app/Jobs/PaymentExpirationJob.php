<?php

namespace App\Jobs;

use App\Models\Payment;
use App\Services\Payments\PaymentStateService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class PaymentExpirationJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public array $backoff = [60, 180, 600];

    public function __construct(public int $paymentId) {}

    public function handle(PaymentStateService $state): void
    {
        $payment = Payment::with('order.items.product')->find($this->paymentId);

        if (! $payment) {
            Log::warning('PaymentExpirationJob: Payment not found', ['payment_id' => $this->paymentId]);

            return;
        }

        if ($payment->status !== 'pending') {
            Log::info('PaymentExpirationJob: Payment not pending, skipping', [
                'payment_id' => $this->paymentId,
                'status' => $payment->status,
            ]);

            return;
        }

        try {
            $state->apply($payment, 'expired');

            Log::info('PaymentExpirationJob: Payment expired and stock restored', [
                'payment_id' => $this->paymentId,
            ]);
        } catch (\Throwable $e) {
            Log::error('PaymentExpirationJob: Failed to expire payment', [
                'payment_id' => $this->paymentId,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
