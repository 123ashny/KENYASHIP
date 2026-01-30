import { Router } from 'express';
import type { ApiResponse } from '../../types/index.js';
import { getConnectionStats } from './broadcaster.js';

const router = Router();

router.get('/stats', (req, res) => {
    const stats = getConnectionStats();
    const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
        meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    };
    res.json(response);
});

router.get('/health', (req, res) => {
    const stats = getConnectionStats();
    res.json({
        success: true,
        data: { healthy: true, connections: stats.total },
    });
});

export { router as realtimeRouter };
export { initializeWebSocket, broadcast, broadcastDeliveryUpdate, broadcastSecurityAlert, broadcastEmergency, closeWebSocket } from './broadcaster.js';
