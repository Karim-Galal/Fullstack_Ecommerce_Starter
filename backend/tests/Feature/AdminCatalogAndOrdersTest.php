<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Collection;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductImageCleanup;
use App\Models\User;
use App\Services\Payments\PaymentRefundService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCatalogAndOrdersTest extends TestCase
{
    use RefreshDatabase;

    private function masterAdmin(): User
    {
        return User::factory()->create([
            'role' => 'master_admin',
            'status' => 'active',
        ]);
    }

    private function staff(array $permissions): User
    {
        return User::factory()->create([
            'role' => 'staff',
            'status' => 'active',
            'permissions' => $permissions,
        ]);
    }

    public function test_collection_create_assigns_products(): void
    {
        $admin = $this->masterAdmin();
        $products = Product::factory()->count(2)->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson(
            '/api/v1/admin/collections',
            [
                'slug' => 'summer-picks',
                'is_active' => true,
                'translations' => [
                    ['locale' => 'en', 'name' => 'Summer picks'],
                    ['locale' => 'ar', 'name' => 'مختارات الصيف'],
                ],
                'product_ids' => $products->pluck('id')->all(),
            ]
        );

        $response->assertCreated();

        $collection = Collection::where('slug', 'summer-picks')->firstOrFail();
        $this->assertCount(2, $collection->products);
    }

    public function test_collection_update_syncs_products(): void
    {
        $admin = $this->masterAdmin();
        $collection = Collection::factory()->create();
        $first = Product::factory()->create();
        $second = Product::factory()->create();
        $collection->products()->attach($first->id);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/collections/{$collection->id}", [
                'product_ids' => [$second->id],
            ])
            ->assertOk();

        $this->assertSame(
            [$second->id],
            $collection->fresh()->products->pluck('id')->all()
        );
    }

    public function test_collection_index_defaults_to_active_and_supports_trashed(): void
    {
        $admin = $this->masterAdmin();
        $active = Collection::factory()->create();
        $trashed = Collection::factory()->create();
        $trashed->delete();

        $activeIds = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/collections')
            ->assertOk()
            ->json('data.*.id');

        $trashedIds = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/collections?trashed=1')
            ->assertOk()
            ->json('data.*.id');

        $this->assertSame([$active->id], $activeIds);
        $this->assertSame([$trashed->id], $trashedIds);
    }

    public function test_collection_force_delete_requires_trashed_state(): void
    {
        $admin = $this->masterAdmin();
        $collection = Collection::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/collections/{$collection->id}/force")
            ->assertStatus(422);
    }

    public function test_collection_restore_returns_trashed_collection(): void
    {
        $admin = $this->masterAdmin();
        $collection = Collection::factory()->create();
        $collection->delete();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/collections/{$collection->id}/restore")
            ->assertOk();

        $this->assertNull($collection->fresh()->deleted_at);
    }

    public function test_category_can_be_created_without_an_explicit_slug(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/categories', [
                'translations' => [
                    ['locale' => 'en', 'name' => 'Summer Gear'],
                    ['locale' => 'ar', 'name' => 'معدات الصيف'],
                ],
                'is_active' => true,
                'sort_order' => 1,
            ])
            ->assertCreated();

        $this->assertSame('summer-gear', $response->json('data.slug'));
    }

    public function test_category_force_delete_is_blocked_when_products_exist(): void
    {
        $admin = $this->masterAdmin();
        $category = Category::factory()->create();
        Product::factory()->create(['category_id' => $category->id]);
        $category->delete();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/categories/{$category->id}/force")
            ->assertStatus(422);

        $this->assertSoftDeleted($category);
    }

    public function test_category_force_delete_is_blocked_when_children_exist(): void
    {
        $admin = $this->masterAdmin();
        $parent = Category::factory()->create();
        Category::factory()->create(['parent_id' => $parent->id]);
        $parent->delete();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/categories/{$parent->id}/force")
            ->assertStatus(422);
    }

    public function test_product_force_delete_schedules_image_cleanup(): void
    {
        $admin = $this->masterAdmin();
        $product = Product::factory()->create();
        $image = $product->images()->create([
            'path' => 'products/one.webp',
            'disk' => 'public',
            'processing_status' => 'ready',
            'variants' => ['thumbnail' => 'products/one/thumb.webp'],
            'sort_order' => 0,
            'is_primary' => true,
        ]);
        $product->delete();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/products/{$product->id}/force")
            ->assertNoContent();

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
        $this->assertDatabaseMissing('product_images', ['id' => $image->id]);

        $cleanup = ProductImageCleanup::firstOrFail();
        $this->assertContains('products/one.webp', $cleanup->paths);
        $this->assertContains('products/one/thumb.webp', $cleanup->paths);
    }

    public function test_staff_without_orders_permission_cannot_list_orders(): void
    {
        $staff = $this->staff(['products.view']);

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/admin/orders')
            ->assertForbidden();
    }

    public function test_admin_order_index_filters_by_status_and_search(): void
    {
        $admin = $this->masterAdmin();
        $customer = User::factory()->create(['name' => 'Searchable Customer']);

        $matching = Order::factory()->create([
            'user_id' => $customer->id,
            'status' => 'confirmed',
            'number' => 'ORD-AAA-111',
        ]);
        Order::factory()->create([
            'status' => 'pending',
            'number' => 'ORD-BBB-222',
        ]);

        $ids = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/orders?status=confirmed&search=Searchable')
            ->assertOk()
            ->json('data.*.id');

        $this->assertSame([$matching->id], $ids);
    }

    public function test_valid_order_status_transition_succeeds(): void
    {
        $admin = $this->masterAdmin();
        $order = Order::factory()->create(['status' => 'pending']);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/orders/{$order->id}/status", [
                'status' => 'confirmed',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed');
    }

    public function test_invalid_order_status_transition_is_rejected(): void
    {
        $admin = $this->masterAdmin();
        $order = Order::factory()->create(['status' => 'delivered']);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/orders/{$order->id}/status", [
                'status' => 'shipped',
            ])
            ->assertStatus(422);
    }

    public function test_cancelling_order_restores_stock_only_once(): void
    {
        $admin = $this->masterAdmin();
        $product = Product::factory()->create(['stock' => 5]);
        $order = Order::factory()->create(['status' => 'pending']);

        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 3,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/orders/{$order->id}/status", [
                'status' => 'cancelled',
            ])
            ->assertOk();

        $this->assertSame(8, $product->fresh()->stock);
        $this->assertNotNull($order->fresh()->stock_restored_at);
    }

    public function test_payment_index_requires_permission(): void
    {
        $staff = $this->staff(['orders.view']);

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/admin/payments')
            ->assertForbidden();
    }

    public function test_payment_index_filters_by_status(): void
    {
        $admin = $this->masterAdmin();
        $paid = Payment::factory()->create(['status' => 'paid']);
        Payment::factory()->create(['status' => 'failed']);

        $ids = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/payments?status=paid')
            ->assertOk()
            ->json('data.*.id');

        $this->assertSame([$paid->id], $ids);
    }

    public function test_refund_requires_payments_refund_permission(): void
    {
        $staff = $this->staff(['payments.view']);
        $payment = Payment::factory()->create(['status' => 'paid']);

        $this->actingAs($staff, 'sanctum')
            ->postJson("/api/v1/admin/payments/{$payment->id}/refund", [])
            ->assertForbidden();
    }

    public function test_refund_amount_cannot_exceed_payment(): void
    {
        $admin = $this->masterAdmin();
        $payment = Payment::factory()->create([
            'status' => 'paid',
            'amount' => 100,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/payments/{$payment->id}/refund", [
                'amount' => 150,
            ])
            ->assertStatus(422);
    }

    public function test_full_successful_refund_marks_payment_refunded(): void
    {
        $admin = $this->masterAdmin();
        $payment = Payment::factory()->create([
            'status' => 'paid',
            'amount' => 100,
            'gateway_reference' => 'pi_test',
        ]);

        $this->mock(PaymentRefundService::class, function ($mock) {
            $mock->shouldReceive('refund')
                ->once()
                ->andReturn(['id' => 're_1', 'status' => 'succeeded']);
        });

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/payments/{$payment->id}/refund", [])
            ->assertOk();

        $this->assertSame('refunded', $payment->fresh()->status);
    }

    public function test_invoice_index_excludes_trashed_by_default(): void
    {
        $admin = $this->masterAdmin();
        $active = Invoice::factory()->create();
        $trashed = Invoice::factory()->create();
        $trashed->delete();

        $activeIds = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/invoices')
            ->assertOk()
            ->json('data.*.id');

        $trashedIds = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/invoices?trashed=1')
            ->assertOk()
            ->json('data.*.id');

        $this->assertSame([$active->id], $activeIds);
        $this->assertSame([$trashed->id], $trashedIds);
    }

    public function test_invoice_can_be_restored_but_never_force_deleted(): void
    {
        $admin = $this->masterAdmin();
        $invoice = Invoice::factory()->create();
        $invoice->delete();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/invoices/{$invoice->id}/restore")
            ->assertOk();

        $this->assertNull($invoice->fresh()->deleted_at);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/invoices/{$invoice->id}/force")
            ->assertNotFound();
    }
}
