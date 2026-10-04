<?php

namespace App\Services\Payments;

use App\Services\Payments\Gateways\PaymobWebhookHandler;
use App\Services\Payments\Gateways\StripeWebhookHandler;
use Illuminate\Database\QueryException;
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
            default => abort(404, 'Unsupported payment gateway.'),
        };

        if (! $event['payment']) {
            return [
                'ok' => true,
                'ignored' => true,
            ];
        }

        try {
            DB::table('payment_webhook_events')->insert([
                'gateway' => $gateway,
                'event_id' => $event['event_id'],
                'payload_hash' => hash('sha256', $request->getContent()),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (QueryException $e) {
            if (in_array((string) $e->getCode(), ['23000', '23505'], true)) {
                return [
                    'ok' => true,
                    'duplicate' => true,
                ];
            }

            throw $e;
        }

        DB::transaction(function () use ($event, $gateway) {
            $this->state->apply(
                $event['payment'],
                $event['status'],
                $event['gateway_reference'],
                $event['metadata']
            );

            DB::table('payment_webhook_events')
                ->where('gateway', $gateway)
                ->where('event_id', $event['event_id'])
                ->update(['processed_at' => now()]);
        });

        return ['ok' => true];
    }
}
