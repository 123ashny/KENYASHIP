import { Router } from 'express';
import { z } from 'zod';
import { coordinatesSchema, formatValidationError } from '../../utils/validators.js';
import { obfuscateLocation } from './obfuscator.js';

const router = Router();

router.post('/obfuscate', (req, res) => {
    const schema = z.object({
        latitude: z.number(),
        longitude: z.number(),
        resolution: z.number().int().optional(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, error: formatValidationError(result.error) });
        return;
    }

    const { latitude, longitude, resolution } = result.data;
    const data = obfuscateLocation({ latitude, longitude }, resolution);

    res.json({ success: true, data });
});

router.get('/zones/:zoneId/center', (req, res) => {
    // Placeholder for zone metadata lookup
    res.json({
        success: true,
        data: {
            zoneId: req.params.zoneId,
            description: 'Zone center lookup not fully implemented'
        }
    });
});

export { router as locationRouter };
