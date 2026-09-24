<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['store_id','parent_id','slug','is_active','sort_order'];
    protected $casts = ['is_active' => 'boolean'];
    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    } public function children()
    {
        return $this->hasMany(self::class, 'parent_id');
    } public function translations()
    {
        return $this->hasMany(CategoryTranslation::class);
    }
}
