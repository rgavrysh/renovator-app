import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BudgetOverview, Budget } from './BudgetOverview';

describe('BudgetOverview', () => {
  const mockBudget: Budget = {
    id: 'budget-1',
    projectId: 'project-1',
    totalEstimated: 10000,
    totalActual: 8000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('should render "No budget set" when budget is null', () => {
    render(<BudgetOverview budget={null} />);
    expect(screen.getByText('No budget set')).toBeInTheDocument();
  });

  it('should display budget totals', () => {
    render(<BudgetOverview budget={mockBudget} />);
    
    expect(screen.getByText('Total Estimated')).toBeInTheDocument();
    expect(screen.getByText('$10,000.00')).toBeInTheDocument();
    
    expect(screen.getByText('Total Actual')).toBeInTheDocument();
    expect(screen.getByText('$8,000.00')).toBeInTheDocument();
  });

  it('should display variance correctly', () => {
    render(<BudgetOverview budget={mockBudget} />);
    
    expect(screen.getByText('Variance')).toBeInTheDocument();
    expect(screen.getByText('-$2,000.00')).toBeInTheDocument();
  });

  it('should display percentage spent', () => {
    render(<BudgetOverview budget={mockBudget} />);
    
    expect(screen.getByText('Percentage Spent')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('should show warning alert when budget exceeded by more than 10%', () => {
    const overBudget: Budget = {
      ...mockBudget,
      totalEstimated: 10000,
      totalActual: 11500, // 15% over
    };
    
    render(<BudgetOverview budget={overBudget} />);
    
    expect(screen.getByText('Budget Alert')).toBeInTheDocument();
    expect(screen.getByText(/Warning: Budget exceeded by 15.0%/)).toBeInTheDocument();
  });

  it('should show critical alert when budget exceeded by more than 20%', () => {
    const criticalOverBudget: Budget = {
      ...mockBudget,
      totalEstimated: 10000,
      totalActual: 13000, // 30% over
    };
    
    render(<BudgetOverview budget={criticalOverBudget} />);
    
    expect(screen.getByText('Critical Alert')).toBeInTheDocument();
    expect(screen.getByText(/Critical: Budget exceeded by 30.0%/)).toBeInTheDocument();
  });

  it('should not show alert when budget is under threshold', () => {
    const underBudget: Budget = {
      ...mockBudget,
      totalEstimated: 10000,
      totalActual: 10500, // 5% over, below 10% threshold
    };
    
    render(<BudgetOverview budget={underBudget} />);
    
    expect(screen.queryByText('Budget Alert')).not.toBeInTheDocument();
    expect(screen.queryByText('Critical Alert')).not.toBeInTheDocument();
  });

  it('should display positive variance in red', () => {
    const overBudget: Budget = {
      ...mockBudget,
      totalEstimated: 10000,
      totalActual: 12000,
    };
    
    const { container } = render(<BudgetOverview budget={overBudget} />);
    
    const varianceElement = screen.getByText('+$2,000.00');
    expect(varianceElement).toHaveClass('text-red-600');
  });

  it('should display negative variance in green', () => {
    const { container } = render(<BudgetOverview budget={mockBudget} />);
    
    const varianceElement = screen.getByText('-$2,000.00');
    expect(varianceElement).toHaveClass('text-green-600');
  });

  it('should handle zero estimated budget', () => {
    const zeroBudget: Budget = {
      ...mockBudget,
      totalEstimated: 0,
      totalActual: 0,
    };
    
    render(<BudgetOverview budget={zeroBudget} />);
    
    // Check that all values are $0.00
    expect(screen.getAllByText('$0.00')).toHaveLength(3); // Estimated, Actual, Variance
    expect(screen.queryByText('Percentage Spent')).not.toBeInTheDocument();
  });

  it('should render without card wrapper when showCard is false', () => {
    const { container } = render(<BudgetOverview budget={mockBudget} showCard={false} />);
    
    // Should not have Card component structure
    expect(container.querySelector('.bg-white.rounded-linear')).not.toBeInTheDocument();
    
    // But should still show budget data
    expect(screen.getByText('Total Estimated')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <BudgetOverview budget={mockBudget} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
