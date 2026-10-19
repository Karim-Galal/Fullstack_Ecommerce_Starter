<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class UserIndexTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/v1/admin/users';

    private function masterAdmin(array $attributes = []): User
    {
        return User::factory()->create([
            'role' => 'master_admin',
            'status' => 'active',
            ...$attributes,
        ]);
    }

    private function staff(array $permissions = ['users.view'], array $attributes = []): User
    {
        return User::factory()->create([
            'role' => 'staff',
            'status' => 'active',
            'permissions' => $permissions,
            ...$attributes,
        ]);
    }

    private function ids(TestResponse $response): array
    {
        return collect($response->json('data'))->pluck('id')->all();
    }

    public function test_master_admin_can_list_users(): void
    {
        $admin = $this->masterAdmin();
        User::factory()->count(3)->create();

        $response = $this->actingAs($admin, 'sanctum')->getJson(self::ENDPOINT);

        $response->assertOk()->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name', 'email', 'role', 'status'],
            ],
            'links',
            'meta',
        ]);
    }

    public function test_authorized_staff_can_list_users(): void
    {
        $staff = $this->staff(['users.view']);

        $this->actingAs($staff, 'sanctum')
            ->getJson(self::ENDPOINT)
            ->assertOk();
    }

    public function test_staff_without_view_permission_is_forbidden(): void
    {
        $staff = $this->staff([]);

        $this->actingAs($staff, 'sanctum')
            ->getJson(self::ENDPOINT)
            ->assertForbidden();
    }

    public function test_inactive_staff_with_permission_is_forbidden(): void
    {
        $staff = $this->staff(['users.view'], ['status' => 'inactive']);

        $this->actingAs($staff, 'sanctum')
            ->getJson(self::ENDPOINT)
            ->assertForbidden();
    }

    public function test_customer_is_forbidden(): void
    {
        $customer = User::factory()->create([
            'role' => 'customer',
            'status' => 'active',
        ]);

        $this->actingAs($customer, 'sanctum')
            ->getJson(self::ENDPOINT)
            ->assertForbidden();
    }

    public function test_guest_is_unauthenticated(): void
    {
        $this->getJson(self::ENDPOINT)->assertUnauthorized();
    }

    public function test_search_matches_partial_name(): void
    {
        $admin = $this->masterAdmin(['name' => 'Root Operator']);
        $match = User::factory()->create(['name' => 'Alice Anderson']);
        $other = User::factory()->create(['name' => 'Bob Brown']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?search=lic');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($match->id, $ids);
        $this->assertNotContains($other->id, $ids);
    }

    public function test_search_matches_partial_email(): void
    {
        $admin = $this->masterAdmin();
        $match = User::factory()->create(['email' => 'findme@example.com']);
        $other = User::factory()->create(['email' => 'hidden@example.com']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?search=findme');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($match->id, $ids);
        $this->assertNotContains($other->id, $ids);
    }

    public function test_search_does_not_bypass_other_filters(): void
    {
        $admin = $this->masterAdmin();
        $staff = User::factory()->create(['name' => 'Target Staff', 'role' => 'staff']);
        $customer = User::factory()->create(['name' => 'Target Customer', 'role' => 'customer']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?search=Target&role=staff');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($staff->id, $ids);
        $this->assertNotContains($customer->id, $ids);
    }

    public function test_filter_by_role_returns_only_matching_role(): void
    {
        $admin = $this->masterAdmin();
        $staff = User::factory()->create(['role' => 'staff']);
        $customer = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?role=staff');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($staff->id, $ids);
        $this->assertNotContains($customer->id, $ids);
        $this->assertNotContains($admin->id, $ids);
    }

    public function test_filter_by_each_supported_status(): void
    {
        $admin = $this->masterAdmin();
        User::factory()->create(['status' => 'active']);
        User::factory()->create(['status' => 'inactive']);
        User::factory()->create(['status' => 'pending_approval']);

        foreach (['active', 'inactive', 'pending_approval'] as $status) {
            $response = $this->actingAs($admin, 'sanctum')
                ->getJson(self::ENDPOINT.'?status='.$status);

            $response->assertOk();
            foreach ($response->json('data') as $user) {
                $this->assertSame($status, $user['status']);
            }
        }
    }

    public function test_filter_by_verified_email(): void
    {
        $admin = $this->masterAdmin();
        $verified = User::factory()->create();
        $unverified = User::factory()->unverified()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?email_verified=1');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($verified->id, $ids);
        $this->assertNotContains($unverified->id, $ids);
    }

    public function test_filter_by_unverified_email(): void
    {
        $admin = $this->masterAdmin();
        $verified = User::factory()->create();
        $unverified = User::factory()->unverified()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?email_verified=0');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($unverified->id, $ids);
        $this->assertNotContains($verified->id, $ids);
    }

    public function test_email_verified_accepts_false_token(): void
    {
        $admin = $this->masterAdmin();
        $unverified = User::factory()->unverified()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?email_verified=false');

        $response->assertOk();
        $this->assertContains($unverified->id, $this->ids($response));
    }

    public function test_invalid_email_verified_returns_422(): void
    {
        $admin = $this->masterAdmin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?email_verified=maybe')
            ->assertStatus(422)
            ->assertJsonValidationErrors('email_verified');
    }

    public function test_created_to_includes_entire_end_day(): void
    {
        $admin = $this->masterAdmin();
        $startOfDay = User::factory()->create(['created_at' => '2026-06-15 00:00:00']);
        $endOfDay = User::factory()->create(['created_at' => '2026-06-15 23:59:59']);
        $nextDay = User::factory()->create(['created_at' => '2026-06-16 00:00:00']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?created_to=2026-06-15');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($startOfDay->id, $ids);
        $this->assertContains($endOfDay->id, $ids);
        $this->assertNotContains($nextDay->id, $ids);
    }

    public function test_created_from_filters_earlier_records(): void
    {
        $admin = $this->masterAdmin();
        $old = User::factory()->create(['created_at' => '2026-06-14 12:00:00']);
        $new = User::factory()->create(['created_at' => '2026-06-16 12:00:00']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?created_from=2026-06-15');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($new->id, $ids);
        $this->assertNotContains($old->id, $ids);
    }

    public function test_invalid_date_range_returns_422(): void
    {
        $admin = $this->masterAdmin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?created_from=2026-06-20&created_to=2026-06-10')
            ->assertStatus(422)
            ->assertJsonValidationErrors('created_to');
    }

    public function test_invalid_date_value_returns_422(): void
    {
        $admin = $this->masterAdmin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?created_from=not-a-date')
            ->assertStatus(422)
            ->assertJsonValidationErrors('created_from');
    }

    public function test_combined_filters(): void
    {
        $admin = $this->masterAdmin();
        $match = User::factory()->create([
            'name' => 'Alice Seller',
            'role' => 'staff',
            'status' => 'active',
        ]);
        $wrongRole = User::factory()->create([
            'name' => 'Alice Buyer',
            'role' => 'customer',
            'status' => 'active',
        ]);
        $wrongStatus = User::factory()->create([
            'name' => 'Alice Inactive',
            'role' => 'staff',
            'status' => 'inactive',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?search=Alice&role=staff&status=active&email_verified=1');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($match->id, $ids);
        $this->assertNotContains($wrongRole->id, $ids);
        $this->assertNotContains($wrongStatus->id, $ids);
    }

    public function test_default_sort_is_created_at_descending(): void
    {
        $admin = $this->masterAdmin(['created_at' => '2026-06-15 00:00:00']);
        User::factory()->create(['created_at' => '2026-06-13 00:00:00']);
        User::factory()->create(['created_at' => '2026-06-14 00:00:00']);

        $response = $this->actingAs($admin, 'sanctum')->getJson(self::ENDPOINT);

        $response->assertOk();
        $this->assertSame($admin->id, $response->json('data.0.id'));
    }

    public function test_sort_by_name_ascending(): void
    {
        $admin = $this->masterAdmin(['name' => 'Zed Admin']);
        User::factory()->create(['name' => 'Alice']);
        User::factory()->create(['name' => 'Mike']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?sort=name&direction=asc');

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name')->all();
        $this->assertSame(collect($names)->sort()->values()->all(), $names);
    }

    public function test_invalid_sort_returns_422(): void
    {
        $admin = $this->masterAdmin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?sort=password')
            ->assertStatus(422)
            ->assertJsonValidationErrors('sort');
    }

    public function test_invalid_direction_returns_422(): void
    {
        $admin = $this->masterAdmin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?direction=sideways')
            ->assertStatus(422)
            ->assertJsonValidationErrors('direction');
    }

    public function test_invalid_role_returns_422(): void
    {
        $admin = $this->masterAdmin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?role=superuser')
            ->assertStatus(422)
            ->assertJsonValidationErrors('role');
    }

    public function test_invalid_status_returns_422(): void
    {
        $admin = $this->masterAdmin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?status=banned')
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
    }

    public function test_default_pagination_uses_20_per_page(): void
    {
        $admin = $this->masterAdmin();
        User::factory()->count(25)->create();

        $response = $this->actingAs($admin, 'sanctum')->getJson(self::ENDPOINT);

        $response->assertOk();
        $this->assertCount(20, $response->json('data'));
        $this->assertSame(20, $response->json('meta.per_page'));
        $this->assertSame(26, $response->json('meta.total'));
    }

    public function test_per_page_is_respected(): void
    {
        $admin = $this->masterAdmin();
        User::factory()->count(5)->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?per_page=3');

        $response->assertOk();
        $this->assertCount(3, $response->json('data'));
        $this->assertSame(3, $response->json('meta.per_page'));
    }

    public function test_per_page_upper_bound_is_validated(): void
    {
        $admin = $this->masterAdmin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?per_page=101')
            ->assertStatus(422)
            ->assertJsonValidationErrors('per_page');
    }

    public function test_per_page_lower_bound_is_validated(): void
    {
        $admin = $this->masterAdmin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?per_page=0')
            ->assertStatus(422)
            ->assertJsonValidationErrors('per_page');
    }

    public function test_response_hides_sensitive_fields_and_keeps_shape(): void
    {
        $admin = $this->masterAdmin();

        $response = $this->actingAs($admin, 'sanctum')->getJson(self::ENDPOINT);

        $response->assertOk()->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'email',
                    'role',
                    'status',
                    'permissions',
                    'google_id',
                    'email_verified_at',
                    'approved_at',
                    'approved_by',
                    'created_at',
                    'updated_at',
                ],
            ],
        ]);

        $first = $response->json('data.0');
        $this->assertArrayNotHasKey('password', $first);
        $this->assertArrayNotHasKey('remember_token', $first);
        $this->assertArrayNotHasKey('deleted_at', $first);
    }

    public function test_soft_deleted_users_are_excluded(): void
    {
        $admin = $this->masterAdmin();
        $deleted = User::factory()->create();
        $deleted->delete();

        $response = $this->actingAs($admin, 'sanctum')->getJson(self::ENDPOINT);

        $response->assertOk();
        $this->assertNotContains($deleted->id, $this->ids($response));
    }
}
