<?php

namespace Tests\Feature;

use App\Models\Coupon;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CouponTest extends TestCase
{
    use RefreshDatabase;

    private function masterAdmin(): User
    {
        return User::factory()->create([
            'role' => 'master_admin',
            'status' => 'active',
        ]);
    }

    public function test_admin_can_list_coupons(): void
    {
        $admin = $this->masterAdmin();
        Coupon::factory()->count(3)->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/coupons');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'code',
                        'discount_type',
                        'discount_amount',
                        'minimum_order',
                        'usage_limit',
                        'used_count',
                        'starts_at',
                        'expires_at',
                        'is_active',
                        'created_by',
                        'created_at',
                        'updated_at',
                    ],
                ],
                'links',
                'meta',
            ]);

        $this->assertCount(3, $response->json('data'));
    }

    public function test_staff_with_permission_can_list_coupons(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
            'status' => 'active',
            'permissions' => ['coupons.view'],
        ]);

        $response = $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/admin/coupons');

        $response->assertStatus(200);
    }

    public function test_customer_cannot_list_coupons(): void
    {
        $customer = User::factory()->create([
            'role' => 'customer',
            'status' => 'active',
        ]);

        $response = $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/admin/coupons');

        $response->assertStatus(403);
    }

    public function test_staff_without_permission_cannot_list_coupons(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
            'status' => 'active',
            'permissions' => ['products.view'],
        ]);

        $response = $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/admin/coupons');

        $response->assertStatus(403);
    }

    public function test_admin_can_view_a_coupon(): void
    {
        $admin = $this->masterAdmin();
        $coupon = Coupon::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/admin/coupons/{$coupon->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'code',
                    'discount_type',
                    'discount_amount',
                    'minimum_order',
                    'usage_limit',
                    'used_count',
                    'starts_at',
                    'expires_at',
                    'is_active',
                    'created_by',
                    'created_at',
                    'updated_at',
                ],
            ]);

        $this->assertEquals($coupon->id, $response->json('data.id'));
        $this->assertEquals($coupon->code, $response->json('data.code'));
    }

    public function test_customer_cannot_view_a_coupon(): void
    {
        $customer = User::factory()->create([
            'role' => 'customer',
            'status' => 'active',
        ]);
        $coupon = Coupon::factory()->create();

        $response = $this->actingAs($customer, 'sanctum')
            ->getJson("/api/v1/admin/coupons/{$coupon->id}");

        $response->assertStatus(403);
    }

    public function test_authorized_admin_can_create_a_coupon(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', [
                'code' => 'WELCOME10',
                'discount_type' => 'percentage',
                'discount_amount' => 10,
                'minimum_order' => 100,
                'usage_limit' => 50,
                'starts_at' => '2026-10-01 00:00:00',
                'expires_at' => '2026-12-31 23:59:59',
                'is_active' => true,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'code',
                    'discount_type',
                    'discount_amount',
                    'used_count',
                    'is_active',
                    'created_by',
                ],
            ]);

        $this->assertDatabaseHas('coupons', [
            'code' => 'WELCOME10',
            'discount_type' => 'percentage',
            'is_active' => true,
            'used_count' => 0,
            'created_by' => $admin->id,
        ]);

        $coupon = Coupon::firstWhere('code', 'WELCOME10');
        $this->assertEquals(10, $coupon->discount_amount);
        $this->assertEquals(100, $coupon->minimum_order);
        $this->assertEquals(50, $coupon->usage_limit);
        $this->assertEquals($admin->id, $coupon->created_by);
    }

    public function test_staff_with_coupon_permission_can_create_a_coupon(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
            'status' => 'active',
            'permissions' => ['coupons.view', 'coupons.create'],
        ]);

        $response = $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/admin/coupons', [
                'code' => 'STAFFCODE',
                'discount_type' => 'fixed',
                'discount_amount' => 25,
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('coupons', [
            'code' => 'STAFFCODE',
            'created_by' => $staff->id,
        ]);
    }

    public function test_customer_cannot_create_a_coupon(): void
    {
        $customer = User::factory()->create([
            'role' => 'customer',
            'status' => 'active',
        ]);

        $response = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/v1/admin/coupons', [
                'code' => 'CUSTOMERCODE',
                'discount_type' => 'percentage',
                'discount_amount' => 10,
            ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('coupons', ['code' => 'CUSTOMERCODE']);
    }

    public function test_staff_without_coupon_permission_cannot_create_a_coupon(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
            'status' => 'active',
            'permissions' => ['coupons.view'],
        ]);

        $response = $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/admin/coupons', [
                'code' => 'NOPERMCODE',
                'discount_type' => 'percentage',
                'discount_amount' => 10,
            ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('coupons', ['code' => 'NOPERMCODE']);
    }

    public function test_created_by_is_set_from_authenticated_user(): void
    {
        $admin = $this->masterAdmin();
        $other = User::factory()->create([
            'role' => 'staff',
            'status' => 'active',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', [
                'code' => 'FORGEDCREATOR',
                'discount_type' => 'fixed',
                'discount_amount' => 5,
                'created_by' => $other->id,
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('coupons', [
            'code' => 'FORGEDCREATOR',
            'created_by' => $admin->id,
        ]);
    }

    public function test_used_count_cannot_be_supplied_by_the_client(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', [
                'code' => 'FORGEDCOUNT',
                'discount_type' => 'fixed',
                'discount_amount' => 5,
                'used_count' => 999,
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('coupons', [
            'code' => 'FORGEDCOUNT',
            'used_count' => 0,
        ]);
    }

    public function test_authorized_admin_can_update_a_coupon(): void
    {
        $admin = $this->masterAdmin();
        $coupon = Coupon::factory()->create([
            'created_by' => $admin->id,
            'code' => 'OLDCODE',
            'discount_type' => 'percentage',
            'discount_amount' => 10,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/coupons/{$coupon->id}", [
                'code' => 'NEWCODE',
                'discount_type' => 'fixed',
                'discount_amount' => 15,
                'minimum_order' => 50,
                'is_active' => false,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['id', 'code', 'discount_type', 'discount_amount', 'is_active'],
            ]);

        $this->assertDatabaseHas('coupons', [
            'id' => $coupon->id,
            'code' => 'NEWCODE',
            'discount_type' => 'fixed',
            'minimum_order' => 50,
            'is_active' => false,
            'created_by' => $admin->id,
        ]);

        $coupon->refresh();
        $this->assertEquals(15, $coupon->discount_amount);
    }

    public function test_update_cannot_change_created_by_or_used_count(): void
    {
        $admin = $this->masterAdmin();
        $other = User::factory()->create([
            'role' => 'staff',
            'status' => 'active',
        ]);
        $coupon = Coupon::factory()->create([
            'created_by' => $admin->id,
            'used_count' => 3,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/coupons/{$coupon->id}", [
                'created_by' => $other->id,
                'used_count' => 500,
                'discount_amount' => 20,
            ]);

        $response->assertStatus(200);

        $coupon->refresh();
        $this->assertEquals($admin->id, $coupon->created_by);
        $this->assertEquals(3, $coupon->used_count);
        $this->assertEquals(20, $coupon->discount_amount);
    }

    public function test_customer_cannot_update_a_coupon(): void
    {
        $customer = User::factory()->create([
            'role' => 'customer',
            'status' => 'active',
        ]);
        $coupon = Coupon::factory()->create([
            'discount_amount' => 50,
        ]);

        $response = $this->actingAs($customer, 'sanctum')
            ->patchJson("/api/v1/admin/coupons/{$coupon->id}", [
                'discount_amount' => 5,
            ]);

        $response->assertStatus(403);

        $coupon->refresh();
        $this->assertEquals(50, $coupon->discount_amount);
    }

    public function test_coupons_created_by_relationship_is_exposed_on_user(): void
    {
        $admin = $this->masterAdmin();
        Coupon::factory()->count(2)->create(['created_by' => $admin->id]);

        $this->assertCount(2, $admin->coupons);
        $this->assertEquals($admin->id, Coupon::first()->createdBy->id);
    }
}
