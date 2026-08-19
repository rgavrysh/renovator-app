import { describe, it, expect } from 'vitest';
import {
  getTaskStatusVariant,
  getTaskStatusDotColor,
  getTaskPriorityVariant,
  getProjectStatusVariant,
  getMilestoneStatusVariant,
  getMilestoneStatusDotColor,
  getResourceStatusVariant,
  getBudgetCategoryVariant,
} from './statusColors';

describe('statusColors — U1.5 consolidated status maps', () => {
  describe('task status', () => {
    it('maps every known status to a badge variant', () => {
      expect(getTaskStatusVariant('todo')).toBe('default');
      expect(getTaskStatusVariant('in_progress')).toBe('info');
      expect(getTaskStatusVariant('completed')).toBe('success');
      expect(getTaskStatusVariant('blocked')).toBe('danger');
    });

    it('falls back to default for an unknown status', () => {
      expect(getTaskStatusVariant('nonexistent')).toBe('default');
    });

    it('maps every known status to a dot colour token', () => {
      expect(getTaskStatusDotColor('todo')).toBe('bg-gray-400');
      expect(getTaskStatusDotColor('in_progress')).toBe('bg-info-500');
      expect(getTaskStatusDotColor('completed')).toBe('bg-success-500');
      expect(getTaskStatusDotColor('blocked')).toBe('bg-danger-500');
    });

    it('falls back to the neutral dot colour for an unknown status', () => {
      expect(getTaskStatusDotColor('nonexistent')).toBe('bg-gray-400');
    });
  });

  describe('task priority', () => {
    it('maps every known priority to a badge variant', () => {
      expect(getTaskPriorityVariant('low')).toBe('default');
      expect(getTaskPriorityVariant('medium')).toBe('info');
      expect(getTaskPriorityVariant('high')).toBe('warning');
      expect(getTaskPriorityVariant('urgent')).toBe('danger');
    });

    it('falls back to default for an unknown priority', () => {
      expect(getTaskPriorityVariant('nonexistent')).toBe('default');
    });
  });

  describe('project status', () => {
    it('maps every known status to a badge variant', () => {
      expect(getProjectStatusVariant('planning')).toBe('info');
      expect(getProjectStatusVariant('active')).toBe('success');
      expect(getProjectStatusVariant('on_hold')).toBe('warning');
      expect(getProjectStatusVariant('completed')).toBe('default');
      expect(getProjectStatusVariant('archived')).toBe('default');
    });

    it('falls back to default for an unknown status', () => {
      expect(getProjectStatusVariant('nonexistent')).toBe('default');
    });
  });

  describe('milestone status', () => {
    it('maps every known status to a badge variant', () => {
      expect(getMilestoneStatusVariant('not_started')).toBe('default');
      expect(getMilestoneStatusVariant('in_progress')).toBe('info');
      expect(getMilestoneStatusVariant('completed')).toBe('success');
      expect(getMilestoneStatusVariant('overdue')).toBe('danger');
    });

    it('falls back to default for an unknown status', () => {
      expect(getMilestoneStatusVariant('nonexistent')).toBe('default');
    });

    it('maps every known status to a dot colour token', () => {
      expect(getMilestoneStatusDotColor('not_started')).toBe('bg-gray-300');
      expect(getMilestoneStatusDotColor('in_progress')).toBe('bg-info-500');
      expect(getMilestoneStatusDotColor('completed')).toBe('bg-success-500');
      expect(getMilestoneStatusDotColor('overdue')).toBe('bg-danger-500');
    });

    it('falls back to the neutral dot colour for an unknown status', () => {
      expect(getMilestoneStatusDotColor('nonexistent')).toBe('bg-gray-300');
    });
  });

  describe('resource status', () => {
    it('maps every known status to a badge variant', () => {
      expect(getResourceStatusVariant('needed')).toBe('warning');
      expect(getResourceStatusVariant('ordered')).toBe('primary');
      expect(getResourceStatusVariant('received')).toBe('success');
      expect(getResourceStatusVariant('cancelled')).toBe('default');
    });

    it('falls back to default for an unknown status', () => {
      expect(getResourceStatusVariant('nonexistent')).toBe('default');
    });
  });

  describe('budget category', () => {
    it('maps every known category to a badge variant', () => {
      expect(getBudgetCategoryVariant('labor')).toBe('info');
      expect(getBudgetCategoryVariant('materials')).toBe('success');
      expect(getBudgetCategoryVariant('equipment')).toBe('purple');
      expect(getBudgetCategoryVariant('subcontractors')).toBe('orange');
      expect(getBudgetCategoryVariant('permits')).toBe('warning');
      expect(getBudgetCategoryVariant('contingency')).toBe('default');
      expect(getBudgetCategoryVariant('other')).toBe('default');
    });

    it('falls back to default for an unknown category', () => {
      expect(getBudgetCategoryVariant('nonexistent')).toBe('default');
    });
  });
});
