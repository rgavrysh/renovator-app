import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SuppliersPage } from './SuppliersPage';
import { apiClient } from '../utils/api';

vi.mock('../utils/api');

describe('SuppliersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title and subtitle', () => {
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));

    render(<SuppliersPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Suppliers' })).toBeInTheDocument();
    expect(
      screen.getByText('Manage the vendors and subcontractors you work with')
    ).toBeInTheDocument();
  });

  it('renders the global supplier list', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([
      { id: '1', name: 'ABC Supply' },
    ]);

    render(<SuppliersPage />);

    await waitFor(() => {
      expect(screen.getByText('ABC Supply')).toBeInTheDocument();
    });

    expect(apiClient.get).toHaveBeenCalledWith('/api/suppliers');
  });
});
