<?php

namespace Tests\Feature;

use App\Models\Collection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CollectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_collection(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/collections', [
                'slug' => 'new-collection',
                'is_active' => true,
                'sort_order' => 1,
                'translations' => [
                    [
                        'locale' => 'en',
                        'name' => 'New Collection',
                        'description' => 'Description in English',
                        'meta_title' => 'New Collection',
                        'meta_description' => 'Meta description in English',
                    ],
                    [
                        'locale' => 'ar',
                        'name' => 'مجموعة تجريبية',
                        'description' => 'وصف باللغة العربية',
                        'meta_title' => 'مجموعة جديدة',
                        'meta_description' => 'وصف ميتا بالعربية',
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'slug',
                    'is_active',
                    'sort_order',
                    'translations' => [
                        '*' => ['locale', 'name', 'description', 'meta_title', 'meta_description'],
                    ],
                ],
            ]);

        $this->assertDatabaseHas('collections', ['slug' => 'new-collection']);
        $this->assertDatabaseHas('collection_translations', [
            'collection_id' => 1,
            'locale' => 'en',
            'name' => 'New Collection',
        ]);
        $this->assertDatabaseHas('collection_translations', [
            'collection_id' => 1,
            'locale' => 'ar',
            'name' => 'مجموعة تجريبية',
        ]);
    }

    public function test_unauthorized_user_cannot_create_collection(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);

        $response = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/v1/admin/collections', [
                'slug' => 'new-collection',
                'is_active' => true,
                'translations' => [
                    [
                        'locale' => 'en',
                        'name' => 'New Collection',
                    ],
                ],
            ]);

        $response->assertStatus(403);
    }

    public function test_creating_collection_with_invalid_core_fields_fails(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/collections', [
                'is_active' => 'invalid',
                'translations' => [],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['is_active', 'translations']);
    }

    public function test_creating_collection_with_invalid_translations_fails(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/collections', [
                'slug' => 'valid-slug',
                'is_active' => true,
                'translations' => [
                    [
                        'locale' => 'invalid',
                        'name' => '',
                    ],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['translations.0.locale', 'translations.0.name']);
    }

    public function test_creating_collection_with_duplicate_slug_fails(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        Collection::factory()->create(['slug' => 'existing-slug']);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/collections', [
                'slug' => 'existing-slug',
                'is_active' => true,
                'translations' => [
                    [
                        'locale' => 'en',
                        'name' => 'New Collection',
                    ],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['slug']);
    }

    public function test_creating_collection_creates_translations_correctly(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/collections', [
                'slug' => 'test-collection',
                'is_active' => true,
                'translations' => [
                    [
                        'locale' => 'en',
                        'name' => 'Test Collection',
                        'description' => 'English description',
                        'meta_title' => 'Meta Title EN',
                        'meta_description' => 'Meta Description EN',
                    ],
                    [
                        'locale' => 'ar',
                        'name' => 'مجموعة تجريبية',
                        'description' => 'وصف بالعربية',
                        'meta_title' => 'عنوان ميتا بالعربي',
                        'meta_description' => 'وصف ميتا بالعربي',
                    ],
                ],
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('collection_translations', [
            'collection_id' => 1,
            'locale' => 'en',
            'name' => 'Test Collection',
            'description' => 'English description',
            'meta_title' => 'Meta Title EN',
            'meta_description' => 'Meta Description EN',
        ]);
        $this->assertDatabaseHas('collection_translations', [
            'collection_id' => 1,
            'locale' => 'ar',
            'name' => 'مجموعة تجريبية',
            'description' => 'وصف بالعربية',
            'meta_title' => 'عنوان ميتا بالعربي',
            'meta_description' => 'وصف ميتا بالعربي',
        ]);
    }

    public function test_slug_generated_from_english_translation(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/collections', [
                'is_active' => true,
                'translations' => [
                    [
                        'locale' => 'en',
                        'name' => 'Test Collection Name',
                    ],
                    [
                        'locale' => 'ar',
                        'name' => 'اسم المجموعة بالعربي',
                    ],
                ],
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('collections', [
            'slug' => 'test-collection-name',
        ]);
    }
}
