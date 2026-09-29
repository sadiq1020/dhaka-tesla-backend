import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from './errors.js';
import { logger } from './logger.js';

/**
 * Global error-handling middleware — must be the LAST middleware in app.ts.
 *
 * Normalises every error into one consistent JSON shape:
 *   { success: false, error: { code: string, message: string } }
 *
 * Handles:
 *  - AppError      → uses its own statusCode and code
 *  - ZodError      → 400 VALIDATION_ERROR with flattened field errors
 *  - Prisma P2002  → 409 DUPLICATE for unique constraint violations
 *  - Anything else → 500 INTERNAL_ERROR (logged with Winston)
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // --- AppError (our own) ---
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // --- Zod validation error ---
  if (err instanceof ZodError) {
    const flat = err.flatten();
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: flat.fieldErrors,
      },
    });
    return;
  }

  // --- Prisma unique constraint violation (P2002) ---
  if (isPrismaUniqueError(err)) {
    const target = (err as PrismaClientKnownRequestError).meta?.target;
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE',
        message: `A record with this ${Array.isArray(target) ? target.join(', ') : 'value'} already exists`,
      },
    });
    return;
  }

  // --- Unexpected error ---
  logger.error('Unhandled error', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
};

/**
 * 404 handler — mounted just before the error middleware.
 */
export const notFoundHandler = (req: Request, _res: Response, _next: NextFunction): void => {
  throw new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.url} not found`);
};

// ---- helpers ----

interface PrismaClientKnownRequestError extends Error {
  code: string;
  meta?: { target?: string[] };
}

function isPrismaUniqueError(err: Error): boolean {
  return 'code' in err && (err as PrismaClientKnownRequestError).code === 'P2002';
}
