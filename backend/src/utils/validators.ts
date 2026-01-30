import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const coordinatesSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
});

export function formatValidationError(error: z.ZodError) {
    return {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
        })),
    };
}
