import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Container } from './Container';

describe('Container', () => {
  it('defaults to the xl size', () => {
    render(<Container>content</Container>);
    expect(screen.getByText('content').className).toContain('max-w-7xl');
  });

  describe('U4.1 — reading width', () => {
    it('offers a prose size capped at 68 characters for long-form text', () => {
      render(<Container size="prose">A long description…</Container>);
      expect(screen.getByText('A long description…').className).toContain('max-w-[68ch]');
    });

    it('still centers the prose column by default', () => {
      render(<Container size="prose">content</Container>);
      expect(screen.getByText('content').className).toContain('mx-auto');
    });

    it('supports disabling padding for use inside existing cards', () => {
      render(
        <Container size="prose" padding={false}>
          content
        </Container>
      );
      const el = screen.getByText('content');
      expect(el.className).not.toContain('py-6');
      expect(el.className).not.toContain('px-4');
    });
  });
});
