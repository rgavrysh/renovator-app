import React from 'react';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'xl',
  padding = true,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };
  
  const paddingStyle = padding ? 'px-6 py-8' : '';
  
  return (
    <div
      className={`mx-auto ${sizeStyles[size]} ${paddingStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface PageLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  sidebar,
  header,
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {header}
      <div className="flex">
        {sidebar}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
