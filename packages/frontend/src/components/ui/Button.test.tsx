import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDefined();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles', () => {
    const { container } = render(<Button variant="primary">Primary</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-primary-600');
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.querySelector('svg')).toBeDefined();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('applies fullWidth style', () => {
    const { container } = render(<Button fullWidth>Full Width</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('w-full');
  });

  describe('U1.2 — fixed control heights', () => {
    it('defaults to the 32px (md) height', () => {
      const { container } = render(<Button>Default</Button>);
      expect(container.querySelector('button')?.className).toContain('h-8');
    });

    it('is 28px for sm and 36px for lg', () => {
      const { container: small } = render(<Button size="sm">Small</Button>);
      const { container: large } = render(<Button size="lg">Large</Button>);
      expect(small.querySelector('button')?.className).toContain('h-7');
      expect(large.querySelector('button')?.className).toContain('h-9');
    });
  });

  describe('U1.3 — no shadows on buttons', () => {
    it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
      'variant "%s" carries no shadow utility',
      (variant) => {
        const { container } = render(<Button variant={variant}>Button</Button>);
        expect(container.querySelector('button')?.className).not.toContain('shadow');
      }
    );
  });

  describe('U1.6 — motion', () => {
    it('presses with a fast active-state transform', () => {
      const { container } = render(<Button>Press me</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('active:scale-[0.98]');
      expect(button?.className).toContain('duration-150');
    });
  });
});
