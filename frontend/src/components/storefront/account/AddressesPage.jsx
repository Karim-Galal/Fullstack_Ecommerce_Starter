'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Checkbox, Input } from '@/components/ui/Input';
import { Breadcrumbs } from '@/components/ui/navigation/Breadcrumbs';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { EmptyState } from '@/components/ui/data-display/EmptyState';
import { PageSkeleton } from '@/components/ui/skeletons/PageSkeleton';
import { Icon } from '@/components/icons';
import { addressService } from '@/services/customer';
import { useAuthStore } from '@/stores/authStore';
import { useIsMounted } from '@/lib/use-mounted';

const emptyForm = {
  name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  country: 'EG',
  postal_code: '',
  is_default: false,
};

export function AddressesPage() {
  const locale = useLocale();
  const t = useTranslations('account');
  const tNav = useTranslations('navigation');

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const mounted = useIsMounted();
  const [addresses, setAddresses] = useState([]);
  const [status, setStatus] = useState('loading');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadAddresses = useCallback(async () => {
    try {
      const response = await addressService.list();
      setAddresses(Array.isArray(response?.data) ? response.data : []);
      setStatus('ready');
    } catch {
      setAddresses([]);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!mounted || !isAuthenticated) return;

    let cancelled = false;

    addressService
      .list()
      .then((response) => {
        if (cancelled) return;
        setAddresses(Array.isArray(response?.data) ? response.data : []);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setAddresses([]);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [mounted, isAuthenticated]);

  const handleRetry = () => {
    setStatus('loading');
    loadAddresses();
  };

  const openForm = (open) => {
    setFormOpen(open);
    setActionError(null);

    if (open) {
      setForm((current) => ({
        ...current,
        name: current.name || user?.name || '',
      }));
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setActionError(null);

    try {
      await addressService.create(form);
      setFeedback(t('addressAdded'));
      setForm(emptyForm);
      setFormOpen(false);
      await loadAddresses();
    } catch (error) {
      setActionError(error.message || t('errorText'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (address) => {
    if (typeof window !== 'undefined' && !window.confirm(t('deleteAddress'))) {
      return;
    }

    setActionError(null);

    try {
      await addressService.delete(address.id);
      setFeedback(t('addressDeleted'));
      await loadAddresses();
    } catch (error) {
      setActionError(error.message || t('errorText'));
    }
  };

  const handleSetDefault = async (address) => {
    setActionError(null);

    try {
      await addressService.setDefault(address.id);
      await loadAddresses();
    } catch (error) {
      setActionError(error.message || t('errorText'));
    }
  };

  const breadcrumbItems = [
    { href: `/${locale}`, label: tNav('home') },
    { href: `/${locale}/account`, label: tNav('account') },
    { label: tNav('addresses') },
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
                `/${locale}/addresses`,
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

      <header className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          as="h1"
          eyebrow={t('eyebrow')}
          title={t('addressesTitle')}
          description={t('addressesDescription')}
          className="max-w-2xl"
          titleClassName="text-4xl font-normal tracking-[-0.035em] text-text-primary sm:text-5xl"
          descriptionClassName="mt-4 text-sm leading-7 text-text-secondary sm:text-base"
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full px-5"
          onClick={() => openForm(!formOpen)}
        >
          {formOpen ? t('cancel') : t('addAddress')}
        </Button>
      </header>

      {feedback && (
        <Alert
          variant="success"
          description={feedback}
          dismissible
          onDismiss={() => setFeedback(null)}
          className="mt-8"
        />
      )}

      {actionError && (
        <Alert
          variant="destructive"
          description={actionError}
          dismissible
          onDismiss={() => setActionError(null)}
          className="mt-8"
        />
      )}

      {formOpen && (
        <form
          onSubmit={handleCreate}
          className="mt-8 grid gap-4 rounded-2xl border border-border bg-surface-elevated p-6 sm:grid-cols-2"
        >
          <Input
            label={t('nameLabel')}
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            autoComplete="name"
          />
          <Input
            label={t('phone')}
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            autoComplete="tel"
          />
          <Input
            label={t('line1')}
            name="line1"
            value={form.line1}
            onChange={handleChange}
            required
            autoComplete="address-line1"
          />
          <Input
            label={t('line2')}
            name="line2"
            value={form.line2}
            onChange={handleChange}
            autoComplete="address-line2"
          />
          <Input
            label={t('city')}
            name="city"
            value={form.city}
            onChange={handleChange}
            required
            autoComplete="address-level2"
          />
          <Input
            label={t('country')}
            name="country"
            value={form.country}
            onChange={handleChange}
            required
            maxLength={2}
            autoComplete="country"
          />
          <Input
            label={t('postalCode')}
            name="postal_code"
            value={form.postal_code}
            onChange={handleChange}
            autoComplete="postal-code"
          />

          <div className="flex items-end justify-between gap-4">
            <Checkbox
              label={t('defaultAddress')}
              name="is_default"
              checked={form.is_default}
              onChange={handleChange}
            />
            <Button type="submit" size="sm" loading={saving}>
              {t('save')}
            </Button>
          </div>
        </form>
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

        {status === 'ready' && addresses.length === 0 && (
          <EmptyState
            icon="home"
            title={t('noAddresses')}
            description={t('noAddressesText')}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full px-6"
                onClick={() => openForm(true)}
              >
                {t('addAddress')}
              </Button>
            }
          />
        )}

        {status === 'ready' && addresses.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((address) => (
              <article
                key={address.id}
                className="rounded-2xl border border-border bg-surface-elevated p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-medium text-text-primary">
                      {address.name}
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      {address.phone}
                    </p>
                  </div>
                  {address.is_default && (
                    <Badge variant="outline" size="sm">
                      {t('defaultAddress')}
                    </Badge>
                  )}
                </div>

                <address className="mt-4 text-sm leading-6 text-text-secondary">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ''}
                  <br />
                  {address.city}
                  {address.postal_code ? `, ${address.postal_code}` : ''}
                  <br />
                  {address.country}
                </address>

                <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4 text-xs">
                  {!address.is_default && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(address)}
                      className="font-medium text-text-secondary underline-offset-4 transition-colors hover:text-text-primary hover:underline"
                    >
                      {t('setDefault')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(address)}
                    className="font-medium text-error underline-offset-4 hover:underline"
                  >
                    {t('deleteAddress')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AddressesPage;
