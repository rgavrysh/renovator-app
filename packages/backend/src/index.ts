import express, { Request, Response } from 'express';
import config from './config';
import { initSentry, Sentry } from './utils/sentry';
import { initializeDatabase } from './config/database';
import { authenticate } from './middleware';

// Initialize Sentry
initSentry();

const app = express();

// Sentry request handler must be the first middleware
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (public)
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Example protected route
app.get('/api/me', authenticate, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

// API routes will be added here

// Sentry error handler must be before any other error middleware
app.use(Sentry.Handlers.errorHandler());

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = config.server.port;

const startServer = async () => {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
      console.log(`Environment: ${config.server.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
