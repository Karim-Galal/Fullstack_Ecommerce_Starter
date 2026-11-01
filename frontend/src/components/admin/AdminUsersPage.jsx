'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/overlays/Dialog';
import { ConfirmDialog } from '@/components/ui/overlays/ConfirmDialog';
import { Input, Select } from '@/components/ui/Input';
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
import { formatDate } from '@/lib/date';
import {
  adminPermissionOptions,
  adminUserService,
} from '@/services/admin';
import { useAuthStore } from '@/stores/authStore';

const PAGE_SIZE = 20;
const ROLES = ['master_admin', 'staff', 'customer'];
const STATUSES = ['active', 'inactive', 'pending_approval'];

const emptyForm = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'staff',
  status: 'active',
  permissions: [],
};

const permissionModuleLabels = {
  products: 'products',
  categories: 'categories',
  collections: 'collections',
  offers: 'offers',
  coupons: 'coupons',
  reviews: 'reviews',
  shipping_methods: 'shippingMethods',
  orders: 'orders',
  payments: 'payments',
  invoices: 'invoices',
  users: 'users',
  addresses: 'addresses',
  wishlists: 'wishlists',
};

const permissionActionLabels = {
  view: 'permissionView',
  create: 'permissionCreate',
  update: 'permissionUpdate',
  delete: 'permissionDelete',
  refund: 'permissionRefund',
};

function groupPermissions() {
  const groups = new Map();

  adminPermissionOptions.forEach((permission) => {
    const [module, action] = permission.split('.');
    if (!groups.has(module)) groups.set(module, []);
    groups.get(module).push({ permission, action });
  });

  return Array.from(groups.entries());
}

const PERMISSION_GROUPS = groupPermissions();

export function AdminUsersPage() {
  const locale = useLocale();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const currentUser = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission('users.view');
  const canManage = currentUser?.role === 'master_admin';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [actionUserId, setActionUserId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { items, pagination, status, error, page, setPage, refresh, isRefreshing } =
    useAdminList({
      fetchPage: adminUserService.list,
      query: {
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
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

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      password_confirmation: '',
      role: user.role === 'master_admin' ? 'staff' : user.role || 'staff',
      status: user.status === 'pending_approval' ? 'inactive' : user.status || 'active',
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
    });
    setFieldErrors({});
    setFormError(null);
    setDialogOpen(true);
  };

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const togglePermission = (permission) => {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission],
    }));
  };

  const validate = () => {
    const errors = {};

    if (!form.name.trim()) errors.name = t('productRequiredField');
    if (!form.email.trim()) errors.email = t('productRequiredField');

    if (!editing) {
      if (!form.password) {
        errors.password = t('productRequiredField');
      } else if (form.password.length < 8) {
        errors.password = t('userPasswordMinLength');
      }
    }

    if (form.password && form.password !== form.password_confirmation) {
      errors.password_confirmation = t('userPasswordMismatch');
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      status: form.status,
      permissions: form.role === 'staff' ? form.permissions : [],
    };

    if (form.password) {
      payload.password = form.password;
      payload.password_confirmation = form.password_confirmation;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editing) {
        await adminUserService.update(editing.id, payload);
        toast({ variant: 'success', description: t('userUpdated') });
      } else {
        await adminUserService.create(payload);
        toast({ variant: 'success', description: t('userCreated') });
      }

      setDialogOpen(false);
      refresh();
    } catch (requestError) {
      setFormError(requestError);

      if (requestError?.errors) {
        setFieldErrors({
          name: requestError.errors.name?.[0],
          email: requestError.errors.email?.[0],
          password: requestError.errors.password?.[0],
          role: requestError.errors.role?.[0],
          permissions: requestError.errors.permissions?.[0],
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

  const handleToggleStatus = async (user) => {
    setActionUserId(user.id);

    try {
      if (user.status === 'active') {
        await adminUserService.deactivate(user.id);
        toast({ variant: 'success', description: t('userDeactivated') });
      } else {
        await adminUserService.activate(user.id);
        toast({ variant: 'success', description: t('userActivated') });
      }

      refresh();
    } catch (requestError) {
      toast({
        variant: 'destructive',
        description: getApiErrorMessage(requestError, tCommon),
      });
    } finally {
      setActionUserId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await adminUserService.delete(deleteTarget.id);
      toast({ variant: 'success', description: t('userDeleted') });
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

  const roleLabel = (role) => {
    if (role === 'master_admin') return t('userRoleMasterAdmin');
    if (role === 'staff') return t('userRoleStaff');
    return t('userRoleCustomer');
  };

  const statusLabel = (userStatus) => {
    if (userStatus === 'pending_approval') return t('userStatusPendingApproval');
    return userStatus === 'active' ? tCommon('active') : tCommon('inactive');
  };

  const editableUser = (user) =>
    canManage && user.role !== 'master_admin' && user.status !== 'pending_approval';

  const columns = [
    {
      key: 'name',
      label: t('userName'),
      render: (user) => (
        <div>
          <span className="block font-medium text-text-primary">{user.name}</span>
          <span className="block text-xs text-text-tertiary">{user.email}</span>
        </div>
      ),
    },
    {
      key: 'role',
      label: t('userRole'),
      render: (user) => (
        <AdminStatusBadge status={user.role} label={roleLabel(user.role)} />
      ),
    },
    {
      key: 'status',
      label: t('userStatus'),
      render: (user) => (
        <AdminStatusBadge status={user.status} label={statusLabel(user.status)} />
      ),
    },
    {
      key: 'permissions',
      label: t('userPermissions'),
      render: (user) =>
        user.role === 'master_admin'
          ? t('userRoleMasterAdmin')
          : `${user.permissions?.length || 0}`,
    },
    {
      key: 'created',
      label: t('paymentCreatedAt'),
      render: (user) => formatDate(user.created_at, locale) || '—',
    },
  ];

  if (!canView) {
    return (
      <AdminPermissionDenied
        title={t('noAccessTitle')}
        description={t('noAccessText')}
      />
    );
  }

  const renderActions = (user) => (
    <div className="flex flex-wrap justify-end gap-1">
      {editableUser(user) && (
        <Button variant="ghost" size="xs" onClick={() => openEdit(user)}>
          {tCommon('edit')}
        </Button>
      )}
      {canManage && user.role === 'staff' && user.status !== 'pending_approval' && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => handleToggleStatus(user)}
          loading={actionUserId === user.id}
        >
          {user.status === 'active' ? t('userDeactivate') : t('userActivate')}
        </Button>
      )}
      {editableUser(user) && (
        <Button
          variant="ghost"
          size="xs"
          className="text-error"
          onClick={() => setDeleteTarget(user)}
        >
          {tCommon('delete')}
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title={t('users')}
        description={t('usersIntro')}
        actions={canManage ? <Button onClick={openCreate}>{t('userCreate')}</Button> : null}
      />

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,11rem)_minmax(0,11rem)]">
          <SearchInput
            id="admin-user-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            onClear={() => setSearch('')}
            placeholder={t('usersSearchPlaceholder')}
            label={t('searchLabel')}
            clearLabel={tCommon('clear')}
            className="w-full"
          />
          <Select
            id="admin-user-role"
            label={t('usersRoleFilter')}
            value={roleFilter}
            options={[
              { value: '', label: t('usersAllRoles') },
              ...ROLES.map((role) => ({ value: role, label: roleLabel(role) })),
            ]}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setPage(1);
            }}
          />
          <Select
            id="admin-user-status"
            label={t('usersStatusFilter')}
            value={statusFilter}
            options={[
              { value: '', label: t('usersAllStatuses') },
              ...STATUSES.map((value) => ({ value, label: statusLabel(value) })),
            ]}
            onChange={(event) => {
              setStatusFilter(event.target.value);
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

        {status === 'ready' && items.length === 0 && (
          <EmptyState
            icon="users"
            title={t('emptyTitle')}
            description={
              debouncedSearch || roleFilter || statusFilter
                ? t('emptyFilteredText')
                : t('usersEmptyText')
            }
          />
        )}

        {status === 'ready' && items.length > 0 && (
          <>
            <AdminTable
              columns={columns}
              items={items}
              actions={renderActions}
              actionsLabel={t('actions')}
              renderCard={(user) => (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-primary">
                        {user.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-text-tertiary">
                        {user.email}
                      </p>
                    </div>
                    <AdminStatusBadge
                      status={user.status}
                      label={statusLabel(user.status)}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <AdminStatusBadge
                      status={user.role}
                      label={roleLabel(user.role)}
                    />
                    <p className="text-xs text-text-tertiary">
                      {formatDate(user.created_at, locale)}
                    </p>
                  </div>
                  <div className="mt-3 border-t border-border pt-3">
                    {renderActions(user)}
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
        title={editing ? t('userEdit') : t('userCreate')}
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
            {formError && (
              <Alert
                variant="destructive"
                title={t('loadErrorTitle')}
                description={getApiErrorMessage(formError, tCommon)}
              />
            )}

            <Input
              label={t('userName')}
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              error={fieldErrors.name}
              required
            />
            <Input
              label={t('userEmail')}
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              error={fieldErrors.email}
              dir="ltr"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label={t('userRole')}
                value={form.role}
                options={[
                  { value: 'staff', label: t('userRoleStaff') },
                  { value: 'customer', label: t('userRoleCustomer') },
                ]}
                onChange={(event) => updateField('role', event.target.value)}
              />
              <Select
                label={t('userStatus')}
                value={form.status}
                options={[
                  { value: 'active', label: tCommon('active') },
                  { value: 'inactive', label: tCommon('inactive') },
                ]}
                onChange={(event) => updateField('status', event.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('userPassword')}
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                error={fieldErrors.password}
                hint={editing ? t('userPasswordHint') : undefined}
                required={!editing}
              />
              <Input
                label={t('userPasswordConfirm')}
                type="password"
                autoComplete="new-password"
                value={form.password_confirmation}
                onChange={(event) =>
                  updateField('password_confirmation', event.target.value)
                }
                error={fieldErrors.password_confirmation}
                hint={editing ? t('userPasswordConfirmHint') : undefined}
                required={!editing}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <h3 className="font-medium text-text-primary">{t('userPermissions')}</h3>
            <p className="mt-1 text-sm text-text-secondary">
              {form.role === 'staff'
                ? t('userPermissionsHint')
                : t('userStaffOnlyPermissions')}
            </p>

            {fieldErrors.permissions && (
              <p className="mt-2 text-sm text-error" role="alert">
                {fieldErrors.permissions}
              </p>
            )}

            {form.role === 'staff' && (
              <div className="mt-4 max-h-96 space-y-4 overflow-y-auto pe-1">
                {PERMISSION_GROUPS.map(([module, permissions]) => (
                  <fieldset key={module}>
                    <legend className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                      {t(permissionModuleLabels[module] || module)}
                    </legend>
                    <div className="mt-2 grid gap-1 sm:grid-cols-2">
                      {permissions.map(({ permission, action }) => (
                        <label
                          key={permission}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text-secondary hover:bg-surface-hover"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                            checked={form.permissions.includes(permission)}
                            onChange={() => togglePermission(permission)}
                          />
                          {t(permissionActionLabels[action] || action)}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
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

export default AdminUsersPage;
