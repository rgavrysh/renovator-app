import dotenv from 'dotenv';

dotenv.config();

interface Config {
  server: {
    port: number;
    nodeEnv: string;
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  keycloak: {
    url: string;
    realm: string;
    clientId: string;
    clientSecret: string;
  };
  sentry: {
    dsn: string;
    environment: string;
  };
}

const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    name: process.env.DATABASE_NAME || 'renovator',
    user: process.env.DATABASE_USER || 'renovator',
    password: process.env.DATABASE_PASSWORD || 'renovator123',
  },
  keycloak: {
    url: process.env.KEYCLOAK_URL || 'http://localhost:8080',
    realm: process.env.KEYCLOAK_REALM || 'renovator',
    clientId: process.env.KEYCLOAK_CLIENT_ID || 'renovator-app',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
  },
};

export default config;
