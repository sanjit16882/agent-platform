import {
  FiZap,
  FiCpu,
  FiHome,
  FiUpload,
  FiLink,
  FiShield,
  FiTrendingUp,
  FiDatabase,
  FiPlay,
  FiDownload,
  FiEye,
  FiEdit,
  FiGrid,
  FiSettings,
  FiUsers,
  FiActivity,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiTarget,
  FiAward
} from 'react-icons/fi';
import { IconType } from 'react-icons';

export interface IconConfig {
  name: string;
  component: IconType;
  size?: number;
  color?: string;
  className?: string;
}

export interface IconTheme {
  primary: IconConfig[];
  navigation: IconConfig[];
  actions: IconConfig[];
}

// Icon mapping for consistent usage throughout the application
export const iconMap = {
  // Brand and main navigation
  agentHub: FiZap,           // Replace ⚡
  agent: FiCpu,              // Replace 🤖
  dashboard: FiHome,         // Replace 🏠
  upload: FiUpload,          // Replace 🚀
  enterprise: FiLink,        // Replace 🔌
  security: FiShield,        // Replace 🔒
  analytics: FiTrendingUp,   // Replace 📊
  
  // Navigation icons
  home: FiHome,
  grid: FiGrid,
  settings: FiSettings,
  users: FiUsers,
  
  // Action icons
  play: FiPlay,
  download: FiDownload,
  view: FiEye,
  edit: FiEdit,
  
  // Status and metrics
  activity: FiActivity,
  chart: FiBarChart2,
  success: FiCheckCircle,
  time: FiClock,
  cost: FiDollarSign,
  target: FiTarget,
  award: FiAward,
  database: FiDatabase
};

// Default icon theme configuration
export const defaultIconTheme: IconTheme = {
  primary: [
    { name: 'agentHub', component: iconMap.agentHub },
    { name: 'agent', component: iconMap.agent },
    { name: 'dashboard', component: iconMap.dashboard }
  ],
  navigation: [
    { name: 'home', component: iconMap.home },
    { name: 'grid', component: iconMap.grid },
    { name: 'upload', component: iconMap.upload },
    { name: 'settings', component: iconMap.settings },
    { name: 'enterprise', component: iconMap.enterprise }
  ],
  actions: [
    { name: 'play', component: iconMap.play },
    { name: 'download', component: iconMap.download },
    { name: 'view', component: iconMap.view },
    { name: 'edit', component: iconMap.edit }
  ]
};

// Icon size presets
export const iconSizes = {
  small: 16,
  medium: 20,
  large: 24,
  xlarge: 32
};

// Professional color palette for icons
export const iconColors = {
  primary: '#0066cc',
  success: '#28a745',
  warning: '#fd7e14',
  danger: '#dc3545',
  info: '#17a2b8',
  dark: '#343a40',
  muted: '#6c757d'
};