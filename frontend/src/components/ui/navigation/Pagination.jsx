'use client';

import { Icon } from '@/components/icons';

function range(start, end) {
  const output = [];
  for (let i = start; i <= end; i += 1) output.push(i);
  return output;
}

function buildPages(current, total, siblingCount) {
  const totalNumbers = siblingCount * 2 + 5;
  if (total <= totalNumbers) return range(1, total);

  const left = Math.max(current - siblingCount, 1);
  const right = Math.min(current + siblingCount, total);
  const showLeftEllipsis = left > 2;
  const showRightEllipsis = right < total - 1;
  const pages = [1];

  if (showLeftEllipsis) {
    pages.push('left-ellipsis');
  } else {
    for (let i = 2; i < left; i += 1) pages.push(i);
  }

  for (let i = left; i <= right; i += 1) {
    if (i !== 1 && i !== total) pages.push(i);
  }

  if (showRightEllipsis) {
    pages.push('right-ellipsis');
  } else {
    for (let i = right + 1; i < total; i += 1) pages.push(i);
  }

  pages.push(total);
  return pages;
}

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  labels = {},
  className = '',
  ...props
}) {
  if (totalPages <= 1) return null;

  const text = {
    previous: 'Previous',
    next: 'Next',
    first: 'First page',
    last: 'Last page',
    page: 'Page',
    ...labels,
  };

  const pages = buildPages(currentPage, totalPages, siblingCount);
  const canPrevious = currentPage > 1;
  const canNext = currentPage < totalPages;

  const baseButton =
    'inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50';

  const goTo = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange?.(page);
  };

  return (
    <nav aria-label="Pagination" className={className} {...props}>
      <ul className="flex items-center gap-1">
        {showFirstLast && (
          <li>
            <button
              type="button"
              onClick={() => goTo(1)}
              disabled={!canPrevious}
              aria-label={text.first}
              className={`${baseButton} border-transparent text-text-secondary hover:bg-surface-hover`}
            >
              <Icon name="chevronLeft" size="sm" className="rtl:rotate-180" />
              <Icon name="chevronLeft" size="sm" className="-ms-2 rtl:rotate-180" />
            </button>
          </li>
        )}
        <li>
          <button
            type="button"
            onClick={() => goTo(currentPage - 1)}
            disabled={!canPrevious}
            aria-label={text.previous}
            className={`${baseButton} border-transparent text-text-secondary hover:bg-surface-hover`}
          >
            <Icon name="chevronLeft" size="sm" className="rtl:rotate-180" />
          </button>
        </li>
        {pages.map((page, index) =>
          typeof page === 'number' ? (
            <li key={page}>
              <button
                type="button"
                onClick={() => goTo(page)}
                aria-current={page === currentPage ? 'page' : undefined}
                aria-label={`${text.page} ${page}`}
                className={`${baseButton} ${
                  page === currentPage
                    ? 'border-primary bg-primary text-primary-on'
                    : 'border-border text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {page}
              </button>
            </li>
          ) : (
            <li key={`${page}-${index}`}>
              <span className="flex h-10 w-10 items-center justify-center text-text-tertiary" aria-hidden="true">
                &hellip;
              </span>
            </li>
          )
        )}
        <li>
          <button
            type="button"
            onClick={() => goTo(currentPage + 1)}
            disabled={!canNext}
            aria-label={text.next}
            className={`${baseButton} border-transparent text-text-secondary hover:bg-surface-hover`}
          >
            <Icon name="chevronRight" size="sm" className="rtl:rotate-180" />
          </button>
        </li>
        {showFirstLast && (
          <li>
            <button
              type="button"
              onClick={() => goTo(totalPages)}
              disabled={!canNext}
              aria-label={text.last}
              className={`${baseButton} border-transparent text-text-secondary hover:bg-surface-hover`}
            >
              <Icon name="chevronRight" size="sm" className="-me-2 rtl:rotate-180" />
              <Icon name="chevronRight" size="sm" className="rtl:rotate-180" />
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
