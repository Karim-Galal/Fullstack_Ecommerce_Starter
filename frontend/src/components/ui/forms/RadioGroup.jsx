'use client';

import { useId } from 'react';

export function RadioGroup({
  name,
  value,
  onChange,
  options = [],
  label,
  orientation = 'vertical',
  error,
  hint,
  disabled = false,
  id,
  className = '',
  ...props
}) {
  const autoId = useId();
  const groupId = id || autoId;
  const labelId = `${groupId}-label`;
  const errorId = `${groupId}-error`;
  const hintId = `${groupId}-hint`;

  return (
    <div
      role="radiogroup"
      aria-labelledby={label ? labelId : undefined}
      aria-describedby={error ? errorId : hint ? hintId : undefined}
      aria-invalid={error ? 'true' : undefined}
      className={className}
      {...props}
    >
      {label && (
        <span id={labelId} className="mb-2 block text-sm font-medium text-text-primary">
          {label}
        </span>
      )}
      <div
        className={`flex gap-3 ${
          orientation === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col'
        }`}
      >
        {options.map((option) => {
          const optionId = `${groupId}-${option.value}`;
          const isChecked = value === option.value;
          const isDisabled = disabled || option.disabled;

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                isChecked ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface-hover'
              } ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <input
                id={optionId}
                type="radio"
                name={name || groupId}
                value={option.value}
                checked={isChecked}
                disabled={isDisabled}
                onChange={() => onChange?.(option.value)}
                className="mt-0.5 h-4 w-4 border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed"
              />
              <span className="flex flex-col">
                <span className="text-sm font-medium text-text-primary">{option.label}</span>
                {option.description && (
                  <span className="text-sm text-text-tertiary">{option.description}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-error">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm text-text-tertiary">
          {hint}
        </p>
      )}
    </div>
  );
}
