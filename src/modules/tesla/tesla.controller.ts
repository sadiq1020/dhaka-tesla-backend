import type { Request, Response } from 'express';
import { teslaService } from './tesla.service.js';
import { AppError } from '../../common/errors.js';

export const registerTesla = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const tesla = await teslaService.registerTesla(req.user.id, req.body);

  res.status(201).json({
    success: true,
    data: tesla,
  });
};

export const getMyTesla = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const tesla = await teslaService.getMyTesla(req.user.id);

  res.status(200).json({
    success: true,
    data: tesla,
  });
};

export const setTeslaStatus = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const tesla = await teslaService.setOnlineStatus(req.user.id, req.body.isOnline);

  res.status(200).json({
    success: true,
    data: tesla,
  });
};

export const getOnlineTeslas = async (_req: Request, res: Response): Promise<void> => {
  const teslas = await teslaService.getOnlineTeslas();

  res.status(200).json({
    success: true,
    data: teslas,
  });
};
