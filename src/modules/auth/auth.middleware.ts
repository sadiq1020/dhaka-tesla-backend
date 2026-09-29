import type { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth.js';
import { AppError } from '../../common/errors.js';
import type { RoleType } from './auth.schema.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: RoleType;
        phone?: string | null;
        [key: string]: unknown;
      };
      session?: {
        id: string;
        userId: string;
        token: string;
        expiresAt: Date;
        [key: string]: unknown;
      };
    }
  }
}

/**
 * Middleware that authenticates a request using Better Auth session or Bearer token.
 * Populates `req.user` and `req.session`.
 */
export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionData = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!sessionData || !sessionData.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    req.user = sessionData.user as Express.Request['user'];
    req.session = sessionData.session as Express.Request['session'];

    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired session'));
    }
  }
};

/**
 * Role-based access control middleware.
 * Ensures the authenticated user has one of the allowed roles.
 */
export const requireRole = (...roles: RoleType[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const userRole = (req.user.role as RoleType) ?? 'PASSENGER';

    if (!roles.includes(userRole)) {
      throw new AppError(
        403,
        'FORBIDDEN',
        `Access denied: requires ${roles.join(' or ')} role`,
      );
    }

    next();
  };
};
