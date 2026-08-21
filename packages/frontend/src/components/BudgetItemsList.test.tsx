import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BudgetItemsList, BudgetItem, BudgetCategory } from './BudgetItemsList';

describe('BudgetItemsList', () => {
  const mockItems: BudgetItem[] = [
    {
      id: 'item-1',
      budgetId: 'budget-1',
      name: 'Framing Labor',
      category: BudgetCategory.LABOR,
      actualCost: 4800,
      notes: 'Main structure framing',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'item-2',
      budgetId: 'budget-1',
      name: 'Lumber',
      category: BudgetCategory.MATERIALS,
      actualCost: 3500,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
    {
      id: 'item-3',
      budgetId: 'budget-1',
      name: 'Drywall Installation',
      category: BudgetCategory.LABOR,
      actualCost: 2000,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    },
  ];

  it('should render empty state when no items provided', () => {
    render(<BudgetItemsList items={[]} />);
    
    expect(screen.getByText('No budget items')).toBeInTheDocument();
    expect(screen.getByText('Add budget items to track actual costs')).toBeInTheDocument();
  });

  it('should group items by category with a collapsible header showing a count (U5.3)', () => {
    render(<BudgetItemsList items={mockItems} />);

    // Labor has 2 items, grouped under one header rather than two badges
    const laborHeader = screen.getByRole('button', { name: /Labor/ });
    expect(laborHeader).toHaveTextContent('2');
    const materialsHeader = screen.getByRole('button', { name: /Materials/ });
    expect(materialsHeader).toHaveTextContent('1');
  });

  it('should not render a group header for a category with no items', () => {
    render(<BudgetItemsList items={mockItems} />);

    expect(screen.queryByRole('button', { name: /Equipment/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Permits/ })).not.toBeInTheDocument();
  });

  it('should collapse and expand a category group when its header is clicked', async () => {
    const user = userEvent.setup();
    render(<BudgetItemsList items={mockItems} />);

    const laborHeader = screen.getByRole('button', { name: /Labor/ });
    expect(laborHeader).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Framing Labor')).toBeInTheDocument();

    await user.click(laborHeader);

    expect(laborHeader).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Framing Labor')).not.toBeInTheDocument();

    await user.click(laborHeader);
    expect(screen.getByText('Framing Labor')).toBeInTheDocument();
  });

  it('should show the category group total next to its header', () => {
    render(<BudgetItemsList items={mockItems} />);

    const laborHeader = screen.getByRole('button', { name: /Labor/ });
    // 4800 + 2000
    expect(within(laborHeader).getByText('$6,800.00')).toBeInTheDocument();
  });

  it('should display item names', () => {
    render(<BudgetItemsList items={mockItems} />);
    
    expect(screen.getByText('Framing Labor')).toBeInTheDocument();
    expect(screen.getByText('Lumber')).toBeInTheDocument();
    expect(screen.getByText('Drywall Installation')).toBeInTheDocument();
  });

  it('should display item notes when present', () => {
    render(<BudgetItemsList items={mockItems} />);
    
    expect(screen.getByText('Main structure framing')).toBeInTheDocument();
  });

  it('should show the associated milestone name on an item row when provided', () => {
    const itemsWithMilestone: BudgetItem[] = [
      { ...mockItems[0], milestoneId: 'milestone-1' },
    ];

    render(
      <BudgetItemsList
        items={itemsWithMilestone}
        milestones={[{ id: 'milestone-1', name: 'Foundation' }]}
      />
    );

    expect(screen.getByText(/Foundation/)).toBeInTheDocument();
  });

  it('should display actual costs', () => {
    render(<BudgetItemsList items={mockItems} />);
    
    expect(screen.getByText('$4,800.00')).toBeInTheDocument();
    // Materials has a single item, so its group total and row amount both read $3,500.00
    expect(screen.getAllByText('$3,500.00').length).toBe(2);
  });

  it('should render all budget categories with correct labels', () => {
    const allCategoryItems: BudgetItem[] = [
      {
        id: '1',
        budgetId: 'budget-1',
        name: 'Labor Item',
        category: BudgetCategory.LABOR,
        actualCost: 1000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        budgetId: 'budget-1',
        name: 'Materials Item',
        category: BudgetCategory.MATERIALS,
        actualCost: 1000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '3',
        budgetId: 'budget-1',
        name: 'Equipment Item',
        category: BudgetCategory.EQUIPMENT,
        actualCost: 1000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '4',
        budgetId: 'budget-1',
        name: 'Subcontractors Item',
        category: BudgetCategory.SUBCONTRACTORS,
        actualCost: 1000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '5',
        budgetId: 'budget-1',
        name: 'Permits Item',
        category: BudgetCategory.PERMITS,
        actualCost: 1000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '6',
        budgetId: 'budget-1',
        name: 'Contingency Item',
        category: BudgetCategory.CONTINGENCY,
        actualCost: 1000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '7',
        budgetId: 'budget-1',
        name: 'Other Item',
        category: BudgetCategory.OTHER,
        actualCost: 1000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    render(<BudgetItemsList items={allCategoryItems} />);
    
    expect(screen.getByRole('button', { name: /Labor/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Materials/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Equipment/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Subcontractors/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Permits/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Contingency/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Other/ })).toBeInTheDocument();
  });

  it('should render without card wrapper when showCard is false', () => {
    const { container } = render(<BudgetItemsList items={mockItems} showCard={false} />);
    
    // Should not have Card component structure
    expect(container.querySelector('.bg-white.rounded-linear')).not.toBeInTheDocument();
    
    // But should still show budget items
    expect(screen.getByText('Framing Labor')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <BudgetItemsList items={mockItems} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should format currency with proper locale formatting', () => {
    const largeAmountItem: BudgetItem[] = [
      {
        id: 'item-1',
        budgetId: 'budget-1',
        name: 'Expensive Item',
        category: BudgetCategory.EQUIPMENT,
        actualCost: 123456.78,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    render(<BudgetItemsList items={largeAmountItem} />);
    
    // Actual cost appears both on the group header total and the row itself
    expect(screen.getAllByText('$123,456.78').length).toBe(2);
  });
});
