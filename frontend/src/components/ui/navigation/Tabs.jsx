'use client';

import { useRef, useState } from 'react';
import { Icon } from '@/components/icons';

export function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  variant = 'line',
  label,
  className = '',
  panelClassName = '',
}) {
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.id);
  const active = value ?? internal;
  const buttonRefs = useRef([]);

  const setActive = (id) => {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  };

  const isRtl = () =>
    typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

  const handleKeyDown = (event, index) => {
    const enabled = items
      .map((item, itemIndex) => ({ item, itemIndex }))
      .filter(({ item }) => !item.disabled);

    const currentPos = enabled.findIndex(({ itemIndex }) => itemIndex === index);
    if (currentPos === -1) return;

    let nextPos = currentPos;

    if (event.key === 'ArrowRight') {
      nextPos = isRtl() ? currentPos - 1 : currentPos + 1;
    } else if (event.key === 'ArrowLeft') {
      nextPos = isRtl() ? currentPos + 1 : currentPos - 1;
    } else if (event.key === 'Home') {
      nextPos = 0;
    } else if (event.key === 'End') {
      nextPos = enabled.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const wrapped = (nextPos + enabled.length) % enabled.length;
    const target = enabled[wrapped].item;
    setActive(target.id);
    buttonRefs.current[enabled[wrapped].itemIndex]?.focus();
  };

  const activeItem = items.find((item) => item.id === active);

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        className={
          variant === 'pills'
            ? 'inline-flex flex-wrap gap-1 rounded-lg bg-surface-sunken p-1'
            : 'flex flex-wrap gap-1 border-b border-border'
        }
      >
        {items.map((item, index) => {
          const isActive = item.id === active;

          return (
            <button
              key={item.id}
              ref={(element) => {
                buttonRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${item.id}`}
              tabIndex={isActive ? 0 : -1}
              disabled={item.disabled}
              onClick={() => setActive(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`inline-flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 ${
                variant === 'pills'
                  ? `rounded-md ${
                      isActive
                        ? 'bg-surface text-text-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`
                  : `-mb-px border-b-2 ${
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-text-secondary hover:border-border hover:text-text-primary'
                    }`
              }`}
            >
              {item.icon && <Icon name={item.icon} size="sm" />}
              {item.label}
              {item.badge != null && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-surface-sunken px-1.5 text-xs text-text-secondary">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {activeItem && activeItem.content != null && (
        <div
          role="tabpanel"
          id={`panel-${activeItem.id}`}
          aria-labelledby={`tab-${activeItem.id}`}
          tabIndex={0}
          className={`pt-4 focus-visible:outline-none ${panelClassName}`}
        >
          {activeItem.content}
        </div>
      )}
    </div>
  );
}

export function TabPanel({ id, activeId, children, className = '' }) {
  if (id !== activeId) return null;
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  );
}
