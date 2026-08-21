import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { GoogleIcon } from '../components/icons/GoogleIcon';
import { Hammer } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = () => {
    setIsSigningIn(true);
    login();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-linear bg-primary-600 flex items-center justify-center mb-5">
            <Hammer className="w-6 h-6 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-title-lg text-gray-900">{t('login.title')}</h1>
          <p className="mt-1.5 text-ui text-gray-500">{t('login.subtitle')}</p>
        </div>

        <div className="rounded-linear border border-border bg-surface p-6 space-y-5">
          <p className="text-body text-gray-700 text-center">
            {t('login.signInPrompt')}
          </p>
          <Button
            onClick={handleSignIn}
            variant="secondary"
            size="lg"
            fullWidth
            loading={isSigningIn}
          >
            {!isSigningIn && <GoogleIcon className="w-4 h-4" />}
            {isSigningIn ? t('login.signingIn') : t('login.signInButton')}
          </Button>
        </div>

        <p className="text-center text-ui-xs text-gray-400">
          {t('login.termsNotice')}
        </p>
      </div>
    </div>
  );
};
