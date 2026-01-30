import { RawCoordinates } from '../types/index.js';

/**
 * Calculate distance between two points in meters (Haversine formula)
 */
export function calculateDistance(point1: RawCoordinates, point2: RawCoordinates): number {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = point1.latitude * Math.PI / 180;
    const phi2 = point2.latitude * Math.PI / 180;
    const deltaPhi = (point2.latitude - point1.latitude) * Math.PI / 180;
    const deltaLambda = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Calculate bearing between two points
 */
export function calculateBearing(point1: RawCoordinates, point2: RawCoordinates): number {
    const phi1 = point1.latitude * Math.PI / 180;
    const phi2 = point2.latitude * Math.PI / 180;
    const lambda1 = point1.longitude * Math.PI / 180;
    const lambda2 = point2.longitude * Math.PI / 180;

    const y = Math.sin(lambda2 - lambda1) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) -
        Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda2 - lambda1);

    const theta = Math.atan2(y, x);
    return (theta * 180 / Math.PI + 360) % 360; // Normalize to 0-360
}
