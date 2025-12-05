import React from 'react';
import { cardStyles } from '../../styles/theme';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

interface CardComponent extends React.FC<CardProps> {
  Header: React.FC<CardProps>;
  Body: React.FC<CardProps>;
  Footer: React.FC<CardProps>;
  Title: React.FC<CardProps>;
  Text: React.FC<CardProps>;
}

const Card: CardComponent = ({ 
  children, 
  className = '',
  style = {},
  ...props 
}) => {
  const combinedStyle = {
    ...cardStyles.base,
    ...style
  };

  return (
    <div
      className={className}
      style={combinedStyle}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardProps> = ({ 
  children, 
  className = '',
  style = {},
  ...props 
}) => {
  const combinedStyle = {
    ...cardStyles.header,
    ...style
  };

  return (
    <div
      className={className}
      style={combinedStyle}
      {...props}
    >
      {children}
    </div>
  );
};

const CardBody: React.FC<CardProps> = ({ 
  children, 
  className = '',
  style = {},
  ...props 
}) => {
  const combinedStyle = {
    ...cardStyles.body,
    ...style
  };

  return (
    <div
      className={className}
      style={combinedStyle}
      {...props}
    >
      {children}
    </div>
  );
};

const CardFooter: React.FC<CardProps> = ({ 
  children, 
  className = '',
  style = {},
  ...props 
}) => {
  const combinedStyle = {
    ...cardStyles.footer,
    ...style
  };

  return (
    <div
      className={className}
      style={combinedStyle}
      {...props}
    >
      {children}
    </div>
  );
};

const CardTitle: React.FC<CardProps> = ({ 
  children, 
  className = '',
  style = {},
  ...props 
}) => {
  const combinedStyle = {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
    color: '#1e293b',
    ...style
  };

  return (
    <h5
      className={className}
      style={combinedStyle}
      {...props}
    >
      {children}
    </h5>
  );
};

const CardText: React.FC<CardProps> = ({ 
  children, 
  className = '',
  style = {},
  ...props 
}) => {
  const combinedStyle = {
    fontSize: '0.875rem',
    color: '#64748b',
    lineHeight: '1.5',
    ...style
  };

  return (
    <p
      className={className}
      style={combinedStyle}
      {...props}
    >
      {children}
    </p>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Title = CardTitle;
Card.Text = CardText;

export default Card;