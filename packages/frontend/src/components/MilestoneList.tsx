import React from 'react';
import { ListRow, ListRowGroup } from './ui/ListRow';
import { StatusIcon } from './ui/StatusIcon';
import { IconButton } from './ui/IconButton';
import { useTranslation } from 'react-i18next';
import { getMilestoneStatusIconKind } from '../utils/statusColors';
import { Check, Trash2, Flag } from 'lucide-react';
import { EmptyState } from './ui/EmptyState';

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

  const getMilestoneStatusIcon = (status: MilestoneStatus) => getMilestoneStatusIconKind(status);

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
    if (variance > 0) return 'font-medium text-danger-600';
    if (variance < 0) return 'font-medium text-success-600';
    return 'text-gray-500';
  };

  if (sortedMilestones.length === 0) {
    return (
      <EmptyState
        icon={<Flag className="w-12 h-12" strokeWidth={1.5} />}
        title={t('milestoneList.noMilestones')}
      />
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
            <span className="text-ui font-medium text-gray-700">{t('milestoneList.overallProgress')}</span>
            <span className="text-ui font-semibold text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-ui-xs text-gray-500">
            <span>
              {t('milestoneList.completedOf', { completed: completedCount, total: sortedMilestones.length })}
            </span>
          </div>
        </div>
      )}

      {/* Milestone List */}
      <ListRowGroup>
        {sortedMilestones.map((milestone) => {
          const milestoneTasks = getMilestoneTasks(milestone);
          const completedTaskCount = milestoneTasks.filter((task) => task.status === 'completed').length;
          const taskProgress =
            milestoneTasks.length > 0 ? Math.round((completedTaskCount / milestoneTasks.length) * 100) : undefined;
          const overdue = isOverdue(milestone);
          const variance = getForecastVarianceDays(milestone);

          return (
            <ListRow
              key={milestone.id}
              danger={overdue}
              onActivate={onEdit ? () => onEdit(milestone) : undefined}
              contentClassName="py-1"
              icon={
                <StatusIcon status={getMilestoneStatusIcon(milestone.status)} progress={taskProgress} className="mt-0.5" />
              }
              actions={
                <>
                  {onComplete && milestone.status !== MilestoneStatus.COMPLETED && milestoneTasks.length === 0 && (
                    <button
                      onClick={() => onComplete(milestone)}
                      className="px-3 py-1.5 text-ui-xs font-medium text-white bg-success-600 hover:bg-success-700 rounded transition-colors"
                      title={t('common.complete')}
                    >
                      <Check className="w-3.5 h-3.5 inline-block -ml-0.5 mr-1" strokeWidth={2} />
                      {t('common.complete')}
                    </button>
                  )}
                  {onDelete && (
                    <IconButton
                      label={t('common.delete')}
                      icon={<Trash2 className="w-4 h-4" strokeWidth={1.5} />}
                      variant="danger"
                      onClick={() => onDelete(milestone)}
                    />
                  )}
                </>
              }
            >
              <div className="flex items-center gap-2">
                <h4 className={`text-ui font-medium ${overdue ? 'text-danger-900' : 'text-gray-900'}`}>
                  {milestone.name}
                </h4>
                <span className={`text-ui-xs ${overdue ? 'text-danger-600 font-medium' : 'text-gray-500'}`}>
                  {getMilestoneStatusLabel(milestone.status)}
                </span>
              </div>
              {milestone.description && (
                <p className={`text-ui-sm mt-0.5 ${overdue ? 'text-danger-700' : 'text-gray-600'}`}>
                  {milestone.description}
                </p>
              )}
              <div className={`flex items-center gap-4 text-ui-xs mt-0.5 ${overdue ? 'text-danger-600' : 'text-gray-500'}`}>
                <span className={overdue ? 'font-medium' : ''}>
                  {t('milestoneList.target')} {formatDate(milestone.targetDate)}
                </span>
                {milestone.completedDate && (
                  <span>{t('milestoneList.completed')} {formatDate(milestone.completedDate)}</span>
                )}
                {variance !== null && (
                  <span className={getForecastVarianceClassName(variance)}>
                    {getForecastVarianceLabel(variance)}
                  </span>
                )}
                {overdue && !milestone.completedDate && (
                  <span className="font-medium text-danger-600">⚠ {t('common.overdue')}</span>
                )}
                {milestoneTasks.length > 0 && (
                  <span>
                    {t('milestoneList.tasksProgress', {
                      completed: completedTaskCount,
                      total: milestoneTasks.length,
                    })}
                  </span>
                )}
              </div>
            </ListRow>
          );
        })}
      </ListRowGroup>
    </div>
  );
};
