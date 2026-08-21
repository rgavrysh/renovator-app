import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MilestoneList, Milestone, MilestoneStatus } from './MilestoneList';

describe('MilestoneList', () => {
  const mockMilestones: Milestone[] = [
    {
      id: '1',
      projectId: 'project-1',
      name: 'Foundation Complete',
      description: 'Complete foundation work',
      targetDate: '2024-01-15',
      status: MilestoneStatus.COMPLETED,
      completedDate: '2024-01-14',
      order: 1,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-14',
    },
    {
      id: '2',
      projectId: 'project-1',
      name: 'Framing Complete',
      description: 'Complete framing work',
      targetDate: '2024-02-01',
      status: MilestoneStatus.IN_PROGRESS,
      order: 2,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-20',
    },
    {
      id: '3',
      projectId: 'project-1',
      name: 'Electrical Rough-In',
      description: 'Complete electrical rough-in',
      targetDate: '2024-03-01',
      status: MilestoneStatus.NOT_STARTED,
      order: 3,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ];

  it('should render a quiet EmptyState invitation when no milestones (U7.3)', () => {
    render(<MilestoneList milestones={[]} />);
    const title = screen.getByText('No milestones yet');
    expect(title).toBeInTheDocument();
    expect(title.parentElement?.querySelector('svg')).toBeInTheDocument();
  });

  it('should display milestones in chronological order by target date', () => {
    const unorderedMilestones: Milestone[] = [
      { ...mockMilestones[2], targetDate: '2024-03-01' },
      { ...mockMilestones[0], targetDate: '2024-01-15' },
      { ...mockMilestones[1], targetDate: '2024-02-01' },
    ];

    render(<MilestoneList milestones={unorderedMilestones} />);

    const milestoneNames = screen.getAllByRole('heading', { level: 4 });
    expect(milestoneNames[0]).toHaveTextContent('Foundation Complete');
    expect(milestoneNames[1]).toHaveTextContent('Framing Complete');
    expect(milestoneNames[2]).toHaveTextContent('Electrical Rough-In');
  });

  it('should show progress indicator by default', () => {
    render(<MilestoneList milestones={mockMilestones} />);
    
    expect(screen.getByText('Overall Progress')).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument(); // 1 of 3 completed
    expect(screen.getByText('1 of 3 completed')).toBeInTheDocument();
  });

  it('should hide progress indicator when showProgress is false', () => {
    render(<MilestoneList milestones={mockMilestones} showProgress={false} />);
    
    expect(screen.queryByText('Overall Progress')).not.toBeInTheDocument();
  });

  it('should calculate progress correctly', () => {
    const allCompleted: Milestone[] = mockMilestones.map((m) => ({
      ...m,
      status: MilestoneStatus.COMPLETED,
    }));

    render(<MilestoneList milestones={allCompleted} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should highlight overdue milestones', () => {
    const overdueMilestones: Milestone[] = [
      {
        ...mockMilestones[0],
        status: MilestoneStatus.OVERDUE,
        completedDate: undefined,
      },
    ];

    render(<MilestoneList milestones={overdueMilestones} />);
    
    expect(screen.getByText('⚠ Overdue')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument(); // status glyph label (U3.2)
  });

  it('should display milestone status labels correctly (U3.2 — glyph + text, not a badge)', () => {
    render(<MilestoneList milestones={mockMilestones} />);
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Not Started')).toBeInTheDocument();
  });

  it('should display milestone descriptions when present', () => {
    render(<MilestoneList milestones={mockMilestones} />);
    
    expect(screen.getByText('Complete foundation work')).toBeInTheDocument();
    expect(screen.getByText('Complete framing work')).toBeInTheDocument();
  });

  it('should display target dates', () => {
    render(<MilestoneList milestones={mockMilestones} />);
    
    expect(screen.getByText(/Target: Jan 15, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Target: Feb 1, 2024/)).toBeInTheDocument();
  });

  it('should display completed dates when milestone is completed', () => {
    render(<MilestoneList milestones={mockMilestones} />);
    
    expect(screen.getByText(/Completed: Jan 14, 2024/)).toBeInTheDocument();
  });

  it('should show a StatusIcon glyph per milestone (U3.2)', () => {
    const { container } = render(<MilestoneList milestones={mockMilestones} />);

    const glyphs = container.querySelectorAll('svg[aria-label]');
    expect(glyphs.length).toBe(3);
  });

  it('should tint overdue milestones in a quiet danger tone, not a boxed background (U5.1)', () => {
    const overdueMilestones: Milestone[] = [
      {
        ...mockMilestones[0],
        status: MilestoneStatus.OVERDUE,
        completedDate: undefined,
      },
    ];

    const { container } = render(<MilestoneList milestones={overdueMilestones} />);

    // Overdue rows use text-danger-* tinting (ListRow's `danger` prop), not a
    // per-row bg/border box — that box was the alignment bug fixed by U5.1/#38.
    expect(screen.getByText('Foundation Complete')).toHaveClass('text-danger-900');
    expect(container.querySelector('.bg-red-50')).not.toBeInTheDocument();
    expect(container.querySelector('.border-red-200')).not.toBeInTheDocument();
  });

  it('should show complete button for non-completed milestones when onComplete is provided', () => {
    const onComplete = vi.fn();
    render(<MilestoneList milestones={mockMilestones} onComplete={onComplete} />);
    
    // Should show complete button for non-completed milestones
    const completeButtons = screen.getAllByText('Complete');
    expect(completeButtons.length).toBe(2); // 2 non-completed milestones
  });

  it('should not show complete button for completed milestones', () => {
    const onComplete = vi.fn();
    const completedMilestones: Milestone[] = mockMilestones.map((m) => ({
      ...m,
      status: MilestoneStatus.COMPLETED,
    }));

    render(<MilestoneList milestones={completedMilestones} onComplete={onComplete} />);
    
    // Should not show any complete buttons
    expect(screen.queryByText('Complete')).not.toBeInTheDocument();
  });

  it('should call onComplete when complete button is clicked', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<MilestoneList milestones={mockMilestones} onComplete={onComplete} />);
    
    const completeButtons = screen.getAllByText('Complete');
    await user.click(completeButtons[0]);
    
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(mockMilestones[1]); // Second milestone (in progress)
  });

  it('should not show complete button when onComplete is not provided', () => {
    render(<MilestoneList milestones={mockMilestones} />);
    
    expect(screen.queryByText('Complete')).not.toBeInTheDocument();
  });

  it('should hide the complete button for milestones with associated tasks', () => {
    const onComplete = vi.fn();
    render(
      <MilestoneList
        milestones={mockMilestones}
        onComplete={onComplete}
        tasks={[{ milestoneId: '2', status: 'in_progress' }]}
      />
    );

    // Only the third milestone (no tasks, not started) should still show Complete
    const completeButtons = screen.getAllByText('Complete');
    expect(completeButtons).toHaveLength(1);
  });

  it('should display task completion progress for milestones with tasks', () => {
    render(
      <MilestoneList
        milestones={mockMilestones}
        tasks={[
          { milestoneId: '2', status: 'completed' },
          { milestoneId: '2', status: 'in_progress' },
        ]}
      />
    );

    expect(screen.getByText('1/2 tasks completed')).toBeInTheDocument();
  });

  it('should show forecast variance when a milestone completes after its target date', () => {
    const lateMilestone: Milestone[] = [
      {
        ...mockMilestones[0],
        targetDate: '2024-01-10',
        completedDate: '2024-01-15',
      },
    ];

    render(<MilestoneList milestones={lateMilestone} />);

    expect(screen.getByText('5 days late')).toBeInTheDocument();
  });

  it('should show forecast variance when a milestone completes before its target date', () => {
    const earlyMilestone: Milestone[] = [
      {
        ...mockMilestones[0],
        targetDate: '2024-01-15',
        completedDate: '2024-01-10',
      },
    ];

    render(<MilestoneList milestones={earlyMilestone} />);

    expect(screen.getByText('5 days early')).toBeInTheDocument();
  });
});
