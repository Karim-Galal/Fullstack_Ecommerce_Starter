'use client';

import { useId } from 'react';
import { Icon } from '@/components/icons';

const sizeStyles = {
  sm: { input: 'h-9 text-sm ps-9 pe-9', icon: 'start-3' },
  md: { input: 'h-11 text-base ps-10 pe-10', icon: 'start-3.5' },
  lg: { input: 'h-14 text-lg ps-12 pe-12', icon: 'start-4' },
};

const iconSizes = { sm: 'sm', md: 'md', lg: 'lg' };

export function SearchInput({
  value = '',
  onChange,
  onClear,
  onSubmit,
  placeholder = 'Search',
  label,
  size = 'md',
  loading = false,
  disabled = false,
  submitLabel = 'Search',
  clearLabel = 'Clear search',
  className = '',
  inputClassName = '',
  id,
  ...props
}) {
  const autoId = useId();
  const inputId = id || autoId;
  const styles = sizeStyles[size] || sizeStyles.md;
  const hasValue = String(value).length > 0;

  const handleClear = () => {
    if (onClear) onClear();
    onChange?.({ target: { value: '' } });
  };

  const content = (
    <div className={`relative w-full ${className}`}>
      <span
        className={`pointer-events-none absolute inset-y-0 flex items-center text-text-tertiary ${styles.icon}`}
        aria-hidden="true"
      >
        <Icon name="search" size={iconSizes[size]} />
      </span>
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={label || placeholder}
        className={`w-full rounded-lg border border-border bg-surface text-text-primary transition-colors placeholder:text-text-tertiary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-search-cancel-button]:appearance-none ${styles.input} ${inputClassName}`}
        {...props}
      />
      {loading && (
        <span
          className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-text-tertiary"
          aria-hidden="true"
        >
          <Icon name="loading" size="sm" className="animate-spin motion-reduce:animate-none" />
        </span>
      )}
      {hasValue && !loading && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          aria-label={clearLabel}
          className="absolute inset-y-0 end-0 flex items-center pe-3 text-text-tertiary transition-colors hover:text-text-primary focus-visible:outline-none"
        >
          <Icon name="close" size="sm" />
        </button>
      )}
    </div>
  );

  if (onSubmit) {
    return (
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(value);
        }}
      >
        {content}
      </form>
    );
  }

  return content;
}
