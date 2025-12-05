import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'critical' | 'info';
  className?: string;
  style?: React.CSSProperties;
  bg?: string; // For Bootstrap compatibility
  [key: string]: any;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'primary', 
  className = '',
  style = {},
  bg,
  ...props 
}) => {
  // Map variants to enterprise theme classes
  const getVariantClass = (variant: string) => {
    const variantMap = {
      'primary': 'af-badge-primary',
      'secondary': 'af-badge-secondary',
      'success': 'af-badge-success',
      'warning': 'af-badge-warning',
      'danger': 'af-badge-critical',  // Map danger to critical
      'critical': 'af-badge-critical',
      'info': 'af-badge-info'
    };
    return variantMap[variant as keyof typeof variantMap] || 'af-badge-primary';
  };

  // Handle Bootstrap bg prop
  const getBgClass = (bg: string) => {
    const bgMap = {
      'primary': 'af-badge-primary',
      'secondary': 'af-badge-secondary',
      'success': 'af-badge-success',
      'warning': 'af-badge-warning',
      'danger': 'af-badge-critical',  // Map danger to critical
      'critical': 'af-badge-critical',
      'info': 'af-badge-info'
    };
    return bgMap[bg as keyof typeof bgMap] || 'af-badge-primary';
  };

  const classes = [
    'af-badge',
    bg ? getBgClass(bg) : getVariantClass(variant),
    className
  ].filter(Boolean).join(' ');

  return (
    <span
      className={classes}
      style={style}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;