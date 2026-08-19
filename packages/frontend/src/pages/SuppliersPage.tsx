import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container } from '../components/layout/Container';
import { SupplierList } from '../components/SupplierList';

export const SuppliersPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-title-lg text-gray-900">{t('nav.suppliers')}</h1>
        <p className="text-ui text-gray-600 mt-1">{t('suppliersPage.subtitle')}</p>
      </div>
      <SupplierList />
    </Container>
  );
};
