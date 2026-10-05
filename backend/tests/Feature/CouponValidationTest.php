<?php

namespace Tests\Feature;

use App\Models\Coupon;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CouponValidationTest extends TestCase
{
    use RefreshDatabase;

    private function masterAdmin(): User
    {
        return User::factory()->create([
            'role' => 'master_admin',
            'status' => 'active',
        ]);
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'code' => 'SAVE20',
            'discount_type' => 'percentage',
            'discount_amount' => 20,
        ], $overrides);
    }

    public function test_creating_coupon_with_missing_required_fields_fails(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code', 'discount_type', 'discount_amount']);
    }

    public function test_invalid_discount_type_fails(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', $this->validPayload([
                'discount_type' => 'bogus',
            ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['discount_type']);
    }

    public function test_zero_discount_amount_fails(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', $this->validPayload([
                'discount_amount' => 0,
            ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['discount_amount']);
    }

    public function test_negative_discount_amount_fails(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', $this->validPayload([
                'discount_amount' => -10,
            ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['discount_amount']);
    }

    public function test_percentage_discount_above_100_fails(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', $this->validPayload([
                'discount_amount' => 100.01,
            ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['discount_amount']);
    }

    public function test_percentage_discount_of_exactly_100_is_allowed(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', $this->validPayload([
                'discount_amount' => 100,
            ]));

        $response->assertStatus(201);
    }

    public function test_fixed_discount_above_100_is_allowed(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', $this->validPayload([
                'discount_type' => 'fixed',
                'discount_amount' => 500,
            ]));

        $response->assertStatus(201);
    }

    public function test_negative_minimum_order_fails(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', $this->validPayload([
                'minimum_order' => -1,
            ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['minimum_order']);
    }

    public function test_null_minimum_order_is_allowed(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', $this->validPayload([
                'minimum_order' => null,
            ]));

        $response->assertStatus(201);
    }

    public function test_usage_limit_below_one_fails(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', $this->validPayload([
                'usage_limit' => 0,
            ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['usage_limit']);
    }

    public function test_non_integer_usage_limit_fails(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', $this->validPayload([
                'usage_limit' => 1.5,
            ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['usage_limit']);
    }

    public function test_expires_at_before_starts_at_fails(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', $this->validPayload([
                'starts_at' => '2026-11-01 00:00:00',
                'expires_at' => '2026-10-01 00:00:00',
            ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['expires_at']);
    }

    public function test_expires_at_equal_to_starts_at_is_allowed(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', $this->validPayload([
                'starts_at' => '2026-11-01 00:00:00',
                'expires_at' => '2026-11-01 00:00:00',
            ]));

        $response->assertStatus(201);
    }

    public function test_coupon_dates_may_be_omitted(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', $this->validPayload());

        $response->assertStatus(201);
        $this->assertDatabaseHas('coupons', [
            'code' => 'SAVE20',
            'starts_at' => null,
            'expires_at' => null,
        ]);
    }

    public function test_expires_at_without_starts_at_is_allowed(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', $this->validPayload([
                'expires_at' => '2026-12-31 23:59:59',
            ]));

        $response->assertStatus(201);
    }

    public function test_invalid_date_value_fails(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', $this->validPayload([
                'starts_at' => 'not-a-date',
            ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['starts_at']);
    }

    public function test_inactive_flag_must_be_boolean(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', $this->validPayload([
                'is_active' => 'yes',
            ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['is_active']);
    }

    public function test_duplicate_code_fails(): void
    {
        $admin = $this->masterAdmin();
        Coupon::factory()->create(['code' => 'TAKEN']);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', $this->validPayload([
                'code' => 'TAKEN',
            ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    public function test_code_of_soft_deleted_coupon_cannot_be_reused(): void
    {
        $admin = $this->masterAdmin();
        $coupon = Coupon::factory()->create(['code' => 'TRASHED']);
        $coupon->delete();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/coupons', $this->validPayload([
                'code' => 'TRASHED',
            ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    public function test_update_with_duplicate_code_of_another_coupon_fails(): void
    {
        $admin = $this->masterAdmin();
        Coupon::factory()->create(['code' => 'FIRST']);
        $coupon = Coupon::factory()->create(['code' => 'SECOND']);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/coupons/{$coupon->id}", [
                'code' => 'FIRST',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    public function test_update_keeps_own_code_allowed(): void
    {
        $admin = $this->masterAdmin();
        $coupon = Coupon::factory()->create(['code' => 'OWN']);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/coupons/{$coupon->id}", [
                'code' => 'OWN',
                'minimum_order' => 25,
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('coupons', [
            'id' => $coupon->id,
            'code' => 'OWN',
            'minimum_order' => 25,
        ]);
    }

    public function test_updating_percentage_coupon_amount_above_100_fails(): void
    {
        $admin = $this->masterAdmin();
        $coupon = Coupon::factory()->create([
            'discount_type' => 'percentage',
            'discount_amount' => 10,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/coupons/{$coupon->id}", [
                'discount_amount' => 150,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['discount_amount']);
    }

    public function test_updating_fixed_coupon_amount_above_100_is_allowed(): void
    {
        $admin = $this->masterAdmin();
        $coupon = Coupon::factory()->create([
            'discount_type' => 'fixed',
            'discount_amount' => 10,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/coupons/{$coupon->id}", [
                'discount_amount' => 150,
            ]);

        $response->assertStatus(200);

        $coupon->refresh();
        $this->assertEquals(150, $coupon->discount_amount);
    }

    public function test_update_expires_at_before_stored_starts_at_fails(): void
    {
        $admin = $this->masterAdmin();
        $coupon = Coupon::factory()->create([
            'starts_at' => '2026-11-01 00:00:00',
            'expires_at' => '2026-12-31 23:59:59',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/coupons/{$coupon->id}", [
                'expires_at' => '2026-10-15 00:00:00',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['expires_at']);
    }

    public function test_update_with_invalid_discount_type_fails(): void
    {
        $admin = $this->masterAdmin();
        $coupon = Coupon::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/coupons/{$coupon->id}", [
                'discount_type' => 'bogo',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['discount_type']);
    }
}
