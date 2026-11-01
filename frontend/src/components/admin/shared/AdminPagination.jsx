'use client';

import { Pagination } from '@/components/ui/navigation/Pagination';

export function AdminResultSummary({
  status,
  isRefreshing,
  pagination,
  labels,
}) {
  const total = pagination?.total ?? 0;

  let text = '';

  if (status === 'loading') {
    text = labels.loading;
  } else if (status === 'error') {
    text = labels.error;
  } else if (total > 0) {
    text = labels.showing
      .replace('{from}', String(pagination?.from ?? 0))
      .replace('{to}', String(pagination?.to ?? 0))
      .replace('{total}', String(total));
  } else {
    text = labels.noResults;
  }

  return (
    <div className="flex min-h-6 items-center justify-between gap-3">
      <p className="text-sm text-text-secondary" aria-live="polite">
        {text}
      </p>

      {isRefreshing && status === 'ready' && (
        <span className="flex items-center gap-2 text-xs text-text-tertiary">
          <span
            aria-hidden="true"
            className="size-3.5 animate-spin rounded-full border-2 border-border border-t-primary motion-reduce:animate-none"
          />
          {labels.refreshing}
        </span>
      )}
    </div>
  );
}

export function AdminPaginationBar({
  pagination,
  onPageChange,
  labels,
  showWhenEmpty = false,
}) {
  if (!showWhenEmpty && (pagination?.total ?? 0) === 0) return null;

  return (
    <div className="mt-6 overflow-x-auto">
      <Pagination
        className="flex justify-center sm:justify-end"
        currentPage={pagination?.currentPage || 1}
        totalPages={pagination?.lastPage || 1}
        onPageChange={onPageChange}
        labels={labels}
      />
    </div>
  );
}
