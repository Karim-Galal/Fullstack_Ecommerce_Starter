'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Checkbox, Select } from '@/components/ui/Input';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { Breadcrumbs } from '@/components/ui/navigation/Breadcrumbs';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Pagination } from '@/components/ui/navigation/Pagination';
import { EmptyState } from '@/components/ui/data-display/EmptyState';
import { ProductCard } from '@/components/storefront/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/skeletons/ProductGridSkeleton';
import { Icon } from '@/components/icons';
import {
  cartService,
  categoryService,
  collectionService,
  productService,
} from '@/services/catalog';
import {
  getCategoryName,
  getCollectionName,
} from '@/lib/product';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';

const FILTER_KEYS = [
  'search',
  'category_id',
  'collection_id',
  'min_price',
  'max_price',
  'in_stock',
  'sort',
  'direction',
  'page',
];

function readFilters(searchParams) {
  const filters = {};

  FILTER_KEYS.forEach((key) => {
    const value = searchParams.get(key);
    if (value !== null && value !== '') filters[key] = value;
  });

  return filters;
}

function flattenCategories(categories = []) {
  return categories.flatMap((category) => [
    { ...category, depth: 0 },
    ...(category.children || []).map((child) => ({
      ...child,
      depth: 1,
    })),
  ]);
}

export function CatalogPage() {
  const locale = useLocale();
  const t = useTranslations('catalog');
  const tNav = useTranslations('navigation');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setCart = useCartStore((state) => state.setCart);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const wishlistItems = useWishlistStore((state) => state.items);

  const queryString = searchParams.toString();
  const filters = useMemo(
    () => readFilters(new URLSearchParams(queryString)),
    [queryString],
  );

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [status, setStatus] = useState('loading');
  const [actionError, setActionError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);

  const [searchDraft, setSearchDraft] = useState(filters.search || '');
  const [minPrice, setMinPrice] = useState(filters.min_price || '');
  const [maxPrice, setMaxPrice] = useState(filters.max_price || '');
  const [inStock, setInStock] = useState(filters.in_stock === '1');

  useEffect(() => {
    let cancelled = false;

    Promise.all([categoryService.list(), collectionService.list({ per_page: 100 })])
      .then(([categoryResponse, collectionResponse]) => {
        if (cancelled) return;
        setCategories(Array.isArray(categoryResponse?.data) ? categoryResponse.data : []);
        setCollections(
          Array.isArray(collectionResponse?.data) ? collectionResponse.data : [],
        );
      })
      .catch(() => {
        if (cancelled) return;
        setCategories([]);
        setCollections([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loadProducts = useCallback(() => {
    productService
      .list({ ...filters, per_page: 12 })
      .then((response) => {
        setProducts(Array.isArray(response?.data) ? response.data : []);
        setPagination({
          currentPage: Number(response?.current_page || 1),
          lastPage: Number(response?.last_page || 1),
          total: Number(response?.total || 0),
        });
        setStatus('ready');
      })
      .catch(() => {
        setProducts([]);
        setPagination(null);
        setStatus('error');
      });
  }, [filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleRetry = () => {
    setStatus('loading');
    loadProducts();
  };

  const buildHref = (updates, baseFilters = filters) => {
    const params = new URLSearchParams();

    Object.entries({ ...baseFilters, ...updates }).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      params.set(key, String(value));
    });

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const navigate = (updates, baseFilters) => {
    const href = buildHref(updates, baseFilters);
    const currentHref = queryString ? `${pathname}?${queryString}` : pathname;

    if (href === currentHref) return;

    setStatus('loading');
    router.replace(href, { scroll: false });
  };

  const resetToFirstPage = (updates, baseFilters) =>
    navigate({ ...updates, page: undefined }, baseFilters);

  const handleApplyFilters = (event) => {
    event.preventDefault();

    resetToFirstPage(
      {
        search: searchDraft.trim() || undefined,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
        in_stock: inStock ? '1' : undefined,
      },
      filters,
    );
  };

  const handleClear = () => {
    setSearchDraft('');
    setMinPrice('');
    setMaxPrice('');
    setInStock(false);

    if (!queryString) return;

    setStatus('loading');
    router.replace(pathname, { scroll: false });
  };

  const handleAddToCart = async (product) => {
    setActionError(null);

    try {
      const response = await cartService.add(product.id, 1);
      setCart(response);
    } catch (error) {
      setActionError(error.message || t('addError'));
    }
  };

  const categoryOptions = [
    { value: '', label: t('allCategories') },
    ...flattenCategories(categories).map((category) => ({
      value: String(category.id),
      label: `${category.depth ? '— ' : ''}${getCategoryName(category, locale)}`,
    })),
  ];

  const collectionOptions = [
    { value: '', label: t('allCollections') },
    ...collections.map((collection) => ({
      value: String(collection.id),
      label: getCollectionName(collection, locale),
    })),
  ];

  const sortValue = `${filters.sort || 'created_at'}:${filters.direction || 'desc'}`;

  const sortOptions = [
    { value: 'created_at:desc', label: t('sortNewest') },
    { value: 'price:asc', label: t('sortPriceAsc') },
    { value: 'price:desc', label: t('sortPriceDesc') },
  ];

  const breadcrumbItems = [
    { href: `/${locale}`, label: tNav('home') },
    { label: tNav('shop') },
  ];

  return (
    <div className="shell py-10 sm:py-14">
      <Breadcrumbs items={breadcrumbItems} className="mb-8 text-sm" />

      <SectionHeading
        as="h1"
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        className="max-w-2xl"
        titleClassName="text-4xl font-normal tracking-[-0.035em] text-text-primary sm:text-5xl"
        descriptionClassName="mt-4 text-sm leading-7 text-text-secondary sm:text-base"
      />

      {actionError && (
        <Alert
          variant="destructive"
          description={actionError}
          dismissible
          onDismiss={() => setActionError(null)}
          className="mt-8"
        />
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-10">
        <aside>
          <form
            onSubmit={handleApplyFilters}
            className="space-y-6 rounded-2xl border border-border bg-surface-elevated p-5 lg:sticky lg:top-24"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-text-primary">
                {t('filtersTitle')}
              </h2>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-medium text-text-secondary underline-offset-4 transition-colors hover:text-text-primary hover:underline"
              >
                {t('clearFilters')}
              </button>
            </div>

            <SearchInput
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder={t('searchPlaceholder')}
              label={t('searchPlaceholder')}
              clearLabel={t('clearFilters')}
              onClear={() => setSearchDraft('')}
              size="md"
            />

            <Select
              label={t('category')}
              value={filters.category_id || ''}
              options={categoryOptions}
              onChange={(event) =>
                resetToFirstPage({
                  category_id: event.target.value || undefined,
                })
              }
            />

            <Select
              label={t('collection')}
              value={filters.collection_id || ''}
              options={collectionOptions}
              onChange={(event) =>
                resetToFirstPage({
                  collection_id: event.target.value || undefined,
                })
              }
            />

            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-text-primary">
                {t('price')}
              </legend>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  placeholder={t('minPrice')}
                  aria-label={t('minPrice')}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  placeholder={t('maxPrice')}
                  aria-label={t('maxPrice')}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </fieldset>

            <Checkbox
              label={t('inStockOnly')}
              checked={inStock}
              onChange={(event) => {
                setInStock(event.target.checked);
                resetToFirstPage({
                  in_stock: event.target.checked ? '1' : undefined,
                });
              }}
            />

            <Button type="submit" size="sm" className="w-full rounded-full">
              {t('apply')}
            </Button>
          </form>
        </aside>

        <section aria-live="polite" aria-busy={status === 'loading'}>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <p className="text-sm text-text-secondary">
              {status === 'ready'
                ? t('results', { count: pagination?.total ?? products.length })
                : t('loading')}
            </p>

            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <span>{t('sort')}</span>
              <select
                value={sortValue}
                onChange={(event) => {
                  const [sort, direction] = event.target.value.split(':');
                  resetToFirstPage({ sort, direction });
                }}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
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
                  onClick={handleRetry}
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
                    onClick={handleClear}
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
                      onAddToCart={handleAddToCart}
                      onAddToWishlist={toggleWishlist}
                      isInWishlist={wishlistItems.some(
                        (item) => item.product_id === product.id,
                      )}
                    />
                  ))}
                </div>

                <Pagination
                  className="mt-10 flex justify-center"
                  currentPage={pagination?.currentPage || 1}
                  totalPages={pagination?.lastPage || 1}
                  onPageChange={(page) =>
                    navigate({ ...filters, page }, {})
                  }
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
      </div>
    </div>
  );
}

export default CatalogPage;
