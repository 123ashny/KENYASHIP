import { v4 as uuidv4 } from 'uuid';
import type {
    EmergencyRecord,
    EmergencyType,
    RawCoordinates,
    UUID
} from '../../types/index.js';
import { logger, logSecurityEvent } from '../../utils/logger.js';
import { config } from '../../config/index.js';

/**
 * Emergency Response Orchestrator
 * PRIVACY EXCEPTION: Raw coordinates stored for emergencies
 */

const THRESHOLDS = {
    impactGForce: 4.0,
    rapidDeceleration: 3.0,
    consecutiveSamples: 3,
};

const emergencyContacts = new Map<UUID, Array<{ name: string; phone: string; relationship: string }>>();
const emergencyStore = new Map<UUID, EmergencyRecord>();
const activeEmergencies = new Map<UUID, UUID>();
const accelerometerHistory = new Map<UUID, Array<{ x: number; y: number; z: number; timestamp: Date }>>();

export async function triggerPanicButton(
    driverId: UUID,
    location: RawCoordinates,
    deliveryId?: UUID
): Promise<EmergencyRecord> {
    logger.warn('PANIC BUTTON ACTIVATED', { driverId });

    const existingId = activeEmergencies.get(driverId);
    if (existingId) {
        const existing = emergencyStore.get(existingId);
        if (existing?.status === 'triggered') {
            return existing;
        }
    }

    const emergency = createEmergencyRecord(driverId, 'panic_button', location, deliveryId);
    await initiateEmergencyResponse(emergency);
    return emergency;
}

export async function processAccelerometerData(
    driverId: UUID,
    reading: { x: number; y: number; z: number; timestamp: Date },
    location: RawCoordinates,
    deliveryId?: UUID
): Promise<EmergencyRecord | null> {
    const history = accelerometerHistory.get(driverId) || [];
    history.push(reading);
    if (history.length > 30) history.shift();
    accelerometerHistory.set(driverId, history);

    const gForce = Math.sqrt(reading.x ** 2 + reading.y ** 2 + reading.z ** 2);

    if (gForce >= THRESHOLDS.impactGForce && !activeEmergencies.has(driverId)) {
        const emergency = createEmergencyRecord(driverId, 'accident_detected', location, deliveryId);
        await initiateEmergencyResponse(emergency);
        return emergency;
    }
    return null;
}

function createEmergencyRecord(
    driverId: UUID,
    emergencyType: EmergencyType,
    location: RawCoordinates,
    deliveryId?: UUID
): EmergencyRecord {
    const emergency: EmergencyRecord = {
        id: uuidv4(),
        driverId,
        deliveryId,
        emergencyType,
        location,
        triggeredAt: new Date().toISOString(),
        status: 'triggered',
        notificationsent: [],
    };

    emergencyStore.set(emergency.id, emergency);
    activeEmergencies.set(driverId, emergency.id);

    logSecurityEvent({
        type: 'emergency',
        actorId: driverId,
        action: 'trigger',
        resourceType: 'emergency',
        resourceId: emergency.id,
        result: 'success',
        details: { emergencyType },
    });

    return emergency;
}

async function initiateEmergencyResponse(emergency: EmergencyRecord): Promise<void> {
    logger.info('Initiating emergency response', { emergencyId: emergency.id });
    emergency.status = 'responding';
}

export function getEmergency(emergencyId: UUID): EmergencyRecord | null {
    return emergencyStore.get(emergencyId) ?? null;
}

export function getActiveEmergency(driverId: UUID): EmergencyRecord | null {
    const id = activeEmergencies.get(driverId);
    return id ? emergencyStore.get(id) ?? null : null;
}

export function acknowledgeEmergency(emergencyId: UUID, acknowledgedBy: UUID): boolean {
    const emergency = emergencyStore.get(emergencyId);
    if (!emergency) return false;
    emergency.status = 'acknowledged';
    return true;
}

export function resolveEmergency(emergencyId: UUID, resolvedBy: UUID): boolean {
    const emergency = emergencyStore.get(emergencyId);
    if (!emergency) return false;
    emergency.status = 'resolved';
    activeEmergencies.delete(emergency.driverId);
    return true;
}

export function getAllActiveEmergencies(): EmergencyRecord[] {
    return Array.from(emergencyStore.values()).filter(e => e.status !== 'resolved');
}

export function setEmergencyContacts(
    driverId: UUID,
    contacts: Array<{ name: string; phone: string; relationship: string }>
): void {
    emergencyContacts.set(driverId, contacts);
}

export function getEmergencyContacts(driverId: UUID) {
    return emergencyContacts.get(driverId) || [];
}

export function clearEmergencyData(): void {
    emergencyStore.clear();
    activeEmergencies.clear();
    accelerometerHistory.clear();
}
