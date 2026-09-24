<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    protected $fillable = ['store_id','user_id','guest_token'];
    public function items()
    {
        return $this->hasMany(CartItem::class)->with('product.translations', 'product.images');
    }
}
