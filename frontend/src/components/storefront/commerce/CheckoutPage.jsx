'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Breadcrumbs } from '@/components/ui/navigation/Breadcrumbs';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { EmptyState } from '@/components/ui/data-display/EmptyState';
import { PageSkeleton } from '@/components/ui/skeletons/PageSkeleton';
import { Icon } from '@/components/icons';
import { cartService } from '@/services/catalog';
import { checkoutService } from '@/services/checkout';
import { addressService } from '@/services/customer';
import { formatProductPrice, getProductName } from '@/lib/product';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useIsMounted } from '@/lib/use-mounted';

const emptyAddress = {
  name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  country: 'EG',
  postal_code: '',
};

export function CheckoutPage() {
  const locale = useLocale();
  const t = useTranslations('checkout');
  const tNav = useTranslations('navigation');

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setCart = useCartStore((state) => state.setCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal);
  const userName = user?.name || '';

  const mounted = useIsMounted();
  const [status, setStatus] = useState('loading');
  const [address, setAddress] = useState(emptyAddress);
  const [gateway, setGateway] = useState('stripe');
  const [couponCode, setCouponCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const prepareCheckout = useCallback(
    () =>
      Promise.all([
        cartService.get(),
        addressService.list().catch(() => ({ data: [] })),
      ]),
    [],
  );

  const applyCheckoutData = useCallback(
    ([cartResponse, addressResponse]) => {
      setCart(cartResponse);

      const addresses = Array.isArray(addressResponse?.data)
        ? addressResponse.data
        : [];
      const preferred =
        addresses.find((item) => item.is_default) || addresses[0];

      if (preferred) {
        setAddress({
          name: preferred.name || userName,
          phone: preferred.phone || '',
          line1: preferred.line1 || '',
          line2: preferred.line2 || '',
          city: preferred.city || '',
          country: preferred.country || 'EG',
          postal_code: preferred.postal_code || '',
        });
      } else {
        setAddress((current) => ({
          ...current,
          name: current.name || userName,
        }));
      }

      setStatus('ready');
    },
    [setCart, userName],
  );

  useEffect(() => {
    if (!mounted || !isAuthenticated) return;

    let cancelled = false;

    prepareCheckout()
      .then((data) => {
        if (cancelled) return;
        applyCheckoutData(data);
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [mounted, isAuthenticated, prepareCheckout, applyCheckoutData]);

  const handleRetry = () => {
    setStatus('loading');
    prepareCheckout().then(applyCheckoutData).catch(() => setStatus('error'));
  };

  const handleAddressChange = (event) => {
    const { name, value } = event.target;
    setAddress((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await checkoutService.create({
        shipping_address: address,
        gateway,
        coupon_code: couponCode.trim() || undefined,
      });

      setResult(response);
      clearCart();
    } catch (submitError) {
      setError(submitError.message || t('errorText'));
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbItems = [
    { href: `/${locale}`, label: tNav('home') },
    { href: `/${locale}/cart`, label: tNav('cart') },
    { label: tNav('checkout') },
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
          icon="lock"
          title={t('signInTitle')}
          description={t('signInText')}
          action={
            <Link
              href={`/${locale}/login?callbackUrl=${encodeURIComponent(
                `/${locale}/checkout`,
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

  if (result?.order) {
    return (
      <div className="shell py-10 sm:py-14">
        <Breadcrumbs items={breadcrumbItems} className="mb-8 text-sm" />

        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface-elevated p-8 text-center sm:p-12">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
            <Icon name="success" size="xl" />
          </div>

          <h1 className="mt-6 text-3xl font-normal tracking-[-0.03em] text-text-primary">
            {t('successTitle')}
          </h1>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            {t('successText')}
          </p>

          <dl className="mt-8 space-y-3 border-t border-border pt-6 text-start text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">{t('orderNumber')}</dt>
              <dd className="font-medium text-text-primary">
                {result.order.number}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">{t('total')}</dt>
              <dd className="font-medium text-text-primary">
                {formatProductPrice(
                  result.order.total,
                  locale,
                  result.order.currency,
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-text-secondary">{t('paymentStatus')}</dt>
              <dd>
                <Badge variant="warning" size="sm">
                  {result.payment?.status || result.order.status}
                </Badge>
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={`/${locale}/orders`}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-on transition-colors hover:bg-primary-hover"
            >
              {t('viewOrders')}
            </Link>
            <Link
              href={`/${locale}/products`}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
            >
              {t('continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

      {error && (
        <Alert
          variant="destructive"
          description={error}
          dismissible
          onDismiss={() => setError(null)}
          className="mt-8"
        />
      )}

      {status === 'loading' && (
        <div className="mt-10">
          <PageSkeleton />
        </div>
      )}

      {status === 'error' && (
        <div className="mt-10 rounded-2xl border border-border bg-surface-elevated px-6 py-16 text-center">
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
        <div className="mt-10">
          <EmptyState
            icon="cart"
            title={t('emptyCart')}
            description={t('emptyCartText')}
            action={
              <Link
                href={`/${locale}/products`}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-on transition-colors hover:bg-primary-hover"
              >
                {tNav('shop')}
              </Link>
            }
          />
        </div>
      )}

      {status === 'ready' && items.length > 0 && (
        <form
          onSubmit={handleSubmit}
          className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10"
        >
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-surface-elevated p-6">
              <h2 className="text-lg font-medium text-text-primary">
                {t('shippingAddress')}
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Input
                  label={t('name')}
                  name="name"
                  value={address.name}
                  onChange={handleAddressChange}
                  required
                  autoComplete="name"
                />
                <Input
                  label={t('phone')}
                  name="phone"
                  value={address.phone}
                  onChange={handleAddressChange}
                  required
                  autoComplete="tel"
                />
                <Input
                  label={t('line1')}
                  name="line1"
                  value={address.line1}
                  onChange={handleAddressChange}
                  required
                  autoComplete="address-line1"
                />
                <Input
                  label={t('line2')}
                  name="line2"
                  value={address.line2}
                  onChange={handleAddressChange}
                  autoComplete="address-line2"
                />
                <Input
                  label={t('city')}
                  name="city"
                  value={address.city}
                  onChange={handleAddressChange}
                  required
                  autoComplete="address-level2"
                />
                <Input
                  label={t('country')}
                  name="country"
                  value={address.country}
                  onChange={handleAddressChange}
                  required
                  maxLength={2}
                  autoComplete="country"
                />
                <Input
                  label={t('postalCode')}
                  name="postal_code"
                  value={address.postal_code}
                  onChange={handleAddressChange}
                  autoComplete="postal-code"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface-elevated p-6">
              <h2 className="text-lg font-medium text-text-primary">
                {t('paymentMethod')}
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  { value: 'stripe', label: t('gatewayStripe') },
                  { value: 'paymob', label: t('gatewayPaymob') },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm transition-colors ${
                      gateway === option.value
                        ? 'border-text-primary bg-surface'
                        : 'border-border hover:border-border-strong'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gateway"
                      value={option.value}
                      checked={gateway === option.value}
                      onChange={(event) => setGateway(event.target.value)}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-text-primary">{option.label}</span>
                  </label>
                ))}
              </div>

              <div className="mt-4">
                <Input
                  label={t('couponCode')}
                  name="coupon_code"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  autoComplete="off"
                />
              </div>

              <p className="mt-4 text-xs leading-5 text-text-tertiary">
                {t('checkoutNote')}
              </p>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-surface-elevated p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-medium text-text-primary">
              {t('orderSummary')}
            </h2>

            <ul className="mt-5 space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 text-text-secondary">
                    {getProductName(item.product, locale)} × {item.quantity}
                  </span>
                  <span className="shrink-0 font-medium text-text-primary">
                    {formatProductPrice(
                      Number(item.product?.price || 0) * Number(item.quantity || 0),
                      locale,
                      item.product?.currency,
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">{t('subtotal')}</dt>
                <dd className="font-medium text-text-primary">
                  {formatProductPrice(subtotal, locale)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">{t('shipping')}</dt>
                <dd className="text-text-secondary">
                  {t('shippingAtCheckout')}
                </dd>
              </div>
            </dl>

            <Button
              type="submit"
              size="lg"
              className="mt-6 w-full rounded-full"
              loading={submitting}
            >
              {submitting ? t('processing') : t('placeOrder')}
            </Button>
          </aside>
        </form>
      )}
    </div>
  );
}

export default CheckoutPage;
