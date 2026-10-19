<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Collection;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class ProductIndexTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/v1/admin/products';

    private function admin(array $attributes = []): User
    {
        return User::factory()->create([
            'role' => 'master_admin',
            'status' => 'active',
            ...$attributes,
        ]);
    }

    private function staff(array $permissions = ['products.view'], array $attributes = []): User
    {
        return User::factory()->create([
            'role' => 'staff',
            'status' => 'active',
            'permissions' => $permissions,
            ...$attributes,
        ]);
    }

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

    public function test_admin_can_list_products(): void
    {
        $admin = $this->admin();
        $this->product();

        $response = $this->actingAs($admin, 'sanctum')->getJson(self::ENDPOINT);

        $response->assertOk()->assertJsonStructure([
            'data' => [
                '*' => ['id', 'slug', 'sku', 'price', 'stock', 'is_active', 'translations', 'images'],
            ],
            'current_page',
            'links',
            'per_page',
            'total',
        ]);
    }

    public function test_staff_with_permission_can_list_products(): void
    {
        $staff = $this->staff(['products.view']);

        $this->actingAs($staff, 'sanctum')
            ->getJson(self::ENDPOINT)
            ->assertOk();
    }

    public function test_staff_without_permission_is_forbidden(): void
    {
        $staff = $this->staff([]);

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

    public function test_search_matches_translation_name(): void
    {
        $admin = $this->admin();
        $match = $this->product([], [['locale' => 'en', 'name' => 'Blue Widget']]);
        $other = $this->product([], [['locale' => 'en', 'name' => 'Red Gadget']]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?search=Widget');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($match->id, $ids);
        $this->assertNotContains($other->id, $ids);
    }

    public function test_search_matches_sku(): void
    {
        $admin = $this->admin();
        $match = $this->product(['sku' => 'SKU-FIND-777']);
        $other = $this->product(['sku' => 'SKU-OTHER-888']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?search=FIND-777');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($match->id, $ids);
        $this->assertNotContains($other->id, $ids);
    }

    public function test_search_matches_slug(): void
    {
        $admin = $this->admin();
        $match = $this->product(['slug' => 'exclusive-blue-widget']);
        $other = $this->product(['slug' => 'plain-red-gadget']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?search=blue-widget');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($match->id, $ids);
        $this->assertNotContains($other->id, $ids);
    }

    public function test_search_does_not_return_duplicate_products(): void
    {
        $admin = $this->admin();
        $product = $this->product([], [
            ['locale' => 'en', 'name' => 'Duplicate Name'],
            ['locale' => 'ar', 'name' => 'Duplicate Name'],
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?search=Duplicate');

        $response->assertOk();
        $count = collect($this->ids($response))
            ->filter(fn ($id) => $id === $product->id)
            ->count();
        $this->assertSame(1, $count);
    }

    public function test_search_does_not_bypass_other_filters(): void
    {
        $admin = $this->admin();
        $active = $this->product(['is_active' => true], [['locale' => 'en', 'name' => 'Target Item']]);
        $inactive = $this->product(['is_active' => false], [['locale' => 'en', 'name' => 'Target Item Two']]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?search=Target&is_active=1');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($active->id, $ids);
        $this->assertNotContains($inactive->id, $ids);
    }

    public function test_filter_by_category(): void
    {
        $admin = $this->admin();
        $category = Category::factory()->create();
        $match = $this->product(['category_id' => $category->id]);
        $other = $this->product();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?category_id='.$category->id);

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($match->id, $ids);
        $this->assertNotContains($other->id, $ids);
    }

    public function test_filter_by_collection(): void
    {
        $admin = $this->admin();
        $collection = Collection::factory()->create();
        $match = $this->product();
        $other = $this->product();
        $collection->products()->attach($match->id);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?collection_id='.$collection->id);

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($match->id, $ids);
        $this->assertNotContains($other->id, $ids);
    }

    public function test_filter_by_active_status(): void
    {
        $admin = $this->admin();
        $active = $this->product(['is_active' => true]);
        $inactive = $this->product(['is_active' => false]);

        $activeResponse = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?is_active=1');
        $activeResponse->assertOk();
        $this->assertContains($active->id, $this->ids($activeResponse));
        $this->assertNotContains($inactive->id, $this->ids($activeResponse));

        $inactiveResponse = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?is_active=0');
        $inactiveResponse->assertOk();
        $this->assertContains($inactive->id, $this->ids($inactiveResponse));
        $this->assertNotContains($active->id, $this->ids($inactiveResponse));
    }

    public function test_filter_by_min_price_is_inclusive(): void
    {
        $admin = $this->admin();
        $cheap = $this->product(['price' => 50]);
        $boundary = $this->product(['price' => 100]);
        $expensive = $this->product(['price' => 150]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?min_price=100');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($boundary->id, $ids);
        $this->assertContains($expensive->id, $ids);
        $this->assertNotContains($cheap->id, $ids);
    }

    public function test_filter_by_max_price_is_inclusive(): void
    {
        $admin = $this->admin();
        $cheap = $this->product(['price' => 50]);
        $boundary = $this->product(['price' => 100]);
        $expensive = $this->product(['price' => 150]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?max_price=100');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($cheap->id, $ids);
        $this->assertContains($boundary->id, $ids);
        $this->assertNotContains($expensive->id, $ids);
    }

    public function test_filter_by_in_stock(): void
    {
        $admin = $this->admin();
        $inStock = $this->product(['stock' => 5]);
        $outOfStock = $this->product(['stock' => 0]);

        $inStockResponse = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?in_stock=1');
        $inStockResponse->assertOk();
        $this->assertContains($inStock->id, $this->ids($inStockResponse));
        $this->assertNotContains($outOfStock->id, $this->ids($inStockResponse));

        $outOfStockResponse = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?in_stock=0');
        $outOfStockResponse->assertOk();
        $this->assertContains($outOfStock->id, $this->ids($outOfStockResponse));
        $this->assertNotContains($inStock->id, $this->ids($outOfStockResponse));
    }

    public function test_created_to_includes_entire_end_day(): void
    {
        $admin = $this->admin();
        $startOfDay = $this->product(['created_at' => '2026-06-15 00:00:00']);
        $endOfDay = $this->product(['created_at' => '2026-06-15 23:59:59']);
        $nextDay = $this->product(['created_at' => '2026-06-16 00:00:00']);

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
        $admin = $this->admin();
        $old = $this->product(['created_at' => '2026-06-14 12:00:00']);
        $new = $this->product(['created_at' => '2026-06-16 12:00:00']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?created_from=2026-06-15');

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($new->id, $ids);
        $this->assertNotContains($old->id, $ids);
    }

    public function test_combined_filters(): void
    {
        $admin = $this->admin();
        $category = Category::factory()->create();
        $otherCategory = Category::factory()->create();
        $collection = Collection::factory()->create();

        $match = $this->product([
            'category_id' => $category->id,
            'is_active' => true,
            'price' => 100,
            'stock' => 5,
        ], [['locale' => 'en', 'name' => 'Combo Match']]);
        $collection->products()->attach($match->id);

        $this->product([
            'category_id' => $otherCategory->id,
            'is_active' => true,
            'price' => 100,
            'stock' => 5,
        ], [['locale' => 'en', 'name' => 'Combo Wrong Category']]);

        $wrongStock = $this->product([
            'category_id' => $category->id,
            'is_active' => true,
            'price' => 100,
            'stock' => 0,
        ], [['locale' => 'en', 'name' => 'Combo Wrong Stock']]);
        $collection->products()->attach($wrongStock->id);

        $response = $this->actingAs($admin, 'sanctum')->getJson(
            self::ENDPOINT
            .'?category_id='.$category->id
            .'&collection_id='.$collection->id
            .'&is_active=1&min_price=50&max_price=200&in_stock=1'
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
        $admin = $this->admin();
        $newest = $this->product(['created_at' => '2026-06-15 00:00:00']);
        $this->product(['created_at' => '2026-06-13 00:00:00']);
        $this->product(['created_at' => '2026-06-14 00:00:00']);

        $response = $this->actingAs($admin, 'sanctum')->getJson(self::ENDPOINT);

        $response->assertOk();
        $this->assertSame($newest->id, $response->json('data.0.id'));
    }

    public function test_sort_by_price_ascending(): void
    {
        $admin = $this->admin();
        $this->product(['price' => 30]);
        $this->product(['price' => 10]);
        $this->product(['price' => 20]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?sort=price&direction=asc');

        $response->assertOk();
        $prices = collect($response->json('data'))->pluck('price')->map(fn ($p) => (float) $p)->all();
        $this->assertSame(collect($prices)->sort()->values()->all(), $prices);
    }

    public function test_sort_by_stock_descending(): void
    {
        $admin = $this->admin();
        $this->product(['stock' => 1]);
        $this->product(['stock' => 9]);
        $this->product(['stock' => 5]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?sort=stock&direction=desc');

        $response->assertOk();
        $stocks = collect($response->json('data'))->pluck('stock')->all();
        $this->assertSame(collect($stocks)->sort()->reverse()->values()->all(), $stocks);
    }

    public function test_invalid_sort_returns_422(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?sort=description')
            ->assertStatus(422)
            ->assertJsonValidationErrors('sort');
    }

    public function test_invalid_direction_returns_422(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?direction=sideways')
            ->assertStatus(422)
            ->assertJsonValidationErrors('direction');
    }

    public function test_invalid_category_id_returns_422(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?category_id=999999')
            ->assertStatus(422)
            ->assertJsonValidationErrors('category_id');
    }

    public function test_invalid_collection_id_returns_422(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?collection_id=999999')
            ->assertStatus(422)
            ->assertJsonValidationErrors('collection_id');
    }

    public function test_invalid_is_active_returns_422(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?is_active=maybe')
            ->assertStatus(422)
            ->assertJsonValidationErrors('is_active');
    }

    public function test_invalid_in_stock_returns_422(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?in_stock=maybe')
            ->assertStatus(422)
            ->assertJsonValidationErrors('in_stock');
    }

    public function test_negative_price_returns_422(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?min_price=-1')
            ->assertStatus(422)
            ->assertJsonValidationErrors('min_price');
    }

    public function test_min_price_greater_than_max_price_returns_422(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?min_price=200&max_price=100')
            ->assertStatus(422)
            ->assertJsonValidationErrors('max_price');
    }

    public function test_invalid_date_range_returns_422(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?created_from=2026-06-20&created_to=2026-06-10')
            ->assertStatus(422)
            ->assertJsonValidationErrors('created_to');
    }

    public function test_default_pagination_uses_30_per_page(): void
    {
        $admin = $this->admin();
        Product::factory()->count(35)->create();

        $response = $this->actingAs($admin, 'sanctum')->getJson(self::ENDPOINT);

        $response->assertOk();
        $this->assertCount(30, $response->json('data'));
        $this->assertSame(30, $response->json('per_page'));
        $this->assertSame(35, $response->json('total'));
    }

    public function test_per_page_is_respected(): void
    {
        $admin = $this->admin();
        Product::factory()->count(5)->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?per_page=2');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
        $this->assertSame(2, $response->json('per_page'));
    }

    public function test_per_page_upper_bound_is_validated(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?per_page=101')
            ->assertStatus(422)
            ->assertJsonValidationErrors('per_page');
    }

    public function test_per_page_lower_bound_is_validated(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(self::ENDPOINT.'?per_page=0')
            ->assertStatus(422)
            ->assertJsonValidationErrors('per_page');
    }

    public function test_admin_listing_excludes_soft_deleted_products(): void
    {
        $admin = $this->admin();
        $visible = $this->product();
        $deleted = $this->product();
        $deleted->delete();

        $response = $this->actingAs($admin, 'sanctum')->getJson(self::ENDPOINT);

        $response->assertOk();
        $ids = $this->ids($response);
        $this->assertContains($visible->id, $ids);
        $this->assertNotContains($deleted->id, $ids);
    }
}
