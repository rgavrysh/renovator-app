import React, { useState, useEffect } from 'react';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { Modal, ModalFooter } from './ui/Modal';
import { apiClient } from '../utils/api';

export interface MilestoneFormData {
  name: string;
  description: string;
  targetDate: string;
}

interface MilestoneFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  existingMilestonesCount?: number;
  milestone?: {
    id: string;
    name: string;
    description?: string;
    targetDate: string;
  };
}

export const MilestoneForm: React.FC<MilestoneFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  existingMilestonesCount = 0,
  milestone,
}) => {
  const [formData, setFormData] = useState<MilestoneFormData>({
    name: '',
    description: '',
    targetDate: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof MilestoneFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditMode = !!milestone;

  // Initialize form data when milestone prop changes
  useEffect(() => {
    if (milestone) {
      setFormData({
        name: milestone.name,
        description: milestone.description || '',
        targetDate: milestone.targetDate.split('T')[0], // Convert to YYYY-MM-DD format
      });
    } else {
      setFormData({
        name: '',
        description: '',
        targetDate: '',
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [milestone, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof MilestoneFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof MilestoneFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Milestone name is required';
    }

    if (!formData.targetDate) {
      newErrors.targetDate = 'Target date is required';
    } else {
      const targetDate = new Date(formData.targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (targetDate < today && !isEditMode) {
        newErrors.targetDate = 'Target date cannot be in the past';
      }
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
        description: formData.description.trim() || undefined,
        targetDate: formData.targetDate,
        orderIndex: existingMilestonesCount,
      };

      if (isEditMode) {
        // Update existing milestone
        await apiClient.put(`/api/milestones/${milestone.id}`, payload);
      } else {
        // Create new milestone
        await apiClient.post(`/api/projects/${projectId}/milestones`, payload);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving milestone:', error);
      setSubmitError(error.message || 'Failed to save milestone. Please try again.');
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
      title={isEditMode ? 'Edit Milestone' : 'Create Milestone'}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-linear">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          <Input
            label="Milestone Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g., Foundation Complete"
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
            placeholder="Add details about this milestone..."
            rows={3}
            fullWidth
          />

          <Input
            label="Target Date"
            name="targetDate"
            type="date"
            value={formData.targetDate}
            onChange={handleChange}
            error={errors.targetDate}
            fullWidth
            required
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
            {isEditMode ? 'Update Milestone' : 'Create Milestone'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
