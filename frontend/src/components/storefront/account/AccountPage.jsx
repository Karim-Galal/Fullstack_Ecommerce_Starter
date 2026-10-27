'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/navigation/Breadcrumbs';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { EmptyState } from '@/components/ui/data-display/EmptyState';
import { PageSkeleton } from '@/components/ui/skeletons/PageSkeleton';
import { Icon } from '@/components/icons';
import { useAuthStore } from '@/stores/authStore';
import { useIsMounted } from '@/lib/use-mounted';

export function AccountPage() {
  const locale = useLocale();
  const t = useTranslations('account');
  const tNav = useTranslations('navigation');

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  const mounted = useIsMounted();

  const breadcrumbItems = [
    { href: `/${locale}`, label: tNav('home') },
    { label: tNav('account') },
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
                `/${locale}/account`,
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

  const cards = [
    {
      href: `/${locale}/orders`,
      icon: 'orders',
      title: t('orders'),
      description: t('viewOrders'),
    },
    {
      href: `/${locale}/addresses`,
      icon: 'home',
      title: t('addresses'),
      description: t('manageAddresses'),
    },
    {
      href: `/${locale}/wishlist`,
      icon: 'wishlist',
      title: t('wishlist'),
      description: t('savedPieces'),
    },
  ];

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

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <section className="h-fit rounded-2xl border border-border bg-surface-elevated p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-text-tertiary">
            {t('profile')}
          </h2>

          <p className="mt-5 text-xl font-medium text-text-primary">
            {user?.name || '—'}
          </p>
          <p className="mt-1 text-sm text-text-secondary">{user?.email}</p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-6 w-full rounded-full"
            onClick={logout}
          >
            {t('signOut')}
          </Button>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-border bg-surface-elevated p-6 transition-colors hover:border-border-strong"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-sunken text-text-secondary">
                <Icon name={card.icon} size="md" />
              </span>
              <h2 className="mt-5 text-lg font-medium text-text-primary">
                {card.title}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {card.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-text-primary">
                {t('open')}
                <Icon
                  name="arrowRight"
                  size="sm"
                  className="rtl:rotate-180"
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AccountPage;
