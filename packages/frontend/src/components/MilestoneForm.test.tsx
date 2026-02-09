import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MilestoneForm } from './MilestoneForm';
import * as apiModule from '../utils/api';

// Mock the API client
vi.mock('../utils/api', () => ({
  apiClient: {
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('MilestoneForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const projectId = 'test-project-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create form when no milestone is provided', () => {
    render(
      <MilestoneForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    expect(screen.getByRole('heading', { name: 'Create Milestone' })).toBeInTheDocument();
    expect(screen.getByLabelText('Milestone Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Target Date')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Milestone' })).toBeInTheDocument();
  });

  it('renders edit form when milestone is provided', () => {
    const milestone = {
      id: 'milestone-1',
      name: 'Foundation Complete',
      description: 'Complete the foundation work',
      targetDate: '2026-12-31',
    };

    render(
      <MilestoneForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
        milestone={milestone}
      />
    );

    expect(screen.getByText('Edit Milestone')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Foundation Complete')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Complete the foundation work')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-12-31')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update Milestone' })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <MilestoneForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    // Try to submit with empty name
    const nameInput = screen.getByLabelText('Milestone Name');
    const targetDateInput = screen.getByLabelText('Target Date');
    
    // Leave fields empty and try to submit
    const submitButton = screen.getByRole('button', { name: 'Create Milestone' });
    
    // Simulate form submission which will trigger validation
    const form = submitButton.closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    // Wait a bit for any async validation
    await new Promise(resolve => setTimeout(resolve, 100));

    // API should not be called because validation should prevent submission
    expect(apiModule.apiClient.post).not.toHaveBeenCalled();
    
    // Now test that filling in the fields allows submission
    fireEvent.change(nameInput, { target: { value: 'Test Milestone' } });
    fireEvent.change(targetDateInput, { target: { value: '2026-12-31' } });
    
    // Errors should be cleared when user types
    expect(screen.queryByText('Milestone name is required')).not.toBeInTheDocument();
  });

  it('creates a new milestone successfully', async () => {
    const mockPost = vi.fn().mockResolvedValue({ id: 'new-milestone' });
    (apiModule.apiClient.post as any) = mockPost;

    render(
      <MilestoneForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    // Use a future date
    const futureDate = '2026-12-31';

    fireEvent.change(screen.getByLabelText('Milestone Name'), {
      target: { value: 'New Milestone' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test description' },
    });
    fireEvent.change(screen.getByLabelText('Target Date'), {
      target: { value: futureDate },
    });

    const submitButton = screen.getByRole('button', { name: 'Create Milestone' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        `/api/projects/${projectId}/milestones`,
        {
          name: 'New Milestone',
          description: 'Test description',
          targetDate: futureDate,
        }
      );
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('updates an existing milestone successfully', async () => {
    const mockPut = vi.fn().mockResolvedValue({ id: 'milestone-1' });
    (apiModule.apiClient.put as any) = mockPut;

    const milestone = {
      id: 'milestone-1',
      name: 'Foundation Complete',
      description: 'Complete the foundation work',
      targetDate: '2026-12-31',
    };

    render(
      <MilestoneForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
        milestone={milestone}
      />
    );

    fireEvent.change(screen.getByLabelText('Milestone Name'), {
      target: { value: 'Updated Milestone' },
    });

    const submitButton = screen.getByRole('button', { name: 'Update Milestone' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith(
        `/api/milestones/${milestone.id}`,
        {
          name: 'Updated Milestone',
          description: 'Complete the foundation work',
          targetDate: '2026-12-31',
        }
      );
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles API errors gracefully', async () => {
    const mockPost = vi.fn().mockRejectedValue(new Error('API Error'));
    (apiModule.apiClient.post as any) = mockPost;

    render(
      <MilestoneForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    fireEvent.change(screen.getByLabelText('Milestone Name'), {
      target: { value: 'New Milestone' },
    });
    fireEvent.change(screen.getByLabelText('Target Date'), {
      target: { value: '2026-12-31' },
    });

    const submitButton = screen.getByRole('button', { name: 'Create Milestone' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('closes form when cancel button is clicked', () => {
    render(
      <MilestoneForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
