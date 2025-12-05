import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'critical' | 'ghost' | 'outline-primary' | 'outline-secondary' | 'outline-warning' | 'outline-danger' | 'outline-critical';
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
  // Map variants to enterprise theme classes
  const getVariantClass = (variant: string) => {
    const variantMap = {
      'primary': 'af-btn-primary',
      'secondary': 'af-btn-secondary',
      'success': 'af-btn-success',
      'warning': 'af-btn-warning',
      'danger': 'af-btn-critical',  // Map danger to critical
      'critical': 'af-btn-critical',
      'ghost': 'af-btn-outline',
      'outline-primary': 'af-btn-outline',
      'outline-secondary': 'af-btn-secondary',
      'outline-warning': 'af-btn-warning',
      'outline-danger': 'af-btn-critical',  // Map danger to critical
      'outline-critical': 'af-btn-critical'
    };
    return variantMap[variant as keyof typeof variantMap] || 'af-btn-primary';
  };

  const getSizeClass = (size: string) => {
    const sizeMap = {
      'sm': 'af-btn-sm',
      'md': '',
      'lg': 'af-btn-lg'
    };
    return sizeMap[size as keyof typeof sizeMap] || '';
  };

  const classes = [
    'af-btn',
    getVariantClass(variant),
    getSizeClass(size),
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      style={style}
      {...props}
    >
      {/* Removed icon support to eliminate fancy icons */}
      {children}
    </button>
  );
};

export default Button;