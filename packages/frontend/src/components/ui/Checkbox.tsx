import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <input
          id={checkboxId}
          type="checkbox"
          className={`
            h-4 w-4 rounded border-gray-300 text-primary-600
            focus:ring-2 focus:ring-primary-500 focus:ring-offset-0
            transition-colors cursor-pointer
            disabled:cursor-not-allowed disabled:opacity-50
            ${className}
          `}
          {...props}
        />
      </div>
      {(label || helperText) && (
        <div className="ml-3">
          {label && (
            <label
              htmlFor={checkboxId}
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              {label}
            </label>
          )}
          {helperText && (
            <p className="text-sm text-gray-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
};
