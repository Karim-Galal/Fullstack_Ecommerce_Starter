<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Cart,Product};
use App\Services\StoreContext;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CartController extends Controller
{
    private function cart(Request $r, StoreContext $stores): Cart
    {
        $store = $stores->resolve($r);
        $where = $r->user() ? ['user_id' => $r->user()->id] : ['guest_token' => $r->header('X-Guest-Cart') ?: Str::uuid()];
        return Cart::firstOrCreate($where + ['store_id' => $store->id]);
    }public function show(Request $r, StoreContext $stores)
    {
        $cart = $this->cart($r, $stores);
        return response()->json(['cart' => $cart->load('items')])->header('X-Guest-Cart', $cart->guest_token ?? '');
    }public function add(Request $r, StoreContext $stores)
    {
        $d = $r->validate(['product_id' => 'required|integer','quantity' => 'required|integer|min:1']);
        $cart = $this->cart($r, $stores);
        $p = Product::where(['id' => $d['product_id'],'store_id' => $cart->store_id,'is_active' => true])->firstOrFail();
        abort_if($d['quantity'] > $p->stock, 422, 'Insufficient stock.');
        $item = $cart->items()->firstOrNew(['product_id' => $p->id]);
        $item->quantity = ($item->quantity ?? 0) + $d['quantity'];
        abort_if($item->quantity > $p->stock, 422, 'Insufficient stock.');
        $item->save();
        return $this->show($r, $stores);
    }public function update(Request $r, int $item, StoreContext $stores)
    {
        $cart = $this->cart($r, $stores);
        $line = $cart->items()->with('product')->findOrFail($item);
        $d = $r->validate(['quantity' => 'required|integer|min:1']);
        abort_if($d['quantity'] > $line->product->stock, 422, 'Insufficient stock.');
        $line->update($d);
        return $this->show($r, $stores);
    }public function destroy(Request $r, int $item, StoreContext $stores)
    {
        $this->cart($r, $stores)->items()->findOrFail($item)->delete();
        return response()->noContent();
    }
}
