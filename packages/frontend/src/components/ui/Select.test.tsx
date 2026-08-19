import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Select } from './Select';

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
];

describe('Select', () => {
  it('renders with label and options', () => {
    render(<Select label="Choose" options={options} />);
    expect(screen.getByText('Choose')).toBeDefined();
    expect(screen.getByText('Option A')).toBeDefined();
    expect(screen.getByText('Option B')).toBeDefined();
  });

  it('displays error message', () => {
    render(<Select label="Choose" options={options} error="Required" />);
    expect(screen.getByText('Required')).toBeDefined();
  });

  it('applies fullWidth style', () => {
    const { container } = render(<Select options={options} fullWidth />);
    const wrapper = container.querySelector('div');
    expect(wrapper?.className).toContain('w-full');
  });

  describe('U1.2 — fixed control heights', () => {
    it('defaults to the 32px (md) height', () => {
      const { container } = render(<Select options={options} />);
      expect(container.querySelector('select')?.className).toContain('h-8');
    });

    it('is 28px for sm and 36px for lg, matching Button/Input', () => {
      const { container: small } = render(<Select options={options} size="sm" />);
      const { container: large } = render(<Select options={options} size="lg" />);
      expect(small.querySelector('select')?.className).toContain('h-7');
      expect(large.querySelector('select')?.className).toContain('h-9');
    });
  });

  describe('U1.4 — border tokens', () => {
    it('uses the lightened border token instead of gray-300', () => {
      const { container } = render(<Select options={options} />);
      const select = container.querySelector('select');
      expect(select?.className).toContain('border-border');
      expect(select?.className).not.toContain('border-gray-300');
    });
  });
});
