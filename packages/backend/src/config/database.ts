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

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.password,
  database: config.database.name,
  synchronize: config.server.nodeEnv === 'development',
  logging: config.server.nodeEnv === 'development',
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
  migrations: process.env.VITEST ? [] : ['src/migrations/[0-9]*-*.ts'],
  subscribers: [],
};

export const AppDataSource = new DataSource(dataSourceOptions);

export const initializeDatabase = async (): Promise<DataSource> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connection established successfully');
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
