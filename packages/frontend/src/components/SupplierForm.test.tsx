import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SupplierForm, Supplier } from './SupplierForm';
import { apiClient } from '../utils/api';

vi.mock('../utils/api');

describe('SupplierForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form in create mode', () => {
    render(
      <SupplierForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByRole('heading', { name: 'Add Supplier' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Supplier Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument();
  });

  it('renders form in edit mode with supplier data', () => {
    const supplier: Supplier = {
      id: '1',
      name: 'ABC Supply',
      contactName: 'John Doe',
      email: 'john@abc.com',
      phone: '555-1234',
      address: '123 Main St',
      notes: 'Preferred supplier',
    };

    render(
      <SupplierForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        supplier={supplier}
      />
    );

    expect(screen.getByRole('heading', { name: 'Edit Supplier' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('ABC Supply')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@abc.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('555-1234')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Preferred supplier')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <SupplierForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Add Supplier/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Supplier name is required')).toBeInTheDocument();
    });

    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    render(
      <SupplierForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByLabelText(/Supplier Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const submitButton = screen.getByRole('button', { name: /Add Supplier/i });

    fireEvent.change(nameInput, { target: { value: 'ABC Supply' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('creates a new supplier successfully', async () => {
    const mockSupplier = {
      id: '1',
      name: 'ABC Supply',
      contactName: 'John Doe',
      email: 'john@abc.com',
      phone: '555-1234',
      ownerId: 'user-1',
    };

    vi.mocked(apiClient.post).mockResolvedValue(mockSupplier);

    render(
      <SupplierForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByLabelText(/Supplier Name/i);
    const contactInput = screen.getByLabelText(/Contact Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const phoneInput = screen.getByLabelText(/Phone/i);
    const submitButton = screen.getByRole('button', { name: /Add Supplier/i });

    fireEvent.change(nameInput, { target: { value: 'ABC Supply' } });
    fireEvent.change(contactInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@abc.com' } });
    fireEvent.change(phoneInput, { target: { value: '555-1234' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/suppliers', {
        name: 'ABC Supply',
        contactName: 'John Doe',
        email: 'john@abc.com',
        phone: '555-1234',
        address: undefined,
        notes: undefined,
      });
    });

    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('updates an existing supplier successfully', async () => {
    const supplier: Supplier = {
      id: '1',
      name: 'ABC Supply',
      contactName: 'John Doe',
      email: 'john@abc.com',
      phone: '555-1234',
    };

    const updatedSupplier = {
      ...supplier,
      name: 'ABC Building Supply',
    };

    vi.mocked(apiClient.put).mockResolvedValue(updatedSupplier);

    render(
      <SupplierForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        supplier={supplier}
      />
    );

    const nameInput = screen.getByLabelText(/Supplier Name/i);
    const submitButton = screen.getByRole('button', { name: /Update Supplier/i });

    fireEvent.change(nameInput, { target: { value: 'ABC Building Supply' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith('/api/suppliers/1', {
        name: 'ABC Building Supply',
        contactName: 'John Doe',
        email: 'john@abc.com',
        phone: '555-1234',
        address: undefined,
        notes: undefined,
      });
    });

    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles API errors', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

    render(
      <SupplierForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByLabelText(/Supplier Name/i);
    const submitButton = screen.getByRole('button', { name: /Add Supplier/i });

    fireEvent.change(nameInput, { target: { value: 'ABC Supply' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <SupplierForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('clears errors when user starts typing', async () => {
    render(
      <SupplierForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Add Supplier/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Supplier name is required')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Supplier Name/i);
    fireEvent.change(nameInput, { target: { value: 'ABC' } });

    await waitFor(() => {
      expect(screen.queryByText('Supplier name is required')).not.toBeInTheDocument();
    });
  });
});
