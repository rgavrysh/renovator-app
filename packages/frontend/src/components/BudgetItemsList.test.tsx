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
      estimatedCost: 5000,
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
      estimatedCost: 3000,
      actualCost: 3500,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
    {
      id: 'item-3',
      budgetId: 'budget-1',
      name: 'Drywall Installation',
      category: BudgetCategory.LABOR,
      estimatedCost: 2000,
      actualCost: 2000,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    },
  ];

  it('should render empty state when no items provided', () => {
    render(<BudgetItemsList items={[]} />);
    
    expect(screen.getByText('No budget items')).toBeInTheDocument();
    expect(screen.getByText('Add budget items to track estimated and actual costs')).toBeInTheDocument();
  });

  it('should display budget items grouped by category', () => {
    render(<BudgetItemsList items={mockItems} />);
    
    // Check category headers
    expect(screen.getByText('Labor')).toBeInTheDocument();
    expect(screen.getByText('Materials')).toBeInTheDocument();
    
    // Check item counts
    expect(screen.getByText('2 items')).toBeInTheDocument(); // Labor has 2 items
    expect(screen.getByText('1 item')).toBeInTheDocument(); // Materials has 1 item
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

  it('should display estimated costs', () => {
    render(<BudgetItemsList items={mockItems} />);
    
    // Use getAllByText since values may appear in multiple places
    const fiveThousand = screen.getAllByText('$5,000.00');
    expect(fiveThousand.length).toBeGreaterThan(0);
    
    const threeThousand = screen.getAllByText('$3,000.00');
    expect(threeThousand.length).toBeGreaterThan(0);
    
    const twoThousand = screen.getAllByText('$2,000.00');
    expect(twoThousand.length).toBeGreaterThan(0);
  });

  it('should display actual costs', () => {
    render(<BudgetItemsList items={mockItems} />);
    
    expect(screen.getByText('$4,800.00')).toBeInTheDocument();
    expect(screen.getByText('$3,500.00')).toBeInTheDocument();
  });

  it('should calculate and display variance correctly', () => {
    render(<BudgetItemsList items={mockItems} />);
    
    // Framing Labor: 4800 - 5000 = -200 (under budget)
    expect(screen.getByText('-$200.00')).toBeInTheDocument();
    expect(screen.getByText('-4.0%')).toBeInTheDocument();
    
    // Lumber: 3500 - 3000 = +500 (over budget)
    expect(screen.getByText('+$500.00')).toBeInTheDocument();
    expect(screen.getByText('+16.7%')).toBeInTheDocument();
    
    // Drywall: 2000 - 2000 = 0 (on budget)
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('should display positive variance in red', () => {
    render(<BudgetItemsList items={mockItems} />);
    
    const positiveVariance = screen.getByText('+$500.00');
    expect(positiveVariance).toHaveClass('text-red-600');
  });

  it('should display negative variance in green', () => {
    render(<BudgetItemsList items={mockItems} />);
    
    const negativeVariance = screen.getByText('-$200.00');
    expect(negativeVariance).toHaveClass('text-green-600');
  });

  it('should display zero variance in gray', () => {
    render(<BudgetItemsList items={mockItems} />);
    
    const zeroVariance = screen.getByText('$0.00');
    expect(zeroVariance).toHaveClass('text-gray-900');
  });

  it('should group items by category correctly', () => {
    const { container } = render(<BudgetItemsList items={mockItems} />);
    
    // Labor category should have 2 items
    const laborSection = container.querySelector('[class*="space-y-6"] > div:first-child');
    expect(laborSection?.querySelectorAll('[class*="border-gray-200"]')).toHaveLength(2);
  });

  it('should render all budget categories with correct labels', () => {
    const allCategoryItems: BudgetItem[] = [
      {
        id: '1',
        budgetId: 'budget-1',
        name: 'Labor Item',
        category: BudgetCategory.LABOR,
        estimatedCost: 1000,
        actualCost: 1000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        budgetId: 'budget-1',
        name: 'Materials Item',
        category: BudgetCategory.MATERIALS,
        estimatedCost: 1000,
        actualCost: 1000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '3',
        budgetId: 'budget-1',
        name: 'Equipment Item',
        category: BudgetCategory.EQUIPMENT,
        estimatedCost: 1000,
        actualCost: 1000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '4',
        budgetId: 'budget-1',
        name: 'Subcontractors Item',
        category: BudgetCategory.SUBCONTRACTORS,
        estimatedCost: 1000,
        actualCost: 1000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '5',
        budgetId: 'budget-1',
        name: 'Permits Item',
        category: BudgetCategory.PERMITS,
        estimatedCost: 1000,
        actualCost: 1000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '6',
        budgetId: 'budget-1',
        name: 'Contingency Item',
        category: BudgetCategory.CONTINGENCY,
        estimatedCost: 1000,
        actualCost: 1000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '7',
        budgetId: 'budget-1',
        name: 'Other Item',
        category: BudgetCategory.OTHER,
        estimatedCost: 1000,
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

  it('should handle zero estimated cost without division error', () => {
    const zeroEstimateItem: BudgetItem[] = [
      {
        id: 'item-1',
        budgetId: 'budget-1',
        name: 'Free Item',
        category: BudgetCategory.OTHER,
        estimatedCost: 0,
        actualCost: 100,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    const { container } = render(<BudgetItemsList items={zeroEstimateItem} />);
    
    // Should display 0.0% instead of Infinity or NaN
    // The percentage is split across elements, so check the container text
    expect(container.textContent).toContain('0.0%');
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
        estimatedCost: 123456.78,
        actualCost: 123456.78,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    render(<BudgetItemsList items={largeAmountItem} />);
    
    // Use getAllByText since the value appears in both estimated and actual columns
    const formattedAmounts = screen.getAllByText('$123,456.78');
    expect(formattedAmounts.length).toBeGreaterThan(0);
  });
});
