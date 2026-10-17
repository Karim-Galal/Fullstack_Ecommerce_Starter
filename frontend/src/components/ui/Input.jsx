'use client';

import { forwardRef } from 'react';
import { Icon } from '@/components/icons';

export const Input = forwardRef(
  ({ label, error, hint, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-primary mb-1.5">
            {label}
            {props.required && <span className="text-error ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
              <Icon name={leftIcon} size="sm" aria-hidden="true" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full rounded-lg border transition-colors
              bg-surface border-border text-text-primary
              placeholder:text-text-tertiary
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-10' : 'pl-4'}
              ${rightIcon ? 'pr-10' : 'pr-4'}
              py-2.5
              ${error ? 'border-error focus:ring-error' : ''}
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-tertiary">
              <Icon name={rightIcon} size="sm" aria-hidden="true" />
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-error" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    )
  }
);

Input.displayName = 'Input';

export const Textarea = forwardRef(
  ({ label, error, hint, className = '', id, rows = 4, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-text-primary mb-1.5">
            {label}
            {props.required && <span className="text-error ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`
            w-full rounded-lg border transition-colors
            bg-surface border-border text-text-primary
            placeholder:text-text-tertiary
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            p-3 resize-y min-h-[100px]
            ${error ? 'border-error focus:ring-error' : ''}
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="mt-1.5 text-sm text-error" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="mt-1.5 text-sm text-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    )
  }
);

Textarea.displayName = 'Textarea';

export const Select = forwardRef(
  ({ label, error, hint, options = [], className = '', id, placeholder, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-text-primary mb-1.5">
            {label}
            {props.required && <span className="text-error ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`
              w-full rounded-lg border transition-colors
              bg-surface border-border text-text-primary
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              pl-4 pr-10 py-2.5 appearance-none
              ${error ? 'border-error focus:ring-error' : ''}
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
            {...props}
          >
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Icon name="chevronDown" size="sm" className="text-text-tertiary" aria-hidden="true" />
          </div>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-sm text-error" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${selectId}-hint`} className="mt-1.5 text-sm text-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    )
  }
);

Select.displayName = 'Select';

export const Checkbox = forwardRef(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={`
            h-4 w-4 rounded border-border text-primary
            focus:ring-2 focus:ring-primary focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-error' : ''}
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${checkboxId}-error` : hint ? `${checkboxId}-hint` : undefined}
          {...props}
        />
        {label && (
          <label htmlFor={checkboxId} className="text-sm text-text-primary cursor-pointer">
            {label}
            {props.required && <span className="text-error ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        {error && (
          <p id={`${checkboxId}-error`} className="mt-1.5 text-sm text-error" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${checkboxId}-hint`} className="mt-1.5 text-sm text-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    )
  }
);

Checkbox.displayName = 'Checkbox';