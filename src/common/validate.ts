import type { Request, Response, NextFunction } from 'express';
import { type ZodType, ZodError } from 'zod';

/**
 * Generic Zod validation middleware factory.
 *
 * Validates req.body, req.params and req.query against provided Zod schemas.
 * If validation fails, throws a ZodError which the global error handler
 * turns into a 400 with field-level details.
 *
 * Usage in routes:
 *   router.post('/', validate({ body: createRideSchema }), controller.create);
 */
interface ValidationSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

export const validate =
  (schemas: ValidationSchemas) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(err);
      } else {
        next(err);
      }
    }
  };
