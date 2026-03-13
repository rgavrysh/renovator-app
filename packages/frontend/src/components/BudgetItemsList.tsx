import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/currency';

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
  milestoneId?: string;
  name: string;
  category: BudgetCategory;
  customCategory?: string;
  actualCost: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface MilestoneInfo {
  id: string;
  name: string;
}

export interface BudgetItemsListProps {
  items: BudgetItem[];
  milestones?: MilestoneInfo[];
  showCard?: boolean;
  className?: string;
  onEditItem?: (item: BudgetItem) => void;
  onDeleteItem?: (item: BudgetItem) => void;
}

export const BudgetItemsList: React.FC<BudgetItemsListProps> = ({
  items,
  milestones = [],
  showCard = true,
  className = '',
  onEditItem,
  onDeleteItem,
}) => {
  const { t, i18n } = useTranslation();
  const [collapsedMilestones, setCollapsedMilestones] = useState<Record<string, boolean>>({});

  const fmtCurrency = (amount: number): string => formatCurrency(amount, i18n.language);

  const getCategoryLabel = (category: BudgetCategory, customCategory?: string): string => {
    if (category === BudgetCategory.OTHER && customCategory) {
      return customCategory;
    }
    return t(`budgetCategory.${category}`);
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

  const toggleMilestone = (key: string) => {
    setCollapsedMilestones((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getMilestoneTotal = (milestoneItems: BudgetItem[]): number => {
    return milestoneItems.reduce((sum, item) => sum + Number(item.actualCost), 0);
  };

  const renderItemCard = (item: BudgetItem) => {
    return (
      <div
        key={item.id}
        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
              <Badge variant={getCategoryColor(item.category) as any} size="sm">
                {getCategoryLabel(item.category, item.customCategory)}
              </Badge>
            </div>
            {item.notes && (
              <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-sm font-medium text-gray-900">
              {fmtCurrency(item.actualCost)}
            </span>
            {(onEditItem || onDeleteItem) && (
              <div className="flex items-center gap-1">
                {onEditItem && (
                  <button
                    onClick={() => onEditItem(item)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                    title={t('common.edit')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                )}
                {onDeleteItem && (
                  <button
                    onClick={() => onDeleteItem(item)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                    title={t('common.delete')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMilestoneSection = (key: string, label: string, sectionItems: BudgetItem[]) => {
    const isCollapsed = collapsedMilestones[key] ?? false;
    const total = getMilestoneTotal(sectionItems);

    return (
      <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleMilestone(key)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">{label}</span>
            <span className="text-xs text-gray-500">
              ({sectionItems.length} {sectionItems.length === 1 ? t('common.item') : t('common.items')})
            </span>
          </div>
          <span className="text-sm font-semibold text-gray-700">
            {fmtCurrency(total)}
          </span>
        </button>
        {!isCollapsed && (
          <div className="p-3 space-y-2">
            {sectionItems.map(renderItemCard)}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (items.length === 0) {
      return (
        <EmptyState
          title={t('budgetItemsList.noBudgetItems')}
          description={t('budgetItemsList.addBudgetItems')}
        />
      );
    }

    const hasMilestones = milestones.length > 0;

    if (!hasMilestones) {
      return (
        <div className="space-y-2">
          {items.map(renderItemCard)}
        </div>
      );
    }

    // Group items by milestone
    const milestoneMap = new Map(milestones.map((m) => [m.id, m.name]));
    const grouped: Record<string, BudgetItem[]> = {};
    const generalItems: BudgetItem[] = [];

    for (const item of items) {
      if (item.milestoneId && milestoneMap.has(item.milestoneId)) {
        if (!grouped[item.milestoneId]) {
          grouped[item.milestoneId] = [];
        }
        grouped[item.milestoneId].push(item);
      } else {
        generalItems.push(item);
      }
    }

    // Render milestone sections in the same order as milestones prop
    const sections: React.ReactNode[] = [];
    for (const milestone of milestones) {
      const milestoneItems = grouped[milestone.id];
      if (milestoneItems && milestoneItems.length > 0) {
        sections.push(renderMilestoneSection(milestone.id, milestone.name, milestoneItems));
      }
    }

    if (generalItems.length > 0) {
      sections.push(renderMilestoneSection('__general__', t('budgetItemsList.general'), generalItems));
    }

    return <div className="space-y-4">{sections}</div>;
  };

  if (showCard) {
    return (
      <Card className={className}>
        <CardHeader title={t('budgetItemsList.title')} />
        <CardContent>{renderContent()}</CardContent>
      </Card>
    );
  }

  return <div className={className}>{renderContent()}</div>;
};
