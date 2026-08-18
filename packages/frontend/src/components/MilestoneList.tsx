import React from 'react';
import { Badge } from './ui/Badge';
import { Divider } from './ui/Divider';
import { useTranslation } from 'react-i18next';

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

export interface MilestoneTaskSummary {
  milestoneId?: string;
  status: string;
}

export interface MilestoneListProps {
  milestones: Milestone[];
  tasks?: MilestoneTaskSummary[];
  showProgress?: boolean;
  onEdit?: (milestone: Milestone) => void;
  onComplete?: (milestone: Milestone) => void;
  onDelete?: (milestone: Milestone) => void;
}

export const MilestoneList: React.FC<MilestoneListProps> = ({
  milestones,
  tasks = [],
  showProgress = true,
  onEdit,
  onComplete,
  onDelete,
}) => {
  const { t, i18n } = useTranslation();

  // Sort milestones in chronological order by target date
  const sortedMilestones = [...milestones].sort((a, b) => {
    return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'uk' ? 'uk-UA' : 'en-US', {
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
    return t(`milestoneStatus.${status}`);
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

  const getMilestoneTasks = (milestone: Milestone) => {
    return tasks.filter((task) => task.milestoneId === milestone.id);
  };

  // Days between target and actual completion: positive = late, negative = early, 0 = on time.
  const getForecastVarianceDays = (milestone: Milestone): number | null => {
    if (!milestone.completedDate) return null;
    const target = new Date(milestone.targetDate);
    const completed = new Date(milestone.completedDate);
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((completed.getTime() - target.getTime()) / msPerDay);
  };

  const getForecastVarianceLabel = (variance: number): string => {
    if (variance === 0) return t('milestoneList.completedOnTime');
    if (variance > 0) {
      return t('milestoneList.completedLate', { count: variance });
    }
    return t('milestoneList.completedEarly', { count: Math.abs(variance) });
  };

  const getForecastVarianceClassName = (variance: number): string => {
    if (variance > 0) return 'font-medium text-red-600';
    if (variance < 0) return 'font-medium text-green-600';
    return 'text-gray-500';
  };

  if (sortedMilestones.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">{t('milestoneList.noMilestones')}</p>
      </div>
    );
  }

  const progress = calculateProgress();
  const completedCount = sortedMilestones.filter((m) => m.status === MilestoneStatus.COMPLETED).length;

  return (
    <div className="space-y-4">
      {/* Progress Indicator */}
      {showProgress && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{t('milestoneList.overallProgress')}</span>
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
              {t('milestoneList.completedOf', { completed: completedCount, total: sortedMilestones.length })}
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
              role={onEdit ? 'button' : undefined}
              tabIndex={onEdit ? 0 : undefined}
              className={`flex items-start justify-between p-3 rounded-linear transition-colors ${
                onEdit ? 'cursor-pointer' : ''
              } ${
                isOverdue(milestone)
                  ? 'bg-red-50 border border-red-200'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onEdit?.(milestone)}
              onKeyDown={(e) => {
                if (onEdit && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onEdit(milestone);
                }
              }}
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
                    {t('milestoneList.target')} {formatDate(milestone.targetDate)}
                  </span>
                  {milestone.completedDate && (
                    <span>{t('milestoneList.completed')} {formatDate(milestone.completedDate)}</span>
                  )}
                  {(() => {
                    const variance = getForecastVarianceDays(milestone);
                    if (variance === null) return null;
                    return (
                      <span className={getForecastVarianceClassName(variance)}>
                        {getForecastVarianceLabel(variance)}
                      </span>
                    );
                  })()}
                  {isOverdue(milestone) && !milestone.completedDate && (
                    <span className="font-medium text-red-600">⚠ {t('common.overdue')}</span>
                  )}
                </div>
                {(() => {
                  const milestoneTasks = getMilestoneTasks(milestone);
                  if (milestoneTasks.length === 0) return null;
                  const completedTasks = milestoneTasks.filter(
                    (task) => task.status === 'completed'
                  ).length;
                  return (
                    <p className="text-xs text-gray-500 mt-1 ml-4">
                      {t('milestoneList.tasksProgress', {
                        completed: completedTasks,
                        total: milestoneTasks.length,
                      })}
                    </p>
                  );
                })()}
              </div>
              
              {/* Action buttons */}
              {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
              <div
                className="ml-3 flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {/* Complete button - only show if not completed and status isn't auto-derived from tasks */}
                {onComplete &&
                  milestone.status !== MilestoneStatus.COMPLETED &&
                  getMilestoneTasks(milestone).length === 0 && (
                    <button
                      onClick={() => onComplete(milestone)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                      title={t('common.complete')}
                    >
                      {t('common.complete')}
                    </button>
                  )}
                
                {/* Delete button */}
                {onDelete && (
                  <button
                    onClick={() => onDelete(milestone)}
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
        ))}
      </div>
    </div>
  );
};
