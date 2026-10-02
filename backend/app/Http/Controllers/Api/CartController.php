<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCartItemRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CartController extends Controller
{
    public function show(Request $request)
    {
        $cart = $this->findCart($request);

        if (! $cart) {
            return response()->json([
                'cart' => null,
            ]);
        }

        $cart->load('items.product');

        return $this->cartResponse($cart);
    }

    public function add(StoreCartItemRequest $request)
    {
        $cart = $this->findCart($request);

        if (! $cart) {
            $cart = $this->createCart($request);
        }

        $product = Product::where('id', $request->validated('product_id'))
            ->where('is_active', true)
            ->first();

        if (! $product) {
            return response()->json([
                'message' => 'Product not found or is no longer available.',
            ], 404);
        }

        $quantity = $request->validated('quantity');

        $item = $cart->items()
            ->where('product_id', $product->id)
            ->first();

        $currentQuantity = $item?->quantity ?? 0;
        $newQuantity = $currentQuantity + $quantity;

        if ($newQuantity > $product->stock) {
            return response()->json([
                'message' => "Insufficient stock. Only {$product->stock} available.",
            ], 422);
        }

        DB::transaction(function () use (
            $cart,
            $item,
            $product,
            $newQuantity,
            $quantity
        ) {
            if ($item) {
                $item->update([
                    'quantity' => $newQuantity,
                ]);

                return;
            }

            $cart->items()->create([
                'product_id' => $product->id,
                'quantity' => $quantity,
            ]);
        });

        $cart->load('items.product');

        return $this->cartResponse($cart);
    }

    public function update(
        UpdateCartItemRequest $request,
        int $item
    ) {
        $cart = $this->findCart($request);

        if (! $cart) {
            return response()->json([
                'message' => 'Cart not found.',
            ], 404);
        }

        $cartItem = $cart->items()
            ->with('product')
            ->find($item);

        if (! $cartItem) {
            return response()->json([
                'message' => 'Cart item not found.',
            ], 404);
        }

        $product = $cartItem->product;

        if (! $product) {
            return response()->json([
                'message' => 'Product not found.',
            ], 404);
        }

        if (! $product->is_active) {
            return response()->json([
                'message' => 'Product is no longer available.',
            ], 422);
        }

        $quantity = $request->validated('quantity');

        if ($quantity > $product->stock) {
            return response()->json([
                'message' => "Insufficient stock. Only {$product->stock} available.",
            ], 422);
        }

        $cartItem->update([
            'quantity' => $quantity,
        ]);

        $cart->load('items.product');

        return $this->cartResponse($cart);
    }

    public function destroy(Request $request, int $item)
    {
        $cart = $this->findCart($request);

        if (! $cart) {
            return response()->json([
                'message' => 'Cart not found.',
            ], 404);
        }

        $cartItem = $cart->items()->find($item);

        if (! $cartItem) {
            return response()->json([
                'message' => 'Cart item not found.',
            ], 404);
        }

        $cartItem->delete();

        return response()->noContent();
    }

    private function findCart(Request $request): ?Cart
    {
        if ($request->user()) {
            return Cart::where(
                'user_id',
                $request->user()->id
            )->first();
        }

        $guestToken = $request->header('X-Guest-Cart');

        if (! $guestToken) {
            return null;
        }

        return Cart::where(
            'guest_token',
            $guestToken
        )->first();
    }

    private function createCart(Request $request): Cart
    {
        if ($request->user()) {
            return Cart::create([
                'user_id' => $request->user()->id,
            ]);
        }

        return Cart::create([
            'guest_token' => (string) Str::uuid(),
        ]);
    }

    private function cartResponse(Cart $cart)
    {
        $response = response()->json([
            'cart' => new CartResource($cart),
        ]);

        if ($cart->guest_token) {
            $response->header(
                'X-Guest-Cart',
                $cart->guest_token
            );
        }

        return $response;
    }
}
