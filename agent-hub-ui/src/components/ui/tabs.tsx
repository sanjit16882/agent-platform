import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, children, className = '' }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<TabsListProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`nav nav-tabs ${className}`}
      style={{
        display: 'inline-flex',
        backgroundColor: 'var(--af-gray-100)',
        padding: 'var(--af-spacing-1)',
        borderRadius: 'var(--af-radius)',
        border: 'none'
      }}
    >
      {children}
    </div>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className = '' }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');
  
  const isActive = context.value === value;
  
  return (
    <button
      className={`nav-link ${isActive ? 'active' : ''} ${className}`}
      style={{
        border: 'none',
        borderRadius: 'var(--af-radius-sm)',
        padding: 'var(--af-spacing-2) var(--af-spacing-3)',
        fontSize: 'var(--af-font-size-sm)',
        fontWeight: '500',
        backgroundColor: isActive ? 'var(--af-white)' : 'transparent',
        color: isActive ? 'var(--af-primary)' : 'var(--af-gray-600)',
        boxShadow: isActive ? 'var(--af-shadow-sm)' : 'none'
      }}
      onClick={() => context.onValueChange(value)}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<TabsContentProps> = ({ value, children, className = '' }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');
  
  if (context.value !== value) return null;
  
  return (
    <div 
      className={`tab-content ${className}`}
      style={{ marginTop: 'var(--af-spacing-4)' }}
    >
      {children}
    </div>
  );
};