import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { TaskList, Task, TaskStatus, TaskPriority } from './TaskList';

describe('TaskList', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      projectId: 'project-1',
      milestoneId: 'milestone-1',
      name: 'Remove old cabinets',
      description: 'Remove all existing kitchen cabinets',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      dueDate: '2024-01-15',
      completedDate: '2024-01-14',
      actualPrice: 450,
      notes: [],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-14',
    },
    {
      id: '2',
      projectId: 'project-1',
      milestoneId: 'milestone-1',
      name: 'Install new cabinets',
      description: 'Install custom kitchen cabinets',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      dueDate: '2024-02-01',
      notes: [],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-20',
    },
    {
      id: '3',
      projectId: 'project-1',
      name: 'Paint walls',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: '2024-03-01',
      notes: [],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '4',
      projectId: 'project-1',
      name: 'Fix plumbing issue',
      description: 'Blocked pipe needs attention',
      status: TaskStatus.BLOCKED,
      priority: TaskPriority.LOW,
      notes: [],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ];

  it('should render empty state when no tasks', () => {
    render(<TaskList tasks={[]} />);
    expect(screen.getByText('No tasks yet')).toBeInTheDocument();
  });

  it('should display all tasks by default', () => {
    render(<TaskList tasks={mockTasks} />);
    
    expect(screen.getByText('Remove old cabinets')).toBeInTheDocument();
    expect(screen.getByText('Install new cabinets')).toBeInTheDocument();
    expect(screen.getByText('Paint walls')).toBeInTheDocument();
    expect(screen.getByText('Fix plumbing issue')).toBeInTheDocument();
  });

  it('should display task count', () => {
    render(<TaskList tasks={mockTasks} />);
    expect(screen.getByText('Showing 4 of 4 tasks')).toBeInTheDocument();
  });

  it('should display task status badges', () => {
    render(<TaskList tasks={mockTasks} />);
    
    // Use getAllByText since these appear in both badges and filter dropdowns
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0);
    expect(screen.getAllByText('To Do').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Blocked').length).toBeGreaterThan(0);
  });

  it('should display task priority badges', () => {
    render(<TaskList tasks={mockTasks} />);
    
    // Use getAllByText since these appear in both badges and filter dropdowns
    expect(screen.getAllByText('High').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Urgent').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Medium').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Low').length).toBeGreaterThan(0);
  });

  it('should display task descriptions when present', () => {
    render(<TaskList tasks={mockTasks} />);
    
    expect(screen.getByText('Remove all existing kitchen cabinets')).toBeInTheDocument();
    expect(screen.getByText('Install custom kitchen cabinets')).toBeInTheDocument();
    expect(screen.getByText('Blocked pipe needs attention')).toBeInTheDocument();
  });

  it('should display due dates', () => {
    render(<TaskList tasks={mockTasks} />);
    
    expect(screen.getByText(/Due: Jan 15, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Due: Feb 1, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Due: Mar 1, 2024/)).toBeInTheDocument();
  });

  it('should display completed dates when task is completed', () => {
    render(<TaskList tasks={mockTasks} />);
    
    expect(screen.getByText(/Completed: Jan 14, 2024/)).toBeInTheDocument();
  });

  it('should display actual prices when present', () => {
    render(<TaskList tasks={mockTasks} />);
    
    expect(screen.getByText('Actual: $450.00')).toBeInTheDocument();
  });

  it('should highlight overdue tasks', () => {
    const overdueTasks: Task[] = [
      {
        id: '1',
        projectId: 'project-1',
        name: 'Overdue task',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: '2020-01-01', // Past date
        notes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    render(<TaskList tasks={overdueTasks} />);
    
    expect(screen.getByText('⚠ Overdue')).toBeInTheDocument();
  });

  it('should not mark completed tasks as overdue even if past due date', () => {
    const completedPastDueTasks: Task[] = [
      {
        id: '1',
        projectId: 'project-1',
        name: 'Completed past due task',
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
        dueDate: '2020-01-01', // Past date
        completedDate: '2020-01-02',
        notes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    render(<TaskList tasks={completedPastDueTasks} />);
    
    expect(screen.queryByText('⚠ Overdue')).not.toBeInTheDocument();
  });

  it('should apply special styling to overdue tasks', () => {
    const overdueTasks: Task[] = [
      {
        id: '1',
        projectId: 'project-1',
        name: 'Overdue task',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: '2020-01-01',
        notes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    const { container } = render(<TaskList tasks={overdueTasks} />);
    
    // Check for red background styling on overdue task
    const overdueContainer = container.querySelector('.bg-red-50');
    expect(overdueContainer).toBeInTheDocument();
  });

  it('should filter tasks by status', async () => {
    const user = userEvent.setup();
    render(<TaskList tasks={mockTasks} />);
    
    const statusSelect = screen.getByLabelText('Status');
    await user.selectOptions(statusSelect, TaskStatus.COMPLETED);
    
    expect(screen.getByText('Remove old cabinets')).toBeInTheDocument();
    expect(screen.queryByText('Install new cabinets')).not.toBeInTheDocument();
    expect(screen.queryByText('Paint walls')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 4 tasks')).toBeInTheDocument();
  });

  it('should filter tasks by priority', async () => {
    const user = userEvent.setup();
    render(<TaskList tasks={mockTasks} />);
    
    const prioritySelect = screen.getByLabelText('Priority');
    await user.selectOptions(prioritySelect, TaskPriority.URGENT);
    
    expect(screen.getByText('Install new cabinets')).toBeInTheDocument();
    expect(screen.queryByText('Remove old cabinets')).not.toBeInTheDocument();
    expect(screen.queryByText('Paint walls')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 4 tasks')).toBeInTheDocument();
  });

  it('should filter tasks by both status and priority', async () => {
    const user = userEvent.setup();
    render(<TaskList tasks={mockTasks} />);
    
    const statusSelect = screen.getByLabelText('Status');
    const prioritySelect = screen.getByLabelText('Priority');
    
    await user.selectOptions(statusSelect, TaskStatus.TODO);
    await user.selectOptions(prioritySelect, TaskPriority.MEDIUM);
    
    expect(screen.getByText('Paint walls')).toBeInTheDocument();
    expect(screen.queryByText('Remove old cabinets')).not.toBeInTheDocument();
    expect(screen.queryByText('Install new cabinets')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 4 tasks')).toBeInTheDocument();
  });

  it('should show empty state when filters match no tasks', async () => {
    const user = userEvent.setup();
    render(<TaskList tasks={mockTasks} />);
    
    const statusSelect = screen.getByLabelText('Status');
    await user.selectOptions(statusSelect, TaskStatus.COMPLETED);
    
    const prioritySelect = screen.getByLabelText('Priority');
    await user.selectOptions(prioritySelect, TaskPriority.URGENT);
    
    expect(screen.getByText('No tasks match the selected filters')).toBeInTheDocument();
  });

  it('should reset to all tasks when filter is set to "all"', async () => {
    const user = userEvent.setup();
    render(<TaskList tasks={mockTasks} />);
    
    const statusSelect = screen.getByLabelText('Status');
    await user.selectOptions(statusSelect, TaskStatus.COMPLETED);
    expect(screen.getByText('Showing 1 of 4 tasks')).toBeInTheDocument();
    
    await user.selectOptions(statusSelect, 'all');
    expect(screen.getByText('Showing 4 of 4 tasks')).toBeInTheDocument();
  });

  it('should show visual indicator dots with correct colors', () => {
    const { container } = render(<TaskList tasks={mockTasks} />);
    
    // Check for indicator dots (they have specific background colors)
    const dots = container.querySelectorAll('.w-2.h-2.rounded-full');
    expect(dots.length).toBe(4);
  });

  it('should show complete button for non-completed tasks when onComplete is provided', () => {
    const onComplete = vi.fn();
    render(<TaskList tasks={mockTasks} onComplete={onComplete} />);
    
    // Should show complete button for non-completed tasks (3 tasks)
    const completeButtons = screen.getAllByText('Complete');
    expect(completeButtons.length).toBe(3);
  });

  it('should not show complete button for completed tasks', () => {
    const onComplete = vi.fn();
    const completedTasks: Task[] = mockTasks.map((t) => ({
      ...t,
      status: TaskStatus.COMPLETED,
    }));

    render(<TaskList tasks={completedTasks} onComplete={onComplete} />);
    
    // Should not show any complete buttons
    expect(screen.queryByText('Complete')).not.toBeInTheDocument();
  });

  it('should call onComplete when complete button is clicked', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<TaskList tasks={mockTasks} onComplete={onComplete} />);
    
    const completeButtons = screen.getAllByText('Complete');
    await user.click(completeButtons[0]);
    
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(mockTasks[1]); // Second task (in progress)
  });

  it('should not show complete button when onComplete is not provided', () => {
    render(<TaskList tasks={mockTasks} />);
    
    expect(screen.queryByText('Complete')).not.toBeInTheDocument();
  });

  it('should show edit button when onEdit is provided', () => {
    const onEdit = vi.fn();
    const { container } = render(<TaskList tasks={mockTasks} onEdit={onEdit} />);
    
    // Check for edit buttons (SVG icons)
    const editButtons = container.querySelectorAll('button[title="Edit task"]');
    expect(editButtons.length).toBe(4);
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const { container } = render(<TaskList tasks={mockTasks} onEdit={onEdit} />);
    
    const editButtons = container.querySelectorAll('button[title="Edit task"]');
    await user.click(editButtons[0]);
    
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('should not show edit button when onEdit is not provided', () => {
    const { container } = render(<TaskList tasks={mockTasks} />);
    
    const editButtons = container.querySelectorAll('button[title="Edit task"]');
    expect(editButtons.length).toBe(0);
  });

  it('should show delete button when onDelete is provided', () => {
    const onDelete = vi.fn();
    const { container } = render(<TaskList tasks={mockTasks} onDelete={onDelete} />);
    
    // Check for delete buttons (SVG icons)
    const deleteButtons = container.querySelectorAll('button[title="Delete task"]');
    expect(deleteButtons.length).toBe(4);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const { container } = render(<TaskList tasks={mockTasks} onDelete={onDelete} />);
    
    const deleteButtons = container.querySelectorAll('button[title="Delete task"]');
    await user.click(deleteButtons[0]);
    
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('should not show delete button when onDelete is not provided', () => {
    const { container } = render(<TaskList tasks={mockTasks} />);
    
    const deleteButtons = container.querySelectorAll('button[title="Delete task"]');
    expect(deleteButtons.length).toBe(0);
  });

  it('should render filter controls', () => {
    render(<TaskList tasks={mockTasks} />);
    
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
  });

  it('should have all status options in filter', () => {
    render(<TaskList tasks={mockTasks} />);
    
    const statusSelect = screen.getByLabelText('Status');
    expect(statusSelect).toHaveTextContent('All Statuses');
    expect(statusSelect).toHaveTextContent('To Do');
    expect(statusSelect).toHaveTextContent('In Progress');
    expect(statusSelect).toHaveTextContent('Completed');
    expect(statusSelect).toHaveTextContent('Blocked');
  });

  it('should have all priority options in filter', () => {
    render(<TaskList tasks={mockTasks} />);
    
    const prioritySelect = screen.getByLabelText('Priority');
    expect(prioritySelect).toHaveTextContent('All Priorities');
    expect(prioritySelect).toHaveTextContent('Low');
    expect(prioritySelect).toHaveTextContent('Medium');
    expect(prioritySelect).toHaveTextContent('High');
    expect(prioritySelect).toHaveTextContent('Urgent');
  });

  it('should show view details button when onViewDetails is provided', () => {
    const onViewDetails = vi.fn();
    render(<TaskList tasks={mockTasks} onViewDetails={onViewDetails} />);
    
    const detailsButtons = screen.getAllByText('Details');
    expect(detailsButtons).toHaveLength(4); // One for each task
  });

  it('should call onViewDetails when details button is clicked', async () => {
    const user = userEvent.setup();
    const onViewDetails = vi.fn();
    render(<TaskList tasks={mockTasks} onViewDetails={onViewDetails} />);
    
    const detailsButtons = screen.getAllByText('Details');
    await user.click(detailsButtons[0]);
    
    expect(onViewDetails).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('should not show view details button when onViewDetails is not provided', () => {
    render(<TaskList tasks={mockTasks} />);
    
    expect(screen.queryByText('Details')).not.toBeInTheDocument();
  });

  it('should show status dropdown when onStatusChange is provided', () => {
    const onStatusChange = vi.fn();
    const { container } = render(<TaskList tasks={mockTasks} onStatusChange={onStatusChange} />);
    
    // Check for status dropdowns (select elements)
    const statusDropdowns = container.querySelectorAll('select');
    // Should have 2 selects per task (status dropdown) + 2 filter selects = 6 total
    expect(statusDropdowns.length).toBeGreaterThan(2);
  });

  it('should show status badge when onStatusChange is not provided', () => {
    render(<TaskList tasks={mockTasks} />);
    
    // Should show status badges instead of dropdowns
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0);
  });

  it('should call onStatusChange when status dropdown is changed', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    const { container } = render(<TaskList tasks={mockTasks} onStatusChange={onStatusChange} />);
    
    // Find the first task's status dropdown (skip the filter dropdowns)
    const statusDropdowns = container.querySelectorAll('select');
    const taskStatusDropdown = Array.from(statusDropdowns).find(
      (select) => select.value === TaskStatus.COMPLETED
    );
    
    expect(taskStatusDropdown).toBeDefined();
    
    if (taskStatusDropdown) {
      await user.selectOptions(taskStatusDropdown, TaskStatus.IN_PROGRESS);
      
      expect(onStatusChange).toHaveBeenCalledTimes(1);
      expect(onStatusChange).toHaveBeenCalledWith(mockTasks[0], TaskStatus.IN_PROGRESS);
    }
  });

  it('should have all status options in task status dropdown', () => {
    const onStatusChange = vi.fn();
    const { container } = render(<TaskList tasks={mockTasks} onStatusChange={onStatusChange} />);
    
    // Find a task status dropdown
    const statusDropdowns = container.querySelectorAll('select');
    const taskStatusDropdown = Array.from(statusDropdowns).find(
      (select) => select.value === TaskStatus.COMPLETED
    );
    
    expect(taskStatusDropdown).toBeDefined();
    
    if (taskStatusDropdown) {
      expect(taskStatusDropdown).toHaveTextContent('To Do');
      expect(taskStatusDropdown).toHaveTextContent('In Progress');
      expect(taskStatusDropdown).toHaveTextContent('Completed');
      expect(taskStatusDropdown).toHaveTextContent('Blocked');
    }
  });
});
