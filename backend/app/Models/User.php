<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'store_id', 'role', 'status', 'permissions', 'google_id', 'approved_at', 'approved_by',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'permissions' => 'array', 'approved_at' => 'datetime',
        ];
    }

    public function isMasterAdmin(): bool { return $this->role === 'master_admin' && $this->status === 'active'; }
    public function isActiveStaff(): bool { return $this->role === 'staff' && $this->status === 'active'; }
    public function canAdmin(string $permission): bool { return $this->isMasterAdmin() || ($this->isActiveStaff() && in_array($permission, $this->permissions ?? [], true)); }
}
