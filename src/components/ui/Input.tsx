import React, { useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon,
  id,
  className = '',
  required,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="space-y-1.5 text-left w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-outline select-none"
        >
          {label}
          {required && <span className="text-rose-500 ml-1 font-bold" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
            {icon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full min-h-[44px] bg-surface-container border rounded-xl px-3.5 py-2 text-sm text-on-surface placeholder:text-outline/40 transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
            icon ? 'pl-10' : ''
          } ${
            error ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20' : 'border-outline-variant/30'
          } ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p id={errorId} className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-outline/80 mt-1">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
