import type { Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth.js';
import { AppError } from '../../common/errors.js';

export const signUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
        role: req.body.role || 'PASSENGER',
        phone: req.body.phone,
      },
      headers: fromNodeHeaders(req.headers),
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    const error = err as {
      status?: number;
      body?: { code?: string; message?: string };
      message?: string;
    };

    if (
      error.status === 422 ||
      error.body?.code === 'USER_ALREADY_EXISTS' ||
      error.message?.includes('already exists')
    ) {
      throw new AppError(409, 'DUPLICATE', 'A user with this email already exists');
    }

    if (error.body?.message) {
      throw new AppError(error.status || 400, 'AUTH_ERROR', error.body.message);
    }

    throw err;
  }
};

export const signIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await auth.api.signInEmail({
      body: {
        email: req.body.email,
        password: req.body.password,
      },
      headers: fromNodeHeaders(req.headers),
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    const error = err as {
      status?: number;
      body?: { code?: string; message?: string };
      message?: string;
    };

    if (
      error.status === 401 ||
      error.body?.code === 'INVALID_EMAIL_OR_PASSWORD' ||
      error.message?.includes('Invalid')
    ) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (error.body?.message) {
      throw new AppError(error.status || 400, 'AUTH_ERROR', error.body.message);
    }

    throw err;
  }
};

export const signOut = async (req: Request, res: Response): Promise<void> => {
  await auth.api.signOut({
    headers: fromNodeHeaders(req.headers),
  });

  res.status(200).json({
    success: true,
    message: 'Signed out successfully',
  });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
      session: req.session,
    },
  });
};
