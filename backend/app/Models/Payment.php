<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['order_id', 'amount', 'currency', 'gateway', 'payment_method', 'status', 'transaction_reference', 'gateway_reference', 'paid_at', 'gateway_metadata'];

    protected $casts = ['amount' => 'decimal:2', 'gateway_metadata' => 'array', 'paid_at' => 'datetime'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class)->withTrashed();
    }
}
