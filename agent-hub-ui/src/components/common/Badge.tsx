import React from 'react';
import { badgeStyles } from '../../styles/theme';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'primary', 
  className = '',
  style = {},
  ...props 
}) => {
  const baseStyle = badgeStyles.base;
  const variantStyle = badgeStyles.variants[variant] || badgeStyles.variants.primary;
  
  const combinedStyle: React.CSSProperties = {
    display: baseStyle.display as React.CSSProperties['display'],
    alignItems: baseStyle.alignItems as React.CSSProperties['alignItems'],
    padding: baseStyle.padding,
    fontSize: baseStyle.fontSize,
    fontWeight: baseStyle.fontWeight,
    borderRadius: baseStyle.borderRadius,
    textTransform: baseStyle.textTransform as React.CSSProperties['textTransform'],
    letterSpacing: baseStyle.letterSpacing,
    backgroundColor: variantStyle.backgroundColor,
    color: variantStyle.color,
    ...style
  };

  return (
    <span
      className={className}
      style={combinedStyle}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;