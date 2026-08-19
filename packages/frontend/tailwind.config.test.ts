import { describe, it, expect } from 'vitest';
import tailwindConfig from './tailwind.config.js';

describe('tailwind.config.js — UI upgrade Batch A tokens', () => {
  const { theme } = tailwindConfig;

  describe('U1.1 — two type scales', () => {
    it('defines the UI scale', () => {
      expect(theme.extend.fontSize['ui-xs']).toEqual(['11px', { lineHeight: '16px', letterSpacing: '0' }]);
      expect(theme.extend.fontSize['ui-sm']).toEqual(['12px', { lineHeight: '16px' }]);
      expect(theme.extend.fontSize['ui']).toEqual(['13px', { lineHeight: '20px' }]);
      expect(theme.extend.fontSize['ui-lg']).toEqual(['15px', { lineHeight: '22px' }]);
    });

    it('defines the reading scale', () => {
      expect(theme.extend.fontSize['body']).toEqual(['15px', { lineHeight: '24px' }]);
      expect(theme.extend.fontSize['body-lg']).toEqual(['16px', { lineHeight: '26px' }]);
    });

    it('defines the tight-tracking heading scale', () => {
      expect(theme.extend.fontSize['title-sm']).toMatchObject({ 0: '15px' });
      expect(theme.extend.fontSize['title']).toMatchObject({ 0: '18px' });
      expect(theme.extend.fontSize['title-lg']).toMatchObject({ 0: '22px' });
      expect(theme.extend.fontSize['title'][1].letterSpacing).toBe('-0.015em');
    });
  });

  describe('U1.3 — shadow tokens', () => {
    it('keeps a shadow reserved for floating layers only', () => {
      expect(theme.extend.boxShadow.popover).toBeDefined();
      expect(theme.extend.boxShadow.lg).toBeDefined();
    });
  });

  describe('U1.4 — surface and border tokens', () => {
    it('defines canvas/surface/subtle surfaces', () => {
      expect(theme.extend.colors.canvas).toBe('#fbfbfb');
      expect(theme.extend.colors.surface).toBe('#ffffff');
      expect(theme.extend.colors.subtle).toBe('#f7f7f8');
    });

    it('defines a lightened border scale', () => {
      expect(theme.extend.colors.border.subtle).toBe('#eeeef0');
      expect(theme.extend.colors.border.DEFAULT).toBe('#e5e5e7');
      expect(theme.extend.colors.border.strong).toBe('#d4d4d8');
    });
  });

  describe('U1.6 — motion', () => {
    it('sets a 120ms default transition duration', () => {
      expect(theme.extend.transitionDuration.DEFAULT).toBe('120ms');
    });

    it('defines fade-in and pop-in keyframes and animations', () => {
      expect(theme.extend.keyframes['fade-in']).toBeDefined();
      expect(theme.extend.keyframes['pop-in']).toBeDefined();
      expect(theme.extend.animation['fade-in']).toBe('fade-in 120ms ease-out');
      expect(theme.extend.animation['pop-in']).toBe('pop-in 120ms cubic-bezier(0.16, 1, 0.3, 1)');
    });
  });

  describe('U1.7 — typography install', () => {
    it('puts InterVariable first in the sans stack', () => {
      expect(theme.extend.fontFamily.sans[0]).toBe('InterVariable');
    });
  });
});
