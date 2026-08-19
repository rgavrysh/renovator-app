import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeDefined();
  });

  it('displays error message', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeDefined();
  });

  it('displays helper text', () => {
    render(<Input label="Email" helperText="Enter your email address" />);
    expect(screen.getByText('Enter your email address')).toBeDefined();
  });

  it('applies fullWidth style', () => {
    const { container } = render(<Input fullWidth />);
    const wrapper = container.querySelector('div');
    expect(wrapper?.className).toContain('w-full');
  });

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeDefined();
  });

  describe('U1.2 — fixed control heights', () => {
    it('defaults to the 32px (md) height', () => {
      render(<Input placeholder="Default size" />);
      expect(screen.getByPlaceholderText('Default size').className).toContain('h-8');
    });

    it('is 28px for sm and 36px for lg, matching Button', () => {
      render(<Input placeholder="Small" size="sm" />);
      render(<Input placeholder="Large" size="lg" />);
      expect(screen.getByPlaceholderText('Small').className).toContain('h-7');
      expect(screen.getByPlaceholderText('Large').className).toContain('h-9');
    });
  });

  describe('U1.4 — border tokens', () => {
    it('uses the lightened border token instead of gray-300', () => {
      render(<Input placeholder="Bordered" />);
      const input = screen.getByPlaceholderText('Bordered');
      expect(input.className).toContain('border-border');
      expect(input.className).not.toContain('border-gray-300');
    });
  });
});
