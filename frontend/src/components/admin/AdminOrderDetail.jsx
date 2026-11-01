'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/overlays/ConfirmDialog';
import { useToast } from '@/components/ui/feedback/ToastProvider';
import {
  AdminPageHeader,
  AdminPermissionDenied,
} from '@/components/admin/shared/AdminPageHeader';
import { AdminStatusBadge } from '@/components/admin/shared/AdminTable';
import { useAdminResource } from '@/hooks/useAdminResource';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDateTime, formatRelativeTime } from '@/lib/date';
import { formatProductPrice } from '@/lib/product';
import { adminOrderService } from '@/services/admin';
import { useAuthStore } from '@/stores/authStore';

const TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const ACTION_LABELS = {
  confirmed: 'orderConfirm',
  shipped: 'orderShip',
  delivered: 'orderDeliver',
  cancelled: 'orderCancel',
};

export function AdminOrderDetail({ orderId }) {
  const locale = useLocale();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission('orders.view');
  const canUpdate = hasPermission('orders.update');

  const [pendingStatus, setPendingStatus] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = useCallback(
    ({ signal }) => adminOrderService.get(orderId, { signal }),
    [orderId]
  );

  const {
    data: order,
    setData: setOrder,
    status,
    error,
    refresh,
  } = useAdminResource(fetchOrder, { enabled: canView });

  const applyStatus = async (nextStatus) => {
    setUpdating(true);

    try {
      const response = await adminOrderService.updateStatus(
        orderId,
        nextStatus
      );
      setOrder(response?.data || response);
      setPendingStatus(null);
      toast({ variant: 'success', description: t('orderStatusUpdated') });
    } catch (requestError) {
      toast({
        variant: 'destructive',
        description: getApiErrorMessage(requestError, tCommon),
      });
    } finally {
      setUpdating(false);
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

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-5xl space-y-4" aria-hidden="true">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" rounded="rounded-xl" />
        <Skeleton className="h-64 w-full" rounded="rounded-xl" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-3xl">
        <Alert
          variant="destructive"
          title={t('loadErrorTitle')}
          description={getApiErrorMessage(error, tCommon, t('loadErrorText'))}
        >
          <Button variant="outline" size="sm" onClick={refresh}>
            {tCommon('retry')}
          </Button>
        </Alert>
      </div>
    );
  }

  const address = order.shipping_address || {};
  const nextStatuses = TRANSITIONS[order.status] || [];
  const payments = order.payments || [];

  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader
        title={t('orderDetailTitle', { number: order.number })}
        description={formatDateTime(order.created_at, locale)}
        actions={
          <Link
            href={`/${locale}/admin/orders`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {tCommon('back')}
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <AdminStatusBadge
          status={order.status}
          label={t(`status.${order.status}`)}
        />
      </div>

      {canUpdate && nextStatuses.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {nextStatuses.map((nextStatus) => (
            <Button
              key={nextStatus}
              variant={nextStatus === 'cancelled' ? 'destructive' : 'primary'}
              size="sm"
              onClick={() => setPendingStatus(nextStatus)}
              disabled={updating}
            >
              {t(ACTION_LABELS[nextStatus])}
            </Button>
          ))}
        </div>
      )}

      {nextStatuses.length === 0 && (
        <p className="mt-3 text-sm text-text-tertiary">
          {t('orderStatusNoTransitions')}
        </p>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-semibold text-text-primary">{t('orderItems')}</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-text-tertiary">
                  <th scope="col" className="py-2 text-start font-medium">
                    {t('productsTableProduct')}
                  </th>
                  <th scope="col" className="py-2 text-end font-medium">
                    {t('orderQuantity')}
                  </th>
                  <th scope="col" className="py-2 text-end font-medium">
                    {t('orderUnitPrice')}
                  </th>
                  <th scope="col" className="py-2 text-end font-medium">
                    {t('orderLineTotal')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(order.items || []).map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5">
                      <span className="block text-text-primary">{item.name}</span>
                      <span className="block text-xs text-text-tertiary">
                        {item.sku}
                      </span>
                    </td>
                    <td className="py-2.5 text-end text-text-secondary">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 text-end text-text-secondary">
                      {formatProductPrice(
                        item.unit_price,
                        locale,
                        order.currency
                      )}
                    </td>
                    <td className="py-2.5 text-end font-medium text-text-primary">
                      {formatProductPrice(
                        item.line_total,
                        locale,
                        order.currency
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">{t('orderSubtotal')}</dt>
              <dd className="text-text-primary">
                {formatProductPrice(order.subtotal, locale, order.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">{t('orderDiscount')}</dt>
              <dd className="text-text-primary">
                {formatProductPrice(order.discount_total, locale, order.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">{t('orderShipping')}</dt>
              <dd className="text-text-primary">
                {formatProductPrice(order.shipping_total, locale, order.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-border pt-2 font-semibold">
              <dt className="text-text-primary">{t('orderTotal')}</dt>
              <dd className="text-text-primary">
                {formatProductPrice(order.total, locale, order.currency)}
              </dd>
            </div>
          </dl>
        </section>

        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-semibold text-text-primary">
              {t('orderCustomer')}
            </h2>
            <p className="mt-2 text-sm text-text-primary">
              {order.user?.name || t('orderGuest')}
            </p>
            {order.user?.email && (
              <p className="text-sm text-text-secondary">{order.user.email}</p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-semibold text-text-primary">
              {t('orderShippingAddress')}
            </h2>
            <address className="mt-2 space-y-1 text-sm not-italic text-text-secondary">
              <p className="text-text-primary">{address.name}</p>
              <p>{address.phone}</p>
              <p>{address.line1}</p>
              {address.line2 && <p>{address.line2}</p>}
              <p>
                {[address.city, address.postal_code].filter(Boolean).join(', ')}
              </p>
              <p>{address.country}</p>
            </address>
            {order.shipping_method && (
              <p className="mt-3 text-sm text-text-secondary">
                {t('orderShippingMethod')}:{' '}
                <span className="text-text-primary">
                  {order.shipping_method.name}
                </span>
              </p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-semibold text-text-primary">
              {t('orderPayments')}
            </h2>
            {payments.length === 0 ? (
              <p className="mt-2 text-sm text-text-tertiary">{t('none')}</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {payments.map((payment) => (
                  <li key={payment.id} className="text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-text-primary">
                        {formatProductPrice(
                          payment.amount,
                          locale,
                          payment.currency
                        )}
                      </span>
                      <AdminStatusBadge
                        status={payment.status}
                        label={t(`status.${payment.status}`)}
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-text-tertiary">
                      {payment.gateway} ·{' '}
                      {payment.paid_at
                        ? formatRelativeTime(payment.paid_at, locale)
                        : t('notAvailable')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-semibold text-text-primary">
              {t('orderInvoice')}
            </h2>
            {order.invoice ? (
              <Link
                href={`/${locale}/admin/invoices/${order.invoice.id}`}
                className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
              >
                {order.invoice.number}
              </Link>
            ) : (
              <p className="mt-2 text-sm text-text-tertiary">
                {t('orderNoInvoice')}
              </p>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(pendingStatus)}
        onClose={() => setPendingStatus(null)}
        onConfirm={() => applyStatus(pendingStatus)}
        title={
          pendingStatus === 'cancelled'
            ? t('orderConfirmCancelTitle')
            : tCommon('confirmTitle')
        }
        description={
          pendingStatus === 'cancelled' ? t('orderConfirmCancelText') : undefined
        }
        confirmText={
          pendingStatus ? t(ACTION_LABELS[pendingStatus]) : tCommon('confirm')
        }
        cancelText={tCommon('cancel')}
        variant={pendingStatus === 'cancelled' ? 'destructive' : 'primary'}
        isLoading={updating}
      />
    </div>
  );
}

export default AdminOrderDetail;
