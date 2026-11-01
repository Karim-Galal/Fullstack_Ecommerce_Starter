'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowDownWideNarrow,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox, Select } from '@/components/ui/Input';
import { Breadcrumbs } from '@/components/ui/navigation/Breadcrumbs';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Pagination } from '@/components/ui/navigation/Pagination';
import { EmptyState } from '@/components/ui/data-display/EmptyState';
import { ProductCard } from '@/components/storefront/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/skeletons/ProductGridSkeleton';
import { Icon } from '@/components/icons';
import { useToast } from '@/components/ui/feedback/ToastProvider';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  cartService,
  categoryService,
  collectionService,
  productService,
} from '@/services/catalog';
import {
  getCategoryName,
  getCollectionName,
  getProductName,
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

const FILTER_FIELD_KEYS = [
  'category_id',
  'collection_id',
  'min_price',
  'max_price',
  'in_stock',
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

function getDraftFilters(filters) {
  return {
    category_id: filters.category_id || '',
    collection_id: filters.collection_id || '',
    min_price: filters.min_price || '',
    max_price: filters.max_price || '',
    in_stock: filters.in_stock === '1',
  };
}

export function CatalogPage() {
  const locale = useLocale();
  const t = useTranslations('catalog');
  const tCommon = useTranslations('common');
  const tProduct = useTranslations('product');
  const tNav = useTranslations('navigation');
  const { toast } = useToast();
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
  const [addingIds, setAddingIds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(() =>
    getDraftFilters(filters),
  );
  const [searchDraft, setSearchDraft] = useState(filters.search || '');
  const mountedRef = useRef(false);
  const addingRef = useRef(new Set());
  const previousOverflowRef = useRef('');
  const closeAndApplyRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setSearchDraft(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      categoryService.list(),
      collectionService.list({ per_page: 100 }),
    ])
      .then(([categoryResponse, collectionResponse]) => {
        if (cancelled) return;

        setCategories(
          Array.isArray(categoryResponse?.data) ? categoryResponse.data : [],
        );
        setCollections(
          Array.isArray(collectionResponse?.data)
            ? collectionResponse.data
            : [],
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

  useEffect(() => {
    if (!isFiltersOpen) return undefined;

    previousOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeAndApplyRef.current?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflowRef.current;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFiltersOpen]); // closeAndApply reads current state through the callback below.

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

  const openFilters = () => {
    setDraftFilters(getDraftFilters(filters));
    setIsFiltersOpen(true);
  };

  const applyDraftFilters = (draft = draftFilters) => {
    resetToFirstPage(
      {
        category_id: draft.category_id || undefined,
        collection_id: draft.collection_id || undefined,
        min_price: draft.min_price || undefined,
        max_price: draft.max_price || undefined,
        in_stock: draft.in_stock ? '1' : undefined,
      },
      filters,
    );
  };

  const closeAndApply = () => {
    applyDraftFilters();
    setIsFiltersOpen(false);
  };

  closeAndApplyRef.current = closeAndApply;

  const handleClearFilterFields = () => {
    const clearedDraft = {
      category_id: '',
      collection_id: '',
      min_price: '',
      max_price: '',
      in_stock: false,
    };

    setDraftFilters(clearedDraft);

    const updates = {};
    FILTER_FIELD_KEYS.forEach((key) => {
      updates[key] = undefined;
    });

    resetToFirstPage(updates, filters);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    resetToFirstPage({ search: searchDraft.trim() || undefined }, filters);
  };

  const handleResetAll = () => {
    setSearchDraft('');
    setDraftFilters({
      category_id: '',
      collection_id: '',
      min_price: '',
      max_price: '',
      in_stock: false,
    });

    if (!queryString) return;

    setStatus('loading');
    router.replace(pathname, { scroll: false });
  };

  const handleRetry = () => {
    setStatus('loading');
    loadProducts();
  };

  const handleAddToCart = async (product) => {
    if (addingRef.current.has(product.id)) return;

    addingRef.current.add(product.id);
    setAddingIds(Array.from(addingRef.current));

    try {
      const response = await cartService.add(product.id, 1);

      if (!mountedRef.current) return;

      setCart(response);
      toast({
        variant: 'success',
        title: tProduct('addedToCart'),
        description: getProductName(product, locale),
      });
    } catch (error) {
      if (!mountedRef.current) return;

      toast({
        variant: 'destructive',
        title: tCommon('error'),
        description: getApiErrorMessage(error, tCommon, t('addError')),
      });
    } finally {
      addingRef.current.delete(product.id);

      if (mountedRef.current) {
        setAddingIds(Array.from(addingRef.current));
      }
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

  const updateDraft = (key, value) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

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

      <section className="mt-10" aria-label={t('title')}>
        <div className="flex items-center gap-2 sm:gap-3">
          <label className="relative flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-elevated text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-within:ring-2 focus-within:ring-primary">
            <ArrowDownWideNarrow size={19} aria-hidden="true" />
            <span className="sr-only">{t('sort')}</span>
            <select
              aria-label={t('sort')}
              value={sortValue}
              onChange={(event) => {
                const [sort, direction] = event.target.value.split(':');
                resetToFirstPage({ sort, direction });
              }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="hidden flex-1 sm:block" />

          <form
            onSubmit={handleSearchSubmit}
            role="search"
            className="relative min-w-0 flex-1 sm:flex-none"
          >
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-text-tertiary"
            />
            <input
              type="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
              className="h-11 w-full rounded-xl border border-border bg-surface-elevated ps-10 pe-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-primary sm:w-[280px]"
            />
          </form>

          <button
            type="button"
            onClick={openFilters}
            aria-label={t('filtersTitle')}
            aria-haspopup="dialog"
            aria-expanded={isFiltersOpen}
            className="relative flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-elevated text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <SlidersHorizontal size={19} aria-hidden="true" />
            {FILTER_FIELD_KEYS.some((key) => filters[key]) && (
              <span
                aria-hidden="true"
                className="absolute end-2 top-2 size-2 rounded-full bg-primary"
              />
            )}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-b border-border pb-4">
          <p className="text-sm text-text-secondary" aria-live="polite">
            {status === 'ready'
              ? t('results', { count: pagination?.total ?? products.length })
              : t('loading')}
          </p>
          {filters.search && (
            <button
              type="button"
              onClick={() => {
                setSearchDraft('');
                resetToFirstPage({ search: undefined }, filters);
              }}
              className="text-xs font-medium text-text-secondary underline-offset-4 transition-colors hover:text-text-primary hover:underline"
            >
              {t('clearFilters')}
            </button>
          )}
        </div>

        {isFiltersOpen && (
          <div
            className="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-stretch justify-end bg-black/45 p-0 backdrop-blur-[2px] rtl:justify-start sm:items-center sm:justify-center sm:p-6" 
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeAndApply();
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="catalog-filters-title"
              className="flex h-full w-full max-w-md flex-col overflow-hidden border border-border bg-surface-elevated shadow-2xl sm:h-auto sm:max-h-[min(44rem,calc(100dvh-3rem))] sm:max-w-lg sm:rounded-2xl"
            >
              <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
                <div>
                  <h2
                    id="catalog-filters-title"
                    className="text-lg font-semibold text-text-primary"
                  >
                    {t('filtersTitle')}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {t('description')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeAndApply}
                  aria-label={t('filtersTitle')}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <X size={19} aria-hidden="true" />
                </button>
              </header>

              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
                <Select
                  label={t('category')}
                  value={draftFilters.category_id}
                  options={categoryOptions}
                  onChange={(event) =>
                    updateDraft('category_id', event.target.value)
                  }
                />

                <Select
                  label={t('collection')}
                  value={draftFilters.collection_id}
                  options={collectionOptions}
                  onChange={(event) =>
                    updateDraft('collection_id', event.target.value)
                  }
                />

                <fieldset>
                  <legend className="mb-2 block text-sm font-medium text-text-primary">
                    {t('price')}
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={draftFilters.min_price}
                      onChange={(event) =>
                        updateDraft('min_price', event.target.value)
                      }
                      placeholder={t('minPrice')}
                      aria-label={t('minPrice')}
                      className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={draftFilters.max_price}
                      onChange={(event) =>
                        updateDraft('max_price', event.target.value)
                      }
                      placeholder={t('maxPrice')}
                      aria-label={t('maxPrice')}
                      className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </fieldset>

                <Checkbox
                  label={t('inStockOnly')}
                  checked={draftFilters.in_stock}
                  onChange={(event) =>
                    updateDraft('in_stock', event.target.checked)
                  }
                />
              </div>

              <footer className="flex shrink-0 items-center gap-3 border-t border-border bg-surface-elevated px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={handleClearFilterFields}
                  className="min-h-10 rounded-full bg-surface-sunken px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {t('clearFilters')}
                </button>
                <Button
                  type="button"
                  size="sm"
                  className="min-h-10 flex-1 rounded-full"
                  onClick={closeAndApply}
                >
                  {t('apply')}
                </Button>
              </footer>
            </section>
          </div>
        )}

        <div aria-live="polite" aria-busy={status === 'loading'} className="mt-6">
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
                  onClick={handleResetAll}
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
                    isAdding={addingIds.includes(product.id)}
                  />
                ))}
              </div>

              <Pagination
                className="mt-10 flex justify-center"
                currentPage={pagination?.currentPage || 1}
                totalPages={pagination?.lastPage || 1}
                onPageChange={(page) => navigate({ ...filters, page }, {})}
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
  );
}

export default CatalogPage;
