import React from 'react';

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
}: ToggleSwitchProps) {
  const switchId = id || (label ? `switch-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      {(label || description) && (
        <div className="min-w-0 flex-1">
          {label && (
            <label
              htmlFor={switchId}
              className={`text-sm font-semibold select-none cursor-pointer block ${
                disabled ? 'text-outline/50' : 'text-on-surface'
              }`}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-outline/80 mt-0.5 select-none">{description}</p>
          )}
        </div>
      )}

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || 'Toggle'}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? 'bg-primary' : 'bg-surface-container-highest border-outline-variant/30'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
