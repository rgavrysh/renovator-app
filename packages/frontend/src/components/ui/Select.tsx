import React from 'react';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  options: Array<{ value: string; label: string }>;
}

// Matches Input/Button heights so controls line up on the same row (U1.2).
const sizeStyles = {
  sm: 'h-7 px-2.5 text-ui-sm',
  md: 'h-8 px-3 text-ui',
  lg: 'h-9 px-3.5 text-ui-lg',
};

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  size = 'md',
  options,
  className = '',
  id,
  ...props
}) => {
  const generatedId = React.useId();
  const selectId = id || generatedId;
  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <div className={`${widthStyle}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-ui-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
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
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-ui-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-ui-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
