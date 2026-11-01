'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { EmptyState } from '@/components/ui/data-display/EmptyState';
import { ConfirmDialog } from '@/components/ui/overlays/ConfirmDialog';
import { useToast } from '@/components/ui/feedback/ToastProvider';
import {
  AdminPageHeader,
  AdminPermissionDenied,
} from '@/components/admin/shared/AdminPageHeader';
import {
  AdminTable,
  AdminTableSkeleton,
} from '@/components/admin/shared/AdminTable';
import {
  AdminPaginationBar,
  AdminResultSummary,
} from '@/components/admin/shared/AdminPagination';
import { useAdminList, useDebouncedValue } from '@/hooks/useAdminList';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDateTime } from '@/lib/date';
import {
  getCategoryName,
  getCollectionName,
  getProductName,
} from '@/lib/product';
import {
  adminCategoryService,
  adminCollectionService,
  adminCouponService,
  adminInvoiceService,
  adminOfferService,
  adminProductService,
  adminReviewService,
  adminUserService,
} from '@/services/admin';
import { useAuthStore } from '@/stores/authStore';

const PAGE_SIZE = 20;

const RESOURCE_DEFINITIONS = [
  {
    key: 'products',
    labelKey: 'trashResourceProducts',
    service: adminProductService,
    view: 'products.view',
    restore: 'products.update',
    force: 'products.delete',
  },
  {
    key: 'categories',
    labelKey: 'trashResourceCategories',
    service: adminCategoryService,
    view: 'categories.view',
    restore: 'categories.update',
    force: 'categories.delete',
  },
  {
    key: 'collections',
    labelKey: 'trashResourceCollections',
    service: adminCollectionService,
    view: 'collections.view',
    restore: 'collections.update',
    force: 'collections.delete',
  },
  {
    key: 'coupons',
    labelKey: 'trashResourceCoupons',
    service: adminCouponService,
    view: 'coupons.view',
    restore: 'coupons.update',
    force: 'coupons.delete',
  },
  {
    key: 'offers',
    labelKey: 'trashResourceOffers',
    service: adminOfferService,
    view: 'offers.view',
    restore: 'offers.update',
    force: 'offers.delete',
  },
  {
    key: 'reviews',
    labelKey: 'trashResourceReviews',
    service: adminReviewService,
    view: 'reviews.view',
    restore: 'reviews.update',
    force: 'reviews.delete',
  },
  {
    key: 'users',
    labelKey: 'trashResourceUsers',
    service: adminUserService,
    view: 'users.view',
    masterOnly: true,
    force: true,
  },
  {
    key: 'invoices',
    labelKey: 'trashResourceInvoices',
    service: adminInvoiceService,
    view: 'invoices.view',
    restore: 'invoices.update',
    force: null,
  },
];

export function AdminTrashPage() {
  const locale = useLocale();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const currentUser = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [resourceFilter, setResourceFilter] = useState('');
  const [partialErrors, setPartialErrors] = useState([]);
  const [target, setTarget] = useState(null);
  const [targetAction, setTargetAction] = useState(null);
  const [acting, setActing] = useState(false);

  const canFor = (definition, permissionKey) => {
    if (definition.masterOnly) return currentUser?.role === 'master_admin';

    return permissionKey ? hasPermission(permissionKey) : false;
  };

  const availableResources = useMemo(
    () =>
      RESOURCE_DEFINITIONS.filter((definition) =>
        hasPermission(definition.view)
      ),
    [hasPermission]
  );

  const fetchTrash = async (params = {}, { signal } = {}) => {
    const selected = resourceFilter
      ? availableResources.filter(
          (definition) => definition.key === resourceFilter
        )
      : availableResources;

    const settled = await Promise.allSettled(
      selected.map((definition) =>
        definition.service
          .list(
            {
              trashed: 1,
              per_page: 100,
              search: params.search || undefined,
            },
            { signal }
          )
          .then((response) =>
            (response?.data || []).map((item) => ({
              ...item,
              __resource: definition.key,
            }))
          )
      )
    );

    const failures = settled.filter((result) => result.status === 'rejected');
    const cancelled = failures.find(
      (result) => result.reason?.kind === 'cancelled'
    );

    if (cancelled) throw cancelled.reason;

    if (settled.length > 0 && failures.length === settled.length) {
      throw failures[0].reason;
    }

    const items = settled
      .filter((result) => result.status === 'fulfilled')
      .flatMap((result) => result.value);

    const filtered = params.search
      ? items.filter((item) =>
          getTrashLabel(item, locale, t)
            .toLowerCase()
            .includes(String(params.search).toLowerCase())
        )
      : items;

    filtered.sort((a, b) => {
      const left = new Date(b.deleted_at || b.created_at || 0).getTime();
      const right = new Date(a.deleted_at || a.created_at || 0).getTime();
      return left - right;
    });

    const page = Number(params.page) || 1;
    const perPage = Number(params.per_page) || PAGE_SIZE;
    const total = filtered.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const pageItems = filtered.slice(start, start + perPage);

    setPartialErrors(failures.map((failure) => failure.reason));

    return {
      data: pageItems,
      meta: {
        current_page: page,
        last_page: lastPage,
        per_page: perPage,
        total,
        from: total === 0 ? null : start + 1,
        to: total === 0 ? null : start + pageItems.length,
      },
    };
  };

  const { items, pagination, status, error, page, setPage, refresh, isRefreshing } =
    useAdminList({
      fetchPage: fetchTrash,
      query: { search: debouncedSearch || undefined },
      enabled: availableResources.length > 0,
      perPage: PAGE_SIZE,
    });

  const resourceLabel = (key) => {
    const definition = RESOURCE_DEFINITIONS.find((item) => item.key === key);
    return definition ? t(definition.labelKey) : key;
  };

  const canRestore = (key) => {
    const definition = RESOURCE_DEFINITIONS.find((item) => item.key === key);
    return definition ? canFor(definition, definition.restore) : false;
  };

  const canForce = (key) => {
    const definition = RESOURCE_DEFINITIONS.find((item) => item.key === key);
    if (!definition || definition.force === null || definition.force === undefined) {
      return false;
    }

    return definition.masterOnly
      ? currentUser?.role === 'master_admin'
      : hasPermission(definition.force);
  };

  const handleAction = async () => {
    if (!target || !targetAction) return;

    const definition = RESOURCE_DEFINITIONS.find(
      (item) => item.key === target.__resource
    );

    if (!definition) return;

    setActing(true);

    try {
      if (targetAction === 'restore') {
        await definition.service.restore(target.id);
        toast({ variant: 'success', description: t('trashRestoreSuccess') });
      } else {
        await definition.service.forceDelete(target.id);
        toast({
          variant: 'success',
          description: t('trashForceDeleteSuccess'),
        });
      }

      setTarget(null);
      setTargetAction(null);
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

  if (availableResources.length === 0) {
    return (
      <AdminPermissionDenied
        title={t('trashNoAccessTitle')}
        description={t('trashNoAccessText')}
      />
    );
  }

  const columns = [
    {
      key: 'item',
      label: t('trashItemColumn'),
      render: (item) => (
        <div>
          <span className="block font-medium text-text-primary">
            {getTrashLabel(item, locale, t)}
          </span>
          <span className="block text-xs text-text-tertiary">
            {getTrashMeta(item, locale, t)}
          </span>
        </div>
      ),
    },
    {
      key: 'type',
      label: t('trashTypeColumn'),
      render: (item) => resourceLabel(item.__resource),
    },
    {
      key: 'deleted',
      label: t('trashDeletedAt'),
      render: (item) =>
        item.deleted_at ? formatDateTime(item.deleted_at, locale) : '—',
    },
  ];

  const renderActions = (item) => (
    <div className="flex flex-wrap justify-end gap-1">
      {canRestore(item.__resource) && (
        <Button
          variant="outline"
          size="xs"
          onClick={() => {
            setTarget(item);
            setTargetAction('restore');
          }}
        >
          {t('trashRestore')}
        </Button>
      )}
      {canForce(item.__resource) && (
        <Button
          variant="ghost"
          size="xs"
          className="text-error"
          onClick={() => {
            setTarget(item);
            setTargetAction('force');
          }}
        >
          {t('trashDeletePermanently')}
        </Button>
      )}
      {item.__resource === 'invoices' && (
        <span className="text-xs text-text-tertiary">
          {t('trashInvoiceHint')}
        </span>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader title={t('trash')} description={t('trashIntro')} />

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,14rem)]">
          <SearchInput
            id="admin-trash-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            onClear={() => setSearch('')}
            placeholder={t('trashSearchPlaceholder')}
            label={t('searchLabel')}
            clearLabel={tCommon('clear')}
            className="w-full"
          />
          <Select
            id="admin-trash-resource"
            label={t('trashResourceFilter')}
            value={resourceFilter}
            options={[
              { value: '', label: t('trashAllResources') },
              ...availableResources.map((definition) => ({
                value: definition.key,
                label: t(definition.labelKey),
              })),
            ]}
            onChange={(event) => {
              setResourceFilter(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </section>

      {partialErrors.length > 0 && (
        <div className="mt-4">
          <Alert
            variant="warning"
            title={t('trashLoadErrorTitle')}
            description={t('trashLoadErrorText')}
          />
        </div>
      )}

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
        {status === 'loading' && <AdminTableSkeleton columns={3} />}

        {status === 'error' && (
          <Alert
            variant="destructive"
            title={t('trashLoadErrorTitle')}
            description={getApiErrorMessage(
              error,
              tCommon,
              t('trashLoadErrorText')
            )}
          >
            <Button variant="outline" size="sm" onClick={refresh}>
              {tCommon('retry')}
            </Button>
          </Alert>
        )}

        {status === 'ready' && items.length === 0 && (
          <EmptyState
            icon="delete"
            title={t('trashEmptyTitle')}
            description={t('trashEmptyText')}
          />
        )}

        {status === 'ready' && items.length > 0 && (
          <>
            <AdminTable
              columns={columns}
              items={items}
              getRowKey={(item) => `${item.__resource}-${item.id}`}
              actions={renderActions}
              actionsLabel={t('actions')}
              renderCard={(item) => (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-primary">
                        {getTrashLabel(item, locale, t)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-text-tertiary">
                        {getTrashMeta(item, locale, t)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-surface-sunken px-2 py-0.5 text-xs text-text-secondary">
                      {resourceLabel(item.__resource)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-text-tertiary">
                    {t('trashDeletedAt')}:{' '}
                    {item.deleted_at
                      ? formatDateTime(item.deleted_at, locale)
                      : '—'}
                  </p>
                  <div className="mt-3 border-t border-border pt-3">
                    {renderActions(item)}
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

      <ConfirmDialog
        isOpen={Boolean(target && targetAction)}
        onClose={() => {
          setTarget(null);
          setTargetAction(null);
        }}
        onConfirm={handleAction}
        title={
          targetAction === 'force'
            ? t('trashForceDeleteTitle')
            : t('trashRestoreTitle')
        }
        description={
          targetAction === 'force'
            ? t('trashForceDeleteText')
            : t('trashRestoreText')
        }
        confirmText={
          targetAction === 'force'
            ? t('trashDeletePermanently')
            : t('trashRestore')
        }
        cancelText={tCommon('cancel')}
        variant={targetAction === 'force' ? 'destructive' : 'primary'}
        isLoading={acting}
      />
    </div>
  );
}

function getTrashLabel(item, locale, t) {
  switch (item.__resource) {
    case 'products':
      return getProductName(item, locale) || t('trashItemFallback', { id: item.id });
    case 'categories':
      return getCategoryName(item, locale) || t('trashItemFallback', { id: item.id });
    case 'collections':
      return (
        getCollectionName(item, locale) || t('trashItemFallback', { id: item.id })
      );
    case 'coupons':
      return item.code || t('trashItemFallback', { id: item.id });
    case 'offers':
      return item.name || t('trashItemFallback', { id: item.id });
    case 'reviews':
      return item.comment
        ? `${item.comment.slice(0, 60)}${item.comment.length > 60 ? '…' : ''}`
        : t('trashItemFallback', { id: item.id });
    case 'users':
      return item.name || item.email || t('trashItemFallback', { id: item.id });
    case 'invoices':
      return item.number || t('trashItemFallback', { id: item.id });
    default:
      return t('trashItemFallback', { id: item.id });
  }
}

function getTrashMeta(item, locale, t) {
  switch (item.__resource) {
    case 'products':
      return item.sku || item.slug || t('notAvailable');
    case 'categories':
    case 'collections':
      return item.slug || t('notAvailable');
    case 'coupons':
      return item.discount_type === 'percentage'
        ? `${item.discount_amount}%`
        : t('notAvailable');
    case 'offers':
      return item.type || t('notAvailable');
    case 'reviews':
      return item.user?.name || t('orderGuest');
    case 'users':
      return item.email || t('notAvailable');
    case 'invoices':
      return item.order?.number || t('notAvailable');
    default:
      return t('notAvailable');
  }
}

export default AdminTrashPage;
