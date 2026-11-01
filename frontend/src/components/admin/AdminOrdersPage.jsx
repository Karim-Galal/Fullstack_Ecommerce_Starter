'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { EmptyState } from '@/components/ui/data-display/EmptyState';
import {
  AdminPageHeader,
  AdminPermissionDenied,
} from '@/components/admin/shared/AdminPageHeader';
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
import { formatProductPrice } from '@/lib/product';
import { adminOrderService } from '@/services/admin';
import { useAuthStore } from '@/stores/authStore';

const PAGE_SIZE = 20;
const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export function AdminOrdersPage() {
  const locale = useLocale();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission('orders.view');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');

  const { items, pagination, status, error, page, setPage, refresh, isRefreshing } =
    useAdminList({
      fetchPage: adminOrderService.list,
      query: {
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        created_from: createdFrom || undefined,
        created_to: createdTo || undefined,
      },
      enabled: canView,
      perPage: PAGE_SIZE,
    });

  if (!canView) {
    return (
      <AdminPermissionDenied
        title={t('noAccessTitle')}
        description={t('noAccessText')}
      />
    );
  }

  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    Boolean(statusFilter) ||
    Boolean(createdFrom) ||
    Boolean(createdTo);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCreatedFrom('');
    setCreatedTo('');
    setPage(1);
  };

  const columns = [
    {
      key: 'number',
      label: t('orderNumber'),
      render: (order) => (
        <span className="font-medium text-text-primary">{order.number}</span>
      ),
    },
    {
      key: 'customer',
      label: t('orderCustomer'),
      render: (order) => (
        <div>
          <span className="block text-text-primary">
            {order.user?.name || t('orderGuest')}
          </span>
          {order.user?.email && (
            <span className="block text-xs text-text-tertiary">
              {order.user.email}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'total',
      label: t('orderTotal'),
      cellClassName: 'whitespace-nowrap font-medium text-text-primary',
      render: (order) =>
        formatProductPrice(order.total, locale, order.currency),
    },
    {
      key: 'payment',
      label: t('orderPaymentStatus'),
      render: (order) => {
        const paymentStatus = order.payments?.[0]?.status || 'unpaid';

        return (
          <AdminStatusBadge
            status={paymentStatus}
            label={t(`status.${paymentStatus}`)}
          />
        );
      },
    },
    {
      key: 'status',
      label: t('orderStatusFilter'),
      render: (order) => (
        <AdminStatusBadge
          status={order.status}
          label={t(`status.${order.status}`)}
        />
      ),
    },
    {
      key: 'date',
      label: t('orderDate'),
      render: (order) => formatDate(order.created_at, locale) || '—',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader title={t('orders')} description={t('ordersIntro')} />

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,11rem)_minmax(0,10rem)_minmax(0,10rem)]">
          <SearchInput
            id="admin-order-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            onClear={() => setSearch('')}
            placeholder={t('ordersSearchPlaceholder')}
            label={t('searchLabel')}
            clearLabel={tCommon('clear')}
            className="w-full"
          />
          <Select
            id="admin-order-status"
            label={t('orderStatusFilter')}
            value={statusFilter}
            options={[
              { value: '', label: t('ordersAllStatuses') },
              ...STATUSES.map((value) => ({
                value,
                label: t(`status.${value}`),
              })),
            ]}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          />
          <Input
            id="admin-order-from"
            type="date"
            label={t('orderDate')}
            value={createdFrom}
            onChange={(event) => {
              setCreatedFrom(event.target.value);
              setPage(1);
            }}
          />
          <Input
            id="admin-order-to"
            type="date"
            label={t('orderDate')}
            value={createdTo}
            onChange={(event) => {
              setCreatedTo(event.target.value);
              setPage(1);
            }}
          />
        </div>

        {hasActiveFilters && (
          <div className="mt-3">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              {t('clearFilters')}
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
            loading: t('loading'),
            error: t('loadErrorTitle'),
            showing: t('showingResults'),
            noResults: t('noResults'),
            refreshing: tCommon('loading'),
          }}
        />
      </div>

      <div className="mt-3">
        {status === 'loading' && <AdminTableSkeleton columns={6} />}

        {status === 'error' && (
          <Alert
            variant="destructive"
            title={t('loadErrorTitle')}
            description={getApiErrorMessage(error, tCommon, t('loadErrorText'))}
          >
            <Button variant="outline" size="sm" onClick={refresh}>
              {tCommon('retry')}
            </Button>
          </Alert>
        )}

        {status === 'ready' && items.length === 0 && (
          <EmptyState
            icon="orders"
            title={hasActiveFilters ? t('noResults') : t('emptyTitle')}
            description={
              hasActiveFilters ? t('emptyFilteredText') : t('ordersEmptyText')
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  {t('clearFilters')}
                </Button>
              ) : undefined
            }
          />
        )}

        {status === 'ready' && items.length > 0 && (
          <>
            <AdminTable
              columns={columns}
              items={items}
              getRowHref={(order) => `/${locale}/admin/orders/${order.id}`}
              actionsLabel={tCommon('view')}
              renderCard={(order) => (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-primary">
                        {order.number}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-text-tertiary">
                        {order.user?.name || t('orderGuest')}
                      </p>
                    </div>
                    <AdminStatusBadge
                      status={order.status}
                      label={t(`status.${order.status}`)}
                    />
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="font-semibold text-text-primary">
                      {formatProductPrice(order.total, locale, order.currency)}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {formatDate(order.created_at, locale)}
                    </p>
                  </div>
                </>
              )}
            />

            <AdminPaginationBar
              pagination={pagination}
              onPageChange={setPage}
              labels={{
                previous: tCommon('previous'),
                next: tCommon('next'),
                page: t('page'),
                first: t('firstPage'),
                last: t('lastPage'),
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default AdminOrdersPage;
