import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — an icon-only button has no visible text, so this is its only accessible name. */
  label: string;
  icon: React.ReactNode;
  size?: 'sm' | 'md';
  variant?: 'default' | 'danger';
}

const sizeStyles = {
  sm: 'h-6 w-6',
  md: 'h-7 w-7',
};

const variantStyles = {
  default: 'text-gray-400 hover:text-gray-600 hover:bg-subtle',
  danger: 'text-gray-400 hover:text-danger-600 hover:bg-danger-50',
};

/**
 * The single icon-only action primitive (U3.3 / `D6`). Replaces bare `<svg>`
 * elements inside `<button>` that previously each hand-rolled their own
 * hover treatment and had no accessible name.
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, icon, size = 'md', variant = 'default', className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center rounded transition-colors duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-0
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent
          ${sizeStyles[size]} ${variantStyles[variant]} ${className}
        `}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
