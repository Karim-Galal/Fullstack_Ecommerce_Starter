'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/overlays/Dialog';
import { ConfirmDialog } from '@/components/ui/overlays/ConfirmDialog';
import { Input, Select } from '@/components/ui/Input';
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
import { AdminProductPicker } from '@/components/admin/shared/AdminProductPicker';
import { useAdminList, useDebouncedValue } from '@/hooks/useAdminList';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDateTime, toDateTimeLocalValue } from '@/lib/date';
import { formatProductPrice } from '@/lib/product';
import { adminOfferService } from '@/services/admin';
import { useAuthStore } from '@/stores/authStore';

const PAGE_SIZE = 20;

const emptyForm = {
  name: '',
  type: 'percentage',
  value: '',
  buy_quantity: '',
  get_quantity: '',
  starts_at: '',
  ends_at: '',
  is_active: true,
  product_ids: [],
};

const OFFER_TYPES = ['percentage', 'fixed', 'buy_x_get_y'];

export function AdminOffersPage() {
  const locale = useLocale();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission('offers.view');
  const canCreate = hasPermission('offers.create');
  const canEdit = hasPermission('offers.update');
  const canDelete = hasPermission('offers.delete');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [activeFilter, setActiveFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [knownProducts, setKnownProducts] = useState([]);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { items, pagination, status, error, page, setPage, refresh, isRefreshing } =
    useAdminList({
      fetchPage: adminOfferService.list,
      query: {
        search: debouncedSearch || undefined,
        is_active: activeFilter || undefined,
        type: typeFilter || undefined,
      },
      enabled: canView,
      perPage: PAGE_SIZE,
    });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setKnownProducts([]);
    setFieldErrors({});
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (offer) => {
    setEditing(offer);
    setForm({
      name: offer.name || '',
      type: offer.type || 'percentage',
      value: offer.value === null || offer.value === undefined ? '' : String(offer.value),
      buy_quantity:
        offer.buy_quantity === null || offer.buy_quantity === undefined
          ? ''
          : String(offer.buy_quantity),
      get_quantity:
        offer.get_quantity === null || offer.get_quantity === undefined
          ? ''
          : String(offer.get_quantity),
      starts_at: toDateTimeLocalValue(offer.starts_at),
      ends_at: toDateTimeLocalValue(offer.ends_at),
      is_active: Boolean(offer.is_active),
      product_ids: (offer.products || []).map((product) => product.id),
    });
    setKnownProducts(offer.products || []);
    setFieldErrors({});
    setFormError(null);
    setDialogOpen(true);
  };

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const toggleProduct = (productId) => {
    setForm((current) => ({
      ...current,
      product_ids: current.product_ids.includes(productId)
        ? current.product_ids.filter((id) => id !== productId)
        : [...current.product_ids, productId],
    }));
  };

  const validate = () => {
    const errors = {};

    if (!form.name.trim()) errors.name = t('productRequiredField');

    if (form.type === 'buy_x_get_y') {
      if (form.buy_quantity === '' || Number(form.buy_quantity) < 1) {
        errors.buy_quantity = t('productRequiredField');
      }
      if (form.get_quantity === '' || Number(form.get_quantity) < 1) {
        errors.get_quantity = t('productRequiredField');
      }
    } else {
      if (form.value === '' || Number(form.value) <= 0) {
        errors.value = t('productRequiredField');
      }
      if (form.type === 'percentage' && Number(form.value) > 100) {
        errors.value = t('offerValueHint');
      }
    }

    if (form.product_ids.length === 0) {
      errors.product_ids = t('offerProductsHint');
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      type: form.type,
      value: form.type === 'buy_x_get_y' ? null : Number(form.value),
      buy_quantity: form.type === 'buy_x_get_y' ? Number(form.buy_quantity) : null,
      get_quantity: form.type === 'buy_x_get_y' ? Number(form.get_quantity) : null,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      is_active: form.is_active,
      product_ids: form.product_ids,
    };

    setSaving(true);
    setFormError(null);

    try {
      if (editing) {
        await adminOfferService.update(editing.id, payload);
        toast({ variant: 'success', description: t('offerUpdated') });
      } else {
        await adminOfferService.create(payload);
        toast({ variant: 'success', description: t('offerCreated') });
      }

      setDialogOpen(false);
      refresh();
    } catch (requestError) {
      setFormError(requestError);

      if (requestError?.errors) {
        setFieldErrors({
          name: requestError.errors.name?.[0],
          value: requestError.errors.value?.[0],
          buy_quantity: requestError.errors.buy_quantity?.[0],
          get_quantity: requestError.errors.get_quantity?.[0],
          product_ids: requestError.errors.product_ids?.[0],
          ends_at: requestError.errors.ends_at?.[0],
        });
      }

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
      await adminOfferService.delete(deleteTarget.id);
      toast({ variant: 'success', description: t('offerDeleted') });
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

  const typeLabel = (type) => {
    if (type === 'fixed') return t('offerTypeFixed');
    if (type === 'buy_x_get_y') return t('offerTypeBuyXGetY');
    return t('offerTypePercentage');
  };

  const formatValue = (offer) => {
    if (offer.type === 'buy_x_get_y') {
      return t('offerTypeBuyXGetY');
    }

    return offer.type === 'percentage'
      ? `${offer.value}%`
      : formatProductPrice(offer.value, locale);
  };

  const columns = [
    {
      key: 'name',
      label: t('offerName'),
      render: (offer) => (
        <span className="font-medium text-text-primary">{offer.name}</span>
      ),
    },
    {
      key: 'type',
      label: t('offerType'),
      render: (offer) => typeLabel(offer.type),
    },
    {
      key: 'value',
      label: t('offerValue'),
      render: (offer) => formatValue(offer),
    },
    {
      key: 'products',
      label: t('offerProducts'),
      render: (offer) => offer.products?.length || 0,
    },
    {
      key: 'ends',
      label: t('offerEndsAt'),
      render: (offer) =>
        offer.ends_at ? formatDateTime(offer.ends_at, locale) : t('notAvailable'),
    },
    {
      key: 'status',
      label: t('sessionStatus'),
      render: (offer) => (
        <AdminStatusBadge
          status={offer.is_active ? 'active' : 'inactive'}
          label={offer.is_active ? tCommon('active') : tCommon('inactive')}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title={t('offers')}
        description={t('offersIntro')}
        actions={canCreate ? <Button onClick={openCreate}>{t('offerCreate')}</Button> : null}
      />

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,11rem)_minmax(0,11rem)]">
          <SearchInput
            id="admin-offer-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            onClear={() => setSearch('')}
            placeholder={t('offersSearchPlaceholder')}
            label={t('searchLabel')}
            clearLabel={tCommon('clear')}
            className="w-full"
          />
          <Select
            id="admin-offer-active"
            label={t('offerActive')}
            value={activeFilter}
            options={[
              { value: '', label: t('offersAllStatuses') },
              { value: '1', label: tCommon('active') },
              { value: '0', label: tCommon('inactive') },
            ]}
            onChange={(event) => {
              setActiveFilter(event.target.value);
              setPage(1);
            }}
          />
          <Select
            id="admin-offer-type"
            label={t('offerType')}
            value={typeFilter}
            options={[
              { value: '', label: t('offersAllTypes') },
              ...OFFER_TYPES.map((type) => ({ value: type, label: typeLabel(type) })),
            ]}
            onChange={(event) => {
              setTypeFilter(event.target.value);
              setPage(1);
            }}
          />
        </div>
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
        {status === 'loading' && <AdminTableSkeleton columns={6} />}

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
            icon="offer"
            title={t('emptyTitle')}
            description={debouncedSearch ? t('emptyFilteredText') : t('offersEmptyText')}
          />
        )}

        {status === 'ready' && items.length > 0 && (
          <>
            <AdminTable
              columns={columns}
              items={items}
              actions={(offer) => (
                <div className="flex justify-end gap-1">
                  {canEdit && (
                    <Button variant="ghost" size="xs" onClick={() => openEdit(offer)}>
                      {tCommon('edit')}
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-error"
                      onClick={() => setDeleteTarget(offer)}
                    >
                      {tCommon('delete')}
                    </Button>
                  )}
                </div>
              )}
              actionsLabel={t('actions')}
              renderCard={(offer) => (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-primary">
                        {offer.name}
                      </p>
                      <p className="mt-0.5 text-xs text-text-tertiary">
                        {typeLabel(offer.type)} · {offer.products?.length || 0}{' '}
                        {t('offerProducts')}
                      </p>
                    </div>
                    <AdminStatusBadge
                      status={offer.is_active ? 'active' : 'inactive'}
                      label={offer.is_active ? tCommon('active') : tCommon('inactive')}
                    />
                  </div>
                  <p className="mt-3 font-semibold text-text-primary">
                    {formatValue(offer)}
                  </p>
                </>
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
        title={editing ? t('offerEdit') : t('offerCreate')}
        size="full"
        closeLabel={tCommon('close')}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
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
            {formError && Object.keys(fieldErrors).every((key) => !fieldErrors[key]) && (
              <Alert
                variant="destructive"
                title={t('loadErrorTitle')}
                description={getApiErrorMessage(formError, tCommon)}
              />
            )}

            <Input
              label={t('offerName')}
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              error={fieldErrors.name}
              required
            />
            <Select
              label={t('offerType')}
              value={form.type}
              options={OFFER_TYPES.map((type) => ({ value: type, label: typeLabel(type) }))}
              onChange={(event) => updateField('type', event.target.value)}
            />

            {form.type === 'buy_x_get_y' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label={t('offerBuyQuantity')}
                  type="number"
                  min="1"
                  step="1"
                  value={form.buy_quantity}
                  onChange={(event) => updateField('buy_quantity', event.target.value)}
                  error={fieldErrors.buy_quantity}
                  required
                />
                <Input
                  label={t('offerGetQuantity')}
                  type="number"
                  min="1"
                  step="1"
                  value={form.get_quantity}
                  onChange={(event) => updateField('get_quantity', event.target.value)}
                  error={fieldErrors.get_quantity}
                  required
                />
              </div>
            ) : (
              <Input
                label={t('offerValue')}
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(event) => updateField('value', event.target.value)}
                error={fieldErrors.value}
                hint={t('offerValueHint')}
                required
              />
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('offerStartsAt')}
                type="datetime-local"
                value={form.starts_at}
                onChange={(event) => updateField('starts_at', event.target.value)}
              />
              <Input
                label={t('offerEndsAt')}
                type="datetime-local"
                value={form.ends_at}
                onChange={(event) => updateField('ends_at', event.target.value)}
                error={fieldErrors.ends_at}
              />
            </div>
            <Switch
              checked={form.is_active}
              onChange={(event) => updateField('is_active', event.target.checked)}
              label={t('offerActive')}
            />
          </div>

          <div className="space-y-2">
            <AdminProductPicker
              selectedIds={form.product_ids}
              onToggle={toggleProduct}
              knownProducts={knownProducts}
              labels={{
                title: t('offerProducts'),
                hint: t('offerProductsHint'),
                searchPlaceholder: t('offerSearchProducts'),
                clear: tCommon('clear'),
                loading: t('loading'),
                error: t('loadErrorText'),
                empty: t('collectionNoProducts'),
                selected: (count) => t('collectionSelectedProducts', { count }),
              }}
            />
            {fieldErrors.product_ids && (
              <p className="text-sm text-error" role="alert">
                {fieldErrors.product_ids}
              </p>
            )}
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

export default AdminOffersPage;
