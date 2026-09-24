<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Cart,Order,Payment,Product};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckoutController extends Controller
{
    public function store(Request $r)
    {
        $user = $r->user();
        abort_unless($user->store_id, 403, 'Store access is unavailable.');
        $d = $r->validate(['shipping_address' => 'required|array','shipping_address.name' => 'required','shipping_address.phone' => 'required','shipping_address.line1' => 'required','shipping_address.city' => 'required','shipping_address.country' => 'required|size:2','gateway' => 'required|in:stripe,paymob','payment_method' => 'nullable|string']);
        $cart = Cart::where(['user_id' => $user->id,'store_id' => $user->store_id])->with('items.product.translations')->firstOrFail();
        abort_if($cart->items->isEmpty(), 422, 'Cart is empty.');
        return DB::transaction(function () use ($cart, $user, $d) {
            $subtotal = 0;
            $lines = [];
            foreach ($cart->items as $line) {
                $p = Product::where('store_id', $cart->store_id)->lockForUpdate()->findOrFail($line->product_id);
                abort_if(!$p->is_active || $p->stock < $line->quantity, 422, 'An item is no longer available.');
                $total = $p->price * $line->quantity;
                $subtotal += $total;
                $lines[] = ['product_id' => $p->id,'name' => $p->translations->firstWhere('locale', 'en')->name ?? $p->slug,'sku' => $p->sku,'unit_price' => $p->price,'quantity' => $line->quantity,'line_total' => $total];
                $p->decrement('stock', $line->quantity);
            }$order = Order::create(['store_id' => $cart->store_id,'user_id' => $user->id,'number' => 'ORD-'.now()->format('Ymd').'-'.Str::upper(Str::random(8)),'status' => 'pending','currency' => 'EGP','subtotal' => $subtotal,'discount_total' => 0,'shipping_total' => 0,'total' => $subtotal,'shipping_address' => $d['shipping_address']]);
            $order->items()->createMany($lines);
            $payment = Payment::create(['order_id' => $order->id,'amount' => $order->total,'currency' => $order->currency,'gateway' => $d['gateway'],'payment_method' => $d['payment_method'] ?? null,'status' => 'pending','transaction_reference' => Str::uuid()]);
            $cart->items()->delete();
            return response()->json(['order' => $order->load('items'),'payment' => $payment], 201);
        });
    }
}
