import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('should display budget items with category labels', () => {
    render(<BudgetItemsList items={mockItems} />);
    
    // Check category labels appear on badges (Labor appears on 2 items)
    expect(screen.getAllByText('Labor').length).toBeGreaterThan(0);
    expect(screen.getByText('Materials')).toBeInTheDocument();
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

  it('should display actual costs', () => {
    render(<BudgetItemsList items={mockItems} />);
    
    expect(screen.getByText('$4,800.00')).toBeInTheDocument();
    expect(screen.getByText('$3,500.00')).toBeInTheDocument();
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
    
    expect(screen.getByText('Labor')).toBeInTheDocument();
    expect(screen.getByText('Materials')).toBeInTheDocument();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('Subcontractors')).toBeInTheDocument();
    expect(screen.getByText('Permits')).toBeInTheDocument();
    expect(screen.getByText('Contingency')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
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
    
    // Actual cost should appear once
    expect(screen.getByText('$123,456.78')).toBeInTheDocument();
  });
});
