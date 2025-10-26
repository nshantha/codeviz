import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { serverConfig } from './config';
import apiRoutes from './routes';

export interface AppOptions {
  debug?: boolean;
}

/**
 * Create and configure Express application
 * Factory pattern inspired by DeepAgents' create_deep_agent
 */
export function createApp(options: AppOptions = {}): Application {
  const app = express();

  // CORS
  app.use(cors({
    origin: serverConfig.allowedOrigins,
    credentials: true
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging (if debug mode)
  if (options.debug || serverConfig.env === 'development') {
    app.use((req, _res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: serverConfig.env,
    });
  });

  // API routes
  app.use('/api', apiRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'Route not found'
    });
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);

    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error'
    });
  });

  return app;
}
