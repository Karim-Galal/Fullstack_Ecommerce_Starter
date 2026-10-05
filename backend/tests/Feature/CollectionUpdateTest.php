<?php

namespace Tests\Feature;

use App\Models\Collection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CollectionUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_authorized_admin_can_update_core_fields(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $collection = Collection::factory()->create(['slug' => 'old-slug', 'is_active' => true, 'sort_order' => 5]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/collections/{$collection->id}", [
                'is_active' => false,
                'sort_order' => 10,
            ]);

        $response->assertStatus(200);

        $collection->refresh();

        $this->assertDatabaseHas('collections', [
            'id' => $collection->id,
            'is_active' => false,
            'sort_order' => 10,
        ]);
    }

    public function test_authorized_admin_can_update_translations(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $collection = Collection::factory()->create();
        $collection->translations()->create([
            'locale' => 'en',
            'name' => 'Old Name',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/collections/{$collection->id}", [
                'translations' => [
                    [
                        'locale' => 'en',
                        'name' => 'Updated Name',
                        'description' => 'Updated description',
                    ],
                    [
                        'locale' => 'ar',
                        'name' => 'اسم محدث',
                        'description' => 'وصف محدث',
                    ],
                ],
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('collection_translations', [
            'collection_id' => $collection->id,
            'locale' => 'en',
            'name' => 'Updated Name',
            'description' => 'Updated description',
        ]);
        $this->assertDatabaseHas('collection_translations', [
            'collection_id' => $collection->id,
            'locale' => 'ar',
            'name' => 'اسم محدث',
            'description' => 'وصف محدث',
        ]);
    }

    public function test_updating_translation_does_not_create_duplicate(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $collection = Collection::factory()->create();
        $collection->translations()->create([
            'locale' => 'en',
            'name' => 'Original Name',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/collections/{$collection->id}", [
                'translations' => [
                    [
                        'locale' => 'en',
                        'name' => 'Updated Name',
                    ],
                ],
            ]);

        $response->assertStatus(200);

        $this->assertEquals(1, $collection->translations()->where('locale', 'en')->count());
        $this->assertDatabaseHas('collection_translations', [
            'collection_id' => $collection->id,
            'locale' => 'en',
            'name' => 'Updated Name',
        ]);
    }

    public function test_updating_only_core_fields_works(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $collection = Collection::factory()->create(['is_active' => true, 'sort_order' => 1]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/collections/{$collection->id}", [
                'is_active' => false,
                'sort_order' => 10,
            ]);

        $response->assertStatus(200);

        $collection->refresh();

        $this->assertDatabaseHas('collections', [
            'id' => $collection->id,
            'is_active' => false,
            'sort_order' => 10,
        ]);
    }

    public function test_updating_only_translations_works(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $collection = Collection::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/collections/{$collection->id}", [
                'translations' => [
                    [
                        'locale' => 'en',
                        'name' => 'New English Name',
                    ],
                    [
                        'locale' => 'ar',
                        'name' => 'اسم عربي جديد',
                    ],
                ],
            ]);

        $response->assertStatus(200);
    }

    public function test_english_translation_update_regenerates_slug(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $collection = Collection::factory()->create(['slug' => 'old-slug']);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/collections/{$collection->id}", [
                'translations' => [
                    [
                        'locale' => 'en',
                        'name' => 'New Collection Name',
                    ],
                ],
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('collections', [
            'id' => $collection->id,
            'slug' => 'new-collection-name',
        ]);
    }

    public function test_updating_slug_to_existing_fails(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $collection1 = Collection::factory()->create(['slug' => 'slug-one']);
        $collection2 = Collection::factory()->create(['slug' => 'slug-two']);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/collections/{$collection2->id}", [
                'slug' => 'slug-one',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['slug']);
    }

    public function test_unauthorized_user_cannot_update(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);
        $collection = Collection::factory()->create();

        $response = $this->actingAs($customer, 'sanctum')
            ->patchJson("/api/v1/admin/collections/{$collection->id}", [
                'is_active' => false,
            ]);

        $response->assertStatus(403);
    }
}
