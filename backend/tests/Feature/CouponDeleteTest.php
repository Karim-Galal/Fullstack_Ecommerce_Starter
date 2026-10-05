<?php

namespace Tests\Feature;

use App\Models\Coupon;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CouponDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_authorized_admin_can_delete_coupon(): void
    {
        $admin = User::factory()->create([
            'role' => 'master_admin',
            'status' => 'active',
        ]);
        $coupon = Coupon::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/coupons/{$coupon->id}");

        $response->assertStatus(204);

        $this->assertSoftDeleted('coupons', ['id' => $coupon->id]);
    }

    public function test_deleted_coupon_is_soft_deleted_not_removed(): void
    {
        $admin = User::factory()->create([
            'role' => 'master_admin',
            'status' => 'active',
        ]);
        $coupon = Coupon::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/coupons/{$coupon->id}");

        $this->assertSoftDeleted('coupons', ['id' => $coupon->id]);
        $this->assertNull(Coupon::find($coupon->id));
        $this->assertNotNull(Coupon::withTrashed()->find($coupon->id));
    }

    public function test_customer_cannot_delete_coupon(): void
    {
        $customer = User::factory()->create([
            'role' => 'customer',
            'status' => 'active',
        ]);
        $coupon = Coupon::factory()->create();

        $response = $this->actingAs($customer, 'sanctum')
            ->deleteJson("/api/v1/admin/coupons/{$coupon->id}");

        $response->assertStatus(403);
        $this->assertNull(Coupon::withTrashed()->find($coupon->id)->deleted_at);
    }

    public function test_staff_without_delete_permission_cannot_delete_coupon(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
            'status' => 'active',
            'permissions' => ['coupons.view', 'coupons.update'],
        ]);
        $coupon = Coupon::factory()->create();

        $response = $this->actingAs($staff, 'sanctum')
            ->deleteJson("/api/v1/admin/coupons/{$coupon->id}");

        $response->assertStatus(403);
        $this->assertNull(Coupon::withTrashed()->find($coupon->id)->deleted_at);
    }

    public function test_staff_with_delete_permission_can_delete_coupon(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
            'status' => 'active',
            'permissions' => ['coupons.view', 'coupons.delete'],
        ]);
        $coupon = Coupon::factory()->create();

        $response = $this->actingAs($staff, 'sanctum')
            ->deleteJson("/api/v1/admin/coupons/{$coupon->id}");

        $response->assertStatus(204);
        $this->assertSoftDeleted('coupons', ['id' => $coupon->id]);
    }

    public function test_soft_deleted_coupon_is_still_visible_to_admins(): void
    {
        $admin = User::factory()->create([
            'role' => 'master_admin',
            'status' => 'active',
        ]);
        $coupon = Coupon::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/coupons/{$coupon->id}");

        $show = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/admin/coupons/{$coupon->id}");

        $show->assertStatus(200)
            ->assertJsonPath('data.id', $coupon->id);

        $index = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/coupons');

        $index->assertStatus(200);
        $this->assertCount(1, $index->json('data'));
    }
}
