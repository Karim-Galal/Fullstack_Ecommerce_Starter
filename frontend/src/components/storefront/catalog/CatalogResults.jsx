'use client';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/data-display/EmptyState';
import { Pagination } from '@/components/ui/navigation/Pagination';
import { ProductCard } from '@/components/storefront/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/skeletons/ProductGridSkeleton';
import { Icon } from '@/components/icons';

export function CatalogResults({
  t,
  tNav,
  status,
  products,
  pagination,
  sortValue,
  sortOptions,
  onSortChange,
  onRetry,
  onClear,
  onAddToCart,
  onAddToWishlist,
  wishlistItems,
  addingIds,
  onPageChange,
}) {
  return (
    <section aria-live="polite" aria-busy={status === 'loading'}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <p className="text-sm text-text-secondary">
          {status === 'ready'
            ? t('results', {
                count: pagination?.total ?? products.length,
              })
            : t('loading')}
        </p>

        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <span>{t('sort')}</span>

          <select
            value={sortValue}
            onChange={(event) => onSortChange(event.target.value)}
            className="max-w-56 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6">
        {status === 'loading' && (
          <div role="status" aria-label={t('loading')}>
            <ProductGridSkeleton count={8} />
            <span className="sr-only">{t('loading')}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-border bg-surface-elevated px-6 py-16 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface-sunken text-text-secondary">
              <Icon name="warning" size="lg" />
            </div>

            <h2 className="mt-5 text-xl font-medium text-text-primary">
              {t('errorTitle')}
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">
              {t('errorText')}
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-6 rounded-full px-6"
              onClick={onRetry}
            >
              {t('retry')}
            </Button>
          </div>
        )}

        {status === 'ready' && products.length === 0 && (
          <EmptyState
            icon="search"
            title={t('emptyTitle')}
            description={t('emptyText')}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full px-6"
                onClick={onClear}
              >
                {t('clearFilters')}
              </Button>
            }
          />
        )}

        {status === 'ready' && products.length > 0 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onAddToWishlist={onAddToWishlist}
                  isInWishlist={wishlistItems.some(
                    (item) => item.product_id === product.id,
                  )}
                  isAdding={addingIds.includes(product.id)}
                />
              ))}
            </div>

            <Pagination
              className="mt-10 flex justify-center"
              currentPage={pagination?.currentPage || 1}
              totalPages={pagination?.lastPage || 1}
              onPageChange={onPageChange}
              labels={{
                previous: t('previous'),
                next: t('next'),
                page: t('page'),
                first: t('first'),
                last: t('last'),
              }}
            />
          </>
        )}
      </div>
    </section>
  );
}