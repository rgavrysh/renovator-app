import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { TaskDetail } from './TaskDetail';
import { Task, TaskStatus, TaskPriority } from './TaskList';
import { apiClient } from '../utils/api';

vi.mock('../utils/api');

describe('TaskDetail', () => {
  const mockTask: Task = {
    id: 'task-1',
    projectId: 'project-1',
    name: 'Install kitchen cabinets',
    description: 'Install all kitchen cabinets according to plan',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    dueDate: '2024-02-15',
    actualPrice: 1450,
    notes: ['First note', 'Second note'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  };

  const mockOnClose = vi.fn();
  const mockOnTaskUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render task details correctly', () => {
    render(
      <TaskDetail
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(screen.getByText('Install kitchen cabinets')).toBeInTheDocument();
    expect(screen.getByText('Install all kitchen cabinets according to plan')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('should display task pricing information', () => {
    render(
      <TaskDetail
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(screen.getByText('$1450.00')).toBeInTheDocument();
  });

  it('should display existing notes', () => {
    render(
      <TaskDetail
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(screen.getByText('First note')).toBeInTheDocument();
    expect(screen.getByText('Second note')).toBeInTheDocument();
  });

  it('should show empty state when no notes exist', () => {
    const taskWithoutNotes = { ...mockTask, notes: [] };
    
    render(
      <TaskDetail
        isOpen={true}
        onClose={mockOnClose}
        task={taskWithoutNotes}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(screen.getByText('No notes yet')).toBeInTheDocument();
  });

  it('should allow adding a new note', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.post).mockResolvedValue({});

    render(
      <TaskDetail
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    const textarea = screen.getByPlaceholderText('Add a note...');
    const addButton = screen.getByRole('button', { name: /add note/i });

    await user.type(textarea, 'This is a new note');
    await user.click(addButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/tasks/task-1/notes', {
        note: 'This is a new note',
      });
    });

    expect(mockOnTaskUpdate).toHaveBeenCalled();
  });

  it('should clear note input after successful submission', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.post).mockResolvedValue({});

    render(
      <TaskDetail
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    const textarea = screen.getByPlaceholderText('Add a note...') as HTMLTextAreaElement;
    const addButton = screen.getByRole('button', { name: /add note/i });

    await user.type(textarea, 'New note');
    await user.click(addButton);

    await waitFor(() => {
      expect(textarea.value).toBe('');
    });
  });

  it('should disable add button when note is empty', () => {
    render(
      <TaskDetail
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    const addButton = screen.getByRole('button', { name: /add note/i });
    expect(addButton).toBeDisabled();
  });

  it('should show error message when adding note fails', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Failed to add note'));

    render(
      <TaskDetail
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    const textarea = screen.getByPlaceholderText('Add a note...');
    const addButton = screen.getByRole('button', { name: /add note/i });

    await user.type(textarea, 'New note');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to add note/i)).toBeInTheDocument();
    });
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TaskDetail
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not render when task is null', () => {
    const { container } = render(
      <TaskDetail
        isOpen={true}
        onClose={mockOnClose}
        task={null}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should display due date when present', () => {
    render(
      <TaskDetail
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(screen.getByText('February 15, 2024')).toBeInTheDocument();
  });

  it('should not display pricing when not present', () => {
    const taskWithoutPricing = {
      ...mockTask,
      actualPrice: undefined,
    };

    render(
      <TaskDetail
        isOpen={true}
        onClose={mockOnClose}
        task={taskWithoutPricing}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(screen.queryByText('Actual Price')).not.toBeInTheDocument();
  });

  it('should display delete button', () => {
    render(
      <TaskDetail
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(screen.getByRole('button', { name: /delete task/i })).toBeInTheDocument();
  });

  it('should delete task when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup();
    const mockOnTaskDelete = vi.fn();
    vi.mocked(apiClient.delete).mockResolvedValue(undefined);
    
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <TaskDetail
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete task/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete "Install kitchen cabinets"? This action cannot be undone.'
      );
      expect(apiClient.delete).toHaveBeenCalledWith('/api/tasks/task-1');
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnTaskDelete).toHaveBeenCalledWith('task-1');
    });

    confirmSpy.mockRestore();
  });

  it('should not delete task if user cancels confirmation', async () => {
    const user = userEvent.setup();
    const mockOnTaskDelete = vi.fn();
    
    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <TaskDetail
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete task/i });
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(apiClient.delete).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockOnTaskDelete).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('should show alert when delete fails', async () => {
    const user = userEvent.setup();
    const mockOnTaskDelete = vi.fn();
    vi.mocked(apiClient.delete).mockRejectedValue(new Error('Failed to delete task'));
    
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <TaskDetail
        isOpen={true}
        onClose={mockOnClose}
        task={mockTask}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete task/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to delete task');
    });

    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockOnTaskDelete).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });
});
