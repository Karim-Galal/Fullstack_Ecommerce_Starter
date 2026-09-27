<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CartController extends Controller
{
    private function cart(Request $r): Cart
    {
        $where = $r->user() ? ['user_id' => $r->user()->id] : ['guest_token' => $r->header('X-Guest-Cart') ?: Str::uuid()];

        return Cart::firstOrCreate($where);
    }

    public function show(Request $r)
    {
        $cart = $this->cart($r);

        return response()->json(['cart' => $cart->load('items')])->header('X-Guest-Cart', $cart->guest_token ?? '');
    }

    public function add(Request $r)
    {
        $d = $r->validate(['product_id' => 'required|integer', 'quantity' => 'required|integer|min:1']);
        $cart = $this->cart($r);
        $p = Product::where(['id' => $d['product_id'], 'is_active' => true])->firstOrFail();
        abort_if($d['quantity'] > $p->stock, 422, 'Insufficient stock.');
        $item = $cart->items()->firstOrNew(['product_id' => $p->id]);
        $item->quantity = ($item->quantity ?? 0) + $d['quantity'];
        abort_if($item->quantity > $p->stock, 422, 'Insufficient stock.');
        $item->save();

        return $this->show($r);
    }

    public function update(Request $r, int $item)
    {
        $cart = $this->cart($r);
        $line = $cart->items()->with('product')->findOrFail($item);
        $d = $r->validate(['quantity' => 'required|integer|min:1']);
        abort_if($d['quantity'] > $line->product->stock, 422, 'Insufficient stock.');
        $line->update($d);

        return $this->show($r);
    }

    public function destroy(Request $r, int $item)
    {
        $this->cart($r)->items()->findOrFail($item)->delete();

        return response()->noContent();
    }
}
