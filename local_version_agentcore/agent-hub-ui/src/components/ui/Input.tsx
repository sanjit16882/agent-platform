import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Input: React.FC<InputProps> = ({ 
  className = '', 
  type = 'text',
  ...props 
}) => {
  return (
    <input
      type={type}
      className={`form-control ${className}`}
      {...props}
    />
  );
};

export const Select: React.FC<SelectProps> = ({ 
  className = '', 
  children,
  ...props 
}) => {
  return (
    <select
      className={`form-select ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};

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