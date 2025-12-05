import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`card-header ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`card-body ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`card-footer ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Aliases for compatibility with intelligence components
export const CardContent = CardBody;
export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '', ...props }) => {
  return (
    <h3 
      className={`mb-0 ${className}`}
      style={{ 
        fontSize: 'var(--af-font-size-lg)', 
        fontWeight: '600', 
        color: 'var(--af-gray-900)' 
      }}
      {...props}
    >
      {children}
    </h3>
  );
};