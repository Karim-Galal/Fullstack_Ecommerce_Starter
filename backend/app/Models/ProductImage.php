<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductImage extends Model
{
    protected $fillable = ['path','alt','sort_order','is_primary'];
    protected $casts = ['is_primary' => 'boolean'];
}
