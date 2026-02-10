import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskForm } from './TaskForm';
import { TaskStatus, TaskPriority } from './TaskList';
import { apiClient } from '../utils/api';

vi.mock('../utils/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('TaskForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const projectId = 'project-123';

  const mockMilestones = [
    { id: 'milestone-1', name: 'Foundation', targetDate: '2024-03-01' },
    { id: 'milestone-2', name: 'Framing', targetDate: '2024-04-01' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue(mockMilestones);
  });

  describe('Create Mode', () => {
    it('should render create task form with all fields', async () => {
      render(
        <TaskForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create task/i })).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/task name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/milestone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/estimated price/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/actual price/i)).toBeInTheDocument();
    });

    it('should load milestones when form opens', async () => {
      render(
        <TaskForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(`/api/projects/${projectId}/milestones`);
      });
    });

    it('should create task with all fields', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ id: 'task-123' });

      render(
        <TaskForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create task/i })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/task name/i), {
        target: { value: 'Install cabinets' },
      });

      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Install kitchen cabinets' },
      });

      fireEvent.change(screen.getByLabelText(/status/i), {
        target: { value: TaskStatus.TODO },
      });

      fireEvent.change(screen.getByLabelText(/priority/i), {
        target: { value: TaskPriority.HIGH },
      });

      fireEvent.change(screen.getByLabelText(/due date/i), {
        target: { value: '2026-12-31' },
      });

      fireEvent.change(screen.getByLabelText(/estimated price/i), {
        target: { value: '1500.50' },
      });

      fireEvent.change(screen.getByLabelText(/actual price/i), {
        target: { value: '1600.00' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create task/i }));

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          `/api/projects/${projectId}/tasks`,
          expect.objectContaining({
            name: 'Install cabinets',
            description: 'Install kitchen cabinets',
            status: TaskStatus.TODO,
            priority: TaskPriority.HIGH,
            dueDate: '2026-12-31',
            estimatedPrice: 1500.50,
            actualPrice: 1600.00,
          })
        );
      });

      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should create task with milestone association', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ id: 'task-123' });

      render(
        <TaskForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create task/i })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/task name/i), {
        target: { value: 'Pour foundation' },
      });

      fireEvent.change(screen.getByLabelText(/milestone/i), {
        target: { value: 'milestone-1' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create task/i }));

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          `/api/projects/${projectId}/tasks`,
          expect.objectContaining({
            name: 'Pour foundation',
            milestoneId: 'milestone-1',
          })
        );
      });
    });

    it('should create task without optional pricing fields', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ id: 'task-123' });

      render(
        <TaskForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create task/i })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/task name/i), {
        target: { value: 'Cleanup site' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create task/i }));

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          `/api/projects/${projectId}/tasks`,
          expect.not.objectContaining({
            estimatedPrice: expect.anything(),
            actualPrice: expect.anything(),
          })
        );
      });
    });

    it('should validate required fields', async () => {
      render(
        <TaskForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create task/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /create task/i }));

      await waitFor(() => {
        expect(screen.getByText('Task name is required')).toBeInTheDocument();
      });

      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('should validate price fields are numbers', async () => {
      render(
        <TaskForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create task/i })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/task name/i), {
        target: { value: 'Test task' },
      });

      // Simulate entering an invalid value by setting it directly
      const estimatedPriceInput = screen.getByLabelText(/estimated price/i) as HTMLInputElement;
      Object.defineProperty(estimatedPriceInput, 'value', {
        writable: true,
        value: 'abc',
      });
      fireEvent.change(estimatedPriceInput, {
        target: { value: 'abc' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create task/i }));

      await waitFor(() => {
        expect(screen.getByText('Estimated price must be a valid number')).toBeInTheDocument();
      });

      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('should validate price fields are not negative', async () => {
      render(
        <TaskForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create task/i })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/task name/i), {
        target: { value: 'Test task' },
      });

      fireEvent.change(screen.getByLabelText(/actual price/i), {
        target: { value: '-100' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create task/i }));

      await waitFor(() => {
        expect(screen.getByText('Actual price cannot be negative')).toBeInTheDocument();
      });

      expect(apiClient.post).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    const existingTask = {
      id: 'task-123',
      name: 'Existing Task',
      description: 'Task description',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      milestoneId: 'milestone-1',
      dueDate: '2024-06-15',
      estimatedPrice: 1000,
      actualPrice: 1100,
    };

    it('should render edit task form with existing data', async () => {
      render(
        <TaskForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
          task={existingTask}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit task/i })).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/task name/i)).toHaveValue('Existing Task');
      expect(screen.getByLabelText(/description/i)).toHaveValue('Task description');
      expect(screen.getByLabelText(/status/i)).toHaveValue(TaskStatus.IN_PROGRESS);
      expect(screen.getByLabelText(/priority/i)).toHaveValue(TaskPriority.HIGH);
      expect(screen.getByLabelText(/due date/i)).toHaveValue('2024-06-15');
      expect(screen.getByLabelText(/estimated price/i)).toHaveValue(1000);
      expect(screen.getByLabelText(/actual price/i)).toHaveValue(1100);
    });

    it('should update task with modified fields', async () => {
      vi.mocked(apiClient.put).mockResolvedValue({ id: 'task-123' });

      render(
        <TaskForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
          task={existingTask}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit task/i })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/task name/i), {
        target: { value: 'Updated Task Name' },
      });

      fireEvent.change(screen.getByLabelText(/status/i), {
        target: { value: TaskStatus.COMPLETED },
      });

      fireEvent.click(screen.getByRole('button', { name: /update task/i }));

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalledWith(
          `/api/tasks/${existingTask.id}`,
          expect.objectContaining({
            name: 'Updated Task Name',
            status: TaskStatus.COMPLETED,
          })
        );
      });

      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Form Interactions', () => {
    it('should close form when cancel is clicked', async () => {
      render(
        <TaskForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create task/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should clear field errors when user types', async () => {
      render(
        <TaskForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create task/i })).toBeInTheDocument();
      });

      // Trigger validation error
      fireEvent.click(screen.getByRole('button', { name: /create task/i }));

      await waitFor(() => {
        expect(screen.getByText('Task name is required')).toBeInTheDocument();
      });

      // Start typing to clear error
      fireEvent.change(screen.getByLabelText(/task name/i), {
        target: { value: 'New task' },
      });

      await waitFor(() => {
        expect(screen.queryByText('Task name is required')).not.toBeInTheDocument();
      });
    });

    it('should display error message on API failure', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

      render(
        <TaskForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          projectId={projectId}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create task/i })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/task name/i), {
        target: { value: 'Test task' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create task/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
