import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Hidden">
        Content
      </Modal>
    );
    expect(screen.queryByText('Hidden')).toBeNull();
  });

  it('renders title and content when open', () => {
    render(
      <Modal isOpen onClose={() => {}} title="Visible">
        Content
      </Modal>
    );
    expect(screen.getByText('Visible')).toBeDefined();
    expect(screen.getByText('Content')).toBeDefined();
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal isOpen onClose={onClose} title="Visible">
        Content
      </Modal>
    );
    const backdrop = container.querySelector('.bg-black');
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('U1.6 — motion', () => {
    it('animates the backdrop with a fade-in', () => {
      const { container } = render(
        <Modal isOpen onClose={() => {}} title="Visible">
          Content
        </Modal>
      );
      expect(container.querySelector('.bg-black')?.className).toContain('animate-fade-in');
    });

    it('animates the panel with a pop-in', () => {
      render(
        <Modal isOpen onClose={() => {}} title="Visible">
          Content
        </Modal>
      );
      expect(screen.getByText('Visible').closest('div[class*="animate-pop-in"]')).not.toBeNull();
    });
  });

  describe('U1.3 — elevation', () => {
    it('keeps a shadow on the floating panel', () => {
      render(
        <Modal isOpen onClose={() => {}} title="Visible">
          Content
        </Modal>
      );
      expect(screen.getByText('Visible').closest('div[class*="shadow-lg"]')).not.toBeNull();
    });
  });
});
