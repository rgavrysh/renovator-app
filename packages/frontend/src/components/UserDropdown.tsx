import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';
import { ChevronDown } from 'lucide-react';

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
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={1.5}
        />
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
                <GoogleDriveIcon className="w-4 h-4 text-gray-500" />
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
