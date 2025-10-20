import React from 'react';

interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  animate?: boolean;
  style?: React.CSSProperties;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = '',
  animate = true,
  style = {}
}) => {
  const skeletonStyle: React.CSSProperties = {
    width,
    height,
    borderRadius,
    backgroundColor: '#f1f5f9',
    display: 'inline-block',
    position: 'relative',
    overflow: 'hidden'
  };

  const animationStyle: React.CSSProperties = animate ? {
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-loading 2s infinite'
  } : {};

  // Add CSS animation keyframes to document head if not already present
  React.useEffect(() => {
    if (!animate) return;

    const styleId = 'skeleton-loading-keyframes';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes skeleton-loading {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, [animate]);

  return (
    <div
      className={className}
      style={{
        ...skeletonStyle,
        ...animationStyle,
        ...style
      }}
    />
  );
};

// Predefined skeleton components for common use cases
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className = '' 
}) => (
  <div className={className}>
    {Array.from({ length: lines }, (_, index) => (
      <LoadingSkeleton
        key={index}
        height="16px"
        width={index === lines - 1 ? '75%' : '100%'}
        style={{ marginBottom: index < lines - 1 ? '8px' : '0' }}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={className} style={{ padding: '16px' }}>
    <LoadingSkeleton height="24px" width="60%" style={{ marginBottom: '12px' }} />
    <SkeletonText lines={3} />
    <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
      <LoadingSkeleton height="32px" width="80px" />
      <LoadingSkeleton height="32px" width="80px" />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ 
  rows?: number; 
  columns?: number; 
  className?: string 
}> = ({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}) => (
  <div className={className}>
    {/* Table header */}
    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', padding: '12px 0' }}>
      {Array.from({ length: columns }, (_, index) => (
        <LoadingSkeleton
          key={`header-${index}`}
          height="20px"
          width="120px"
        />
      ))}
    </div>
    
    {/* Table rows */}
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div 
        key={`row-${rowIndex}`} 
        style={{ 
          display: 'flex', 
          gap: '16px', 
          marginBottom: '12px', 
          padding: '16px 0',
          borderBottom: '1px solid #f1f5f9'
        }}
      >
        {Array.from({ length: columns }, (_, colIndex) => (
          <LoadingSkeleton
            key={`cell-${rowIndex}-${colIndex}`}
            height="16px"
            width={colIndex === 0 ? '150px' : '100px'}
          />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonStats: React.FC<{ cards?: number; className?: string }> = ({ 
  cards = 4, 
  className = '' 
}) => (
  <div 
    className={className}
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px'
    }}
  >
    {Array.from({ length: cards }, (_, index) => (
      <div
        key={index}
        style={{
          padding: '24px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          textAlign: 'center'
        }}
      >
        <LoadingSkeleton 
          height="24px" 
          width="24px" 
          style={{ margin: '0 auto 12px' }}
          borderRadius="50%"
        />
        <LoadingSkeleton 
          height="32px" 
          width="60px" 
          style={{ margin: '0 auto 8px' }}
        />
        <LoadingSkeleton 
          height="14px" 
          width="80px" 
          style={{ margin: '0 auto' }}
        />
      </div>
    ))}
  </div>
);

export default LoadingSkeleton;