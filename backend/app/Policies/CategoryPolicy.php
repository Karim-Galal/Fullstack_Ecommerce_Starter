<?php
namespace App\Policies;
use App\Models\{Category,User};
class CategoryPolicy { public function viewAny(User $user): bool{return $user->canAdmin('categories.view');} public function create(User $user): bool{return $user->canAdmin('categories.create');} public function update(User $user,Category $category): bool{return $user->store_id===$category->store_id && $user->canAdmin('categories.update');} public function delete(User $user,Category $category): bool{return $user->store_id===$category->store_id && $user->canAdmin('categories.delete');} }
