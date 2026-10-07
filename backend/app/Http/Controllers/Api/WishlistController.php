<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWishlistRequest;
use App\Http\Resources\WishlistResource;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class WishlistController extends Controller
{
    public function index(Request $request)
    {
        $wishlists = Wishlist::query()
            ->where('user_id', $request->user()->id)
            ->with('product')
            ->latest()
            ->paginate(20);

        return WishlistResource::collection($wishlists);
    }

    public function store(StoreWishlistRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        $product = Product::query()
            ->where('id', $data['product_id'])
            ->where('is_active', true)
            ->first();

        if (! $product) {
            throw ValidationException::withMessages([
                'product_id' => [
                    'The selected product is not available.',
                ],
            ]);
        }

        $existing = Wishlist::query()
            ->where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->exists();

        if ($existing) {
            throw ValidationException::withMessages([
                'product_id' => [
                    'This product is already in your wishlist.',
                ],
            ]);
        }

        $wishlist = Wishlist::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
        ]);

        return (new WishlistResource(
            $wishlist->load('product')
        ))
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(Request $request, Product $product)
    {
        $wishlist = Wishlist::query()
            ->where('user_id', $request->user()->id)
            ->where('product_id', $product->id)
            ->first();

        if (! $wishlist) {
            throw ValidationException::withMessages([
                'product_id' => [
                    'This product is not in your wishlist.',
                ],
            ]);
        }

        $this->authorize('delete', $wishlist);

        $wishlist->delete();

        return response()->noContent();
    }

    public function adminIndex()
    {
        $this->authorize('viewAny', Wishlist::class);

        return WishlistResource::collection(
            Wishlist::query()
                ->with('user', 'product')
                ->latest()
                ->paginate(30)
        );
    }

    public function show(Wishlist $wishlist)
    {
        $this->authorize('view', $wishlist);

        return new WishlistResource(
            $wishlist->load('user', 'product')
        );
    }
}
