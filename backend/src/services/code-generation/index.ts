import { Router } from 'express';
import { z } from 'zod';
import { generateDeliveryCode } from './generator.js';
import { uuidSchema, formatValidationError } from '../../utils/validators.js';

const router = Router();

router.post('/generate', (req, res) => {
    const schema = z.object({
        deliveryId: uuidSchema,
        theme: z.enum(['safari', 'coastal', 'mountain', 'tech']).optional(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, error: formatValidationError(result.error) });
        return;
    }

    const { deliveryId, theme } = result.data;
    const userId = req.user?.id || 'system'; // Requires auth middleware or fallback

    const code = generateDeliveryCode(deliveryId, userId, theme);

    res.json({ success: true, data: code });
});

export { router as codeRouter };
