import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResourceForm } from './ResourceForm';
import { ResourceType, ResourceStatus } from './ResourceList';
import { apiClient } from '../utils/api';

vi.mock('../utils/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('ResourceForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const projectId = 'project-123';

  const mockSuppliers = [
    { id: 'supplier-1', name: 'ABC Supplies' },
    { id: 'supplier-2', name: 'XYZ Materials' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get as any).mockResolvedValue(mockSuppliers);
  });

  describe('Create Mode', () => {
    it('should render form with empty fields', async () => {
      render(
        <ResourceForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Add Resource' })).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/resource name/i)).toHaveValue('');
      expect(screen.getByLabelText(/quantity/i)).toHaveValue(null);
      expect(screen.getByLabelText(/unit/i)).toHaveValue('');
      expect(screen.getByLabelText(/cost/i)).toHaveValue(null);
    });

    it('should fetch suppliers on mount', async () => {
      render(
        <ResourceForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/api/suppliers');
      });
    });

    it('should validate required fields', async () => {
      render(
        <ResourceForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      const submitButton = screen.getByRole('button', { name: /add resource/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/resource name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/quantity is required/i)).toBeInTheDocument();
        expect(screen.getByText(/unit is required/i)).toBeInTheDocument();
        expect(screen.getByText(/cost is required/i)).toBeInTheDocument();
      });

      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('should validate quantity is a positive number', async () => {
      render(
        <ResourceForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      const quantityInput = screen.getByLabelText(/quantity/i);
      fireEvent.change(quantityInput, { target: { value: '-5' } });

      const submitButton = screen.getByRole('button', { name: /add resource/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/quantity must be greater than zero/i)).toBeInTheDocument();
      });
    });

    it('should validate cost is non-negative', async () => {
      render(
        <ResourceForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      const costInput = screen.getByLabelText(/cost/i);
      fireEvent.change(costInput, { target: { value: '-100' } });

      const submitButton = screen.getByRole('button', { name: /add resource/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/cost cannot be negative/i)).toBeInTheDocument();
      });
    });

    it('should create resource with valid data', async () => {
      (apiClient.post as any).mockResolvedValue({ id: 'resource-1' });

      render(
        <ResourceForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Add Resource' })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/resource name/i), {
        target: { value: 'Hardwood Flooring' },
      });
      fireEvent.change(screen.getByLabelText(/quantity/i), {
        target: { value: '500' },
      });
      fireEvent.change(screen.getByLabelText(/unit/i), {
        target: { value: 'sq ft' },
      });
      fireEvent.change(screen.getByLabelText(/cost/i), {
        target: { value: '2500.00' },
      });

      const submitButton = screen.getByRole('button', { name: /add resource/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          `/api/projects/${projectId}/resources`,
          expect.objectContaining({
            name: 'Hardwood Flooring',
            type: ResourceType.MATERIAL,
            quantity: 500,
            unit: 'sq ft',
            cost: 2500.00,
            status: ResourceStatus.NEEDED,
          })
        );
      });

      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should allow supplier selection', async () => {
      (apiClient.post as any).mockResolvedValue({ id: 'resource-1' });

      render(
        <ResourceForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/supplier/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/resource name/i), {
        target: { value: 'Lumber' },
      });
      fireEvent.change(screen.getByLabelText(/quantity/i), {
        target: { value: '100' },
      });
      fireEvent.change(screen.getByLabelText(/unit/i), {
        target: { value: 'boards' },
      });
      fireEvent.change(screen.getByLabelText(/cost/i), {
        target: { value: '500' },
      });
      fireEvent.change(screen.getByLabelText(/supplier/i), {
        target: { value: 'supplier-1' },
      });

      const submitButton = screen.getByRole('button', { name: /add resource/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          `/api/projects/${projectId}/resources`,
          expect.objectContaining({
            supplierId: 'supplier-1',
          })
        );
      });
    });
  });

  describe('Status Transitions', () => {
    it('should show date fields when status is Ordered', async () => {
      render(
        <ResourceForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      });

      // Initially, date fields should not be visible
      expect(screen.queryByLabelText(/order date/i)).not.toBeInTheDocument();

      // Change status to Ordered
      fireEvent.change(screen.getByLabelText(/status/i), {
        target: { value: ResourceStatus.ORDERED },
      });

      // Date fields should now be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/order date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/expected delivery date/i)).toBeInTheDocument();
      });
    });

    it('should require order date when status is Ordered', async () => {
      render(
        <ResourceForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/resource name/i), {
        target: { value: 'Test Resource' },
      });
      fireEvent.change(screen.getByLabelText(/quantity/i), {
        target: { value: '10' },
      });
      fireEvent.change(screen.getByLabelText(/unit/i), {
        target: { value: 'units' },
      });
      fireEvent.change(screen.getByLabelText(/cost/i), {
        target: { value: '100' },
      });
      fireEvent.change(screen.getByLabelText(/status/i), {
        target: { value: ResourceStatus.ORDERED },
      });

      const submitButton = screen.getByRole('button', { name: /add resource/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/order date is required when status is ordered/i)).toBeInTheDocument();
        expect(screen.getByText(/expected delivery date is required when status is ordered/i)).toBeInTheDocument();
      });
    });

    it('should show actual delivery date field when status is Received', async () => {
      render(
        <ResourceForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/status/i), {
        target: { value: ResourceStatus.RECEIVED },
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/actual delivery date/i)).toBeInTheDocument();
      });
    });

    it('should require actual delivery date when status is Received', async () => {
      render(
        <ResourceForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/resource name/i), {
        target: { value: 'Test Resource' },
      });
      fireEvent.change(screen.getByLabelText(/quantity/i), {
        target: { value: '10' },
      });
      fireEvent.change(screen.getByLabelText(/unit/i), {
        target: { value: 'units' },
      });
      fireEvent.change(screen.getByLabelText(/cost/i), {
        target: { value: '100' },
      });
      fireEvent.change(screen.getByLabelText(/status/i), {
        target: { value: ResourceStatus.RECEIVED },
      });

      const submitButton = screen.getByRole('button', { name: /add resource/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/actual delivery date is required when status is received/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    const mockResource = {
      id: 'resource-1',
      projectId: 'project-123',
      name: 'Existing Resource',
      type: ResourceType.EQUIPMENT,
      quantity: 5,
      unit: 'units',
      cost: 1000,
      status: ResourceStatus.ORDERED,
      supplierId: 'supplier-1',
      orderDate: '2024-01-15',
      expectedDeliveryDate: '2024-01-30',
      actualDeliveryDate: undefined,
      notes: 'Test notes',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('should render form with resource data', async () => {
      render(
        <ResourceForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
          resource={mockResource}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit Resource' })).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/resource name/i)).toHaveValue('Existing Resource');
      expect(screen.getByLabelText(/quantity/i)).toHaveValue(5);
      expect(screen.getByLabelText(/unit/i)).toHaveValue('units');
      expect(screen.getByLabelText(/cost/i)).toHaveValue(1000);
      expect(screen.getByLabelText(/notes/i)).toHaveValue('Test notes');
    });

    it('should update resource with modified data', async () => {
      (apiClient.put as any).mockResolvedValue({ id: 'resource-1' });

      render(
        <ResourceForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
          resource={mockResource}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit Resource' })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/resource name/i), {
        target: { value: 'Updated Resource' },
      });
      fireEvent.change(screen.getByLabelText(/cost/i), {
        target: { value: '1500' },
      });

      const submitButton = screen.getByRole('button', { name: /update resource/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalledWith(
          `/api/resources/${mockResource.id}`,
          expect.objectContaining({
            name: 'Updated Resource',
            cost: 1500,
          })
        );
      });

      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message on submission failure', async () => {
      (apiClient.post as any).mockRejectedValue(new Error('Network error'));

      render(
        <ResourceForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Add Resource' })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/resource name/i), {
        target: { value: 'Test Resource' },
      });
      fireEvent.change(screen.getByLabelText(/quantity/i), {
        target: { value: '10' },
      });
      fireEvent.change(screen.getByLabelText(/unit/i), {
        target: { value: 'units' },
      });
      fireEvent.change(screen.getByLabelText(/cost/i), {
        target: { value: '100' },
      });

      const submitButton = screen.getByRole('button', { name: /add resource/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Form Interactions', () => {
    it('should close modal on cancel', async () => {
      render(
        <ResourceForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Add Resource' })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should clear field error when user starts typing', async () => {
      render(
        <ResourceForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      const submitButton = screen.getByRole('button', { name: /add resource/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/resource name is required/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/resource name/i);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      await waitFor(() => {
        expect(screen.queryByText(/resource name is required/i)).not.toBeInTheDocument();
      });
    });
  });
});
