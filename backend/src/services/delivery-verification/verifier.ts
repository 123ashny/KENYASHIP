import { v4 as uuidv4 } from 'uuid';
import { totp, authenticator } from 'otplib';
import type {
    OTPRecord,
    DeliveryPhoto,
    DeliverySignature,
    DeliveryVerification,
    VerificationMethod,
    UUID,
    RawCoordinates
} from '../../types/index.js';
import { config } from '../../config/index.js';
import { logger, logSecurityEvent } from '../../utils/logger.js';
import { encrypt, decrypt } from '../../crypto/encryption.js';
import { sha256, hmacSha256 } from '../../crypto/hashing.js';
import { calculateDistance } from '../../utils/geo-utils.js';

/**
 * Multi-Factor Delivery Verification System
 * 
 * Implements multiple verification methods:
 * 1. TOTP-based OTP (RFC 6238)
 * 2. Encrypted photo proof with metadata
 * 3. Digital signature capture with integrity verification
 * 4. Geofence verification
 * 5. Fallback methods for low-connectivity
 */

// Configure TOTP
totp.options = {
    digits: config.otpLength,
    step: config.otpTtlSeconds,
    window: 1, // Allow 1 step tolerance
};

// In-memory stores (replace with database)
const otpStore = new Map<UUID, OTPRecord>();
const photoStore = new Map<UUID, DeliveryPhoto>();
const signatureStore = new Map<UUID, DeliverySignature>();
const verificationStore = new Map<UUID, DeliveryVerification>();
const deliverySecrets = new Map<UUID, string>(); // Per-delivery TOTP secrets

// Default geofence radius
const DEFAULT_GEOFENCE_RADIUS = 100; // meters

/**
 * Generate TOTP secret for a delivery
 */
export function generateDeliverySecret(deliveryId: UUID): string {
    const secret = authenticator.generateSecret();
    deliverySecrets.set(deliveryId, secret);

    logger.debug('TOTP secret generated', { deliveryId });
    return secret;
}

/**
 * Generate OTP for delivery verification
 */
export function generateOTP(
    deliveryId: UUID,
    recipientId: UUID
): { otp: string; expiresAt: string } {
    // Get or create secret for this delivery
    let secret = deliverySecrets.get(deliveryId);
    if (!secret) {
        secret = generateDeliverySecret(deliveryId);
    }

    // Generate TOTP
    const otp = totp.generate(secret);

    // Calculate expiration
    const expiresAt = new Date(Date.now() + config.otpTtlSeconds * 1000);

    // Encrypt OTP for storage
    const otpEncrypted = encrypt(otp, deliveryId);

    const record: OTPRecord = {
        id: uuidv4(),
        deliveryId,
        recipientId,
        otpEncrypted,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        attemptCount: 0,
        isVerified: false,
    };

    otpStore.set(record.id, record);

    logger.info('OTP generated', {
        deliveryId,
        otpId: record.id,
        expiresAt: record.expiresAt,
    });

    return { otp, expiresAt: record.expiresAt };
}

/**
 * Verify OTP
 */
export function verifyOTP(
    deliveryId: UUID,
    providedOTP: string
): { isValid: boolean; reason?: string; remainingAttempts?: number } {
    const secret = deliverySecrets.get(deliveryId);

    if (!secret) {
        logSecurityEvent({
            type: 'otp_verification',
            action: 'verify',
            resourceType: 'delivery',
            resourceId: deliveryId,
            result: 'failure',
            details: { reason: 'no_secret' },
        });

        return { isValid: false, reason: 'no_otp_generated' };
    }

    // Find OTP record
    let otpRecord: OTPRecord | undefined;
    for (const record of otpStore.values()) {
        if (record.deliveryId === deliveryId && !record.isVerified) {
            otpRecord = record;
            break;
        }
    }

    if (!otpRecord) {
        return { isValid: false, reason: 'no_pending_otp' };
    }

    // Check expiration
    if (new Date(otpRecord.expiresAt) < new Date()) {
        logSecurityEvent({
            type: 'otp_verification',
            action: 'verify',
            resourceType: 'delivery',
            resourceId: deliveryId,
            result: 'failure',
            details: { reason: 'expired' },
        });

        return { isValid: false, reason: 'otp_expired' };
    }

    // Check max attempts (5 attempts)
    if (otpRecord.attemptCount >= 5) {
        logSecurityEvent({
            type: 'otp_verification',
            action: 'verify',
            resourceType: 'delivery',
            resourceId: deliveryId,
            result: 'failure',
            details: { reason: 'max_attempts' },
        });

        return { isValid: false, reason: 'max_attempts_exceeded', remainingAttempts: 0 };
    }

    // Verify with TOTP library (includes timing protection)
    const isValid = totp.verify({ token: providedOTP, secret });

    otpRecord.attemptCount++;

    if (isValid) {
        otpRecord.isVerified = true;
        otpRecord.verifiedAt = new Date().toISOString();

        logSecurityEvent({
            type: 'otp_verification',
            action: 'verify',
            resourceType: 'delivery',
            resourceId: deliveryId,
            result: 'success',
        });

        logger.info('OTP verified successfully', { deliveryId });

        // Update verification record
        updateVerification(deliveryId, 'otp');

        return { isValid: true };
    }

    logSecurityEvent({
        type: 'otp_verification',
        action: 'verify',
        resourceType: 'delivery',
        resourceId: deliveryId,
        result: 'failure',
        details: { reason: 'invalid_otp', attemptCount: otpRecord.attemptCount },
    });

    return {
        isValid: false,
        reason: 'invalid_otp',
        remainingAttempts: 5 - otpRecord.attemptCount,
    };
}

/**
 * Store encrypted delivery photo
 */
export function storeDeliveryPhoto(
    deliveryId: UUID,
    photoData: Buffer,
    metadata: {
        width: number;
        height: number;
        mimeType: string;
    },
    location?: RawCoordinates
): DeliveryPhoto {
    // Encrypt photo data
    const photoEncrypted = encrypt(photoData.toString('base64'), deliveryId);

    const photo: DeliveryPhoto = {
        id: uuidv4(),
        deliveryId,
        photoEncrypted,
        metadata: {
            ...metadata,
            sizeBytes: photoData.length,
        },
        capturedAt: new Date().toISOString(),
        // Only store zone ID if location provided
        zoneId: location ? undefined : undefined, // Would need obfuscation service
    };

    photoStore.set(photo.id, photo);

    logger.info('Delivery photo stored', {
        deliveryId,
        photoId: photo.id,
        sizeBytes: photo.metadata.sizeBytes,
    });

    // Update verification
    updateVerification(deliveryId, 'photo');

    return photo;
}

/**
 * Retrieve delivery photo (decrypted)
 */
export function getDeliveryPhoto(
    photoId: UUID,
    deliveryId: UUID
): { data: Buffer; metadata: DeliveryPhoto['metadata'] } | null {
    const photo = photoStore.get(photoId);

    if (!photo || photo.deliveryId !== deliveryId) {
        return null;
    }

    try {
        const decrypted = decrypt(photo.photoEncrypted, deliveryId);
        const data = Buffer.from(decrypted, 'base64');

        return { data, metadata: photo.metadata };
    } catch (error) {
        logger.error('Failed to decrypt photo', { photoId, error: (error as Error).message });
        return null;
    }
}

/**
 * Store digital signature
 */
export function storeSignature(
    deliveryId: UUID,
    signatureData: string, // SVG path or base64 image
    signerName?: string
): DeliverySignature {
    // Create hash for integrity
    const signatureHash = sha256(signatureData);

    // Encrypt signature
    const signatureEncrypted = encrypt(signatureData, deliveryId);

    const signature: DeliverySignature = {
        id: uuidv4(),
        deliveryId,
        signatureEncrypted,
        signatureHash,
        capturedAt: new Date().toISOString(),
        signerName: signerName ? encrypt(signerName, deliveryId) : undefined,
    };

    signatureStore.set(signature.id, signature);

    logger.info('Digital signature stored', {
        deliveryId,
        signatureId: signature.id,
    });

    // Update verification
    updateVerification(deliveryId, 'signature');

    return signature;
}

/**
 * Verify signature integrity
 */
export function verifySignatureIntegrity(
    signatureId: UUID,
    deliveryId: UUID
): boolean {
    const signature = signatureStore.get(signatureId);

    if (!signature || signature.deliveryId !== deliveryId) {
        return false;
    }

    try {
        const decrypted = decrypt(signature.signatureEncrypted, deliveryId);
        const currentHash = sha256(decrypted);

        return currentHash === signature.signatureHash;
    } catch {
        return false;
    }
}

/**
 * Verify delivery is within geofence
 */
export function verifyGeofence(
    deliveryId: UUID,
    driverLocation: RawCoordinates,
    deliveryLocation: { latitude: number; longitude: number },
    radiusMeters: number = DEFAULT_GEOFENCE_RADIUS
): { isWithinGeofence: boolean; distance: number } {
    const distance = calculateDistance(driverLocation, deliveryLocation);
    const isWithinGeofence = distance <= radiusMeters;

    logSecurityEvent({
        type: 'geofence_verification',
        action: 'verify',
        resourceType: 'delivery',
        resourceId: deliveryId,
        result: isWithinGeofence ? 'success' : 'failure',
        details: { distance, radius: radiusMeters },
    });

    if (isWithinGeofence) {
        updateVerification(deliveryId, 'geofence');
    }

    return { isWithinGeofence, distance };
}

/**
 * Initialize verification for a delivery
 */
export function initializeVerification(
    deliveryId: UUID,
    requiredMethods: VerificationMethod[]
): DeliveryVerification {
    const verification: DeliveryVerification = {
        id: uuidv4(),
        deliveryId,
        methodsRequired: requiredMethods,
        methodsCompleted: [],
        isComplete: false,
    };

    verificationStore.set(deliveryId, verification);

    logger.info('Verification initialized', {
        deliveryId,
        requiredMethods,
    });

    return verification;
}

/**
 * Update verification status
 */
function updateVerification(deliveryId: UUID, method: VerificationMethod): void {
    const verification = verificationStore.get(deliveryId);

    if (!verification) {
        logger.warn('No verification record found', { deliveryId, method });
        return;
    }

    if (!verification.methodsCompleted.includes(method)) {
        verification.methodsCompleted.push(method);
    }

    // Check if all required methods are complete
    const allComplete = verification.methodsRequired.every(
        m => verification.methodsCompleted.includes(m)
    );

    if (allComplete && !verification.isComplete) {
        verification.isComplete = true;
        verification.completedAt = new Date().toISOString();

        logger.info('Verification completed', { deliveryId });

        logSecurityEvent({
            type: 'delivery_verification',
            action: 'complete',
            resourceType: 'delivery',
            resourceId: deliveryId,
            result: 'success',
            details: { methods: verification.methodsCompleted },
        });
    }
}

/**
 * Get verification status
 */
export function getVerificationStatus(deliveryId: UUID): DeliveryVerification | null {
    return verificationStore.get(deliveryId) ?? null;
}

/**
 * Check if delivery is fully verified
 */
export function isDeliveryVerified(deliveryId: UUID): boolean {
    const verification = verificationStore.get(deliveryId);
    return verification?.isComplete ?? false;
}

/**
 * Get pending verification methods
 */
export function getPendingMethods(deliveryId: UUID): VerificationMethod[] {
    const verification = verificationStore.get(deliveryId);

    if (!verification) {
        return [];
    }

    return verification.methodsRequired.filter(
        m => !verification.methodsCompleted.includes(m)
    );
}

/**
 * Create fallback verification for offline scenarios
 */
export function createFallbackVerification(
    deliveryId: UUID,
    fallbackCode: string
): { isValid: boolean } {
    // Generate expected fallback code from delivery ID
    const expectedCode = hmacSha256(deliveryId, config.hmacSecret).substring(0, 8).toUpperCase();

    const isValid = fallbackCode.toUpperCase() === expectedCode;

    if (isValid) {
        // Mark as verified using fallback
        const verification = verificationStore.get(deliveryId);
        if (verification) {
            verification.isComplete = true;
            verification.completedAt = new Date().toISOString();
            verification.methodsCompleted = ['code'] as VerificationMethod[];
        }

        logSecurityEvent({
            type: 'fallback_verification',
            action: 'verify',
            resourceType: 'delivery',
            resourceId: deliveryId,
            result: 'success',
        });
    }

    return { isValid };
}

/**
 * Clear verification data (for testing)
 */
export function clearVerificationData(): void {
    otpStore.clear();
    photoStore.clear();
    signatureStore.clear();
    verificationStore.clear();
    deliverySecrets.clear();
    logger.info('Verification data cleared');
}
