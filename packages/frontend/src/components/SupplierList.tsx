import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { Alert } from './ui/Alert';
import { SupplierForm, Supplier } from './SupplierForm';
import { apiClient } from '../utils/api';
import { useTranslation } from 'react-i18next';

export interface SupplierListProps {
  showCard?: boolean;
  className?: string;
  onSupplierSelect?: (supplier: Supplier) => void;
}

export const SupplierList: React.FC<SupplierListProps> = ({
  showCard = true,
  className = '',
  onSupplierSelect,
}) => {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<Supplier[]>('/api/suppliers');
      setSuppliers(data);
    } catch (err: any) {
      console.error('Error fetching suppliers:', err);
      setError(err.message || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = () => {
    setSelectedSupplier(undefined);
    setIsFormOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleDeleteSupplier = async (supplierId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(t('supplierList.deleteConfirm'))) {
      return;
    }

    try {
      setDeletingId(supplierId);
      await apiClient.delete(`/api/suppliers/${supplierId}`);
      await fetchSuppliers();
    } catch (err: any) {
      console.error('Error deleting supplier:', err);
      alert(err.message || 'Failed to delete supplier');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSuccess = () => {
    fetchSuppliers();
  };

  const handleSupplierClick = (supplier: Supplier) => {
    if (onSupplierSelect) {
      onSupplierSelect(supplier);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      );
    }

    if (suppliers.length === 0) {
      return (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          title={t('supplierList.noSuppliers')}
          description={t('supplierList.addSuppliers')}
          action={
            <Button variant="primary" onClick={handleAddSupplier}>
              {t('supplierList.addSupplier')}
            </Button>
          }
        />
      );
    }

    return (
      <div className="space-y-2">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className={`border border-gray-200 rounded-lg p-4 transition-all hover:border-gray-300 hover:shadow-sm ${
              onSupplierSelect ? 'cursor-pointer' : ''
            }`}
            onClick={() => handleSupplierClick(supplier)}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Supplier Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h4 className="text-sm font-medium text-gray-900">
                    {supplier.name}
                  </h4>
                </div>

                {/* Contact Info */}
                {(supplier.contactName || supplier.email || supplier.phone) && (
                  <div className="mt-2 space-y-1">
                    {supplier.contactName && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">{t('supplierList.contact')}</span> {supplier.contactName}
                      </p>
                    )}
                    {supplier.email && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">{t('supplierList.email')}</span> {supplier.email}
                      </p>
                    )}
                    {supplier.phone && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">{t('supplierList.phone')}</span> {supplier.phone}
                      </p>
                    )}
                  </div>
                )}

                {/* Address */}
                {supplier.address && (
                  <p className="text-xs text-gray-600 mt-2">
                    <span className="font-medium">{t('supplierList.address')}</span> {supplier.address}
                  </p>
                )}

                {/* Notes */}
                {supplier.notes && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                    {supplier.notes}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={(e) => handleEditSupplier(supplier, e)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title={t('common.edit')}
                  disabled={deletingId === supplier.id}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => handleDeleteSupplier(supplier.id, e)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title={t('common.delete')}
                  disabled={deletingId === supplier.id}
                >
                  {deletingId === supplier.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const content = (
    <>
      {renderContent()}
      <SupplierForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        supplier={selectedSupplier}
      />
    </>
  );

  if (showCard) {
    return (
      <Card className={className}>
        <CardHeader
          title={t('supplierList.title')}
          action={
            suppliers.length > 0 && (
              <Button variant="primary" size="sm" onClick={handleAddSupplier}>
                {t('supplierList.addSupplier')}
              </Button>
            )
          }
        />
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return <div className={className}>{content}</div>;
};
