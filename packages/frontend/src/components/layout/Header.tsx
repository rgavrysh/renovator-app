import React from 'react';

export interface HeaderProps {
  children?: React.ReactNode;
  logo?: React.ReactNode;
  navigation?: React.ReactNode;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  children,
  logo,
  navigation,
  actions,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Logo */}
        {logo && (
          <div className="flex items-center flex-shrink-0">
            {logo}
          </div>
        )}
        
        {/* Navigation */}
        {navigation && (
          <nav className="flex items-center flex-1 ml-8">
            {navigation}
          </nav>
        )}
        
        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-3 ml-auto">
            {actions}
          </div>
        )}
        
        {/* Custom children */}
        {children}
      </div>
    </header>
  );
};

export interface HeaderNavItemProps {
  href: string;
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const HeaderNavItem: React.FC<HeaderNavItemProps> = ({
  href,
  active = false,
  children,
  onClick,
}) => {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`
        px-3 py-2 text-sm font-medium rounded-linear transition-colors
        ${active 
          ? 'text-gray-900 bg-gray-100' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }
      `}
    >
      {children}
    </a>
  );
};
