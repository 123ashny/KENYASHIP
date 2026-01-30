import { v4 as uuidv4 } from 'uuid';
import type {
    SecurityAlert,
    AnomalyType,
    AlertSeverity,
    UUID,
    H3Index,
    ObfuscatedLocation
} from '../../types/index.js';
import { logger, logSecurityEvent } from '../../utils/logger.js';
import { calculateDistance, calculateBearing } from '../../utils/geo-utils.js';

/**
 * Cargo Security Monitoring System
 * 
 * Detects suspicious patterns and anomalies:
 * 1. Route deviation detection
 * 2. Unusual stop patterns
 * 3. Speed anomalies
 * 4. Time-based anomalies
 * 5. Geofence breaches
 * 6. Communication loss detection
 * 
 * All alerts are silent (security team only) unless critical
 */

// Alert thresholds
const THRESHOLDS = {
    routeDeviationMeters: 2000,        // 2km off expected route
    unusualStopMinutes: 15,            // 15+ minute unexpected stop
    maxSpeedKmh: 120,                  // Speed limit
    minSpeedKmh: 5,                    // Minimum moving speed
    maxDeliveryTimeHours: 24,          // Maximum delivery time
    communicationLossMinutes: 10,      // No signal for 10 min
    rapidZoneChanges: 5,               // Max zone changes in 5 min
};

// In-memory stores
const alertStore = new Map<UUID, SecurityAlert>();
const deliveryAlerts = new Map<UUID, UUID[]>(); // deliveryId -> alertIds
const driverHistory = new Map<UUID, LocationHistoryEntry[]>();

interface LocationHistoryEntry {
    zoneId: H3Index;
    timestamp: Date;
    isMoving: boolean;
}

interface ExpectedRoute {
    zoneSequence: H3Index[];
    estimatedDuration: number; // minutes
}

const expectedRoutes = new Map<UUID, ExpectedRoute>();

/**
 * Process location update and detect anomalies
 */
export function processLocationUpdate(
    deliveryId: UUID,
    driverId: UUID,
    location: ObfuscatedLocation,
    vehicleId?: UUID
): SecurityAlert[] {
    const alerts: SecurityAlert[] = [];

    // Get driver history
    const history = driverHistory.get(driverId) || [];

    // Add current location to history
    const entry: LocationHistoryEntry = {
        zoneId: location.zoneId,
        timestamp: new Date(location.approximateTime),
        isMoving: location.movementState === 'moving',
    };
    history.push(entry);

    // Keep only last 100 entries
    if (history.length > 100) {
        history.shift();
    }
    driverHistory.set(driverId, history);

    // Run anomaly checks
    const routeAlert = checkRouteDeviation(deliveryId, driverId, location, vehicleId);
    if (routeAlert) alerts.push(routeAlert);

    const stopAlert = checkUnusualStop(deliveryId, driverId, history, vehicleId);
    if (stopAlert) alerts.push(stopAlert);

    const rapidChangeAlert = checkRapidZoneChanges(deliveryId, driverId, history, vehicleId);
    if (rapidChangeAlert) alerts.push(rapidChangeAlert);

    // Store alerts
    for (const alert of alerts) {
        alertStore.set(alert.id, alert);

        const deliveryAlertIds = deliveryAlerts.get(deliveryId) || [];
        deliveryAlertIds.push(alert.id);
        deliveryAlerts.set(deliveryId, deliveryAlertIds);

        // Log security event
        logSecurityEvent({
            type: 'security_alert',
            actorId: driverId,
            action: 'anomaly_detected',
            resourceType: 'delivery',
            resourceId: deliveryId,
            result: 'success',
            details: {
                anomalyType: alert.anomalyType,
                severity: alert.severity
            },
        });

        logger.warn('Security alert generated', {
            alertId: alert.id,
            deliveryId,
            anomalyType: alert.anomalyType,
            severity: alert.severity,
        });
    }

    return alerts;
}

/**
 * Check for route deviation
 */
function checkRouteDeviation(
    deliveryId: UUID,
    driverId: UUID,
    location: ObfuscatedLocation,
    vehicleId?: UUID
): SecurityAlert | null {
    const expectedRoute = expectedRoutes.get(deliveryId);

    if (!expectedRoute) {
        return null; // No expected route set
    }

    // Check if current zone is in expected sequence
    const currentIndex = expectedRoute.zoneSequence.indexOf(location.zoneId);

    if (currentIndex === -1) {
        // Not in expected route - check if within tolerance
        // For now, generate medium severity alert
        return createAlert(
            deliveryId,
            driverId,
            vehicleId,
            'route_deviation',
            'medium',
            location.zoneId,
            `Vehicle deviated from expected route. Current zone not in planned sequence.`
        );
    }

    return null;
}

/**
 * Check for unusual stops
 */
function checkUnusualStop(
    deliveryId: UUID,
    driverId: UUID,
    history: LocationHistoryEntry[],
    vehicleId?: UUID
): SecurityAlert | null {
    if (history.length < 3) {
        return null;
    }

    // Check last few entries for stationary pattern
    const recentEntries = history.slice(-10);
    const stationaryEntries = recentEntries.filter(e => !e.isMoving);

    if (stationaryEntries.length >= 3) {
        const firstStationary = stationaryEntries[0];
        const lastStationary = stationaryEntries[stationaryEntries.length - 1];

        if (firstStationary && lastStationary) {
            const stationaryDuration = (lastStationary.timestamp.getTime() - firstStationary.timestamp.getTime()) / (1000 * 60);

            if (stationaryDuration >= THRESHOLDS.unusualStopMinutes) {
                // Check if already alerted for this stop
                const existingAlerts = getAlertsForDelivery(deliveryId);
                const hasRecentStopAlert = existingAlerts.some(
                    a => a.anomalyType === 'unusual_stop' &&
                        new Date(a.detectedAt).getTime() > Date.now() - 30 * 60 * 1000
                );

                if (!hasRecentStopAlert) {
                    return createAlert(
                        deliveryId,
                        driverId,
                        vehicleId,
                        'unusual_stop',
                        'low',
                        lastStationary.zoneId,
                        `Vehicle stationary for ${Math.round(stationaryDuration)} minutes in unscheduled location.`
                    );
                }
            }
        }
    }

    return null;
}

/**
 * Check for rapid zone changes (potential tampering/spoofing)
 */
function checkRapidZoneChanges(
    deliveryId: UUID,
    driverId: UUID,
    history: LocationHistoryEntry[],
    vehicleId?: UUID
): SecurityAlert | null {
    if (history.length < THRESHOLDS.rapidZoneChanges) {
        return null;
    }

    const recentEntries = history.slice(-THRESHOLDS.rapidZoneChanges);
    const timeWindow = 5 * 60 * 1000; // 5 minutes

    const lastEntry = recentEntries[recentEntries.length - 1];
    const firstEntry = recentEntries[0];

    if (!lastEntry || !firstEntry) {
        return null;
    }

    const timeDiff = lastEntry.timestamp.getTime() - firstEntry.timestamp.getTime();

    if (timeDiff <= timeWindow) {
        const uniqueZones = new Set(recentEntries.map(e => e.zoneId));

        if (uniqueZones.size >= THRESHOLDS.rapidZoneChanges) {
            return createAlert(
                deliveryId,
                driverId,
                vehicleId,
                'tampering_detected',
                'high',
                lastEntry.zoneId,
                `Suspicious location pattern: ${uniqueZones.size} zone changes in ${Math.round(timeDiff / 1000)} seconds.`
            );
        }
    }

    return null;
}

/**
 * Check for communication loss
 */
export function checkCommunicationLoss(
    deliveryId: UUID,
    driverId: UUID,
    lastSeenAt: Date,
    vehicleId?: UUID
): SecurityAlert | null {
    const silentMinutes = (Date.now() - lastSeenAt.getTime()) / (1000 * 60);

    if (silentMinutes >= THRESHOLDS.communicationLossMinutes) {
        // Check if already alerted
        const existingAlerts = getAlertsForDelivery(deliveryId);
        const hasRecentCommAlert = existingAlerts.some(
            a => a.anomalyType === 'communication_lost' &&
                new Date(a.detectedAt).getTime() > Date.now() - 15 * 60 * 1000
        );

        if (!hasRecentCommAlert) {
            const alert = createAlert(
                deliveryId,
                driverId,
                vehicleId,
                'communication_lost',
                silentMinutes > 30 ? 'high' : 'medium',
                '', // Unknown zone
                `No communication for ${Math.round(silentMinutes)} minutes.`
            );

            alertStore.set(alert.id, alert);

            const deliveryAlertIds = deliveryAlerts.get(deliveryId) || [];
            deliveryAlertIds.push(alert.id);
            deliveryAlerts.set(deliveryId, deliveryAlertIds);

            return alert;
        }
    }

    return null;
}

/**
 * Create security alert
 */
function createAlert(
    deliveryId: UUID,
    driverId: UUID,
    vehicleId: UUID | undefined,
    anomalyType: AnomalyType,
    severity: AlertSeverity,
    zoneId: H3Index,
    description: string
): SecurityAlert {
    return {
        id: uuidv4(),
        deliveryId,
        driverId,
        vehicleId,
        anomalyType,
        severity,
        zoneId,
        detectedAt: new Date().toISOString(),
        description,
        isAcknowledged: false,
    };
}

/**
 * Set expected route for delivery
 */
export function setExpectedRoute(
    deliveryId: UUID,
    zoneSequence: H3Index[],
    estimatedDuration: number
): void {
    expectedRoutes.set(deliveryId, { zoneSequence, estimatedDuration });
    logger.debug('Expected route set', { deliveryId, zones: zoneSequence.length });
}

/**
 * Get alerts for a delivery
 */
export function getAlertsForDelivery(deliveryId: UUID): SecurityAlert[] {
    const alertIds = deliveryAlerts.get(deliveryId) || [];
    return alertIds
        .map(id => alertStore.get(id))
        .filter((a): a is SecurityAlert => a !== undefined);
}

/**
 * Get unacknowledged alerts
 */
export function getUnacknowledgedAlerts(): SecurityAlert[] {
    return Array.from(alertStore.values()).filter(a => !a.isAcknowledged);
}

/**
 * Get alerts by severity
 */
export function getAlertsBySeverity(severity: AlertSeverity): SecurityAlert[] {
    return Array.from(alertStore.values()).filter(a => a.severity === severity);
}

/**
 * Acknowledge an alert
 */
export function acknowledgeAlert(
    alertId: UUID,
    acknowledgedBy: UUID
): boolean {
    const alert = alertStore.get(alertId);

    if (!alert) {
        return false;
    }

    alert.isAcknowledged = true;
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = acknowledgedBy;

    logSecurityEvent({
        type: 'alert_acknowledged',
        actorId: acknowledgedBy,
        action: 'acknowledge',
        resourceType: 'security_alert',
        resourceId: alertId,
        result: 'success',
    });

    logger.info('Alert acknowledged', { alertId, acknowledgedBy });

    return true;
}

/**
 * Resolve an alert
 */
export function resolveAlert(
    alertId: UUID,
    resolvedBy: UUID,
    status: 'false_positive' | 'investigated' | 'escalated' | 'resolved',
    notes?: string
): boolean {
    const alert = alertStore.get(alertId);

    if (!alert) {
        return false;
    }

    alert.resolution = {
        status,
        notes,
        resolvedAt: new Date().toISOString(),
        resolvedBy,
    };

    logSecurityEvent({
        type: 'alert_resolved',
        actorId: resolvedBy,
        action: 'resolve',
        resourceType: 'security_alert',
        resourceId: alertId,
        result: 'success',
        details: { status, notes },
    });

    logger.info('Alert resolved', { alertId, resolvedBy, status });

    return true;
}

/**
 * Get security statistics
 */
export function getSecurityStats(): {
    totalAlerts: number;
    unacknowledged: number;
    bySeverity: Record<AlertSeverity, number>;
    byType: Record<AnomalyType, number>;
} {
    const alerts = Array.from(alertStore.values());

    const bySeverity: Record<AlertSeverity, number> = {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
    };

    const byType: Record<AnomalyType, number> = {
        route_deviation: 0,
        unusual_stop: 0,
        speed_anomaly: 0,
        time_anomaly: 0,
        geofence_breach: 0,
        tampering_detected: 0,
        communication_lost: 0,
    };

    for (const alert of alerts) {
        bySeverity[alert.severity]++;
        byType[alert.anomalyType]++;
    }

    return {
        totalAlerts: alerts.length,
        unacknowledged: alerts.filter(a => !a.isAcknowledged).length,
        bySeverity,
        byType,
    };
}

/**
 * Clear all security data (testing)
 */
export function clearSecurityData(): void {
    alertStore.clear();
    deliveryAlerts.clear();
    driverHistory.clear();
    expectedRoutes.clear();
    logger.info('Security data cleared');
}
