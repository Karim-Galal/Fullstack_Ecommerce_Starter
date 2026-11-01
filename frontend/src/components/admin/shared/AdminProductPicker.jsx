'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { getProductName } from '@/lib/product';
import { adminProductService } from '@/services/admin';

/**
 * Shared product assignment control used by coupons and offers.
 *
 * Only active products are fetched. `knownProducts` keeps already-assigned
 * products visible when editing a record whose products fall outside the first
 * page of the fetch.
 */
export function AdminProductPicker({
  selectedIds,
  onToggle,
  knownProducts = [],
  labels,
}) {
  const locale = useLocale();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();

    adminProductService
      .list({ per_page: 100, is_active: 1 }, { signal: controller.signal })
      .then((response) => {
        setProducts(response?.data || []);
        setStatus('ready');
      })
      .catch((error) => {
        if (error?.kind !== 'cancelled') setStatus('error');
      });

    return () => controller.abort();
  }, []);

  const mergedProducts = useMemo(() => {
    const map = new Map();

    knownProducts.forEach((product) => map.set(product.id, product));
    products.forEach((product) => map.set(product.id, product));

    return Array.from(map.values());
  }, [knownProducts, products]);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return mergedProducts;

    return mergedProducts.filter((product) =>
      `${getProductName(product, locale)} ${product.sku || ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [mergedProducts, search, locale]);

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-medium text-text-primary">{labels.title}</h3>
        <span className="text-sm text-text-tertiary">
          {labels.selected(selectedIds.length)}
        </span>
      </div>
      <p className="mt-1 text-sm text-text-secondary">{labels.hint}</p>

      <div className="mt-3">
        <SearchInput
          id={`admin-product-picker-${labels.title}`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onClear={() => setSearch('')}
          placeholder={labels.searchPlaceholder}
          label={labels.searchPlaceholder}
          clearLabel={labels.clear}
          className="w-full"
        />
      </div>

      {status === 'loading' && (
        <p className="mt-3 text-sm text-text-tertiary">{labels.loading}</p>
      )}

      {status === 'error' && (
        <p className="mt-3 text-sm text-error">{labels.error}</p>
      )}

      {status === 'ready' && (
        <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto">
          {visibleProducts.length === 0 && (
            <li className="p-3 text-sm text-text-tertiary">{labels.empty}</li>
          )}
          {visibleProducts.map((product) => (
            <li key={product.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-hover">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                  checked={selectedIds.includes(product.id)}
                  onChange={() => onToggle(product.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-text-primary">
                    {getProductName(product, locale)}
                  </span>
                  <span className="block truncate text-xs text-text-tertiary">
                    {product.sku || '—'}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
