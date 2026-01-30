import { Router } from 'express';
import { z } from 'zod';
import type { ApiResponse, NotificationChannel, NotificationPriority } from '../../types/index.js';
import {
    sendNotification,
    getNotification,
    getNotificationsForUser,
    setUserPreferences,
    getUserPreferences,
    markAsDelivered,
    markAsRead,
} from './notifier.js';
import { uuidSchema, formatValidationError } from '../../utils/validators.js';

const router = Router();

router.post('/send', async (req, res) => {
    try {
        const schema = z.object({
            recipientId: uuidSchema,
            channel: z.enum(['sms', 'push', 'whatsapp', 'ussd', 'email']),
            templateId: z.string().min(1),
            content: z.string().min(1),
            priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
        });
        const result = schema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ success: false, error: formatValidationError(result.error) });
            return;
        }
        const { recipientId, channel, templateId, content, priority } = result.data;
        const notification = await sendNotification(recipientId, channel as NotificationChannel, templateId, content, priority as NotificationPriority);
        res.status(201).json({ success: true, data: { id: notification.id, status: notification.status } });
    } catch (error) {
        res.status(500).json({ success: false, error: { code: 'SEND_FAILED', message: (error as Error).message } });
    }
});

router.get('/:notificationId', (req, res) => {
    const notification = getNotification(req.params['notificationId'] ?? '');
    if (!notification) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
        return;
    }
    res.json({ success: true, data: notification });
});

router.get('/user/:userId', (req, res) => {
    const notifications = getNotificationsForUser(req.params['userId'] ?? '');
    res.json({ success: true, data: { notifications } });
});

router.put('/preferences', (req, res) => {
    const schema = z.object({
        channels: z.array(z.enum(['sms', 'push', 'whatsapp', 'ussd', 'email'])),
        quiet: z.object({ start: z.string(), end: z.string() }).optional(),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, error: formatValidationError(result.error) });
        return;
    }
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
        return;
    }
    setUserPreferences(userId, result.data.channels as NotificationChannel[], result.data.quiet);
    res.json({ success: true, data: { preferencesSet: true } });
});

router.get('/preferences', (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
        return;
    }
    res.json({ success: true, data: getUserPreferences(userId) });
});

router.post('/:notificationId/delivered', (req, res) => {
    const marked = markAsDelivered(req.params['notificationId'] ?? '');
    res.json({ success: true, data: { marked } });
});

router.post('/:notificationId/read', (req, res) => {
    const marked = markAsRead(req.params['notificationId'] ?? '');
    res.json({ success: true, data: { marked } });
});

export { router as notificationRouter };
