'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Skeleton } from '@/components/ui/Skeleton';
import { Icon } from '@/components/icons';
import { categoryService } from '@/services/catalog';
import { getApiErrorMessage } from '@/lib/api-error';
import { getCategoryName } from '@/lib/product';

const MAX_CATEGORIES = 6;

export function StoreCategories() {
  const locale = useLocale();
  const t = useTranslations('home');
  const tCommon = useTranslations('common');

  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading');
  const [loadError, setLoadError] = useState(null);

  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const fetchCategories = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      const response = await categoryService.list();

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setCategories(
        Array.isArray(response?.data) ? response.data : [],
      );
      setStatus('ready');
    } catch (error) {
      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setCategories([]);
      setLoadError(error);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchCategories();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [fetchCategories]);

  const handleRetry = () => {
    setStatus('loading');
    setLoadError(null);
    fetchCategories();
  };

  const visibleCategories = categories
    .filter((category) => category?.is_active !== false)
    .slice(0, MAX_CATEGORIES);

  const loadErrorMessage = loadError
    ? getApiErrorMessage(
        loadError,
        tCommon,
        t('categories.errorText'),
      )
    : t('categories.errorText');

  return (
    <section
      id="categories"
      className="border-b border-border bg-surface"
    >
      <div className="shell py-16 sm:py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow={t('categories.eyebrow')}
            title={t('categories.title')}
            description={t('categories.description')}
            className="max-w-lg"
          />

          <Link
            href={`/${locale}/categories`}
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-text-primary transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            {t('categories.viewAll')}
            <Icon
              name="arrowRight"
              size="sm"
              className="rtl:rotate-180"
              aria-hidden="true"
            />
          </Link>
        </div>

        {status === 'loading' && (
          <div
            role="status"
            aria-label={t('categories.loading')}
            className="mt-8 flex flex-wrap gap-3"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton
                key={index}
                className="h-11 w-28 rounded-full"
              />
            ))}
            <span className="sr-only">
              {t('categories.loading')}
            </span>
          </div>
        )}

        {status === 'error' && (
          <div
            role="alert"
            className="mt-8"
          >
            <p className="text-sm text-text-secondary">
              {loadErrorMessage}
            </p>

            <button
              type="button"
              onClick={handleRetry}
              className="mt-3 text-sm font-medium text-text-primary transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              {t('categories.retry')}
            </button>
          </div>
        )}

        {status === 'ready' && visibleCategories.length === 0 && (
          <div className="mt-8">
            <p className="text-sm text-text-secondary">
              {t('categories.emptyText')}
            </p>
          </div>
        )}

        {status === 'ready' && visibleCategories.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3">
            {visibleCategories.map((category) => {
              const name = getCategoryName(category, locale);

              return (
                <Link
                  key={category.id}
                  href={`/${locale}/products?category_id=${category.id}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-6 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-primary hover:bg-primary hover:text-primary-on focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  {name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default StoreCategories;