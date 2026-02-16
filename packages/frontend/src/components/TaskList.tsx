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

export interface TaskListProps {
  tasks: Task[];
  onEdit?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onViewDetails?: (task: Task) => void;
  onStatusChange?: (task: Task, newStatus: TaskStatus) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onEdit,
  onComplete,
  onDelete,
  onViewDetails,
  onStatusChange,
}) => {
  const { t, i18n } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

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

  const getTaskStatusBadgeVariant = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'default';
      case TaskStatus.IN_PROGRESS:
        return 'info';
      case TaskStatus.COMPLETED:
        return 'success';
      case TaskStatus.BLOCKED:
        return 'danger';
      default:
        return 'default';
    }
  };

  const getTaskStatusLabel = (status: TaskStatus) => {
    return t(`taskStatus.${status}`);
  };

  const getTaskPriorityBadgeVariant = (priority: TaskPriority) => {
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

  const getTaskPriorityLabel = (priority: TaskPriority) => {
    return t(`taskPriority.${priority}`);
  };

  // Filter tasks based on selected filters
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
            
            return (
              <div key={task.id}>
                {index > 0 && <Divider />}
                <div
                  className={`flex items-start justify-between p-3 rounded-linear transition-colors cursor-pointer ${
                    taskIsOverdue
                      ? 'bg-red-50 border border-red-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onEdit && onEdit(task)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Task indicator dot */}
                      <div
                        className={`w-2 h-2 rounded-full ${
                          task.status === TaskStatus.COMPLETED
                            ? 'bg-green-500'
                            : task.status === TaskStatus.BLOCKED
                            ? 'bg-red-500'
                            : task.status === TaskStatus.IN_PROGRESS
                            ? 'bg-blue-500'
                            : 'bg-gray-300'
                        }`}
                      />
                      <h4
                        className={`text-sm font-medium ${
                          taskIsOverdue ? 'text-red-900' : 'text-gray-900'
                        }`}
                      >
                        {task.name}
                      </h4>
                      
                      {/* Status Dropdown */}
                      {onStatusChange ? (
                        <select
                          value={task.status}
                          onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
                          className="text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value={TaskStatus.TODO}>{t('taskStatus.todo')}</option>
                          <option value={TaskStatus.IN_PROGRESS}>{t('taskStatus.in_progress')}</option>
                          <option value={TaskStatus.COMPLETED}>{t('taskStatus.completed')}</option>
                          <option value={TaskStatus.BLOCKED}>{t('taskStatus.blocked')}</option>
                        </select>
                      ) : (
                        <Badge
                          variant={getTaskStatusBadgeVariant(task.status)}
                          size="sm"
                        >
                          {getTaskStatusLabel(task.status)}
                        </Badge>
                      )}
                      
                      <Badge
                        variant={getTaskPriorityBadgeVariant(task.priority)}
                        size="sm"
                      >
                        {getTaskPriorityLabel(task.priority)}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p
                        className={`text-sm mb-2 ml-4 ${
                          taskIsOverdue ? 'text-red-700' : 'text-gray-600'
                        }`}
                      >
                        {task.description}
                      </p>
                    )}
                    
                    <div
                      className={`flex items-center gap-4 text-xs ml-4 ${
                        taskIsOverdue ? 'text-red-600' : 'text-gray-500'
                      }`}
                    >
                      {task.dueDate && (
                        <span className={taskIsOverdue ? 'font-medium' : ''}>
                          {t('taskList.due')} {formatDate(task.dueDate)}
                        </span>
                      )}
                      {task.completedDate && (
                        <span>{t('taskList.completed')} {formatDate(task.completedDate)}</span>
                      )}
                      {task.actualPrice !== undefined && task.actualPrice !== null && (
                        <span>
                          {t('taskList.actual')} {formatCurrency(Number(task.actualPrice), i18n.language)}
                          {task.unit && ` (${Number(task.amount || 1)} ${task.unit})`}
                        </span>
                      )}
                      {taskIsOverdue && (
                        <span className="font-medium text-red-600">⚠ {t('common.overdue')}</span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="ml-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* View Details button */}
                    {onViewDetails && (
                      <button
                        onClick={() => onViewDetails(task)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        title={t('common.details')}
                      >
                        {t('common.details')}
                      </button>
                    )}

                    {/* Complete button - only show if not completed */}
                    {onComplete && task.status !== TaskStatus.COMPLETED && (
                      <button
                        onClick={() => onComplete(task)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                        title={t('common.complete')}
                      >
                        {t('common.complete')}
                      </button>
                    )}

                    {/* Edit button */}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(task)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title={t('common.edit')}
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    )}

                    {/* Delete button */}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(task)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
