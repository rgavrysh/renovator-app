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
    // Run integration tests sequentially to avoid database conflicts
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    // Increase timeout for integration tests
    testTimeout: 10000,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
});
