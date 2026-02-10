import React, { useState, useEffect } from 'react';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Modal, ModalFooter } from './ui/Modal';
import { apiClient } from '../utils/api';
import { ResourceType, ResourceStatus, Resource, Supplier } from './ResourceList';

export interface ResourceFormData {
  name: string;
  type: ResourceType;
  quantity: string;
  unit: string;
  cost: string;
  status: ResourceStatus;
  supplierId: string;
  orderDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate: string;
  notes: string;
}

interface ResourceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  resource?: Resource;
}

export const ResourceForm: React.FC<ResourceFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  resource,
}) => {
  const [formData, setFormData] = useState<ResourceFormData>({
    name: '',
    type: ResourceType.MATERIAL,
    quantity: '',
    unit: '',
    cost: '',
    status: ResourceStatus.NEEDED,
    supplierId: '',
    orderDate: '',
    expectedDeliveryDate: '',
    actualDeliveryDate: '',
    notes: '',
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof ResourceFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  const isEditMode = !!resource;

  // Fetch suppliers on mount
  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
    }
  }, [isOpen]);

  // Initialize form data when resource prop changes
  useEffect(() => {
    if (resource) {
      setFormData({
        name: resource.name,
        type: resource.type,
        quantity: resource.quantity.toString(),
        unit: resource.unit,
        cost: resource.cost.toString(),
        status: resource.status,
        supplierId: resource.supplierId || '',
        orderDate: resource.orderDate || '',
        expectedDeliveryDate: resource.expectedDeliveryDate || '',
        actualDeliveryDate: resource.actualDeliveryDate || '',
        notes: resource.notes || '',
      });
    } else {
      setFormData({
        name: '',
        type: ResourceType.MATERIAL,
        quantity: '',
        unit: '',
        cost: '',
        status: ResourceStatus.NEEDED,
        supplierId: '',
        orderDate: '',
        expectedDeliveryDate: '',
        actualDeliveryDate: '',
        notes: '',
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [resource, isOpen]);

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const data = await apiClient.get<Supplier[]>('/api/suppliers');
      setSuppliers(data);
    } catch (error: any) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoadingSuppliers(false);
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
    if (errors[name as keyof ResourceFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ResourceFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Resource name is required';
    }

    if (!formData.quantity) {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(parseFloat(formData.quantity))) {
      newErrors.quantity = 'Quantity must be a valid number';
    } else if (parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than zero';
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit is required';
    }

    if (!formData.cost) {
      newErrors.cost = 'Cost is required';
    } else if (isNaN(parseFloat(formData.cost))) {
      newErrors.cost = 'Cost must be a valid number';
    } else if (parseFloat(formData.cost) < 0) {
      newErrors.cost = 'Cost cannot be negative';
    }

    // Validate status transitions
    if (formData.status === ResourceStatus.ORDERED) {
      if (!formData.orderDate) {
        newErrors.orderDate = 'Order date is required when status is Ordered';
      }
      if (!formData.expectedDeliveryDate) {
        newErrors.expectedDeliveryDate = 'Expected delivery date is required when status is Ordered';
      }
    }

    if (formData.status === ResourceStatus.RECEIVED) {
      if (!formData.actualDeliveryDate) {
        newErrors.actualDeliveryDate = 'Actual delivery date is required when status is Received';
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
      const payload: any = {
        name: formData.name.trim(),
        type: formData.type,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit.trim(),
        cost: parseFloat(formData.cost),
        status: formData.status,
        supplierId: formData.supplierId || undefined,
        orderDate: formData.orderDate || undefined,
        expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
        actualDeliveryDate: formData.actualDeliveryDate || undefined,
        notes: formData.notes.trim() || undefined,
      };

      if (isEditMode) {
        // Update existing resource
        await apiClient.put(`/api/resources/${resource.id}`, payload);
      } else {
        // Create new resource
        await apiClient.post(`/api/projects/${projectId}/resources`, payload);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving resource:', error);
      setSubmitError(error.message || 'Failed to save resource. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const typeOptions = [
    { value: ResourceType.MATERIAL, label: 'Material' },
    { value: ResourceType.EQUIPMENT, label: 'Equipment' },
    { value: ResourceType.SUBCONTRACTOR, label: 'Subcontractor' },
    { value: ResourceType.OTHER, label: 'Other' },
  ];

  const statusOptions = [
    { value: ResourceStatus.NEEDED, label: 'Needed' },
    { value: ResourceStatus.ORDERED, label: 'Ordered' },
    { value: ResourceStatus.RECEIVED, label: 'Received' },
    { value: ResourceStatus.CANCELLED, label: 'Cancelled' },
  ];

  const supplierOptions = [
    { value: '', label: 'No supplier' },
    ...suppliers.map((supplier) => ({
      value: supplier.id,
      label: supplier.name,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Resource' : 'Add Resource'}
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
            label="Resource Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g., Hardwood flooring"
            fullWidth
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              options={typeOptions}
              fullWidth
              required
            />

            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={statusOptions}
              fullWidth
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              name="quantity"
              type="number"
              step="0.01"
              min="0"
              value={formData.quantity}
              onChange={handleChange}
              error={errors.quantity}
              placeholder="0"
              fullWidth
              required
            />

            <Input
              label="Unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              error={errors.unit}
              placeholder="e.g., sq ft, boxes, hours"
              fullWidth
              required
            />
          </div>

          <Input
            label="Cost"
            name="cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.cost}
            onChange={handleChange}
            error={errors.cost}
            placeholder="0.00"
            fullWidth
            required
          />

          <Select
            label="Supplier"
            name="supplierId"
            value={formData.supplierId}
            onChange={handleChange}
            options={supplierOptions}
            fullWidth
            disabled={loadingSuppliers}
          />

          {/* Show date fields based on status */}
          {(formData.status === ResourceStatus.ORDERED || formData.status === ResourceStatus.RECEIVED) && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Order Date"
                name="orderDate"
                type="date"
                value={formData.orderDate}
                onChange={handleChange}
                error={errors.orderDate}
                fullWidth
                required={formData.status === ResourceStatus.ORDERED}
              />

              <Input
                label="Expected Delivery Date"
                name="expectedDeliveryDate"
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={handleChange}
                error={errors.expectedDeliveryDate}
                fullWidth
                required={formData.status === ResourceStatus.ORDERED}
              />
            </div>
          )}

          {formData.status === ResourceStatus.RECEIVED && (
            <Input
              label="Actual Delivery Date"
              name="actualDeliveryDate"
              type="date"
              value={formData.actualDeliveryDate}
              onChange={handleChange}
              error={errors.actualDeliveryDate}
              fullWidth
              required
            />
          )}

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
            {isEditMode ? 'Update Resource' : 'Add Resource'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
