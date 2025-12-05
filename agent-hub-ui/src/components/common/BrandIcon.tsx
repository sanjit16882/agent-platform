/**
 * BrandIcon Component
 * Displays brand logos with official colors
 */

import React from 'react';
import { getBrandIcon } from '../../services/iconService';

export interface BrandIconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  showLabel?: boolean;
  style?: React.CSSProperties;
}

export const BrandIcon: React.FC<BrandIconProps> = ({
  name,
  size = 20,
  color,
  className = '',
  showLabel = false,
  style = {}
}) => {
  const brandIcon = getBrandIcon(name);
  
  if (!brandIcon) {
    // Fallback for unknown icons
    return (
      <span 
        className={className} 
        style={{ 
          fontSize: `${size}px`, 
          color: color || '#6c757d',
          ...style 
        }}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }
  
  const IconComponent = brandIcon.component as React.ComponentType<any>;
  const iconColor = color || brandIcon.color;
  
  return (
    <div 
      className={`brand-icon ${className}`} 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '8px',
        ...style
      }}
    >
      <IconComponent 
        size={size} 
        color={iconColor}
        style={{ flexShrink: 0 }}
        title={brandIcon.displayName}
      />
      {showLabel && (
        <span style={{ fontSize: '14px', color: '#333', fontWeight: 500 }}>
          {brandIcon.displayName}
        </span>
      )}
    </div>
  );
};

export default BrandIcon;
