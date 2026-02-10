import React, { useState, useMemo } from 'react';
import { Badge } from './ui/Badge';
import { Divider } from './ui/Divider';
import { Select } from './ui/Select';

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
  estimatedPrice?: number;
  actualPrice?: number;
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
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
    switch (status) {
      case TaskStatus.TODO:
        return 'To Do';
      case TaskStatus.IN_PROGRESS:
        return 'In Progress';
      case TaskStatus.COMPLETED:
        return 'Completed';
      case TaskStatus.BLOCKED:
        return 'Blocked';
      default:
        return status;
    }
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
    switch (priority) {
      case TaskPriority.LOW:
        return 'Low';
      case TaskPriority.MEDIUM:
        return 'Medium';
      case TaskPriority.HIGH:
        return 'High';
      case TaskPriority.URGENT:
        return 'Urgent';
      default:
        return priority;
    }
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
    { value: 'all', label: 'All Statuses' },
    { value: TaskStatus.TODO, label: 'To Do' },
    { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
    { value: TaskStatus.COMPLETED, label: 'Completed' },
    { value: TaskStatus.BLOCKED, label: 'Blocked' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: TaskPriority.LOW, label: 'Low' },
    { value: TaskPriority.MEDIUM, label: 'Medium' },
    { value: TaskPriority.HIGH, label: 'High' },
    { value: TaskPriority.URGENT, label: 'Urgent' },
  ];

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">No tasks yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Select
            label="Status"
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            fullWidth
          />
        </div>
        <div className="flex-1">
          <Select
            label="Priority"
            options={priorityOptions}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            fullWidth
          />
        </div>
      </div>

      {/* Task Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredTasks.length} of {tasks.length} tasks
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No tasks match the selected filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task, index) => {
            const taskIsOverdue = isOverdue(task);
            
            return (
              <div key={task.id}>
                {index > 0 && <Divider />}
                <div
                  className={`flex items-start justify-between p-3 rounded-linear transition-colors ${
                    taskIsOverdue
                      ? 'bg-red-50 border border-red-200'
                      : 'hover:bg-gray-50'
                  }`}
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
                          <option value={TaskStatus.TODO}>To Do</option>
                          <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                          <option value={TaskStatus.COMPLETED}>Completed</option>
                          <option value={TaskStatus.BLOCKED}>Blocked</option>
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
                          Due: {formatDate(task.dueDate)}
                        </span>
                      )}
                      {task.completedDate && (
                        <span>Completed: {formatDate(task.completedDate)}</span>
                      )}
                      {task.estimatedPrice !== undefined && task.estimatedPrice !== null && (
                        <span>Est: ${Number(task.estimatedPrice).toFixed(2)}</span>
                      )}
                      {task.actualPrice !== undefined && task.actualPrice !== null && (
                        <span>Actual: ${Number(task.actualPrice).toFixed(2)}</span>
                      )}
                      {taskIsOverdue && (
                        <span className="font-medium text-red-600">⚠ Overdue</span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="ml-3 flex items-center gap-2">
                    {/* View Details button */}
                    {onViewDetails && (
                      <button
                        onClick={() => onViewDetails(task)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        title="View details"
                      >
                        Details
                      </button>
                    )}

                    {/* Complete button - only show if not completed */}
                    {onComplete && task.status !== TaskStatus.COMPLETED && (
                      <button
                        onClick={() => onComplete(task)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                        title="Mark as complete"
                      >
                        Complete
                      </button>
                    )}

                    {/* Edit button */}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(task)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Edit task"
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
                        title="Delete task"
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
