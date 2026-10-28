<?php

namespace App\Models;

use DateTimeInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class InvoiceIssuance extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_ISSUED = 'issued';

    public const STATUS_FAILED = 'failed';

    public const MAX_ATTEMPTS = 5;

    protected $fillable = [
        'order_id',
        'status',
        'attempts',
        'available_at',
        'last_attempted_at',
        'issued_at',
        'last_error',
    ];

    protected $casts = [
        'attempts' => 'integer',
        'available_at' => 'datetime',
        'last_attempted_at' => 'datetime',
        'issued_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class)->withTrashed();
    }

    public function scopeDue(Builder $query): Builder
    {
        return $query
            ->where('status', self::STATUS_PENDING)
            ->where('attempts', '<', self::MAX_ATTEMPTS)
            ->where(function (Builder $query) {
                $query->whereNull('available_at')
                    ->orWhere('available_at', '<=', now());
            });
    }

    public function markIssued(?DateTimeInterface $issuedAt = null): void
    {
        $this->forceFill([
            'status' => self::STATUS_ISSUED,
            'issued_at' => $issuedAt ?? now(),
            'last_attempted_at' => now(),
            'available_at' => null,
            'last_error' => null,
        ])->save();
    }

    public function recordFailure(Throwable $exception): void
    {
        DB::transaction(function () use ($exception) {
            $issuance = static::query()->lockForUpdate()->find($this->getKey());

            if (! $issuance || $issuance->status === self::STATUS_ISSUED) {
                return;
            }

            $attempts = $issuance->attempts + 1;

            $issuance->forceFill([
                'status' => $attempts >= self::MAX_ATTEMPTS
                    ? self::STATUS_FAILED
                    : self::STATUS_PENDING,
                'attempts' => $attempts,
                'last_attempted_at' => now(),
                'available_at' => now()->addSeconds(self::retryDelaySeconds($attempts)),
                'last_error' => Str::limit($exception->getMessage(), 2000),
            ])->save();
        });
    }

    public static function retryDelaySeconds(int $attempt): int
    {
        $delays = [60, 300, 900, 1800, 3600];

        return $delays[min(max($attempt - 1, 0), count($delays) - 1)];
    }
}
