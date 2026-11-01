'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/overlays/Dialog';
import { ConfirmDialog } from '@/components/ui/overlays/ConfirmDialog';
import { Select } from '@/components/ui/Input';
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
import { formatDateTime, formatRelativeTime } from '@/lib/date';
import { getProductName } from '@/lib/product';
import { adminReviewService } from '@/services/admin';
import { useAuthStore } from '@/stores/authStore';

const PAGE_SIZE = 20;
const STATUSES = ['pending', 'approved', 'rejected'];
const RATINGS = ['5', '4', '3', '2', '1'];

export function AdminReviewsPage() {
  const locale = useLocale();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission('reviews.view');
  const canModerate = hasPermission('reviews.update');
  const canDelete = hasPermission('reviews.delete');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [moderating, setModerating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { items, pagination, status, error, page, setPage, refresh, isRefreshing } =
    useAdminList({
      fetchPage: adminReviewService.list,
      query: {
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        rating: ratingFilter || undefined,
      },
      enabled: canView,
      perPage: PAGE_SIZE,
    });

  const moderate = async (review, nextStatus) => {
    setModerating(true);

    try {
      const response = await adminReviewService.moderate(review.id, nextStatus);
      const updated = response?.data || response;

      toast({
        variant: 'success',
        description:
          nextStatus === 'approved' ? t('reviewApproved') : t('reviewRejected'),
      });

      if (detail?.id === review.id) setDetail(updated);
      refresh();
    } catch (requestError) {
      toast({
        variant: 'destructive',
        description: getApiErrorMessage(requestError, tCommon),
      });
    } finally {
      setModerating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await adminReviewService.delete(deleteTarget.id);
      toast({ variant: 'success', description: t('reviewDeleted') });
      setDeleteTarget(null);
      setDetail(null);
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

  const renderRating = (rating) => (
    <span className="whitespace-nowrap text-warning" aria-label={`${rating} / 5`}>
      {'★'.repeat(Number(rating) || 0)}
      <span className="text-border-strong">
        {'★'.repeat(Math.max(0, 5 - (Number(rating) || 0)))}
      </span>
    </span>
  );

  const columns = [
    {
      key: 'product',
      label: t('reviewProduct'),
      render: (review) => (
        <div className="max-w-[18rem]">
          <span className="block truncate font-medium text-text-primary">
            {getProductName(review.product, locale) || '—'}
          </span>
          <span className="block truncate text-xs text-text-tertiary">
            {review.user?.name || t('orderGuest')}
          </span>
        </div>
      ),
    },
    {
      key: 'rating',
      label: t('reviewRating'),
      render: (review) => renderRating(review.rating),
    },
    {
      key: 'comment',
      label: t('reviewComment'),
      render: (review) => (
        <span className="line-clamp-2 block max-w-[20rem] text-text-secondary">
          {review.comment || t('reviewNoComment')}
        </span>
      ),
    },
    {
      key: 'status',
      label: t('reviewsStatusFilter'),
      render: (review) => (
        <AdminStatusBadge
          status={review.status}
          label={t(`status.${review.status}`)}
        />
      ),
    },
    {
      key: 'created',
      label: t('reviewSubmittedAt'),
      render: (review) =>
        review.created_at ? formatDateTime(review.created_at, locale) : '—',
    },
  ];

  const actionButtons = (review, compact = false) => (
    <div className={`flex flex-wrap gap-2 ${compact ? '' : 'justify-end'}`}>
      {canModerate && review.status !== 'approved' && (
        <Button
          variant="outline"
          size="xs"
          onClick={() => moderate(review, 'approved')}
          disabled={moderating}
        >
          {t('reviewApprove')}
        </Button>
      )}
      {canModerate && review.status !== 'rejected' && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => moderate(review, 'rejected')}
          disabled={moderating}
        >
          {t('reviewReject')}
        </Button>
      )}
      {canDelete && (
        <Button
          variant="ghost"
          size="xs"
          className="text-error"
          onClick={() => setDeleteTarget(review)}
        >
          {tCommon('delete')}
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader title={t('reviews')} description={t('reviewsIntro')} />

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,11rem)_minmax(0,11rem)]">
          <SearchInput
            id="admin-review-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            onClear={() => setSearch('')}
            placeholder={t('reviewsSearchPlaceholder')}
            label={t('searchLabel')}
            clearLabel={tCommon('clear')}
            className="w-full"
          />
          <Select
            id="admin-review-status"
            label={t('reviewsStatusFilter')}
            value={statusFilter}
            options={[
              { value: '', label: t('reviewsAllStatuses') },
              ...STATUSES.map((value) => ({
                value,
                label: t(`status.${value}`),
              })),
            ]}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          />
          <Select
            id="admin-review-rating"
            label={t('reviewsRatingFilter')}
            value={ratingFilter}
            options={[
              { value: '', label: t('reviewsAllRatings') },
              ...RATINGS.map((value) => ({ value, label: `${value} ★` })),
            ]}
            onChange={(event) => {
              setRatingFilter(event.target.value);
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
            icon="star"
            title={t('emptyTitle')}
            description={
              debouncedSearch || statusFilter || ratingFilter
                ? t('emptyFilteredText')
                : t('reviewsEmptyText')
            }
          />
        )}

        {status === 'ready' && items.length > 0 && (
          <>
            <AdminTable
              columns={columns}
              items={items}
              getRowHref={undefined}
              actions={(review) => (
                <div className="flex flex-col items-end gap-1">
                  <Button variant="ghost" size="xs" onClick={() => setDetail(review)}>
                    {tCommon('view')}
                  </Button>
                  {actionButtons(review)}
                </div>
              )}
              actionsLabel={t('actions')}
              renderCard={(review) => (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-primary">
                        {getProductName(review.product, locale) || '—'}
                      </p>
                      <p className="mt-0.5 text-xs text-text-tertiary">
                        {review.user?.name || t('orderGuest')} ·{' '}
                        {review.created_at
                          ? formatRelativeTime(review.created_at, locale)
                          : '—'}
                      </p>
                    </div>
                    <AdminStatusBadge
                      status={review.status}
                      label={t(`status.${review.status}`)}
                    />
                  </div>
                  <div className="mt-2">{renderRating(review.rating)}</div>
                  <p className="mt-2 line-clamp-2 text-sm text-text-secondary">
                    {review.comment || t('reviewNoComment')}
                  </p>
                  <div className="mt-3 border-t border-border pt-3">
                    {actionButtons(review, true)}
                    <div className="mt-2">
                      <Button variant="ghost" size="xs" onClick={() => setDetail(review)}>
                        {tCommon('view')}
                      </Button>
                    </div>
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
        isOpen={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={t('reviewDetailTitle')}
        size="lg"
        closeLabel={tCommon('close')}
        footer={
          detail ? (
            <div className="flex flex-wrap justify-end gap-2">
              {actionButtons(detail)}
              <Button variant="ghost" onClick={() => setDetail(null)}>
                {tCommon('close')}
              </Button>
            </div>
          ) : null
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-text-primary">
                  {getProductName(detail.product, locale) || '—'}
                </p>
                <p className="text-sm text-text-secondary">
                  {detail.user?.name || t('orderGuest')}
                </p>
              </div>
              <AdminStatusBadge
                status={detail.status}
                label={t(`status.${detail.status}`)}
              />
            </div>

            <div className="flex items-center gap-2">
              {renderRating(detail.rating)}
              <span className="text-sm text-text-tertiary">
                {detail.created_at
                  ? formatDateTime(detail.created_at, locale)
                  : '—'}
              </span>
            </div>

            <div className="rounded-lg bg-surface-sunken p-4">
              <p className="whitespace-pre-line text-sm text-text-secondary">
                {detail.comment || t('reviewNoComment')}
              </p>
            </div>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('confirmTitle')}
        description={t('reviewDeleteText')}
        confirmText={tCommon('delete')}
        cancelText={tCommon('cancel')}
        variant="destructive"
        isLoading={deleting}
      />
    </div>
  );
}

export default AdminReviewsPage;
