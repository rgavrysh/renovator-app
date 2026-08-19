/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bbfc',
          400: '#8098f9',
          500: '#5b6ef2',
          600: '#4c51e8',
          700: '#3f3fd4',
          800: '#3536ab',
          900: '#313487',
        },
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Surface tokens (U1.4) — indirection over raw grays so a future
        // dark mode is a token swap, not an audit of every hardcoded class.
        canvas: '#fbfbfb',
        surface: '#ffffff',
        subtle: '#f7f7f8',
        border: {
          subtle: '#eeeef0',
          DEFAULT: '#e5e5e7',
          strong: '#d4d4d8',
        },
      },
      fontFamily: {
        sans: ['InterVariable', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        // UI scale — controls, nav, table cells, metadata
        'ui-xs': ['11px', { lineHeight: '16px', letterSpacing: '0' }],
        'ui-sm': ['12px', { lineHeight: '16px' }],
        'ui': ['13px', { lineHeight: '20px' }],
        'ui-lg': ['15px', { lineHeight: '22px' }],
        // Reading scale — descriptions, notes, prose
        'body': ['15px', { lineHeight: '24px' }],
        'body-lg': ['16px', { lineHeight: '26px' }],
        // Headings — tight tracking is most of the "Linear" signature
        'title-sm': ['15px', { lineHeight: '20px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'title': ['18px', { lineHeight: '24px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'title-lg': ['22px', { lineHeight: '28px', letterSpacing: '-0.02em', fontWeight: '600' }],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'linear': '0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        // Reserved for floating layers only (popover, dropdown, toast) — U1.3.
        'popover': '0 4px 12px -2px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        DEFAULT: '6px',
        'linear': '6px',
      },
      ringColor: (theme) => ({
        DEFAULT: theme('colors.primary.500'),
      }),
      transitionDuration: {
        DEFAULT: '120ms',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.97) translateY(-2px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 120ms ease-out',
        'pop-in': 'pop-in 120ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
