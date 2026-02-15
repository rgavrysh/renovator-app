import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">{t('login.title')}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('login.subtitle')}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="text-center">
            <p className="text-gray-700 mb-6">
              {t('login.signInPrompt')}
            </p>
            <Button
              onClick={login}
              variant="primary"
              size="lg"
              className="w-full"
            >
              {t('login.signInButton')}
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>
              {t('login.termsNotice')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
