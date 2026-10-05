<?php

namespace Tests\Feature;

use App\Models\Collection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CollectionDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_authorized_admin_can_delete_collection(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $collection = Collection::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/collections/{$collection->id}");

        $response->assertStatus(204);

        $this->assertSoftDeleted('collections', ['id' => $collection->id]);
    }

    public function test_unauthorized_user_cannot_delete(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);
        $collection = Collection::factory()->create();

        $response = $this->actingAs($customer, 'sanctum')
            ->deleteJson("/api/v1/admin/collections/{$collection->id}");

        $response->assertStatus(403);
    }

    public function test_staff_without_permission_cannot_delete(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
            'status' => 'active',
            'permissions' => ['collections.view'],
        ]);
        $collection = Collection::factory()->create();

        $response = $this->actingAs($staff, 'sanctum')
            ->deleteJson("/api/v1/admin/collections/{$collection->id}");

        $response->assertStatus(403);
    }

    public function test_deleted_collection_is_soft_deleted(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $collection = Collection::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/collections/{$collection->id}");

        $this->assertSoftDeleted('collections', ['id' => $collection->id]);
    }
}
