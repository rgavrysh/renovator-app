import * as Sentry from '@sentry/react';
import config from '../config';

export function initSentry(): void {
  if (config.sentry.dsn) {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.sentry.environment,
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay(),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
    console.log('Sentry initialized for frontend');
  } else {
    console.log('Sentry DSN not configured, skipping initialization');
  }
}

export { Sentry };
