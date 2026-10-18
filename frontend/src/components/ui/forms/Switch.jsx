'use client';

import { useId } from 'react';

const sizeStyles = {
  sm: { track: 'h-5 w-9 p-0.5', thumb: 'h-4 w-4' },
  md: { track: 'h-6 w-11 p-0.5', thumb: 'h-5 w-5' },
  lg: { track: 'h-7 w-14 p-0.5', thumb: 'h-6 w-6' },
};

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  name,
  id,
  className = '',
  ...props
}) {
  const autoId = useId();
  const switchId = id || autoId;
  const descriptionId = `${switchId}-description`;
  const styles = sizeStyles[size] || sizeStyles.md;

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <label
        htmlFor={switchId}
        className={`relative mt-0.5 inline-flex flex-shrink-0 items-center rounded-full transition-colors ${
          styles.track
        } ${
          checked ? 'justify-end bg-primary' : 'justify-start bg-border-strong'
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        <input
          id={switchId}
          type="checkbox"
          role="switch"
          name={name}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          aria-describedby={description ? descriptionId : undefined}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden="true"
          className={`pointer-events-none block rounded-full bg-surface-elevated shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface ${
            styles.thumb
          }`}
        />
      </label>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={switchId}
              className={`text-sm font-medium text-text-primary ${
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
            >
              {label}
            </label>
          )}
          {description && (
            <span id={descriptionId} className="text-sm text-text-tertiary">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
