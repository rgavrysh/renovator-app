import React from 'react';
import { Badge } from './ui/Badge';
import { Divider } from './ui/Divider';

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  targetDate: string;
  completedDate?: string;
  status: MilestoneStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export enum MilestoneStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
}

interface MilestoneListProps {
  milestones: Milestone[];
  showProgress?: boolean;
}

export const MilestoneList: React.FC<MilestoneListProps> = ({
  milestones,
  showProgress = true,
}) => {
  // Sort milestones in chronological order by target date
  const sortedMilestones = [...milestones].sort((a, b) => {
    return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMilestoneStatusBadgeVariant = (status: MilestoneStatus) => {
    switch (status) {
      case MilestoneStatus.NOT_STARTED:
        return 'default';
      case MilestoneStatus.IN_PROGRESS:
        return 'info';
      case MilestoneStatus.COMPLETED:
        return 'success';
      case MilestoneStatus.OVERDUE:
        return 'danger';
      default:
        return 'default';
    }
  };

  const getMilestoneStatusLabel = (status: MilestoneStatus) => {
    switch (status) {
      case MilestoneStatus.NOT_STARTED:
        return 'Not Started';
      case MilestoneStatus.IN_PROGRESS:
        return 'In Progress';
      case MilestoneStatus.COMPLETED:
        return 'Completed';
      case MilestoneStatus.OVERDUE:
        return 'Overdue';
      default:
        return status;
    }
  };

  const calculateProgress = () => {
    if (sortedMilestones.length === 0) return 0;
    const completed = sortedMilestones.filter(
      (m) => m.status === MilestoneStatus.COMPLETED
    ).length;
    return Math.round((completed / sortedMilestones.length) * 100);
  };

  const isOverdue = (milestone: Milestone) => {
    return milestone.status === MilestoneStatus.OVERDUE;
  };

  if (sortedMilestones.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">No milestones yet</p>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="space-y-4">
      {/* Progress Indicator */}
      {showProgress && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-semibold text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
            <span>
              {sortedMilestones.filter((m) => m.status === MilestoneStatus.COMPLETED).length} of{' '}
              {sortedMilestones.length} completed
            </span>
          </div>
        </div>
      )}

      {/* Milestone List */}
      <div className="space-y-4">
        {sortedMilestones.map((milestone, index) => (
          <div key={milestone.id}>
            {index > 0 && <Divider />}
            <div
              className={`flex items-start justify-between p-3 rounded-linear transition-colors ${
                isOverdue(milestone)
                  ? 'bg-red-50 border border-red-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {/* Milestone indicator dot */}
                  <div
                    className={`w-2 h-2 rounded-full ${
                      milestone.status === MilestoneStatus.COMPLETED
                        ? 'bg-green-500'
                        : milestone.status === MilestoneStatus.OVERDUE
                        ? 'bg-red-500'
                        : milestone.status === MilestoneStatus.IN_PROGRESS
                        ? 'bg-blue-500'
                        : 'bg-gray-300'
                    }`}
                  />
                  <h4
                    className={`text-sm font-medium ${
                      isOverdue(milestone) ? 'text-red-900' : 'text-gray-900'
                    }`}
                  >
                    {milestone.name}
                  </h4>
                  <Badge
                    variant={getMilestoneStatusBadgeVariant(milestone.status)}
                    size="sm"
                  >
                    {getMilestoneStatusLabel(milestone.status)}
                  </Badge>
                </div>
                {milestone.description && (
                  <p
                    className={`text-sm mb-2 ml-4 ${
                      isOverdue(milestone) ? 'text-red-700' : 'text-gray-600'
                    }`}
                  >
                    {milestone.description}
                  </p>
                )}
                <div
                  className={`flex items-center gap-4 text-xs ml-4 ${
                    isOverdue(milestone) ? 'text-red-600' : 'text-gray-500'
                  }`}
                >
                  <span className={isOverdue(milestone) ? 'font-medium' : ''}>
                    Target: {formatDate(milestone.targetDate)}
                  </span>
                  {milestone.completedDate && (
                    <span>Completed: {formatDate(milestone.completedDate)}</span>
                  )}
                  {isOverdue(milestone) && !milestone.completedDate && (
                    <span className="font-medium text-red-600">⚠ Overdue</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
