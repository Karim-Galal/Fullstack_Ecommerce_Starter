'use client';

import { useMemo, useState } from 'react';
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
import { AdminResultSummary } from '@/components/admin/shared/AdminPagination';
import { useAdminList } from '@/hooks/useAdminList';
import { getApiErrorMessage } from '@/lib/api-error';
import { getCategoryName, getTranslation } from '@/lib/product';
import { adminCategoryService } from '@/services/admin';
import { useAuthStore } from '@/stores/authStore';

const emptyForm = {
  name_en: '',
  name_ar: '',
  parent_id: '',
  sort_order: '0',
  is_active: true,
};

function flatten(categories, depth = 0) {
  return (categories || []).flatMap((category) => [
    { ...category, depth },
    ...flatten(category.children, depth + 1),
  ]);
}

export function AdminCategoriesPage() {
  const locale = useLocale();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission('categories.view');
  const canCreate = hasPermission('categories.create');
  const canEdit = hasPermission('categories.update');
  const canDelete = hasPermission('categories.delete');

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { items, pagination, status, error, refresh, isRefreshing } = useAdminList({
    fetchPage: adminCategoryService.list,
    query: {},
    enabled: canView,
  });

  const flatCategories = useMemo(() => flatten(items), [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return flatCategories;

    return flatCategories.filter((category) => {
      const names = (category.translations || []).map((translation) =>
        translation.name.toLowerCase()
      );

      return (
        names.some((name) => name.includes(term)) ||
        (category.slug || '').toLowerCase().includes(term)
      );
    });
  }, [flatCategories, search]);

  const parentOptions = useMemo(
    () => [
      { value: '', label: t('categoryParentNone') },
      ...flatCategories
        .filter((category) => category.id !== editing?.id)
        .map((category) => ({
          value: String(category.id),
          label: `${'— '.repeat(category.depth)}${getCategoryName(
            category,
            locale
          )}`,
        })),
    ],
    [flatCategories, editing, locale, t]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (category) => {
    const en = getTranslation(category.translations, 'en');
    const ar = getTranslation(category.translations, 'ar');

    setEditing(category);
    setForm({
      name_en: en?.name || '',
      name_ar: ar?.name || '',
      parent_id: category.parent_id ? String(category.parent_id) : '',
      sort_order: String(category.sort_order ?? 0),
      is_active: Boolean(category.is_active),
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
    if (!form.name_en.trim()) {
      setFieldErrors({ name_en: t('productRequiredField') });
      return;
    }

    const translations = [
      { locale: 'en', name: form.name_en.trim() },
    ];

    if (form.name_ar.trim()) {
      translations.push({ locale: 'ar', name: form.name_ar.trim() });
    }

    const payload = {
      parent_id: form.parent_id ? Number(form.parent_id) : null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
      translations,
    };

    setSaving(true);
    setFormError(null);

    try {
      if (editing) {
        await adminCategoryService.update(editing.id, payload);
        toast({ variant: 'success', description: t('categoryUpdated') });
      } else {
        await adminCategoryService.create(payload);
        toast({ variant: 'success', description: t('categoryCreated') });
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
      await adminCategoryService.delete(deleteTarget.id);
      toast({ variant: 'success', description: t('categoryDeleted') });
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
      label: t('categoryNameEn'),
      render: (category) => (
        <div>
          <span
            className="block font-medium text-text-primary"
            style={{ paddingInlineStart: `${category.depth * 1.25}rem` }}
          >
            {getCategoryName(category, locale) || '—'}
          </span>
          <span className="mt-0.5 block text-xs text-text-tertiary">
            {category.slug}
          </span>
        </div>
      ),
    },
    {
      key: 'parent',
      label: t('categoryParent'),
      render: (category) =>
        category.parent
          ? getCategoryName(category.parent, locale)
          : t('categoryParentNone'),
    },
    {
      key: 'children',
      label: t('categoryChildrenCount'),
      render: (category) => category.children?.length || 0,
    },
    {
      key: 'sort',
      label: t('categorySortOrder'),
      render: (category) => category.sort_order,
    },
    {
      key: 'status',
      label: t('sessionStatus'),
      render: (category) => (
        <AdminStatusBadge
          status={category.is_active ? 'active' : 'inactive'}
          label={category.is_active ? tCommon('active') : tCommon('inactive')}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title={t('categories')}
        description={t('categoriesIntro')}
        actions={
          canCreate ? (
            <Button onClick={openCreate}>{t('categoryCreate')}</Button>
          ) : null
        }
      />

      <section className="rounded-xl border border-border bg-surface p-4">
        <SearchInput
          id="admin-category-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onClear={() => setSearch('')}
          placeholder={t('categoriesSearchPlaceholder')}
          label={t('searchLabel')}
          clearLabel={tCommon('clear')}
          className="w-full max-w-md"
        />
      </section>

      <div className="mt-5">
        <AdminResultSummary
          status={status}
          isRefreshing={isRefreshing}
          pagination={{
            ...pagination,
            total: search ? filtered.length : pagination?.total,
            from: filtered.length ? 1 : null,
            to: filtered.length || null,
          }}
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
        {status === 'loading' && <AdminTableSkeleton columns={5} />}

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

        {status === 'ready' && filtered.length === 0 && (
          <EmptyState
            icon="list"
            title={search ? t('noResults') : t('emptyTitle')}
            description={
              search ? t('emptyFilteredText') : t('categoriesEmptyText')
            }
          />
        )}

        {status === 'ready' && filtered.length > 0 && (
          <AdminTable
            columns={columns}
            items={filtered}
            actions={(category) => (
              <div className="flex justify-end gap-1">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => openEdit(category)}
                  >
                    {tCommon('edit')}
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-error"
                    onClick={() => setDeleteTarget(category)}
                  >
                    {tCommon('delete')}
                  </Button>
                )}
              </div>
            )}
            actionsLabel={t('actions')}
            renderCard={(category) => (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-text-primary">
                    {getCategoryName(category, locale)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-text-tertiary">
                    {category.slug}
                  </p>
                </div>
                <AdminStatusBadge
                  status={category.is_active ? 'active' : 'inactive'}
                  label={
                    category.is_active ? tCommon('active') : tCommon('inactive')
                  }
                />
              </div>
            )}
          />
        )}
      </div>

      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? t('categoryEdit') : t('categoryCreate')}
        size="lg"
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
        <div className="space-y-4">
          {formError && (
            <Alert
              variant="destructive"
              title={t('loadErrorTitle')}
              description={getApiErrorMessage(formError, tCommon)}
            />
          )}

          <Input
            label={t('categoryNameEn')}
            value={form.name_en}
            onChange={(event) => updateField('name_en', event.target.value)}
            error={fieldErrors.name_en}
            hint={t('categoryFormHint')}
            required
          />
          <Input
            label={t('categoryNameAr')}
            value={form.name_ar}
            onChange={(event) => updateField('name_ar', event.target.value)}
            dir="rtl"
          />
          <Select
            label={t('categoryParent')}
            value={form.parent_id}
            options={parentOptions}
            hint={t('categoryParentHint')}
            onChange={(event) => updateField('parent_id', event.target.value)}
          />
          <Input
            label={t('categorySortOrder')}
            type="number"
            min="0"
            value={form.sort_order}
            onChange={(event) =>
              updateField('sort_order', event.target.value)
            }
          />
          <Switch
            checked={form.is_active}
            onChange={(event) =>
              updateField('is_active', event.target.checked)
            }
            label={t('categoryActive')}
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

export default AdminCategoriesPage;
