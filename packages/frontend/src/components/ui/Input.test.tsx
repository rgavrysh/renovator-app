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
});
