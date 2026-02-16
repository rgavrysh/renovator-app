import React from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Alert } from './ui/Alert';
import { Divider } from './ui/Divider';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/currency';

export interface Budget {
  id: string;
  projectId: string;
  totalEstimated: number;
  totalActual: number;
  totalActualFromItems: number;
  totalActualFromTasks: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetOverviewProps {
  budget: Budget | null;
  showCard?: boolean;
  className?: string;
  onViewTasks?: () => void;
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  budget,
  showCard = true,
  className = '',
  onViewTasks,
}) => {
  const { t, i18n } = useTranslation();

  const fmtCurrency = (amount: number): string => formatCurrency(amount, i18n.language);

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
        message: t('budgetOverview.criticalExceeded', { percentage: variancePercentage.toFixed(1) }),
      };
    }
    
    if (variancePercentage > 10) {
      return {
        type: 'warning',
        message: t('budgetOverview.warningExceeded', { percentage: variancePercentage.toFixed(1) }),
      };
    }
    
    return null;
  };

  const renderContent = () => {
    if (!budget) {
      return (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">{t('budgetOverview.noBudgetSet')}</p>
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
          <Alert variant={alert.type} title={alert.type === 'danger' ? t('budgetOverview.criticalAlert') : t('budgetOverview.budgetAlert')}>
            {alert.message}
          </Alert>
        )}

        {/* Total Estimated */}
        <div>
          <p className="text-xs text-gray-500 mb-1">{t('budgetOverview.totalEstimated')}</p>
          <p className="text-xl font-bold text-gray-900">
            {fmtCurrency(budget.totalEstimated)}
          </p>
        </div>

        {/* Total Actual */}
        <div>
          <p className="text-xs text-gray-500 mb-1">{t('budgetOverview.totalActual')}</p>
          <p className="text-xl font-bold text-gray-900">
            {fmtCurrency(budget.totalActual)}
          </p>
          
          {/* Breakdown of actual costs */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{t('budgetOverview.fromBudgetItems')}</span>
              <span className="font-medium text-gray-700">
                {fmtCurrency(budget.totalActualFromItems)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{t('budgetOverview.fromTasks')}</span>
              <span className="font-medium text-gray-700">
                {fmtCurrency(budget.totalActualFromTasks)}
              </span>
              {onViewTasks && budget.totalActualFromTasks > 0 && (
                <button
                  onClick={onViewTasks}
                  className="ml-2 text-primary-600 hover:text-primary-700 underline"
                >
                  {t('budgetOverview.viewTasks')}
                </button>
              )}
            </div>
          </div>
        </div>

        <Divider />

        {/* Variance */}
        <div>
          <p className="text-xs text-gray-500 mb-1">{t('budgetOverview.variance')}</p>
          <p
            className={`text-lg font-bold ${
              variance > 0 ? 'text-red-600' : variance < 0 ? 'text-green-600' : 'text-gray-900'
            }`}
          >
            {variance > 0 ? '+' : ''}{fmtCurrency(variance)}
          </p>
        </div>

        {/* Percentage Spent */}
        {budget.totalEstimated > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">{t('budgetOverview.percentageSpent')}</p>
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
        <CardHeader title={t('budgetOverview.title')} />
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    );
  }

  return <div className={className}>{renderContent()}</div>;
};
