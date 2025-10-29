import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'critical' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'secondary',
  className = ''
}) => {
  const baseClasses = 'af-badge';
  const variantClasses = {
    primary: 'af-badge-primary',
    secondary: 'af-badge-secondary',
    success: 'af-badge-success',
    warning: 'af-badge-warning',
    critical: 'af-badge-critical',
    info: 'af-badge-info'
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {children}
    </span>
  );
};