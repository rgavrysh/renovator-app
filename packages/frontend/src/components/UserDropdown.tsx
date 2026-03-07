import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useGoogleDrive } from '../hooks/useGoogleDrive';

export const UserDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isConnected, googleEmail, loading: driveLoading, connect, disconnect, refreshStatus } = useGoogleDrive();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'google-drive-connected') {
        refreshStatus();
      }
    },
    [refreshStatus],
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const handleWorkItemsLibrary = () => {
    setIsOpen(false);
    navigate('/work-items-library');
  };

  const handleGoogleDriveAction = async () => {
    if (isConnected) {
      if (confirm(t('googleDrive.disconnectConfirm'))) {
        await disconnect();
      }
    } else {
      await connect();
    }
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-linear transition-colors"
      >
        <span>
          {user?.firstName} {user?.lastName}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-linear shadow-lg border border-gray-200 py-1 z-50">
          <button
            onClick={handleWorkItemsLibrary}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('userDropdown.workItemsLibrary')}
          </button>

          <div className="border-t border-gray-200 my-1" />

          {/* Google Drive section */}
          <div className="px-4 py-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.71 3.5L1.15 15l3.43 5.95h6.86l-3.43-5.95L7.71 3.5zm8.58 0l-3.43 5.95 3.43 5.95h6.86L19.72 9.45 16.29 3.5zM12 8.3l-3.43 5.95L12 20.2l3.43-5.95L12 8.3z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  {t('userDropdown.googleDrive')}
                </span>
              </div>
              {!driveLoading && (
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    isConnected
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {isConnected
                    ? t('googleDrive.connected')
                    : t('googleDrive.disconnected')}
                </span>
              )}
            </div>

            {isConnected && googleEmail && (
              <p className="text-xs text-gray-500 mb-2 truncate">{googleEmail}</p>
            )}

            <button
              onClick={handleGoogleDriveAction}
              disabled={driveLoading}
              className={`w-full text-center px-3 py-1.5 text-xs font-medium rounded-linear transition-colors ${
                isConnected
                  ? 'text-red-600 border border-red-200 hover:bg-red-50'
                  : 'text-white bg-primary-600 hover:bg-primary-700'
              } ${driveLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {driveLoading && t('googleDrive.connecting')}
              {!driveLoading && isConnected && t('googleDrive.disconnect')}
              {!driveLoading && !isConnected && t('googleDrive.connect')}
            </button>
          </div>

          <div className="border-t border-gray-200 my-1" />

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('userDropdown.logout')}
          </button>
        </div>
      )}
    </div>
  );
};
