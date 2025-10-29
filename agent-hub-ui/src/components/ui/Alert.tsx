import React from 'react';

export interface AlertProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'critical' | 'info';
  className?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  className = '',
  onClose
}) => {
  const baseClasses = 'af-alert';
  const variantClasses = {
    success: 'af-alert-success',
    warning: 'af-alert-warning',
    critical: 'af-alert-critical',
    info: 'af-alert-info'
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} role="alert">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {children}
        </div>
        {onClose && (
          <button
            type="button"
            className="ml-4 text-gray-400 hover:text-gray-600 af-btn-sm"
            onClick={onClose}
            aria-label="Close alert"
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};