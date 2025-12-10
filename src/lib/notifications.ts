'use client';

/**
 * Push Notification Service
 * Uses the Web Push API for browser notifications
 * Integrates with Firebase Realtime Database for real-time updates
 */

import { ref, onValue, off, update } from 'firebase/database';
import { database } from './firebase';

export type NotificationType =
    | 'RIDE_REQUEST'
    | 'RIDE_ACCEPTED'
    | 'DRIVER_ARRIVED'
    | 'RIDE_STARTED'
    | 'RIDE_COMPLETED'
    | 'RIDE_CANCELLED'
    | 'DELIVERY_REQUEST'
    | 'DELIVERY_PICKED_UP'
    | 'DELIVERY_COMPLETED';

export interface AppNotification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    read: boolean;
    createdAt: number;
}

/**
 * Request permission for browser push notifications
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

/**
 * Check if notifications are enabled
 */
export function isNotificationEnabled(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Show a browser push notification
 */
export function showNotification(
    title: string,
    options?: NotificationOptions
): Notification | null {
    if (!isNotificationEnabled()) {
        console.warn('Notifications not enabled');
        return null;
    }

    const notification = new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [200, 100, 200],
        ...options,
    });

    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    return notification;
}

/**
 * Create notification content based on type
 */
export function getNotificationContent(type: NotificationType, data?: Record<string, unknown>): { title: string; body: string } {
    switch (type) {
        case 'RIDE_REQUEST':
            return {
                title: '🚗 New Ride Request!',
                body: `Pickup: ${data?.pickupAddress || 'Unknown location'}`,
            };
        case 'RIDE_ACCEPTED':
            return {
                title: '✅ Ride Accepted!',
                body: `${data?.driverName || 'Your driver'} is on the way`,
            };
        case 'DRIVER_ARRIVED':
            return {
                title: '📍 Driver Arrived!',
                body: 'Your driver has arrived at the pickup location',
            };
        case 'RIDE_STARTED':
            return {
                title: '🚙 Ride Started',
                body: 'Your ride has begun. Enjoy your trip!',
            };
        case 'RIDE_COMPLETED':
            return {
                title: '🎉 Ride Completed!',
                body: `Total fare: K${data?.fare || '0'}`,
            };
        case 'RIDE_CANCELLED':
            return {
                title: '❌ Ride Cancelled',
                body: data?.reason as string || 'The ride has been cancelled',
            };
        case 'DELIVERY_REQUEST':
            return {
                title: '📦 New Delivery Request!',
                body: `Pickup: ${data?.pickupAddress || 'Unknown location'}`,
            };
        case 'DELIVERY_PICKED_UP':
            return {
                title: '📦 Parcel Picked Up',
                body: 'Your parcel is on its way to the destination',
            };
        case 'DELIVERY_COMPLETED':
            return {
                title: '✅ Delivery Completed!',
                body: 'Your parcel has been delivered successfully',
            };
        default:
            return {
                title: 'YABONSE',
                body: 'You have a new notification',
            };
    }
}

/**
 * Subscribe to notifications for a user
 */
export function subscribeToNotifications(
    userId: string,
    onNotification: (notification: AppNotification) => void
): () => void {
    const notificationsRef = ref(database, `notifications/${userId}`);

    const unsubscribe = onValue(notificationsRef, (snapshot) => {
        if (snapshot.exists()) {
            const notifications = snapshot.val();
            // Get the most recent unread notification
            const notificationIds = Object.keys(notifications);
            for (const id of notificationIds.reverse()) {
                const notification = notifications[id] as AppNotification;
                if (!notification.read) {
                    onNotification({ ...notification, id });

                    // Show browser notification
                    const content = getNotificationContent(notification.type, notification.data);
                    showNotification(content.title, { body: content.body });
                }
            }
        }
    });

    return () => off(notificationsRef);
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    const notificationRef = ref(database, `notifications/${userId}/${notificationId}`);
    await update(notificationRef, { read: true });
}

/**
 * Send a notification to a user (writes to Firebase)
 */
export async function sendNotification(
    userId: string,
    type: NotificationType,
    data?: Record<string, unknown>
): Promise<void> {
    const { push, set } = await import('firebase/database');
    const content = getNotificationContent(type, data);

    const notificationRef = push(ref(database, `notifications/${userId}`));
    await set(notificationRef, {
        type,
        title: content.title,
        body: content.body,
        data: data || {},
        read: false,
        createdAt: Date.now(),
    });
}

/**
 * Subscribe to ride status changes
 */
export function subscribeToRideStatus(
    rideId: string,
    onStatusChange: (status: string, rideData: Record<string, unknown>) => void
): () => void {
    const rideRef = ref(database, `rides/${rideId}`);
    let previousStatus: string | null = null;

    const unsubscribe = onValue(rideRef, (snapshot) => {
        if (snapshot.exists()) {
            const ride = snapshot.val();
            if (previousStatus !== null && ride.status !== previousStatus) {
                onStatusChange(ride.status, ride);
            }
            previousStatus = ride.status;
        }
    });

    return () => off(rideRef);
}

/**
 * Subscribe to driver location updates
 */
export function subscribeToDriverLocation(
    driverId: string,
    onLocationUpdate: (location: { lat: number; lng: number }) => void
): () => void {
    const locationRef = ref(database, `driverLocations/${driverId}`);

    const unsubscribe = onValue(locationRef, (snapshot) => {
        if (snapshot.exists()) {
            const location = snapshot.val();
            onLocationUpdate(location);
        }
    });

    return () => off(locationRef);
}
