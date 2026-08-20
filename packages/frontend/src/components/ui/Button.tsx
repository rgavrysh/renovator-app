import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-linear transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

  const variantStyles = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-500',
    secondary: 'bg-surface text-gray-700 border border-border hover:bg-subtle active:bg-gray-100 focus-visible:ring-primary-500',
    ghost: 'text-gray-700 hover:bg-subtle active:bg-gray-200/60 focus-visible:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500',
  };

  // Fixed heights so a button lines up with the input beside it (U1.2).
  const sizeStyles = {
    sm: 'h-7 px-3 text-ui-sm gap-1.5',
    md: 'h-8 px-4 text-ui gap-2',
    lg: 'h-9 px-6 text-ui-lg gap-2',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" strokeWidth={2} />}
      {children}
    </button>
  );
};
