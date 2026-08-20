import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StatusIcon } from './StatusIcon';

describe('StatusIcon (U3.2)', () => {
  it('renders a 14px svg glyph by default', () => {
    const { container } = render(<StatusIcon status="todo" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe('14');
    expect(svg?.getAttribute('height')).toBe('14');
  });

  it('respects a custom size', () => {
    const { container } = render(<StatusIcon status="todo" size={20} />);
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('20');
  });

  it.each([
    ['not-started', 'text-gray-400'],
    ['todo', 'text-gray-400'],
    ['in-progress', 'text-info-500'],
    ['done', 'text-success-500'],
    ['cancelled', 'text-danger-500'],
  ] as const)('renders "%s" with its semantic colour class', (status, colorClass) => {
    const { container } = render(<StatusIcon status={status} />);
    expect(container.querySelector('svg')?.getAttribute('class')).toContain(colorClass);
  });

  it('renders a dashed circle for "not-started"', () => {
    const { container } = render(<StatusIcon status="not-started" />);
    const circle = container.querySelector('circle');
    expect(circle?.getAttribute('stroke-dasharray')).toBeTruthy();
  });

  it('renders an empty (undashed) circle for "todo"', () => {
    const { container } = render(<StatusIcon status="todo" />);
    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(1);
    expect(circles[0].getAttribute('stroke-dasharray')).toBeNull();
  });

  it('renders a filled check for "done"', () => {
    const { container } = render(<StatusIcon status="done" />);
    expect(container.querySelector('circle[fill="currentColor"]')).not.toBeNull();
    expect(container.querySelector('path')).not.toBeNull();
  });

  it('renders a crossed circle for "cancelled"', () => {
    const { container } = render(<StatusIcon status="cancelled" />);
    expect(container.querySelector('circle')).not.toBeNull();
    expect(container.querySelector('path')).not.toBeNull();
  });

  it('renders a half arc for "in-progress" with no progress supplied', () => {
    const { container } = render(<StatusIcon status="in-progress" />);
    const arc = container.querySelectorAll('circle')[1];
    const [filled, remainder] = arc.getAttribute('stroke-dasharray')!.split(' ').map(Number);
    expect(filled / (filled + remainder)).toBeCloseTo(0.5, 1);
  });

  it('renders an arc proportional to an explicit progress value', () => {
    const { container } = render(<StatusIcon status="in-progress" progress={25} />);
    const arc = container.querySelectorAll('circle')[1];
    const [filled, remainder] = arc.getAttribute('stroke-dasharray')!.split(' ').map(Number);
    expect(filled / (filled + remainder)).toBeCloseTo(0.25, 1);
  });

  it('renders as "done" once progress reaches 100, regardless of the status prop', () => {
    const { container } = render(<StatusIcon status="in-progress" progress={100} />);
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('done');
    expect(container.querySelector('circle[fill="currentColor"]')).not.toBeNull();
  });
});
