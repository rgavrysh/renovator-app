import React, { useState, useEffect } from 'react';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { Modal, ModalFooter } from './ui/Modal';
import { apiClient } from '../utils/api';
import { useTranslation } from 'react-i18next';

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface SupplierFormData {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

interface SupplierFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplier?: Supplier;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  supplier,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SupplierFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditMode = !!supplier;

  // Initialize form data when supplier prop changes
  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        contactName: supplier.contactName || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        notes: supplier.notes || '',
      });
    } else {
      setFormData({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [supplier, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof SupplierFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SupplierFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('supplierForm.validation.nameRequired');
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('supplierForm.validation.invalidEmail');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload: any = {
        name: formData.name.trim(),
        contactName: formData.contactName.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      if (isEditMode) {
        // Update existing supplier
        await apiClient.put(`/api/suppliers/${supplier.id}`, payload);
      } else {
        // Create new supplier
        await apiClient.post('/api/suppliers', payload);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      setSubmitError(error.message || 'Failed to save supplier. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t('supplierForm.editTitle') : t('supplierForm.addTitle')}
      size="lg"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-linear">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          <Input
            label={t('supplierForm.supplierName')}
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder={t('supplierForm.supplierNamePlaceholder')}
            fullWidth
            required
            autoFocus
          />

          <Input
            label={t('supplierForm.contactName')}
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
            error={errors.contactName}
            placeholder={t('supplierForm.contactNamePlaceholder')}
            fullWidth
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('supplierForm.email')}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder={t('supplierForm.emailPlaceholder')}
              fullWidth
            />

            <Input
              label={t('supplierForm.phone')}
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              placeholder={t('supplierForm.phonePlaceholder')}
              fullWidth
            />
          </div>

          <Textarea
            label={t('supplierForm.address')}
            name="address"
            value={formData.address}
            onChange={handleChange}
            error={errors.address}
            placeholder={t('supplierForm.addressPlaceholder')}
            rows={2}
            fullWidth
          />

          <Textarea
            label={t('common.notes')}
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            error={errors.notes}
            placeholder={t('supplierForm.notesPlaceholder')}
            rows={3}
            fullWidth
          />
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isEditMode ? t('supplierForm.updateButton') : t('supplierForm.addButton')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
