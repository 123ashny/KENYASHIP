import { Router } from 'express';
import { z } from 'zod';
import type { ApiResponse, SecurityAlert, AlertSeverity, AnomalyType } from '../../types/index.js';
import {
    processLocationUpdate,
    getAlertsForDelivery,
    getUnacknowledgedAlerts,
    getAlertsBySeverity,
    acknowledgeAlert,
    resolveAlert,
    setExpectedRoute,
    getSecurityStats,
    checkCommunicationLoss,
} from './monitor.js';
import { logger, createRequestLogger } from '../../utils/logger.js';
import { uuidSchema, formatValidationError } from '../../utils/validators.js';

/**
 * Cargo Security Monitoring - API Routes
 */

const router = Router();

/**
 * POST /api/security/location-update
 * Process location update and check for anomalies
 */
router.post('/location-update', (req, res) => {
    const reqLogger = createRequestLogger(req.requestId);

    try {
        const schema = z.object({
            deliveryId: uuidSchema,
            driverId: uuidSchema,
            vehicleId: uuidSchema.optional(),
            location: z.object({
                zoneId: z.string(),
                resolution: z.number().int(),
                zoneDescription: z.string(),
                approximateTime: z.string().datetime(),
                movementState: z.enum(['stationary', 'moving', 'unknown']),
            }),
        });

        const result = schema.safeParse(req.body);

        if (!result.success) {
            const response: ApiResponse<null> = {
                success: false,
                error: formatValidationError(result.error),
                meta: {
                    requestId: req.requestId,
                    timestamp: new Date().toISOString(),
                },
            };
            res.status(400).json(response);
            return;
        }

        const { deliveryId, driverId, vehicleId, location } = result.data;

        const alerts = processLocationUpdate(deliveryId, driverId, location, vehicleId);

        const response: ApiResponse<{
            alertsGenerated: number;
            alerts: Array<{
                id: string;
                anomalyType: AnomalyType;
                severity: AlertSeverity;
                description: string;
            }>;
        }> = {
            success: true,
            data: {
                alertsGenerated: alerts.length,
                alerts: alerts.map(a => ({
                    id: a.id,
                    anomalyType: a.anomalyType,
                    severity: a.severity,
                    description: a.description,
                })),
            },
            meta: {
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
        };

        res.json(response);

    } catch (error) {
        reqLogger.error('Location update processing error', { error: (error as Error).message });

        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'PROCESSING_FAILED',
                message: 'Failed to process location update',
            },
            meta: {
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
        };
        res.status(500).json(response);
    }
});

/**
 * POST /api/security/expected-route
 * Set expected route for a delivery
 */
router.post('/expected-route', (req, res) => {
    try {
        const schema = z.object({
            deliveryId: uuidSchema,
            zoneSequence: z.array(z.string()),
            estimatedDuration: z.number().int().positive(),
        });

        const result = schema.safeParse(req.body);

        if (!result.success) {
            const response: ApiResponse<null> = {
                success: false,
                error: formatValidationError(result.error),
                meta: {
                    requestId: req.requestId,
                    timestamp: new Date().toISOString(),
                },
            };
            res.status(400).json(response);
            return;
        }

        const { deliveryId, zoneSequence, estimatedDuration } = result.data;

        setExpectedRoute(deliveryId, zoneSequence, estimatedDuration);

        const response: ApiResponse<{ routeSet: boolean }> = {
            success: true,
            data: { routeSet: true },
            meta: {
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
        };

        res.status(201).json(response);

    } catch (error) {
        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to set expected route',
            },
            meta: {
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
        };
        res.status(500).json(response);
    }
});

/**
 * GET /api/security/alerts
 * Get all security alerts with optional filters
 */
router.get('/alerts', (req, res) => {
    try {
        const schema = z.object({
            severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
            unacknowledgedOnly: z.coerce.boolean().optional(),
            deliveryId: uuidSchema.optional(),
        });

        const result = schema.safeParse(req.query);

        if (!result.success) {
            const response: ApiResponse<null> = {
                success: false,
                error: formatValidationError(result.error),
                meta: {
                    requestId: req.requestId,
                    timestamp: new Date().toISOString(),
                },
            };
            res.status(400).json(response);
            return;
        }

        const { severity, unacknowledgedOnly, deliveryId } = result.data;

        let alerts: SecurityAlert[];

        if (deliveryId) {
            alerts = getAlertsForDelivery(deliveryId);
        } else if (unacknowledgedOnly) {
            alerts = getUnacknowledgedAlerts();
        } else if (severity) {
            alerts = getAlertsBySeverity(severity);
        } else {
            alerts = getUnacknowledgedAlerts(); // Default to unacknowledged
        }

        const response: ApiResponse<{ alerts: SecurityAlert[] }> = {
            success: true,
            data: { alerts },
            meta: {
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
        };

        res.json(response);

    } catch (error) {
        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve alerts',
            },
            meta: {
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
        };
        res.status(500).json(response);
    }
});

/**
 * POST /api/security/alerts/:alertId/acknowledge
 * Acknowledge a security alert
 */
router.post('/alerts/:alertId/acknowledge', (req, res) => {
    try {
        const alertId = req.params['alertId'];
        const acknowledgedBy = req.user?.id;

        if (!acknowledgedBy) {
            const response: ApiResponse<null> = {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required',
                },
                meta: {
                    requestId: req.requestId,
                    timestamp: new Date().toISOString(),
                },
            };
            res.status(401).json(response);
            return;
        }

        const acknowledged = acknowledgeAlert(alertId ?? '', acknowledgedBy);

        if (!acknowledged) {
            const response: ApiResponse<null> = {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Alert not found',
                },
                meta: {
                    requestId: req.requestId,
                    timestamp: new Date().toISOString(),
                },
            };
            res.status(404).json(response);
            return;
        }

        const response: ApiResponse<{ acknowledged: boolean }> = {
            success: true,
            data: { acknowledged: true },
            meta: {
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
        };

        res.json(response);

    } catch (error) {
        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to acknowledge alert',
            },
            meta: {
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
        };
        res.status(500).json(response);
    }
});

/**
 * POST /api/security/alerts/:alertId/resolve
 * Resolve a security alert
 */
router.post('/alerts/:alertId/resolve', (req, res) => {
    try {
        const alertId = req.params['alertId'];
        const resolvedBy = req.user?.id;

        if (!resolvedBy) {
            const response: ApiResponse<null> = {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required',
                },
                meta: {
                    requestId: req.requestId,
                    timestamp: new Date().toISOString(),
                },
            };
            res.status(401).json(response);
            return;
        }

        const schema = z.object({
            status: z.enum(['false_positive', 'investigated', 'escalated', 'resolved']),
            notes: z.string().max(500).optional(),
        });

        const result = schema.safeParse(req.body);

        if (!result.success) {
            const response: ApiResponse<null> = {
                success: false,
                error: formatValidationError(result.error),
                meta: {
                    requestId: req.requestId,
                    timestamp: new Date().toISOString(),
                },
            };
            res.status(400).json(response);
            return;
        }

        const { status, notes } = result.data;
        const resolved = resolveAlert(alertId ?? '', resolvedBy, status, notes);

        if (!resolved) {
            const response: ApiResponse<null> = {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Alert not found',
                },
                meta: {
                    requestId: req.requestId,
                    timestamp: new Date().toISOString(),
                },
            };
            res.status(404).json(response);
            return;
        }

        const response: ApiResponse<{ resolved: boolean }> = {
            success: true,
            data: { resolved: true },
            meta: {
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
        };

        res.json(response);

    } catch (error) {
        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to resolve alert',
            },
            meta: {
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
        };
        res.status(500).json(response);
    }
});

/**
 * GET /api/security/stats
 * Get security statistics
 */
router.get('/stats', (req, res) => {
    try {
        const stats = getSecurityStats();

        const response: ApiResponse<typeof stats> = {
            success: true,
            data: stats,
            meta: {
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
        };

        res.json(response);

    } catch (error) {
        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve stats',
            },
            meta: {
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
        };
        res.status(500).json(response);
    }
});

export { router as securityRouter };
