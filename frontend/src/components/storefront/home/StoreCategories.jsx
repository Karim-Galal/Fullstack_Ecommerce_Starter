'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Skeleton } from '@/components/ui/Skeleton';
import { Icon } from '@/components/icons';
import { categoryService } from '@/services/catalog';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  getCategoryName,
  getTranslation,
} from '@/lib/product';

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

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const fetchCategories = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      const response = await categoryService.list();

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setCategories(Array.isArray(response?.data) ? response.data : []);
      setStatus('ready');
    } catch (error) {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setCategories([]);
      setLoadError(error);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    let cancelled = false;

    categoryService
      .list()
      .then((response) => {
        if (
          cancelled ||
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        setCategories(Array.isArray(response?.data) ? response.data : []);
        setStatus('ready');
      })
      .catch((error) => {
        if (
          cancelled ||
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        setCategories([]);
        setLoadError(error);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRetry = () => {
    setStatus('loading');
    setLoadError(null);
    fetchCategories();
  };

  const visibleCategories = categories.slice(0, MAX_CATEGORIES);
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
      className="scroll-mt-24 border-b border-border bg-surface"
    >
      <div className="shell py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              eyebrow={t('categories.eyebrow')}
              title={t('categories.title')}
              description={t('categories.description')}
              className="max-w-sm"
            />

            <Link
              href={`/${locale}/categories`}
              className="mt-8 inline-flex items-center gap-2 border-b border-text-primary/30 pb-1 text-sm font-medium text-text-primary transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
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

          <div>
            {status === 'loading' && (
              <div
                role="status"
                aria-label={t('categories.loading')}
                className="border-t border-border"
              >
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    aria-hidden="true"
                    className="grid gap-4 border-b border-border py-7 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-10"
                  >
                    <div className="space-y-3">
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>

                    <div className="flex items-start justify-between gap-6">
                      <div className="w-full max-w-md space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-4/5" />
                      </div>
                      <Skeleton
                        variant="circular"
                        className="size-10 shrink-0"
                      />
                    </div>
                  </div>
                ))}
                <span className="sr-only">{t('categories.loading')}</span>
              </div>
            )}

            {status === 'error' && (
              <div
                role="alert"
                className="border-y border-border py-10"
              >
                <p className="text-base font-medium text-text-primary">
                  {t('categories.errorTitle')}
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
                  {loadErrorMessage}
                </p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-5 inline-flex min-h-10 items-center border-b border-text-primary/30 text-sm font-medium text-text-primary transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  {t('categories.retry')}
                </button>
              </div>
            )}

            {status === 'ready' && visibleCategories.length === 0 && (
              <div className="border-y border-border py-10">
                <p className="text-base font-medium text-text-primary">
                  {t('categories.emptyTitle')}
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
                  {t('categories.emptyText')}
                </p>
              </div>
            )}

            {status === 'ready' && visibleCategories.length > 0 && (
              <div className="border-t border-border">
                {visibleCategories.map((category) => {
                  const name = getCategoryName(category, locale);
                  const description =
                    getTranslation(
                      category.translations,
                      locale,
                    )?.description || '';
                  const children = Array.isArray(category.children)
                    ? category.children
                        .filter((child) => child?.is_active !== false)
                        .slice(0, 4)
                    : [];
                  const productHref = `/${locale}/products?category_id=${category.id}`;

                  return (
                    <article
                      key={category.id}
                      className="group border-b border-border"
                    >
                      <div className="grid gap-4 py-7 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-10">
                        <div>
                          <h3 className="text-xl font-normal tracking-[-0.025em] text-text-primary sm:text-2xl">
                            <Link
                              href={productHref}
                              className="transition-colors group-hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                            >
                              {name}
                            </Link>
                          </h3>

                          {children.length > 0 && (
                            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                              {children.map((child) => (
                                <li key={child.id}>
                                  <Link
                                    href={`/${locale}/products?category_id=${child.id}`}
                                    className="text-xs text-text-tertiary transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                  >
                                    {getCategoryName(child, locale)}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="flex items-start justify-between gap-6">
                          {description ? (
                            <p className="max-w-md text-sm leading-6 text-text-secondary">
                              {description}
                            </p>
                          ) : (
                            <span aria-hidden="true" />
                          )}

                          <Link
                            href={productHref}
                            aria-label={`${t('categories.viewProducts')}: ${name}`}
                            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-text-secondary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-on focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                          >
                            <Icon
                              name="arrowRight"
                              size="sm"
                              className="rtl:rotate-180"
                              aria-hidden="true"
                            />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default StoreCategories;
