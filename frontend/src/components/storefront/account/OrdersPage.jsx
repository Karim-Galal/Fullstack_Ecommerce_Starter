'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/navigation/Breadcrumbs';
import { EmptyState } from '@/components/ui/data-display/EmptyState';
import { PageSkeleton } from '@/components/ui/skeletons/PageSkeleton';
import { Icon } from '@/components/icons';
import { orderService } from '@/services/checkout';
import { formatProductPrice } from '@/lib/product';
import { useAuthStore } from '@/stores/authStore';
import { useIsMounted } from '@/lib/use-mounted';

const statusVariant = {
  pending: 'warning',
  paid: 'success',
  completed: 'success',
  cancelled: 'destructive',
  refunded: 'info',
};

export function OrdersPage() {
  const locale = useLocale();
  const t = useTranslations('account');
  const tNav = useTranslations('navigation');

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const mounted = useIsMounted();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('loading');

  const loadOrders = useCallback(async () => {
    try {
      const response = await orderService.list();
      setOrders(Array.isArray(response?.data) ? response.data : []);
      setStatus('ready');
    } catch {
      setOrders([]);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!mounted || !isAuthenticated) return;

    let cancelled = false;

    orderService
      .list()
      .then((response) => {
        if (cancelled) return;
        setOrders(Array.isArray(response?.data) ? response.data : []);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setOrders([]);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [mounted, isAuthenticated]);

  const handleRetry = () => {
    setStatus('loading');
    loadOrders();
  };

  const breadcrumbItems = [
    { href: `/${locale}`, label: tNav('home') },
    { href: `/${locale}/account`, label: tNav('account') },
    { label: tNav('orders') },
  ];

  if (!mounted) {
    return (
      <div className="shell py-14">
        <PageSkeleton />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="shell py-10 sm:py-14">
        <Breadcrumbs items={breadcrumbItems} className="mb-8 text-sm" />
        <EmptyState
          icon="user"
          title={t('signInTitle')}
          description={t('signInText')}
          action={
            <Link
              href={`/${locale}/login?callbackUrl=${encodeURIComponent(
                `/${locale}/orders`,
              )}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-on transition-colors hover:bg-primary-hover"
            >
              {t('signIn')}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="shell py-10 sm:py-14">
      <Breadcrumbs items={breadcrumbItems} className="mb-8 text-sm" />

      <header className="max-w-2xl">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1 className="mt-4 text-4xl font-normal tracking-[-0.035em] text-text-primary sm:text-5xl">
          {t('ordersTitle')}
        </h1>
        <p className="mt-4 text-sm leading-7 text-text-secondary sm:text-base">
          {t('ordersDescription')}
        </p>
      </header>

      <div className="mt-10">
        {status === 'loading' && (
          <div role="status" aria-label={t('loading')}>
            <PageSkeleton />
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

        {status === 'ready' && orders.length === 0 && (
          <EmptyState
            icon="orders"
            title={t('noOrders')}
            description={t('noOrdersText')}
            action={
              <Link
                href={`/${locale}/products`}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-on transition-colors hover:bg-primary-hover"
              >
                {tNav('shop')}
              </Link>
            }
          />
        )}

        {status === 'ready' && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const items = Array.isArray(order.items) ? order.items : [];

              return (
                <article
                  key={order.id}
                  className="rounded-2xl border border-border bg-surface-elevated p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
                        {t('orderNumber')}
                      </p>
                      <p className="mt-1 font-medium text-text-primary">
                        {order.number}
                      </p>
                    </div>

                    <Badge
                      variant={statusVariant[order.status] || 'default'}
                      size="sm"
                    >
                      {order.status}
                    </Badge>
                  </div>

                  <dl className="mt-5 grid gap-4 border-t border-border pt-4 text-sm sm:grid-cols-2">
                    <div className="flex justify-between gap-4 sm:block">
                      <dt className="text-text-secondary">{t('items', { count: items.length })}</dt>
                      <dd className="mt-1 text-text-primary">
                        {items
                          .slice(0, 2)
                          .map((item) => item.name)
                          .join(', ')}
                      </dd>
                    </div>

                    <div className="flex items-baseline justify-between gap-4 sm:justify-end">
                      <dt className="text-text-secondary">{t('total')}</dt>
                      <dd className="text-lg font-semibold text-text-primary">
                        {formatProductPrice(
                          order.total,
                          locale,
                          order.currency,
                        )}
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersPage;
