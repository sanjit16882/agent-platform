// Centralized exports for components
export { default as Icon, useIcon, getAvailableIcons, hasIcon } from './Icon';
export type { IconProps } from './Icon';

// Re-export icon configuration for easy access
export { iconMap, iconSizes, iconColors, defaultIconTheme } from '../config/iconConfig';
export type { IconConfig, IconTheme } from '../config/iconConfig';