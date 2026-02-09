import React from 'react';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  className = '',
}) => {
  if (orientation === 'vertical') {
    return <div className={`w-px bg-gray-200 ${className}`} />;
  }
  
  return <div className={`h-px bg-gray-200 ${className}`} />;
};
