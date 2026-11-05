import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MilestoneFilter,
  MilestoneFilterChip,
  matchesMilestoneFilter,
  isValidMilestoneFilter,
  MILESTONE_FILTER_ALL,
  MILESTONE_FILTER_NONE,
} from './MilestoneFilter';

const milestones = [
  { id: 'm-1', name: 'Demolition' },
  { id: 'm-2', name: 'Installation' },
];

describe('matchesMilestoneFilter', () => {
  it('matches everything for "all", only unassigned for "none", and exact ids otherwise', () => {
    expect(matchesMilestoneFilter('m-1', MILESTONE_FILTER_ALL)).toBe(true);
    expect(matchesMilestoneFilter(undefined, MILESTONE_FILTER_ALL)).toBe(true);
    expect(matchesMilestoneFilter(undefined, MILESTONE_FILTER_NONE)).toBe(true);
    expect(matchesMilestoneFilter(null, MILESTONE_FILTER_NONE)).toBe(true);
    expect(matchesMilestoneFilter('m-1', MILESTONE_FILTER_NONE)).toBe(false);
    expect(matchesMilestoneFilter('m-1', 'm-1')).toBe(true);
    expect(matchesMilestoneFilter('m-2', 'm-1')).toBe(false);
    expect(matchesMilestoneFilter(undefined, 'm-1')).toBe(false);
  });

  it('treats a filter for an unknown milestone as invalid', () => {
    expect(isValidMilestoneFilter(MILESTONE_FILTER_ALL, [])).toBe(true);
    expect(isValidMilestoneFilter(MILESTONE_FILTER_NONE, [])).toBe(true);
    expect(isValidMilestoneFilter('m-1', milestones)).toBe(true);
    expect(isValidMilestoneFilter('deleted', milestones)).toBe(false);
  });
});

describe('MilestoneFilter', () => {
  it('opens a menu with all, none and every milestone, marking the current value', async () => {
    const user = userEvent.setup();
    render(<MilestoneFilter milestones={milestones} value="m-2" onChange={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: 'Filter by milestone' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const options = screen.getAllByRole('menuitemradio');
    expect(options.map((o) => o.textContent)).toEqual([
      'All milestones',
      'No milestone',
      'Demolition',
      'Installation',
    ]);
    expect(screen.getByRole('menuitemradio', { name: 'Installation' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemradio', { name: 'Installation' })).toHaveFocus();
  });

  it('calls onChange and closes when an option is picked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MilestoneFilter milestones={milestones} value={MILESTONE_FILTER_ALL} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Filter by milestone' }));
    await user.click(screen.getByRole('menuitemradio', { name: 'No milestone' }));

    expect(onChange).toHaveBeenCalledWith(MILESTONE_FILTER_NONE);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('supports keyboard navigation and Escape', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MilestoneFilter milestones={milestones} value={MILESTONE_FILTER_ALL} onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: 'Filter by milestone' });
    await user.click(trigger);
    expect(screen.getByRole('menuitemradio', { name: 'All milestones' })).toHaveFocus();

    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('menuitemradio', { name: 'Demolition' })).toHaveFocus();

    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(screen.getByRole('menuitemradio', { name: 'Installation' })).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('m-2');

    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <p>outside</p>
        <MilestoneFilter milestones={milestones} value={MILESTONE_FILTER_ALL} onChange={vi.fn()} />
      </div>
    );

    await user.click(screen.getByRole('button', { name: 'Filter by milestone' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.click(screen.getByText('outside'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

describe('MilestoneFilterChip', () => {
  it('renders nothing when unfiltered', () => {
    const { container } = render(
      <MilestoneFilterChip milestones={milestones} value={MILESTONE_FILTER_ALL} onClear={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the active milestone and clears on click', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<MilestoneFilterChip milestones={milestones} value="m-1" onClear={onClear} />);

    expect(screen.getByText('Demolition')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filter' }));
    expect(onClear).toHaveBeenCalled();
  });

  it('labels the "none" filter', () => {
    render(<MilestoneFilterChip milestones={milestones} value={MILESTONE_FILTER_NONE} onClear={vi.fn()} />);
    expect(screen.getByText('No milestone')).toBeInTheDocument();
  });
});
