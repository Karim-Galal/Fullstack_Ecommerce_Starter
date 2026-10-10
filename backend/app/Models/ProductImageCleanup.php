<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductImageCleanup extends Model
{
    protected $fillable = [
        'disk',
        'paths',
        'delete_after',
        'attempts',
        'last_error',
    ];

    protected function casts(): array
    {
        return [
            'paths' => 'array',
            'delete_after' => 'datetime',
        ];
    }
}
