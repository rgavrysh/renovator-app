import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
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

  it('should render empty state when no milestones', () => {
    render(<MilestoneList milestones={[]} />);
    expect(screen.getByText('No milestones yet')).toBeInTheDocument();
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
    expect(screen.getByText('Overdue')).toBeInTheDocument(); // Badge text
  });

  it('should display milestone status badges correctly', () => {
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

  it('should show visual indicator dots with correct colors', () => {
    const { container } = render(<MilestoneList milestones={mockMilestones} />);
    
    // Check for indicator dots (they have specific background colors)
    const dots = container.querySelectorAll('.w-2.h-2.rounded-full');
    expect(dots.length).toBe(3);
  });

  it('should apply special styling to overdue milestones', () => {
    const overdueMilestones: Milestone[] = [
      {
        ...mockMilestones[0],
        status: MilestoneStatus.OVERDUE,
        completedDate: undefined,
      },
    ];

    const { container } = render(<MilestoneList milestones={overdueMilestones} />);
    
    // Check for red background styling on overdue milestone
    const overdueContainer = container.querySelector('.bg-red-50');
    expect(overdueContainer).toBeInTheDocument();
  });
});
