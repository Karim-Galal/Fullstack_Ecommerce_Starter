<?php

namespace Tests\Feature;

use App\Models\Collection;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CollectionRelationshipTest extends TestCase
{
    use RefreshDatabase;

    public function test_collection_products_relationship(): void
    {
        $collection = Collection::factory()->create();
        $product1 = Product::factory()->create(['is_active' => true]);
        $product2 = Product::factory()->create(['is_active' => true]);

        $collection->products()->attach([$product1->id, $product2->id]);

        $this->assertEquals(2, $collection->products()->count());
        $this->assertTrue($collection->products()->where('product_id', $product1->id)->exists());
        $this->assertTrue($collection->products()->where('product_id', $product2->id)->exists());
    }

    public function test_product_collections_relationship(): void
    {
        $collection1 = Collection::factory()->create();
        $collection2 = Collection::factory()->create();
        $product = Product::factory()->create();

        $product->collections()->attach([$collection1->id, $collection2->id]);

        $this->assertEquals(2, $product->collections()->count());
        $this->assertTrue($product->collections()->where('collection_id', $collection1->id)->exists());
        $this->assertTrue($product->collections()->where('collection_id', $collection2->id)->exists());
    }

    public function test_collection_products_in_admin_show(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $collection = Collection::factory()->create();
        $product = Product::factory()->create(['is_active' => true]);
        $collection->products()->attach($product->id);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/admin/collections/{$collection->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'products' => [
                        '*' => ['id', 'slug', 'price', 'stock', 'translations', 'images'],
                    ],
                ],
            ]);
    }

    public function test_collection_products_in_public_show(): void
    {
        $collection = Collection::factory()->create(['is_active' => true]);
        $product1 = Product::factory()->create(['is_active' => true]);
        $product2 = Product::factory()->create(['is_active' => false]);
        $collection->products()->attach([$product1->id, $product2->id]);

        $response = $this->getJson("/api/v1/collections/{$collection->slug}-{$collection->id}");

        $response->assertStatus(200);
        $products = $response->json('data.products');
        $this->assertEquals(1, count($products));
        $this->assertEquals($product1->id, $products[0]['id']);
    }
}
