import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from './Button';
import Card from './Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const containerStyle: React.CSSProperties = {
        padding: '24px',
        textAlign: 'center',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        backgroundColor: '#fef2f2',
        margin: '16px 0'
      };

      const iconStyle: React.CSSProperties = {
        fontSize: '48px',
        color: '#dc2626',
        marginBottom: '16px'
      };

      const titleStyle: React.CSSProperties = {
        fontSize: '18px',
        fontWeight: 600,
        color: '#dc2626',
        margin: '0 0 8px 0'
      };

      const messageStyle: React.CSSProperties = {
        fontSize: '14px',
        color: '#7f1d1d',
        margin: '0 0 16px 0',
        lineHeight: 1.5
      };

      const detailsStyle: React.CSSProperties = {
        fontSize: '12px',
        color: '#991b1b',
        backgroundColor: '#fee2e2',
        padding: '12px',
        borderRadius: '4px',
        textAlign: 'left',
        fontFamily: 'monospace',
        margin: '16px 0',
        maxHeight: '200px',
        overflow: 'auto'
      };

      const buttonContainerStyle: React.CSSProperties = {
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        marginTop: '16px'
      };

      return (
        <div style={containerStyle}>
          <div style={iconStyle}>⚠️</div>
          <h3 style={titleStyle}>Something went wrong</h3>
          <p style={messageStyle}>
            An unexpected error occurred while rendering this component. 
            Please try refreshing the page or contact support if the problem persists.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={detailsStyle}>
              <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                Error Details (Development Mode)
              </summary>
              <div>
                <strong>Error:</strong> {this.state.error.message}
              </div>
              <div style={{ marginTop: '8px' }}>
                <strong>Stack Trace:</strong>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '11px', marginTop: '4px' }}>
                  {this.state.error.stack}
                </pre>
              </div>
              {this.state.errorInfo && (
                <div style={{ marginTop: '8px' }}>
                  <strong>Component Stack:</strong>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '11px', marginTop: '4px' }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </details>
          )}

          <div style={buttonContainerStyle}>
            <Button
              variant="primary"
              onClick={this.handleRetry}
            >
              Try Again
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;