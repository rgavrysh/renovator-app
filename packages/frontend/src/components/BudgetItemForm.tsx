import React, { useState, useEffect } from 'react';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Modal, ModalFooter } from './ui/Modal';
import { apiClient } from '../utils/api';
import { BudgetCategory } from './BudgetItemsList';
import { useTranslation } from 'react-i18next';

export interface BudgetItemFormData {
  name: string;
  category: BudgetCategory;
  customCategory: string;
  milestoneId: string;
  actualCost: string;
  notes: string;
}

interface Milestone {
  id: string;
  name: string;
  targetDate: string;
}

interface BudgetItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  budgetId: string;
  projectId: string;
  budgetItem?: {
    id: string;
    name: string;
    category: BudgetCategory;
    customCategory?: string;
    milestoneId?: string;
    actualCost: number;
    notes?: string;
  };
}

export const BudgetItemForm: React.FC<BudgetItemFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  budgetId,
  projectId,
  budgetItem,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<BudgetItemFormData>({
    name: '',
    category: BudgetCategory.MATERIALS,
    customCategory: '',
    milestoneId: '',
    actualCost: '0',
    notes: '',
  });

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof BudgetItemFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditMode = !!budgetItem;

  useEffect(() => {
    if (isOpen && projectId) {
      loadMilestones();
    }
  }, [isOpen, projectId]);

  // Initialize form data when budgetItem prop changes
  useEffect(() => {
    if (budgetItem) {
      setFormData({
        name: budgetItem.name,
        category: budgetItem.category,
        customCategory: budgetItem.customCategory || '',
        milestoneId: budgetItem.milestoneId || '',
        actualCost: budgetItem.actualCost.toString(),
        notes: budgetItem.notes || '',
      });
    } else {
      setFormData({
        name: '',
        category: BudgetCategory.MATERIALS,
        customCategory: '',
        milestoneId: '',
        actualCost: '0',
        notes: '',
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [budgetItem, isOpen]);

  const loadMilestones = async () => {
    try {
      setIsLoadingMilestones(true);
      const data = await apiClient.get<Milestone[]>(`/api/projects/${projectId}/milestones`);
      setMilestones(data);
    } catch (error: any) {
      console.error('Error loading milestones:', error);
    } finally {
      setIsLoadingMilestones(false);
    }
  };

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
      newErrors.name = t('budgetItemForm.validation.nameRequired');
    }

    if (formData.category === BudgetCategory.OTHER && !formData.customCategory.trim()) {
      newErrors.customCategory = t('budgetItemForm.validation.customCategoryRequired');
    }

    if (!formData.actualCost) {
      newErrors.actualCost = t('budgetItemForm.validation.actualCostRequired');
    } else if (isNaN(parseFloat(formData.actualCost))) {
      newErrors.actualCost = t('budgetItemForm.validation.actualCostInvalid');
    } else if (parseFloat(formData.actualCost) < 0) {
      newErrors.actualCost = t('budgetItemForm.validation.actualCostNegative');
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
        category: formData.category,
        customCategory: formData.category === BudgetCategory.OTHER ? formData.customCategory.trim() || undefined : undefined,
        milestoneId: formData.milestoneId || undefined,
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
      setSubmitError(error.message || t('common.retry'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const categoryOptions = [
    { value: BudgetCategory.LABOR, label: t('budgetCategory.labor') },
    { value: BudgetCategory.MATERIALS, label: t('budgetCategory.materials') },
    { value: BudgetCategory.EQUIPMENT, label: t('budgetCategory.equipment') },
    { value: BudgetCategory.SUBCONTRACTORS, label: t('budgetCategory.subcontractors') },
    { value: BudgetCategory.PERMITS, label: t('budgetCategory.permits') },
    { value: BudgetCategory.CONTINGENCY, label: t('budgetCategory.contingency') },
    { value: BudgetCategory.OTHER, label: t('budgetCategory.other') },
  ];

  const milestoneOptions = [
    { value: '', label: t('budgetItemForm.noMilestone') },
    ...milestones.map((m) => ({
      value: m.id,
      label: m.name,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t('budgetItemForm.editTitle') : t('budgetItemForm.addTitle')}
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
            label={t('budgetItemForm.itemName')}
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder={t('budgetItemForm.itemNamePlaceholder')}
            fullWidth
            required
            autoFocus
          />

          <Select
            label={t('common.category')}
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={categoryOptions}
            fullWidth
            required
          />

          {formData.category === BudgetCategory.OTHER && (
            <Input
              label={t('budgetItemForm.customCategoryLabel')}
              name="customCategory"
              value={formData.customCategory}
              onChange={handleChange}
              error={errors.customCategory}
              placeholder={t('budgetItemForm.customCategoryPlaceholder')}
              fullWidth
              required
              autoFocus
            />
          )}

          <Select
            label={t('budgetItemForm.milestone')}
            name="milestoneId"
            value={formData.milestoneId}
            onChange={handleChange}
            options={milestoneOptions}
            fullWidth
            disabled={isLoadingMilestones}
          />

          <Input
            label={t('budgetItemForm.actualCost')}
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

          <Textarea
            label={t('common.notes')}
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            error={errors.notes}
            placeholder={t('budgetItemForm.notesPlaceholder')}
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
            {isEditMode ? t('budgetItemForm.updateButton') : t('budgetItemForm.addButton')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
