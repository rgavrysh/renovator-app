import { DataSource, DataSourceOptions } from 'typeorm';
import config from './index';
import {
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
} from '../entities';

const isProduction = config.server.nodeEnv === 'production';

// Resolve migration paths: compiled JS in production, TS source in development
function getMigrationPaths(): string[] {
  if (process.env.VITEST) return [];
  if (isProduction) return ['dist/migrations/[0-9]*-*.js'];
  return ['src/migrations/[0-9]*-*.ts'];
}

const sharedOptions = {
  synchronize: !isProduction && config.server.nodeEnv === 'development',
  logging: !isProduction,
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
  migrations: getMigrationPaths(),
  subscribers: [] as string[],
};

// Build DataSource options: prefer DATABASE_URL if set, otherwise use individual fields
export const dataSourceOptions: DataSourceOptions = config.database.url
  ? {
      type: 'postgres' as const,
      url: config.database.url,
      ssl: { rejectUnauthorized: false },
      ...sharedOptions,
    }
  : {
      type: 'postgres' as const,
      host: config.database.host,
      port: config.database.port,
      username: config.database.user,
      password: config.database.password,
      database: config.database.name,
      ...sharedOptions,
    };

export const AppDataSource = new DataSource(dataSourceOptions);

export const initializeDatabase = async (): Promise<DataSource> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connection established successfully');

      // Automatically run pending migrations in production
      if (isProduction) {
        console.log('Running pending database migrations...');
        const migrations = await AppDataSource.runMigrations();
        if (migrations.length > 0) {
          console.log(`Applied ${migrations.length} migration(s):`, migrations.map(m => m.name));
        } else {
          console.log('No pending migrations to apply');
        }
      }
    }
    return AppDataSource;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('Database connection closed');
  }
};
