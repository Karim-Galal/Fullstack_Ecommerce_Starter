<?php

namespace App\Services;

use App\Exceptions\CartMergeException;
use App\Models\Cart;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CartMergeService
{
    public function merge(User $user, ?string $guestToken): void
    {
        if (! $guestToken) {
            return;
        }

        DB::transaction(function () use ($user, $guestToken) {
            $guestCart = Cart::where('guest_token', $guestToken)
                ->lockForUpdate()
                ->first();

            if (! $guestCart) {
                return;
            }

            $guestCart->load('items.product');

            if ($guestCart->items->isEmpty()) {
                $guestCart->delete();

                return;
            }

            $userCart = Cart::where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            /*
             * User has no existing cart.
             * Convert the guest cart into the user's cart.
             */
            if (! $userCart) {
                $this->validateGuestItems($guestCart);

                $guestCart->update([
                    'user_id' => $user->id,
                    'guest_token' => null,
                ]);

                return;
            }

            /*
             * User already has a cart.
             * Merge guest items into it.
             */
            $userCart->load('items.product');

            foreach ($guestCart->items as $guestItem) {
                $product = $guestItem->product;

                if (! $product || ! $product->is_active) {
                    throw new CartMergeException(
                        'A product in your guest cart is no longer available.'
                    );
                }

                $userItem = $userCart->items
                    ->firstWhere('product_id', $guestItem->product_id);

                $newQuantity = $guestItem->quantity;

                if ($userItem) {
                    $newQuantity += $userItem->quantity;
                }

                if ($newQuantity > $product->stock) {
                    throw new CartMergeException(
                        "Insufficient stock for {$product->slug}. Only {$product->stock} available."
                    );
                }

                if ($userItem) {
                    $userItem->update([
                        'quantity' => $newQuantity,
                    ]);
                } else {
                    $userCart->items()->create([
                        'product_id' => $guestItem->product_id,
                        'quantity' => $guestItem->quantity,
                    ]);
                }
            }

            /*
             * Merge completed successfully.
             * The old guest cart is no longer needed.
             */
            $guestCart->delete();
        });
    }

    private function validateGuestItems(Cart $guestCart): void
    {
        foreach ($guestCart->items as $guestItem) {
            $product = $guestItem->product;

            if (! $product || ! $product->is_active) {
                throw new CartMergeException(
                    'A product in your guest cart is no longer available.'
                );
            }

            if ($guestItem->quantity > $product->stock) {
                throw new CartMergeException(
                    "Insufficient stock for {$product->slug}. Only {$product->stock} available."
                );
            }
        }
    }
}
