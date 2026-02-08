import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DataSource } from 'typeorm';
import config from './index';
import { User } from '../entities/User';
import { Project } from '../entities/Project';
import { Task } from '../entities/Task';
import {
  Session,
  Milestone,
  WorkItemTemplate,
  Budget,
  BudgetItem,
  Document,
  Resource,
  Supplier,
} from '../entities';

describe('Database Migrations', () => {
  let testDataSource: DataSource;

  beforeAll(async () => {
    // Create a test data source without migrations
    testDataSource = new DataSource({
      type: 'postgres',
      host: config.database.host,
      port: config.database.port,
      username: config.database.user,
      password: config.database.password,
      database: config.database.name,
      synchronize: false,
      logging: false,
      entities: [
        User,
        Session,
        Project,
        Milestone,
        Task,
        WorkItemTemplate,
        Budget,
        BudgetItem,
        Document,
        Resource,
        Supplier,
      ],
    });

    await testDataSource.initialize();
  });

  afterAll(async () => {
    if (testDataSource.isInitialized) {
      await testDataSource.destroy();
    }
  });

  it('should have all required tables created', async () => {
    const queryRunner = testDataSource.createQueryRunner();
    
    try {
      // Check if key tables exist
      const tables = await queryRunner.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      const tableNames = tables.map((t: any) => t.table_name);

      expect(tableNames).toContain('users');
      expect(tableNames).toContain('projects');
      expect(tableNames).toContain('tasks');
      expect(tableNames).toContain('milestones');
      expect(tableNames).toContain('budgets');
      expect(tableNames).toContain('budget_items');
      expect(tableNames).toContain('documents');
      expect(tableNames).toContain('resources');
      expect(tableNames).toContain('suppliers');
      expect(tableNames).toContain('sessions');
      expect(tableNames).toContain('work_item_templates');
    } finally {
      await queryRunner.release();
    }
  });

  it('should have proper foreign key relationships', async () => {
    const queryRunner = testDataSource.createQueryRunner();
    
    try {
      const foreignKeys = await queryRunner.query(`
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name
      `);

      // Verify some key relationships exist
      const relationships = foreignKeys.map((fk: any) => ({
        table: fk.table_name,
        column: fk.column_name,
        foreignTable: fk.foreign_table_name,
      }));

      // Check projects -> users relationship
      expect(relationships).toContainEqual(
        expect.objectContaining({
          table: 'projects',
          column: 'owner_id',
          foreignTable: 'users',
        })
      );

      // Check tasks -> projects relationship
      expect(relationships).toContainEqual(
        expect.objectContaining({
          table: 'tasks',
          column: 'project_id',
          foreignTable: 'projects',
        })
      );

      // Check sessions -> users relationship
      expect(relationships).toContainEqual(
        expect.objectContaining({
          table: 'sessions',
          column: 'user_id',
          foreignTable: 'users',
        })
      );
    } finally {
      await queryRunner.release();
    }
  });

  it('should be able to query entities through TypeORM', async () => {
    const userRepository = testDataSource.getRepository(User);
    const projectRepository = testDataSource.getRepository(Project);
    const taskRepository = testDataSource.getRepository(Task);

    // These should not throw errors
    const users = await userRepository.find();
    const projects = await projectRepository.find();
    const tasks = await taskRepository.find();

    // If seed data was run, we should have data
    // Otherwise, these will just be empty arrays
    expect(Array.isArray(users)).toBe(true);
    expect(Array.isArray(projects)).toBe(true);
    expect(Array.isArray(tasks)).toBe(true);
  });
});
