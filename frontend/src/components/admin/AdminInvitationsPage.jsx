'use client';

import { useState } from 'react';
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
import { adminInvitationService } from '@/services/admin';
import { useAuthStore } from '@/stores/authStore';

const PAGE_SIZE = 20;
const STATUSES = ['pending', 'accepted', 'approved', 'rejected', 'revoked'];
const TYPES = ['staff', 'master_admin'];

export function AdminInvitationsPage() {
  const locale = useLocale();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const currentUser = useAuthStore((state) => state.user);
  const canView = currentUser?.role === 'master_admin';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ email: '', type: 'staff' });
  const [formError, setFormError] = useState(null);
  const [fieldError, setFieldError] = useState('');
  const [saving, setSaving] = useState(false);
  const [createdUrl, setCreatedUrl] = useState('');
  const [resultOpen, setResultOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [acting, setActing] = useState(false);

  const { items, pagination, status, error, page, setPage, refresh, isRefreshing } =
    useAdminList({
      fetchPage: adminInvitationService.list,
      query: {
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      },
      enabled: canView,
      perPage: PAGE_SIZE,
    });

  const openCreate = () => {
    setForm({ email: '', type: 'staff' });
    setFormError(null);
    setFieldError('');
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!form.email.trim()) {
      setFieldError(t('productRequiredField'));
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const response = await adminInvitationService.create({
        email: form.email.trim(),
        type: form.type,
      });

      setDialogOpen(false);
      setCreatedUrl(response?.invitation_url || '');
      setResultOpen(true);
      toast({ variant: 'success', description: t('invitationCreated') });
      refresh();
    } catch (requestError) {
      setFormError(requestError);
      setFieldError(requestError?.errors?.email?.[0] || '');
      toast({
        variant: 'destructive',
        description: getApiErrorMessage(requestError, tCommon),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async () => {
    if (!actionTarget || !actionType) return;

    setActing(true);

    try {
      if (actionType === 'approve') {
        await adminInvitationService.approve(actionTarget.id);
        toast({ variant: 'success', description: t('invitationApproved') });
      } else if (actionType === 'reject') {
        await adminInvitationService.reject(actionTarget.id);
        toast({ variant: 'success', description: t('invitationRejected') });
      } else {
        await adminInvitationService.revoke(actionTarget.id);
        toast({ variant: 'success', description: t('invitationRevoked') });
      }

      setActionTarget(null);
      setActionType(null);
      refresh();
    } catch (requestError) {
      toast({
        variant: 'destructive',
        description: getApiErrorMessage(requestError, tCommon),
      });
    } finally {
      setActing(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(createdUrl);
      toast({ variant: 'success', description: t('invitationLinkCopied') });
    } catch {
      toast({ variant: 'destructive', description: t('loadErrorText') });
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

  const statusLabel = (value) => t(`status.${value}`);
  const typeLabel = (value) =>
    value === 'master_admin' ? t('invitationTypeMasterAdmin') : t('invitationTypeStaff');

  const actionConfig = {
    approve: {
      title: t('invitationApprove'),
      text: t('invitationPendingNote'),
    },
    reject: {
      title: t('invitationReject'),
      text: t('invitationPendingNote'),
    },
    revoke: {
      title: t('invitationRevoke'),
      text: t('invitationPendingNote'),
    },
  };

  const columns = [
    {
      key: 'email',
      label: t('invitationEmail'),
      render: (invitation) => (
        <span className="font-medium text-text-primary">
          {invitation.invited_email}
        </span>
      ),
    },
    {
      key: 'type',
      label: t('invitationType'),
      render: (invitation) => typeLabel(invitation.type),
    },
    {
      key: 'status',
      label: t('invitationStatus'),
      render: (invitation) => (
        <AdminStatusBadge
          status={invitation.status}
          label={statusLabel(invitation.status)}
        />
      ),
    },
    {
      key: 'expires',
      label: t('invitationExpiresAt'),
      render: (invitation) =>
        invitation.expires_at ? formatDate(invitation.expires_at, locale) : '—',
    },
    {
      key: 'created',
      label: t('paymentCreatedAt'),
      render: (invitation) =>
        invitation.created_at ? formatDate(invitation.created_at, locale) : '—',
    },
  ];

  const renderActions = (invitation) => (
    <div className="flex flex-wrap justify-end gap-1">
      {invitation.status === 'accepted' && (
        <>
          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              setActionTarget(invitation);
              setActionType('approve');
            }}
          >
            {t('invitationApprove')}
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="text-error"
            onClick={() => {
              setActionTarget(invitation);
              setActionType('reject');
            }}
          >
            {t('invitationReject')}
          </Button>
        </>
      )}
      {invitation.status === 'pending' && (
        <Button
          variant="ghost"
          size="xs"
          className="text-error"
          onClick={() => {
            setActionTarget(invitation);
            setActionType('revoke');
          }}
        >
          {t('invitationRevoke')}
        </Button>
      )}
      {!['accepted', 'pending'].includes(invitation.status) && (
        <span className="text-xs text-text-tertiary">{t('notAvailable')}</span>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title={t('invitations')}
        description={t('invitationsIntro')}
        actions={<Button onClick={openCreate}>{t('invitationCreate')}</Button>}
      />

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,11rem)_minmax(0,11rem)]">
          <SearchInput
            id="admin-invitation-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            onClear={() => setSearch('')}
            placeholder={t('invitationsSearchPlaceholder')}
            label={t('searchLabel')}
            clearLabel={tCommon('clear')}
            className="w-full"
          />
          <Select
            id="admin-invitation-status"
            label={t('invitationsStatusFilter')}
            value={statusFilter}
            options={[
              { value: '', label: t('invitationsAllStatuses') },
              ...STATUSES.map((value) => ({ value, label: statusLabel(value) })),
            ]}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          />
          <Select
            id="admin-invitation-type"
            label={t('invitationsTypeFilter')}
            value={typeFilter}
            options={[
              { value: '', label: t('invitationsAllTypes') },
              ...TYPES.map((value) => ({ value, label: typeLabel(value) })),
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
            icon="email"
            title={t('emptyTitle')}
            description={
              debouncedSearch || statusFilter || typeFilter
                ? t('emptyFilteredText')
                : t('invitationsEmptyText')
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
              renderCard={(invitation) => (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-primary">
                        {invitation.invited_email}
                      </p>
                      <p className="mt-0.5 text-xs text-text-tertiary">
                        {typeLabel(invitation.type)}
                        {invitation.expires_at
                          ? ` · ${formatDate(invitation.expires_at, locale)}`
                          : ''}
                      </p>
                    </div>
                    <AdminStatusBadge
                      status={invitation.status}
                      label={statusLabel(invitation.status)}
                    />
                  </div>
                  <p className="mt-2 text-xs text-text-tertiary">
                    {t('invitationPendingNote')}
                  </p>
                  <div className="mt-3 border-t border-border pt-3">
                    {renderActions(invitation)}
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
        title={t('invitationCreate')}
        size="md"
        closeLabel={tCommon('close')}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleCreate} loading={saving}>
              {t('invitationCreate')}
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
            label={t('invitationEmail')}
            type="email"
            placeholder={t('invitationEmailPlaceholder')}
            value={form.email}
            onChange={(event) => {
              setForm((current) => ({ ...current, email: event.target.value }));
              setFieldError('');
            }}
            error={fieldError}
            dir="ltr"
            required
          />
          <Select
            label={t('invitationType')}
            value={form.type}
            options={TYPES.map((value) => ({ value, label: typeLabel(value) }))}
            onChange={(event) =>
              setForm((current) => ({ ...current, type: event.target.value }))
            }
          />
        </div>
      </Dialog>

      <Dialog
        isOpen={resultOpen}
        onClose={() => setResultOpen(false)}
        title={t('invitationCreated')}
        size="lg"
        closeLabel={tCommon('close')}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={copyLink}>
              {t('invitationCopyLink')}
            </Button>
            <Button onClick={() => setResultOpen(false)}>{tCommon('close')}</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label={t('invitationAcceptUrl')}
            value={createdUrl}
            readOnly
            dir="ltr"
          />
          <p className="text-sm text-text-tertiary">
            {t('invitationAcceptUrlHint')}
          </p>
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={Boolean(actionTarget && actionType)}
        onClose={() => {
          setActionTarget(null);
          setActionType(null);
        }}
        onConfirm={handleAction}
        title={actionType ? actionConfig[actionType].title : t('confirmTitle')}
        description={actionType ? actionConfig[actionType].text : undefined}
        confirmText={actionType ? actionConfig[actionType].title : tCommon('confirm')}
        cancelText={tCommon('cancel')}
        variant={actionType === 'approve' ? 'primary' : 'destructive'}
        isLoading={acting}
      />
    </div>
  );
}

export default AdminInvitationsPage;
