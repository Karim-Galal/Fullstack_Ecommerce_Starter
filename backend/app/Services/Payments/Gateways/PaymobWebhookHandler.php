<?php

namespace App\Services\Payments\Gateways;

use App\Models\Payment;
use Illuminate\Http\Request;

class PaymobWebhookHandler
{
    public function handle(Request $request): array
    {
        $data = $request->json()->all();

        $this->verifyHmac($data, (string) $request->query('hmac'));

        $object = $data['obj'] ?? [];
        $transactionId = $object['id'] ?? null;
        $paymobOrderId = data_get($object, 'order.id');

        if (! $transactionId || ! $paymobOrderId) {
            abort(422, 'Invalid Paymob webhook.');
        }

        $payment = Payment::where('gateway', 'paymob')
            ->where('gateway_metadata->paymob_order_id', (string) $paymobOrderId)
            ->firstOrFail();

        $this->assertAmount($object['amount_cents'] ?? null, $payment);

        $status = ($object['is_refunded'] ?? false)
            ? 'refunded'
            : (($object['success'] ?? false) ? 'paid' : 'failed');

        return [
            'event_id' => (string) $transactionId,
            'status' => $status,
            'payment' => $payment,
            'gateway_reference' => $payment->gateway_reference,
            'metadata' => [
                'paymob_transaction_id' => $transactionId,
                'paymob_order_id' => $paymobOrderId,
            ],
        ];
    }

    private function assertAmount(mixed $amount, Payment $payment): void
    {
        if ((int) $amount !== (int) round((float) $payment->amount * 100)) {
            abort(422, 'Payment amount mismatch.');
        }
    }

    private function verifyHmac(array $data, string $provided): void
    {
        $secret = config('services.paymob.hmac_secret');

        if (! $secret || ! $provided) {
            abort(503, 'Paymob webhook is not configured.');
        }

        $object = $data['obj'] ?? [];

        $keys = [
            'amount_cents',
            'created_at',
            'currency',
            'error_occured',
            'has_parent_transaction',
            'id',
            'integration_id',
            'is_3d_secure',
            'is_auth',
            'is_capture',
            'is_refunded',
            'is_standalone_payment',
            'is_voided',
            'order.id',
            'owner',
            'pending',
            'source_data.pan',
            'source_data.sub_type',
            'source_data.type',
            'success',
        ];

        $values = [];

        foreach ($keys as $key) {
            $values[] = (string) data_get($object, $key, '');
        }

        $calculated = hash_hmac('sha512', implode('', $values), $secret);

        if (! hash_equals($calculated, $provided)) {
            abort(403, 'Invalid Paymob webhook signature.');
        }
    }
}
