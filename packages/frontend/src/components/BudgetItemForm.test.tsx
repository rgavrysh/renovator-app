import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BudgetItemForm } from './BudgetItemForm';
import { BudgetCategory } from './BudgetItemsList';
import { apiClient } from '../utils/api';

vi.mock('../utils/api', () => ({
  apiClient: {
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('BudgetItemForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const budgetId = 'budget-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders create form with empty fields', () => {
      render(
        <BudgetItemForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          budgetId={budgetId}
        />
      );

      expect(screen.getByText('Add Budget Item')).toBeInTheDocument();
      expect(screen.getByLabelText(/item name/i)).toHaveValue('');
      expect(screen.getByLabelText(/category/i)).toHaveValue(BudgetCategory.MATERIALS);
      expect(screen.getByLabelText(/estimated cost/i)).toHaveValue(null);
      expect(screen.getByLabelText(/actual cost/i)).toHaveValue(0);
    });

    it('validates required fields', async () => {
      render(
        <BudgetItemForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          budgetId={budgetId}
        />
      );

      const submitButton = screen.getByRole('button', { name: /add item/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Item name is required')).toBeInTheDocument();
        expect(screen.getByText('Estimated cost is required')).toBeInTheDocument();
      });

      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('validates numeric fields', async () => {
      render(
        <BudgetItemForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          budgetId={budgetId}
        />
      );

      const nameInput = screen.getByLabelText(/item name/i);
      const estimatedCostInput = screen.getByLabelText(/estimated cost/i);
      const actualCostInput = screen.getByLabelText(/actual cost/i);

      fireEvent.change(nameInput, { target: { value: 'Test Item' } });
      fireEvent.change(estimatedCostInput, { target: { value: '1000' } });
      fireEvent.change(actualCostInput, { target: { value: '-100' } });

      const submitButton = screen.getByRole('button', { name: /add item/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Actual cost cannot be negative')).toBeInTheDocument();
      });

      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('creates budget item with valid data', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        id: 'item-123',
        budgetId,
        name: 'Lumber',
        category: BudgetCategory.MATERIALS,
        estimatedCost: 5000,
        actualCost: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      render(
        <BudgetItemForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          budgetId={budgetId}
        />
      );

      fireEvent.change(screen.getByLabelText(/item name/i), {
        target: { value: 'Lumber' },
      });
      fireEvent.change(screen.getByLabelText(/category/i), {
        target: { value: BudgetCategory.MATERIALS },
      });
      fireEvent.change(screen.getByLabelText(/estimated cost/i), {
        target: { value: '5000' },
      });
      fireEvent.change(screen.getByLabelText(/actual cost/i), {
        target: { value: '0' },
      });
      fireEvent.change(screen.getByLabelText(/notes/i), {
        target: { value: 'For framing' },
      });

      const submitButton = screen.getByRole('button', { name: /add item/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(`/api/budgets/${budgetId}/items`, {
          name: 'Lumber',
          category: BudgetCategory.MATERIALS,
          estimatedCost: 5000,
          actualCost: 0,
          notes: 'For framing',
        });
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('handles API errors during creation', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Network error'));

      render(
        <BudgetItemForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          budgetId={budgetId}
        />
      );

      fireEvent.change(screen.getByLabelText(/item name/i), {
        target: { value: 'Test Item' },
      });
      fireEvent.change(screen.getByLabelText(/estimated cost/i), {
        target: { value: '1000' },
      });

      const submitButton = screen.getByRole('button', { name: /add item/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    const existingItem = {
      id: 'item-123',
      name: 'Existing Item',
      category: BudgetCategory.LABOR,
      estimatedCost: 3000,
      actualCost: 2800,
      notes: 'Original notes',
    };

    it('renders edit form with existing data', () => {
      render(
        <BudgetItemForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          budgetId={budgetId}
          budgetItem={existingItem}
        />
      );

      expect(screen.getByText('Edit Budget Item')).toBeInTheDocument();
      expect(screen.getByLabelText(/item name/i)).toHaveValue('Existing Item');
      expect(screen.getByLabelText(/category/i)).toHaveValue(BudgetCategory.LABOR);
      expect(screen.getByLabelText(/estimated cost/i)).toHaveValue(3000);
      expect(screen.getByLabelText(/actual cost/i)).toHaveValue(2800);
      expect(screen.getByLabelText(/notes/i)).toHaveValue('Original notes');
    });

    it('updates budget item with modified data', async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        ...existingItem,
        name: 'Updated Item',
        actualCost: 3200,
      });

      render(
        <BudgetItemForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          budgetId={budgetId}
          budgetItem={existingItem}
        />
      );

      fireEvent.change(screen.getByLabelText(/item name/i), {
        target: { value: 'Updated Item' },
      });
      fireEvent.change(screen.getByLabelText(/actual cost/i), {
        target: { value: '3200' },
      });

      const submitButton = screen.getByRole('button', { name: /update item/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalledWith(`/api/budget-items/${existingItem.id}`, {
          name: 'Updated Item',
          category: BudgetCategory.LABOR,
          estimatedCost: 3000,
          actualCost: 3200,
          notes: 'Original notes',
        });
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Category Selection', () => {
    it('displays all budget categories', () => {
      render(
        <BudgetItemForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          budgetId={budgetId}
        />
      );

      const categorySelect = screen.getByLabelText(/category/i);
      const options = Array.from(categorySelect.querySelectorAll('option'));
      const optionValues = options.map((opt) => opt.getAttribute('value'));

      expect(optionValues).toContain(BudgetCategory.LABOR);
      expect(optionValues).toContain(BudgetCategory.MATERIALS);
      expect(optionValues).toContain(BudgetCategory.EQUIPMENT);
      expect(optionValues).toContain(BudgetCategory.SUBCONTRACTORS);
      expect(optionValues).toContain(BudgetCategory.PERMITS);
      expect(optionValues).toContain(BudgetCategory.CONTINGENCY);
      expect(optionValues).toContain(BudgetCategory.OTHER);
    });
  });

  describe('Form Interactions', () => {
    it('clears field errors when user types', async () => {
      render(
        <BudgetItemForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          budgetId={budgetId}
        />
      );

      const submitButton = screen.getByRole('button', { name: /add item/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Item name is required')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/item name/i);
      fireEvent.change(nameInput, { target: { value: 'New Item' } });

      await waitFor(() => {
        expect(screen.queryByText('Item name is required')).not.toBeInTheDocument();
      });
    });

    it('calls onClose when cancel button is clicked', () => {
      render(
        <BudgetItemForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          budgetId={budgetId}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
