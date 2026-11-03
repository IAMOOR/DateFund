import React from 'react';

export interface StatusBadgeProps {
  variant?: 'warning' | 'success' | 'error' | 'primary' | 'neutral';
  children: React.ReactNode;
  icon?: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({
  variant = 'neutral',
  children,
  icon,
  pulse = false,
  className = '',
}: StatusBadgeProps) {
  const styles = {
    warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold',
    success: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 font-semibold',
    error: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-semibold',
    primary: 'bg-primary/15 text-primary border-primary/30 font-semibold',
    neutral: 'bg-surface-container-highest text-outline border-outline-variant/30 font-medium',
  };

  const pulseColors = {
    warning: 'bg-amber-500',
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    primary: 'bg-primary',
    neutral: 'bg-outline',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] border leading-normal select-none ${styles[variant]} ${className}`}
    >
      {pulse && (
        <span className={`w-1.5 h-1.5 rounded-full ${pulseColors[variant]} animate-pulse`} />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
}
