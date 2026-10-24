
'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';

const VIEWPORT_PADDING = 8;
const MENU_GAP = 8;

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
  const [position, setPosition] = useState(null);

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const itemRefs = useRef([]);
  const menuId = useId();

  const actionable = items
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item }) =>
        item.type !== 'divider' &&
        item.type !== 'label' &&
        !item.disabled
    );

  const updatePosition = useCallback(() => {
    const triggerElement = triggerRef.current;
    const menuElement = menuRef.current;

    if (!triggerElement || !menuElement) return;

    const triggerRect = triggerElement.getBoundingClientRect();
    const menuRect = menuElement.getBoundingClientRect();
    const direction = window.getComputedStyle(triggerElement).direction;

    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;

    const menuWidth = Math.min(
      Math.max(menuRect.width, 200),
      viewportWidth - VIEWPORT_PADDING * 2
    );
    const preferredLeft =
      align === 'start'
        ? direction === 'rtl'
          ? triggerRect.right - menuWidth
          : triggerRect.left
        : direction === 'rtl'
          ? triggerRect.left
          : triggerRect.right - menuWidth;

    const left = Math.max(
      VIEWPORT_PADDING,
      Math.min(
        preferredLeft,
        viewportWidth - menuWidth - VIEWPORT_PADDING
      )
    );

    const availableBelow =
      viewportHeight - triggerRect.bottom - MENU_GAP - VIEWPORT_PADDING;

    const availableAbove =
      triggerRect.top - MENU_GAP - VIEWPORT_PADDING;

    const shouldOpenAbove =
      menuRect.height > availableBelow &&
      availableAbove > availableBelow;

    const availableHeight = Math.max(
      0,
      (shouldOpenAbove ? availableAbove : availableBelow)
    );

    const maxHeight = Math.min(
      Math.max(120, viewportHeight - VIEWPORT_PADDING * 2),
      availableHeight
    );

    const height = Math.min(menuRect.height, maxHeight);

    const top = shouldOpenAbove
      ? Math.max(VIEWPORT_PADDING, triggerRect.top - MENU_GAP - height)
      : Math.min(
          triggerRect.bottom + MENU_GAP,
          viewportHeight - VIEWPORT_PADDING - height
        );

    setPosition({
      left,
      top,
      width: menuWidth,
      maxHeight,
      ready: true,
    });
  }, [align]);

  useEffect(() => {
    if (!open) return undefined;

    let frameId;

    const schedulePositionUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updatePosition);
    };

    const handlePointerDown = (event) => {
      if (
        rootRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return;
      }

      setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    schedulePositionUpdate();

    window.addEventListener('resize', schedulePositionUpdate);
    window.addEventListener('scroll', schedulePositionUpdate, true);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', schedulePositionUpdate);
      window.removeEventListener('scroll', schedulePositionUpdate, true);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, updatePosition]);

  const focusItem = (positionIndex) => {
    if (actionable.length === 0) return;

    const normalizedIndex =
      (positionIndex + actionable.length) % actionable.length;

    const target = actionable[normalizedIndex];

    if (!target) return;

    setActiveIndex(target.index);
    itemRefs.current[target.index]?.focus();
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();

      if (!open) setOpen(true);

      requestAnimationFrame(() => {
        focusItem(event.key === 'ArrowDown' ? 0 : actionable.length - 1);
      });
    }
  };

  const handleMenuKeyDown = (event) => {
    const positionIndex = actionable.findIndex(
      ({ index }) => index === activeIndex
    );

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusItem(positionIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem(positionIndex <= 0 ? actionable.length - 1 : positionIndex - 1);
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

  const triggerNode =
    typeof trigger === 'function' ? trigger({ isOpen: open }) : trigger;

  const itemClasses = (item) =>
    `flex w-full min-w-0 items-center gap-3 rounded-md px-3 py-2 text-start text-sm transition-colors focus-visible:outline-none focus-visible:bg-surface-hover ${
      item.danger
        ? 'text-error hover:bg-error/10'
        : `text-text-secondary hover:bg-surface-hover hover:text-text-primary ${
            item.selected ? 'bg-surface-hover' : ''
          }`
    } ${item.disabled ? 'cursor-not-allowed opacity-50' : ''}`;

  return (
    <div ref={rootRef} className={`relative inline-flex min-w-0 ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            setPosition(null);
            setOpen(true);
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        className="inline-flex min-w-0 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {triggerNode}
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={handleMenuKeyDown}
          style={{
            minWidth: `min(200px, calc(100vw - ${VIEWPORT_PADDING * 2}px))`,
            position: 'fixed',
            top: position?.top ?? 0,
            left: position?.left ?? VIEWPORT_PADDING,
            width: position?.width ?? 'max-content',
            maxWidth: `calc(100vw - ${VIEWPORT_PADDING * 2}px)`,
            maxHeight: position?.maxHeight ?? 'calc(100vh - 16px)',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            visibility: position?.ready ? 'visible' : 'hidden',
          }}
          className={`z-(--z-dropdown) min-w-0 rounded-lg border border-border bg-surface-elevated py-1 shadow-xl animate-slide-in motion-reduce:animate-none ${menuClassName}`}
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
                  className="warp-break-words px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-text-tertiary"
                >
                  {item.label}
                </div>
              );
            }

            const content = (
              <>
                {item.icon && (
                  <Icon
                    name={item.icon}
                    size="sm"
                    className="shrink-0"
                  />
                )}
                <span className="min-w-0 flex-1 warp-break-words">
                  {item.label}
                </span>
                {item.selected && (
                  <Icon
                    name={item.selectedIcon || 'check'}
                    size="sm"
                    className="shrink-0 text-primary"
                  />
                )}
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
                  aria-disabled={item.disabled || undefined}
                  aria-current={item.selected ? 'true' : undefined}
                  tabIndex={item.disabled ? -1 : 0}
                  onClick={(event) => {
                    if (item.disabled) {
                      event.preventDefault();
                      return;
                    }

                    item.onClick?.(item);
                    onSelect?.(item);
                    setOpen(false);
                  }}
                  className={itemClasses(item)}
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
                aria-current={item.selected ? 'true' : undefined}
                tabIndex={item.disabled ? -1 : 0}
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
