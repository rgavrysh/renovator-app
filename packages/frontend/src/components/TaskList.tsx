import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from './ui/Badge';
import { Divider } from './ui/Divider';
import { Select } from './ui/Select';
import { formatCurrency } from '../utils/currency';

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
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onStatusChange?: (task: Task, newStatus: TaskStatus) => void;
  onPriorityChange?: (task: Task, newPriority: TaskPriority) => void;
  onAmountChange?: (task: Task, newAmount: number) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
  onAmountChange,
}) => {
  const { t, i18n } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
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

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.TODO:
        return 'bg-gray-400';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-500';
      case TaskStatus.COMPLETED:
        return 'bg-green-500';
      case TaskStatus.BLOCKED:
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

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

    return filtered;
  }, [tasks, statusFilter, priorityFilter]);

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
                  onClick={() => onEdit?.(task)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onEdit?.(task);
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
                    <div
                      className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-transform hover:scale-125 ${getStatusColor(
                        task.status
                      )}`}
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(task);
                      }}
                      className="ml-3 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                      title={t('common.delete')}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
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
