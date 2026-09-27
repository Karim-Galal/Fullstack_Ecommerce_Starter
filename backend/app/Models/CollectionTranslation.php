<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CollectionTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'collection_id',
        'locale',
        'name',
        'description',
        'meta_title',
        'meta_description',
    ];

    public function collection(): BelongsTo
    {
        return $this->belongsTo(Collection::class);
    }
}
