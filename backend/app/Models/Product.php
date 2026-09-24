<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = ['store_id','category_id','slug','sku','price','stock','is_active'];
    protected $casts = ['price' => 'decimal:2','is_active' => 'boolean'];
    public function category()
    {
        return $this->belongsTo(Category::class);
    } public function translations()
    {
        return $this->hasMany(ProductTranslation::class);
    } public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }
}
