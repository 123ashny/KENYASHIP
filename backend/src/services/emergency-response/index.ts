import { Router } from 'express';
import { z } from 'zod';
import type { ApiResponse } from '../../types/index.js';
import {
    triggerPanicButton,
    processAccelerometerData,
    getEmergency,
    getActiveEmergency,
    acknowledgeEmergency,
    resolveEmergency,
    getAllActiveEmergencies,
    setEmergencyContacts,
    getEmergencyContacts,
} from './orchestrator.js';
import { uuidSchema, coordinatesSchema, formatValidationError } from '../../utils/validators.js';
import { createRequestLogger } from '../../utils/logger.js';

const router = Router();

router.post('/panic', async (req, res) => {
    const reqLogger = createRequestLogger(req.requestId);
    try {
        const schema = z.object({
            driverId: uuidSchema,
            deliveryId: uuidSchema.optional(),
            location: coordinatesSchema,
        });
        const result = schema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ success: false, error: formatValidationError(result.error) });
            return;
        }
        const emergency = await triggerPanicButton(result.data.driverId, result.data.location, result.data.deliveryId);
        res.status(201).json({ success: true, data: emergency });
    } catch (error) {
        reqLogger.error('Panic button error', { error: (error as Error).message });
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to trigger panic' } });
    }
});

router.post('/accelerometer', async (req, res) => {
    try {
        const schema = z.object({
            driverId: uuidSchema,
            deliveryId: uuidSchema.optional(),
            reading: z.object({ x: z.number(), y: z.number(), z: z.number(), timestamp: z.string().datetime() }),
            location: coordinatesSchema,
        });
        const result = schema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ success: false, error: formatValidationError(result.error) });
            return;
        }
        const { driverId, deliveryId, reading, location } = result.data;
        const emergency = await processAccelerometerData(driverId, { ...reading, timestamp: new Date(reading.timestamp) }, location, deliveryId);
        res.json({ success: true, data: { emergencyTriggered: !!emergency, emergency } });
    } catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process data' } });
    }
});

router.get('/:emergencyId', (req, res) => {
    const emergency = getEmergency(req.params['emergencyId'] ?? '');
    if (!emergency) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Emergency not found' } });
        return;
    }
    res.json({ success: true, data: emergency });
});

router.get('/active/:driverId', (req, res) => {
    const emergency = getActiveEmergency(req.params['driverId'] ?? '');
    res.json({ success: true, data: { hasActiveEmergency: !!emergency, emergency } });
});

router.get('/', (req, res) => {
    res.json({ success: true, data: { emergencies: getAllActiveEmergencies() } });
});

router.post('/:emergencyId/acknowledge', (req, res) => {
    const acknowledged = acknowledgeEmergency(req.params['emergencyId'] ?? '', req.user?.id ?? 'system');
    if (!acknowledged) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Emergency not found' } });
        return;
    }
    res.json({ success: true, data: { acknowledged: true } });
});

router.post('/:emergencyId/resolve', (req, res) => {
    const resolved = resolveEmergency(req.params['emergencyId'] ?? '', req.user?.id ?? 'system');
    if (!resolved) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Emergency not found' } });
        return;
    }
    res.json({ success: true, data: { resolved: true } });
});

router.post('/contacts/:driverId', (req, res) => {
    const schema = z.object({
        contacts: z.array(z.object({ name: z.string(), phone: z.string(), relationship: z.string() })),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, error: formatValidationError(result.error) });
        return;
    }
    setEmergencyContacts(req.params['driverId'] ?? '', result.data.contacts);
    res.json({ success: true, data: { contactsSet: true } });
});

router.get('/contacts/:driverId', (req, res) => {
    const contacts = getEmergencyContacts(req.params['driverId'] ?? '');
    res.json({ success: true, data: { contacts } });
});

export { router as emergencyRouter };
