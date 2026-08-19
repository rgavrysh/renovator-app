import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  id,
  ...props
}) => {
  const generatedId = React.useId();
  const textareaId = id || generatedId;
  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <div className={`${widthStyle}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-ui-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`
          block w-full px-3 py-2 text-ui
          border rounded-linear
          transition-colors duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0
          disabled:bg-subtle disabled:text-gray-500 disabled:cursor-not-allowed
          resize-y
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
