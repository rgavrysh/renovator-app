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

  describe('U1.5 — semantic status colours', () => {
    it.each(['success', 'warning', 'danger', 'info'] as const)(
      'defines a full 50-900 %s scale',
      (name) => {
        const scale = theme.extend.colors[name];
        expect(scale).toBeDefined();
        for (const shade of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) {
          expect(scale[shade]).toMatch(/^#[0-9a-f]{6}$/);
        }
      }
    );

    it('seeds success/warning/danger/info from the values already used in Badge/Alert', () => {
      const { success, warning, danger, info } = theme.extend.colors;
      // These are the exact Tailwind green/yellow/red/blue shades the app's
      // Badge and Alert components already rendered, so adopting the tokens
      // is a rename with no visual change.
      expect(success[100]).toBe('#dcfce7');
      expect(success[700]).toBe('#15803d');
      expect(warning[100]).toBe('#fef9c3');
      expect(warning[700]).toBe('#a16207');
      expect(danger[100]).toBe('#fee2e2');
      expect(danger[700]).toBe('#b91c1c');
      expect(info[100]).toBe('#dbeafe');
      expect(info[700]).toBe('#1d4ed8');
    });
  });

  describe('U1.5 / D8 — palette regeneration', () => {
    it('keeps primary-600 as the unchanged anchor', () => {
      expect(theme.extend.colors.primary[600]).toBe('#4c51e8');
    });

    it('gives the whole primary scale a single consistent hue', () => {
      const hexToHue = (hex: string): number => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;
        if (d === 0) return 0;
        let h: number;
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
        return h < 0 ? h + 360 : h;
      };

      const hues = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) =>
        hexToHue(theme.extend.colors.primary[shade])
      );

      // Allow a few degrees of slack for 8-bit hex rounding — the point of
      // this test is to catch the old ~16° drift (224° at 50 to 240° at 700),
      // not to demand sub-degree precision from quantised colour values.
      for (const hue of hues) {
        expect(Math.abs(hue - hues[0])).toBeLessThan(3);
      }
    });
  });
});
