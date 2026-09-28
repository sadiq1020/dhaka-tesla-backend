import { Router } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';
import * as authController from './auth.controller.js';
import { validate } from '../../common/validate.js';
import { signUpSchema, signInSchema } from './auth.schema.js';
import { requireAuth } from './auth.middleware.js';

const router = Router();

// REST helper endpoints
router.post('/sign-up', validate({ body: signUpSchema }), authController.signUp);
router.post('/sign-in', validate({ body: signInSchema }), authController.signIn);
router.post('/sign-out', requireAuth, authController.signOut);
router.get('/me', requireAuth, authController.getMe);

// Native Better Auth endpoints fallback (e.g. /api/auth/get-session, etc.)
router.use(toNodeHandler(auth));

export const authRoutes = router;
