import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'critical' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  disabled,
  ...props 
}) => {
  const getButtonClass = () => {
    switch (variant) {
      case 'outline':
        return 'btn btn-outline-primary';
      case 'secondary':
        return 'btn btn-secondary';
      case 'success':
        return 'btn btn-success';
      case 'warning':
        return 'btn btn-warning';
      case 'critical':
        return 'btn btn-danger';
      case 'ghost':
        return 'btn btn-secondary';
      default:
        return 'btn btn-primary';
    }
  };
  
  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return { padding: 'var(--af-spacing-1) var(--af-spacing-3)', fontSize: 'var(--af-font-size-xs)' };
      case 'lg':
        return { padding: 'var(--af-spacing-3) var(--af-spacing-6)', fontSize: 'var(--af-font-size-base)' };
      default:
        return {};
    }
  };
  
  return (
    <button
      className={`${getButtonClass()} ${className}`}
      style={getSizeStyle()}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};