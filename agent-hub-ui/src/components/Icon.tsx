import React from 'react';
import { iconMap, iconSizes, iconColors, IconConfig } from '../config/iconConfig';
import { IconType } from 'react-icons';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: keyof typeof iconMap;
  size?: keyof typeof iconSizes | number;
  color?: keyof typeof iconColors | string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  'aria-label'?: string;
}

/**
 * Centralized Icon component for consistent iconography throughout the application
 * Uses react-icons with predefined mappings and theme support
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 'medium',
  color,
  className = '',
  style = {},
  title,
  'aria-label': ariaLabel,
  ...props
}) => {
  const IconComponent: IconType = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }

  // Resolve size - can be a preset key or a number
  const resolvedSize = typeof size === 'string' ? iconSizes[size] : size;
  
  // Resolve color - can be a preset key or a color string
  const resolvedColor = color && typeof color === 'string' && color in iconColors 
    ? iconColors[color as keyof typeof iconColors] 
    : color;

  const iconStyle: React.CSSProperties = {
    ...style,
    ...(resolvedColor && { color: resolvedColor }),
  };

  return React.createElement(IconComponent as React.ComponentType<any>, {
    size: resolvedSize,
    className,
    style: iconStyle,
    title: title || ariaLabel,
    'aria-label': ariaLabel,
    ...props
  });
};

/**
 * Hook for getting icon component directly from the map
 * Useful when you need the raw component for advanced usage
 */
export const useIcon = (name: keyof typeof iconMap) => {
  return iconMap[name];
};

/**
 * Utility function to get all available icon names
 */
export const getAvailableIcons = (): string[] => {
  return Object.keys(iconMap);
};

/**
 * Utility function to check if an icon exists
 */
export const hasIcon = (name: string): name is keyof typeof iconMap => {
  return name in iconMap;
};

export default Icon;