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
import { adminCouponService } from '@/services/admin';
import { useAuthStore } from '@/stores/authStore';

const PAGE_SIZE = 20;

const emptyForm = {
  code: '',
  discount_type: 'percentage',
  discount_amount: '',
  minimum_order: '',
  usage_limit: '',
  starts_at: '',
  expires_at: '',
  is_active: true,
  product_ids: [],
};

export function AdminCouponsPage() {
  const locale = useLocale();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission('coupons.view');
  const canCreate = hasPermission('coupons.create');
  const canEdit = hasPermission('coupons.update');
  const canDelete = hasPermission('coupons.delete');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [activeFilter, setActiveFilter] = useState('');
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
      fetchPage: adminCouponService.list,
      query: {
        search: debouncedSearch || undefined,
        is_active: activeFilter || undefined,
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

  const openEdit = (coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code || '',
      discount_type: coupon.discount_type || 'percentage',
      discount_amount: String(coupon.discount_amount ?? ''),
      minimum_order:
        coupon.minimum_order === null || coupon.minimum_order === undefined
          ? ''
          : String(coupon.minimum_order),
      usage_limit:
        coupon.usage_limit === null || coupon.usage_limit === undefined
          ? ''
          : String(coupon.usage_limit),
      starts_at: toDateTimeLocalValue(coupon.starts_at),
      expires_at: toDateTimeLocalValue(coupon.expires_at),
      is_active: Boolean(coupon.is_active),
      product_ids: (coupon.products || []).map((product) => product.id),
    });
    setKnownProducts(coupon.products || []);
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

    if (!form.code.trim()) errors.code = t('productRequiredField');
    if (form.discount_amount === '' || Number(form.discount_amount) <= 0) {
      errors.discount_amount = t('productRequiredField');
    }
    if (
      form.discount_type === 'percentage' &&
      Number(form.discount_amount) > 100
    ) {
      errors.discount_amount = t('couponValueHint');
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      code: form.code.trim(),
      discount_type: form.discount_type,
      discount_amount: Number(form.discount_amount),
      minimum_order: form.minimum_order === '' ? null : Number(form.minimum_order),
      usage_limit: form.usage_limit === '' ? null : Number(form.usage_limit),
      starts_at: form.starts_at || null,
      expires_at: form.expires_at || null,
      is_active: form.is_active,
    };

    if (editing) {
      payload.product_ids = form.product_ids;
    } else if (form.product_ids.length > 0) {
      payload.product_ids = form.product_ids;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editing) {
        await adminCouponService.update(editing.id, payload);
        toast({ variant: 'success', description: t('couponUpdated') });
      } else {
        await adminCouponService.create(payload);
        toast({ variant: 'success', description: t('couponCreated') });
      }

      setDialogOpen(false);
      refresh();
    } catch (requestError) {
      setFormError(requestError);

      if (requestError?.errors) {
        setFieldErrors({
          code: requestError.errors.code?.[0],
          discount_amount: requestError.errors.discount_amount?.[0],
          expires_at: requestError.errors.expires_at?.[0],
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
      await adminCouponService.delete(deleteTarget.id);
      toast({ variant: 'success', description: t('couponDeleted') });
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

  const formatDiscount = (coupon) =>
    coupon.discount_type === 'percentage'
      ? `${coupon.discount_amount}%`
      : formatProductPrice(coupon.discount_amount, locale);

  const columns = [
    {
      key: 'code',
      label: t('couponCode'),
      render: (coupon) => (
        <span className="font-mono font-medium text-text-primary">
          {coupon.code}
        </span>
      ),
    },
    {
      key: 'discount',
      label: t('couponValue'),
      render: (coupon) => formatDiscount(coupon),
    },
    {
      key: 'type',
      label: t('couponType'),
      render: (coupon) =>
        coupon.discount_type === 'percentage'
          ? t('couponTypePercentage')
          : t('couponTypeFixed'),
    },
    {
      key: 'usage',
      label: t('couponUsedCount'),
      render: (coupon) =>
        `${coupon.used_count || 0} / ${
          coupon.usage_limit ?? t('couponUnlimited')
        }`,
    },
    {
      key: 'expires',
      label: t('couponExpiresAt'),
      render: (coupon) =>
        coupon.expires_at
          ? formatDateTime(coupon.expires_at, locale)
          : t('couponNoExpiry'),
    },
    {
      key: 'status',
      label: t('sessionStatus'),
      render: (coupon) => (
        <AdminStatusBadge
          status={coupon.is_active ? 'active' : 'inactive'}
          label={coupon.is_active ? tCommon('active') : tCommon('inactive')}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title={t('coupons')}
        description={t('couponsIntro')}
        actions={canCreate ? <Button onClick={openCreate}>{t('couponCreate')}</Button> : null}
      />

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,12rem)]">
          <SearchInput
            id="admin-coupon-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            onClear={() => setSearch('')}
            placeholder={t('couponsSearchPlaceholder')}
            label={t('searchLabel')}
            clearLabel={tCommon('clear')}
            className="w-full"
          />
          <Select
            id="admin-coupon-active"
            label={t('couponActive')}
            value={activeFilter}
            options={[
              { value: '', label: t('couponsAllStatuses') },
              { value: '1', label: tCommon('active') },
              { value: '0', label: tCommon('inactive') },
            ]}
            onChange={(event) => {
              setActiveFilter(event.target.value);
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
            icon="discount"
            title={t('emptyTitle')}
            description={debouncedSearch ? t('emptyFilteredText') : t('couponsEmptyText')}
          />
        )}

        {status === 'ready' && items.length > 0 && (
          <>
            <AdminTable
              columns={columns}
              items={items}
              actions={(coupon) => (
                <div className="flex justify-end gap-1">
                  {canEdit && (
                    <Button variant="ghost" size="xs" onClick={() => openEdit(coupon)}>
                      {tCommon('edit')}
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-error"
                      onClick={() => setDeleteTarget(coupon)}
                    >
                      {tCommon('delete')}
                    </Button>
                  )}
                </div>
              )}
              actionsLabel={t('actions')}
              renderCard={(coupon) => (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono font-medium text-text-primary">
                        {coupon.code}
                      </p>
                      <p className="mt-0.5 text-xs text-text-tertiary">
                        {coupon.discount_type === 'percentage'
                          ? t('couponTypePercentage')
                          : t('couponTypeFixed')}
                      </p>
                    </div>
                    <AdminStatusBadge
                      status={coupon.is_active ? 'active' : 'inactive'}
                      label={coupon.is_active ? tCommon('active') : tCommon('inactive')}
                    />
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="font-semibold text-text-primary">
                      {formatDiscount(coupon)}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {coupon.expires_at
                        ? formatDateTime(coupon.expires_at, locale)
                        : t('couponNoExpiry')}
                    </p>
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
        title={editing ? t('couponEdit') : t('couponCreate')}
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
              label={t('couponCode')}
              value={form.code}
              onChange={(event) => updateField('code', event.target.value)}
              error={fieldErrors.code}
              dir="ltr"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label={t('couponType')}
                value={form.discount_type}
                options={[
                  { value: 'percentage', label: t('couponTypePercentage') },
                  { value: 'fixed', label: t('couponTypeFixed') },
                ]}
                onChange={(event) => updateField('discount_type', event.target.value)}
              />
              <Input
                label={t('couponValue')}
                type="number"
                min="0"
                step="0.01"
                value={form.discount_amount}
                onChange={(event) => updateField('discount_amount', event.target.value)}
                error={fieldErrors.discount_amount}
                hint={t('couponValueHint')}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('couponMinimumOrder')}
                type="number"
                min="0"
                step="0.01"
                value={form.minimum_order}
                onChange={(event) => updateField('minimum_order', event.target.value)}
              />
              <Input
                label={t('couponUsageLimit')}
                type="number"
                min="1"
                step="1"
                value={form.usage_limit}
                onChange={(event) => updateField('usage_limit', event.target.value)}
                hint={t('couponUsageLimitHint')}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('couponStartsAt')}
                type="datetime-local"
                value={form.starts_at}
                onChange={(event) => updateField('starts_at', event.target.value)}
              />
              <Input
                label={t('couponExpiresAt')}
                type="datetime-local"
                value={form.expires_at}
                onChange={(event) => updateField('expires_at', event.target.value)}
                error={fieldErrors.expires_at}
              />
            </div>
            <Switch
              checked={form.is_active}
              onChange={(event) => updateField('is_active', event.target.checked)}
              label={t('couponActive')}
            />
          </div>

          <AdminProductPicker
            selectedIds={form.product_ids}
            onToggle={toggleProduct}
            knownProducts={knownProducts}
            labels={{
              title: t('couponProducts'),
              hint: t('couponProductsHint'),
              searchPlaceholder: t('couponSearchProducts'),
              clear: tCommon('clear'),
              loading: t('loading'),
              error: t('loadErrorText'),
              empty: t('collectionNoProducts'),
              selected: (count) => t('collectionSelectedProducts', { count }),
            }}
          />
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

export default AdminCouponsPage;
