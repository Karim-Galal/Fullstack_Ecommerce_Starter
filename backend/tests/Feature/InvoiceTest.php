<?php

namespace Tests\Feature;

use App\Jobs\IssueOrderInvoice;
use App\Models\Invoice;
use App\Models\InvoiceIssuance;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Services\InvoiceService;
use App\Services\Payments\PaymentStateService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Tests\TestCase;

class InvoiceTest extends TestCase
{
    use RefreshDatabase;

    private function customer(array $attributes = []): User
    {
        return User::factory()->create([
            'role' => 'customer',
            'status' => 'active',
            ...$attributes,
        ]);
    }

    private function invoiceFor(Order $order): Invoice
    {
        return Invoice::factory()->create([
            'order_id' => $order->id,
            'number' => 'INV-TEST-'.$order->id,
            'currency' => $order->currency,
            'subtotal' => $order->subtotal,
            'discount_total' => $order->discount_total,
            'shipping_total' => $order->shipping_total,
            'total' => $order->total,
            'issued_at' => now(),
        ]);
    }

    public function test_successful_payment_persists_payment_and_pending_invoice_issuance(): void
    {
        $user = $this->customer();

        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'currency' => 'EGP',
            'subtotal' => 100,
            'discount_total' => 5,
            'shipping_total' => 10,
            'total' => 105,
        ]);

        $payment = Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => $order->total,
            'status' => 'pending',
        ]);

        Queue::fake();

        $payment = app(PaymentStateService::class)->apply($payment, 'paid', 'gateway-ref', []);

        $issuance = InvoiceIssuance::query()->where('order_id', $order->id)->firstOrFail();

        $this->assertSame('paid', $payment->status);
        $this->assertSame('confirmed', $order->fresh()->status);
        $this->assertSame(InvoiceIssuance::STATUS_PENDING, $issuance->status);
        $this->assertSame(0, $issuance->attempts);
        $this->assertNotNull($issuance->available_at);
        $this->assertNull($issuance->issued_at);
        $this->assertDatabaseCount('invoices', 0);
        Queue::assertPushed(
            IssueOrderInvoice::class,
            fn (IssueOrderInvoice $job) => $job->issuanceId === $issuance->id
        );
    }

    public function test_invoice_issuance_job_creates_invoice_with_order_totals(): void
    {
        $user = $this->customer();

        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'currency' => 'EGP',
            'subtotal' => 100,
            'discount_total' => 5,
            'shipping_total' => 10,
            'total' => 105,
        ]);

        $payment = Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => $order->total,
            'status' => 'pending',
        ]);

        Queue::fake();

        app(PaymentStateService::class)->apply($payment, 'paid', 'gateway-ref', []);

        $issuance = InvoiceIssuance::query()->where('order_id', $order->id)->firstOrFail();

        (new IssueOrderInvoice($issuance->id))->handle(app(InvoiceService::class));

        $invoice = Invoice::query()->where('order_id', $order->id)->firstOrFail();
        $issuance->refresh();

        $this->assertSame('INV-'.substr($order->number, 4), $invoice->number);
        $this->assertSame('issued', $invoice->status);
        $this->assertSame('EGP', $invoice->currency);
        $this->assertEquals($order->fresh()->subtotal, $invoice->subtotal);
        $this->assertEquals($order->fresh()->discount_total, $invoice->discount_total);
        $this->assertEquals($order->fresh()->shipping_total, $invoice->shipping_total);
        $this->assertEquals($order->fresh()->total, $invoice->total);
        $this->assertNotNull($invoice->issued_at);
        $this->assertSame('confirmed', $order->fresh()->status);
        $this->assertSame(InvoiceIssuance::STATUS_ISSUED, $issuance->status);
        $this->assertNotNull($issuance->issued_at);
        $this->assertNull($issuance->last_error);
    }

    public function test_repeated_paid_transition_and_job_execution_do_not_duplicate_the_invoice(): void
    {
        $order = Order::factory()->create(['status' => 'pending']);

        $payment = Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => $order->total,
            'status' => 'pending',
        ]);

        Queue::fake();

        $service = app(PaymentStateService::class);

        $service->apply($payment, 'paid', 'gateway-ref', []);
        $service->apply($payment->fresh(), 'paid', 'gateway-ref', []);

        $issuance = InvoiceIssuance::query()->where('order_id', $order->id)->firstOrFail();

        (new IssueOrderInvoice($issuance->id))->handle(app(InvoiceService::class));
        (new IssueOrderInvoice($issuance->id))->handle(app(InvoiceService::class));

        $this->assertDatabaseCount('invoices', 1);
        $this->assertDatabaseCount('invoice_issuances', 1);
        $this->assertSame(InvoiceIssuance::STATUS_ISSUED, $issuance->fresh()->status);
    }

    public function test_invoice_failure_does_not_roll_back_payment_or_order(): void
    {
        $order = Order::factory()->create(['status' => 'pending']);

        $payment = Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => $order->total,
            'status' => 'pending',
        ]);

        Queue::fake();

        app(PaymentStateService::class)->apply($payment, 'paid', 'gateway-ref', []);

        $issuance = InvoiceIssuance::query()->where('order_id', $order->id)->firstOrFail();

        $this->mock(InvoiceService::class, function ($mock) {
            $mock->shouldReceive('issueForOrder')
                ->once()
                ->andThrow(new RuntimeException('invoice service unavailable'));
        });

        $failure = null;

        try {
            (new IssueOrderInvoice($issuance->id))->handle(app(InvoiceService::class));
        } catch (RuntimeException $exception) {
            $failure = $exception;
        }

        $this->assertInstanceOf(RuntimeException::class, $failure);
        $this->assertSame('invoice service unavailable', $failure->getMessage());

        $issuance->refresh();

        $this->assertSame('paid', $payment->fresh()->status);
        $this->assertSame('confirmed', $order->fresh()->status);
        $this->assertDatabaseCount('invoices', 0);
        $this->assertSame(InvoiceIssuance::STATUS_PENDING, $issuance->status);
        $this->assertSame(1, $issuance->attempts);
        $this->assertStringContainsString('invoice service unavailable', $issuance->last_error);
        $this->assertTrue($issuance->available_at->isFuture());
    }

    public function test_failed_payment_does_not_issue_an_invoice(): void
    {
        $order = Order::factory()->create(['status' => 'pending']);

        $payment = Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => $order->total,
            'status' => 'pending',
        ]);

        app(PaymentStateService::class)->apply($payment, 'failed', 'gateway-ref', []);

        $this->assertDatabaseCount('invoices', 0);
        $this->assertDatabaseCount('invoice_issuances', 0);
    }

    public function test_pending_invoice_dispatch_command_queues_only_due_work(): void
    {
        Queue::fake();

        $due = InvoiceIssuance::create([
            'order_id' => Order::factory()->create(['status' => 'confirmed'])->id,
            'status' => InvoiceIssuance::STATUS_PENDING,
            'available_at' => now()->subMinute(),
        ]);

        $future = InvoiceIssuance::create([
            'order_id' => Order::factory()->create(['status' => 'confirmed'])->id,
            'status' => InvoiceIssuance::STATUS_PENDING,
            'available_at' => now()->addMinute(),
        ]);

        $failed = InvoiceIssuance::create([
            'order_id' => Order::factory()->create(['status' => 'confirmed'])->id,
            'status' => InvoiceIssuance::STATUS_FAILED,
            'attempts' => InvoiceIssuance::MAX_ATTEMPTS,
            'available_at' => now()->subMinute(),
        ]);

        $this->artisan('invoices:dispatch-pending')->assertSuccessful();

        Queue::assertPushed(IssueOrderInvoice::class, 1);
        Queue::assertPushed(
            IssueOrderInvoice::class,
            fn (IssueOrderInvoice $job) => $job->issuanceId === $due->id
        );
        Queue::assertNotPushed(
            IssueOrderInvoice::class,
            fn (IssueOrderInvoice $job) => $job->issuanceId === $future->id
        );
        Queue::assertNotPushed(
            IssueOrderInvoice::class,
            fn (IssueOrderInvoice $job) => $job->issuanceId === $failed->id
        );
    }

    public function test_invoice_cannot_be_issued_for_unconfirmed_order(): void
    {
        $order = Order::factory()->create(['status' => 'pending']);

        try {
            app(InvoiceService::class)->issueForOrder($order);
            $this->fail('Expected a validation exception for an unconfirmed order.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('order', $e->errors());
        }

        $this->assertDatabaseCount('invoices', 0);
    }

    public function test_customer_can_list_only_their_own_invoices(): void
    {
        $user = $this->customer();
        $other = $this->customer();

        $ownInvoice = $this->invoiceFor(
            Order::factory()->create(['user_id' => $user->id])
        );
        $this->invoiceFor(
            Order::factory()->create(['user_id' => $other->id])
        );

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/invoices');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'number',
                        'status',
                        'currency',
                        'subtotal',
                        'discount_total',
                        'shipping_total',
                        'total',
                        'issued_at',
                        'order' => [
                            'id',
                            'number',
                            'items',
                            'shipping_address',
                        ],
                        'created_at',
                        'updated_at',
                    ],
                ],
                'links',
                'meta',
            ]);

        $this->assertCount(1, $response->json('data'));
        $this->assertSame($ownInvoice->id, $response->json('data.0.id'));
    }

    public function test_customer_can_view_their_own_invoice(): void
    {
        $user = $this->customer();
        $invoice = $this->invoiceFor(
            Order::factory()->create(['user_id' => $user->id])
        );

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/invoices/{$invoice->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $invoice->id)
            ->assertJsonPath('data.number', $invoice->number);
    }

    public function test_customer_cannot_view_another_customers_invoice(): void
    {
        $user = $this->customer();
        $other = $this->customer();
        $invoice = $this->invoiceFor(
            Order::factory()->create(['user_id' => $other->id])
        );

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/invoices/{$invoice->id}")
            ->assertStatus(403);
    }

    public function test_invoice_remains_accessible_after_order_is_soft_deleted(): void
    {
        $user = $this->customer();
        $order = Order::factory()->create(['user_id' => $user->id]);
        $invoice = $this->invoiceFor($order);

        $order->delete();

        $this->assertSoftDeleted('orders', ['id' => $order->id]);

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/invoices/{$invoice->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.id', $invoice->id);
    }

    public function test_unauthenticated_user_cannot_access_invoices(): void
    {
        $this->getJson('/api/v1/invoices')->assertStatus(401);
        $this->getJson('/api/v1/admin/invoices')->assertStatus(401);
    }

    public function test_master_admin_can_list_and_view_invoices(): void
    {
        $admin = User::factory()->create([
            'role' => 'master_admin',
            'status' => 'active',
        ]);

        $order = Order::factory()->create();
        $invoice = $this->invoiceFor($order);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/invoices')
            ->assertStatus(200)
            ->assertJsonPath('data.0.id', $invoice->id);

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/admin/invoices/{$invoice->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.order.user.id', $order->user_id);
    }

    public function test_staff_with_invoices_view_permission_can_list_invoices(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
            'status' => 'active',
            'permissions' => ['invoices.view'],
        ]);

        $this->invoiceFor(Order::factory()->create());

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/admin/invoices')
            ->assertStatus(200);
    }

    public function test_staff_without_permission_and_customers_cannot_list_all_invoices(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
            'status' => 'active',
            'permissions' => ['products.view'],
        ]);
        $customer = $this->customer();

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/admin/invoices')
            ->assertStatus(403);

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/admin/invoices')
            ->assertStatus(403);
    }

    public function test_admin_can_search_invoices_by_customer_and_order_number(): void
    {
        $admin = User::factory()->create([
            'role' => 'master_admin',
            'status' => 'active',
        ]);

        $customer = $this->customer(['name' => 'Invoice Search Customer']);
        $order = Order::factory()->create([
            'user_id' => $customer->id,
            'number' => 'ORD-SEARCH-001',
        ]);
        $invoice = $this->invoiceFor($order);

        $this->invoiceFor(Order::factory()->create());

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/invoices?search=Invoice+Search+Customer')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $invoice->id);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/invoices?search=ORD-SEARCH-001')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $invoice->id);
    }

    public function test_order_with_invoice_cannot_be_force_deleted(): void
    {
        $order = Order::factory()->create();
        $invoice = $this->invoiceFor($order);

        try {
            $order->forceDelete();
            $this->fail('Expected the invoice foreign key to prevent hard deletion.');
        } catch (QueryException $e) {
            $this->assertStringContainsString('FOREIGN KEY', $e->getMessage());
        }

        $this->assertDatabaseHas('invoices', ['id' => $invoice->id]);
        $this->assertDatabaseHas('orders', ['id' => $order->id]);
    }
}
