<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    public $timestamps = false;
    protected $fillable = ['product_id','name','sku','unit_price','quantity','line_total'];
}
