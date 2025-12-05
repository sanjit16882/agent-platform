import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'critical' | 'info' | 'outline';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'primary', 
  className = '', 
  children, 
  ...props 
}) => {
  const getBadgeClass = () => {
    switch (variant) {
      case 'outline':
        return 'badge';
      case 'secondary':
        return 'badge';
      case 'success':
        return 'badge bg-success';
      case 'warning':
        return 'badge bg-warning';
      case 'critical':
        return 'badge bg-danger';
      case 'info':
        return 'badge bg-info';
      default:
        return 'badge bg-primary';
    }
  };
  
  return (
    <span
      className={`${getBadgeClass()} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};