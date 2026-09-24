<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invitation extends Model
{
    protected $fillable = ['store_id','invited_email','token_hash','type','created_by','status','expires_at','accepted_at','approved_by','approved_at','rejected_at','revoked_at'];
    protected $hidden = ['token_hash'];
    protected $casts = [
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'revoked_at' => 'datetime'
    ];
    public function valid(): bool
    {
        return $this->status === 'pending' && !$this->revoked_at && $this->expires_at->isFuture();
    }
}
