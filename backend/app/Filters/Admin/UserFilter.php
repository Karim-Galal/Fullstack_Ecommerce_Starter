<?php

namespace App\Filters\Admin;

use Illuminate\Database\Eloquent\Builder;

class UserFilter
{
    private const SORTABLE = ['name', 'email', 'role', 'status', 'created_at'];

    public function apply(Builder $query, array $filters): Builder
    {
        return $query
            ->when(
                filled($filters['search'] ?? null),
                fn (Builder $query) => $this->applySearch($query, $filters['search'])
            )
            ->when(
                filled($filters['role'] ?? null),
                fn (Builder $query) => $query->where('role', $filters['role'])
            )
            ->when(
                filled($filters['status'] ?? null),
                fn (Builder $query) => $query->where('status', $filters['status'])
            )
            ->when(
                array_key_exists('email_verified', $filters),
                fn (Builder $query) => $this->applyEmailVerified($query, $filters['email_verified'])
            )
            ->when(
                filled($filters['created_from'] ?? null),
                fn (Builder $query) => $query->whereDate('created_at', '>=', $filters['created_from'])
            )
            ->when(
                filled($filters['created_to'] ?? null),
                fn (Builder $query) => $query->whereDate('created_at', '<=', $filters['created_to'])
            )
            ->orderBy(
                $this->sortColumn($filters['sort'] ?? null),
                $this->sortDirection($filters['direction'] ?? null)
            );
    }

    private function applySearch(Builder $query, string $search): Builder
    {
        return $query->where(function (Builder $query) use ($search) {
            $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%");
        });
    }

    private function applyEmailVerified(Builder $query, string $value): Builder
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN)
            ? $query->whereNotNull('email_verified_at')
            : $query->whereNull('email_verified_at');
    }

    private function sortColumn(?string $sort): string
    {
        return in_array($sort, self::SORTABLE, true) ? $sort : 'created_at';
    }

    private function sortDirection(?string $direction): string
    {
        return $direction === 'asc' ? 'asc' : 'desc';
    }
}
