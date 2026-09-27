<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Policies\CategoryPolicy;
use App\Policies\ProductPolicy;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_policy_view_any(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $staff = User::factory()->create(['role' => 'staff', 'status' => 'active', 'permissions' => ['products.view']]);
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);

        $policy = new ProductPolicy;

        $this->assertTrue($policy->viewAny($admin));
        $this->assertTrue($policy->viewAny($staff));
        $this->assertFalse($policy->viewAny($customer));
    }

    public function test_product_policy_create(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $staffWithPerm = User::factory()->create(['role' => 'staff', 'status' => 'active', 'permissions' => ['products.create']]);
        $staffWithoutPerm = User::factory()->create(['role' => 'staff', 'status' => 'active', 'permissions' => ['products.view']]);
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);

        $policy = new ProductPolicy;

        $this->assertTrue($policy->create($admin));
        $this->assertTrue($policy->create($staffWithPerm));
        $this->assertFalse($policy->create($staffWithoutPerm));
        $this->assertFalse($policy->create($customer));
    }

    public function test_product_policy_update(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $staffWithPerm = User::factory()->create(['role' => 'staff', 'status' => 'active', 'permissions' => ['products.update']]);
        $staffWithoutPerm = User::factory()->create(['role' => 'staff', 'status' => 'active', 'permissions' => ['products.view']]);
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);
        $product = Product::factory()->create();

        $policy = new ProductPolicy;

        $this->assertTrue($policy->update($admin, $product));
        $this->assertTrue($policy->update($staffWithPerm, $product));
        $this->assertFalse($policy->update($staffWithoutPerm, $product));
        $this->assertFalse($policy->update($customer, $product));
    }

    public function test_product_policy_delete(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $staffWithPerm = User::factory()->create(['role' => 'staff', 'status' => 'active', 'permissions' => ['products.delete']]);
        $staffWithoutPerm = User::factory()->create(['role' => 'staff', 'status' => 'active', 'permissions' => ['products.view']]);
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);
        $product = Product::factory()->create();

        $policy = new ProductPolicy;

        $this->assertTrue($policy->delete($admin, $product));
        $this->assertTrue($policy->delete($staffWithPerm, $product));
        $this->assertFalse($policy->delete($staffWithoutPerm, $product));
        $this->assertFalse($policy->delete($customer, $product));
    }

    public function test_category_policy_view_any(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $staff = User::factory()->create(['role' => 'staff', 'status' => 'active', 'permissions' => ['categories.view']]);
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);

        $policy = new CategoryPolicy;

        $this->assertTrue($policy->viewAny($admin));
        $this->assertTrue($policy->viewAny($staff));
        $this->assertFalse($policy->viewAny($customer));
    }

    public function test_category_policy_create(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $staffWithPerm = User::factory()->create(['role' => 'staff', 'status' => 'active', 'permissions' => ['categories.create']]);
        $staffWithoutPerm = User::factory()->create(['role' => 'staff', 'status' => 'active', 'permissions' => ['categories.view']]);
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);

        $policy = new CategoryPolicy;

        $this->assertTrue($policy->create($admin));
        $this->assertTrue($policy->create($staffWithPerm));
        $this->assertFalse($policy->create($staffWithoutPerm));
        $this->assertFalse($policy->create($customer));
    }

    public function test_category_policy_update(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $staffWithPerm = User::factory()->create(['role' => 'staff', 'status' => 'active', 'permissions' => ['categories.update']]);
        $staffWithoutPerm = User::factory()->create(['role' => 'staff', 'status' => 'active', 'permissions' => ['categories.view']]);
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);
        $category = Category::factory()->create();

        $policy = new CategoryPolicy;

        $this->assertTrue($policy->update($admin, $category));
        $this->assertTrue($policy->update($staffWithPerm, $category));
        $this->assertFalse($policy->update($staffWithoutPerm, $category));
        $this->assertFalse($policy->update($customer, $category));
    }

    public function test_category_policy_delete(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $staffWithPerm = User::factory()->create(['role' => 'staff', 'status' => 'active', 'permissions' => ['categories.delete']]);
        $staffWithoutPerm = User::factory()->create(['role' => 'staff', 'status' => 'active', 'permissions' => ['categories.view']]);
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);
        $category = Category::factory()->create();

        $policy = new CategoryPolicy;

        $this->assertTrue($policy->delete($admin, $category));
        $this->assertTrue($policy->delete($staffWithPerm, $category));
        $this->assertFalse($policy->delete($staffWithoutPerm, $category));
        $this->assertFalse($policy->delete($customer, $category));
    }

    public function test_user_policy_manage_staff(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $staff = User::factory()->create(['role' => 'staff', 'status' => 'active']);
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);

        $policy = new UserPolicy;

        $this->assertTrue($policy->manageStaff($admin));
        $this->assertFalse($policy->manageStaff($staff));
        $this->assertFalse($policy->manageStaff($customer));
    }

    public function test_user_policy_update(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $staff = User::factory()->create(['role' => 'staff', 'status' => 'active']);
        $admin2 = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);

        $policy = new UserPolicy;

        $this->assertTrue($policy->update($admin, $staff));
        $this->assertFalse($policy->update($admin, $admin2));
        $this->assertFalse($policy->update($staff, $admin));
    }

    public function test_user_policy_delete(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $staff = User::factory()->create(['role' => 'staff', 'status' => 'active']);
        $admin2 = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);

        $policy = new UserPolicy;

        $this->assertTrue($policy->delete($admin, $staff));
        $this->assertFalse($policy->delete($admin, $admin2));
        $this->assertFalse($policy->delete($staff, $admin));
    }
}
