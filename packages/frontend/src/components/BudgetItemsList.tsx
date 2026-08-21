import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { IconButton } from './ui/IconButton';
import { ListRow, ListRowGroup } from './ui/ListRow';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/currency';
import { ChevronRight, Pencil, Trash2 } from 'lucide-react';

export enum BudgetCategory {
  LABOR = 'labor',
  MATERIALS = 'materials',
  EQUIPMENT = 'equipment',
  SUBCONTRACTORS = 'subcontractors',
  PERMITS = 'permits',
  CONTINGENCY = 'contingency',
  OTHER = 'other',
}

// Display order for grouped sections (U5.3) — fixed, not arrival order.
const CATEGORY_ORDER: BudgetCategory[] = [
  BudgetCategory.LABOR,
  BudgetCategory.MATERIALS,
  BudgetCategory.EQUIPMENT,
  BudgetCategory.SUBCONTRACTORS,
  BudgetCategory.PERMITS,
  BudgetCategory.CONTINGENCY,
  BudgetCategory.OTHER,
];

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
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const fmtCurrency = (amount: number): string => formatCurrency(amount, i18n.language);

  const getCategoryLabel = (category: BudgetCategory, customCategory?: string): string => {
    if (category === BudgetCategory.OTHER && customCategory) {
      return customCategory;
    }
    return t(`budgetCategory.${category}`);
  };

  const milestoneMap = useMemo(() => new Map(milestones.map((m) => [m.id, m.name])), [milestones]);

  const toggleCategory = (key: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getGroupTotal = (groupItems: BudgetItem[]): number => {
    return groupItems.reduce((sum, item) => sum + Number(item.actualCost), 0);
  };

  // Grouped by category (U5.3), in fixed display order, skipping empty groups.
  const groupedItems = useMemo(() => {
    const groups = new Map<BudgetCategory, BudgetItem[]>();
    for (const category of CATEGORY_ORDER) {
      groups.set(category, []);
    }
    for (const item of items) {
      groups.get(item.category)?.push(item);
    }
    return CATEGORY_ORDER.map((category) => ({ category, items: groups.get(category) ?? [] })).filter(
      (group) => group.items.length > 0
    );
  }, [items]);

  const renderItemRow = (item: BudgetItem) => {
    const milestoneName = item.milestoneId ? milestoneMap.get(item.milestoneId) : undefined;

    return (
      <ListRow
        key={item.id}
        meta={<span className="font-medium text-gray-900">{fmtCurrency(item.actualCost)}</span>}
        actions={
          <>
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
          </>
        }
      >
        <h4 className="text-ui font-medium text-gray-900 truncate">{item.name}</h4>
        {(item.notes || milestoneName) && (
          <p className="text-ui-xs text-gray-500 mt-0.5 truncate">
            {[milestoneName, item.notes].filter(Boolean).join(' · ')}
          </p>
        )}
      </ListRow>
    );
  };

  const renderCategorySection = (category: BudgetCategory, categoryItems: BudgetItem[]) => {
    const isCollapsed = collapsedCategories[category] ?? false;
    const total = getGroupTotal(categoryItems);
    const label = getCategoryLabel(category, categoryItems.find((i) => i.customCategory)?.customCategory);

    return (
      <div key={category}>
        <button
          type="button"
          onClick={() => toggleCategory(category)}
          className="w-full flex items-center justify-between gap-1.5 px-1 py-1.5 text-left hover:bg-subtle rounded transition-colors"
          aria-expanded={!isCollapsed}
        >
          <span className="flex items-center gap-1.5">
            <ChevronRight
              className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
              strokeWidth={1.5}
            />
            <span className="text-ui-sm font-medium text-gray-700">{label}</span>
            <span className="text-ui-xs text-gray-400">{categoryItems.length}</span>
          </span>
          <span className="text-ui-sm font-medium text-gray-700">{fmtCurrency(total)}</span>
        </button>
        {!isCollapsed && <ListRowGroup>{categoryItems.map(renderItemRow)}</ListRowGroup>}
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

    return <div className="space-y-1">{groupedItems.map(({ category, items }) => renderCategorySection(category, items))}</div>;
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
