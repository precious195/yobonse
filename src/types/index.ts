// User Types
export type UserRole = 'CUSTOMER' | 'DRIVER' | 'ADMIN';

export interface User {
    id: string;
    email: string | null;
    phone: string | null;
    name: string;
    role: UserRole;
    avatar: string | null;
    createdAt: number;
    updatedAt: number;
}

// Driver Types
export type DriverStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';

export interface Vehicle {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
}

export interface DriverLocation {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    updatedAt: number;
}

export interface DriverRating {
    average: number;
    count: number;
}

export interface Driver {
    id: string;
    userId: string;
    status: DriverStatus;
    isOnline: boolean;
    currentLocation: DriverLocation | null;
    vehicle: Vehicle;
    rating: DriverRating;
    createdAt: number;
    updatedAt: number;
}

// Document Types
export type DocumentType = 'ID_CARD' | 'DRIVERS_LICENSE' | 'VEHICLE_REGISTRATION' | 'INSURANCE' | 'PROFILE_PHOTO';
export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Document {
    id: string;
    driverId: string;
    type: DocumentType;
    url: string;
    status: DocumentStatus;
    rejectionReason: string | null;
    createdAt: number;
    updatedAt: number;
}

// Ride Types
export type RideStatus = 'REQUESTED' | 'ACCEPTED' | 'ARRIVING' | 'STARTED' | 'COMPLETED' | 'CANCELLED';

export interface Location {
    lat: number;
    lng: number;
    address: string;
}

export interface RideTimestamps {
    requestedAt: number;
    acceptedAt: number | null;
    arrivedAt: number | null;
    startedAt: number | null;
    completedAt: number | null;
    cancelledAt: number | null;
}

export interface Ride {
    id: string;
    riderId: string;
    riderName: string;
    riderPhone: string;
    driverId: string | null;
    driverName: string | null;
    pickup: Location;
    destination: Location;
    status: RideStatus;
    distance: number | null; // in km
    duration: number | null; // in minutes
    fare: number | null;
    timestamps: RideTimestamps;
    cancelReason: string | null;
    paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';
}

// Active Ride (for real-time tracking)
export interface ActiveRide {
    rideId: string;
    riderId: string;
    driverId: string | null;
    status: RideStatus;
    driverLocation: {
        lat: number;
        lng: number;
    } | null;
}

// Ride Request (sent to drivers)
export interface RideRequest {
    rideId: string;
    pickup: Location;
    destination: Location;
    fare: number;
    distance: number;
    expiresAt: number;
}

// Payment Types
export type PaymentMethod = 'CARD' | 'CASH' | 'WALLET';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Payment {
    id: string;
    rideId: string;
    riderId: string;
    driverId: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    status: PaymentStatus;
    stripePaymentId: string | null;
    createdAt: number;
    updatedAt: number;
}

// Rating Types
export interface Rating {
    id: string;
    rideId: string;
    raterId: string;
    rateeId: string;
    score: number; // 1-5
    comment: string | null;
    createdAt: number;
}

// Earnings Types
export interface DriverEarnings {
    today: number;
    week: number;
    month: number;
    total: number;
    trips: {
        today: number;
        week: number;
        month: number;
        total: number;
    };
}

// Stats Types (Admin Dashboard)
export interface AppStats {
    totalUsers: number;
    totalDrivers: number;
    totalRides: number;
    totalRevenue: number;
    activeRides: number;
    onlineDrivers: number;
    totalDeliveries?: number;
}

// Delivery Types
export type DeliveryStatus = 'REQUESTED' | 'ACCEPTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
export type ParcelSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE';

export interface ParcelDetails {
    size: ParcelSize;
    description: string;
    isFragile: boolean;
    isUrgent: boolean;
    weight?: number;
}

export interface RecipientInfo {
    name: string;
    phone: string;
}

export interface DeliveryTimestamps {
    requestedAt: number;
    acceptedAt: number | null;
    pickedUpAt: number | null;
    deliveredAt: number | null;
    cancelledAt: number | null;
}

export interface Delivery {
    id: string;
    senderId: string;
    senderName: string;
    senderPhone: string;
    driverId: string | null;
    driverName: string | null;
    pickup: Location;
    dropoff: Location;
    recipient: RecipientInfo;
    parcel: ParcelDetails;
    status: DeliveryStatus;
    distance: number | null;
    duration: number | null;
    fare: number | null;
    paymentMethod: 'CASH';
    timestamps: DeliveryTimestamps;
    cancelReason: string | null;
    pickupPhoto?: string;
    deliveryPhoto?: string;
}

// Platform Settings (Admin controlled pricing)
export interface PricingSettings {
    // Ride pricing
    rideBaseFare: number;
    ridePerKmRate: number;
    rideMinFare: number;

    // Delivery pricing by parcel size
    deliverySmallBase: number;
    deliveryMediumBase: number;
    deliveryLargeBase: number;
    deliveryExtraLargeBase: number;
    deliveryPerKmRate: number;
    deliveryUrgentFee: number;

    // Currency
    currency: string;
    currencySymbol: string;
}

export interface PlatformSettings {
    pricing: PricingSettings;
    updatedAt: number;
    updatedBy: string;
}
