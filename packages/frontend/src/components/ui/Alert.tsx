import React from 'react';
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const variantStyles = {
    info: {
      container: 'bg-info-50 border-info-200',
      icon: 'text-info-600',
      title: 'text-info-900',
      text: 'text-info-800',
    },
    success: {
      container: 'bg-success-50 border-success-200',
      icon: 'text-success-600',
      title: 'text-success-900',
      text: 'text-success-800',
    },
    warning: {
      container: 'bg-warning-50 border-warning-200',
      icon: 'text-warning-600',
      title: 'text-warning-900',
      text: 'text-warning-800',
    },
    danger: {
      container: 'bg-danger-50 border-danger-200',
      icon: 'text-danger-600',
      title: 'text-danger-900',
      text: 'text-danger-800',
    },
  };
  
  const icons = {
    info: <Info className="w-5 h-5" strokeWidth={1.5} />,
    success: <CheckCircle2 className="w-5 h-5" strokeWidth={1.5} />,
    warning: <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />,
    danger: <XCircle className="w-5 h-5" strokeWidth={1.5} />,
  };
  
  const styles = variantStyles[variant];
  
  return (
    <div className={`rounded-linear border p-4 ${styles.container} ${className}`}>
      <div className="flex">
        <div className={`flex-shrink-0 ${styles.icon}`}>
          {icons[variant]}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-ui font-medium ${styles.title}`}>
              {title}
            </h3>
          )}
          <div className={`text-ui ${title ? 'mt-2' : ''} ${styles.text}`}>
            {children}
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className={`inline-flex rounded-linear p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${styles.icon} hover:opacity-75`}
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
