import React from 'react';
import Button from './Button';

interface ErrorFallbackProps {
  error?: Error | string;
  onRetry?: () => void;
  title?: string;
  message?: string;
  showDetails?: boolean;
  variant?: 'error' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
  title,
  message,
  showDetails = false,
  variant = 'error',
  size = 'medium'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          backgroundColor: '#fef3c7',
          borderColor: '#f59e0b',
          iconColor: '#d97706',
          titleColor: '#92400e',
          messageColor: '#78350f',
          icon: '⚠️'
        };
      case 'info':
        return {
          backgroundColor: '#dbeafe',
          borderColor: '#3b82f6',
          iconColor: '#2563eb',
          titleColor: '#1d4ed8',
          messageColor: '#1e40af',
          icon: 'ℹ️'
        };
      default: // error
        return {
          backgroundColor: '#fef2f2',
          borderColor: '#fecaca',
          iconColor: '#dc2626',
          titleColor: '#dc2626',
          messageColor: '#7f1d1d',
          icon: '⚠️'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: '16px',
          iconSize: '24px',
          titleSize: '14px',
          messageSize: '12px'
        };
      case 'large':
        return {
          padding: '32px',
          iconSize: '64px',
          titleSize: '24px',
          messageSize: '16px'
        };
      default: // medium
        return {
          padding: '24px',
          iconSize: '48px',
          titleSize: '18px',
          messageSize: '14px'
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const containerStyle: React.CSSProperties = {
    padding: sizeStyles.padding,
    textAlign: 'center',
    border: `1px solid ${variantStyles.borderColor}`,
    borderRadius: '8px',
    backgroundColor: variantStyles.backgroundColor,
    margin: '16px 0'
  };

  const iconStyle: React.CSSProperties = {
    fontSize: sizeStyles.iconSize,
    color: variantStyles.iconColor,
    marginBottom: '16px',
    display: 'block'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: sizeStyles.titleSize,
    fontWeight: 600,
    color: variantStyles.titleColor,
    margin: '0 0 8px 0'
  };

  const messageStyle: React.CSSProperties = {
    fontSize: sizeStyles.messageSize,
    color: variantStyles.messageColor,
    margin: '0 0 16px 0',
    lineHeight: 1.5
  };

  const detailsStyle: React.CSSProperties = {
    fontSize: '12px',
    color: variantStyles.messageColor,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: '12px',
    borderRadius: '4px',
    textAlign: 'left',
    fontFamily: 'monospace',
    margin: '16px 0',
    maxHeight: '150px',
    overflow: 'auto',
    border: `1px solid ${variantStyles.borderColor}`
  };

  const getDefaultTitle = () => {
    switch (variant) {
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Information';
      default:
        return 'Error';
    }
  };

  const getDefaultMessage = () => {
    switch (variant) {
      case 'warning':
        return 'Something needs your attention.';
      case 'info':
        return 'Here\'s some information you should know.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const errorMessage = typeof error === 'string' ? error : error?.message;

  return (
    <div style={containerStyle}>
      <div style={iconStyle}>{variantStyles.icon}</div>
      
      <h3 style={titleStyle}>
        {title || getDefaultTitle()}
      </h3>
      
      <p style={messageStyle}>
        {message || getDefaultMessage()}
      </p>

      {showDetails && errorMessage && (
        <div style={detailsStyle}>
          <strong>Details:</strong><br />
          {errorMessage}
          {typeof error === 'object' && error?.stack && (
            <>
              <br /><br />
              <strong>Stack Trace:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '10px', marginTop: '4px' }}>
                {error.stack}
              </pre>
            </>
          )}
        </div>
      )}

      {onRetry && (
        <Button
          variant={variant === 'error' ? 'danger' : 'primary'}
          onClick={onRetry}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};

// Predefined error components for common scenarios
export const NetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorFallback
    variant="warning"
    title="Connection Error"
    message="Unable to connect to the server. Please check your internet connection and try again."
    onRetry={onRetry}
  />
);

export const NotFoundError: React.FC<{ resource?: string }> = ({ resource = 'resource' }) => (
  <ErrorFallback
    variant="info"
    title="Not Found"
    message={`The ${resource} you're looking for could not be found.`}
  />
);

export const PermissionError: React.FC = () => (
  <ErrorFallback
    variant="warning"
    title="Access Denied"
    message="You don't have permission to access this resource."
  />
);

export const LoadingError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorFallback
    variant="error"
    title="Loading Failed"
    message="Failed to load data. This might be a temporary issue."
    onRetry={onRetry}
  />
);

export default ErrorFallback;