import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const GoogleDriveCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      setStatus('success');
      if (window.opener) {
        window.opener.postMessage({ type: 'google-drive-connected' }, window.location.origin);
        setTimeout(() => window.close(), 1500);
      }
    } else if (error) {
      setStatus('error');
      setErrorMessage(error);
    } else {
      setStatus('error');
      setErrorMessage('unknown');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">{t('googleDrive.connecting')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('googleDrive.callbackSuccess')}
            </h2>
            <p className="text-sm text-gray-500 mt-4">{t('googleDrive.callbackClosing')}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('googleDrive.callbackError')}
            </h2>
            {errorMessage && (
              <p className="text-gray-600">
                {t('googleDrive.callbackErrorDetail', { error: errorMessage })}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
