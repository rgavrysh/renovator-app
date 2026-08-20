/**
 * U1.5 — the single source of truth for status → colour.
 *
 * Before this file, `TaskStatus`, `TaskPriority`, `ProjectStatus`,
 * `MilestoneStatus`, `ResourceStatus` and `BudgetCategory` each had their own
 * local switch/map from `pages/ProjectDetail.tsx`, `pages/Dashboard.tsx`,
 * `components/TaskList.tsx`, `components/TaskDetail.tsx`,
 * `components/MilestoneList.tsx`, `components/ResourceList.tsx` and
 * `components/BudgetItemsList.tsx` — eight maps in total, all encoding the
 * same handful of decisions independently.
 *
 * The enums themselves stay local to their owning components (they aren't
 * shared types in this codebase), so every map here is keyed by the plain
 * string value rather than an imported enum, which keeps this file
 * dependency-free in both directions.
 */
import type { BadgeProps } from '../components/ui/Badge';
import type { StatusIconKind } from '../components/ui/StatusIcon';

export type StatusVariant = NonNullable<BadgeProps['variant']>;

const lookup = <T extends string>(
  map: Record<T, StatusVariant>,
  status: string,
  fallback: StatusVariant = 'default'
): StatusVariant => (map as Record<string, StatusVariant>)[status] ?? fallback;

const lookupIconKind = (
  map: Record<string, StatusIconKind>,
  status: string,
  fallback: StatusIconKind = 'todo'
): StatusIconKind => map[status] ?? fallback;

// --- Task status ------------------------------------------------------

export const TASK_STATUS_VARIANTS = {
  todo: 'default',
  in_progress: 'info',
  completed: 'success',
  blocked: 'danger',
} as const satisfies Record<string, StatusVariant>;

export const getTaskStatusVariant = (status: string): StatusVariant =>
  lookup(TASK_STATUS_VARIANTS, status);

/** Solid-fill colour for the status dot in `TaskList`, e.g. `bg-success-500`. */
export const TASK_STATUS_DOT_COLOR: Record<string, string> = {
  todo: 'bg-gray-400',
  in_progress: 'bg-info-500',
  completed: 'bg-success-500',
  blocked: 'bg-danger-500',
};

export const getTaskStatusDotColor = (status: string): string =>
  TASK_STATUS_DOT_COLOR[status] ?? 'bg-gray-400';

/** `StatusIcon` glyph for a task (U3.2) — replaces the plain colour dot. */
export const TASK_STATUS_ICON_KIND: Record<string, StatusIconKind> = {
  todo: 'todo',
  in_progress: 'in-progress',
  completed: 'done',
  blocked: 'cancelled',
};

export const getTaskStatusIconKind = (status: string): StatusIconKind =>
  lookupIconKind(TASK_STATUS_ICON_KIND, status);

// --- Task priority ------------------------------------------------------

export const TASK_PRIORITY_VARIANTS = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
} as const satisfies Record<string, StatusVariant>;

export const getTaskPriorityVariant = (priority: string): StatusVariant =>
  lookup(TASK_PRIORITY_VARIANTS, priority);

// --- Project status ------------------------------------------------------

export const PROJECT_STATUS_VARIANTS = {
  planning: 'info',
  active: 'success',
  on_hold: 'warning',
  completed: 'default',
  archived: 'default',
} as const satisfies Record<string, StatusVariant>;

export const getProjectStatusVariant = (status: string): StatusVariant =>
  lookup(PROJECT_STATUS_VARIANTS, status);

/** `StatusIcon` glyph for a project (U3.2). */
export const PROJECT_STATUS_ICON_KIND: Record<string, StatusIconKind> = {
  planning: 'not-started',
  active: 'in-progress',
  on_hold: 'cancelled',
  completed: 'done',
  archived: 'done',
};

export const getProjectStatusIconKind = (status: string): StatusIconKind =>
  lookupIconKind(PROJECT_STATUS_ICON_KIND, status);

// --- Milestone status ------------------------------------------------------

export const MILESTONE_STATUS_VARIANTS = {
  not_started: 'default',
  in_progress: 'info',
  completed: 'success',
  overdue: 'danger',
} as const satisfies Record<string, StatusVariant>;

export const getMilestoneStatusVariant = (status: string): StatusVariant =>
  lookup(MILESTONE_STATUS_VARIANTS, status);

/** Solid-fill colour for the milestone indicator dot in `MilestoneList`. */
export const MILESTONE_STATUS_DOT_COLOR: Record<string, string> = {
  not_started: 'bg-gray-300',
  in_progress: 'bg-info-500',
  completed: 'bg-success-500',
  overdue: 'bg-danger-500',
};

export const getMilestoneStatusDotColor = (status: string): string =>
  MILESTONE_STATUS_DOT_COLOR[status] ?? 'bg-gray-300';

/**
 * `StatusIcon` glyph for a milestone (U3.2). `overdue` reuses `cancelled`'s
 * crossed-circle shape (in the danger colour) since a milestone that has
 * missed its date, rather than been abandoned, has no dedicated glyph in
 * the fixed five-state set — callers with a completion percentage should
 * prefer passing `progress` to `StatusIcon` instead, which overrides this.
 */
export const MILESTONE_STATUS_ICON_KIND: Record<string, StatusIconKind> = {
  not_started: 'not-started',
  in_progress: 'in-progress',
  completed: 'done',
  overdue: 'cancelled',
};

export const getMilestoneStatusIconKind = (status: string): StatusIconKind =>
  lookupIconKind(MILESTONE_STATUS_ICON_KIND, status);

// --- Resource status ------------------------------------------------------

export const RESOURCE_STATUS_VARIANTS = {
  needed: 'warning',
  ordered: 'primary',
  received: 'success',
  cancelled: 'default',
} as const satisfies Record<string, StatusVariant>;

export const getResourceStatusVariant = (status: string): StatusVariant =>
  lookup(RESOURCE_STATUS_VARIANTS, status);

// --- Budget category ------------------------------------------------------

export const BUDGET_CATEGORY_VARIANTS = {
  labor: 'info',
  materials: 'success',
  equipment: 'purple',
  subcontractors: 'orange',
  permits: 'warning',
  contingency: 'default',
  other: 'default',
} as const satisfies Record<string, StatusVariant>;

export const getBudgetCategoryVariant = (category: string): StatusVariant =>
  lookup(BUDGET_CATEGORY_VARIANTS, category);
