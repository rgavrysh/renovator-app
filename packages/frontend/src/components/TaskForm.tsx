import React, { useState, useEffect } from 'react';
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
  estimatedPrice: string;
  actualPrice: string;
  perUnit: string;
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
    estimatedPrice?: number;
    actualPrice?: number;
    perUnit?: string;
  };
}

export const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  task,
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    description: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    milestoneId: '',
    dueDate: '',
    estimatedPrice: '',
    actualPrice: '',
    perUnit: '',
  });

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(false);

  const isEditMode = !!task;

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
        estimatedPrice: task.estimatedPrice != null ? task.estimatedPrice.toString() : '',
        actualPrice: task.actualPrice != null ? task.actualPrice.toString() : '',
        perUnit: task.perUnit || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        milestoneId: '',
        dueDate: '',
        estimatedPrice: '',
        actualPrice: '',
        perUnit: '',
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
      newErrors.name = 'Task name is required';
    }

    // Validate estimated price if provided
    if (formData.estimatedPrice && isNaN(parseFloat(formData.estimatedPrice))) {
      newErrors.estimatedPrice = 'Estimated price must be a valid number';
    }

    if (formData.estimatedPrice && parseFloat(formData.estimatedPrice) < 0) {
      newErrors.estimatedPrice = 'Estimated price cannot be negative';
    }

    // Validate actual price if provided
    if (formData.actualPrice && isNaN(parseFloat(formData.actualPrice))) {
      newErrors.actualPrice = 'Actual price must be a valid number';
    }

    if (formData.actualPrice && parseFloat(formData.actualPrice) < 0) {
      newErrors.actualPrice = 'Actual price cannot be negative';
    }

    // Validate due date if provided
    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today && !isEditMode) {
        newErrors.dueDate = 'Due date cannot be in the past';
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
        perUnit: formData.perUnit.trim() || undefined,
      };

      // Only include pricing fields if they have values
      if (formData.estimatedPrice) {
        payload.estimatedPrice = parseFloat(formData.estimatedPrice);
      }

      if (formData.actualPrice) {
        payload.actualPrice = parseFloat(formData.actualPrice);
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
    { value: TaskStatus.TODO, label: 'To Do' },
    { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
    { value: TaskStatus.COMPLETED, label: 'Completed' },
    { value: TaskStatus.BLOCKED, label: 'Blocked' },
  ];

  const priorityOptions = [
    { value: TaskPriority.LOW, label: 'Low' },
    { value: TaskPriority.MEDIUM, label: 'Medium' },
    { value: TaskPriority.HIGH, label: 'High' },
    { value: TaskPriority.URGENT, label: 'Urgent' },
  ];

  const milestoneOptions = [
    { value: '', label: 'No Milestone' },
    ...milestones.map((m) => ({
      value: m.id,
      label: m.name,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Task' : 'Create Task'}
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
            label="Task Name"
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
            placeholder="Add details about this task..."
            rows={3}
            fullWidth
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={statusOptions}
              fullWidth
              required
            />

            <Select
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              options={priorityOptions}
              fullWidth
              required
            />
          </div>

          <Select
            label="Milestone"
            name="milestoneId"
            value={formData.milestoneId}
            onChange={handleChange}
            options={milestoneOptions}
            fullWidth
            disabled={isLoadingMilestones}
          />

          <Input
            label="Due Date"
            name="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={handleChange}
            error={errors.dueDate}
            fullWidth
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Estimated Price"
              name="estimatedPrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.estimatedPrice}
              onChange={handleChange}
              error={errors.estimatedPrice}
              placeholder="0.00"
              fullWidth
            />

            <Input
              label="Actual Price"
              name="actualPrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.actualPrice}
              onChange={handleChange}
              error={errors.actualPrice}
              placeholder="0.00"
              fullWidth
            />
          </div>

          <Input
            label="Per Unit (Optional)"
            name="perUnit"
            value={formData.perUnit}
            onChange={handleChange}
            error={errors.perUnit}
            placeholder="e.g., sq ft, linear ft, each"
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
            {isEditMode ? 'Update Task' : 'Create Task'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
