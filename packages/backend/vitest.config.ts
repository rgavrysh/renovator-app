import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/migrations/[0-9]*-*.ts', // Exclude migration files
    ],
    env: {
      VITEST: 'true',
    },
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
});
