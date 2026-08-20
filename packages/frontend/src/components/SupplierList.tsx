import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { Alert } from './ui/Alert';
import { IconButton } from './ui/IconButton';
import { SupplierForm, Supplier } from './SupplierForm';
import { apiClient } from '../utils/api';
import { useTranslation } from 'react-i18next';
import { Building2, Pencil, Trash2, Loader2 } from 'lucide-react';

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
          icon={<Building2 className="w-12 h-12" strokeWidth={1.5} />}
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
                  <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
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
                <IconButton
                  label={t('common.edit')}
                  icon={<Pencil className="w-4 h-4" strokeWidth={1.5} />}
                  size="sm"
                  onClick={(e) => handleEditSupplier(supplier, e)}
                  disabled={deletingId === supplier.id}
                />
                <IconButton
                  label={t('common.delete')}
                  icon={
                    deletingId === supplier.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                    ) : (
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    )
                  }
                  size="sm"
                  variant="danger"
                  onClick={(e) => handleDeleteSupplier(supplier.id, e)}
                  disabled={deletingId === supplier.id}
                />
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
