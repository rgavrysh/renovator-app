import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalFooter } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Textarea } from './ui/Textarea';
import { Divider } from './ui/Divider';
import { apiClient } from '../utils/api';
import { Task, TaskStatus, TaskPriority } from './TaskList';
import { formatCurrency } from '../utils/currency';

interface TaskDetailProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onTaskUpdate?: () => void;
  onStatusChange?: (task: Task, newStatus: TaskStatus) => void;
  onTaskDelete?: (taskId: string) => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({
  isOpen,
  onClose,
  task,
  onTaskUpdate,
  onStatusChange,
  onTaskDelete,
}) => {
  const { t, i18n } = useTranslation();
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = i18n.language === 'uk' ? 'uk-UA' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const locale = i18n.language === 'uk' ? 'uk-UA' : 'en-US';
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTaskStatusLabel = (status: TaskStatus) => {
    return t(`taskStatus.${status}`);
  };

  const getTaskPriorityLabel = (priority: TaskPriority) => {
    return t(`taskPriority.${priority}`);
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

  const handleAddNote = async () => {
    if (!task || !newNote.trim()) {
      return;
    }

    setIsAddingNote(true);
    setNoteError(null);

    try {
      await apiClient.post(`/api/tasks/${task.id}/notes`, {
        note: newNote.trim(),
      });

      // Clear the note input
      setNewNote('');

      // Notify parent to refresh task data
      if (onTaskUpdate) {
        onTaskUpdate();
      }
    } catch (error: any) {
      console.error('Error adding note:', error);
      setNoteError(error.message || 'Failed to add note. Please try again.');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!task) {
      return;
    }

    // Show confirmation dialog
    if (!window.confirm(t('taskDetail.deleteConfirm', { name: task.name }))) {
      return;
    }

    setIsDeleting(true);

    try {
      await apiClient.delete(`/api/tasks/${task.id}`);

      // Close the modal
      onClose();

      // Notify parent to refresh task list
      if (onTaskDelete) {
        onTaskDelete(task.id);
      }
    } catch (error: any) {
      console.error('Error deleting task:', error);
      alert(error.message || 'Failed to delete task. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!task) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task.name}
      size="lg"
    >
      <div className="space-y-6">
        {/* Task Status and Priority */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('common.status')}
            </label>
            {onStatusChange ? (
              <select
                value={task.status}
                onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-linear bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={TaskStatus.TODO}>{t('taskStatus.todo')}</option>
                <option value={TaskStatus.IN_PROGRESS}>{t('taskStatus.in_progress')}</option>
                <option value={TaskStatus.COMPLETED}>{t('taskStatus.completed')}</option>
                <option value={TaskStatus.BLOCKED}>{t('taskStatus.blocked')}</option>
              </select>
            ) : (
              <Badge variant={getTaskStatusBadgeVariant(task.status)}>
                {getTaskStatusLabel(task.status)}
              </Badge>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('common.priority')}
            </label>
            <Badge variant={getTaskPriorityBadgeVariant(task.priority)}>
              {getTaskPriorityLabel(task.priority)}
            </Badge>
          </div>
        </div>

        {/* Task Description */}
        {task.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">{t('common.description')}</h3>
            <p className="text-sm text-gray-600">{task.description}</p>
          </div>
        )}

        {/* Task Details */}
        <div className="grid grid-cols-2 gap-4">
          {task.dueDate && (
            <div>
              <p className="text-xs text-gray-500 mb-1">{t('taskDetail.dueDate')}</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(task.dueDate)}
              </p>
            </div>
          )}
          {task.completedDate && (
            <div>
              <p className="text-xs text-gray-500 mb-1">{t('taskDetail.completedDate')}</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(task.completedDate)}
              </p>
            </div>
          )}
          {task.price !== undefined && task.price !== null && (
            <div>
              <p className="text-xs text-gray-500 mb-1">{t('taskDetail.price')}</p>
              <p className="text-sm font-medium text-gray-900">
                {formatCurrency(Number(task.price), i18n.language)}
                {task.unit && <span className="text-gray-500"> / {task.unit}</span>}
              </p>
            </div>
          )}
          {task.amount !== undefined && task.amount !== null && task.amount !== 1 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">{t('taskDetail.amount')}</p>
              <p className="text-sm font-medium text-gray-900">
                {Number(task.amount).toFixed(2)}
              </p>
            </div>
          )}
          {task.actualPrice !== undefined && task.actualPrice !== null && (
            <div>
              <p className="text-xs text-gray-500 mb-1">{t('taskDetail.actualPrice')}</p>
              <p className="text-sm font-medium text-gray-900">
                {formatCurrency(Number(task.actualPrice), i18n.language)}
              </p>
            </div>
          )}
        </div>

        <Divider />

        {/* Notes Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">{t('common.notes')}</h3>
          
          {/* Add Note Form */}
          <div className="mb-4">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={t('taskDetail.addNotePlaceholder')}
              rows={3}
              fullWidth
            />
            {noteError && (
              <p className="text-xs text-red-600 mt-1">{noteError}</p>
            )}
            <div className="mt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddNote}
                disabled={!newNote.trim() || isAddingNote}
                loading={isAddingNote}
              >
                {t('taskDetail.addNote')}
              </Button>
            </div>
          </div>

          {/* Notes History */}
          {task.notes && task.notes.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-gray-500 uppercase">{t('taskDetail.history')}</h4>
              <div className="space-y-2">
                {task.notes.map((note, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-linear border border-gray-200"
                  >
                    <p className="text-sm text-gray-900">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">{t('taskDetail.noNotes')}</p>
            </div>
          )}
        </div>
      </div>

      <ModalFooter>
        <div className="flex items-center justify-between w-full">
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={isDeleting}
            loading={isDeleting}
          >
            {t('taskDetail.deleteTask')}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};
