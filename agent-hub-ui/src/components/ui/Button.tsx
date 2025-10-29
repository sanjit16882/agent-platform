import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'critical' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses = 'af-btn';
  const variantClasses = {
    primary: 'af-btn-primary',
    secondary: 'af-btn-secondary',
    outline: 'af-btn-outline',
    success: 'af-btn-success',
    critical: 'af-btn-critical',
    warning: 'af-btn-warning'
  };
  const sizeClasses = {
    sm: 'af-btn-sm',
    md: '',
    lg: 'af-btn-lg'
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="loading-spinner" style={{ marginRight: '8px' }}>⟳</span>
      )}
      {children}
    </button>
  );
};