import React, { useState } from 'react';
import { Modal, ModalFooter } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Textarea } from './ui/Textarea';
import { Divider } from './ui/Divider';
import { apiClient } from '../utils/api';
import { Task, TaskStatus, TaskPriority } from './TaskList';

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
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
    if (!window.confirm(`Are you sure you want to delete "${task.name}"? This action cannot be undone.`)) {
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
              Status
            </label>
            {onStatusChange ? (
              <select
                value={task.status}
                onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-linear bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={TaskStatus.TODO}>To Do</option>
                <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                <option value={TaskStatus.COMPLETED}>Completed</option>
                <option value={TaskStatus.BLOCKED}>Blocked</option>
              </select>
            ) : (
              <Badge variant={getTaskStatusBadgeVariant(task.status)}>
                {getTaskStatusLabel(task.status)}
              </Badge>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Priority
            </label>
            <Badge variant={getTaskPriorityBadgeVariant(task.priority)}>
              {getTaskPriorityLabel(task.priority)}
            </Badge>
          </div>
        </div>

        {/* Task Description */}
        {task.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-sm text-gray-600">{task.description}</p>
          </div>
        )}

        {/* Task Details */}
        <div className="grid grid-cols-2 gap-4">
          {task.dueDate && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Due Date</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(task.dueDate)}
              </p>
            </div>
          )}
          {task.completedDate && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Completed Date</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(task.completedDate)}
              </p>
            </div>
          )}
          {task.estimatedPrice !== undefined && task.estimatedPrice !== null && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Estimated Price</p>
              <p className="text-sm font-medium text-gray-900">
                ${Number(task.estimatedPrice).toFixed(2)}
                {task.perUnit && <span className="text-gray-500"> / {task.perUnit}</span>}
              </p>
            </div>
          )}
          {task.actualPrice !== undefined && task.actualPrice !== null && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Actual Price</p>
              <p className="text-sm font-medium text-gray-900">
                ${Number(task.actualPrice).toFixed(2)}
                {task.perUnit && <span className="text-gray-500"> / {task.perUnit}</span>}
              </p>
            </div>
          )}
        </div>

        <Divider />

        {/* Notes Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Notes</h3>
          
          {/* Add Note Form */}
          <div className="mb-4">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
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
                Add Note
              </Button>
            </div>
          </div>

          {/* Notes History */}
          {task.notes && task.notes.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-gray-500 uppercase">History</h4>
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
              <p className="text-sm text-gray-500">No notes yet</p>
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
            Delete Task
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};
