import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'high' | 'flat' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}, ref) => {
  const base = 'rounded-2xl border transition-all';
  
  const variantStyles = {
    default: 'bg-surface-container-low border-outline-variant/15 shadow-xs',
    high: 'bg-surface-container border-outline-variant/20 shadow-sm',
    flat: 'bg-surface-container-low/50 border-outline-variant/10',
    interactive: 'bg-surface-container-low border-outline-variant/15 shadow-xs hover:border-primary/30 hover:shadow-md cursor-pointer',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      ref={ref}
      className={`${base} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';
