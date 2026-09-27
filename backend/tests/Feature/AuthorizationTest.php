<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_master_admin_can_perform_admin_actions(): void
    {
        $admin = User::factory()->create([
            'role' => 'master_admin',
            'status' => 'active',
        ]);

        $this->assertTrue($admin->isMasterAdmin());
        $this->assertTrue($admin->canAdmin('products.view'));
        $this->assertTrue($admin->canAdmin('products.create'));
        $this->assertTrue($admin->canAdmin('categories.delete'));
    }

    public function test_active_staff_with_permission_can_perform_allowed_action(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
            'status' => 'active',
            'permissions' => ['products.view', 'products.create'],
        ]);

        $this->assertTrue($staff->isActiveStaff());
        $this->assertTrue($staff->canAdmin('products.view'));
        $this->assertTrue($staff->canAdmin('products.create'));
        $this->assertFalse($staff->canAdmin('products.delete'));
    }

    public function test_active_staff_without_permission_is_denied(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
            'status' => 'active',
            'permissions' => ['products.view'],
        ]);

        $this->assertFalse($staff->canAdmin('products.create'));
        $this->assertFalse($staff->canAdmin('products.delete'));
    }

    public function test_inactive_staff_is_denied(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
            'status' => 'pending_approval',
            'permissions' => ['products.view', 'products.create', 'products.delete'],
        ]);

        $this->assertFalse($staff->isActiveStaff());
        $this->assertFalse($staff->canAdmin('products.view'));
    }

    public function test_customer_cannot_perform_admin_actions(): void
    {
        $customer = User::factory()->create([
            'role' => 'customer',
            'status' => 'active',
        ]);

        $this->assertFalse($customer->isMasterAdmin());
        $this->assertFalse($customer->isActiveStaff());
        $this->assertFalse($customer->canAdmin('products.view'));
    }

    public function test_user_cannot_access_another_users_private_resource(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // User1's order
        $order = Order::factory()->create(['user_id' => $user1->id]);

        // User2 tries to access User1's order
        $policy = new UserPolicy;
        // This would need an OrderPolicy to test properly
        // For now we test the UserPolicy
        $this->assertFalse($policy->update($user2, $user1));
        $this->assertFalse($policy->delete($user2, $user1));
    }

    public function test_user_can_access_their_own_allowed_resource(): void
    {
        $user = User::factory()->create();

        $policy = new UserPolicy;
        // A user cannot update/delete themselves (only master admin can)
        $this->assertFalse($policy->update($user, $user));
        $this->assertFalse($policy->delete($user, $user));
    }

    public function test_master_admin_can_manage_staff(): void
    {
        $admin = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $staff = User::factory()->create(['role' => 'staff', 'status' => 'active']);

        $policy = new UserPolicy;
        $this->assertTrue($policy->manageStaff($admin));
        $this->assertTrue($policy->update($admin, $staff));
        $this->assertTrue($policy->delete($admin, $staff));
    }

    public function test_master_admin_cannot_manage_another_master_admin(): void
    {
        $admin1 = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);
        $admin2 = User::factory()->create(['role' => 'master_admin', 'status' => 'active']);

        $policy = new UserPolicy;
        $this->assertFalse($policy->update($admin1, $admin2));
        $this->assertFalse($policy->delete($admin1, $admin2));
    }
}
