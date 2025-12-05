import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea: React.FC<TextareaProps> = ({ 
  className = '', 
  ...props 
}) => {
  return (
    <textarea
      className={`form-control ${className}`}
      {...props}
    />
  );
};