<?php

namespace Tests\Feature;

use App\Models\Collection;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CollectionIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_authorized_admin_can_list_collections(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        Collection::factory()->count(5)->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/collections');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'slug', 'is_active', 'sort_order', 'translations', 'products'],
                ],
                'links',
                'meta',
            ]);
    }

    public function test_unauthorized_user_cannot_list_admin_collections(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);

        $response = $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/admin/collections');

        $response->assertStatus(403);
    }

    public function test_admin_can_show_collection(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $collection = Collection::factory()->create();
        $collection->translations()->createMany([
            ['locale' => 'en', 'name' => 'Test Collection'],
            ['locale' => 'ar', 'name' => 'مجموعة تجريبية'],
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/admin/collections/{$collection->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'slug',
                    'is_active',
                    'sort_order',
                    'translations',
                    'products',
                ],
            ]);
    }

    public function test_public_index_returns_only_active_collections(): void
    {
        Collection::factory()->create(['is_active' => true]);
        Collection::factory()->create(['is_active' => false]);
        Collection::factory()->create(['is_active' => true]);

        $response = $this->getJson('/api/v1/collections');

        $response->assertStatus(200);
        $this->assertEquals(2, count($response->json('data')));
        foreach ($response->json('data') as $collection) {
            $this->assertTrue($collection['is_active']);
        }
    }

    public function test_public_show_returns_404_for_inactive_collection(): void
    {
        $collection = Collection::factory()->create(['is_active' => false]);

        $response = $this->getJson("/api/v1/collections/{$collection->slug}-{$collection->id}");

        $response->assertStatus(404);
    }

    public function test_public_show_returns_collection_with_translations_and_products(): void
    {
        $collection = Collection::factory()->create(['is_active' => true]);
        $collection->translations()->createMany([
            ['locale' => 'en', 'name' => 'Test Collection'],
            ['locale' => 'ar', 'name' => 'مجموعة تجريبية'],
        ]);
        $product = Product::factory()->create(['is_active' => true]);
        $collection->products()->attach($product->id);

        $url = "/api/v1/collections/{$collection->slug}-{$collection->id}";

        $response = $this->getJson($url);

        $json = $response->json();

        // Check the raw JSON structure
        $this->assertArrayHasKey('data', $json);
        $data = $json['data'];
        $this->assertArrayHasKey('translations', $data);
        $this->assertArrayHasKey('products', $data);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'slug',
                    'is_active',
                    'translations' => [
                        '*' => ['locale', 'name', 'description', 'meta_title', 'meta_description'],
                    ],
                    'products' => [
                        '*' => ['id', 'slug', 'price', 'stock', 'translations', 'images'],
                    ],
                ],
            ]);
    }
}
