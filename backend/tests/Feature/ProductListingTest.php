<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Collection;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class ProductListingTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/v1/products';

    private function product(array $attributes = [], ?array $translations = null): Product
    {
        $product = Product::factory()->create($attributes);

        if ($translations === null) {
            $translations = [['locale' => 'en', 'name' => 'Product '.$product->id]];
        }

        $product->translations()->createMany($translations);

        return $product;
    }

    private function ids(TestResponse $response): array
    {
        return collect($response->json('data'))->pluck('id')->all();
    }

    public function test_public_listing_is_accessible_without_authentication(): void
    {
        $this->product();

        $this->getJson(self::ENDPOINT)->assertOk();
    }

    public function test_active_products_are_listed(): void
    {
        $active = $this->product(['is_active' => true]);

        $response = $this->getJson(self::ENDPOINT);

        $response->assertOk();
        $this->assertContains($active->id, $this->ids($response));
    }

    public function test_inactive_products_are_never_listed(): void
    {
        $inactive = $this->product(['is_active' => false], [['locale' => 'en', 'name' => 'Hidden Item']]);

        $response = $this->getJson(self::ENDPOINT);

        $response->assertOk();
        $this->assertNotContains($inactive->id, $this->ids($response));
    }

    public function test_inactive_products_are_not_exposed_via_is_active_parameter(): void
    {
        $active = $this->product(['is_active' => true]);
        $inactive = $this->product(['is_active' => false]);

        $activeParam = $this->getJson(self::ENDPOINT.'?is_active=1');
        $activeParam->assertOk();
        $this->assertContains($active->id, $this->ids($activeParam));
        $this->assertNotContains($inactive->id, $this->ids($activeParam));

        $inactiveParam = $this->getJson(self::ENDPOINT.'?is_active=0');
        $inactiveParam->assertOk();
        $this->assertNotContains($inactive->id, $this->ids($inactiveParam));
    }

    public function test_soft_deleted_products_are_not_listed(): void
    {
        $visible = $this->product();
        $deleted = $this->product();
        $deleted->delete();

        $response = $this->getJson(self::ENDPOINT);

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($visible->id, $ids);
        $this->assertNotContains($deleted->id, $ids);
    }

    public function test_search_matches_translated_name(): void
    {
        $match = $this->product([], [['locale' => 'en', 'name' => 'Blue Widget']]);
        $other = $this->product([], [['locale' => 'en', 'name' => 'Red Gadget']]);

        $response = $this->getJson(self::ENDPOINT.'?search=Widget');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($match->id, $ids);
        $this->assertNotContains($other->id, $ids);
    }

    public function test_search_matches_sku(): void
    {
        $match = $this->product(['sku' => 'SKU-FIND-777']);
        $other = $this->product(['sku' => 'SKU-OTHER-888']);

        $response = $this->getJson(self::ENDPOINT.'?search=FIND-777');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($match->id, $ids);
        $this->assertNotContains($other->id, $ids);
    }

    public function test_search_matches_slug(): void
    {
        $match = $this->product(['slug' => 'exclusive-blue-widget']);
        $other = $this->product(['slug' => 'plain-red-gadget']);

        $response = $this->getJson(self::ENDPOINT.'?search=blue-widget');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($match->id, $ids);
        $this->assertNotContains($other->id, $ids);
    }

    public function test_search_does_not_return_duplicate_products(): void
    {
        $product = $this->product([], [
            ['locale' => 'en', 'name' => 'Duplicate Name'],
            ['locale' => 'ar', 'name' => 'Duplicate Name'],
        ]);

        $response = $this->getJson(self::ENDPOINT.'?search=Duplicate');

        $response->assertOk();
        $count = collect($this->ids($response))
            ->filter(fn ($id) => $id === $product->id)
            ->count();
        $this->assertSame(1, $count);
    }

    public function test_search_does_not_bypass_active_visibility(): void
    {
        $active = $this->product(['is_active' => true], [['locale' => 'en', 'name' => 'Target Item']]);
        $inactive = $this->product(['is_active' => false], [['locale' => 'en', 'name' => 'Target Item Two']]);

        $response = $this->getJson(self::ENDPOINT.'?search=Target');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($active->id, $ids);
        $this->assertNotContains($inactive->id, $ids);
    }

    public function test_filter_by_category(): void
    {
        $category = Category::factory()->create();
        $match = $this->product(['category_id' => $category->id]);
        $other = $this->product();

        $response = $this->getJson(self::ENDPOINT.'?category_id='.$category->id);

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($match->id, $ids);
        $this->assertNotContains($other->id, $ids);
    }

    public function test_filter_by_collection(): void
    {
        $collection = Collection::factory()->create();
        $match = $this->product();
        $other = $this->product();
        $collection->products()->attach($match->id);

        $response = $this->getJson(self::ENDPOINT.'?collection_id='.$collection->id);

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($match->id, $ids);
        $this->assertNotContains($other->id, $ids);
    }

    public function test_filter_by_min_price_is_inclusive(): void
    {
        $cheap = $this->product(['price' => 50]);
        $boundary = $this->product(['price' => 100]);
        $expensive = $this->product(['price' => 150]);

        $response = $this->getJson(self::ENDPOINT.'?min_price=100');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($boundary->id, $ids);
        $this->assertContains($expensive->id, $ids);
        $this->assertNotContains($cheap->id, $ids);
    }

    public function test_filter_by_max_price_is_inclusive(): void
    {
        $cheap = $this->product(['price' => 50]);
        $boundary = $this->product(['price' => 100]);
        $expensive = $this->product(['price' => 150]);

        $response = $this->getJson(self::ENDPOINT.'?max_price=100');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($cheap->id, $ids);
        $this->assertContains($boundary->id, $ids);
        $this->assertNotContains($expensive->id, $ids);
    }

    public function test_filter_by_in_stock(): void
    {
        $inStock = $this->product(['stock' => 5]);
        $outOfStock = $this->product(['stock' => 0]);

        $inStockResponse = $this->getJson(self::ENDPOINT.'?in_stock=1');
        $inStockResponse->assertOk();
        $this->assertContains($inStock->id, $this->ids($inStockResponse));
        $this->assertNotContains($outOfStock->id, $this->ids($inStockResponse));

        $outOfStockResponse = $this->getJson(self::ENDPOINT.'?in_stock=0');
        $outOfStockResponse->assertOk();
        $this->assertContains($outOfStock->id, $this->ids($outOfStockResponse));
        $this->assertNotContains($inStock->id, $this->ids($outOfStockResponse));
    }

    public function test_combined_filters_return_only_matching_products(): void
    {
        $category = Category::factory()->create();
        $otherCategory = Category::factory()->create();
        $collection = Collection::factory()->create();

        $match = $this->product([
            'category_id' => $category->id,
            'price' => 100,
            'stock' => 5,
        ], [['locale' => 'en', 'name' => 'Combo Match']]);
        $collection->products()->attach($match->id);

        $this->product([
            'category_id' => $otherCategory->id,
            'price' => 100,
            'stock' => 5,
        ], [['locale' => 'en', 'name' => 'Combo Wrong Category']]);

        $wrongStock = $this->product([
            'category_id' => $category->id,
            'price' => 100,
            'stock' => 0,
        ], [['locale' => 'en', 'name' => 'Combo Wrong Stock']]);
        $collection->products()->attach($wrongStock->id);

        $response = $this->getJson(
            self::ENDPOINT
            .'?search=Combo&category_id='.$category->id
            .'&collection_id='.$collection->id
            .'&min_price=50&max_price=200&in_stock=1'
        );

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($match->id, $ids);
        foreach ($ids as $id) {
            $this->assertSame($match->id, $id);
        }
    }

    public function test_default_sort_is_created_at_descending(): void
    {
        $newest = $this->product(['created_at' => '2026-06-15 00:00:00']);
        $this->product(['created_at' => '2026-06-13 00:00:00']);
        $this->product(['created_at' => '2026-06-14 00:00:00']);

        $response = $this->getJson(self::ENDPOINT);

        $response->assertOk();
        $this->assertSame($newest->id, $response->json('data.0.id'));
    }

    public function test_sort_by_price_ascending(): void
    {
        $this->product(['price' => 30]);
        $this->product(['price' => 10]);
        $this->product(['price' => 20]);

        $response = $this->getJson(self::ENDPOINT.'?sort=price&direction=asc');

        $response->assertOk();
        $prices = collect($response->json('data'))->pluck('price')->map(fn ($p) => (float) $p)->all();
        $this->assertSame(collect($prices)->sort()->values()->all(), $prices);
    }

    public function test_invalid_sort_returns_422(): void
    {
        $this->getJson(self::ENDPOINT.'?sort=stock')
            ->assertStatus(422)
            ->assertJsonValidationErrors('sort');
    }

    public function test_invalid_direction_returns_422(): void
    {
        $this->getJson(self::ENDPOINT.'?direction=sideways')
            ->assertStatus(422)
            ->assertJsonValidationErrors('direction');
    }

    public function test_invalid_category_id_returns_422(): void
    {
        $this->getJson(self::ENDPOINT.'?category_id=999999')
            ->assertStatus(422)
            ->assertJsonValidationErrors('category_id');
    }

    public function test_invalid_collection_id_returns_422(): void
    {
        $this->getJson(self::ENDPOINT.'?collection_id=999999')
            ->assertStatus(422)
            ->assertJsonValidationErrors('collection_id');
    }

    public function test_invalid_in_stock_returns_422(): void
    {
        $this->getJson(self::ENDPOINT.'?in_stock=maybe')
            ->assertStatus(422)
            ->assertJsonValidationErrors('in_stock');
    }

    public function test_negative_price_returns_422(): void
    {
        $this->getJson(self::ENDPOINT.'?min_price=-1')
            ->assertStatus(422)
            ->assertJsonValidationErrors('min_price');
    }

    public function test_min_price_greater_than_max_price_returns_422(): void
    {
        $this->getJson(self::ENDPOINT.'?min_price=200&max_price=100')
            ->assertStatus(422)
            ->assertJsonValidationErrors('max_price');
    }

    public function test_default_pagination_uses_20_per_page(): void
    {
        Product::factory()->count(25)->create();

        $response = $this->getJson(self::ENDPOINT);

        $response->assertOk();
        $this->assertCount(20, $response->json('data'));
        $this->assertSame(20, $response->json('per_page'));
        $this->assertSame(25, $response->json('total'));
    }

    public function test_per_page_is_respected(): void
    {
        Product::factory()->count(5)->create();

        $response = $this->getJson(self::ENDPOINT.'?per_page=2');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
        $this->assertSame(2, $response->json('per_page'));
    }

    public function test_per_page_upper_bound_is_validated(): void
    {
        $this->getJson(self::ENDPOINT.'?per_page=101')
            ->assertStatus(422)
            ->assertJsonValidationErrors('per_page');
    }

    public function test_per_page_lower_bound_is_validated(): void
    {
        $this->getJson(self::ENDPOINT.'?per_page=0')
            ->assertStatus(422)
            ->assertJsonValidationErrors('per_page');
    }

    public function test_response_shape_is_preserved(): void
    {
        $this->product();

        $response = $this->getJson(self::ENDPOINT);

        $response->assertOk()->assertJsonStructure([
            'data' => [
                '*' => ['id', 'slug', 'sku', 'price', 'stock', 'is_active', 'translations', 'images', 'category'],
            ],
            'current_page',
            'links',
            'per_page',
            'total',
        ]);
    }
}
