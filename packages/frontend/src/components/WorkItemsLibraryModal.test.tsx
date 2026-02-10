import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { WorkItemsLibraryModal, WorkItemCategory } from './WorkItemsLibraryModal';
import { apiClient } from '../utils/api';

vi.mock('../utils/api');

const mockWorkItems = [
  {
    id: '1',
    name: 'Remove drywall',
    description: 'Remove existing drywall',
    category: WorkItemCategory.DEMOLITION,
    defaultPrice: 500,
    estimatedDuration: 8,
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Install electrical outlets',
    description: 'Install new electrical outlets',
    category: WorkItemCategory.ELECTRICAL,
    defaultPrice: 150,
    estimatedDuration: 4,
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Paint walls',
    description: 'Paint interior walls',
    category: WorkItemCategory.PAINTING,
    defaultPrice: 800,
    estimatedDuration: 16,
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

describe('WorkItemsLibraryModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const projectId = 'test-project-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <WorkItemsLibraryModal
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    expect(screen.queryByText('Work Items Library')).not.toBeInTheDocument();
  });

  it('should load and display work items when opened', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockWorkItems);

    render(
      <WorkItemsLibraryModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    expect(screen.getByText('Work Items Library')).toBeInTheDocument();

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/work-items');
    });

    await waitFor(() => {
      expect(screen.getByText('Remove drywall')).toBeInTheDocument();
      expect(screen.getByText('Install electrical outlets')).toBeInTheDocument();
      expect(screen.getByText('Paint walls')).toBeInTheDocument();
    });
  });

  it('should display work items grouped by category', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockWorkItems);

    render(
      <WorkItemsLibraryModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Demolition (1)')).toBeInTheDocument();
      expect(screen.getByText('Electrical (1)')).toBeInTheDocument();
      expect(screen.getByText('Painting (1)')).toBeInTheDocument();
    });
  });

  it('should filter work items by category', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockWorkItems);

    render(
      <WorkItemsLibraryModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Remove drywall')).toBeInTheDocument();
    });

    // Click on Electrical category
    const electricalButton = screen.getByText('Electrical (1)');
    fireEvent.click(electricalButton);

    // Should only show electrical items
    expect(screen.queryByText('Remove drywall')).not.toBeInTheDocument();
    expect(screen.getByText('Install electrical outlets')).toBeInTheDocument();
    expect(screen.queryByText('Paint walls')).not.toBeInTheDocument();
  });

  it('should allow selecting multiple items', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockWorkItems);

    render(
      <WorkItemsLibraryModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Remove drywall')).toBeInTheDocument();
    });

    // Initially no items selected
    expect(screen.getByText('0 of 3 items selected')).toBeInTheDocument();

    // Click on first item
    const firstItem = screen.getByText('Remove drywall').closest('div[class*="cursor-pointer"]');
    fireEvent.click(firstItem!);

    // Should show 1 selected
    expect(screen.getByText('1 of 3 items selected')).toBeInTheDocument();

    // Click on second item
    const secondItem = screen.getByText('Install electrical outlets').closest('div[class*="cursor-pointer"]');
    fireEvent.click(secondItem!);

    // Should show 2 selected
    expect(screen.getByText('2 of 3 items selected')).toBeInTheDocument();
  });

  it('should allow deselecting items', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockWorkItems);

    render(
      <WorkItemsLibraryModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Remove drywall')).toBeInTheDocument();
    });

    // Select an item
    const firstItem = screen.getByText('Remove drywall').closest('div[class*="cursor-pointer"]');
    fireEvent.click(firstItem!);
    expect(screen.getByText('1 of 3 items selected')).toBeInTheDocument();

    // Deselect the same item
    fireEvent.click(firstItem!);
    expect(screen.getByText('0 of 3 items selected')).toBeInTheDocument();
  });

  it('should select all items when Select All is clicked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockWorkItems);

    render(
      <WorkItemsLibraryModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Remove drywall')).toBeInTheDocument();
    });

    const selectAllButton = screen.getByText('Select All');
    fireEvent.click(selectAllButton);

    expect(screen.getByText('3 of 3 items selected')).toBeInTheDocument();
  });

  it('should deselect all items when Deselect All is clicked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockWorkItems);

    render(
      <WorkItemsLibraryModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Remove drywall')).toBeInTheDocument();
    });

    // Select all first
    const selectAllButton = screen.getByText('Select All');
    fireEvent.click(selectAllButton);
    expect(screen.getByText('3 of 3 items selected')).toBeInTheDocument();

    // Then deselect all
    const deselectAllButton = screen.getByText('Deselect All');
    fireEvent.click(deselectAllButton);
    expect(screen.getByText('0 of 3 items selected')).toBeInTheDocument();
  });

  it('should submit selected items and call onSuccess', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockWorkItems);
    vi.mocked(apiClient.post).mockResolvedValue({ success: true });

    render(
      <WorkItemsLibraryModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Remove drywall')).toBeInTheDocument();
    });

    // Select two items
    const firstItem = screen.getByText('Remove drywall').closest('div[class*="cursor-pointer"]');
    const secondItem = screen.getByText('Install electrical outlets').closest('div[class*="cursor-pointer"]');
    fireEvent.click(firstItem!);
    fireEvent.click(secondItem!);

    // Click submit button
    const submitButton = screen.getByText('Add 2 Tasks');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        `/api/projects/${projectId}/tasks/bulk`,
        { templateIds: expect.arrayContaining(['1', '2']) }
      );
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should disable submit button when no items are selected', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockWorkItems);

    render(
      <WorkItemsLibraryModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Remove drywall')).toBeInTheDocument();
    });

    // Submit button should be disabled when no items are selected
    const submitButton = screen.getByText('Add 0 Tasks');
    expect(submitButton).toBeDisabled();

    expect(apiClient.post).not.toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

    render(
      <WorkItemsLibraryModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should display default price and estimated duration', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockWorkItems);

    render(
      <WorkItemsLibraryModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Remove drywall')).toBeInTheDocument();
    });

    expect(screen.getByText('Default Price: $500.00')).toBeInTheDocument();
    expect(screen.getByText('Est. Duration: 8 hours')).toBeInTheDocument();
  });

  it('should close modal when Cancel is clicked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockWorkItems);

    render(
      <WorkItemsLibraryModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Remove drywall')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
