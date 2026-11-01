'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/overlays/Dialog';
import { Input, Select } from '@/components/ui/Input';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { EmptyState } from '@/components/ui/data-display/EmptyState';
import { useToast } from '@/components/ui/feedback/ToastProvider';
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
import { formatDateTime } from '@/lib/date';
import { formatProductPrice } from '@/lib/product';
import { adminPaymentService } from '@/services/admin';
import { useAuthStore } from '@/stores/authStore';

const PAGE_SIZE = 20;
const STATUSES = ['unpaid', 'pending', 'paid', 'failed', 'refunded', 'expired'];

export function AdminPaymentsPage() {
  const locale = useLocale();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission('payments.view');
  const canRefund = hasPermission('payments.refund');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('');
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState(null);

  const { items, pagination, status, error, page, setPage, refresh, isRefreshing } =
    useAdminList({
      fetchPage: adminPaymentService.list,
      query: {
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        gateway: gatewayFilter || undefined,
      },
      enabled: canView,
      perPage: PAGE_SIZE,
    });

  const openRefund = (payment) => {
    setRefundTarget(payment);
    setRefundAmount('');
    setRefundError(null);
  };

  const handleRefund = async () => {
    if (!refundTarget) return;

    setRefunding(true);
    setRefundError(null);

    try {
      await adminPaymentService.refund(
        refundTarget.id,
        refundAmount === '' ? undefined : Number(refundAmount)
      );

      toast({ variant: 'success', description: t('paymentRefundSuccess') });
      setRefundTarget(null);
      refresh();
    } catch (requestError) {
      setRefundError(requestError);
      toast({
        variant: 'destructive',
        description: getApiErrorMessage(requestError, tCommon),
      });
    } finally {
      setRefunding(false);
    }
  };

  if (!canView) {
    return (
      <AdminPermissionDenied
        title={t('noAccessTitle')}
        description={t('noAccessText')}
      />
    );
  }

  const hasActiveFilters =
    Boolean(debouncedSearch) || Boolean(statusFilter) || Boolean(gatewayFilter);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setGatewayFilter('');
    setPage(1);
  };

  const columns = [
    {
      key: 'reference',
      label: t('paymentTransaction'),
      render: (payment) => (
        <div className="max-w-[16rem]">
          <span className="block truncate font-medium text-text-primary">
            {payment.gateway_reference || payment.transaction_reference}
          </span>
          <span className="block truncate text-xs text-text-tertiary">
            {payment.order?.number}
          </span>
        </div>
      ),
    },
    {
      key: 'order',
      label: t('paymentOrder'),
      render: (payment) => payment.order?.number || '—',
    },
    {
      key: 'amount',
      label: t('paymentAmount'),
      cellClassName: 'whitespace-nowrap font-medium text-text-primary',
      render: (payment) =>
        formatProductPrice(payment.amount, locale, payment.currency),
    },
    {
      key: 'gateway',
      label: t('paymentGateway'),
      render: (payment) => payment.gateway,
    },
    {
      key: 'status',
      label: t('paymentStatus'),
      render: (payment) => (
        <AdminStatusBadge
          status={payment.status}
          label={t(`status.${payment.status}`)}
        />
      ),
    },
    {
      key: 'paid',
      label: t('paymentPaidAt'),
      render: (payment) =>
        payment.paid_at ? formatDateTime(payment.paid_at, locale) : '—',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader title={t('payments')} description={t('paymentsIntro')} />

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,11rem)_minmax(0,11rem)]">
          <SearchInput
            id="admin-payment-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            onClear={() => setSearch('')}
            placeholder={t('paymentsSearchPlaceholder')}
            label={t('searchLabel')}
            clearLabel={tCommon('clear')}
            className="w-full"
          />
          <Select
            id="admin-payment-status"
            label={t('paymentsStatusFilter')}
            value={statusFilter}
            options={[
              { value: '', label: t('paymentsAllStatuses') },
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
          <Select
            id="admin-payment-gateway"
            label={t('paymentsGatewayFilter')}
            value={gatewayFilter}
            options={[
              { value: '', label: t('paymentsAllGateways') },
              { value: 'stripe', label: 'Stripe' },
              { value: 'paymob', label: 'Paymob' },
            ]}
            onChange={(event) => {
              setGatewayFilter(event.target.value);
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
            icon="payment"
            title={hasActiveFilters ? t('noResults') : t('emptyTitle')}
            description={
              hasActiveFilters ? t('emptyFilteredText') : t('paymentsEmptyText')
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
              actions={
                canRefund
                  ? (payment) =>
                      payment.status === 'paid' ? (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => openRefund(payment)}
                        >
                          {t('paymentRefund')}
                        </Button>
                      ) : null
                  : undefined
              }
              actionsLabel={t('actions')}
              renderCard={(payment) => (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-primary">
                        {payment.gateway_reference ||
                          payment.transaction_reference}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-text-tertiary">
                        {payment.order?.number} · {payment.gateway}
                      </p>
                    </div>
                    <AdminStatusBadge
                      status={payment.status}
                      label={t(`status.${payment.status}`)}
                    />
                  </div>
                  <p className="mt-3 font-semibold text-text-primary">
                    {formatProductPrice(
                      payment.amount,
                      locale,
                      payment.currency
                    )}
                  </p>
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

      <Dialog
        isOpen={Boolean(refundTarget)}
        onClose={() => setRefundTarget(null)}
        title={t('paymentRefundTitle')}
        description={t('paymentRefundText')}
        size="md"
        closeLabel={tCommon('close')}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setRefundTarget(null)}
              disabled={refunding}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefund}
              loading={refunding}
            >
              {t('paymentRefund')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {refundError && (
            <Alert
              variant="destructive"
              title={t('loadErrorTitle')}
              description={getApiErrorMessage(refundError, tCommon)}
            />
          )}

          {refundTarget && (
            <p className="text-sm text-text-secondary">
              {t('paymentRefundFullHint', {
                amount: formatProductPrice(
                  refundTarget.amount,
                  locale,
                  refundTarget.currency
                ),
              })}
            </p>
          )}

          <Input
            label={t('paymentRefundAmount')}
            type="number"
            min="0"
            step="0.01"
            value={refundAmount}
            onChange={(event) => setRefundAmount(event.target.value)}
            placeholder="0.00"
          />
        </div>
      </Dialog>
    </div>
  );
}

export default AdminPaymentsPage;
