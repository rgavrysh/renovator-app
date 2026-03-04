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
      amount: 10,
      unit: 'pcs',
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
      amount: 5,
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

  it('should display task priority badges', () => {
    render(<TaskList tasks={mockTasks} />);

    expect(screen.getAllByText('High').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Urgent').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Medium').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Low').length).toBeGreaterThan(0);
  });

  it('should display due dates', () => {
    render(<TaskList tasks={mockTasks} />);

    expect(screen.getByText(/Due: Jan 15, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Due: Feb 1, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Due: Mar 1, 2024/)).toBeInTheDocument();
  });

  it('should display actual prices when present', () => {
    render(<TaskList tasks={mockTasks} />);

    expect(screen.getByText(/Actual: \$450\.00/)).toBeInTheDocument();
  });

  it('should highlight overdue tasks', () => {
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
        dueDate: '2020-01-01',
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

  it('should show status indicator circles with correct colors', () => {
    const { container } = render(<TaskList tasks={mockTasks} />);

    const dots = container.querySelectorAll('.w-3\\.5.h-3\\.5.rounded-full');
    expect(dots.length).toBe(4);

    expect(dots[0]).toHaveClass('bg-green-500'); // completed
    expect(dots[1]).toHaveClass('bg-blue-500'); // in_progress
    expect(dots[2]).toHaveClass('bg-gray-400'); // todo
    expect(dots[3]).toHaveClass('bg-red-500'); // blocked
  });

  it('should show status tooltip on status circle buttons', () => {
    render(<TaskList tasks={mockTasks} onStatusChange={vi.fn()} />);

    const statusButtons = screen.getAllByTitle('Completed');
    expect(statusButtons.length).toBeGreaterThan(0);

    expect(screen.getAllByTitle('In Progress').length).toBeGreaterThan(0);
    expect(screen.getAllByTitle('To Do').length).toBeGreaterThan(0);
    expect(screen.getAllByTitle('Blocked').length).toBeGreaterThan(0);
  });

  it('should cycle status when status circle is clicked', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    render(<TaskList tasks={mockTasks} onStatusChange={onStatusChange} />);

    const todoButton = screen.getByTitle('To Do');
    await user.click(todoButton);

    expect(onStatusChange).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenCalledWith(mockTasks[2], TaskStatus.IN_PROGRESS);
  });

  it('should cycle through all statuses in order', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();

    render(<TaskList tasks={mockTasks} onStatusChange={onStatusChange} />);

    // Completed → Blocked
    const completedButton = screen.getByTitle('Completed');
    await user.click(completedButton);
    expect(onStatusChange).toHaveBeenCalledWith(mockTasks[0], TaskStatus.BLOCKED);

    // In Progress → Completed
    const inProgressButton = screen.getByTitle('In Progress');
    await user.click(inProgressButton);
    expect(onStatusChange).toHaveBeenCalledWith(mockTasks[1], TaskStatus.COMPLETED);

    // Blocked → To Do
    const blockedButton = screen.getByTitle('Blocked');
    await user.click(blockedButton);
    expect(onStatusChange).toHaveBeenCalledWith(mockTasks[3], TaskStatus.TODO);
  });

  it('should cycle priority when priority badge is clicked', async () => {
    const user = userEvent.setup();
    const onPriorityChange = vi.fn();
    render(<TaskList tasks={mockTasks} onPriorityChange={onPriorityChange} />);

    // Click High priority → should cycle to Urgent
    const highButton = screen.getByTitle('High');
    await user.click(highButton);

    expect(onPriorityChange).toHaveBeenCalledTimes(1);
    expect(onPriorityChange).toHaveBeenCalledWith(mockTasks[0], TaskPriority.URGENT);
  });

  it('should show delete button when onDelete is provided', () => {
    const onDelete = vi.fn();
    render(<TaskList tasks={mockTasks} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByTitle('Delete');
    expect(deleteButtons.length).toBe(4);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<TaskList tasks={mockTasks} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByTitle('Delete');
    await user.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('should not show delete button when onDelete is not provided', () => {
    render(<TaskList tasks={mockTasks} />);

    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
  });

  it('should render amount inputs for each task', () => {
    render(<TaskList tasks={mockTasks} />);

    const amountInputs = screen.getAllByRole('spinbutton');
    expect(amountInputs.length).toBe(4);
  });

  it('should display current amount values in inputs', () => {
    render(<TaskList tasks={mockTasks} />);

    const amountInputs = screen.getAllByRole('spinbutton');
    expect(amountInputs[0]).toHaveValue(10); // first task has amount=10
    expect(amountInputs[1]).toHaveValue(5); // second task has amount=5
  });

  it('should call onAmountChange when amount is changed and blurred', async () => {
    const user = userEvent.setup();
    const onAmountChange = vi.fn();
    render(<TaskList tasks={mockTasks} onAmountChange={onAmountChange} />);

    const amountInputs = screen.getAllByRole('spinbutton');
    await user.clear(amountInputs[0]);
    await user.type(amountInputs[0], '25');
    await user.tab(); // blur

    expect(onAmountChange).toHaveBeenCalledTimes(1);
    expect(onAmountChange).toHaveBeenCalledWith(mockTasks[0], 25);
  });

  it('should open edit modal when row is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<TaskList tasks={mockTasks} onEdit={onEdit} />);

    await user.click(screen.getByText('Remove old cabinets'));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(mockTasks[0]);
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
});
