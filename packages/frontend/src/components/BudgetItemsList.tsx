import React from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';

export enum BudgetCategory {
  LABOR = 'labor',
  MATERIALS = 'materials',
  EQUIPMENT = 'equipment',
  SUBCONTRACTORS = 'subcontractors',
  PERMITS = 'permits',
  CONTINGENCY = 'contingency',
  OTHER = 'other',
}

export interface BudgetItem {
  id: string;
  budgetId: string;
  name: string;
  category: BudgetCategory;
  estimatedCost: number;
  actualCost: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItemsListProps {
  items: BudgetItem[];
  showCard?: boolean;
  className?: string;
}

export const BudgetItemsList: React.FC<BudgetItemsListProps> = ({
  items,
  showCard = true,
  className = '',
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculateVariance = (item: BudgetItem): number => {
    return item.actualCost - item.estimatedCost;
  };

  const getCategoryLabel = (category: BudgetCategory): string => {
    const labels: Record<BudgetCategory, string> = {
      [BudgetCategory.LABOR]: 'Labor',
      [BudgetCategory.MATERIALS]: 'Materials',
      [BudgetCategory.EQUIPMENT]: 'Equipment',
      [BudgetCategory.SUBCONTRACTORS]: 'Subcontractors',
      [BudgetCategory.PERMITS]: 'Permits',
      [BudgetCategory.CONTINGENCY]: 'Contingency',
      [BudgetCategory.OTHER]: 'Other',
    };
    return labels[category];
  };

  const getCategoryColor = (category: BudgetCategory): string => {
    const colors: Record<BudgetCategory, string> = {
      [BudgetCategory.LABOR]: 'blue',
      [BudgetCategory.MATERIALS]: 'green',
      [BudgetCategory.EQUIPMENT]: 'purple',
      [BudgetCategory.SUBCONTRACTORS]: 'orange',
      [BudgetCategory.PERMITS]: 'yellow',
      [BudgetCategory.CONTINGENCY]: 'gray',
      [BudgetCategory.OTHER]: 'gray',
    };
    return colors[category];
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<BudgetCategory, BudgetItem[]>);

  const renderContent = () => {
    if (items.length === 0) {
      return (
        <EmptyState
          title="No budget items"
          description="Add budget items to track estimated and actual costs"
        />
      );
    }

    return (
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category}>
            {/* Category Header */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={getCategoryColor(category) as any}>
                {getCategoryLabel(category as BudgetCategory)}
              </Badge>
              <span className="text-xs text-gray-500">
                {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Category Items */}
            <div className="space-y-2">
              {categoryItems.map((item) => {
                const variance = calculateVariance(item);
                const variancePercentage =
                  item.estimatedCost > 0
                    ? ((variance / item.estimatedCost) * 100).toFixed(1)
                    : '0.0';

                return (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      {/* Item Name */}
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                        {item.notes && (
                          <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                        )}
                      </div>
                    </div>

                    {/* Cost Details */}
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      {/* Estimated Cost */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Estimated</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(item.estimatedCost)}
                        </p>
                      </div>

                      {/* Actual Cost */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Actual</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(item.actualCost)}
                        </p>
                      </div>

                      {/* Variance */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Variance</p>
                        <div className="flex flex-col">
                          <p
                            className={`text-sm font-medium ${
                              variance > 0
                                ? 'text-red-600'
                                : variance < 0
                                ? 'text-green-600'
                                : 'text-gray-900'
                            }`}
                          >
                            {variance > 0 ? '+' : ''}
                            {formatCurrency(variance)}
                          </p>
                          <p
                            className={`text-xs ${
                              variance > 0
                                ? 'text-red-600'
                                : variance < 0
                                ? 'text-green-600'
                                : 'text-gray-500'
                            }`}
                          >
                            {variance > 0 ? '+' : ''}
                            {variancePercentage}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (showCard) {
    return (
      <Card className={className}>
        <CardHeader title="Budget Items" />
        <CardContent>{renderContent()}</CardContent>
      </Card>
    );
  }

  return <div className={className}>{renderContent()}</div>;
};
