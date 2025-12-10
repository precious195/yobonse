import { NextRequest, NextResponse } from 'next/server';

/**
 * Ride Matching API
 * Finds the nearest available drivers for a ride request
 * 
 * POST /api/ride-matching
 * Body: { pickupLat, pickupLng, rideId?, maxRadius?, limit? }
 */

interface DriverLocation {
    lat: number;
    lng: number;
    updatedAt: number;
}

interface Driver {
    id: string;
    name: string;
    phone: string;
    status: string;
    isOnline: boolean;
    rating: number;
    vehicle?: {
        make: string;
        model: string;
        color: string;
        licensePlate: string;
    };
}

interface MatchedDriver extends Driver {
    distance: number;
    eta: number;
    location: DriverLocation;
}

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

// Calculate ETA based on distance (avg 30 km/h in city)
function calculateETA(distanceKm: number): number {
    return Math.ceil((distanceKm / 30) * 60); // minutes
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { pickupLat, pickupLng, rideId, maxRadius = 10, limit = 5 } = body;

        if (!pickupLat || !pickupLng) {
            return NextResponse.json(
                { error: 'Pickup location required' },
                { status: 400 }
            );
        }

        // Initialize Firebase Admin (client-side for now)
        // In production, use Firebase Admin SDK with service account
        const { initializeApp, getApps } = await import('firebase/app');
        const { getDatabase, ref, get } = await import('firebase/database');

        // Use existing Firebase config
        const firebaseConfig = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        };

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const database = getDatabase(app);

        // Fetch all drivers
        const driversRef = ref(database, 'drivers');
        const driversSnapshot = await get(driversRef);

        // Fetch driver locations
        const locationsRef = ref(database, 'driverLocations');
        const locationsSnapshot = await get(locationsRef);

        if (!driversSnapshot.exists()) {
            return NextResponse.json({ drivers: [], message: 'No drivers found' });
        }

        const drivers = driversSnapshot.val();
        const locations = locationsSnapshot.exists() ? locationsSnapshot.val() : {};

        // Find matching drivers
        const matchedDrivers: MatchedDriver[] = [];

        for (const driverId of Object.keys(drivers)) {
            const driver = drivers[driverId] as Driver;
            const location = locations[driverId] as DriverLocation | undefined;

            // Filter: must be online, approved, and have location
            if (
                driver.status !== 'APPROVED' ||
                !driver.isOnline ||
                !location ||
                !location.lat ||
                !location.lng
            ) {
                continue;
            }

            // Check if location is recent (within last 5 minutes)
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            if (location.updatedAt && location.updatedAt < fiveMinutesAgo) {
                continue; // Skip stale locations
            }

            // Calculate distance
            const distance = calculateDistance(
                pickupLat,
                pickupLng,
                location.lat,
                location.lng
            );

            // Filter by max radius
            if (distance > maxRadius) {
                continue;
            }

            matchedDrivers.push({
                id: driverId,
                ...driver,
                distance: Math.round(distance * 10) / 10, // Round to 1 decimal
                eta: calculateETA(distance),
                location,
            });
        }

        // Sort by distance (primary) and rating (secondary)
        matchedDrivers.sort((a, b) => {
            if (a.distance !== b.distance) {
                return a.distance - b.distance;
            }
            return (b.rating || 0) - (a.rating || 0);
        });

        // Return top N drivers
        const topDrivers = matchedDrivers.slice(0, limit);

        return NextResponse.json({
            drivers: topDrivers,
            total: matchedDrivers.length,
            pickupLocation: { lat: pickupLat, lng: pickupLng },
            searchRadius: maxRadius,
        });

    } catch (error) {
        console.error('Ride matching error:', error);
        return NextResponse.json(
            { error: 'Failed to find drivers' },
            { status: 500 }
        );
    }
}

// GET method for testing
export async function GET() {
    return NextResponse.json({
        message: 'Ride Matching API',
        usage: 'POST with { pickupLat, pickupLng, maxRadius?, limit? }',
    });
}
