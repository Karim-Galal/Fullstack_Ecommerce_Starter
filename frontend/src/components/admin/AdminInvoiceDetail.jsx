'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/feedback/ToastProvider';
import {
  AdminPageHeader,
  AdminPermissionDenied,
} from '@/components/admin/shared/AdminPageHeader';
import { AdminStatusBadge } from '@/components/admin/shared/AdminTable';
import { useAdminResource } from '@/hooks/useAdminResource';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDateTime } from '@/lib/date';
import { formatProductPrice } from '@/lib/product';
import { adminInvoiceService } from '@/services/admin';
import { useAuthStore } from '@/stores/authStore';

export function AdminInvoiceDetail({ invoiceId }) {
  const locale = useLocale();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission('invoices.view');
  const canRestore = hasPermission('invoices.update');

  const [restoring, setRestoring] = useState(false);

  const fetchInvoice = useCallback(
    ({ signal }) => adminInvoiceService.get(invoiceId, { signal }),
    [invoiceId]
  );

  const {
    data: invoice,
    setData: setInvoice,
    status,
    error,
    refresh,
  } = useAdminResource(fetchInvoice, { enabled: canView });

  const handleRestore = async () => {
    setRestoring(true);

    try {
      const response = await adminInvoiceService.restore(invoiceId);
      setInvoice(response?.data || response);
      toast({ variant: 'success', description: t('invoiceRestored') });
    } catch (requestError) {
      toast({
        variant: 'destructive',
        description: getApiErrorMessage(requestError, tCommon),
      });
    } finally {
      setRestoring(false);
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
      <div className="mx-auto max-w-4xl space-y-4" aria-hidden="true">
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

  const order = invoice.order || {};
  const items = order.items || [];
  const address = order.shipping_address || {};
  const isTrashed = Boolean(invoice.deleted_at);

  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHeader
        title={t('invoiceDetailTitle', { number: invoice.number })}
        description={formatDateTime(invoice.issued_at, locale)}
        actions={
          <Link
            href={`/${locale}/admin/invoices`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {t('invoiceBack')}
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <AdminStatusBadge
          status={invoice.status}
          label={t(`status.${invoice.status}`)}
        />
        {order.number && (
          <Link
            href={`/${locale}/admin/orders/${order.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {order.number}
          </Link>
        )}
      </div>

      {isTrashed && (
        <div className="mt-4">
          <Alert
            variant="warning"
            title={t('invoiceTrashedNotice')}
            description={t('invoiceRestoreHint')}
          >
            {canRestore && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestore}
                loading={restoring}
              >
                {t('invoiceRestoreAction')}
              </Button>
            )}
          </Alert>
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-semibold text-text-primary">{t('invoiceItems')}</h2>

          {items.length === 0 ? (
            <p className="mt-3 text-sm text-text-tertiary">
              {t('invoiceItemsEmpty')}
            </p>
          ) : (
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
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5">
                        <span className="block text-text-primary">
                          {item.name}
                        </span>
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
                          invoice.currency
                        )}
                      </td>
                      <td className="py-2.5 text-end font-medium text-text-primary">
                        {formatProductPrice(
                          item.line_total,
                          locale,
                          invoice.currency
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">{t('orderSubtotal')}</dt>
              <dd className="text-text-primary">
                {formatProductPrice(invoice.subtotal, locale, invoice.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">{t('orderDiscount')}</dt>
              <dd className="text-text-primary">
                {formatProductPrice(
                  invoice.discount_total,
                  locale,
                  invoice.currency
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">{t('orderShipping')}</dt>
              <dd className="text-text-primary">
                {formatProductPrice(
                  invoice.shipping_total,
                  locale,
                  invoice.currency
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-border pt-2 font-semibold">
              <dt className="text-text-primary">{t('invoiceTotal')}</dt>
              <dd className="text-text-primary">
                {formatProductPrice(invoice.total, locale, invoice.currency)}
              </dd>
            </div>
          </dl>
        </section>

        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-semibold text-text-primary">
              {t('invoiceCustomer')}
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
              {address.name && <p className="text-text-primary">{address.name}</p>}
              {address.phone && <p>{address.phone}</p>}
              {address.line1 && <p>{address.line1}</p>}
              {address.line2 && <p>{address.line2}</p>}
              {[address.city, address.postal_code].filter(Boolean).length >
                0 && (
                <p>
                  {[address.city, address.postal_code].filter(Boolean).join(', ')}
                </p>
              )}
              {address.country && <p>{address.country}</p>}
            </address>
          </section>
        </div>
      </div>
    </div>
  );
}

export default AdminInvoiceDetail;
