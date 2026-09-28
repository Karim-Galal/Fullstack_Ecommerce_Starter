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

        $cart->load('items');

        return $this->cartResponse($cart);
    }

    public function add(StoreCartItemRequest $request)
    {
        $cart = DB::transaction(function () use ($request) {
            $cart = $this->findCart($request);

            if (! $cart) {
                $cart = $this->createCart($request);
            }

            $product = Product::findOrFail(
                $request->validated('product_id')
            );

            $quantity = $request->validated('quantity');

            $item = $cart->items()
                ->where('product_id', $product->id)
                ->first();

            $newQuantity = ($item?->quantity ?? 0) + $quantity;

            abort_if(
                $newQuantity > $product->stock,
                422,
                'Insufficient stock.'
            );

            if ($item) {
                $item->update([
                    'quantity' => $newQuantity,
                ]);
            } else {
                $cart->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                ]);
            }

            return $cart;
        });

        $cart->load('items');

        return $this->cartResponse($cart);
    }

    public function update(
        UpdateCartItemRequest $request,
        int $item
    ) {
        $cart = $this->findCart($request);

        abort_unless($cart, 404, 'Cart not found.');

        $cartItem = $cart->items()
            ->with('product')
            ->findOrFail($item);

        $quantity = $request->validated('quantity');

        abort_if(
            $quantity > $cartItem->product->stock,
            422,
            'Insufficient stock.'
        );

        $cartItem->update([
            'quantity' => $quantity,
        ]);

        $cart->load('items');

        return $this->cartResponse($cart);
    }

    public function destroy(Request $request, int $item)
    {
        $cart = $this->findCart($request);

        abort_unless($cart, 404, 'Cart not found.');

        $cart->items()
            ->findOrFail($item)
            ->delete();

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
