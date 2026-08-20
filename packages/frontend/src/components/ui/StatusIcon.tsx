import React from 'react';

/**
 * The five states of the Linear-style status lifecycle (U3.2): a task or
 * milestone is either not yet queued, queued but untouched, actively being
 * worked, finished, or abandoned. Domain enums (`TaskStatus`,
 * `MilestoneStatus`, `ProjectStatus`, ...) map onto this fixed set via the
 * `get*IconKind` helpers in `utils/statusColors.ts` — this component itself
 * knows nothing about any specific domain.
 */
export type StatusIconKind = 'not-started' | 'todo' | 'in-progress' | 'done' | 'cancelled';

export interface StatusIconProps {
  status: StatusIconKind;
  /**
   * 0–100. When provided, overrides the fixed half-fill of `in-progress`
   * with an arc proportional to actual completion — used for milestone
   * progress, where "in progress" can mean 10% or 90% done.
   */
  progress?: number;
  size?: number;
  className?: string;
}

const R = 6;
const CENTER = 7;
const CIRCUMFERENCE = 2 * Math.PI * R;

const arcDashArray = (percent: number): string => {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = (clamped / 100) * CIRCUMFERENCE;
  return `${filled} ${CIRCUMFERENCE - filled}`;
};

/**
 * A 14px glyph carrying state via shape and colour, in place of a coloured
 * pill (U3.2). Rendered inline with text, it reads at a glance without
 * competing for attention the way a saturated `Badge` does on a dense list.
 */
export const StatusIcon: React.FC<StatusIconProps> = ({
  status,
  progress,
  size = 14,
  className = '',
}) => {
  const hasProgress = typeof progress === 'number';
  const effectiveStatus = hasProgress && progress >= 100 ? 'done' : status;

  const colorClass = {
    'not-started': 'text-gray-400',
    todo: 'text-gray-400',
    'in-progress': 'text-info-500',
    done: 'text-success-500',
    cancelled: 'text-danger-500',
  }[effectiveStatus];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      className={`inline-block flex-shrink-0 ${colorClass} ${className}`}
      role="img"
      aria-label={effectiveStatus.replace('-', ' ')}
    >
      {effectiveStatus === 'not-started' && (
        <circle
          cx={CENTER}
          cy={CENTER}
          r={R}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="1.5 2.2"
        />
      )}

      {effectiveStatus === 'todo' && (
        <circle cx={CENTER} cy={CENTER} r={R} stroke="currentColor" strokeWidth={1.5} />
      )}

      {effectiveStatus === 'in-progress' && (
        <>
          <circle cx={CENTER} cy={CENTER} r={R} stroke="currentColor" strokeWidth={1.5} className="opacity-25" />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={R}
            stroke="currentColor"
            strokeWidth={1.5}
            strokeDasharray={arcDashArray(hasProgress ? progress! : 50)}
            strokeDashoffset={CIRCUMFERENCE / 4}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />
        </>
      )}

      {effectiveStatus === 'done' && (
        <>
          <circle cx={CENTER} cy={CENTER} r={R} fill="currentColor" />
          <path
            d="M4.6 7.1l1.7 1.7 3.1-3.4"
            stroke="white"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      )}

      {effectiveStatus === 'cancelled' && (
        <>
          <circle cx={CENTER} cy={CENTER} r={R} stroke="currentColor" strokeWidth={1.5} />
          <path d="M5 5l4 4M9 5l-4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
        </>
      )}
    </svg>
  );
};
