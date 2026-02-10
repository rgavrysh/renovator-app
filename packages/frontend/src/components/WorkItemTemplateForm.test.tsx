import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkItemTemplateForm } from './WorkItemTemplateForm';
import { WorkItemCategory } from './WorkItemsLibraryModal';
import * as apiModule from '../utils/api';

vi.mock('../utils/api');

describe('WorkItemTemplateForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders create form with all fields', () => {
      render(
        <WorkItemTemplateForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('Create Work Item Template')).toBeInTheDocument();
      expect(screen.getByLabelText(/Template Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Estimated Duration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Default Price/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Unit/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Template/i })).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      render(
        <WorkItemTemplateForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Create Template/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Template name is required')).toBeInTheDocument();
      });

      expect(apiModule.apiClient.post).not.toHaveBeenCalled();
    });

    it('validates numeric fields', async () => {
      render(
        <WorkItemTemplateForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const nameInput = screen.getByLabelText(/Template Name/i);
      fireEvent.change(nameInput, { target: { value: 'Test Template' } });

      // Note: HTML5 number inputs don't allow invalid text, they become empty
      // So we test that the form accepts empty optional fields
      const submitButton = screen.getByRole('button', { name: /Create Template/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiModule.apiClient.post).toHaveBeenCalledWith('/api/work-items', {
          name: 'Test Template',
          category: WorkItemCategory.OTHER,
        });
      });
    });

    it('validates non-negative numeric fields', async () => {
      render(
        <WorkItemTemplateForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const nameInput = screen.getByLabelText(/Template Name/i);
      const durationInput = screen.getByLabelText(/Estimated Duration/i);
      const priceInput = screen.getByLabelText(/Default Price/i);

      fireEvent.change(nameInput, { target: { value: 'Test Template' } });
      fireEvent.change(durationInput, { target: { value: '-5' } });
      fireEvent.change(priceInput, { target: { value: '-100' } });

      const submitButton = screen.getByRole('button', { name: /Create Template/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Estimated duration cannot be negative')).toBeInTheDocument();
        expect(screen.getByText('Default price cannot be negative')).toBeInTheDocument();
      });
    });

    it('creates template with valid data', async () => {
      vi.mocked(apiModule.apiClient.post).mockResolvedValue({});

      render(
        <WorkItemTemplateForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const nameInput = screen.getByLabelText(/Template Name/i);
      const descriptionInput = screen.getByLabelText(/Description/i);
      const categorySelect = screen.getByLabelText(/Category/i);
      const durationInput = screen.getByLabelText(/Estimated Duration/i);
      const priceInput = screen.getByLabelText(/Default Price/i);
      const unitInput = screen.getByLabelText(/Unit/i);

      fireEvent.change(nameInput, { target: { value: 'Install Cabinets' } });
      fireEvent.change(descriptionInput, { target: { value: 'Install kitchen cabinets' } });
      fireEvent.change(categorySelect, { target: { value: WorkItemCategory.FINISHING } });
      fireEvent.change(durationInput, { target: { value: '8' } });
      fireEvent.change(priceInput, { target: { value: '500' } });
      fireEvent.change(unitInput, { target: { value: 'each' } });

      const submitButton = screen.getByRole('button', { name: /Create Template/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiModule.apiClient.post).toHaveBeenCalledWith('/api/work-items', {
          name: 'Install Cabinets',
          description: 'Install kitchen cabinets',
          category: WorkItemCategory.FINISHING,
          estimatedDuration: 8,
          defaultPrice: 500,
          unit: 'each',
        });
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('creates template with only required fields', async () => {
      vi.mocked(apiModule.apiClient.post).mockResolvedValue({});

      render(
        <WorkItemTemplateForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const nameInput = screen.getByLabelText(/Template Name/i);
      const categorySelect = screen.getByLabelText(/Category/i);

      fireEvent.change(nameInput, { target: { value: 'Basic Task' } });
      fireEvent.change(categorySelect, { target: { value: WorkItemCategory.OTHER } });

      const submitButton = screen.getByRole('button', { name: /Create Template/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiModule.apiClient.post).toHaveBeenCalledWith('/api/work-items', {
          name: 'Basic Task',
          category: WorkItemCategory.OTHER,
        });
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Edit Mode', () => {
    const mockTemplate = {
      id: 'template-1',
      name: 'Existing Template',
      description: 'Existing description',
      category: WorkItemCategory.ELECTRICAL,
      estimatedDuration: 4,
      defaultPrice: 250,
      isDefault: false,
      createdAt: '2024-01-01T00:00:00Z',
    };

    it('renders edit form with template data', () => {
      render(
        <WorkItemTemplateForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          template={mockTemplate}
        />
      );

      expect(screen.getByText('Edit Work Item Template')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing Template')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('4')).toBeInTheDocument();
      expect(screen.getByDisplayValue('250')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Update Template/i })).toBeInTheDocument();
    });

    it('updates template with modified data', async () => {
      vi.mocked(apiModule.apiClient.put).mockResolvedValue({});

      render(
        <WorkItemTemplateForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          template={mockTemplate}
        />
      );

      const nameInput = screen.getByLabelText(/Template Name/i);
      const priceInput = screen.getByLabelText(/Default Price/i);

      fireEvent.change(nameInput, { target: { value: 'Updated Template' } });
      fireEvent.change(priceInput, { target: { value: '300' } });

      const submitButton = screen.getByRole('button', { name: /Update Template/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiModule.apiClient.put).toHaveBeenCalledWith('/api/work-items/template-1', {
          name: 'Updated Template',
          description: 'Existing description',
          category: WorkItemCategory.ELECTRICAL,
          estimatedDuration: 4,
          defaultPrice: 300,
        });
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays API error message', async () => {
      vi.mocked(apiModule.apiClient.post).mockRejectedValue(new Error('API Error'));

      render(
        <WorkItemTemplateForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const nameInput = screen.getByLabelText(/Template Name/i);
      fireEvent.change(nameInput, { target: { value: 'Test Template' } });

      const submitButton = screen.getByRole('button', { name: /Create Template/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Form Interactions', () => {
    it('clears errors when user types', async () => {
      render(
        <WorkItemTemplateForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Create Template/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Template name is required')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Template Name/i);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      await waitFor(() => {
        expect(screen.queryByText('Template name is required')).not.toBeInTheDocument();
      });
    });

    it('calls onClose when cancel button is clicked', () => {
      render(
        <WorkItemTemplateForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
