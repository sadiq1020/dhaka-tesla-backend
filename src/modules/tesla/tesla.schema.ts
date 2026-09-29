import { z } from 'zod';

export const createTeslaSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  plateNumber: z
    .string()
    .min(3, 'Plate number must be at least 3 characters')
    .max(20, 'Plate number cannot exceed 20 characters')
    .trim(),
  capacity: z
    .number()
    .int('Capacity must be an integer')
    .min(2, 'Capacity must be at least 2 passenger seats')
    .max(4, 'Capacity cannot exceed 4 passenger seats')
    .default(4),
});

export const updateTeslaStatusSchema = z.object({
  isOnline: z.boolean(),
});

export type CreateTeslaInput = z.infer<typeof createTeslaSchema>;
export type UpdateTeslaStatusInput = z.infer<typeof updateTeslaStatusSchema>;
