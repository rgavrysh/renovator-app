import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SupplierList } from './SupplierList';
import { apiClient } from '../utils/api';

vi.mock('../utils/api');

describe('SupplierList', () => {
  const mockSuppliers = [
    {
      id: '1',
      name: 'ABC Supply',
      contactName: 'John Doe',
      email: 'john@abc.com',
      phone: '555-1234',
      address: '123 Main St',
      notes: 'Preferred supplier',
    },
    {
      id: '2',
      name: 'XYZ Materials',
      contactName: 'Jane Smith',
      email: 'jane@xyz.com',
      phone: '555-5678',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));

    const { container } = render(<SupplierList />);

    // Check for loading spinner
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders suppliers list', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockSuppliers);

    render(<SupplierList />);

    await waitFor(() => {
      expect(screen.getByText('ABC Supply')).toBeInTheDocument();
      expect(screen.getByText('XYZ Materials')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@xyz.com')).toBeInTheDocument();
  });

  it('renders empty state when no suppliers', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([]);

    render(<SupplierList />);

    await waitFor(() => {
      expect(screen.getByText('No suppliers')).toBeInTheDocument();
      expect(screen.getByText('Add suppliers to track vendors and subcontractors')).toBeInTheDocument();
    });
  });

  it('renders error state on fetch failure', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Failed to fetch'));

    render(<SupplierList />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
    });
  });

  it('opens form when add button is clicked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockSuppliers);

    render(<SupplierList />);

    await waitFor(() => {
      expect(screen.getByText('ABC Supply')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Add Supplier/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Add Supplier' })).toBeInTheDocument();
    });
  });

  it('opens form in edit mode when edit button is clicked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockSuppliers);

    render(<SupplierList />);

    await waitFor(() => {
      expect(screen.getByText('ABC Supply')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Edit supplier');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Edit Supplier' })).toBeInTheDocument();
      expect(screen.getByDisplayValue('ABC Supply')).toBeInTheDocument();
    });
  });

  it('deletes supplier when delete button is clicked and confirmed', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockSuppliers);
    vi.mocked(apiClient.delete).mockResolvedValue(undefined);

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<SupplierList />);

    await waitFor(() => {
      expect(screen.getByText('ABC Supply')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete supplier');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(apiClient.delete).toHaveBeenCalledWith('/api/suppliers/1');
    });

    confirmSpy.mockRestore();
  });

  it('does not delete supplier when delete is cancelled', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockSuppliers);

    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<SupplierList />);

    await waitFor(() => {
      expect(screen.getByText('ABC Supply')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete supplier');
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(apiClient.delete).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('calls onSupplierSelect when supplier is clicked', async () => {
    const mockOnSupplierSelect = vi.fn();
    vi.mocked(apiClient.get).mockResolvedValue(mockSuppliers);

    render(<SupplierList onSupplierSelect={mockOnSupplierSelect} />);

    await waitFor(() => {
      expect(screen.getByText('ABC Supply')).toBeInTheDocument();
    });

    const supplierCard = screen.getByText('ABC Supply').closest('div');
    if (supplierCard) {
      fireEvent.click(supplierCard);
    }

    expect(mockOnSupplierSelect).toHaveBeenCalledWith(mockSuppliers[0]);
  });

  it('refreshes list after successful form submission', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(mockSuppliers)
      .mockResolvedValueOnce([...mockSuppliers, { id: '3', name: 'New Supplier' }]);

    vi.mocked(apiClient.post).mockResolvedValue({ id: '3', name: 'New Supplier' });

    render(<SupplierList />);

    await waitFor(() => {
      expect(screen.getByText('ABC Supply')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Add Supplier/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Add Supplier' })).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Supplier Name/i);
    const submitButtons = screen.getAllByRole('button', { name: /Add Supplier/i });
    const submitButton = submitButtons.find(btn => btn.getAttribute('type') === 'submit');

    fireEvent.change(nameInput, { target: { value: 'New Supplier' } });
    if (submitButton) {
      fireEvent.click(submitButton);
    }

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  it('renders without card wrapper when showCard is false', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockSuppliers);

    const { container } = render(<SupplierList showCard={false} />);

    await waitFor(() => {
      expect(screen.getByText('ABC Supply')).toBeInTheDocument();
    });

    // Should not have card elements
    expect(container.querySelector('.card')).not.toBeInTheDocument();
  });

  it('displays all supplier information', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([mockSuppliers[0]]);

    render(<SupplierList />);

    await waitFor(() => {
      expect(screen.getByText('ABC Supply')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@abc.com')).toBeInTheDocument();
      expect(screen.getByText('555-1234')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('Preferred supplier')).toBeInTheDocument();
    });
  });
});
