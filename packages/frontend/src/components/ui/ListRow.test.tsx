import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { ListRow, ListRowGroup } from './ListRow';

describe('ListRow', () => {
  it('renders children, icon and meta content', () => {
    render(
      <ListRow icon={<span data-testid="icon">●</span>} meta={<span>2 days ago</span>}>
        <span>Row title</span>
      </ListRow>
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Row title')).toBeInTheDocument();
    expect(screen.getByText('2 days ago')).toBeInTheDocument();
  });

  it('is not a button and has no click handler when onActivate is not provided', () => {
    render(<ListRow>Static row</ListRow>);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders as a keyboard-activatable button when onActivate is provided', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    render(<ListRow onActivate={onActivate}>Clickable row</ListRow>);

    const row = screen.getByRole('button');
    expect(row).toHaveClass('cursor-pointer');

    await user.click(row);
    expect(onActivate).toHaveBeenCalledTimes(1);

    row.focus();
    await user.keyboard('{Enter}');
    expect(onActivate).toHaveBeenCalledTimes(2);

    await user.keyboard(' ');
    expect(onActivate).toHaveBeenCalledTimes(3);
  });

  it('keeps actions out of the activation path', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    const onAction = vi.fn();

    render(
      <ListRow
        onActivate={onActivate}
        actions={
          <button type="button" onClick={onAction}>
            Delete
          </button>
        }
      >
        Row with actions
      </ListRow>
    );

    await user.click(screen.getByText('Delete'));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('hides actions until hover/focus via opacity classes', () => {
    render(
      <ListRow actions={<button type="button">Edit</button>}>Row</ListRow>
    );

    const actionsWrapper = screen.getByText('Edit').parentElement;
    expect(actionsWrapper).toHaveClass('opacity-0');
    expect(actionsWrapper).toHaveClass('group-hover:opacity-100');
  });

  it('applies a quiet danger tone instead of a boxed background', () => {
    render(<ListRow danger>Overdue row</ListRow>);

    const content = screen.getByText('Overdue row');
    expect(content).toHaveClass('text-danger-700');
  });

  it('never applies a background/border box for danger rows', () => {
    const { container } = render(<ListRow danger>Overdue row</ListRow>);

    expect(container.querySelector('.bg-red-50')).not.toBeInTheDocument();
    expect(container.querySelector('.border-red-200')).not.toBeInTheDocument();
  });
});

describe('ListRowGroup', () => {
  it('renders children with a divider between rows', () => {
    const { container } = render(
      <ListRowGroup>
        <ListRow>Row 1</ListRow>
        <ListRow>Row 2</ListRow>
      </ListRowGroup>
    );

    expect(container.firstChild).toHaveClass('divide-y');
    expect(screen.getByText('Row 1')).toBeInTheDocument();
    expect(screen.getByText('Row 2')).toBeInTheDocument();
  });
});
