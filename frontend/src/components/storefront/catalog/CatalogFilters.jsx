'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Checkbox, Select } from '@/components/ui/Input';
import { Icon } from '@/components/icons';

function createDraft(filters = {}) {
  return {
    category_id: filters.category_id || '',
    collection_id: filters.collection_id || '',
    min_price: filters.min_price || '',
    max_price: filters.max_price || '',
    in_stock: filters.in_stock === '1',
  };
}

export default function CatalogFilters({
  filters,
  categoryOptions,
  collectionOptions,
  onApply,
  onClear,
}) {
  const t = useTranslations('catalog');

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(() => createDraft(filters));

  const closeAndApply = useCallback(() => {
    onApply(draft);
    setIsOpen(false);
  }, [draft, onApply]);

  const handleOpen = () => {
    setDraft(createDraft(filters));
    setIsOpen(true);
  };

  const handleClear = () => {
    const clearedDraft = {
      category_id: '',
      collection_id: '',
      min_price: '',
      max_price: '',
      in_stock: false,
    };

    setDraft(clearedDraft);
    onClear();
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeAndApply();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeAndApply]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="md"
        className="shrink-0 gap-2 rounded-xl"
        onClick={handleOpen}
        aria-label={t('filtersTitle')}
        aria-expanded={isOpen}
      >
        <Icon name="filter" size="sm" />
        <span className="hidden sm:inline">{t('filtersTitle')}</span>
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/45 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAndApply();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-filters-title"
            className={[
              'fixed inset-y-0 end-0 z-[var(--z-modal)]',
              'flex w-full max-w-md flex-col',
              'border-s border-border bg-surface shadow-2xl',
              'animate-in slide-in-from-right duration-200',
              'md:inset-y-auto md:start-1/2 md:top-1/2 md:end-auto',
              'md:max-h-[min(85vh,48rem)] md:w-[min(92vw,32rem)]',
              'md:-translate-x-1/2 md:-translate-y-1/2',
              'md:rounded-2xl md:border md:animate-in md:zoom-in-95',
            ].join(' ')}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <h2
                  id="catalog-filters-title"
                  className="text-lg font-semibold text-text-primary"
                >
                  {t('filtersTitle')}
                </h2>

                <p className="mt-1 text-sm text-text-secondary">
                  {t('description')}
                </p>
              </div>

              <button
                type="button"
                onClick={closeAndApply}
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                aria-label={t('closeFilters') || 'Close filters'}
              >
                <Icon name="close" size="md" />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
              <Select
                label={t('category')}
                value={draft.category_id}
                options={categoryOptions}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    category_id: event.target.value,
                  }))
                }
              />

              <Select
                label={t('collection')}
                value={draft.collection_id}
                options={collectionOptions}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    collection_id: event.target.value,
                  }))
                }
              />

              <fieldset>
                <legend className="mb-3 text-sm font-medium text-text-primary">
                  {t('price')}
                </legend>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs text-text-secondary">
                      {t('minPrice')}
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={draft.min_price}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          min_price: event.target.value,
                        }))
                      }
                      placeholder={t('minPrice')}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs text-text-secondary">
                      {t('maxPrice')}
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={draft.max_price}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          max_price: event.target.value,
                        }))
                      }
                      placeholder={t('maxPrice')}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </label>
                </div>
              </fieldset>

              <div className="rounded-xl border border-border bg-surface-elevated p-4">
                <Checkbox
                  label={t('inStockOnly')}
                  checked={draft.in_stock}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      in_stock: event.target.checked,
                    }))
                  }
                />
              </div>
            </div>

            <footer className="flex items-center gap-3 border-t border-border bg-surface px-5 py-4">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={handleClear}
              >
                {t('clearFilters')}
              </Button>

              <Button
                type="button"
                className="flex-1"
                onClick={closeAndApply}
              >
                {t('apply')}
              </Button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}