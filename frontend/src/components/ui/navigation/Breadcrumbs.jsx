'use client';

import Link from 'next/link';
import { Fragment } from 'react';
import { Icon } from '@/components/icons';

function collapseItems(items, maxItems) {
  if (!maxItems || items.length <= maxItems) return items;
  const tailCount = Math.max(maxItems - 2, 1);
  return [
    items[0],
    { type: 'ellipsis', key: 'ellipsis' },
    ...items.slice(-tailCount),
  ];
}

export function Breadcrumbs({
  items = [],
  separator,
  maxItems,
  label = 'Breadcrumb',
  className = '',
  ...props
}) {
  if (!items.length) return null;

  const displayItems = collapseItems(items, maxItems);
  const separatorNode = separator || (
    <Icon
      name="chevronRight"
      size="xs"
      className="text-text-tertiary rtl:rotate-180"
    />
  );

  return (
    <nav aria-label={label} className={className} {...props}>
      <ol className="flex flex-wrap items-center gap-2">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const key = item.key || item.href || `${item.label}-${index}`;

          return (
            <Fragment key={key}>
              {index > 0 && (
                <li aria-hidden="true" className="flex items-center">
                  {separatorNode}
                </li>
              )}
              <li className="flex items-center">
                {item.type === 'ellipsis' ? (
                  <span className="px-1 text-text-tertiary" aria-hidden="true">
                    &hellip;
                  </span>
                ) : isLast || !item.href ? (
                  <span
                    className="font-medium text-text-primary"
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-sm text-text-secondary transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
