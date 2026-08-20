import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from './ui/Badge';
import { Divider } from './ui/Divider';
import { Select } from './ui/Select';
import { StatusIcon } from './ui/StatusIcon';
import { IconButton } from './ui/IconButton';
import { formatCurrency } from '../utils/currency';
import { getTaskStatusIconKind } from '../utils/statusColors';
import { Trash2 } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [milestoneFilter, setMilestoneFilter] = useState<string>('all');
  const [editingAmounts, setEditingAmounts] = useState<Record<string, string>>({});

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

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

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
  }, [tasks, statusFilter, priorityFilter, milestoneFilter]);

  const statusOptions = [
    { value: 'all', label: t('taskList.allStatuses') },
    { value: TaskStatus.TODO, label: t('taskStatus.todo') },
    { value: TaskStatus.IN_PROGRESS, label: t('taskStatus.in_progress') },
    { value: TaskStatus.COMPLETED, label: t('taskStatus.completed') },
    { value: TaskStatus.BLOCKED, label: t('taskStatus.blocked') },
  ];

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
        <p className="text-sm text-gray-500">{t('taskList.noTasks')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Select
            label={t('common.status')}
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            fullWidth
          />
        </div>
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
      <div className="text-sm text-gray-600">
        {t('taskList.showingTasks', { filtered: filteredTasks.length, total: tasks.length })}
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">{t('taskList.noTasksMatch')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task, index) => {
            const taskIsOverdue = isOverdue(task);
            const amountValue =
              editingAmounts[task.id] ?? String(task.amount ?? '');

            return (
              <div key={task.id}>
                {index > 0 && <Divider />}
                <div
                  role="button"
                  tabIndex={0}
                  className={`flex items-center p-3 rounded-linear transition-colors cursor-pointer ${
                    taskIsOverdue
                      ? 'bg-red-50 border border-red-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => activateRow?.(task)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      activateRow?.(task);
                    }
                  }}
                >
                  {/* Status circle indicator */}
                  <button
                    type="button"
                    className="relative group flex-shrink-0 p-0 border-0 bg-transparent"
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
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {getStatusLabel(task.status)}
                    </div>
                  </button>

                  {/* Task info */}
                  <div className="flex-1 ml-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-medium truncate ${
                          taskIsOverdue ? 'text-red-900' : 'text-gray-900'
                        }`}
                      >
                        {task.name}
                      </h4>

                      {/* Priority badge — clickable to cycle */}
                      <button
                        type="button"
                        className="cursor-pointer flex-shrink-0 p-0 border-0 bg-transparent"
                        title={getPriorityLabel(task.priority)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPriorityChange?.(task, getNextPriority(task.priority));
                        }}
                      >
                        <Badge
                          variant={getPriorityBadgeVariant(task.priority)}
                          size="sm"
                        >
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      </button>
                    </div>

                    {/* Meta info */}
                    <div
                      className={`flex items-center gap-4 text-xs mt-0.5 ${
                        taskIsOverdue ? 'text-red-600' : 'text-gray-500'
                      }`}
                    >
                      {task.dueDate && (
                        <span className={taskIsOverdue ? 'font-medium' : ''}>
                          {t('taskList.due')} {formatDate(task.dueDate)}
                        </span>
                      )}
                      {task.actualPrice !== undefined && task.actualPrice !== null && (
                        <span>
                          {t('taskList.actual')}{' '}
                          {formatCurrency(Number(task.actualPrice), i18n.language)}
                          {task.unit && ` (${Number(task.amount || 1)} ${task.unit})`}
                        </span>
                      )}
                      {taskIsOverdue && (
                        <span className="font-medium text-red-600">
                          ⚠ {t('common.overdue')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount input */}
                  {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
                  <div
                    className="flex items-center gap-1.5 ml-4 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <label className="text-xs text-gray-500 whitespace-nowrap">
                      {t('taskForm.amount')}:
                    </label>
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
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-center"
                    />
                  </div>

                  {/* Delete button */}
                  {onDelete && (
                    <IconButton
                      label={t('common.delete')}
                      icon={<Trash2 className="w-4 h-4" strokeWidth={1.5} />}
                      variant="danger"
                      className="ml-3 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(task);
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
