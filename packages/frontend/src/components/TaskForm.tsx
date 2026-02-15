import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Modal, ModalFooter } from './ui/Modal';
import { apiClient } from '../utils/api';
import { TaskStatus, TaskPriority } from './TaskList';

export interface TaskFormData {
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  milestoneId: string;
  dueDate: string;
  price: string;
  amount: string;
  unit: string;
}

interface Milestone {
  id: string;
  name: string;
  targetDate: string;
}

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  task?: {
    id: string;
    name: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    milestoneId?: string;
    dueDate?: string;
    price?: number;
    amount?: number;
    unit?: string;
  };
}

export const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  task,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    description: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    milestoneId: '',
    dueDate: '',
    price: '',
    amount: '1',
    unit: '',
  });

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(false);

  const isEditMode = !!task;

  // Compute actual price for display
  const computedActualPrice = (() => {
    const price = parseFloat(formData.price);
    const amount = parseFloat(formData.amount);
    if (!isNaN(price) && !isNaN(amount)) {
      return (price * amount).toFixed(2);
    }
    if (!isNaN(price)) {
      return price.toFixed(2);
    }
    return null;
  })();

  // Load milestones when modal opens
  useEffect(() => {
    if (isOpen && projectId) {
      loadMilestones();
    }
  }, [isOpen, projectId]);

  // Initialize form data when task prop changes
  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        milestoneId: task.milestoneId || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        price: task.price != null ? task.price.toString() : '',
        amount: task.amount != null ? task.amount.toString() : '1',
        unit: task.unit || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        milestoneId: '',
        dueDate: '',
        price: '',
        amount: '1',
        unit: '',
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [task, isOpen]);

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
    if (errors[name as keyof TaskFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TaskFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('taskForm.validation.nameRequired');
    }

    // Validate price if provided
    if (formData.price && isNaN(parseFloat(formData.price))) {
      newErrors.price = t('taskForm.validation.priceInvalid');
    }

    if (formData.price && parseFloat(formData.price) < 0) {
      newErrors.price = t('taskForm.validation.priceNegative');
    }

    // Validate amount if provided
    if (formData.amount && isNaN(parseFloat(formData.amount))) {
      newErrors.amount = t('taskForm.validation.amountInvalid');
    }

    if (formData.amount && parseFloat(formData.amount) < 0) {
      newErrors.amount = t('taskForm.validation.amountNegative');
    }

    // Validate due date if provided
    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today && !isEditMode) {
        newErrors.dueDate = t('taskForm.validation.dueDatePast');
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
        status: formData.status,
        priority: formData.priority,
        milestoneId: formData.milestoneId || undefined,
        dueDate: formData.dueDate || undefined,
        unit: formData.unit.trim() || undefined,
      };

      // Only include pricing fields if they have values
      if (formData.price) {
        payload.price = parseFloat(formData.price);
      }

      if (formData.amount) {
        payload.amount = parseFloat(formData.amount);
      }

      if (isEditMode) {
        // Update existing task
        await apiClient.put(`/api/tasks/${task.id}`, payload);
      } else {
        // Create new task
        await apiClient.post(`/api/projects/${projectId}/tasks`, payload);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving task:', error);
      setSubmitError(error.message || 'Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const statusOptions = [
    { value: TaskStatus.TODO, label: t('taskStatus.todo') },
    { value: TaskStatus.IN_PROGRESS, label: t('taskStatus.in_progress') },
    { value: TaskStatus.COMPLETED, label: t('taskStatus.completed') },
    { value: TaskStatus.BLOCKED, label: t('taskStatus.blocked') },
  ];

  const priorityOptions = [
    { value: TaskPriority.LOW, label: t('taskPriority.low') },
    { value: TaskPriority.MEDIUM, label: t('taskPriority.medium') },
    { value: TaskPriority.HIGH, label: t('taskPriority.high') },
    { value: TaskPriority.URGENT, label: t('taskPriority.urgent') },
  ];

  const milestoneOptions = [
    { value: '', label: t('taskForm.noMilestone') },
    ...milestones.map((m) => ({
      value: m.id,
      label: m.name,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t('taskForm.editTitle') : t('taskForm.createTitle')}
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
            label={t('taskForm.taskName')}
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder={t('taskForm.taskNamePlaceholder')}
            fullWidth
            required
            autoFocus
          />

          <Textarea
            label={t('common.description')}
            name="description"
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
            placeholder={t('taskForm.descriptionPlaceholder')}
            rows={3}
            fullWidth
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('common.status')}
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={statusOptions}
              fullWidth
              required
            />

            <Select
              label={t('common.priority')}
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              options={priorityOptions}
              fullWidth
              required
            />
          </div>

          <Select
            label={t('taskForm.milestone')}
            name="milestoneId"
            value={formData.milestoneId}
            onChange={handleChange}
            options={milestoneOptions}
            fullWidth
            disabled={isLoadingMilestones}
          />

          <Input
            label={t('taskForm.dueDate')}
            name="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={handleChange}
            error={errors.dueDate}
            fullWidth
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label={t('taskForm.price')}
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              error={errors.price}
              placeholder="0.00"
              fullWidth
            />

            <Input
              label={t('taskForm.amount')}
              name="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={handleChange}
              error={errors.amount}
              placeholder="1"
              fullWidth
            />

            <Input
              label={t('taskForm.unit')}
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              error={errors.unit}
              placeholder={t('taskForm.unitPlaceholder')}
              fullWidth
            />
          </div>

          {/* Computed actual price display */}
          {computedActualPrice && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-linear">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('taskForm.actualPrice')}</span>
                <span className="text-sm font-semibold text-gray-900">
                  ${computedActualPrice}
                </span>
              </div>
            </div>
          )}
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
            {isEditMode ? t('taskForm.updateButton') : t('taskForm.createButton')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
