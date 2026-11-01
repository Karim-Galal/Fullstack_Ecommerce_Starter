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
import { adminInvoiceService } from '@/services/admin';
import { useAuthStore } from '@/stores/authStore';

const PAGE_SIZE = 20;

export function AdminInvoicesPage() {
  const locale = useLocale();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission('invoices.view');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState('');
  const [issuedFrom, setIssuedFrom] = useState('');
  const [issuedTo, setIssuedTo] = useState('');

  const { items, pagination, status, error, page, setPage, refresh, isRefreshing } =
    useAdminList({
      fetchPage: adminInvoiceService.list,
      query: {
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        issued_from: issuedFrom || undefined,
        issued_to: issuedTo || undefined,
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
    Boolean(issuedFrom) ||
    Boolean(issuedTo);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setIssuedFrom('');
    setIssuedTo('');
    setPage(1);
  };

  const columns = [
    {
      key: 'number',
      label: t('invoiceNumber'),
      render: (invoice) => (
        <span className="font-medium text-text-primary">{invoice.number}</span>
      ),
    },
    {
      key: 'order',
      label: t('invoiceOrder'),
      render: (invoice) => invoice.order?.number || '—',
    },
    {
      key: 'customer',
      label: t('invoiceCustomer'),
      render: (invoice) => (
        <div>
          <span className="block text-text-primary">
            {invoice.order?.user?.name || t('orderGuest')}
          </span>
          {invoice.order?.user?.email && (
            <span className="block text-xs text-text-tertiary">
              {invoice.order.user.email}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'total',
      label: t('invoiceTotal'),
      cellClassName: 'whitespace-nowrap font-medium text-text-primary',
      render: (invoice) =>
        formatProductPrice(invoice.total, locale, invoice.currency),
    },
    {
      key: 'status',
      label: t('invoiceStatusFilter'),
      render: (invoice) => (
        <AdminStatusBadge
          status={invoice.status}
          label={t(`status.${invoice.status}`)}
        />
      ),
    },
    {
      key: 'issued',
      label: t('invoiceIssuedAt'),
      render: (invoice) =>
        invoice.issued_at ? formatDate(invoice.issued_at, locale) : '—',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader title={t('invoices')} description={t('invoicesIntro')} />

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,11rem)_minmax(0,10rem)_minmax(0,10rem)]">
          <SearchInput
            id="admin-invoice-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            onClear={() => setSearch('')}
            placeholder={t('invoicesSearchPlaceholder')}
            label={t('searchLabel')}
            clearLabel={tCommon('clear')}
            className="w-full"
          />
          <Select
            id="admin-invoice-status"
            label={t('invoiceStatusFilter')}
            value={statusFilter}
            options={[
              { value: '', label: t('invoiceAllStatuses') },
              { value: 'issued', label: t('status.issued') },
            ]}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          />
          <Input
            id="admin-invoice-from"
            type="date"
            label={t('dateFrom')}
            value={issuedFrom}
            onChange={(event) => {
              setIssuedFrom(event.target.value);
              setPage(1);
            }}
          />
          <Input
            id="admin-invoice-to"
            type="date"
            label={t('dateTo')}
            value={issuedTo}
            onChange={(event) => {
              setIssuedTo(event.target.value);
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
            icon="documents"
            title={t('emptyTitle')}
            description={
              hasActiveFilters ? t('emptyFilteredText') : t('invoicesEmptyText')
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
              getRowHref={(invoice) =>
                `/${locale}/admin/invoices/${invoice.id}`
              }
              actionsLabel={tCommon('view')}
              renderCard={(invoice) => (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-primary">
                        {invoice.number}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-text-tertiary">
                        {invoice.order?.number} ·{' '}
                        {invoice.order?.user?.name || t('orderGuest')}
                      </p>
                    </div>
                    <AdminStatusBadge
                      status={invoice.status}
                      label={t(`status.${invoice.status}`)}
                    />
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="font-semibold text-text-primary">
                      {formatProductPrice(invoice.total, locale, invoice.currency)}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {invoice.issued_at
                        ? formatDate(invoice.issued_at, locale)
                        : '—'}
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

export default AdminInvoicesPage;
