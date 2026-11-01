'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/overlays/Dialog';
import { ConfirmDialog } from '@/components/ui/overlays/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/forms/Switch';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { EmptyState } from '@/components/ui/data-display/EmptyState';
import { useToast } from '@/components/ui/feedback/ToastProvider';
import {
  AdminPageHeader,
  AdminPermissionDenied,
} from '@/components/admin/shared/AdminPageHeader';
import {
  AdminStatusBadge,
  AdminTable,
  AdminTableSkeleton,
} from '@/components/admin/shared/AdminTable';
import {
  AdminPaginationBar,
  AdminResultSummary,
} from '@/components/admin/shared/AdminPagination';
import { useAdminList, useDebouncedValue } from '@/hooks/useAdminList';
import { getApiErrorMessage } from '@/lib/api-error';
import { getCollectionName, getProductName, getTranslation } from '@/lib/product';
import {
  adminCollectionService,
  adminProductService,
} from '@/services/admin';
import { useAuthStore } from '@/stores/authStore';

const PAGE_SIZE = 15;

const emptyForm = {
  name_en: '',
  name_ar: '',
  description_en: '',
  description_ar: '',
  slug: '',
  sort_order: '0',
  is_active: true,
  product_ids: [],
};

export function AdminCollectionsPage() {
  const locale = useLocale();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission('collections.view');
  const canCreate = hasPermission('collections.create');
  const canEdit = hasPermission('collections.update');
  const canDelete = hasPermission('collections.delete');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');

  const { items, pagination, status, error, page, setPage, refresh, isRefreshing } =
    useAdminList({
      fetchPage: adminCollectionService.list,
      query: { search: debouncedSearch || undefined },
      enabled: canView,
      perPage: PAGE_SIZE,
    });

  useEffect(() => {
    if (!dialogOpen || products.length > 0) return;

    adminProductService
      .list({ per_page: 100, is_active: 1 })
      .then((response) => setProducts(response?.data || []))
      .catch(() => setProducts([]));
  }, [dialogOpen, products.length]);

  const visibleProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();

    if (!term) return products;

    return products.filter((product) =>
      `${getProductName(product, locale)} ${product.sku || ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [products, productSearch, locale]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setProductSearch('');
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (collection) => {
    const en = getTranslation(collection.translations, 'en');
    const ar = getTranslation(collection.translations, 'ar');

    setEditing(collection);
    setForm({
      name_en: en?.name || '',
      name_ar: ar?.name || '',
      description_en: en?.description || '',
      description_ar: ar?.description || '',
      slug: collection.slug || '',
      sort_order: String(collection.sort_order ?? 0),
      is_active: Boolean(collection.is_active),
      product_ids: (collection.products || []).map((product) => product.id),
    });
    setProductSearch('');
    setFormError(null);
    setDialogOpen(true);
  };

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleProduct = (productId) => {
    setForm((current) => ({
      ...current,
      product_ids: current.product_ids.includes(productId)
        ? current.product_ids.filter((id) => id !== productId)
        : [...current.product_ids, productId],
    }));
  };

  const handleSave = async () => {
    if (!form.name_en.trim()) {
      toast({
        variant: 'destructive',
        description: t('productRequiredField'),
      });
      return;
    }

    const translations = [
      {
        locale: 'en',
        name: form.name_en.trim(),
        description: form.description_en.trim() || null,
      },
    ];

    if (form.name_ar.trim()) {
      translations.push({
        locale: 'ar',
        name: form.name_ar.trim(),
        description: form.description_ar.trim() || null,
      });
    }

    const payload = {
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
      translations,
      product_ids: form.product_ids,
      ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
    };

    setSaving(true);
    setFormError(null);

    try {
      if (editing) {
        await adminCollectionService.update(editing.id, payload);
        toast({ variant: 'success', description: t('collectionUpdated') });
      } else {
        await adminCollectionService.create(payload);
        toast({ variant: 'success', description: t('collectionCreated') });
      }

      setDialogOpen(false);
      refresh();
    } catch (requestError) {
      setFormError(requestError);
      toast({
        variant: 'destructive',
        description: getApiErrorMessage(requestError, tCommon),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await adminCollectionService.delete(deleteTarget.id);
      toast({ variant: 'success', description: t('collectionDeleted') });
      setDeleteTarget(null);
      refresh();
    } catch (requestError) {
      toast({
        variant: 'destructive',
        description: getApiErrorMessage(requestError, tCommon),
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!canView) {
    return (
      <AdminPermissionDenied
        title={t('noAccessTitle')}
        description={t('noAccessText')}
      />
    );
  }

  const columns = [
    {
      key: 'name',
      label: t('collectionNameEn'),
      render: (collection) => (
        <div>
          <span className="block font-medium text-text-primary">
            {getCollectionName(collection, locale) || '—'}
          </span>
          <span className="mt-0.5 block text-xs text-text-tertiary">
            {collection.slug}
          </span>
        </div>
      ),
    },
    {
      key: 'products',
      label: t('collectionProducts'),
      render: (collection) => collection.products?.length || 0,
    },
    {
      key: 'sort',
      label: t('collectionSortOrder'),
      render: (collection) => collection.sort_order,
    },
    {
      key: 'status',
      label: t('sessionStatus'),
      render: (collection) => (
        <AdminStatusBadge
          status={collection.is_active ? 'active' : 'inactive'}
          label={collection.is_active ? tCommon('active') : tCommon('inactive')}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title={t('collections')}
        description={t('collectionsIntro')}
        actions={
          canCreate ? (
            <Button onClick={openCreate}>{t('collectionCreate')}</Button>
          ) : null
        }
      />

      <section className="rounded-xl border border-border bg-surface p-4">
        <SearchInput
          id="admin-collection-search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          onClear={() => setSearch('')}
          placeholder={t('collectionsSearchPlaceholder')}
          label={t('searchLabel')}
          clearLabel={tCommon('clear')}
          className="w-full max-w-md"
        />
      </section>

      <div className="mt-5">
        <AdminResultSummary
          status={status}
          isRefreshing={isRefreshing}
          pagination={pagination}
          labels={{
            loading: t('loading'),
            error: t('loadErrorTitle'),
            showing: t('showingResults'),
            noResults: t('noResults'),
            refreshing: tCommon('loading'),
          }}
        />
      </div>

      <div className="mt-3">
        {status === 'loading' && <AdminTableSkeleton columns={4} />}

        {status === 'error' && (
          <Alert
            variant="destructive"
            title={t('loadErrorTitle')}
            description={getApiErrorMessage(error, tCommon, t('loadErrorText'))}
          >
            <Button variant="outline" size="sm" onClick={refresh}>
              {tCommon('retry')}
            </Button>
          </Alert>
        )}

        {status === 'ready' && items.length === 0 && (
          <EmptyState
            icon="layers"
            title={debouncedSearch ? t('noResults') : t('emptyTitle')}
            description={
              debouncedSearch ? t('emptyFilteredText') : t('collectionsEmptyText')
            }
          />
        )}

        {status === 'ready' && items.length > 0 && (
          <>
            <AdminTable
              columns={columns}
              items={items}
              actions={(collection) => (
                <div className="flex justify-end gap-1">
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => openEdit(collection)}
                    >
                      {tCommon('edit')}
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-error"
                      onClick={() => setDeleteTarget(collection)}
                    >
                      {tCommon('delete')}
                    </Button>
                  )}
                </div>
              )}
              actionsLabel={t('actions')}
              renderCard={(collection) => (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary">
                      {getCollectionName(collection, locale)}
                    </p>
                    <p className="mt-0.5 text-xs text-text-tertiary">
                      {t('collectionProducts')}: {collection.products?.length || 0}
                    </p>
                  </div>
                  <AdminStatusBadge
                    status={collection.is_active ? 'active' : 'inactive'}
                    label={
                      collection.is_active
                        ? tCommon('active')
                        : tCommon('inactive')
                    }
                  />
                </div>
              )}
            />

            <AdminPaginationBar
              pagination={pagination}
              onPageChange={setPage}
              labels={{
                previous: tCommon('previous'),
                next: tCommon('next'),
                page: t('page'),
                first: t('firstPage'),
                last: t('lastPage'),
              }}
            />
          </>
        )}
      </div>

      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? t('collectionEdit') : t('collectionCreate')}
        size="full"
        closeLabel={tCommon('close')}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {tCommon('save')}
            </Button>
          </div>
        }
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            {formError && (
              <Alert
                variant="destructive"
                title={t('loadErrorTitle')}
                description={getApiErrorMessage(formError, tCommon)}
              />
            )}

            <Input
              label={t('collectionNameEn')}
              value={form.name_en}
              onChange={(event) => updateField('name_en', event.target.value)}
              required
            />
            <Input
              label={t('collectionNameAr')}
              value={form.name_ar}
              onChange={(event) => updateField('name_ar', event.target.value)}
              dir="rtl"
            />
            <Input
              label={t('collectionDescriptionEn')}
              value={form.description_en}
              onChange={(event) =>
                updateField('description_en', event.target.value)
              }
            />
            <Input
              label={t('collectionDescriptionAr')}
              value={form.description_ar}
              onChange={(event) =>
                updateField('description_ar', event.target.value)
              }
              dir="rtl"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('collectionSlug')}
                value={form.slug}
                onChange={(event) => updateField('slug', event.target.value)}
                dir="ltr"
              />
              <Input
                label={t('collectionSortOrder')}
                type="number"
                min="0"
                value={form.sort_order}
                onChange={(event) =>
                  updateField('sort_order', event.target.value)
                }
              />
            </div>
            <Switch
              checked={form.is_active}
              onChange={(event) =>
                updateField('is_active', event.target.checked)
              }
              label={t('collectionActive')}
            />
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-medium text-text-primary">
                {t('collectionProductAssignment')}
              </h3>
              <span className="text-sm text-text-tertiary">
                {t('collectionSelectedProducts', {
                  count: form.product_ids.length,
                })}
              </span>
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              {t('collectionProductHint')}
            </p>

            <div className="mt-3">
              <SearchInput
                id="admin-collection-product-search"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                onClear={() => setProductSearch('')}
                placeholder={t('collectionSearchProducts')}
                label={t('collectionSearchProducts')}
                clearLabel={tCommon('clear')}
                className="w-full"
              />
            </div>

            <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto">
              {visibleProducts.length === 0 && (
                <li className="p-3 text-sm text-text-tertiary">
                  {t('collectionNoProducts')}
                </li>
              )}
              {visibleProducts.map((product) => (
                <li key={product.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-hover">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                      checked={form.product_ids.includes(product.id)}
                      onChange={() => toggleProduct(product.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-text-primary">
                        {getProductName(product, locale)}
                      </span>
                      <span className="block truncate text-xs text-text-tertiary">
                        {product.sku}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('confirmTitle')}
        description={t('confirmDeleteText')}
        confirmText={tCommon('delete')}
        cancelText={tCommon('cancel')}
        variant="destructive"
        isLoading={deleting}
      />
    </div>
  );
}

export default AdminCollectionsPage;
