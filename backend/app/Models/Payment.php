<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = ['order_id','amount','currency','gateway','payment_method','status','transaction_reference','gateway_reference','paid_at','gateway_metadata'];
    protected $casts = ['amount' => 'decimal:2','gateway_metadata' => 'array','paid_at' => 'datetime'];
    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
