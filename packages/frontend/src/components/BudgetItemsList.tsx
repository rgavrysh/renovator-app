import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { IconButton } from './ui/IconButton';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/currency';
import { getBudgetCategoryVariant } from '../utils/statusColors';
import { Pencil, Trash2, ChevronRight } from 'lucide-react';

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

  const getCategoryColor = (category: BudgetCategory) => getBudgetCategoryVariant(category);

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
              <Badge variant={getCategoryColor(item.category)} size="sm">
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
                  <IconButton
                    label={t('common.edit')}
                    icon={<Pencil className="h-4 w-4" strokeWidth={1.5} />}
                    size="sm"
                    onClick={() => onEditItem(item)}
                  />
                )}
                {onDeleteItem && (
                  <IconButton
                    label={t('common.delete')}
                    icon={<Trash2 className="h-4 w-4" strokeWidth={1.5} />}
                    size="sm"
                    variant="danger"
                    onClick={() => onDeleteItem(item)}
                  />
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
            <ChevronRight
              className={`w-4 h-4 text-gray-500 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
              strokeWidth={1.5}
            />
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
