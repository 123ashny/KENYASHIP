import { hmacSha256 } from '../../crypto/hashing.js';
import { config } from '../../config/index.js';
import type { DeliveryCode, UUID } from '../../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const THEMES = {
    safari: ['LION', 'ZEBRA', 'RHINO', 'LEOPARD', 'BUFFALO', 'ACACIA', 'SAVANNA'],
    coastal: ['OCEAN', 'WAVE', 'CORAL', 'PALM', 'DNOW', 'REEF', 'SAND'],
    mountain: ['PEAK', 'RIDGE', 'CLIFF', 'ICE', 'SNOW', 'SUMMIT', 'ALPINE'],
    tech: ['CYBER', 'NANO', 'QUANTUM', 'DATA', 'SYNC', 'GRID', 'LINK'],
};

export function generateDeliveryCode(
    deliveryId: UUID,
    userId: UUID,
    theme: keyof typeof THEMES = 'safari'
): DeliveryCode {
    // Deterministic generation based on deliveryId + userId + secret
    const hash = hmacSha256(`${deliveryId}:${userId}`, config.hmacSecret);

    // Pick words from theme based on hash segments
    const wordList = THEMES[theme] || THEMES.safari;
    const idx1 = parseInt(hash.substring(0, 2), 16) % wordList.length;
    const idx2 = parseInt(hash.substring(2, 4), 16) % wordList.length;
    const suffix = hash.substring(4, 6).toUpperCase();

    const code = `${wordList[idx1]}-${wordList[idx2]}-${suffix}`;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    return {
        id: uuidv4(),
        deliveryId,
        code,
        theme,
        expiresAt: expiresAt.toISOString(),
        usedAt: null,
        generatedBy: userId,
        createdAt: now.toISOString(),
    };
}

export function validateDeliveryCode(providedCode: string, expectedCode: string): boolean {
    return providedCode.trim().toUpperCase() === expectedCode.trim().toUpperCase();
}
