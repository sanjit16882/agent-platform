import React from 'react';
import { buttonStyles, theme } from '../../styles/theme';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'outline-primary' | 'outline-secondary' | 'outline-warning' | 'outline-danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  icon?: string | null;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  onClick, 
  type = 'button',
  icon,
  className = '',
  style = {},
  ...props 
}) => {
  const baseStyle = buttonStyles.base;
  const variantStyle = buttonStyles.variants[variant] || buttonStyles.variants.primary;
  const sizeStyle = buttonStyles.sizes[size] || buttonStyles.sizes.md;
  
  const combinedStyle = {
    ...baseStyle,
    ...variantStyle,
    ...sizeStyle,
    ...style,
    ...(disabled && (variantStyle as any)[':disabled'])
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={combinedStyle}
      {...props}
    >
      {icon && <span style={{ fontSize: '14px' }}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;