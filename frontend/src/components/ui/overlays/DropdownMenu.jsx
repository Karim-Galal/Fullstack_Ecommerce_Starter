'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';

export function DropdownMenu({
  trigger,
  items = [],
  align = 'end',
  label = 'Menu',
  className = '',
  menuClassName = '',
  onSelect,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);
  const menuId = useId();

  const actionable = items
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item }) => item.type !== 'divider' && item.type !== 'label' && !item.disabled
    );

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const focusItem = (position) => {
    const target = actionable[position];
    if (!target) return;
    setActiveIndex(target.index);
    itemRefs.current[target.index]?.focus();
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      requestAnimationFrame(() =>
        focusItem(event.key === 'ArrowDown' ? 0 : actionable.length - 1)
      );
    }
  };

  const handleMenuKeyDown = (event) => {
    const position = actionable.findIndex(({ index }) => index === activeIndex);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusItem((position + 1) % actionable.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem((position - 1 + actionable.length) % actionable.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusItem(actionable.length - 1);
    }
  };

  const handleSelect = (item) => {
    if (item.disabled) return;
    item.onClick?.(item);
    onSelect?.(item);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const triggerNode = typeof trigger === 'function' ? trigger({ isOpen: open }) : trigger;

  const itemClasses = (item) =>
    `flex w-full items-center gap-3 px-3 py-2 text-start text-sm transition-colors focus-visible:outline-none focus-visible:bg-surface-hover ${
      item.danger
        ? 'text-error hover:bg-error/10'
        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
    } ${item.disabled ? 'cursor-not-allowed opacity-50' : ''}`;

  return (
    <div ref={rootRef} className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((previous) => !previous)}
        onKeyDown={handleTriggerKeyDown}
        className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {triggerNode}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={handleMenuKeyDown}
          className={`absolute ${
            align === 'start' ? 'start-0' : 'end-0'
          } z-[var(--z-dropdown)] mt-2 min-w-56 overflow-hidden rounded-lg border border-border bg-surface-elevated py-1 shadow-xl animate-slide-in motion-reduce:animate-none ${menuClassName}`}
        >
          {items.map((item, index) => {
            if (item.type === 'divider') {
              return (
                <div
                  key={item.key || `divider-${index}`}
                  role="separator"
                  className="my-1 h-px bg-border"
                />
              );
            }

            if (item.type === 'label') {
              return (
                <div
                  key={item.key || `label-${index}`}
                  className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-text-tertiary"
                >
                  {item.label}
                </div>
              );
            }

            const content = (
              <>
                {item.icon && <Icon name={item.icon} size="sm" className="flex-shrink-0" />}
                <span className="flex-1 truncate">{item.label}</span>
              </>
            );

            if (item.href) {
              return (
                <Link
                  key={item.key || item.href}
                  ref={(element) => {
                    itemRefs.current[index] = element;
                  }}
                  href={item.href}
                  role="menuitem"
                  className={itemClasses(item)}
                  onClick={() => {
                    item.onClick?.(item);
                    onSelect?.(item);
                    setOpen(false);
                  }}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.key || item.label || index}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => handleSelect(item)}
                className={itemClasses(item)}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
