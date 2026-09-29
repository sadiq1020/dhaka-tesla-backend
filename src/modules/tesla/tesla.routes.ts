import { Router } from 'express';
import * as teslaController from './tesla.controller.js';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { validate } from '../../common/validate.js';
import { createTeslaSchema, updateTeslaStatusSchema } from './tesla.schema.js';

const router = Router();

// Driver registers their Tesla
router.post(
  '/',
  requireAuth,
  requireRole('DRIVER'),
  validate({ body: createTeslaSchema }),
  teslaController.registerTesla,
);

// Driver views their registered Tesla
router.get(
  '/my',
  requireAuth,
  requireRole('DRIVER'),
  teslaController.getMyTesla,
);

// Driver toggles online / offline status
router.patch(
  '/status',
  requireAuth,
  requireRole('DRIVER'),
  validate({ body: updateTeslaStatusSchema }),
  teslaController.setTeslaStatus,
);

// List all online Teslas (accessible to authenticated users)
router.get(
  '/',
  requireAuth,
  teslaController.getOnlineTeslas,
);

export const teslaRoutes = router;
