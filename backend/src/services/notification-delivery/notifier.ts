import { v4 as uuidv4 } from 'uuid';
import type {
    NotificationRecord,
    NotificationChannel,
    NotificationPriority,
    UUID
} from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';
import { encrypt, decrypt } from '../../crypto/encryption.js';

/**
 * Secure Notification Delivery Service
 * Multi-channel with encryption and retry logic
 */

const notificationStore = new Map<UUID, NotificationRecord>();
const userPreferences = new Map<UUID, { channels: NotificationChannel[]; quiet: { start: string; end: string } | null }>();
const rateLimitStore = new Map<string, { count: number; resetAt: Date }>();

// Retry configuration
const RETRY_DELAYS = [1000, 5000, 30000, 60000, 300000]; // ms

export async function sendNotification(
    recipientId: UUID,
    channel: NotificationChannel,
    templateId: string,
    content: string,
    priority: NotificationPriority = 'normal'
): Promise<NotificationRecord> {
    // Rate limiting
    const rateLimitKey = `notify:${recipientId}:${channel}`;
    const rateLimit = rateLimitStore.get(rateLimitKey);
    if (rateLimit && rateLimit.resetAt > new Date() && rateLimit.count >= 10) {
        logger.warn('Notification rate limited', { recipientId, channel });
        throw new Error('Rate limited');
    }

    // Encrypt content
    const contentEncrypted = encrypt(content, recipientId);

    const notification: NotificationRecord = {
        id: uuidv4(),
        recipientId,
        channel,
        priority,
        templateId,
        contentEncrypted,
        scheduledAt: new Date().toISOString(),
        status: 'pending',
        retryCount: 0,
        maxRetries: RETRY_DELAYS.length,
    };

    notificationStore.set(notification.id, notification);

    // Update rate limit
    if (rateLimit) {
        rateLimit.count++;
    } else {
        rateLimitStore.set(rateLimitKey, { count: 1, resetAt: new Date(Date.now() + 60000) });
    }

    // Attempt delivery
    await deliverNotification(notification);

    return notification;
}

async function deliverNotification(notification: NotificationRecord): Promise<void> {
    try {
        switch (notification.channel) {
            case 'sms':
                await deliverSMS(notification);
                break;
            case 'push':
                await deliverPush(notification);
                break;
            case 'whatsapp':
                await deliverWhatsApp(notification);
                break;
            case 'ussd':
                await deliverUSSD(notification);
                break;
            case 'email':
                await deliverEmail(notification);
                break;
        }

        notification.sentAt = new Date().toISOString();
        notification.status = 'sent';
        logger.info('Notification sent', { id: notification.id, channel: notification.channel });

    } catch (error) {
        logger.error('Notification delivery failed', { id: notification.id, error: (error as Error).message });
        await scheduleRetry(notification);
    }
}

async function deliverSMS(notification: NotificationRecord): Promise<void> {
    if (!config.atApiKey) {
        logger.debug('SMS delivery skipped - no API key configured');
        return;
    }
    // Africa's Talking integration would go here
    logger.info('SMS delivery initiated', { notificationId: notification.id });
}

async function deliverPush(notification: NotificationRecord): Promise<void> {
    if (!config.firebaseProjectId) {
        logger.debug('Push delivery skipped - no Firebase configured');
        return;
    }
    // Firebase Cloud Messaging integration would go here
    logger.info('Push notification initiated', { notificationId: notification.id });
}

async function deliverWhatsApp(notification: NotificationRecord): Promise<void> {
    if (!config.whatsappApiUrl) {
        logger.debug('WhatsApp delivery skipped - not configured');
        return;
    }
    // WhatsApp Business API integration would go here
    logger.info('WhatsApp message initiated', { notificationId: notification.id });
}

async function deliverUSSD(notification: NotificationRecord): Promise<void> {
    // USSD is typically pull-based, log for reference
    logger.info('USSD notification queued', { notificationId: notification.id });
}

async function deliverEmail(notification: NotificationRecord): Promise<void> {
    // Email integration would go here
    logger.info('Email notification initiated', { notificationId: notification.id });
}

async function scheduleRetry(notification: NotificationRecord): Promise<void> {
    if (notification.retryCount >= notification.maxRetries) {
        notification.status = 'failed';
        notification.failureReason = 'Max retries exceeded';
        return;
    }

    const delay = RETRY_DELAYS[notification.retryCount] ?? 60000;
    notification.retryCount++;

    setTimeout(async () => {
        await deliverNotification(notification);
    }, delay);

    logger.info('Notification retry scheduled', { id: notification.id, retryCount: notification.retryCount, delay });
}

export function getNotification(notificationId: UUID): NotificationRecord | null {
    return notificationStore.get(notificationId) ?? null;
}

export function getNotificationsForUser(recipientId: UUID): NotificationRecord[] {
    return Array.from(notificationStore.values()).filter(n => n.recipientId === recipientId);
}

export function setUserPreferences(
    userId: UUID,
    channels: NotificationChannel[],
    quiet?: { start: string; end: string }
): void {
    userPreferences.set(userId, { channels, quiet: quiet ?? null });
}

export function getUserPreferences(userId: UUID) {
    return userPreferences.get(userId) ?? { channels: ['sms', 'push'] as NotificationChannel[], quiet: null };
}

export function markAsDelivered(notificationId: UUID): boolean {
    const notification = notificationStore.get(notificationId);
    if (!notification) return false;
    notification.deliveredAt = new Date().toISOString();
    notification.status = 'delivered';
    return true;
}

export function markAsRead(notificationId: UUID): boolean {
    const notification = notificationStore.get(notificationId);
    if (!notification) return false;
    notification.readAt = new Date().toISOString();
    notification.status = 'read';
    return true;
}

export function clearNotificationData(): void {
    notificationStore.clear();
    userPreferences.clear();
    rateLimitStore.clear();
}
