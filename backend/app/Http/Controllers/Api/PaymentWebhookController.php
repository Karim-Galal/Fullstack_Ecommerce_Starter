<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\Payments\PaymentStateService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentWebhookController extends Controller
{
    public function handle(Request $r, string $gateway, PaymentStateService $service)
    {
        abort_unless(in_array($gateway, ['stripe','paymob'], true), 404);
        $raw = $r->getContent();
        $this->verify($gateway, $r, $raw);
        $d = $r->json()->all();
        $id = $gateway === 'stripe' ? ($d['id'] ?? null) : data_get($d, 'obj.id');
        abort_unless(is_scalar($id) && $id !== '', 422, 'Missing provider event identifier.');
        try {
            DB::transaction(function () use ($gateway, $raw, $id, $d, $service) {
                DB::table('payment_webhook_events')->insert(['gateway' => $gateway,'event_id' => (string)$id,'payload_hash' => hash('sha256', $raw),'created_at' => now(),'updated_at' => now()]);
                $reference = $gateway === 'stripe' ? data_get($d, 'data.object.metadata.transaction_reference') : data_get($d, 'obj.order.merchant_order_id');
                abort_unless(is_string($reference) && $reference !== '', 422, 'Missing transaction reference.');
                $status = $this->status($gateway, $d);
                $payment = Payment::where(['transaction_reference' => $reference,'gateway' => $gateway])->firstOrFail();
                if ($status === 'paid') {
                    $this->assertAmount($gateway, $d, $payment);
                }$service->apply($payment, $status, data_get($d, 'data.object.id') ?? data_get($d, 'obj.id'), $d);
                DB::table('payment_webhook_events')->where(['gateway' => $gateway,'event_id' => (string)$id])->update(['processed_at' => now()]);
            });
        } catch (QueryException $e) {
            if ($this->duplicate($e)) {
                return response()->json(['ok' => true,'duplicate' => true]);
            }throw $e;
        }return response()->json(['ok' => true]);
    }private function status(string $gateway, array $d): string
    {
        if ($gateway === 'stripe') {
            return match(data_get($d, 'type')) {
                'payment_intent.succeeded' => 'paid','payment_intent.payment_failed' => 'failed','charge.refunded' => 'refunded',default => throw new \Symfony\Component\HttpKernel\Exception\HttpException(422, 'Unsupported provider event.')
            };
        }return data_get($d, 'obj.success') ? 'paid' : 'failed';
    }private function assertAmount(string $gateway, array $d, Payment $payment): void
    {
        $minor = $gateway === 'stripe' ? data_get($d, 'data.object.amount_received') : data_get($d, 'obj.amount_cents');
        abort_unless(is_numeric($minor) && round(((float)$minor) / 100, 2) === round((float)$payment->amount, 2), 422, 'Payment amount mismatch.');
    }private function duplicate(QueryException $e): bool
    {
        return in_array((string)$e->getCode(), ['23000','23505'], true);
    }private function verify(string $gateway, Request $r, string $raw): void
    {
        $secret = config("services.$gateway.webhook_secret");
        abort_unless(is_string($secret) && $secret !== '', 503, 'Webhook is not configured.');
        if ($gateway === 'paymob') {
            abort_unless(hash_equals(hash_hmac('sha512', $raw, $secret), (string)$r->header('X-Paymob-Hmac')), 403, 'Invalid signature.');
            return;
        }$h = (string)$r->header('Stripe-Signature');
        preg_match('/t=(\d+).*v1=([^,]+)/', $h, $m);
        abort_unless(isset($m[1],$m[2]) && abs(time() - (int)$m[1]) <= 300 && hash_equals(hash_hmac('sha256',$m[1].'.'.$raw,$secret),$m[2]), 403, 'Invalid signature.');
    }
}
