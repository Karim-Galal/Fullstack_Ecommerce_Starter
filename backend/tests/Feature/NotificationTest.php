<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ShippingMethod;
use App\Models\User;
use App\Models\OrderItem;
use App\Notifications\NewOrderAdminNotification;
use App\Notifications\OrderPlacedNotification;
use App\Notifications\PaymentFailedNotification;
use App\Notifications\PaymentConfirmedNotification;
use App\Notifications\PaymentExpiredNotification;
use App\Services\Payments\PaymentInitiationService;
use App\Services\Payments\PaymentStateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private function customer(): User
    {
        return User::factory()->create([
            'role' => 'customer',
            'status' => 'active',
        ]);
    }

    private function createOrder(User $user): Order
    {
        return Order::factory()->create(['user_id' => $user->id]);
    }

    private function notifyOrderPlaced(User $user): void
    {
        $user->notify(new OrderPlacedNotification($this->createOrder($user)));
    }

    public function test_user_can_list_own_notifications(): void
    {
        $user = $this->customer();
        $this->notifyOrderPlaced($user);
        $this->notifyOrderPlaced($user);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/notifications');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'type',
                        'payload',
                        'read_at',
                        'created_at',
                        'updated_at',
                    ],
                ],
                'links',
                'meta',
            ]);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_notifications_are_paginated(): void
    {
        $user = $this->customer();

        for ($i = 0; $i < 25; $i++) {
            $this->notifyOrderPlaced($user);
        }

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/notifications');

        $response->assertStatus(200);

        $this->assertCount(20, $response->json('data'));
        $this->assertEquals(25, $response->json('meta.total'));
    }

    public function test_user_only_sees_their_own_notifications(): void
    {
        $user = $this->customer();
        $other = $this->customer();

        $this->notifyOrderPlaced($user);
        $this->notifyOrderPlaced($other);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/notifications');

        $response->assertStatus(200);

        $this->assertCount(1, $response->json('data'));
    }

    public function test_unread_count_reflects_unread_notifications(): void
    {
        $user = $this->customer();
        $this->notifyOrderPlaced($user);
        $this->notifyOrderPlaced($user);

        $user->notifications()->first()->markAsRead();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/notifications/unread-count');

        $response->assertStatus(200)
            ->assertJson(['unread_count' => 1]);
    }

    public function test_user_can_mark_own_notification_as_read(): void
    {
        $user = $this->customer();
        $this->notifyOrderPlaced($user);

        $notification = $user->notifications()->first();

        $response = $this->actingAs($user, 'sanctum')
            ->patchJson("/api/v1/notifications/{$notification->id}/read");

        $response->assertStatus(200);
        $response->assertJsonPath('data.id', $notification->id);

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_user_cannot_mark_another_users_notification_as_read(): void
    {
        $user = $this->customer();
        $other = $this->customer();

        $this->notifyOrderPlaced($other);

        $notification = $other->notifications()->first();

        $response = $this->actingAs($user, 'sanctum')
            ->patchJson("/api/v1/notifications/{$notification->id}/read");

        $response->assertStatus(403);

        $this->assertNull($notification->fresh()->read_at);
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        $user = $this->customer();
        $this->notifyOrderPlaced($user);
        $this->notifyOrderPlaced($user);

        $response = $this->actingAs($user, 'sanctum')
            ->patchJson('/api/v1/notifications/read-all');

        $response->assertStatus(200);

        $this->assertEquals(0, $user->unreadNotifications()->count());
    }

    public function test_unauthenticated_user_cannot_access_notifications(): void
    {
        $this->getJson('/api/v1/notifications')->assertStatus(401);
        $this->getJson('/api/v1/notifications/unread-count')->assertStatus(401);
    }

    public function test_checkout_creates_order_placed_notification(): void
    {
        $user = $this->customer();


        $staff = User::factory()->create([
            'role' => 'staff',
            'status' => 'active',
            'permissions' => [],
        ]);

        $inactiveStaff = User::factory()->create([
            'role' => 'staff',
            'status' => 'inactive',
            'permissions' => [],
        ]);

        $product = Product::factory()->create([
            'price' => 100,
            'stock' => 10,
            'is_active' => true,
        ]);

        $product->translations()->create([
            'locale' => 'en',
            'name' => 'Test Product',
        ]);

        $cart = Cart::factory()->create([
            'user_id' => $user->id,
            'guest_token' => null,
        ]);

        CartItem::factory()->create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        ShippingMethod::factory()->create([
            'price' => 10,
            'is_active' => true,
            'is_default' => true,
        ]);

        $this->mock(PaymentInitiationService::class, function ($mock) {
            $mock->shouldReceive('initiate')->once()->andReturn([
                'gateway' => 'stripe',
                'status' => 'pending',
                'client_secret' => 'secret',
                'gateway_reference' => 'ref_123',
            ]);
        });

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/checkout', [
                'shipping_address' => [
                    'name' => 'John Doe',
                    'phone' => '123456789',
                    'line1' => '1 Main St',
                    'city' => 'Cairo',
                    'country' => 'EG',
                ],
                'gateway' => 'stripe',
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'type' => OrderPlacedNotification::class,
        ]);

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => User::class,
            'notifiable_id' => $staff->id,
            'type' => NewOrderAdminNotification::class,
        ]);

        $this->assertDatabaseMissing('notifications', [
            'notifiable_type' => User::class,
            'notifiable_id' => $inactiveStaff->id,
            'type' => NewOrderAdminNotification::class,
        ]);

    }

    public function test_failed_checkout_does_not_create_notification(): void
    {
        $user = $this->customer();

        ShippingMethod::factory()->create([
            'is_active' => true,
            'is_default' => true,
        ]);

        $this->mock(PaymentInitiationService::class, function ($mock) {
            $mock->shouldReceive('initiate')->never();
        });

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/checkout', [
                'shipping_address' => [
                    'name' => 'John Doe',
                    'phone' => '123456789',
                    'line1' => '1 Main St',
                    'city' => 'Cairo',
                    'country' => 'EG',
                ],
                'gateway' => 'stripe',
            ]);

        $response->assertStatus(422);

        $this->assertEquals(0, $user->notifications()->count());
    }

    public function test_confirmed_payment_creates_notification(): void
    {
        $user = $this->customer();
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $payment = Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => $order->total,
            'status' => 'pending',
        ]);

        app(PaymentStateService::class)->apply($payment, 'paid', 'gateway-ref', []);

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'type' => PaymentConfirmedNotification::class,
        ]);

        $this->assertEquals('confirmed', $order->fresh()->status);
    }

    public function test_failed_payment_creates_only_one_notification(): void
    {
        $user = $this->customer();

        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $payment = Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => $order->total,
            'status' => 'pending',
        ]);

        $service = app(PaymentStateService::class);

        $service->apply($payment, 'failed', 'gateway-ref', []);
        $service->apply($payment->fresh(), 'failed', 'gateway-ref', []);

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'type' => PaymentFailedNotification::class,
        ]);

        $this->assertSame(
            1,
            $user->notifications()
                ->where('type', PaymentFailedNotification::class)
                ->count()
        );
    }
    public function test_repeated_paid_transition_does_not_duplicate_notification(): void
    {
        $user = $this->customer();
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $payment = Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => $order->total,
            'status' => 'pending',
        ]);

        $service = app(PaymentStateService::class);

        $service->apply($payment, 'paid', 'gateway-ref', []);
        $service->apply($payment->fresh(), 'paid', 'gateway-ref', []);

        $this->assertEquals(
            1,
            $user->notifications()
                ->where('type', PaymentConfirmedNotification::class)
                ->count()
        );
    }

    public function test_invalid_payment_transition_does_not_create_notification(): void
    {
        $user = $this->customer();
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $payment = Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => $order->total,
            'status' => 'refunded',
        ]);

        try {
            app(PaymentStateService::class)->apply($payment, 'paid', null, []);
            $this->fail('Expected a validation exception for the invalid transition.');
        } catch (ValidationException $e) {
            // Expected: refunded -> paid is not allowed.
        }

        $this->assertEquals(0, $user->notifications()->count());
    }

    public function test_expired_payment_notification_uses_its_own_translation_key(): void
    {
        $order = Order::factory()->create([
            'number' => 'ORD-EXPIRED-001',
        ]);

        $notification = new PaymentExpiredNotification($order);

        $data = $notification->toArray(User::factory()->make());

        $this->assertSame('payment_expired', $data['type']);
        $this->assertStringContainsString(
            'ORD-EXPIRED-001',
            $data['message']
        );
    }

    public function test_expired_payment_creates_one_notification_and_restores_stock_once(): void
    {
        $user = $this->customer();

        $product = Product::factory()->create([
            'stock' => 10,
        ]);

        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $payment = Payment::factory()->create([
            'order_id' => $order->id,
            'amount' => $order->total,
            'status' => 'pending',
        ]);

        $service = app(PaymentStateService::class);

        $service->apply($payment, 'expired', 'gateway-ref', []);

        $this->assertSame(12, (int) $product->fresh()->stock);

        $this->assertSame(
            1,
            $user->notifications()
                ->where('type', PaymentExpiredNotification::class)
                ->count()
        );

        $service->apply($payment->fresh(), 'expired', 'gateway-ref', []);

        $this->assertSame(12, (int) $product->fresh()->stock);

        $this->assertSame(
            1,
            $user->notifications()
                ->where('type', PaymentExpiredNotification::class)
                ->count()
        );
    }
}
