/**
 * Geographic Utility Functions
 * Used for ride matching, distance calculations, and location-based queries
 */

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Calculate estimated time of arrival based on distance
 * @param distanceKm Distance in kilometers
 * @param avgSpeedKmh Average speed in km/h (default 30 for city driving)
 * @returns Estimated time in minutes
 */
export function calculateETA(distanceKm: number, avgSpeedKmh: number = 30): number {
    const timeHours = distanceKm / avgSpeedKmh;
    return Math.ceil(timeHours * 60); // Convert to minutes and round up
}

/**
 * Get a bounding box around a point for efficient geo queries
 * @param lat Center latitude
 * @param lng Center longitude
 * @param radiusKm Radius in kilometers
 * @returns Bounding box coordinates
 */
export function getBoundingBox(
    lat: number,
    lng: number,
    radiusKm: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
    // Approximate degrees per km
    const latDegPerKm = 1 / 110.574;
    const lngDegPerKm = 1 / (111.320 * Math.cos(toRad(lat)));

    const latOffset = radiusKm * latDegPerKm;
    const lngOffset = radiusKm * lngDegPerKm;

    return {
        minLat: lat - latOffset,
        maxLat: lat + latOffset,
        minLng: lng - lngOffset,
        maxLng: lng + lngOffset,
    };
}

/**
 * Check if a point is within a bounding box
 */
export function isWithinBounds(
    lat: number,
    lng: number,
    bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): boolean {
    return (
        lat >= bounds.minLat &&
        lat <= bounds.maxLat &&
        lng >= bounds.minLng &&
        lng <= bounds.maxLng
    );
}

/**
 * Sort locations by distance from a reference point
 */
export function sortByDistance<T extends { lat: number; lng: number }>(
    locations: T[],
    refLat: number,
    refLng: number
): (T & { distance: number })[] {
    return locations
        .map((loc) => ({
            ...loc,
            distance: calculateDistance(refLat, refLng, loc.lat, loc.lng),
        }))
        .sort((a, b) => a.distance - b.distance);
}

/**
 * Encode a location to a simple GeoHash string (for Firebase queries)
 * This is a simplified version - for production, use a full geohash library
 */
export function encodeGeoHash(lat: number, lng: number, precision: number = 6): string {
    const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    let hash = '';
    let minLat = -90, maxLat = 90;
    let minLng = -180, maxLng = 180;
    let isEven = true;
    let bit = 0;
    let ch = 0;

    while (hash.length < precision) {
        if (isEven) {
            const mid = (minLng + maxLng) / 2;
            if (lng >= mid) {
                ch |= 1 << (4 - bit);
                minLng = mid;
            } else {
                maxLng = mid;
            }
        } else {
            const mid = (minLat + maxLat) / 2;
            if (lat >= mid) {
                ch |= 1 << (4 - bit);
                minLat = mid;
            } else {
                maxLat = mid;
            }
        }

        isEven = !isEven;
        if (bit < 4) {
            bit++;
        } else {
            hash += base32[ch];
            bit = 0;
            ch = 0;
        }
    }

    return hash;
}
