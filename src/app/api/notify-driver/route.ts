import { NextRequest, NextResponse } from 'next/server';

/**
 * Driver Notification API
 * Sends notifications to drivers about new ride/delivery requests
 * 
 * POST /api/notify-driver
 * Body: { driverId, type, rideId?, deliveryId?, pickupAddress?, fare? }
 */

type NotificationType =
    | 'RIDE_REQUEST'
    | 'RIDE_CANCELLED'
    | 'DELIVERY_REQUEST'
    | 'DELIVERY_CANCELLED';

interface NotificationPayload {
    driverId: string;
    type: NotificationType;
    rideId?: string;
    deliveryId?: string;
    pickupAddress?: string;
    dropoffAddress?: string;
    fare?: number;
    distance?: number;
}

function getNotificationContent(type: NotificationType, data: NotificationPayload): { title: string; body: string } {
    switch (type) {
        case 'RIDE_REQUEST':
            return {
                title: '🚗 New Ride Request!',
                body: `Pickup: ${data.pickupAddress || 'Unknown'}\nFare: K${data.fare || 0}`,
            };
        case 'RIDE_CANCELLED':
            return {
                title: '❌ Ride Cancelled',
                body: 'The customer has cancelled the ride request',
            };
        case 'DELIVERY_REQUEST':
            return {
                title: '📦 New Delivery Request!',
                body: `Pickup: ${data.pickupAddress || 'Unknown'}\nFare: K${data.fare || 0}`,
            };
        case 'DELIVERY_CANCELLED':
            return {
                title: '❌ Delivery Cancelled',
                body: 'The sender has cancelled the delivery request',
            };
        default:
            return {
                title: 'YABONSE',
                body: 'You have a new notification',
            };
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: NotificationPayload = await request.json();
        const { driverId, type, rideId, deliveryId, pickupAddress, fare, distance } = body;

        if (!driverId || !type) {
            return NextResponse.json(
                { error: 'driverId and type are required' },
                { status: 400 }
            );
        }

        // Initialize Firebase
        const { initializeApp, getApps } = await import('firebase/app');
        const { getDatabase, ref, push, set, get } = await import('firebase/database');

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

        // Verify driver exists
        const driverRef = ref(database, `drivers/${driverId}`);
        const driverSnapshot = await get(driverRef);

        if (!driverSnapshot.exists()) {
            return NextResponse.json(
                { error: 'Driver not found' },
                { status: 404 }
            );
        }

        // Create notification
        const content = getNotificationContent(type, body);
        const notificationRef = push(ref(database, `notifications/${driverId}`));

        await set(notificationRef, {
            type,
            title: content.title,
            body: content.body,
            data: {
                rideId,
                deliveryId,
                pickupAddress,
                fare,
                distance,
            },
            read: false,
            createdAt: Date.now(),
        });

        // If it's a ride request, also update the ride with driver assignment
        if (type === 'RIDE_REQUEST' && rideId) {
            const rideRef = ref(database, `rides/${rideId}/notifiedDrivers`);
            await push(rideRef, {
                driverId,
                notifiedAt: Date.now(),
                responded: false,
            });
        }

        // If it's a delivery request, update the delivery
        if (type === 'DELIVERY_REQUEST' && deliveryId) {
            const deliveryRef = ref(database, `deliveries/${deliveryId}/notifiedDrivers`);
            await push(deliveryRef, {
                driverId,
                notifiedAt: Date.now(),
                responded: false,
            });
        }

        return NextResponse.json({
            success: true,
            notificationId: notificationRef.key,
            message: `Notification sent to driver ${driverId}`,
        });

    } catch (error) {
        console.error('Notification error:', error);
        return NextResponse.json(
            { error: 'Failed to send notification' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Driver Notification API',
        usage: 'POST with { driverId, type, rideId?, pickupAddress?, fare? }',
        types: ['RIDE_REQUEST', 'RIDE_CANCELLED', 'DELIVERY_REQUEST', 'DELIVERY_CANCELLED'],
    });
}
