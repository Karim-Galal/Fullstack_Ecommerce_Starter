'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { ConfirmDialog } from '@/components/ui/overlays/ConfirmDialog';
import { useToast } from '@/components/ui/feedback/ToastProvider';
import { EmptyState } from '@/components/ui/data-display/EmptyState';
import {
  AdminPageHeader,
  AdminPermissionDenied,
} from '@/components/admin/shared/AdminPageHeader';
import { AdminLinkButton } from '@/components/admin/shared/AdminLinkButton';
import {
  AdminStatusBadge,
  AdminTable,
  AdminTableSkeleton,
} from '@/components/admin/shared/AdminTable';
import {
  AdminPaginationBar,
  AdminResultSummary,
} from '@/components/admin/shared/AdminPagination';
import { useAdminList, useDebouncedValue } from '@/hooks/useAdminList';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/date';
import { formatProductPrice, getCategoryName, getProductName } from '@/lib/product';
import { adminProductService } from '@/services/admin';
import { useAuthStore } from '@/stores/authStore';

const PAGE_SIZE = 15;
const DEFAULT_SORT = 'created_at:desc';

export function AdminProductsPage() {
  const locale = useLocale();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission('products.view');
  const canCreate = hasPermission('products.create');
  const canEdit = hasPermission('products.update');
  const canDelete = hasPermission('products.delete');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sortValue, setSortValue] = useState(DEFAULT_SORT);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [sort, direction] = sortValue.split(':');

  const query = {
    search: debouncedSearch || undefined,
    is_active: statusFilter || undefined,
    in_stock: stockFilter || undefined,
    sort,
    direction,
  };

  const {
    items,
    pagination,
    status,
    error,
    page,
    setPage,
    refresh,
    isRefreshing,
  } = useAdminList({
    fetchPage: adminProductService.list,
    query,
    enabled: canView,
    perPage: PAGE_SIZE,
  });

  if (!canView) {
    return (
      <AdminPermissionDenied
        title={t('productsNoAccessTitle')}
        description={t('productsNoAccessText')}
      />
    );
  }

  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    Boolean(statusFilter) ||
    Boolean(stockFilter) ||
    sortValue !== DEFAULT_SORT;

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setStockFilter('');
    setSortValue(DEFAULT_SORT);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await adminProductService.delete(deleteTarget.id);
      toast({ variant: 'success', description: t('productDeleted') });
      setDeleteTarget(null);
      refresh();
    } catch (deleteError) {
      toast({
        variant: 'destructive',
        description: getApiErrorMessage(
          deleteError,
          tCommon,
          t('loadErrorText')
        ),
      });
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'product',
      label: t('productsTableProduct'),
      cellClassName: 'max-w-[22rem]',
      render: (product) => (
        <div>
          <span className="block truncate font-medium text-text-primary">
            {getProductName(product, locale) || t('productsUntitled')}
          </span>
          <span className="mt-0.5 block truncate text-xs text-text-tertiary">
            {product.slug}
          </span>
        </div>
      ),
    },
    {
      key: 'sku',
      label: t('productsTableSku'),
      render: (product) => product.sku || '—',
    },
    {
      key: 'category',
      label: t('productsTableCategory'),
      render: (product) =>
        getCategoryName(product.category, locale) || t('productNoCategory'),
    },
    {
      key: 'price',
      label: t('productsTablePrice'),
      cellClassName: 'whitespace-nowrap font-medium text-text-primary',
      render: (product) => formatProductPrice(product.price, locale),
    },
    {
      key: 'stock',
      label: t('productsTableStock'),
      cellClassName: 'whitespace-nowrap',
      render: (product) => (
        <span className={Number(product.stock) > 0 ? '' : 'font-medium text-error'}>
          {product.stock}
        </span>
      ),
    },
    {
      key: 'status',
      label: t('productsTableStatus'),
      render: (product) => (
        <AdminStatusBadge
          status={product.is_active ? 'active' : 'inactive'}
          label={product.is_active ? tCommon('active') : tCommon('inactive')}
        />
      ),
    },
    {
      key: 'updated',
      label: t('productsTableUpdated'),
      render: (product) =>
        formatDate(product.updated_at || product.created_at, locale) || '—',
    },
  ];

  const rowActions = (product) => (
    <div className="flex items-center justify-end gap-1">
      {canEdit && (
        <Link
          href={`/${locale}/admin/products/${product.id}/edit`}
          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary hover:bg-surface-hover"
        >
          {tCommon('edit')}
        </Link>
      )}
      {canDelete && (
        <Button
          variant="ghost"
          size="xs"
          className="text-error"
          onClick={() => setDeleteTarget(product)}
        >
          {tCommon('delete')}
        </Button>
      )}
    </div>
  );

  const renderCard = (product) => (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-text-primary">
            {getProductName(product, locale) || t('productsUntitled')}
          </p>
          <p className="mt-0.5 truncate text-xs text-text-tertiary">
            {product.sku || '—'}
          </p>
        </div>
        <AdminStatusBadge
          status={product.is_active ? 'active' : 'inactive'}
          label={product.is_active ? tCommon('active') : tCommon('inactive')}
        />
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-base font-semibold text-text-primary">
          {formatProductPrice(product.price, locale)}
        </p>
        <p className="text-xs text-text-secondary">
          {t('productsTableStock')}:{' '}
          <span className={Number(product.stock) > 0 ? '' : 'font-medium text-error'}>
            {product.stock}
          </span>
        </p>
      </div>
      <p className="mt-1 text-xs text-text-tertiary">
        {getCategoryName(product.category, locale) || t('productNoCategory')}
      </p>
    </>
  );

  const showSkeleton =
    status === 'loading' || (status !== 'ready' && isRefreshing);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title={t('products')}
        description={t('productsIntro')}
        actions={
          canCreate ? (
            <AdminLinkButton href={`/${locale}/admin/products/new`}>
              {t('productCreate')}
            </AdminLinkButton>
          ) : null
        }
      />

      <section
        aria-label={t('productsFiltersLabel')}
        className="rounded-xl border border-border bg-surface p-4"
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,11rem))]">
          <SearchInput
            id="admin-product-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch('')}
            placeholder={t('productsSearchPlaceholder')}
            label={t('productsSearchLabel')}
            clearLabel={tCommon('clear')}
            className="w-full"
          />

          <Select
            id="admin-product-status"
            label={t('productsStatusFilter')}
            value={statusFilter}
            options={[
              { value: '', label: t('productsAllStatuses') },
              { value: '1', label: tCommon('active') },
              { value: '0', label: tCommon('inactive') },
            ]}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          />

          <Select
            id="admin-product-stock"
            label={t('productsStockFilter')}
            value={stockFilter}
            options={[
              { value: '', label: t('productsAllStock') },
              { value: '1', label: t('productsInStock') },
              { value: '0', label: t('productsOutOfStock') },
            ]}
            onChange={(event) => {
              setStockFilter(event.target.value);
              setPage(1);
            }}
          />

          <Select
            id="admin-product-sort"
            label={t('productsSortBy')}
            value={sortValue}
            options={[
              { value: 'created_at:desc', label: t('productsSortNewest') },
              { value: 'created_at:asc', label: t('productsSortOldest') },
              { value: 'price:asc', label: t('productsSortPriceAsc') },
              { value: 'price:desc', label: t('productsSortPriceDesc') },
            ]}
            onChange={(event) => {
              setSortValue(event.target.value);
              setPage(1);
            }}
          />
        </div>

        {hasActiveFilters && (
          <div className="mt-3">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              {t('productsClearFilters')}
            </Button>
          </div>
        )}
      </section>

      <div className="mt-5">
        <AdminResultSummary
          status={status}
          isRefreshing={isRefreshing}
          pagination={pagination}
          labels={{
            loading: t('productsLoading'),
            error: t('productsLoadErrorTitle'),
            showing: t('productsShowingResults'),
            noResults: t('noResults'),
            refreshing: tCommon('loading'),
          }}
        />
      </div>

      <div className="mt-3" aria-busy={isRefreshing}>
        {showSkeleton && <AdminTableSkeleton columns={6} />}

        {status === 'error' && !isRefreshing && (
          <Alert
            variant="destructive"
            title={t('productsLoadErrorTitle')}
            description={getApiErrorMessage(
              error,
              tCommon,
              t('productsLoadErrorText')
            )}
          >
            <Button variant="outline" size="sm" onClick={refresh}>
              {tCommon('retry')}
            </Button>
          </Alert>
        )}

        {status === 'ready' && items.length === 0 && (
          <EmptyState
            icon="search"
            title={t('productsEmptyTitle')}
            description={
              hasActiveFilters
                ? t('productsEmptyFilteredText')
                : t('productsEmptyText')
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  {t('productsClearFilters')}
                </Button>
              ) : undefined
            }
          />
        )}

        {status === 'ready' && items.length > 0 && (
          <div
            className={`transition-opacity ${
              isRefreshing ? 'opacity-60' : 'opacity-100'
            }`}
          >
            <AdminTable
              columns={columns}
              items={items}
              actions={
                canEdit || canDelete ? rowActions : undefined
              }
              actionsLabel={t('actions')}
              renderCard={renderCard}
              getRowHref={
                canEdit
                  ? (product) =>
                      `/${locale}/admin/products/${product.id}/edit`
                  : undefined
              }
            />

            <AdminPaginationBar
              pagination={pagination}
              onPageChange={setPage}
              labels={{
                previous: tCommon('previous'),
                next: tCommon('next'),
                page: t('productsPage'),
                first: t('productsFirstPage'),
                last: t('productsLastPage'),
              }}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('confirmTitle')}
        description={t('confirmDeleteText')}
        confirmText={tCommon('delete')}
        cancelText={tCommon('cancel')}
        variant="destructive"
        isLoading={deleting}
      />
    </div>
  );
}

export default AdminProductsPage;
