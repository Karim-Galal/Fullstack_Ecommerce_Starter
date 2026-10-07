<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Http\Resources\PaymentResource;
use App\Models\Cart;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ShippingMethod;
use App\Services\Payments\PaymentInitiationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    public function store(
        CheckoutRequest $request,
        PaymentInitiationService $paymentService
    ) {
        $user = $request->user();
        $data = $request->validated();

        [$order, $payment] = DB::transaction(function () use ($user, $data) {
            $cart = Cart::where('user_id', $user->id)
                ->lockForUpdate()
                ->with('items')
                ->first();

            if (! $cart || $cart->items->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart' => ['Cart is empty.'],
                ]);
            }

            $subtotal = 0;
            $discountTotal = 0;
            $lines = [];
            $hasValidOffer = false;

            foreach ($cart->items->sortBy('product_id') as $cartItem) {
                $product = Product::with([
                    'translations',
                    'offers',
                ])
                    ->lockForUpdate()
                    ->findOrFail($cartItem->product_id);

                if (! $product->is_active || $product->stock < $cartItem->quantity) {
                    throw ValidationException::withMessages([
                        'cart' => ['An item is no longer available.'],
                    ]);
                }

                $quantity = $cartItem->quantity;
                $unitPrice = (float) $product->price;
                $lineSubtotal = round($unitPrice * $quantity, 2);
                $lineDiscount = 0;

                $validOffer = $product->offers
                    ->first(function ($offer) {
                        $now = now();

                        return $offer->is_active
                            && (! $offer->starts_at || $offer->starts_at <= $now)
                            && (! $offer->ends_at || $offer->ends_at >= $now);
                    });

                if ($validOffer) {
                    $hasValidOffer = true;

                    $lineDiscount = match ($validOffer->type) {
                        'percentage' => round(
                            $lineSubtotal * ((float) $validOffer->value / 100),
                            2
                        ),

                        'fixed' => min(
                            (float) $validOffer->value,
                            $lineSubtotal
                        ),

                        'buy_x_get_y' => $this->calculateBuyXGetYDiscount(
                            $unitPrice,
                            $quantity,
                            (int) $validOffer->buy_quantity,
                            (int) $validOffer->get_quantity
                        ),

                        default => 0,
                    };

                    $lineDiscount = min($lineDiscount, $lineSubtotal);
                }

                $lineTotal = round($lineSubtotal - $lineDiscount, 2);

                $subtotal = round($subtotal + $lineSubtotal, 2);
                $discountTotal = round($discountTotal + $lineDiscount, 2);

                $lines[] = [
                    'product_id' => $product->id,
                    'name' => $product->translations
                        ->firstWhere('locale', 'en')
                        ->name ?? $product->slug,
                    'sku' => $product->sku,
                    'unit_price' => $product->price,
                    'quantity' => $quantity,
                    'line_total' => $lineTotal,
                ];

                $product->decrement('stock', $quantity);
            }

            if ($hasValidOffer && ! empty($data['coupon_code'])) {
                throw ValidationException::withMessages([
                    'coupon_code' => [
                        'A coupon cannot be used with an active product offer.',
                    ],
                ]);
            }

            if (! $hasValidOffer && ! empty($data['coupon_code'])) {
                $coupon = Coupon::with('products')
                    ->where('code', $data['coupon_code'])
                    ->lockForUpdate()
                    ->first();

                if (! $coupon) {
                    throw ValidationException::withMessages([
                        'coupon_code' => ['The coupon code is invalid.'],
                    ]);
                }

                $now = now();

                if (! $coupon->is_active) {
                    throw ValidationException::withMessages([
                        'coupon_code' => ['The coupon is inactive.'],
                    ]);
                }

                if ($coupon->starts_at && $coupon->starts_at > $now) {
                    throw ValidationException::withMessages([
                        'coupon_code' => ['The coupon is not active yet.'],
                    ]);
                }

                if ($coupon->expires_at && $coupon->expires_at < $now) {
                    throw ValidationException::withMessages([
                        'coupon_code' => ['The coupon has expired.'],
                    ]);
                }

                if (
                    $coupon->usage_limit !== null
                    && $coupon->used_count >= $coupon->usage_limit
                ) {
                    throw ValidationException::withMessages([
                        'coupon_code' => [
                            'The coupon usage limit has been reached.',
                        ],
                    ]);
                }

                if (
                    $coupon->minimum_order !== null
                    && $subtotal < (float) $coupon->minimum_order
                ) {
                    throw ValidationException::withMessages([
                        'coupon_code' => [
                            'The minimum order amount for this coupon has not been reached.',
                        ],
                    ]);
                }

                $eligibleSubtotal = 0;

                foreach ($cart->items as $cartItem) {
                    if ($coupon->products->contains('id', $cartItem->product_id)) {
                        $product = $lines[array_search(
                            $cartItem->product_id,
                            array_column($lines, 'product_id')
                        )];

                        $eligibleSubtotal = round(
                            $eligibleSubtotal
                                + (
                                    (float) $product['unit_price']
                                    * $cartItem->quantity
                                ),
                            2
                        );
                    }
                }

                if ($eligibleSubtotal <= 0) {
                    throw ValidationException::withMessages([
                        'coupon_code' => [
                            'The coupon does not apply to any product in your cart.',
                        ],
                    ]);
                }

                $couponDiscount = match ($coupon->discount_type) {
                    'percentage' => round(
                        $eligibleSubtotal
                            * ((float) $coupon->discount_amount / 100),
                        2
                    ),

                    'fixed' => min(
                        (float) $coupon->discount_amount,
                        $eligibleSubtotal
                    ),

                    default => 0,
                };

                $discountTotal = round(
                    $discountTotal + $couponDiscount,
                    2
                );
            }

            /*
             * Get the active default shipping method.
             *
             * Checkout does not accept a shipping_method_id from the client.
             * The current active default is automatically applied.
             */
            $shippingMethod = ShippingMethod::query()
                ->where('is_active', true)
                ->where('is_default', true)
                ->lockForUpdate()
                ->first();

            if (! $shippingMethod) {
                throw ValidationException::withMessages([
                    'shipping_method' => [
                        'No default shipping method is available.',
                    ],
                ]);
            }

            $shippingTotal = (float) $shippingMethod->price;

            $total = round(
                max(0, $subtotal - $discountTotal) + $shippingTotal,
                2
            );

            $order = Order::create([
                'user_id' => $user->id,
                'shipping_method_id' => $shippingMethod->id,
                'number' => 'ORD-'
                    . now()->format('Ymd')
                    . '-'
                    . Str::upper(Str::random(8)),
                'status' => 'pending',
                'currency' => 'EGP',
                'subtotal' => $subtotal,
                'discount_total' => $discountTotal,
                'shipping_total' => $shippingTotal,
                'total' => $total,
                'shipping_address' => $data['shipping_address'],
            ]);

            $order->items()->createMany($lines);

            $payment = Payment::create([
                'order_id' => $order->id,
                'amount' => $order->total,
                'currency' => $order->currency,
                'gateway' => $data['gateway'],
                'payment_method' => $data['payment_method'] ?? null,
                'status' => 'pending',
                'transaction_reference' => (string) Str::uuid(),
                'expires_at' => now()->addMinutes(15),
            ]);

            $cart->items()->delete();

            return [
                $order->load([
                    'items',
                    'user',
                    'shippingMethod',
                ]),
                $payment,
            ];
        });

        $gateway = $paymentService->initiate($payment);

        return response()->json([
            'order' => new OrderResource($order),
            'payment' => new PaymentResource($payment->fresh()),
            'gateway' => $gateway,
        ], 201);
    }

    private function calculateBuyXGetYDiscount(
        float $unitPrice,
        int $quantity,
        int $buyQuantity,
        int $getQuantity
    ): float {
        $groupSize = $buyQuantity + $getQuantity;

        if ($groupSize <= 0) {
            return 0;
        }

        $freeQuantity = intdiv($quantity, $groupSize) * $getQuantity;

        return round($freeQuantity * $unitPrice, 2);
    }
}
