'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/navigation/Breadcrumbs';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { EmptyState } from '@/components/ui/data-display/EmptyState';
import { Icon } from '@/components/icons';
import { categoryService } from '@/services/catalog';
import {
  getCategoryName,
  getTranslation,
} from '@/lib/product';

export function CategoriesPage() {
  const locale = useLocale();
  const t = useTranslations('catalog');
  const tNav = useTranslations('navigation');

  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading');

  const loadCategories = useCallback(() => {
    categoryService
      .list()
      .then((response) => {
        setCategories(Array.isArray(response?.data) ? response.data : []);
        setStatus('ready');
      })
      .catch(() => {
        setCategories([]);
        setStatus('error');
      });
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleRetry = () => {
    setStatus('loading');
    loadCategories();
  };

  const breadcrumbItems = [
    { href: `/${locale}`, label: tNav('home') },
    { label: tNav('categories') },
  ];

  return (
    <div className="shell py-10 sm:py-14">
      <Breadcrumbs items={breadcrumbItems} className="mb-8 text-sm" />

      <SectionHeading
        as="h1"
        eyebrow={t('categoriesPage.eyebrow')}
        title={t('categoriesPage.title')}
        description={t('categoriesPage.description')}
        className="max-w-2xl"
        titleClassName="text-4xl font-normal tracking-[-0.035em] text-text-primary sm:text-5xl"
        descriptionClassName="mt-4 text-sm leading-7 text-text-secondary sm:text-base"
      />

      <div className="mt-10">
        {status === 'loading' && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-2xl border border-border bg-surface-sunken motion-reduce:animate-none"
                aria-hidden="true"
              />
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-border bg-surface-elevated px-6 py-16 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface-sunken text-text-secondary">
              <Icon name="warning" size="lg" />
            </div>
            <h2 className="mt-5 text-xl font-medium text-text-primary">
              {t('categoriesPage.errorTitle')}
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-6 rounded-full px-6"
              onClick={handleRetry}
            >
              {t('categoriesPage.retry')}
            </Button>
          </div>
        )}

        {status === 'ready' && categories.length === 0 && (
          <EmptyState
            icon="products"
            title={t('categoriesPage.emptyTitle')}
            description={t('categoriesPage.emptyText')}
          />
        )}

        {status === 'ready' && categories.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => {
              const name = getCategoryName(category, locale);
              const description =
                getTranslation(category.translations, locale)?.description || '';
              const children = category.children || [];

              return (
                <article
                  key={category.id}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-surface-elevated p-6 transition-colors hover:border-border-strong"
                >
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-text-tertiary">
                    {String(index + 1).padStart(2, '0')}
                  </p>

                  <h2 className="mt-4 text-2xl font-normal tracking-[-0.03em] text-text-primary">
                    <Link
                      href={`/${locale}/products?category_id=${category.id}`}
                      className="transition-colors group-hover:text-accent"
                    >
                      {name}
                    </Link>
                  </h2>

                  {description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-text-secondary">
                      {description}
                    </p>
                  )}

                  {children.length > 0 && (
                    <ul className="mt-5 flex flex-wrap gap-2">
                      {children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={`/${locale}/products?category_id=${child.id}`}
                            className="inline-flex rounded-full border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
                          >
                            {getCategoryName(child, locale)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Link
                    href={`/${locale}/products?category_id=${category.id}`}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-text-primary underline-offset-4 hover:underline"
                  >
                    {t('categoriesPage.viewProducts')}
                    <Icon
                      name="arrowRight"
                      size="sm"
                      className="rtl:rotate-180"
                    />
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoriesPage;
