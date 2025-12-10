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
}
