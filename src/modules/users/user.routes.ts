import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { prisma } from '../../db/prisma.js';
import { AppError } from '../../common/errors.js';

const router = Router();

/**
 * GET /api/users/profile
 * Returns the authenticated user's profile, including their registered Tesla if they are a DRIVER.
 */
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      createdAt: true,
      tesla: {
        select: {
          id: true,
          name: true,
          plateNumber: true,
          capacity: true,
          isOnline: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const userRoutes = router;
