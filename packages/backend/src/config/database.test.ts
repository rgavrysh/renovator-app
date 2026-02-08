import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AppDataSource, initializeDatabase, closeDatabase } from './database';

describe('Database Connection', () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('should establish database connection', () => {
    expect(AppDataSource.isInitialized).toBe(true);
  });

  it('should have correct database configuration', () => {
    expect(AppDataSource.options.type).toBe('postgres');
    expect(AppDataSource.options.database).toBeDefined();
  });

  it('should be able to execute a simple query', async () => {
    const result = await AppDataSource.query('SELECT 1 as value');
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(1);
  });
});
