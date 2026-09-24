<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Store extends Model
{
    protected $fillable = ['name','slug','currency'];
    public function users()
    {
        return $this->hasMany(User::class);
    }
}
