import React from 'react';

export interface SidebarProps {
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

export const Sidebar: React.FC<SidebarProps> = ({
  children,
  width = 'md',
}) => {
  const widthStyles = {
    sm: 'w-48',
    md: 'w-64',
    lg: 'w-80',
  };
  
  return (
    <aside className={`${widthStyles[width]} flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto`}>
      <div className="py-6">
        {children}
      </div>
    </aside>
  );
};

export interface SidebarSectionProps {
  title?: string;
  children: React.ReactNode;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  children,
}) => {
  return (
    <div className="mb-6">
      {title && (
        <h3 className="px-6 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <nav className="space-y-1 px-3">
        {children}
      </nav>
    </div>
  );
};

export interface SidebarItemProps {
  href: string;
  active?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  badge?: React.ReactNode;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  href,
  active = false,
  icon,
  children,
  onClick,
  badge,
}) => {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`
        flex items-center justify-between px-3 py-2 text-sm font-medium rounded-linear transition-colors
        ${active 
          ? 'text-gray-900 bg-gray-100' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex-shrink-0">
            {icon}
          </span>
        )}
        <span>{children}</span>
      </div>
      {badge && (
        <span className="ml-auto">
          {badge}
        </span>
      )}
    </a>
  );
};
