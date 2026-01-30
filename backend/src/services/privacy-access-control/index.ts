import { Router } from 'express';
import { z } from 'zod';
import { getUserPermissions } from './access-control.js';
import { UserRole } from '../../types/index.js';

const router = Router();

router.get('/permissions', (req, res) => {
    const role = req.user?.role;
    if (!role) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
        return;
    }

    const permissions = getUserPermissions(role);
    res.json({ success: true, data: { role, permissions } });
});

export { router as privacyRouter };
