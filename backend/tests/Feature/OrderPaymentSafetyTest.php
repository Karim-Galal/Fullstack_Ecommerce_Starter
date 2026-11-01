<?php

namespace Tests\Feature;

use App\Jobs\IssueOrderInvoice;
use App\Jobs\SendOrderConfirmation;
use App\Models\Invoice;
use App\Models\InvoiceIssuance;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use App\Notifications\PaymentConfirmedNotification;
use App\Services\Payments\PaymentStateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class OrderPaymentSafetyTest extends TestCase
{
    use RefreshDatabase;

    private function masterAdmin(): User
    {
        return User::factory()->create([
            'role' => 'master_admin',
            'status' => 'active',
        ]);
    }

    private function customer(): User
    {
        return User::factory()->create([
            'role' => 'customer',
            'status' => 'active',
        ]);
    }

    private function orderWithItem(User $customer, int $stock = 10, int $quantity = 2): array
    {
        $product = Product::factory()->create(['stock' => $stock]);

        $order = Order::factory()->create([
            'user_id' => $customer->id,
            'status' => 'pending',
        ]);

        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => $quantity,
        ]);

        return [$order, $product];
    }

    public function test_order_with_a_paid_payment_cannot_be_cancelled(): void
    {
        $admin = $this->masterAdmin();
        [$order, $product] = $this->orderWithItem($this->customer());

        Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => $order->total,
            'status' => 'paid',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/orders/{$order->id}/status", [
                'status' => 'cancelled',
            ])
            ->assertStatus(422);

        $order->refresh();

        $this->assertSame('pending', $order->status);
        $this->assertNull($order->stock_restored_at);
        $this->assertSame(10, (int) $product->fresh()->stock);
    }

    public function test_late_payment_for_cancelled_order_is_recorded_without_confirming_it(): void
    {
        Queue::fake();
        Notification::fake();

        $customer = $this->customer();
        [$order] = $this->orderWithItem($customer);

        $order->update(['status' => 'cancelled']);

        $payment = Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => $order->total,
            'status' => 'failed',
        ]);

        app(PaymentStateService::class)->apply(
            $payment,
            'paid',
            'gateway-late-reference',
            []
        );

        $payment->refresh();
        $order->refresh();

        $this->assertSame('paid', $payment->status);
        $this->assertSame('cancelled', $order->status);
        $this->assertSame('gateway-late-reference', $payment->gateway_reference);

        $this->assertFalse(Invoice::where('order_id', $order->id)->exists());
        $this->assertFalse(InvoiceIssuance::where('order_id', $order->id)->exists());

        Queue::assertNotPushed(SendOrderConfirmation::class);
        Queue::assertNotPushed(IssueOrderInvoice::class);
        Notification::assertNotSentTo($customer, PaymentConfirmedNotification::class);
    }

    public function test_expiring_one_attempt_does_not_restore_stock_while_another_is_pending(): void
    {
        $customer = $this->customer();
        [$order, $product] = $this->orderWithItem($customer);

        $first = Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => $order->total,
            'status' => 'pending',
        ]);

        $second = Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => $order->total,
            'status' => 'pending',
        ]);

        $service = app(PaymentStateService::class);

        $service->apply($first, 'expired', 'gateway-first', []);

        $this->assertSame(10, (int) $product->fresh()->stock);
        $this->assertNull($order->fresh()->stock_restored_at);
        $this->assertSame('pending', $second->fresh()->status);

        $service->apply($second, 'expired', 'gateway-second', []);

        $this->assertSame(12, (int) $product->fresh()->stock);
        $this->assertNotNull($order->fresh()->stock_restored_at);

        // Repeating the same terminal transition must not restock again.
        $service->apply($second->fresh(), 'expired', 'gateway-second', []);

        $this->assertSame(12, (int) $product->fresh()->stock);
    }

    public function test_expiring_last_pending_attempt_leaves_stock_when_a_failed_attempt_can_still_succeed(): void
    {
        Queue::fake();
        Notification::fake();

        $customer = $this->customer();
        [$order, $product] = $this->orderWithItem($customer);

        $failed = Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => $order->total,
            'status' => 'failed',
        ]);

        $pending = Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => $order->total,
            'status' => 'pending',
        ]);

        $service = app(PaymentStateService::class);

        $service->apply($pending, 'expired', 'gateway-pending', []);

        $this->assertSame(10, (int) $product->fresh()->stock);
        $this->assertNull($order->fresh()->stock_restored_at);

        // A late success on the failed attempt still confirms the order.
        $service->apply($failed, 'paid', 'gateway-late', []);

        $this->assertSame('paid', $failed->fresh()->status);
        $this->assertSame('confirmed', $order->fresh()->status);
        $this->assertSame(10, (int) $product->fresh()->stock);
    }

    public function test_customer_order_responses_do_not_expose_payments_invoice_or_stock_flag(): void
    {
        $customer = $this->customer();
        [$order] = $this->orderWithItem($customer);

        $order->update(['status' => 'confirmed']);

        Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => $order->total,
            'status' => 'paid',
        ]);

        Invoice::factory()->create(['order_id' => $order->id]);

        $indexPayload = $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/orders')
            ->assertOk()
            ->json('data.0');

        $this->assertArrayNotHasKey('payments', $indexPayload);
        $this->assertArrayNotHasKey('invoice', $indexPayload);
        $this->assertArrayNotHasKey('stock_restored_at', $indexPayload);

        $showPayload = $this->actingAs($customer, 'sanctum')
            ->getJson("/api/v1/orders/{$order->id}")
            ->assertOk()
            ->json('data');

        $this->assertArrayNotHasKey('payments', $showPayload);
        $this->assertArrayNotHasKey('invoice', $showPayload);
        $this->assertArrayNotHasKey('stock_restored_at', $showPayload);
    }

    public function test_admin_order_response_still_includes_payments_and_invoice(): void
    {
        $admin = $this->masterAdmin();
        [$order] = $this->orderWithItem($this->customer());

        $payment = Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => $order->total,
            'status' => 'paid',
        ]);

        $invoice = Invoice::factory()->create(['order_id' => $order->id]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/admin/orders/{$order->id}")
            ->assertOk();

        $response->assertJsonCount(1, 'data.payments');
        $response->assertJsonPath('data.payments.0.id', $payment->id);
        $response->assertJsonPath('data.invoice.number', $invoice->number);
        $response->assertJsonStructure([
            'data' => [
                'items',
                'user',
                'shipping_method',
                'payments',
                'invoice',
            ],
        ]);
        $this->assertArrayNotHasKey('stock_restored_at', $response->json('data'));
    }
}
