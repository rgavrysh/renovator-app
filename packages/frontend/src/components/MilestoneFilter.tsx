import React, { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, CircleDashed, Diamond, Layers, ListFilter, X } from 'lucide-react';

/** `'all'` (no filter), `'none'` (items without a milestone), or a milestone id. */
export type MilestoneFilterValue = string;

export const MILESTONE_FILTER_ALL = 'all';
export const MILESTONE_FILTER_NONE = 'none';

interface MilestoneOption {
  id: string;
  name: string;
}

export const matchesMilestoneFilter = (
  milestoneId: string | null | undefined,
  filter: MilestoneFilterValue
): boolean => {
  if (filter === MILESTONE_FILTER_ALL) return true;
  if (filter === MILESTONE_FILTER_NONE) return !milestoneId;
  return milestoneId === filter;
};

export const isValidMilestoneFilter = (
  filter: MilestoneFilterValue,
  milestones: MilestoneOption[]
): boolean =>
  filter === MILESTONE_FILTER_ALL ||
  filter === MILESTONE_FILTER_NONE ||
  milestones.some((m) => m.id === filter);

const iconProps = { className: 'h-3.5 w-3.5 flex-shrink-0', strokeWidth: 1.5 };

const getFilterIcon = (value: MilestoneFilterValue) => {
  if (value === MILESTONE_FILTER_ALL) return <Layers {...iconProps} />;
  if (value === MILESTONE_FILTER_NONE) return <CircleDashed {...iconProps} />;
  return <Diamond {...iconProps} />;
};

const useFilterLabel = (milestones: MilestoneOption[]) => {
  const { t } = useTranslation();
  return (value: MilestoneFilterValue): string => {
    if (value === MILESTONE_FILTER_ALL) return t('milestoneFilter.allMilestones');
    if (value === MILESTONE_FILTER_NONE) return t('milestoneFilter.noMilestone');
    return milestones.find((m) => m.id === value)?.name ?? '';
  };
};

export interface MilestoneFilterProps {
  milestones: MilestoneOption[];
  value: MilestoneFilterValue;
  onChange: (value: MilestoneFilterValue) => void;
  /** Accessible name for the trigger; defaults to "Filter by milestone". */
  label?: string;
}

/**
 * Icon-triggered milestone filter menu for space-constrained panels. Fully
 * keyboard operable: arrows/Home/End move, Enter/Space select, Escape closes.
 */
export const MilestoneFilter: React.FC<MilestoneFilterProps> = ({ milestones, value, onChange, label }) => {
  const { t } = useTranslation();
  const getLabel = useFilterLabel(milestones);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  const options: MilestoneFilterValue[] = [
    MILESTONE_FILTER_ALL,
    MILESTONE_FILTER_NONE,
    ...milestones.map((m) => m.id),
  ];
  const isActive = value !== MILESTONE_FILTER_ALL;
  const triggerLabel = label ?? t('milestoneFilter.filterByMilestone');

  useEffect(() => {
    if (!isOpen) return;

    const selectedIndex = Math.max(0, options.indexOf(value));
    optionRefs.current[selectedIndex]?.focus();

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    // Focus the selected option only when the menu opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const close = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const select = (next: MilestoneFilterValue) => {
    onChange(next);
    close();
  };

  const focusOption = (index: number) => {
    const count = options.length;
    optionRefs.current[(index + count) % count]?.focus();
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    const current = optionRefs.current.findIndex((el) => el === document.activeElement);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusOption(current + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusOption(current - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusOption(0);
        break;
      case 'End':
        e.preventDefault();
        focusOption(options.length - 1);
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const renderOption = (option: MilestoneFilterValue, index: number) => {
    const isSelected = option === value;
    return (
      <button
        key={option}
        ref={(el) => {
          optionRefs.current[index] = el;
        }}
        type="button"
        role="menuitemradio"
        aria-checked={isSelected}
        tabIndex={-1}
        onClick={() => select(option)}
        className={`flex w-full items-center gap-2 h-8 px-2 rounded text-left text-ui transition-colors
          hover:bg-subtle focus:bg-subtle focus:outline-none
          ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}
      >
        <span className="text-gray-400">{getFilterIcon(option)}</span>
        <span className="flex-1 min-w-0 truncate">{getLabel(option)}</span>
        {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" strokeWidth={2} />}
      </button>
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={triggerLabel}
        title={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={handleTriggerKeyDown}
        className={`relative inline-flex h-7 w-7 items-center justify-center rounded transition-colors duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
          ${
            isActive
              ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
              : `text-gray-400 hover:text-gray-600 hover:bg-subtle ${isOpen ? 'bg-subtle text-gray-600' : ''}`
          }`}
      >
        <ListFilter className="h-4 w-4" strokeWidth={1.5} />
        {isActive && (
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary-600 ring-2 ring-surface" />
        )}
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={triggerLabel}
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-full mt-1 z-50 w-56 rounded-linear bg-surface shadow-popover animate-pop-in origin-top-right"
        >
          <div className="px-3 pt-2 pb-1 text-ui-xs font-medium text-gray-500">
            {t('milestoneFilter.milestone')}
          </div>
          <div className="p-1 pt-0">
            {renderOption(MILESTONE_FILTER_ALL, 0)}
            {renderOption(MILESTONE_FILTER_NONE, 1)}
          </div>
          {milestones.length > 0 && (
            <>
              <div className="h-px bg-border-subtle" />
              <div className="p-1 max-h-64 overflow-y-auto">
                {milestones.map((m, i) => renderOption(m.id, i + 2))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export interface MilestoneFilterChipProps {
  milestones: MilestoneOption[];
  value: MilestoneFilterValue;
  onClear: () => void;
  className?: string;
}

/** Shows the active milestone filter as a removable chip; renders nothing when unfiltered. */
export const MilestoneFilterChip: React.FC<MilestoneFilterChipProps> = ({
  milestones,
  value,
  onClear,
  className = '',
}) => {
  const { t } = useTranslation();
  const getLabel = useFilterLabel(milestones);

  if (value === MILESTONE_FILTER_ALL) return null;

  return (
    <div
      className={`inline-flex max-w-full items-center h-6 rounded border border-border bg-subtle text-ui-sm ${className}`}
    >
      <span className="flex items-center gap-1.5 pl-2 pr-1.5 text-gray-500 border-r border-border h-full">
        {getFilterIcon(value)}
        {t('milestoneFilter.milestone')}
      </span>
      <span className="px-1.5 font-medium text-gray-800 truncate">{getLabel(value)}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label={t('milestoneFilter.clear')}
        title={t('milestoneFilter.clear')}
        className="flex h-full items-center px-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-r border-l border-border transition-colors"
      >
        <X className="h-3 w-3" strokeWidth={2} />
      </button>
    </div>
  );
};
