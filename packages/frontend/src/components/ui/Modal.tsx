import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-40 animate-fade-in"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div
          className={`relative bg-surface rounded-linear shadow-lg w-full ${sizeStyles[size]} max-h-[calc(100vh-4rem)] flex flex-col animate-pop-in`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              {title && <h2 className="text-title text-gray-900">{title}</h2>}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  aria-label="Dismiss"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="px-6 py-4 flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-subtle rounded-b-linear ${className}`} {...props}>
      {children}
    </div>
  );
};
