'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/navigation/Breadcrumbs';
import { Pagination } from '@/components/ui/navigation/Pagination';
import { EmptyState } from '@/components/ui/data-display/EmptyState';
import { Icon } from '@/components/icons';
import { collectionService } from '@/services/catalog';
import {
  getCollectionDescription,
  getCollectionName,
  getProductImage,
} from '@/lib/product';

export function CollectionsPage() {
  const locale = useLocale();
  const t = useTranslations('catalog');
  const tNav = useTranslations('navigation');

  const [collections, setCollections] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('loading');

  const loadCollections = useCallback(() => {
    collectionService
      .list({ page, per_page: 12 })
      .then((response) => {
        setCollections(Array.isArray(response?.data) ? response.data : []);
        setPagination({
          currentPage: Number(response?.current_page || 1),
          lastPage: Number(response?.last_page || 1),
        });
        setStatus('ready');
      })
      .catch(() => {
        setCollections([]);
        setPagination(null);
        setStatus('error');
      });
  }, [page]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const handleRetry = () => {
    setStatus('loading');
    loadCollections();
  };

  const handlePageChange = (nextPage) => {
    setStatus('loading');
    setPage(nextPage);
  };

  const breadcrumbItems = [
    { href: `/${locale}`, label: tNav('home') },
    { label: tNav('collections') },
  ];

  return (
    <div className="shell py-10 sm:py-14">
      <Breadcrumbs items={breadcrumbItems} className="mb-8 text-sm" />

      <header className="max-w-2xl">
        <p className="eyebrow">{t('collectionsPage.eyebrow')}</p>
        <h1 className="mt-4 text-4xl font-normal tracking-[-0.035em] text-text-primary sm:text-5xl">
          {t('collectionsPage.title')}
        </h1>
        <p className="mt-4 text-sm leading-7 text-text-secondary sm:text-base">
          {t('collectionsPage.description')}
        </p>
      </header>

      <div className="mt-10">
        {status === 'loading' && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="aspect-[4/3] animate-pulse rounded-2xl border border-border bg-surface-sunken motion-reduce:animate-none"
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
              {t('collectionsPage.errorTitle')}
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-6 rounded-full px-6"
              onClick={handleRetry}
            >
              {t('collectionsPage.retry')}
            </Button>
          </div>
        )}

        {status === 'ready' && collections.length === 0 && (
          <EmptyState
            icon="layers"
            title={t('collectionsPage.emptyTitle')}
            description={t('collectionsPage.emptyText')}
          />
        )}

        {status === 'ready' && collections.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => {
                const name = getCollectionName(collection, locale);
                const description = getCollectionDescription(collection, locale);
                const products = Array.isArray(collection.products)
                  ? collection.products
                  : [];
                const imageUrl = getProductImage(products[0], 'card');
                const href = `/${locale}/collections/${encodeURIComponent(
                  `${collection.slug}-${collection.id}`,
                )}`;

                return (
                  <article
                    key={collection.id}
                    className="group overflow-hidden rounded-2xl border border-border bg-surface-elevated transition-colors hover:border-border-strong"
                  >
                    <Link
                      href={href}
                      className="block aspect-[4/3] overflow-hidden bg-surface-sunken"
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          <span
                            aria-hidden="true"
                            className="block size-16 rounded-full border-[7px] border-[#d3ccc0]"
                          />
                        </span>
                      )}
                    </Link>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <h2 className="text-xl font-normal tracking-[-0.02em] text-text-primary">
                          <Link href={href} className="hover:text-accent">
                            {name}
                          </Link>
                        </h2>
                        <span className="shrink-0 text-xs text-text-tertiary">
                          {t('collectionsPage.pieces', {
                            count: products.length,
                          })}
                        </span>
                      </div>

                      {description && (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-text-secondary">
                          {description}
                        </p>
                      )}

                      <Link
                        href={href}
                        className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-text-primary underline-offset-4 hover:underline"
                      >
                        {t('collectionsPage.viewCollection')}
                        <Icon
                          name="arrowRight"
                          size="sm"
                          className="rtl:rotate-180"
                        />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <Pagination
              className="mt-10 flex justify-center"
              currentPage={pagination?.currentPage || 1}
              totalPages={pagination?.lastPage || 1}
              onPageChange={handlePageChange}
              labels={{
                previous: t('previous'),
                next: t('next'),
                page: t('page'),
                first: t('first'),
                last: t('last'),
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default CollectionsPage;
