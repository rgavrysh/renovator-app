import React, { useState, useEffect } from 'react';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Modal, ModalFooter } from './ui/Modal';
import { apiClient } from '../utils/api';
import { WorkItemCategory, WorkItemTemplate } from './WorkItemsLibraryModal';

export interface WorkItemTemplateFormData {
  name: string;
  description: string;
  category: WorkItemCategory;
  estimatedDuration: string;
  defaultPrice: string;
  unit: string;
}

interface WorkItemTemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  template?: WorkItemTemplate;
}

export const WorkItemTemplateForm: React.FC<WorkItemTemplateFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  template,
}) => {
  const [formData, setFormData] = useState<WorkItemTemplateFormData>({
    name: '',
    description: '',
    category: WorkItemCategory.OTHER,
    estimatedDuration: '',
    defaultPrice: '',
    unit: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof WorkItemTemplateFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditMode = !!template;

  // Initialize form data when template prop changes
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        category: template.category,
        estimatedDuration: template.estimatedDuration != null ? template.estimatedDuration.toString() : '',
        defaultPrice: template.defaultPrice != null ? template.defaultPrice.toString() : '',
        unit: '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: WorkItemCategory.OTHER,
        estimatedDuration: '',
        defaultPrice: '',
        unit: '',
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [template, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof WorkItemTemplateFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof WorkItemTemplateFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    // Validate estimated duration if provided
    if (formData.estimatedDuration) {
      const duration = parseFloat(formData.estimatedDuration);
      if (isNaN(duration)) {
        newErrors.estimatedDuration = 'Estimated duration must be a valid number';
      } else if (duration < 0) {
        newErrors.estimatedDuration = 'Estimated duration cannot be negative';
      }
    }

    // Validate default price if provided
    if (formData.defaultPrice) {
      const price = parseFloat(formData.defaultPrice);
      if (isNaN(price)) {
        newErrors.defaultPrice = 'Default price must be a valid number';
      } else if (price < 0) {
        newErrors.defaultPrice = 'Default price cannot be negative';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
      };

      // Only include optional fields if they have values
      if (formData.estimatedDuration) {
        payload.estimatedDuration = parseFloat(formData.estimatedDuration);
      }

      if (formData.defaultPrice) {
        payload.defaultPrice = parseFloat(formData.defaultPrice);
      }

      if (formData.unit.trim()) {
        payload.unit = formData.unit.trim();
      }

      if (isEditMode) {
        // Update existing template
        await apiClient.put(`/api/work-items/${template.id}`, payload);
      } else {
        // Create new template
        await apiClient.post('/api/work-items', payload);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving work item template:', error);
      setSubmitError(error.message || 'Failed to save work item template. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const categoryOptions = [
    { value: WorkItemCategory.DEMOLITION, label: 'Demolition' },
    { value: WorkItemCategory.FRAMING, label: 'Framing' },
    { value: WorkItemCategory.ELECTRICAL, label: 'Electrical' },
    { value: WorkItemCategory.PLUMBING, label: 'Plumbing' },
    { value: WorkItemCategory.HVAC, label: 'HVAC' },
    { value: WorkItemCategory.DRYWALL, label: 'Drywall' },
    { value: WorkItemCategory.PAINTING, label: 'Painting' },
    { value: WorkItemCategory.FLOORING, label: 'Flooring' },
    { value: WorkItemCategory.FINISHING, label: 'Finishing' },
    { value: WorkItemCategory.CLEANUP, label: 'Cleanup' },
    { value: WorkItemCategory.INSPECTION, label: 'Inspection' },
    { value: WorkItemCategory.OTHER, label: 'Other' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Work Item Template' : 'Create Work Item Template'}
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
            label="Template Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g., Install kitchen cabinets"
            fullWidth
            required
            autoFocus
          />

          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
            placeholder="Add details about this work item..."
            rows={3}
            fullWidth
          />

          <Select
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={categoryOptions}
            error={errors.category}
            fullWidth
            required
          />

          <Input
            label="Estimated Duration (hours)"
            name="estimatedDuration"
            type="number"
            step="0.5"
            min="0"
            value={formData.estimatedDuration}
            onChange={handleChange}
            error={errors.estimatedDuration}
            placeholder="e.g., 8"
            fullWidth
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Default Price"
              name="defaultPrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.defaultPrice}
              onChange={handleChange}
              error={errors.defaultPrice}
              placeholder="0.00"
              fullWidth
            />

            <Input
              label="Unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              error={errors.unit}
              placeholder="e.g., sq ft, each"
              fullWidth
            />
          </div>
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
            {isEditMode ? 'Update Template' : 'Create Template'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
