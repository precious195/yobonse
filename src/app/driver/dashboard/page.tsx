'use client';

import { useEffect, useState } from 'react';
import {
    Power,
    MapPin,
    Clock,
    DollarSign,
    Car,
    Star,
    Navigation,
    AlertCircle,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card, Button, Badge, StatsCard, Modal } from '@/components/ui';
import { ref, onValue, set, update, push } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Driver, Ride, RideRequest, DriverEarnings } from '@/types';
import toast from 'react-hot-toast';

export default function DriverDashboard() {
    const { user, userData } = useAuth();
    const [driver, setDriver] = useState<Driver | null>(null);
    const [earnings, setEarnings] = useState<DriverEarnings | null>(null);
    const [incomingRide, setIncomingRide] = useState<RideRequest | null>(null);
    const [activeRide, setActiveRide] = useState<Ride | null>(null);
    const [loading, setLoading] = useState(true);
    const [togglingOnline, setTogglingOnline] = useState(false);

    useEffect(() => {
        if (!user?.uid) return;

        // Listen to driver data
        const driverRef = ref(database, `drivers/${user.uid}`);
        const unsubDriver = onValue(driverRef, (snapshot) => {
            if (snapshot.exists()) {
                setDriver({ id: snapshot.key, ...snapshot.val() } as Driver);
            }
            setLoading(false);
        });

        // Listen to earnings
        const earningsRef = ref(database, `earnings/${user.uid}`);
        const unsubEarnings = onValue(earningsRef, (snapshot) => {
            if (snapshot.exists()) {
                setEarnings(snapshot.val() as DriverEarnings);
            }
        });

        // Listen to ride requests
        const requestsRef = ref(database, `rideRequests/${user.uid}`);
        const unsubRequests = onValue(requestsRef, (snapshot) => {
            if (snapshot.exists()) {
                const requests = snapshot.val();
                const rideIds = Object.keys(requests);
                if (rideIds.length > 0) {
                    const latestRequest = requests[rideIds[0]];
                    // Check if request hasn't expired
                    if (latestRequest.expiresAt > Date.now()) {
                        setIncomingRide(latestRequest);
                    }
                }
            } else {
                setIncomingRide(null);
            }
        });

        // Listen to active rides
        const ridesRef = ref(database, 'rides');
        const unsubRides = onValue(ridesRef, (snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    const ride = { id: child.key, ...child.val() } as Ride;
                    if (ride.driverId === user.uid &&
                        ['ACCEPTED', 'ARRIVING', 'STARTED'].includes(ride.status)) {
                        setActiveRide(ride);
                        return true;
                    }
                });
            }
        });

        return () => {
            unsubDriver();
            unsubEarnings();
            unsubRequests();
            unsubRides();
        };
    }, [user?.uid]);

    // Toggle online status
    const toggleOnline = async () => {
        if (!user?.uid || !driver) return;
        if (driver.status !== 'APPROVED') {
            toast.error('Your account must be approved to go online');
            return;
        }

        setTogglingOnline(true);
        try {
            await update(ref(database, `drivers/${user.uid}`), {
                isOnline: !driver.isOnline,
                updatedAt: Date.now(),
            });

            if (!driver.isOnline) {
                // Starting location tracking
                startLocationTracking();
                toast.success("You're now online!");
            } else {
                // Stop location tracking
                stopLocationTracking();
                toast.success("You're now offline");
            }
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setTogglingOnline(false);
        }
    };

    // Start GPS tracking
    const startLocationTracking = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.watchPosition(
                async (position) => {
                    const { latitude, longitude, heading, speed } = position.coords;
                    await set(ref(database, `driverLocations/${user?.uid}`), {
                        lat: latitude,
                        lng: longitude,
                        heading: heading || 0,
                        speed: speed || 0,
                        updatedAt: Date.now(),
                    });
                },
                (error) => {
                    console.error('Location error:', error);
                    toast.error('Unable to get your location');
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 5000,
                    timeout: 10000,
                }
            );
        }
    };

    const stopLocationTracking = () => {
        // In production, you'd store the watchId and clear it
    };

    // Accept ride
    const acceptRide = async () => {
        if (!incomingRide || !user?.uid || !userData) return;

        try {
            // Update ride with driver info
            await update(ref(database, `rides/${incomingRide.rideId}`), {
                driverId: user.uid,
                driverName: userData.name,
                status: 'ACCEPTED',
                'timestamps/acceptedAt': Date.now(),
            });

            // Update active ride
            await update(ref(database, `activeRides/${incomingRide.rideId}`), {
                driverId: user.uid,
                status: 'ACCEPTED',
            });

            // Remove ride request
            await set(ref(database, `rideRequests/${user.uid}/${incomingRide.rideId}`), null);

            toast.success('Ride accepted!');
            setIncomingRide(null);
        } catch (error) {
            toast.error('Failed to accept ride');
        }
    };

    // Reject ride
    const rejectRide = async () => {
        if (!incomingRide || !user?.uid) return;

        try {
            await set(ref(database, `rideRequests/${user.uid}/${incomingRide.rideId}`), null);
            setIncomingRide(null);
        } catch (error) {
            toast.error('Failed to reject ride');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    // Pending verification state
    if (driver?.status === 'PENDING') {
        return (
            <div className="max-w-2xl mx-auto text-center py-12">
                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-amber-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Verification Pending</h1>
                <p className="text-gray-400 mb-8">
                    Your documents are being reviewed by our team. This usually takes 1-2 business days.
                    We'll notify you once your account is approved.
                </p>
                <Card className="text-left">
                    <h2 className="font-semibold text-white mb-4">What happens next?</h2>
                    <ul className="space-y-3 text-gray-400">
                        <li className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                            <span>Our team reviews your documents</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                            <span>Background check is performed</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-amber-400 mt-0.5" />
                            <span>You'll receive approval notification</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                            <span>Start accepting rides and earning!</span>
                        </li>
                    </ul>
                </Card>
            </div>
        );
    }

    // Rejected state
    if (driver?.status === 'REJECTED') {
        return (
            <div className="max-w-2xl mx-auto text-center py-12">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-10 h-10 text-red-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Application Rejected</h1>
                <p className="text-gray-400 mb-8">
                    Unfortunately, your application was not approved. Please check your documents and try again.
                </p>
                <Button>
                    Resubmit Documents
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header with Online Toggle */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        {driver?.isOnline ? "You're Online" : "You're Offline"}
                    </h1>
                    <p className="text-gray-400 mt-1">
                        {driver?.isOnline
                            ? 'Ready to accept ride requests'
                            : 'Go online to start accepting rides'}
                    </p>
                </div>

                <Button
                    size="lg"
                    variant={driver?.isOnline ? 'danger' : 'primary'}
                    onClick={toggleOnline}
                    loading={togglingOnline}
                    className={driver?.isOnline ? 'bg-gradient-to-r from-red-600 to-rose-600' : 'bg-gradient-to-r from-emerald-600 to-teal-600'}
                >
                    <Power className="w-5 h-5 mr-2" />
                    {driver?.isOnline ? 'Go Offline' : 'Go Online'}
                </Button>
            </div>

            {/* Active Ride Card */}
            {activeRide && (
                <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-600/10 to-teal-600/10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                            Active Trip
                        </h2>
                        <Badge variant="success">{activeRide.status}</Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Pickup</p>
                                    <p className="text-white">{activeRide.pickup.address}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Destination</p>
                                    <p className="text-white">{activeRide.destination.address}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl">
                            <div className="flex-1">
                                <p className="text-sm text-gray-400">Passenger</p>
                                <p className="font-semibold text-white">{activeRide.riderName}</p>
                                <p className="text-sm text-gray-400">{activeRide.riderPhone}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-white">${activeRide.fare?.toFixed(2)}</p>
                                <p className="text-sm text-gray-400">{activeRide.distance} km</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <a href={`/driver/trip/${activeRide.id}`}>
                            <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600">
                                <Navigation className="w-5 h-5 mr-2" />
                                View Trip Details
                            </Button>
                        </a>
                    </div>
                </Card>
            )}

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
                <StatsCard
                    title="Today's Earnings"
                    value={`$${earnings?.today?.toFixed(2) || '0.00'}`}
                    icon={<DollarSign className="w-5 h-5" />}
                />
                <StatsCard
                    title="Today's Trips"
                    value={earnings?.trips?.today || 0}
                    icon={<Car className="w-5 h-5" />}
                />
                <StatsCard
                    title="This Week"
                    value={`$${earnings?.week?.toFixed(2) || '0.00'}`}
                    icon={<DollarSign className="w-5 h-5" />}
                />
                <StatsCard
                    title="Rating"
                    value={driver?.rating?.average?.toFixed(1) || '0.0'}
                    icon={<Star className="w-5 h-5" />}
                />
            </div>

            {/* Waiting for Rides */}
            {driver?.isOnline && !activeRide && !incomingRide && (
                <Card className="text-center py-12">
                    <div className="animate-pulse">
                        <Car className="w-16 h-16 mx-auto text-emerald-400 mb-4" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Waiting for ride requests...</h3>
                    <p className="text-gray-400">Stay in a busy area to get more requests</p>
                </Card>
            )}

            {/* Incoming Ride Modal */}
            <Modal
                isOpen={!!incomingRide}
                onClose={rejectRide}
                title="New Ride Request"
                size="md"
            >
                {incomingRide && (
                    <div className="space-y-6">
                        <div className="text-center py-4">
                            <p className="text-4xl font-bold text-white">${incomingRide.fare.toFixed(2)}</p>
                            <p className="text-gray-400">{incomingRide.distance.toFixed(1)} km</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Pickup</p>
                                    <p className="text-white">{incomingRide.pickup.address}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Destination</p>
                                    <p className="text-white">{incomingRide.destination.address}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" onClick={rejectRide}>
                                <XCircle className="w-5 h-5 mr-2" />
                                Decline
                            </Button>
                            <Button
                                onClick={acceptRide}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600"
                            >
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Accept
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
