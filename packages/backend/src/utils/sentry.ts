import * as Sentry from '@sentry/node';
import config from '../config';

export function initSentry(): void {
  if (config.sentry.dsn) {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.sentry.environment,
      tracesSampleRate: 1.0,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
      ],
    });
    console.log('Sentry initialized for backend');
  } else {
    console.log('Sentry DSN not configured, skipping initialization');
  }
}

export { Sentry };
