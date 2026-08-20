import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IconButton } from './IconButton';

const Dot = () => <span data-testid="dot" />;

describe('IconButton (U3.3)', () => {
  it('exposes the required label as its accessible name', () => {
    render(<IconButton label="Delete" icon={<Dot />} />);
    expect(screen.getByRole('button', { name: 'Delete' })).not.toBeNull();
  });

  it('also surfaces the label as a title tooltip', () => {
    render(<IconButton label="Delete" icon={<Dot />} />);
    expect(screen.getByRole('button').getAttribute('title')).toBe('Delete');
  });

  it('renders the given icon', () => {
    render(<IconButton label="Delete" icon={<Dot />} />);
    expect(screen.getByTestId('dot')).not.toBeNull();
  });

  it('handles click events', () => {
    const onClick = vi.fn();
    render(<IconButton label="Delete" icon={<Dot />} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('defaults to a 28px (md) square', () => {
    render(<IconButton label="Delete" icon={<Dot />} />);
    expect(screen.getByRole('button').className).toContain('h-7');
    expect(screen.getByRole('button').className).toContain('w-7');
  });

  it('is 24px for the sm size', () => {
    render(<IconButton label="Delete" icon={<Dot />} size="sm" />);
    expect(screen.getByRole('button').className).toContain('h-6');
    expect(screen.getByRole('button').className).toContain('w-6');
  });

  it('applies the danger variant hover colour', () => {
    render(<IconButton label="Delete" icon={<Dot />} variant="danger" />);
    expect(screen.getByRole('button').className).toContain('hover:text-danger-600');
  });

  it('is disabled when disabled prop is true', () => {
    render(<IconButton label="Delete" icon={<Dot />} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('never carries a shadow (U1.3 — flat surfaces get no elevation)', () => {
    render(<IconButton label="Delete" icon={<Dot />} />);
    expect(screen.getByRole('button').className).not.toContain('shadow');
  });
});
