import { Router } from 'express';
import { z } from 'zod';
import type { ApiResponse, VerificationMethod } from '../../types/index.js';
import {
    generateOTP,
    verifyOTP,
    storeDeliveryPhoto,
    storeSignature,
    verifyGeofence,
    initializeVerification,
    getVerificationStatus,
    getPendingMethods,
    createFallbackVerification,
} from './verifier.js';
import { logger, createRequestLogger } from '../../utils/logger.js';
import { uuidSchema, coordinatesSchema, formatValidationError } from '../../utils/validators.js';

/**
 * Delivery Verification Service - API Routes
 */

const router = Router();

/**
 * POST /api/verification/initialize
 * Initialize verification requirements for a delivery
 */
router.post('/initialize', (req, res) => {
    const reqLogger = createRequestLogger(req.requestId);

    try {
        const schema = z.object({
            deliveryId: uuidSchema,
            requiredMethods: z.array(z.enum(['otp', 'code', 'photo', 'signature', 'geofence', 'biometric'])),
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

        const { deliveryId, requiredMethods } = result.data;

        const verification = initializeVerification(deliveryId, requiredMethods as VerificationMethod[]);

        const response: ApiResponse<typeof verification> = {
            success: true,
            data: verification,
            meta: {
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
        };

        res.status(201).json(response);

    } catch (error) {
        reqLogger.error('Initialize verification error', { error: (error as Error).message });

        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to initialize verification',
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
 * POST /api/verification/otp/generate
 * Generate OTP for delivery verification
 */
router.post('/otp/generate', (req, res) => {
    const reqLogger = createRequestLogger(req.requestId);

    try {
        const schema = z.object({
            deliveryId: uuidSchema,
            recipientId: uuidSchema,
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

        const { deliveryId, recipientId } = result.data;
        const otp = generateOTP(deliveryId, recipientId);

        const response: ApiResponse<typeof otp> = {
            success: true,
            data: otp,
            meta: {
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
        };

        res.status(201).json(response);

    } catch (error) {
        reqLogger.error('OTP generation error', { error: (error as Error).message });

        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'OTP_GENERATION_FAILED',
                message: 'Failed to generate OTP',
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
 * POST /api/verification/otp/verify
 * Verify OTP
 */
router.post('/otp/verify', (req, res) => {
    try {
        const schema = z.object({
            deliveryId: uuidSchema,
            otp: z.string().min(4).max(8),
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

        const { deliveryId, otp } = result.data;
        const verification = verifyOTP(deliveryId, otp);

        const response: ApiResponse<typeof verification> = {
            success: true,
            data: verification,
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
                code: 'OTP_VERIFICATION_FAILED',
                message: 'Failed to verify OTP',
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
 * POST /api/verification/photo
 * Upload delivery photo proof
 */
router.post('/photo', (req, res) => {
    const reqLogger = createRequestLogger(req.requestId);

    try {
        // For multipart, we'd use multer. This is simplified for JSON base64
        const schema = z.object({
            deliveryId: uuidSchema,
            photoBase64: z.string().min(100),
            width: z.number().int().positive(),
            height: z.number().int().positive(),
            mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
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

        const { deliveryId, photoBase64, width, height, mimeType } = result.data;
        const photoData = Buffer.from(photoBase64, 'base64');

        // Size limit: 5MB
        if (photoData.length > 5 * 1024 * 1024) {
            const response: ApiResponse<null> = {
                success: false,
                error: {
                    code: 'PHOTO_TOO_LARGE',
                    message: 'Photo must be under 5MB',
                },
                meta: {
                    requestId: req.requestId,
                    timestamp: new Date().toISOString(),
                },
            };
            res.status(413).json(response);
            return;
        }

        const photo = storeDeliveryPhoto(deliveryId, photoData, { width, height, mimeType });

        const response: ApiResponse<{
            id: string;
            capturedAt: string;
            sizeBytes: number;
        }> = {
            success: true,
            data: {
                id: photo.id,
                capturedAt: photo.capturedAt,
                sizeBytes: photo.metadata.sizeBytes,
            },
            meta: {
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
        };

        res.status(201).json(response);

    } catch (error) {
        reqLogger.error('Photo upload error', { error: (error as Error).message });

        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'PHOTO_UPLOAD_FAILED',
                message: 'Failed to upload photo',
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
 * POST /api/verification/signature
 * Upload digital signature
 */
router.post('/signature', (req, res) => {
    const reqLogger = createRequestLogger(req.requestId);

    try {
        const schema = z.object({
            deliveryId: uuidSchema,
            signatureData: z.string().min(10), // SVG path or base64
            signerName: z.string().min(1).max(100).optional(),
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

        const { deliveryId, signatureData, signerName } = result.data;
        const signature = storeSignature(deliveryId, signatureData, signerName);

        const response: ApiResponse<{
            id: string;
            capturedAt: string;
        }> = {
            success: true,
            data: {
                id: signature.id,
                capturedAt: signature.capturedAt,
            },
            meta: {
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
        };

        res.status(201).json(response);

    } catch (error) {
        reqLogger.error('Signature upload error', { error: (error as Error).message });

        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'SIGNATURE_UPLOAD_FAILED',
                message: 'Failed to upload signature',
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
 * POST /api/verification/geofence
 * Verify driver is within delivery geofence
 */
router.post('/geofence', (req, res) => {
    try {
        const schema = z.object({
            deliveryId: uuidSchema,
            driverLocation: coordinatesSchema,
            deliveryLocation: z.object({
                latitude: z.number().min(-90).max(90),
                longitude: z.number().min(-180).max(180),
            }),
            radiusMeters: z.number().int().min(10).max(1000).optional(),
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

        const { deliveryId, driverLocation, deliveryLocation, radiusMeters } = result.data;
        const geofenceResult = verifyGeofence(deliveryId, driverLocation, deliveryLocation, radiusMeters);

        const response: ApiResponse<typeof geofenceResult> = {
            success: true,
            data: geofenceResult,
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
                code: 'GEOFENCE_VERIFICATION_FAILED',
                message: 'Failed to verify geofence',
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
 * GET /api/verification/status/:deliveryId
 * Get verification status for a delivery
 */
router.get('/status/:deliveryId', (req, res) => {
    try {
        const deliveryId = req.params['deliveryId'];

        const parseResult = uuidSchema.safeParse(deliveryId);
        if (!parseResult.success) {
            const response: ApiResponse<null> = {
                success: false,
                error: {
                    code: 'INVALID_DELIVERY_ID',
                    message: 'Invalid delivery ID format',
                },
                meta: {
                    requestId: req.requestId,
                    timestamp: new Date().toISOString(),
                },
            };
            res.status(400).json(response);
            return;
        }

        const status = getVerificationStatus(deliveryId ?? '');

        if (!status) {
            const response: ApiResponse<null> = {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'No verification found for this delivery',
                },
                meta: {
                    requestId: req.requestId,
                    timestamp: new Date().toISOString(),
                },
            };
            res.status(404).json(response);
            return;
        }

        const response: ApiResponse<typeof status> = {
            success: true,
            data: status,
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
                message: 'Failed to get verification status',
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
 * GET /api/verification/pending/:deliveryId
 * Get pending verification methods
 */
router.get('/pending/:deliveryId', (req, res) => {
    try {
        const deliveryId = req.params['deliveryId'];

        const parseResult = uuidSchema.safeParse(deliveryId);
        if (!parseResult.success) {
            const response: ApiResponse<null> = {
                success: false,
                error: {
                    code: 'INVALID_DELIVERY_ID',
                    message: 'Invalid delivery ID format',
                },
                meta: {
                    requestId: req.requestId,
                    timestamp: new Date().toISOString(),
                },
            };
            res.status(400).json(response);
            return;
        }

        const pending = getPendingMethods(deliveryId ?? '');

        const response: ApiResponse<{ pendingMethods: VerificationMethod[] }> = {
            success: true,
            data: { pendingMethods: pending },
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
                message: 'Failed to get pending methods',
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
 * POST /api/verification/fallback
 * Verify using fallback code (for offline scenarios)
 */
router.post('/fallback', (req, res) => {
    try {
        const schema = z.object({
            deliveryId: uuidSchema,
            fallbackCode: z.string().length(8),
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

        const { deliveryId, fallbackCode } = result.data;
        const fallbackResult = createFallbackVerification(deliveryId, fallbackCode);

        const response: ApiResponse<typeof fallbackResult> = {
            success: true,
            data: fallbackResult,
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
                code: 'FALLBACK_VERIFICATION_FAILED',
                message: 'Failed to verify fallback code',
            },
            meta: {
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            },
        };
        res.status(500).json(response);
    }
});

export { router as verificationRouter };
