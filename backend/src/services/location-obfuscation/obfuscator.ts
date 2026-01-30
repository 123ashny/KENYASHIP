import h3 from 'h3-js';
import type { ObfuscatedLocation, RawCoordinates } from '../../types/index.js';

const MIN_RESOLUTION = 7; // ~1.2km edge
const MAX_RESOLUTION = 9; // ~170m edge

export function obfuscateLocation(
    coords: RawCoordinates,
    resolution: number = 8
): ObfuscatedLocation {
    // Clamp resolution
    const res = Math.max(MIN_RESOLUTION, Math.min(resolution, MAX_RESOLUTION));

    // Get H3 index
    const zoneId = h3.latLngToCell(coords.latitude, coords.longitude, res);

    return {
        zoneId,
        approximateTime: new Date().toISOString(),
        movementState: 'unknown',
        resolution: res,
        // In a real app we might lookup a friendly name for the zone
        zoneDescription: `Zone level ${res}`
    };
}

export function areZonesAdjacent(zoneA: string, zoneB: string): boolean {
    return h3.areNeighborCells(zoneA, zoneB);
}

export function getZoneCenter(zoneId: string): RawCoordinates {
    const [lat, lng] = h3.cellToLatLng(zoneId);
    return { latitude: lat, longitude: lng };
}
