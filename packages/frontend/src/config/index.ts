interface Config {
  api: {
    url: string;
  };
  keycloak: {
    url: string;
    realm: string;
    clientId: string;
  };
  sentry: {
    dsn: string;
    environment: string;
  };
}

const config: Config = {
  api: {
    url: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  },
  keycloak: {
    url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'renovator',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'renovator-app',
  },
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
  },
};

export default config;
