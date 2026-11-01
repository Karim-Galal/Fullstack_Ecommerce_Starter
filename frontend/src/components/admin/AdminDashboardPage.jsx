'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/icons';
import { useAuthStore } from '@/stores/authStore';

const sectionDefinitions = [
  {
    key: 'products',
    href: '/admin/products',
    icon: 'products',
    permission: 'products.view',
    titleKey: 'products',
    descriptionKey: 'productsDescription',
  },
  {
    key: 'categories',
    href: '/admin/categories',
    icon: 'layers',
    permission: 'categories.view',
    titleKey: 'categories',
    descriptionKey: 'dashboardCategoriesDescription',
  },
  {
    key: 'collections',
    href: '/admin/collections',
    icon: 'grid',
    permission: 'collections.view',
    titleKey: 'collections',
    descriptionKey: 'dashboardCollectionsDescription',
  },
  {
    key: 'orders',
    href: '/admin/orders',
    icon: 'orders',
    permission: 'orders.view',
    titleKey: 'orders',
    descriptionKey: 'dashboardOrdersDescription',
  },
  {
    key: 'payments',
    href: '/admin/payments',
    icon: 'payment',
    permission: 'payments.view',
    titleKey: 'payments',
    descriptionKey: 'dashboardPaymentsDescription',
  },
  {
    key: 'invoices',
    href: '/admin/invoices',
    icon: 'documents',
    permission: 'invoices.view',
    titleKey: 'invoices',
    descriptionKey: 'dashboardInvoicesDescription',
  },
  {
    key: 'coupons',
    href: '/admin/coupons',
    icon: 'discount',
    permission: 'coupons.view',
    titleKey: 'coupons',
    descriptionKey: 'dashboardCouponsDescription',
  },
  {
    key: 'offers',
    href: '/admin/offers',
    icon: 'offer',
    permission: 'offers.view',
    titleKey: 'offers',
    descriptionKey: 'dashboardOffersDescription',
  },
  {
    key: 'reviews',
    href: '/admin/reviews',
    icon: 'star',
    permission: 'reviews.view',
    titleKey: 'reviews',
    descriptionKey: 'dashboardReviewsDescription',
  },
  {
    key: 'shippingMethods',
    href: '/admin/shipping-methods',
    icon: 'shipping',
    permission: 'shipping_methods.view',
    titleKey: 'shippingMethods',
    descriptionKey: 'dashboardShippingDescription',
  },
  {
    key: 'users',
    href: '/admin/users',
    icon: 'users',
    permission: 'users.view',
    titleKey: 'users',
    descriptionKey: 'dashboardUsersDescription',
  },
  {
    key: 'invitations',
    href: '/admin/invitations',
    icon: 'email',
    permission: 'users.view',
    masterOnly: true,
    titleKey: 'invitations',
    descriptionKey: 'dashboardInvitationsDescription',
  },
  {
    key: 'trash',
    href: '/admin/trash',
    icon: 'delete',
    titleKey: 'trash',
    descriptionKey: 'dashboardTrashDescription',
  },
];

export function AdminDashboardPage() {
  const locale = useLocale();
  const t = useTranslations('admin');
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const sections = sectionDefinitions.filter((section) => {
    if (section.masterOnly && user?.role !== 'master_admin') return false;

    return !section.permission || hasPermission(section.permission);
  });

  const roleLabel =
    user?.role === 'master_admin' ? t('roleMasterAdmin') : t('roleStaff');

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary">
          {t('dashboardEyebrow')}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-text-primary sm:text-3xl">
          {t('dashboard')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
          {user?.name
            ? t('dashboardWelcome', { name: user.name })
            : t('dashboardIntro')}
        </p>
      </header>

      <section aria-labelledby="admin-sections-heading" className="space-y-4">
        <h2
          id="admin-sections-heading"
          className="text-lg font-semibold text-text-primary"
        >
          {t('availableSections')}
        </h2>

        {sections.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {sections.map((section) => (
              <Link
                key={section.key}
                href={`/${locale}${section.href}`}
                className="group flex items-start gap-4 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary/40 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-sunken"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon
                    name={section.icon}
                    size="lg"
                    aria-hidden="true"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-text-primary transition-colors group-hover:text-primary">
                    {t(section.titleKey)}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-text-secondary">
                    {t(section.descriptionKey)}
                  </span>
                </span>
                <Icon
                  name="arrowRight"
                  size="md"
                  className="mt-1 shrink-0 text-text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-primary rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface p-6">
            <p className="font-medium text-text-primary">
              {t('noSectionsTitle')}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {t('noSectionsText')}
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="admin-session-heading">
        <h2
          id="admin-session-heading"
          className="text-lg font-semibold text-text-primary"
        >
          {t('sessionTitle')}
        </h2>

        <Card className="mt-4">
          <dl className="grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                {t('sessionName')}
              </dt>
              <dd className="mt-1 truncate text-sm font-medium text-text-primary">
                {user?.name || '—'}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                {t('sessionRole')}
              </dt>
              <dd className="mt-1 text-sm text-text-primary">{roleLabel}</dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                {t('sessionEmail')}
              </dt>
              <dd className="mt-1 truncate text-sm text-text-primary">
                {user?.email || '—'}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                {t('sessionStatus')}
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm text-text-primary">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-success"
                />
                {t('sessionVerified')}
              </dd>
            </div>
          </dl>
        </Card>
      </section>
    </div>
  );
}

export default AdminDashboardPage;
