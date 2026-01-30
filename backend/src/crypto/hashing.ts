import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * SHA-256 hash (fast, for integrity checks)
 */
export function sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * HMAC-SHA256 (for signing)
 */
export function hmacSha256(data: string, key: string): string {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
}

/**
 * Secure random token
 */
export function randomToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
}
