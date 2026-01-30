import crypto from 'crypto';
import { config } from '../config/index.js';

const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts text using AES-256-GCM
 * Derives unique key per context (e.g. deliveryId) using HMAC-SHA256
 */
export function encrypt(text: string, contextId: string): string {
    // Derive a unique key for this context from the master encryption key
    // This ensures that even if one delivery's key is compromised (unlikely in memory), others are safe
    // HKDF would be better but simple HMAC KDF is sufficient for this scope
    const derivedKey = crypto.createHmac('sha256', config.encryptionKey)
        .update(contextId)
        .digest(); // 32 bytes for AES-256

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag().toString('base64');

    // Format: iv:authTag:encrypted
    return `${iv.toString('base64')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts text using AES-256-GCM
 */
export function decrypt(encryptedText: string, contextId: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encryption format');
    }

    const [ivBase64, authTagBase64, encryptedBase64] = parts;

    if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
        throw new Error('Invalid encryption format');
    }

    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    const derivedKey = crypto.createHmac('sha256', config.encryptionKey)
        .update(contextId)
        .digest();

    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
