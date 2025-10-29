import React from 'react';

interface NavigationProps {
  title: string;
  children?: React.ReactNode;
}

interface NavLinkProps {
  href?: string;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
}

export const Navigation: React.FC<NavigationProps> = ({ title, children }) => {
  return (
    <nav className="af-navbar px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-8">
          <h1 className="af-text-xl af-font-semibold af-text-primary">
            {title}
          </h1>
          {children && (
            <div className="flex items-center space-x-1">
              {children}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export const NavLink: React.FC<NavLinkProps> = ({ 
  href, 
  onClick, 
  active = false, 
  children 
}) => {
  const classes = [
    'af-nav-link',
    active ? 'active' : ''
  ].filter(Boolean).join(' ');

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  );
};