import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeDefined();
  });

  it('applies padding styles', () => {
    const { container } = render(<Card padding="lg">Content</Card>);
    const card = container.querySelector('div');
    expect(card?.className).toContain('p-6');
  });

  it('applies hover effect when hover prop is true', () => {
    const { container } = render(<Card hover>Content</Card>);
    const card = container.querySelector('div');
    expect(card?.className).toContain('hover:shadow-md');
  });
});

describe('CardHeader', () => {
  it('renders title and subtitle', () => {
    render(<CardHeader title="Card Title" subtitle="Card subtitle" />);
    expect(screen.getByText('Card Title')).toBeDefined();
    expect(screen.getByText('Card subtitle')).toBeDefined();
  });

  it('renders action element', () => {
    render(<CardHeader title="Title" action={<button>Action</button>} />);
    expect(screen.getByText('Action')).toBeDefined();
  });
});

describe('CardContent', () => {
  it('renders children', () => {
    render(<CardContent>Content here</CardContent>);
    expect(screen.getByText('Content here')).toBeDefined();
  });
});
