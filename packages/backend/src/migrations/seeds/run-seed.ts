import 'dotenv/config';
import { AppDataSource } from '../../config/database';
import { seedDatabase } from './seed';

async function runSeed() {
  try {
    console.log('Initializing database connection...');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connected successfully');
    } else {
      console.log('Using existing database connection');
    }

    await seedDatabase(AppDataSource);

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error running seed:', error);
    process.exit(1);
  }
}

runSeed();
