'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Phone,
    MessageSquare,
    Navigation,
    Clock,
    MapPin,
    DollarSign,
    CheckCircle,
    X,
    User
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card, Button, Badge, Modal } from '@/components/ui';
import { RideMap } from '@/components/maps/GoogleMap';
import { ChatBox } from '@/components/chat/ChatBox';
import { ref, onValue, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Ride } from '@/types';
import toast from 'react-hot-toast';

export default function DriverTripDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const rideId = params.id as string;

    const [ride, setRide] = useState<Ride | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showChat, setShowChat] = useState(false);

    // Listen to specific ride by ID
    useEffect(() => {
        if (!rideId) return;

        const rideRef = ref(database, `rides/${rideId}`);
        const unsubscribe = onValue(rideRef, (snapshot) => {
            if (snapshot.exists()) {
                setRide({ id: snapshot.key, ...snapshot.val() } as Ride);
            } else {
                setRide(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [rideId]);

    // Track driver location
    useEffect(() => {
        if (!user?.uid || !ride) return;

        if ('geolocation' in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const loc = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setCurrentLocation(loc);

                    // Update location in Firebase
                    update(ref(database, `driverLocations/${user.uid}`), {
                        ...loc,
                        heading: position.coords.heading || 0,
                        speed: position.coords.speed || 0,
                        updatedAt: Date.now(),
                    });
                },
                (error) => console.error('Location error:', error),
                { enableHighAccuracy: true, maximumAge: 5000 }
            );

            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [user?.uid, ride]);

    const updateRideStatus = async (status: string) => {
        if (!ride) return;

        setActionLoading(true);
        try {
            const updates: Record<string, unknown> = {
                status,
                updatedAt: Date.now(),
            };

            if (status === 'ARRIVING') {
                updates['timestamps/arrivedAt'] = Date.now();
            } else if (status === 'STARTED') {
                updates['timestamps/startedAt'] = Date.now();
            } else if (status === 'COMPLETED') {
                updates['timestamps/completedAt'] = Date.now();
            }

            await update(ref(database, `rides/${ride.id}`), updates);

            if (status === 'COMPLETED') {
                toast.success('Trip completed!');
                router.push('/driver/dashboard');
            } else {
                toast.success('Status updated');
            }
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelTrip = async () => {
        if (!ride) return;

        setActionLoading(true);
        try {
            await update(ref(database, `rides/${ride.id}`), {
                status: 'CANCELLED',
                'timestamps/cancelledAt': Date.now(),
            });
            toast.success('Trip cancelled');
            router.push('/driver/dashboard');
        } catch (error) {
            toast.error('Failed to cancel trip');
        } finally {
            setActionLoading(false);
            setShowCancelModal(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!ride) {
        return (
            <div className="text-center py-12">
                <Navigation className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Trip Not Found</h2>
                <p className="text-gray-400 mb-6">This trip doesn't exist or has been cancelled</p>
                <Button onClick={() => router.push('/driver/dashboard')}>
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    const getActionButton = () => {
        switch (ride.status) {
            case 'ACCEPTED':
                return (
                    <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600"
                        onClick={() => updateRideStatus('ARRIVING')}
                        loading={actionLoading}
                    >
                        <MapPin className="w-5 h-5 mr-2" />
                        I've Arrived at Pickup
                    </Button>
                );
            case 'ARRIVING':
                return (
                    <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                        onClick={() => updateRideStatus('STARTED')}
                        loading={actionLoading}
                    >
                        <Navigation className="w-5 h-5 mr-2" />
                        Start Trip
                    </Button>
                );
            case 'STARTED':
                return (
                    <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600"
                        onClick={() => updateRideStatus('COMPLETED')}
                        loading={actionLoading}
                    >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Complete Trip
                    </Button>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Map */}
                <div className="order-2 lg:order-1">
                    <RideMap
                        pickup={{ lat: ride.pickup.lat, lng: ride.pickup.lng, address: ride.pickup.address }}
                        destination={{ lat: ride.destination.lat, lng: ride.destination.lng, address: ride.destination.address }}
                        driverLocation={currentLocation}
                        showRoute={true}
                        className="h-[500px]"
                    />

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-violet-500 rounded-full"></div>
                            <span className="text-sm text-gray-400">Pickup</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                            <span className="text-sm text-gray-400">Destination</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                            <span className="text-sm text-gray-400">You</span>
                        </div>
                    </div>
                </div>

                {/* Trip Details */}
                <div className="order-1 lg:order-2 space-y-6">
                    {/* Status */}
                    <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-600/10 to-teal-600/10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                            </div>
                            <div>
                                <Badge variant="success" className="mb-1">
                                    {ride.status === 'ACCEPTED' ? 'On the way to pickup' :
                                        ride.status === 'ARRIVING' ? 'At pickup location' :
                                            ride.status === 'STARTED' ? 'Trip in progress' :
                                                ride.status}
                                </Badge>
                                <p className="text-gray-400">Active Trip</p>
                            </div>
                        </div>
                    </Card>

                    {/* Passenger Info */}
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-emerald-400" />
                            Passenger
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                {ride.riderName?.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-white text-lg">{ride.riderName}</p>
                                <p className="text-gray-400">{ride.riderPhone}</p>
                            </div>
                            <div className="flex gap-2">
                                <a href={`tel:${ride.riderPhone}`}>
                                    <Button variant="outline" size="sm">
                                        <Phone className="w-4 h-4" />
                                    </Button>
                                </a>
                                <Button variant="outline" size="sm" onClick={() => setShowChat(true)}>
                                    <MessageSquare className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Route */}
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-4">Route</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Pickup</p>
                                    <p className="text-white">{ride.pickup.address}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Destination</p>
                                    <p className="text-white">{ride.destination.address}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-800">
                            <div className="text-center">
                                <MapPin className="w-5 h-5 mx-auto text-violet-400 mb-1" />
                                <p className="text-lg font-bold text-white">{ride.distance}</p>
                                <p className="text-xs text-gray-400">km</p>
                            </div>
                            <div className="text-center">
                                <Clock className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
                                <p className="text-lg font-bold text-white">{ride.duration}</p>
                                <p className="text-xs text-gray-400">min</p>
                            </div>
                            <div className="text-center">
                                <DollarSign className="w-5 h-5 mx-auto text-amber-400 mb-1" />
                                <p className="text-lg font-bold text-emerald-400">K{((ride.fare || 0) * 0.8).toFixed(0)}</p>
                                <p className="text-xs text-gray-400">earnings</p>
                            </div>
                        </div>
                    </Card>

                    {/* Action Button */}
                    {getActionButton()}

                    {/* Cancel Button */}
                    {['ACCEPTED', 'ARRIVING'].includes(ride.status) && (
                        <Button
                            variant="outline"
                            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                            onClick={() => setShowCancelModal(true)}
                        >
                            <X className="w-5 h-5 mr-2" />
                            Cancel Trip
                        </Button>
                    )}
                </div>
            </div>

            {/* Cancel Modal */}
            <Modal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                title="Cancel Trip"
            >
                <div className="space-y-6">
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <p className="text-red-400">
                            Cancelling trips may affect your driver rating. Are you sure you want to cancel?
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" className="flex-1" onClick={() => setShowCancelModal(false)}>
                            Keep Trip
                        </Button>
                        <Button variant="danger" className="flex-1" onClick={handleCancelTrip} loading={actionLoading}>
                            Cancel Trip
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Chat with Passenger */}
            {user && (
                <ChatBox
                    rideId={rideId}
                    userId={user.uid}
                    userName={ride.driverName || 'Driver'}
                    userRole="DRIVER"
                    isOpen={showChat}
                    onClose={() => setShowChat(false)}
                />
            )}
        </div>
    );
}
