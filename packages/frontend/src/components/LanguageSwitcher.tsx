import React from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'uk', label: 'UA' },
] as const;

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const currentLang = i18n.language?.startsWith('uk') ? 'uk' : 'en';

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <div className="flex items-center bg-gray-100 rounded-linear p-0.5">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`
            px-2.5 py-1 text-xs font-medium rounded-linear transition-colors
            ${currentLang === lang.code
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
            }
          `}
          title={lang.code === 'en' ? 'English' : 'Українська'}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};
