import React, { useState, useEffect } from 'react';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Modal, ModalFooter } from './ui/Modal';
import { apiClient } from '../utils/api';
import { BudgetCategory } from './BudgetItemsList';

export interface BudgetItemFormData {
  name: string;
  category: BudgetCategory;
  estimatedCost: string;
  actualCost: string;
  notes: string;
}

interface BudgetItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  budgetId: string;
  budgetItem?: {
    id: string;
    name: string;
    category: BudgetCategory;
    estimatedCost: number;
    actualCost: number;
    notes?: string;
  };
}

export const BudgetItemForm: React.FC<BudgetItemFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  budgetId,
  budgetItem,
}) => {
  const [formData, setFormData] = useState<BudgetItemFormData>({
    name: '',
    category: BudgetCategory.MATERIALS,
    estimatedCost: '',
    actualCost: '0',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BudgetItemFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditMode = !!budgetItem;

  // Initialize form data when budgetItem prop changes
  useEffect(() => {
    if (budgetItem) {
      setFormData({
        name: budgetItem.name,
        category: budgetItem.category,
        estimatedCost: budgetItem.estimatedCost.toString(),
        actualCost: budgetItem.actualCost.toString(),
        notes: budgetItem.notes || '',
      });
    } else {
      setFormData({
        name: '',
        category: BudgetCategory.MATERIALS,
        estimatedCost: '',
        actualCost: '0',
        notes: '',
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [budgetItem, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof BudgetItemFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BudgetItemFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (!formData.estimatedCost) {
      newErrors.estimatedCost = 'Estimated cost is required';
    } else if (isNaN(parseFloat(formData.estimatedCost))) {
      newErrors.estimatedCost = 'Estimated cost must be a valid number';
    } else if (parseFloat(formData.estimatedCost) < 0) {
      newErrors.estimatedCost = 'Estimated cost cannot be negative';
    }

    if (!formData.actualCost) {
      newErrors.actualCost = 'Actual cost is required';
    } else if (isNaN(parseFloat(formData.actualCost))) {
      newErrors.actualCost = 'Actual cost must be a valid number';
    } else if (parseFloat(formData.actualCost) < 0) {
      newErrors.actualCost = 'Actual cost cannot be negative';
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
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        estimatedCost: parseFloat(formData.estimatedCost),
        actualCost: parseFloat(formData.actualCost),
        notes: formData.notes.trim() || undefined,
      };

      if (isEditMode) {
        // Update existing budget item
        await apiClient.put(`/api/budget-items/${budgetItem.id}`, payload);
      } else {
        // Create new budget item
        await apiClient.post(`/api/budgets/${budgetId}/items`, payload);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving budget item:', error);
      setSubmitError(error.message || 'Failed to save budget item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const categoryOptions = [
    { value: BudgetCategory.LABOR, label: 'Labor' },
    { value: BudgetCategory.MATERIALS, label: 'Materials' },
    { value: BudgetCategory.EQUIPMENT, label: 'Equipment' },
    { value: BudgetCategory.SUBCONTRACTORS, label: 'Subcontractors' },
    { value: BudgetCategory.PERMITS, label: 'Permits' },
    { value: BudgetCategory.CONTINGENCY, label: 'Contingency' },
    { value: BudgetCategory.OTHER, label: 'Other' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Budget Item' : 'Add Budget Item'}
      size="md"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-linear">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          <Input
            label="Item Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g., Lumber materials"
            fullWidth
            required
            autoFocus
          />

          <Select
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={categoryOptions}
            fullWidth
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Estimated Cost"
              name="estimatedCost"
              type="number"
              step="0.01"
              min="0"
              value={formData.estimatedCost}
              onChange={handleChange}
              error={errors.estimatedCost}
              placeholder="0.00"
              fullWidth
              required
            />

            <Input
              label="Actual Cost"
              name="actualCost"
              type="number"
              step="0.01"
              min="0"
              value={formData.actualCost}
              onChange={handleChange}
              error={errors.actualCost}
              placeholder="0.00"
              fullWidth
              required
            />
          </div>

          <Textarea
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            error={errors.notes}
            placeholder="Add any additional notes..."
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
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isEditMode ? 'Update Item' : 'Add Item'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
