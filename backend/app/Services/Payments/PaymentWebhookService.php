<?php

namespace App\Services\Payments;

use App\Services\Payments\Gateways\PaymobWebhookHandler;
use App\Services\Payments\Gateways\StripeWebhookHandler;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentWebhookService
{
    public function __construct(
        private StripeWebhookHandler $stripe,
        private PaymobWebhookHandler $paymob,
        private PaymentStateService $state
    ) {}

    public function handle(Request $request, string $gateway): array
    {
        $event = match ($gateway) {
            'stripe' => $this->stripe->handle($request),
            'paymob' => $this->paymob->handle($request),
            default => abort(404, __('api.unsupported_payment_gateway')),
        };

        if (! $event['payment']) {
            return [
                'ok' => true,
                'ignored' => true,
            ];
        }

        return DB::transaction(function () use ($event, $gateway, $request) {
            $attributes = [
                'gateway' => $gateway,
                'event_id' => $event['event_id'],
                'payload_hash' => hash('sha256', $request->getContent()),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $inserted = DB::table('payment_webhook_events')->insertOrIgnore($attributes);

            $existing = DB::table('payment_webhook_events')
                ->where('gateway', $gateway)
                ->where('event_id', $event['event_id'])
                ->lockForUpdate()
                ->first();

            if (! $existing) {
                throw new \RuntimeException(
                    'Failed to persist payment webhook event.'
                );
            }

            if (! $inserted && $existing->processed_at !== null) {
                return [
                    'ok' => true,
                    'duplicate' => true,
                ];
            }

            $this->state->apply(
                $event['payment'],
                $event['status'],
                $event['gateway_reference'],
                $event['metadata']
            );

            DB::table('payment_webhook_events')
                ->where('gateway', $gateway)
                ->where('event_id', $event['event_id'])
                ->update([
                    'processed_at' => now(),
                    'updated_at' => now(),
                ]);

            return ['ok' => true];
        });
    }
}
