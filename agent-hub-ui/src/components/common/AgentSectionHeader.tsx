import React from 'react';
import { Icon } from '../Icon';
import { theme } from '../../styles/theme';

interface AgentSectionHeaderProps {
  title: string;
  count: number;
  description: string;
  icon: string;
  variant: 'active' | 'available' | 'template';
}

const AgentSectionHeader: React.FC<AgentSectionHeaderProps> = ({
  title,
  count,
  description,
  icon,
  variant
}) => {
  const getVariantStyles = () => {
    if (variant === 'active') {
      return {
        backgroundColor: '#f0f9ff',
        borderColor: '#0ea5e9',
        titleColor: '#0369a1',
        countColor: '#0ea5e9'
      };
    } else if (variant === 'template') {
      return {
        backgroundColor: '#fef3c7',
        borderColor: '#fbbf24',
        titleColor: '#92400e',
        countColor: '#fbbf24'
      };
    } else {
      return {
        backgroundColor: '#f8fafc',
        borderColor: '#64748b',
        titleColor: '#475569',
        countColor: '#64748b'
      };
    }
  };

  const styles = getVariantStyles();

  return (
    <div style={{
      padding: theme.spacing.lg,
      backgroundColor: styles.backgroundColor,
      border: `2px solid ${styles.borderColor}`,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.xl
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md
        }}>
          <Icon 
            name={variant === 'active' ? 'success' : 'grid'} 
            size="large" 
            style={{ color: styles.titleColor }}
          />
          <h2 style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: styles.titleColor,
            margin: 0
          }}>
            {title}
          </h2>
        </div>
        
        <div style={{
          backgroundColor: styles.countColor,
          color: 'white',
          padding: `${theme.spacing.xs} ${theme.spacing.md}`,
          borderRadius: theme.borderRadius.full,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          minWidth: '40px',
          textAlign: 'center'
        }}>
          {count}
        </div>
      </div>
      
      <p style={{
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.textSecondary,
        margin: 0,
        lineHeight: 1.5
      }}>
        {description}
      </p>
    </div>
  );
};

export default AgentSectionHeader;