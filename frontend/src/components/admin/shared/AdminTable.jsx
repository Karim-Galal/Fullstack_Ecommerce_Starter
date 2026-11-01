'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { TableSkeleton } from '@/components/ui/skeletons/TableSkeleton';

const statusVariants = {
  pending: 'warning',
  unpaid: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'primary',
  delivered: 'success',
  approved: 'success',
  accepted: 'success',
  active: 'success',
  paid: 'success',
  issued: 'success',
  inactive: 'default',
  rejected: 'destructive',
  cancelled: 'destructive',
  refunded: 'destructive',
  failed: 'destructive',
  expired: 'destructive',
  revoked: 'destructive',
  master_admin: 'primary',
  staff: 'info',
  customer: 'default',
};

export function AdminStatusBadge({ status, label }) {
  return (
    <Badge variant={statusVariants[status] || 'default'} size="sm" dot>
      {label || status}
    </Badge>
  );
}

/**
 * Responsive admin table. Desktop renders a real table, mobile renders compact
 * cards instead of a horizontally scrolling table.
 */
export function AdminTable({
  columns,
  items,
  getRowKey = (item) => item.id,
  getRowHref,
  renderCard,
  actions,
  actionsLabel,
  minWidthClassName = 'min-w-[48rem]',
}) {
  const renderCell = (column, item) =>
    column.render ? column.render(item) : item?.[column.key] ?? '—';

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
        <div className="overflow-x-auto">
          <table className={`w-full text-sm ${minWidthClassName}`}>
            <thead className="border-b border-border bg-surface-sunken">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`px-4 py-3 text-start text-xs font-medium uppercase tracking-wide text-text-tertiary ${
                      column.headerClassName || ''
                    }`}
                  >
                    {column.label}
                  </th>
                ))}
                {actions && (
                  <th scope="col" className="px-4 py-3 text-end">
                    <span className="sr-only">{actionsLabel}</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => {
                const href = getRowHref?.(item);

                return (
                  <tr
                    key={getRowKey(item)}
                    className={`transition-colors hover:bg-surface-hover ${
                      href ? 'cursor-pointer' : ''
                    }`}
                  >
                    {columns.map((column, index) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 align-top text-text-secondary ${
                          column.cellClassName || ''
                        }`}
                      >
                        {index === 0 && href ? (
                          <Link href={href} className="block">
                            {renderCell(column, item)}
                          </Link>
                        ) : (
                          renderCell(column, item)
                        )}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3 text-end align-top">
                        {actions(item)}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="space-y-3 md:hidden">
        {items.map((item) => {
          const href = getRowHref?.(item);

          return (
            <li
              key={getRowKey(item)}
              className="rounded-xl border border-border bg-surface p-4"
            >
              {renderCard ? (
                renderCard(item)
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 font-medium text-text-primary">
                      {renderCell(columns[0], item)}
                    </div>
                  </div>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    {columns.slice(1).map((column) => (
                      <div
                        key={column.key}
                        className="flex items-start justify-between gap-3"
                      >
                        <dt className="text-text-tertiary">{column.label}</dt>
                        <dd className="text-end text-text-secondary">
                          {renderCell(column, item)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}

              {(href || actions) && (
                <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
                  {href && (
                    <Link
                      href={href}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {actionsLabel}
                    </Link>
                  )}
                  {actions?.(item)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function AdminTableSkeleton({ columns = 5, rows = 6 }) {
  return (
    <div aria-hidden="true">
      <div className="hidden md:block">
        <TableSkeleton rows={rows} columns={columns} />
      </div>
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-3 h-3 w-1/3" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
