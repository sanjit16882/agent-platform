import React from 'react';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
}

export const Progress: React.FC<ProgressProps> = ({ 
  value, 
  max = 100, 
  className = '', 
  ...props 
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  return (
    <div
      className={`progress ${className}`}
      style={{ 
        width: '100%', 
        height: '8px', 
        backgroundColor: 'var(--af-gray-200)', 
        borderRadius: 'var(--af-radius)',
        overflow: 'hidden'
      }}
      {...props}
    >
      <div
        className="progress-bar"
        style={{ 
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: 'var(--af-primary)',
          transition: 'width 0.3s ease-in-out'
        }}
      />
    </div>
  );
};