import React from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Matches Button's heights so a control and the input beside it align (U1.2).
const sizeStyles = {
  sm: 'h-7 px-2.5 text-ui-sm',
  md: 'h-8 px-3 text-ui',
  lg: 'h-9 px-3.5 text-ui-lg',
};

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  size = 'md',
  className = '',
  id,
  ...props
}) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;
  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <div className={`${widthStyle}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-ui-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          block w-full
          border rounded-linear
          transition-colors duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0
          disabled:bg-subtle disabled:text-gray-500 disabled:cursor-not-allowed
          ${sizeStyles[size]}
          ${error
            ? 'border-red-300 focus:border-red-500 focus-visible:ring-red-500'
            : 'border-border focus:border-primary-500 focus-visible:ring-primary-500'
          }
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-ui-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-ui-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
