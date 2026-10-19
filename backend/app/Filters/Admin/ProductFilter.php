<?php

namespace App\Filters\Admin;

use Illuminate\Database\Eloquent\Builder;

class ProductFilter
{
    private const SORTABLE = ['price', 'stock', 'created_at', 'is_active', 'sku'];

    public function apply(Builder $query, array $filters): Builder
    {
        return $query
            ->when(
                filled($filters['search'] ?? null),
                fn (Builder $query) => $this->applySearch($query, $filters['search'])
            )
            ->when(
                filled($filters['category_id'] ?? null),
                fn (Builder $query) => $query->where('category_id', $filters['category_id'])
            )
            ->when(
                filled($filters['collection_id'] ?? null),
                fn (Builder $query) => $query->whereHas(
                    'collections',
                    fn (Builder $query) => $query->where('collections.id', $filters['collection_id'])
                )
            )
            ->when(
                array_key_exists('is_active', $filters),
                fn (Builder $query) => $query->where('is_active', $this->toBoolean($filters['is_active']))
            )
            ->when(
                filled($filters['min_price'] ?? null),
                fn (Builder $query) => $query->where('price', '>=', $filters['min_price'])
            )
            ->when(
                filled($filters['max_price'] ?? null),
                fn (Builder $query) => $query->where('price', '<=', $filters['max_price'])
            )
            ->when(
                array_key_exists('in_stock', $filters),
                fn (Builder $query) => $this->toBoolean($filters['in_stock'])
                    ? $query->where('stock', '>', 0)
                    : $query->where('stock', '=', 0)
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
                ->where('sku', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%")
                ->orWhereHas('translations', function (Builder $query) use ($search) {
                    $query->where('name', 'like', "%{$search}%");
                });
        });
    }

    private function toBoolean(string $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
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
