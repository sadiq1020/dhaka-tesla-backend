import { prisma } from '../../db/prisma.js';
import { AppError } from '../../common/errors.js';
import type { CreateTeslaInput } from './tesla.schema.js';

export class TeslaService {
  /**
   * Register a new Tesla assigned to the authenticated driver.
   * One driver can only own one Tesla in the MVP.
   */
  async registerTesla(driverId: string, data: CreateTeslaInput) {
    // 1. Verify driver exists and has DRIVER role
    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      include: { tesla: true },
    });

    if (!driver) {
      throw new AppError(404, 'NOT_FOUND', 'Driver account not found');
    }

    if (driver.role !== 'DRIVER') {
      throw new AppError(403, 'FORBIDDEN', 'Only users with DRIVER role can register a Tesla');
    }

    // 2. Check if driver already has a Tesla
    if (driver.tesla) {
      throw new AppError(
        409,
        'DUPLICATE',
        'Driver already has a registered Tesla',
      );
    }

    // 3. Check plate number uniqueness
    const existingPlate = await prisma.tesla.findUnique({
      where: { plateNumber: data.plateNumber },
    });

    if (existingPlate) {
      throw new AppError(
        409,
        'DUPLICATE',
        `A Tesla with plate number "${data.plateNumber}" already exists`,
      );
    }

    // 4. Create Tesla
    const tesla = await prisma.tesla.create({
      data: {
        name: data.name,
        plateNumber: data.plateNumber,
        capacity: data.capacity,
        driverId,
        isOnline: false,
      },
    });

    return tesla;
  }

  /**
   * Get the Tesla assigned to the driver.
   */
  async getMyTesla(driverId: string) {
    const tesla = await prisma.tesla.findUnique({
      where: { driverId },
    });

    if (!tesla) {
      throw new AppError(404, 'NOT_FOUND', 'No Tesla registered for this driver');
    }

    return tesla;
  }

  /**
   * Toggle Tesla online / offline status for pooling availability.
   */
  async setOnlineStatus(driverId: string, isOnline: boolean) {
    const tesla = await prisma.tesla.findUnique({
      where: { driverId },
    });

    if (!tesla) {
      throw new AppError(404, 'NOT_FOUND', 'No Tesla registered for this driver');
    }

    const updated = await prisma.tesla.update({
      where: { id: tesla.id },
      data: { isOnline },
    });

    return updated;
  }

  /**
   * Get all currently online Teslas (for monitoring or matching).
   */
  async getOnlineTeslas() {
    return prisma.tesla.findMany({
      where: { isOnline: true },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }
}

export const teslaService = new TeslaService();
