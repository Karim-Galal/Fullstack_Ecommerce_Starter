'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/navigation/Breadcrumbs';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { EmptyState } from '@/components/ui/data-display/EmptyState';
import { PageSkeleton } from '@/components/ui/skeletons/PageSkeleton';
import { Icon } from '@/components/icons';
import { cartService } from '@/services/catalog';
import {
  formatProductPrice,
  getProductImage,
  getProductName,
} from '@/lib/product';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';

export function CartPage() {
  const locale = useLocale();
  const t = useTranslations('cart');
  const tNav = useTranslations('navigation');

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const cart = useCartStore((state) => state.cart);
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal);
  const setCart = useCartStore((state) => state.setCart);

  const [status, setStatus] = useState('loading');
  const [actionError, setActionError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadCart = useCallback(() => {
    cartService
      .get()
      .then((response) => {
        setCart(response);
        setStatus('ready');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [setCart]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleRetry = () => {
    setStatus('loading');
    setActionError(null);
    loadCart();
  };

  const updateQuantity = async (item, nextQuantity) => {
    if (nextQuantity < 1) return;

    setUpdatingId(item.id);
    setActionError(null);

    try {
      const response = await cartService.update(item.id, nextQuantity);
      setCart(response);
    } catch (error) {
      setActionError(error.message || t('updateError'));
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (item) => {
    setUpdatingId(item.id);
    setActionError(null);

    try {
      await cartService.remove(item.id);
      const response = await cartService.get();
      setCart(response);
    } catch (error) {
      setActionError(error.message || t('removeError'));
    } finally {
      setUpdatingId(null);
    }
  };

  const breadcrumbItems = [
    { href: `/${locale}`, label: tNav('home') },
    { label: tNav('cart') },
  ];

  const checkoutHref = isAuthenticated
    ? `/${locale}/checkout`
    : `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/checkout`)}`;

  return (
    <div className="shell py-10 sm:py-14">
      <Breadcrumbs items={breadcrumbItems} className="mb-8 text-sm" />

      <SectionHeading
        as="h1"
        eyebrow={tNav('cart')}
        title={t('title')}
        className="max-w-2xl"
        titleClassName="text-4xl font-normal tracking-[-0.035em] text-text-primary sm:text-5xl"
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

        {status === 'ready' && items.length === 0 && (
          <EmptyState
            icon="cart"
            title={t('empty')}
            description={t('emptyMessage')}
            action={
              <Link
                href={`/${locale}/products`}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-on transition-colors hover:bg-primary-hover"
              >
                {t('continueShopping')}
              </Link>
            }
          />
        )}

        {status === 'ready' && items.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
            <section aria-label={t('title')} className="space-y-4">
              {items.map((item) => {
                const product = item.product || {};
                const productName = getProductName(product, locale);
                const imageUrl =
                  getProductImage(product, 'thumbnail') ||
                  getProductImage(product, 'card');
                const price = Number(product.price ?? 0);
                const lineTotal = price * Number(item.quantity || 0);
                const busy = updatingId === item.id;
                const stock = Number(product.stock ?? 0);

                return (
                  <article
                    key={item.id}
                    className="flex gap-4 rounded-2xl border border-border bg-surface-elevated p-4 sm:gap-5"
                  >
                    <Link
                      href={`/${locale}/products/${encodeURIComponent(
                        product.slug || product.id,
                      )}`}
                      className="block size-24 shrink-0 overflow-hidden rounded-xl bg-surface-sunken sm:size-28"
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={productName}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="flex h-full w-full items-center justify-center"
                        >
                          <span className="block size-10 rounded-full border-[5px] border-[#d3ccc0]" />
                        </span>
                      )}
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-medium text-text-primary sm:text-base">
                            <Link
                              href={`/${locale}/products/${encodeURIComponent(
                                product.slug || product.id,
                              )}`}
                              className="transition-colors hover:text-accent"
                            >
                              {productName}
                            </Link>
                          </h2>
                          {product.sku && (
                            <p className="mt-1 text-xs text-text-tertiary">
                              {product.sku}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item)}
                          disabled={busy}
                          className="text-xs text-text-secondary underline-offset-4 transition-colors hover:text-error hover:underline disabled:opacity-50"
                        >
                          {t('removeItem')}
                        </button>
                      </div>

                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center rounded-full border border-border">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item, Number(item.quantity) - 1)
                            }
                            disabled={busy || Number(item.quantity) <= 1}
                            aria-label={t('quantity')}
                            className="flex size-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-40"
                          >
                            <Icon name="remove" size="sm" />
                          </button>
                          <span className="min-w-9 text-center text-sm font-medium text-text-primary">
                            {busy ? t('updating') : item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item, Number(item.quantity) + 1)
                            }
                            disabled={
                              busy || (stock > 0 && Number(item.quantity) >= stock)
                            }
                            aria-label={t('quantity')}
                            className="flex size-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-40"
                          >
                            <Icon name="add" size="sm" />
                          </button>
                        </div>

                        <div className="text-end">
                          <p className="text-sm font-semibold text-text-primary">
                            {formatProductPrice(lineTotal, locale, product.currency)}
                          </p>
                          {Number(item.quantity) > 1 && (
                            <p className="mt-1 text-xs text-text-tertiary">
                              {formatProductPrice(price, locale, product.currency)} ×{' '}
                              {item.quantity}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="h-fit rounded-2xl border border-border bg-surface-elevated p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-medium text-text-primary">
                {t('title')}
              </h2>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">{t('subtotal')}</dt>
                  <dd className="font-medium text-text-primary">
                    {formatProductPrice(subtotal, locale, cart?.currency)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">{t('shipping')}</dt>
                  <dd className="text-text-secondary">
                    {t('shippingAtCheckout')}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-border pt-5">
                <span className="text-base font-medium text-text-primary">
                  {t('total')}
                </span>
                <span className="text-xl font-semibold text-text-primary">
                  {formatProductPrice(subtotal, locale, cart?.currency)}
                </span>
              </div>

              <Link
                href={checkoutHref}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-on transition-colors hover:bg-primary-hover"
              >
                {isAuthenticated ? t('proceedToCheckout') : t('loginToCheckout')}
                <Icon name="arrowRight" size="sm" className="rtl:rotate-180" />
              </Link>

              <Link
                href={`/${locale}/products`}
                className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
              >
                {t('continueShopping')}
              </Link>

              <p className="mt-4 text-xs leading-5 text-text-tertiary">
                {t('checkoutNote')}
              </p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartPage;
