<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = ['store_id','user_id','shipping_method_id','number','status','currency','subtotal','discount_total','shipping_total','total','shipping_address'];
    protected $casts = ['shipping_address' => 'array'];
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    } public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
