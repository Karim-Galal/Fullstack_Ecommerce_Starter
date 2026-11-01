'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/overlays/Dialog';
import { ConfirmDialog } from '@/components/ui/overlays/ConfirmDialog';
import { Input, Select, Textarea } from '@/components/ui/Input';
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
import { formatProductPrice } from '@/lib/product';
import { storeConfig } from '@/config/store';
import { adminShippingMethodService } from '@/services/admin';
import { useAuthStore } from '@/stores/authStore';

const PAGE_SIZE = 20;

const emptyForm = {
  name: '',
  description: '',
  price: '',
  is_active: true,
  is_default: false,
};

export function AdminShippingMethodsPage() {
  const locale = useLocale();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission('shipping_methods.view');
  const canCreate = hasPermission('shipping_methods.create');
  const canEdit = hasPermission('shipping_methods.update');
  const canDelete = hasPermission('shipping_methods.delete');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [activeFilter, setActiveFilter] = useState('');
  const [defaultFilter, setDefaultFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { items, pagination, status, error, page, setPage, refresh, isRefreshing } =
    useAdminList({
      fetchPage: adminShippingMethodService.list,
      query: {
        search: debouncedSearch || undefined,
        is_active: activeFilter || undefined,
        is_default: defaultFilter || undefined,
      },
      enabled: canView,
      perPage: PAGE_SIZE,
    });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (method) => {
    setEditing(method);
    setForm({
      name: method.name || '',
      description: method.description || '',
      price: String(method.price ?? ''),
      is_active: Boolean(method.is_active),
      is_default: Boolean(method.is_default),
    });
    setFieldErrors({});
    setFormError(null);
    setDialogOpen(true);
  };

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSave = async () => {
    const errors = {};

    if (!form.name.trim()) errors.name = t('productRequiredField');
    if (form.price === '' || Number(form.price) < 0) {
      errors.price = t('productRequiredField');
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      is_active: form.is_active,
    };

    if (!editing) {
      payload.is_default = form.is_default;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editing) {
        await adminShippingMethodService.update(editing.id, payload);
        toast({ variant: 'success', description: t('shippingUpdated') });
      } else {
        await adminShippingMethodService.create(payload);
        toast({ variant: 'success', description: t('shippingCreated') });
      }

      setDialogOpen(false);
      refresh();
    } catch (requestError) {
      setFormError(requestError);

      if (requestError?.errors) {
        setFieldErrors({
          name: requestError.errors.name?.[0],
          price: requestError.errors.price?.[0],
          is_active: requestError.errors.is_active?.[0],
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

  const handleSetDefault = async (method) => {
    setSettingDefaultId(method.id);

    try {
      await adminShippingMethodService.setDefault(method.id);
      toast({ variant: 'success', description: t('shippingDefaultSuccess') });
      refresh();
    } catch (requestError) {
      toast({
        variant: 'destructive',
        description: getApiErrorMessage(requestError, tCommon),
      });
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await adminShippingMethodService.delete(deleteTarget.id);
      toast({ variant: 'success', description: t('shippingDeleted') });
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
      label: t('shippingName'),
      render: (method) => (
        <div>
          <span className="block font-medium text-text-primary">{method.name}</span>
          {method.description && (
            <span className="mt-0.5 block max-w-[24rem] truncate text-xs text-text-tertiary">
              {method.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'price',
      label: t('shippingPrice'),
      cellClassName: 'whitespace-nowrap font-medium text-text-primary',
      render: (method) => formatProductPrice(method.price, locale),
    },
    {
      key: 'default',
      label: t('shippingDefault'),
      render: (method) =>
        method.is_default ? (
          <AdminStatusBadge status="active" label={t('shippingDefault')} />
        ) : (
          <span className="text-text-tertiary">{t('none')}</span>
        ),
    },
    {
      key: 'status',
      label: t('sessionStatus'),
      render: (method) => (
        <AdminStatusBadge
          status={method.is_active ? 'active' : 'inactive'}
          label={method.is_active ? tCommon('active') : tCommon('inactive')}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title={t('shippingMethods')}
        description={t('shippingIntro')}
        actions={canCreate ? <Button onClick={openCreate}>{t('shippingCreate')}</Button> : null}
      />

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,11rem)_minmax(0,11rem)]">
          <SearchInput
            id="admin-shipping-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            onClear={() => setSearch('')}
            placeholder={t('shippingSearchPlaceholder')}
            label={t('searchLabel')}
            clearLabel={tCommon('clear')}
            className="w-full"
          />
          <Select
            id="admin-shipping-active"
            label={t('shippingActive')}
            value={activeFilter}
            options={[
              { value: '', label: t('shippingAllStatuses') },
              { value: '1', label: tCommon('active') },
              { value: '0', label: tCommon('inactive') },
            ]}
            onChange={(event) => {
              setActiveFilter(event.target.value);
              setPage(1);
            }}
          />
          <Select
            id="admin-shipping-default"
            label={t('shippingDefaultFilter')}
            value={defaultFilter}
            options={[
              { value: '', label: t('shippingAnyDefault') },
              { value: '1', label: t('shippingOnlyDefault') },
              { value: '0', label: t('shippingNotDefault') },
            ]}
            onChange={(event) => {
              setDefaultFilter(event.target.value);
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
            icon="shipping"
            title={t('emptyTitle')}
            description={
              debouncedSearch || activeFilter || defaultFilter
                ? t('emptyFilteredText')
                : t('shippingEmptyText')
            }
          />
        )}

        {status === 'ready' && items.length > 0 && (
          <>
            <AdminTable
              columns={columns}
              items={items}
              actions={(method) => (
                <div className="flex flex-wrap justify-end gap-1">
                  {canEdit && !method.is_default && method.is_active && (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleSetDefault(method)}
                      loading={settingDefaultId === method.id}
                    >
                      {t('shippingSetDefault')}
                    </Button>
                  )}
                  {canEdit && (
                    <Button variant="ghost" size="xs" onClick={() => openEdit(method)}>
                      {tCommon('edit')}
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-error"
                      onClick={() => setDeleteTarget(method)}
                    >
                      {tCommon('delete')}
                    </Button>
                  )}
                </div>
              )}
              actionsLabel={t('actions')}
              renderCard={(method) => (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-primary">
                        {method.name}
                      </p>
                      {method.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-text-tertiary">
                          {method.description}
                        </p>
                      )}
                    </div>
                    <AdminStatusBadge
                      status={method.is_active ? 'active' : 'inactive'}
                      label={method.is_active ? tCommon('active') : tCommon('inactive')}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="font-semibold text-text-primary">
                      {formatProductPrice(method.price, locale)}
                    </p>
                    {method.is_default && (
                      <AdminStatusBadge status="active" label={t('shippingDefault')} />
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                    {canEdit && !method.is_default && method.is_active && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleSetDefault(method)}
                        loading={settingDefaultId === method.id}
                      >
                        {t('shippingSetDefault')}
                      </Button>
                    )}
                    {canEdit && (
                      <Button variant="ghost" size="xs" onClick={() => openEdit(method)}>
                        {tCommon('edit')}
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-error"
                        onClick={() => setDeleteTarget(method)}
                      >
                        {tCommon('delete')}
                      </Button>
                    )}
                  </div>
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
        title={editing ? t('shippingEdit') : t('shippingCreate')}
        size="lg"
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
        <div className="space-y-4">
          {formError && (
            <Alert
              variant="destructive"
              title={t('loadErrorTitle')}
              description={getApiErrorMessage(formError, tCommon)}
            />
          )}

          <Input
            label={t('shippingName')}
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            error={fieldErrors.name}
            required
          />
          <Textarea
            label={t('shippingDescription')}
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            hint={t('shippingDescriptionHint')}
            rows={3}
          />
          <Input
            label={t('shippingPrice')}
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(event) => updateField('price', event.target.value)}
            error={fieldErrors.price}
            hint={t('shippingPriceHint', { currency: storeConfig.currency })}
            required
          />
          <Switch
            checked={form.is_active}
            onChange={(event) => updateField('is_active', event.target.checked)}
            label={t('shippingActive')}
            description={
              editing?.is_default ? t('shippingDefault') : undefined
            }
          />
          {!editing && (
            <Switch
              checked={form.is_default}
              onChange={(event) => updateField('is_default', event.target.checked)}
              label={t('shippingIsDefault')}
            />
          )}
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

export default AdminShippingMethodsPage;
