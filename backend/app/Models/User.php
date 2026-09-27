<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role', 'status', 'permissions', 'google_id', 'approved_at', 'approved_by', 'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'permissions' => 'array', 'approved_at' => 'datetime',
        ];
    }

    public function isMasterAdmin(): bool
    {
        return $this->role === 'master_admin' && $this->status === 'active';
    }

    public function isActiveStaff(): bool
    {
        return $this->role === 'staff' && $this->status === 'active';
    }

    public function canAdmin(string $permission): bool
    {
        return $this->isMasterAdmin() || ($this->isActiveStaff() && in_array($permission, $this->permissions ?? [], true));
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    public function addresses()
    {
        return $this->hasMany(Address::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function pushSubscriptions()
    {
        return $this->hasMany(PushSubscription::class);
    }

    public function invitationsCreated()
    {
        return $this->hasMany(Invitation::class, 'created_by');
    }

    public function invitationsApproved()
    {
        return $this->hasMany(Invitation::class, 'approved_by');
    }

    public function cart()
    {
        return $this->hasOne(Cart::class);
    }

    public function wishlist()
    {
        return $this->belongsToMany(Product::class, 'wishlists');
    }
}
