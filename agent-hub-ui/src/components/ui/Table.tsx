import React from 'react';

export interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  header?: boolean;
}

export const Table: React.FC<TableProps> = ({ 
  children, 
  className = '' 
}) => {
  const classes = ['af-table', className].filter(Boolean).join(' ');
  
  return (
    <div className="overflow-x-auto">
      <table className={classes}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<TableHeaderProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <thead className={className}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<TableBodyProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <tbody className={className}>
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<TableRowProps> = ({ 
  children, 
  className = '',
  onClick 
}) => {
  const classes = [
    onClick ? 'cursor-pointer hover:bg-gray-50' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <tr className={classes} onClick={onClick}>
      {children}
    </tr>
  );
};

export const TableCell: React.FC<TableCellProps> = ({ 
  children, 
  className = '',
  header = false 
}) => {
  const Component = header ? 'th' : 'td';
  
  return (
    <Component className={className}>
      {children}
    </Component>
  );
};