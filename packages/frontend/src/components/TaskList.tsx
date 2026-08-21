import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from './ui/Badge';
import { Select } from './ui/Select';
import { StatusIcon } from './ui/StatusIcon';
import { IconButton } from './ui/IconButton';
import { ListRow, ListRowGroup } from './ui/ListRow';
import { formatCurrency } from '../utils/currency';
import { getTaskStatusIconKind } from '../utils/statusColors';
import { ChevronRight, Trash2 } from 'lucide-react';
import type { Milestone } from './MilestoneList';

export interface Task {
  id: string;
  projectId: string;
  milestoneId?: string;
  name: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedDate?: string;
  price?: number;
  amount?: number;
  actualPrice?: number;
  unit?: string;
  notes: string[];
  createdAt: string;
  updatedAt: string;
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

const STATUS_CYCLE: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETED,
  TaskStatus.BLOCKED,
];

// Display order for grouped sections (U5.3) — matches the status lifecycle,
// not alphabetical or arrival order.
const STATUS_GROUP_ORDER: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.BLOCKED,
  TaskStatus.COMPLETED,
];

const PRIORITY_CYCLE: TaskPriority[] = [
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.URGENT,
];

export interface TaskListProps {
  tasks: Task[];
  milestones?: Milestone[];
  /** Activating a row calls this; falls back to `onEdit` when not provided. */
  onSelect?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onStatusChange?: (task: Task, newStatus: TaskStatus) => void;
  onPriorityChange?: (task: Task, newPriority: TaskPriority) => void;
  onAmountChange?: (task: Task, newAmount: number) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  milestones = [],
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
  onAmountChange,
}) => {
  const { t, i18n } = useTranslation();
  const activateRow = onSelect ?? onEdit;
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [milestoneFilter, setMilestoneFilter] = useState<string>('all');
  const [editingAmounts, setEditingAmounts] = useState<Record<string, string>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = i18n.language === 'uk' ? 'uk-UA' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (task: Task): boolean => {
    if (!task.dueDate || task.status === TaskStatus.COMPLETED) {
      return false;
    }
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const getStatusIconKind = (status: TaskStatus) => getTaskStatusIconKind(status);

  const getStatusLabel = (status: TaskStatus) => {
    return t(`taskStatus.${status}`);
  };

  const getNextStatus = (current: TaskStatus): TaskStatus => {
    const idx = STATUS_CYCLE.indexOf(current);
    return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
  };

  const getNextPriority = (current: TaskPriority): TaskPriority => {
    const idx = PRIORITY_CYCLE.indexOf(current);
    return PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length];
  };

  const getPriorityBadgeVariant = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'default';
      case TaskPriority.MEDIUM:
        return 'info';
      case TaskPriority.HIGH:
        return 'warning';
      case TaskPriority.URGENT:
        return 'danger';
      default:
        return 'default';
    }
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    return t(`taskPriority.${priority}`);
  };

  const handleAmountBlur = (task: Task) => {
    const newAmountStr = editingAmounts[task.id];
    if (newAmountStr !== undefined) {
      const newAmount = Number.parseFloat(newAmountStr);
      if (!Number.isNaN(newAmount) && newAmount >= 0 && newAmount !== (task.amount ?? 0)) {
        onAmountChange?.(task, newAmount);
      }
      setEditingAmounts((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
    }
  };

  const toggleGroup = (status: TaskStatus) => {
    setCollapsedGroups((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    if (milestoneFilter !== 'all') {
      if (milestoneFilter === 'none') {
        filtered = filtered.filter((task) => !task.milestoneId);
      } else {
        filtered = filtered.filter((task) => task.milestoneId === milestoneFilter);
      }
    }

    return filtered;
  }, [tasks, priorityFilter, milestoneFilter]);

  // Grouped by status (U5.3), in lifecycle order, skipping empty groups.
  const groupedTasks = useMemo(() => {
    const groups = new Map<TaskStatus, Task[]>();
    for (const status of STATUS_GROUP_ORDER) {
      groups.set(status, []);
    }
    for (const task of filteredTasks) {
      groups.get(task.status)?.push(task);
    }
    return STATUS_GROUP_ORDER.map((status) => ({ status, tasks: groups.get(status) ?? [] })).filter(
      (group) => group.tasks.length > 0
    );
  }, [filteredTasks]);

  const priorityOptions = [
    { value: 'all', label: t('taskList.allPriorities') },
    { value: TaskPriority.LOW, label: t('taskPriority.low') },
    { value: TaskPriority.MEDIUM, label: t('taskPriority.medium') },
    { value: TaskPriority.HIGH, label: t('taskPriority.high') },
    { value: TaskPriority.URGENT, label: t('taskPriority.urgent') },
  ];

  const milestoneOptions = [
    { value: 'all', label: t('taskList.allMilestones') },
    { value: 'none', label: t('taskList.noMilestone') },
    ...milestones.map((m) => ({ value: m.id, label: m.name })),
  ];

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-ui text-gray-500">{t('taskList.noTasks')}</p>
      </div>
    );
  }

  const renderTaskRow = (task: Task) => {
    const taskIsOverdue = isOverdue(task);
    const amountValue = editingAmounts[task.id] ?? String(task.amount ?? '');

    return (
      <ListRow
        key={task.id}
        danger={taskIsOverdue}
        onActivate={activateRow ? () => activateRow(task) : undefined}
        icon={
          <button
            type="button"
            className="relative group/status flex-shrink-0 p-0 border-0 bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange?.(task, getNextStatus(task.status));
            }}
            title={getStatusLabel(task.status)}
          >
            <StatusIcon
              status={getStatusIconKind(task.status)}
              size={16}
              className="cursor-pointer transition-transform hover:scale-125"
            />
          </button>
        }
        meta={
          <>
            {task.dueDate && (
              <span className={taskIsOverdue ? 'font-medium' : ''}>
                {t('taskList.due')} {formatDate(task.dueDate)}
              </span>
            )}
            {task.actualPrice !== undefined && task.actualPrice !== null && (
              <span>
                {t('taskList.actual')} {formatCurrency(Number(task.actualPrice), i18n.language)}
                {task.unit && ` (${Number(task.amount || 1)} ${task.unit})`}
              </span>
            )}
            {taskIsOverdue && <span className="font-medium">⚠ {t('common.overdue')}</span>}
          </>
        }
        actions={
          <>
            <div className="flex items-center gap-1.5">
              <label className="text-ui-xs text-gray-500 whitespace-nowrap">{t('taskForm.amount')}:</label>
              <input
                type="number"
                min="0"
                step="1"
                value={amountValue}
                onChange={(e) =>
                  setEditingAmounts((prev) => ({
                    ...prev,
                    [task.id]: e.target.value,
                  }))
                }
                onBlur={() => handleAmountBlur(task)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="w-20 h-7 px-2 text-ui border border-gray-300 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-center"
              />
            </div>
            {onDelete && (
              <IconButton
                label={t('common.delete')}
                icon={<Trash2 className="w-4 h-4" strokeWidth={1.5} />}
                variant="danger"
                onClick={() => onDelete(task)}
              />
            )}
          </>
        }
      >
        <div className="flex items-center gap-2">
          <h4 className={`text-ui font-medium truncate ${taskIsOverdue ? 'text-danger-900' : 'text-gray-900'}`}>
            {task.name}
          </h4>
          <button
            type="button"
            className="cursor-pointer flex-shrink-0 p-0 border-0 bg-transparent"
            title={getPriorityLabel(task.priority)}
            onClick={(e) => {
              e.stopPropagation();
              onPriorityChange?.(task, getNextPriority(task.priority));
            }}
          >
            <Badge variant={getPriorityBadgeVariant(task.priority)} size="sm">
              {getPriorityLabel(task.priority)}
            </Badge>
          </button>
        </div>
      </ListRow>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls — status is handled by the grouped sections below (U5.3) */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Select
            label={t('common.priority')}
            options={priorityOptions}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            fullWidth
          />
        </div>
        {milestones.length > 0 && (
          <div className="flex-1">
            <Select
              label={t('taskForm.milestone')}
              options={milestoneOptions}
              value={milestoneFilter}
              onChange={(e) => setMilestoneFilter(e.target.value)}
              fullWidth
            />
          </div>
        )}
      </div>

      {/* Task Count */}
      <div className="text-ui text-gray-600">
        {t('taskList.showingTasks', { filtered: filteredTasks.length, total: tasks.length })}
      </div>

      {/* Grouped, collapsible task sections (U5.3) */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-ui text-gray-500">{t('taskList.noTasksMatch')}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {groupedTasks.map(({ status, tasks: groupTasks }) => {
            const isCollapsed = collapsedGroups[status] ?? false;
            return (
              <div key={status}>
                <button
                  type="button"
                  onClick={() => toggleGroup(status)}
                  className="w-full flex items-center gap-1.5 px-1 py-1.5 text-left hover:bg-subtle rounded transition-colors"
                  aria-expanded={!isCollapsed}
                >
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                    strokeWidth={1.5}
                  />
                  <StatusIcon status={getStatusIconKind(status)} size={13} />
                  <span className="text-ui-sm font-medium text-gray-700">{getStatusLabel(status)}</span>
                  <span className="text-ui-xs text-gray-400">{groupTasks.length}</span>
                </button>
                {!isCollapsed && <ListRowGroup>{groupTasks.map(renderTaskRow)}</ListRowGroup>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
