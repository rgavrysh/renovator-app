import React from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Alert } from './ui/Alert';
import { Divider } from './ui/Divider';

export interface Budget {
  id: string;
  projectId: string;
  totalEstimated: number;
  totalActual: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetOverviewProps {
  budget: Budget | null;
  showCard?: boolean;
  className?: string;
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  budget,
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

  const calculateVariance = (): number => {
    if (!budget) return 0;
    return budget.totalActual - budget.totalEstimated;
  };

  const calculateVariancePercentage = (): number => {
    if (!budget || budget.totalEstimated === 0) return 0;
    return ((budget.totalActual - budget.totalEstimated) / budget.totalEstimated) * 100;
  };

  const calculatePercentageSpent = (): number => {
    if (!budget || budget.totalEstimated === 0) return 0;
    return Math.round((budget.totalActual / budget.totalEstimated) * 100);
  };

  const getBudgetAlert = (): { type: 'warning' | 'danger'; message: string } | null => {
    if (!budget || budget.totalEstimated === 0) return null;
    
    const variancePercentage = calculateVariancePercentage();
    
    if (variancePercentage > 20) {
      return {
        type: 'danger',
        message: `Critical: Budget exceeded by ${variancePercentage.toFixed(1)}%`,
      };
    }
    
    if (variancePercentage > 10) {
      return {
        type: 'warning',
        message: `Warning: Budget exceeded by ${variancePercentage.toFixed(1)}%`,
      };
    }
    
    return null;
  };

  const renderContent = () => {
    if (!budget) {
      return (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No budget set</p>
        </div>
      );
    }

    const variance = calculateVariance();
    const percentageSpent = calculatePercentageSpent();
    const alert = getBudgetAlert();

    return (
      <div className="space-y-4">
        {/* Budget Alert */}
        {alert && (
          <Alert variant={alert.type} title={alert.type === 'danger' ? 'Critical Alert' : 'Budget Alert'}>
            {alert.message}
          </Alert>
        )}

        {/* Total Estimated */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Estimated</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(budget.totalEstimated)}
          </p>
        </div>

        {/* Total Actual */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Actual</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(budget.totalActual)}
          </p>
        </div>

        <Divider />

        {/* Variance */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Variance</p>
          <p
            className={`text-lg font-bold ${
              variance > 0 ? 'text-red-600' : variance < 0 ? 'text-green-600' : 'text-gray-900'
            }`}
          >
            {variance > 0 ? '+' : ''}{formatCurrency(variance)}
          </p>
        </div>

        {/* Percentage Spent */}
        {budget.totalEstimated > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Percentage Spent</p>
            <div className="space-y-2">
              <p className="text-lg font-bold text-gray-900">
                {percentageSpent}%
              </p>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    percentageSpent > 100
                      ? 'bg-red-600'
                      : percentageSpent > 90
                      ? 'bg-yellow-500'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(percentageSpent, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (showCard) {
    return (
      <Card className={className}>
        <CardHeader title="Budget Overview" />
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    );
  }

  return <div className={className}>{renderContent()}</div>;
};
