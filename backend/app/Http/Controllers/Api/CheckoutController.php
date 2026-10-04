<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Http\Resources\PaymentResource;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Services\Payments\PaymentInitiationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    public function store(CheckoutRequest $request, PaymentInitiationService $paymentService)
    {
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
            $lines = [];

            foreach ($cart->items->sortBy('product_id') as $cartItem) {
                $product = Product::with('translations')
                    ->lockForUpdate()
                    ->findOrFail($cartItem->product_id);

                if (! $product->is_active || $product->stock < $cartItem->quantity) {
                    throw ValidationException::withMessages([
                        'cart' => ['An item is no longer available.'],
                    ]);
                }

                $lineTotal = round((float) $product->price * $cartItem->quantity, 2);
                $subtotal = round($subtotal + $lineTotal, 2);

                $lines[] = [
                    'product_id' => $product->id,
                    'name' => $product->translations->firstWhere('locale', 'en')->name ?? $product->slug,
                    'sku' => $product->sku,
                    'unit_price' => $product->price,
                    'quantity' => $cartItem->quantity,
                    'line_total' => $lineTotal,
                ];

                $product->decrement('stock', $cartItem->quantity);
            }

            $order = Order::create([
                'user_id' => $user->id,
                'number' => 'ORD-'.now()->format('Ymd').'-'.Str::upper(Str::random(8)),
                'status' => 'pending',
                'currency' => 'EGP',
                'subtotal' => $subtotal,
                'discount_total' => 0,
                'shipping_total' => 0,
                'total' => $subtotal,
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

            return [$order->load('items', 'user'), $payment];
        });

        $gateway = $paymentService->initiate($payment);

        return response()->json([
            'order' => new OrderResource($order),
            'payment' => new PaymentResource($payment->fresh()),
            'gateway' => $gateway,
        ], 201);
    }
}
