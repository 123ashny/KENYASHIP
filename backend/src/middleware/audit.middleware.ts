import { Request, Response, NextFunction } from 'express';
import { createAuditEntry } from '../services/privacy-access-control/access-control.js';
import { sha256 } from '../crypto/hashing.js';

/**
 * Audit Middleware - Log all API access for compliance
 */

export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    // Capture response
    const originalSend = res.send;
    res.send = function (body) {
        const duration = Date.now() - startTime;

        createAuditEntry({
            actorId: req.user?.id ?? 'anonymous',
            actorRole: req.user?.role ?? 'customer',
            action: `${req.method} ${req.path}`,
            resourceType: req.path.split('/')[2] ?? 'unknown',
            resourceId: req.params['id'] ?? req.params['deliveryId'],
            metadata: {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                requestId: req.requestId,
            },
            result: res.statusCode < 400 ? 'success' : res.statusCode === 403 ? 'denied' : 'failure',
        });

        return originalSend.call(this, body);
    };

    next();
}
