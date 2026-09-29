import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { logger } from './common/logger.js';
import { getZoneList } from './config/zones.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { teslaRoutes } from './modules/tesla/tesla.routes.js';
import { userRoutes } from './modules/users/user.routes.js';
import { errorHandler, notFoundHandler } from './common/error-handler.js';

export const createApp = (): Express => {
  const app = express();

  // Basic security and request parsing
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // HTTP Request logger
  app.use((req: Request, _res: Response, next) => {
    logger.http(`${req.method} ${req.url}`);
    next();
  });

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'dhaka-tesla-backend',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /api/zones
   * Returns all predefined Dhaka pickup/destination zones.
   * The frontend MUST use this endpoint to populate dropdowns —
   * never hardcode zone names in the UI.
   */
  app.get('/api/zones', (_req: Request, res: Response) => {
    res.status(200).json({ success: true, data: getZoneList() });
  });

  // Module routes
  app.use('/api/auth', authRoutes);
  app.use('/api/teslas', teslaRoutes);
  app.use('/api/users', userRoutes);

  // 404 & Global error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
