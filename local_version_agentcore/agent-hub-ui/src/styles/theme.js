// Enterprise Design System Theme
export const theme = {
  // Color Palette
  colors: {
    // Primary Brand Colors
    primary: '#2563eb',      // Professional blue
    primaryHover: '#1d4ed8',
    primaryLight: '#dbeafe',
    
    // Secondary Colors
    secondary: '#64748b',    // Neutral gray
    secondaryHover: '#475569',
    secondaryLight: '#f1f5f9',
    
    // Status Colors
    success: '#059669',      // Green
    successHover: '#047857',
    successLight: '#d1fae5',
    
    warning: '#d97706',      // Orange
    warningHover: '#b45309',
    warningLight: '#fef3c7',
    
    danger: '#dc2626',       // Red
    dangerHover: '#b91c1c',
    dangerLight: '#fee2e2',
    
    info: '#0891b2',         // Cyan
    infoHover: '#0e7490',
    infoLight: '#cffafe',
    
    // Neutral Colors
    white: '#ffffff',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
    
    // Background Colors
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    backgroundTertiary: '#f1f5f9',
    
    // Border Colors
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    borderDark: '#cbd5e1',
    
    // Text Colors
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    textMuted: '#94a3b8'
  },
  
  // Typography
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  
  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
    '5xl': '48px'
  },
  
  // Border Radius
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px'
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  }
};

// Button Styles
export const buttonStyles = {
  base: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
    borderRadius: theme.borderRadius.md,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    textDecoration: 'none',
    outline: 'none'
  },
  
  variants: {
    primary: {
      backgroundColor: theme.colors.primary,
      color: theme.colors.white,
      boxShadow: theme.shadows.sm,
      ':hover': {
        backgroundColor: theme.colors.primaryHover,
        boxShadow: theme.shadows.md
      },
      ':disabled': {
        backgroundColor: theme.colors.gray300,
        cursor: 'not-allowed'
      }
    },
    
    secondary: {
      backgroundColor: theme.colors.white,
      color: theme.colors.secondary,
      border: `1px solid ${theme.colors.border}`,
      ':hover': {
        backgroundColor: theme.colors.gray50,
        borderColor: theme.colors.borderDark
      },
      ':disabled': {
        backgroundColor: theme.colors.gray100,
        color: theme.colors.gray400,
        cursor: 'not-allowed'
      }
    },
    
    success: {
      backgroundColor: theme.colors.success,
      color: theme.colors.white,
      ':hover': {
        backgroundColor: theme.colors.successHover
      }
    },
    
    warning: {
      backgroundColor: theme.colors.warning,
      color: theme.colors.white,
      ':hover': {
        backgroundColor: theme.colors.warningHover
      }
    },
    
    danger: {
      backgroundColor: theme.colors.danger,
      color: theme.colors.white,
      ':hover': {
        backgroundColor: theme.colors.dangerHover
      }
    },
    
    ghost: {
      backgroundColor: 'transparent',
      color: theme.colors.secondary,
      ':hover': {
        backgroundColor: theme.colors.gray100
      }
    },
    
    'outline-primary': {
      backgroundColor: 'transparent',
      color: theme.colors.primary,
      border: `1px solid ${theme.colors.primary}`,
      ':hover': {
        backgroundColor: theme.colors.primary,
        color: theme.colors.white
      },
      ':disabled': {
        backgroundColor: 'transparent',
        color: theme.colors.gray400,
        borderColor: theme.colors.gray300,
        cursor: 'not-allowed'
      }
    },
    
    'outline-secondary': {
      backgroundColor: 'transparent',
      color: theme.colors.secondary,
      border: `1px solid ${theme.colors.secondary}`,
      ':hover': {
        backgroundColor: theme.colors.secondary,
        color: theme.colors.white
      },
      ':disabled': {
        backgroundColor: 'transparent',
        color: theme.colors.gray400,
        borderColor: theme.colors.gray300,
        cursor: 'not-allowed'
      }
    },
    
    'outline-warning': {
      backgroundColor: 'transparent',
      color: theme.colors.warning,
      border: `1px solid ${theme.colors.warning}`,
      ':hover': {
        backgroundColor: theme.colors.warning,
        color: theme.colors.white
      },
      ':disabled': {
        backgroundColor: 'transparent',
        color: theme.colors.gray400,
        borderColor: theme.colors.gray300,
        cursor: 'not-allowed'
      }
    },
    
    'outline-danger': {
      backgroundColor: 'transparent',
      color: theme.colors.danger,
      border: `1px solid ${theme.colors.danger}`,
      ':hover': {
        backgroundColor: theme.colors.danger,
        color: theme.colors.white
      },
      ':disabled': {
        backgroundColor: 'transparent',
        color: theme.colors.gray400,
        borderColor: theme.colors.gray300,
        cursor: 'not-allowed'
      }
    }
  },
  
  sizes: {
    sm: {
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      fontSize: theme.typography.fontSize.xs
    },
    md: {
      padding: `${theme.spacing.md} ${theme.spacing.xl}`,
      fontSize: theme.typography.fontSize.sm
    },
    lg: {
      padding: `${theme.spacing.lg} ${theme.spacing['2xl']}`,
      fontSize: theme.typography.fontSize.base
    }
  }
};

// Card Styles
export const cardStyles = {
  base: {
    backgroundColor: theme.colors.white,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.lg,
    boxShadow: theme.shadows.sm,
    overflow: 'hidden'
  },
  
  header: {
    padding: theme.spacing.xl,
    borderBottom: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.backgroundSecondary
  },
  
  body: {
    padding: theme.spacing.xl
  },
  
  footer: {
    padding: theme.spacing.xl,
    borderTop: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.backgroundSecondary
  }
};

// Tab Styles
export const tabStyles = {
  container: {
    borderBottom: `1px solid ${theme.colors.border}`
  },
  
  tab: {
    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    ':hover': {
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.gray50
    }
  },
  
  activeTab: {
    color: theme.colors.primary,
    borderBottomColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight
  }
};

// Badge Styles
export const badgeStyles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    borderRadius: theme.borderRadius.full,
    textTransform: 'uppercase',
    letterSpacing: '0.025em'
  },
  
  variants: {
    primary: {
      backgroundColor: theme.colors.primaryLight,
      color: theme.colors.primary
    },
    success: {
      backgroundColor: theme.colors.successLight,
      color: theme.colors.success
    },
    warning: {
      backgroundColor: theme.colors.warningLight,
      color: theme.colors.warning
    },
    danger: {
      backgroundColor: theme.colors.dangerLight,
      color: theme.colors.danger
    },
    info: {
      backgroundColor: theme.colors.infoLight,
      color: theme.colors.info
    },
    secondary: {
      backgroundColor: theme.colors.secondaryLight,
      color: theme.colors.secondary
    }
  }
};

// Form Styles
export const formStyles = {
  input: {
    width: '100%',
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.sm,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.white,
    color: theme.colors.textPrimary,
    transition: 'border-color 0.2s ease-in-out',
    ':focus': {
      outline: 'none',
      borderColor: theme.colors.primary,
      boxShadow: `0 0 0 3px ${theme.colors.primaryLight}`
    }
  },
  
  label: {
    display: 'block',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm
  },
  
  group: {
    marginBottom: theme.spacing.xl
  }
};

// Simple, meaningful icons (using text symbols for enterprise look)
export const icons = {
  // Navigation
  dashboard: '⊞',
  agents: '⚙',
  catalog: '☰',
  management: '⚡',
  analytics: '📊',
  settings: '⚙',
  
  // Actions
  add: '+',
  edit: '✎',
  delete: '×',
  save: '✓',
  cancel: '×',
  refresh: '↻',
  search: '🔍',
  filter: '⚡',
  
  // Status
  success: '✓',
  warning: '⚠',
  error: '×',
  info: 'ⓘ',
  
  // Arrows
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  
  // Files
  file: '📄',
  folder: '📁',
  download: '↓',
  upload: '↑',
  
  // Communication
  notification: '🔔',
  message: '💬',
  email: '✉',
  
  // Time
  clock: '🕐',
  calendar: '📅',
  
  // Security
  lock: '🔒',
  unlock: '🔓',
  key: '🔑',
  
  // System
  server: '🖥',
  database: '🗄',
  network: '🌐',
  
  // Business
  chart: '📈',
  report: '📋',
  money: '💰',
  
  // Development
  code: '</>'
};