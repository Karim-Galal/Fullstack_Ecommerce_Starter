<?php
namespace App\Policies;
use App\Models\{Product,User};
class ProductPolicy { public function viewAny(User $user): bool{return $user->canAdmin('products.view');} public function create(User $user): bool{return $user->canAdmin('products.create');} public function update(User $user,Product $product): bool{return $user->store_id===$product->store_id && $user->canAdmin('products.update');} public function delete(User $user,Product $product): bool{return $user->store_id===$product->store_id && $user->canAdmin('products.delete');} }
