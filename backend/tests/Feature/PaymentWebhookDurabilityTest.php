<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Services\Payments\Gateways\StripeWebhookHandler;
use App\Services\Payments\PaymentStateService;
use App\Services\Payments\PaymentWebhookService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\TestCase;

class PaymentWebhookDurabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_failed_webhook_processing_can_be_retried_and_then_deduplicated(): void
    {
        $event = [
            'event_id' => 'evt_retry',
            'status' => 'paid',
            'payment' => new Payment,
            'gateway_reference' => 'pi_retry',
            'metadata' => [],
        ];

        $this->mock(StripeWebhookHandler::class, function ($mock) use ($event) {
            $mock->shouldReceive('handle')->times(3)->andReturn($event);
        });

        $calls = 0;

        $this->mock(PaymentStateService::class, function ($mock) use (&$calls) {
            $mock->shouldReceive('apply')
                ->twice()
                ->andReturnUsing(function () use (&$calls) {
                    $calls++;

                    if ($calls === 1) {
                        throw new RuntimeException('temporary state failure');
                    }

                    return new Payment;
                });
        });

        $service = app(PaymentWebhookService::class);
        $request = Request::create(
            '/api/v1/payments/stripe/webhook',
            'POST',
            [],
            [],
            [],
            [],
            'payload'
        );

        try {
            $service->handle($request, 'stripe');
            $this->fail('Expected the first webhook attempt to fail.');
        } catch (RuntimeException $exception) {
            $this->assertSame('temporary state failure', $exception->getMessage());
        }

        $this->assertDatabaseMissing('payment_webhook_events', [
            'gateway' => 'stripe',
            'event_id' => 'evt_retry',
        ]);

        $this->assertSame(['ok' => true], $service->handle($request, 'stripe'));

        $storedEvent = DB::table('payment_webhook_events')
            ->where('gateway', 'stripe')
            ->where('event_id', 'evt_retry')
            ->first();

        $this->assertNotNull($storedEvent);
        $this->assertNotNull($storedEvent->processed_at);
        $this->assertSame(hash('sha256', 'payload'), $storedEvent->payload_hash);

        $this->assertSame(
            ['ok' => true, 'duplicate' => true],
            $service->handle($request, 'stripe')
        );
        $this->assertSame(2, $calls);
    }
}
