/**
 * Ride Service
 * Handles ride creation, matching, and status updates
 */

import { ref, push, set, update, get, onValue, off } from 'firebase/database';
import { database } from './firebase';
import { Ride, Location } from '@/types';

export interface CreateRideParams {
    riderId: string;
    riderName: string;
    riderPhone: string;
    pickup: Location;
    destination: Location;
    fare: number;
    distance: number;
    duration: number;
    paymentMethod: 'CASH' | 'CARD';
}

export interface MatchedDriver {
    id: string;
    name: string;
    distance: number;
    eta: number;
    rating: number;
    vehicle?: {
        make: string;
        model: string;
        color: string;
        licensePlate: string;
    };
}

/**
 * Create a new ride request
 */
export async function createRide(params: CreateRideParams): Promise<string> {
    const rideRef = push(ref(database, 'rides'));

    const rideData = {
        riderId: params.riderId,
        riderName: params.riderName,
        riderPhone: params.riderPhone,
        pickup: params.pickup,
        destination: params.destination,
        status: 'REQUESTED' as const,
        fare: params.fare,
        distance: params.distance,
        duration: params.duration,
        paymentMethod: params.paymentMethod,
        timestamps: {
            requestedAt: Date.now(),
            acceptedAt: null,
            arrivedAt: null,
            startedAt: null,
            completedAt: null,
            cancelledAt: null,
        },
    };

    await set(rideRef, rideData);
    return rideRef.key!;
}

/**
 * Find and notify nearby drivers
 */
export async function findAndNotifyDrivers(
    rideId: string,
    pickupLat: number,
    pickupLng: number,
    pickupAddress: string,
    fare: number
): Promise<MatchedDriver[]> {
    try {
        // Call the ride matching API
        const response = await fetch('/api/ride-matching', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pickupLat,
                pickupLng,
                rideId,
                maxRadius: 15, // 15km radius
                limit: 5,
            }),
        });

        const result = await response.json();

        if (!result.drivers || result.drivers.length === 0) {
            return [];
        }

        // Notify the closest driver first
        const closestDriver = result.drivers[0];
        await notifyDriver(closestDriver.id, rideId, pickupAddress, fare);

        // Update ride with matched drivers
        const rideRef = ref(database, `rides/${rideId}`);
        await update(rideRef, {
            matchedDrivers: result.drivers.map((d: MatchedDriver) => ({
                id: d.id,
                distance: d.distance,
                eta: d.eta,
                notified: d.id === closestDriver.id,
            })),
            currentDriverId: closestDriver.id,
        });

        return result.drivers;
    } catch (error) {
        console.error('Error finding drivers:', error);
        return [];
    }
}

/**
 * Notify a specific driver about a ride
 */
export async function notifyDriver(
    driverId: string,
    rideId: string,
    pickupAddress: string,
    fare: number
): Promise<boolean> {
    try {
        const response = await fetch('/api/notify-driver', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                driverId,
                type: 'RIDE_REQUEST',
                rideId,
                pickupAddress,
                fare,
            }),
        });

        return response.ok;
    } catch (error) {
        console.error('Error notifying driver:', error);
        return false;
    }
}

/**
 * Driver accepts a ride
 */
export async function acceptRide(
    rideId: string,
    driverId: string,
    driverName: string,
    driverPhone: string,
    vehicle: { make: string; model: string; color: string; licensePlate: string }
): Promise<boolean> {
    try {
        const rideRef = ref(database, `rides/${rideId}`);

        await update(rideRef, {
            status: 'ACCEPTED',
            driverId,
            driverName,
            driverPhone,
            vehicle,
            'timestamps/acceptedAt': Date.now(),
        });

        // Update driver status
        const driverRef = ref(database, `drivers/${driverId}`);
        await update(driverRef, {
            currentRideId: rideId,
        });

        return true;
    } catch (error) {
        console.error('Error accepting ride:', error);
        return false;
    }
}

/**
 * Driver rejects a ride - notify next driver
 */
export async function rejectRide(rideId: string, driverId: string): Promise<void> {
    try {
        const rideRef = ref(database, `rides/${rideId}`);
        const rideSnapshot = await get(rideRef);

        if (!rideSnapshot.exists()) return;

        const ride = rideSnapshot.val();
        const matchedDrivers = ride.matchedDrivers || [];

        // Find next unnotified driver
        const nextDriver = matchedDrivers.find(
            (d: { id: string; notified: boolean }) => !d.notified && d.id !== driverId
        );

        if (nextDriver) {
            // Notify next driver
            await notifyDriver(
                nextDriver.id,
                rideId,
                ride.pickup?.address || 'Unknown',
                ride.fare
            );

            // Update matched drivers
            const updatedDrivers = matchedDrivers.map(
                (d: { id: string; notified: boolean; rejected?: boolean }) => ({
                    ...d,
                    notified: d.id === nextDriver.id ? true : d.notified,
                    rejected: d.id === driverId ? true : d.rejected,
                })
            );

            await update(rideRef, {
                matchedDrivers: updatedDrivers,
                currentDriverId: nextDriver.id,
            });
        } else {
            // No more drivers available
            await update(rideRef, {
                status: 'NO_DRIVERS',
                'timestamps/noDriversAt': Date.now(),
            });
        }
    } catch (error) {
        console.error('Error rejecting ride:', error);
    }
}

/**
 * Update ride status
 */
export async function updateRideStatus(
    rideId: string,
    status: Ride['status'],
    additionalData?: Record<string, unknown>
): Promise<void> {
    const rideRef = ref(database, `rides/${rideId}`);

    const updateData: Record<string, unknown> = {
        status,
        ...additionalData,
    };

    // Add timestamp based on status
    const timestampKey = `timestamps/${status.toLowerCase()}At`;
    updateData[timestampKey] = Date.now();

    await update(rideRef, updateData);
}

/**
 * Subscribe to ride updates
 */
export function subscribeToRide(
    rideId: string,
    callback: (ride: Ride | null) => void
): () => void {
    const rideRef = ref(database, `rides/${rideId}`);

    const unsubscribe = onValue(rideRef, (snapshot) => {
        if (snapshot.exists()) {
            callback({ id: rideId, ...snapshot.val() } as Ride);
        } else {
            callback(null);
        }
    });

    return () => off(rideRef);
}

/**
 * Cancel a ride
 */
export async function cancelRide(
    rideId: string,
    cancelledBy: 'RIDER' | 'DRIVER',
    reason?: string
): Promise<void> {
    const rideRef = ref(database, `rides/${rideId}`);

    await update(rideRef, {
        status: 'CANCELLED',
        cancelledBy,
        cancellationReason: reason || 'No reason provided',
        'timestamps/cancelledAt': Date.now(),
    });
}
