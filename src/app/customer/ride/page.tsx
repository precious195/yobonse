'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    MapPin,
    Navigation,
    Clock,
    DollarSign,
    Car,
    CreditCard,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card, Button, Input, Badge } from '@/components/ui';
import { ref, push, set, serverTimestamp } from 'firebase/database';
import { database } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function BookRidePage() {
    const router = useRouter();
    const { user, userData } = useAuth();

    const [pickup, setPickup] = useState({
        address: '',
        lat: 0,
        lng: 0,
    });

    const [destination, setDestination] = useState({
        address: '',
        lat: 0,
        lng: 0,
    });

    const [loading, setLoading] = useState(false);
    const [estimating, setEstimating] = useState(false);
    const [estimate, setEstimate] = useState<{
        fare: number;
        distance: number;
        duration: number;
    } | null>(null);

    // Simulate getting coordinates from address (in production, use Geocoding API)
    const geocodeAddress = async (address: string) => {
        // Simulated coordinates - replace with actual geocoding
        return {
            lat: 40.7128 + (Math.random() - 0.5) * 0.1,
            lng: -74.0060 + (Math.random() - 0.5) * 0.1,
        };
    };

    // Calculate fare estimate
    const calculateEstimate = async () => {
        if (!pickup.address || !destination.address) {
            toast.error('Please enter both pickup and destination');
            return;
        }

        setEstimating(true);
        try {
            // Get coordinates
            const pickupCoords = await geocodeAddress(pickup.address);
            const destCoords = await geocodeAddress(destination.address);

            setPickup({ ...pickup, ...pickupCoords });
            setDestination({ ...destination, ...destCoords });

            // Calculate distance (simplified - use actual routing API in production)
            const distance = Math.sqrt(
                Math.pow((destCoords.lat - pickupCoords.lat) * 111, 2) +
                Math.pow((destCoords.lng - pickupCoords.lng) * 111 * Math.cos(pickupCoords.lat * Math.PI / 180), 2)
            );

            // Estimate duration (assuming average speed of 30 km/h in city)
            const duration = Math.round((distance / 30) * 60);

            // Calculate fare ($2 base + $1.50/km + $0.25/min)
            const fare = 2 + (distance * 1.5) + (duration * 0.25);

            setEstimate({
                fare: Math.round(fare * 100) / 100,
                distance: Math.round(distance * 10) / 10,
                duration: Math.max(5, duration), // Minimum 5 minutes
            });
        } catch (error) {
            toast.error('Error calculating estimate');
        } finally {
            setEstimating(false);
        }
    };

    // Request ride
    const requestRide = async () => {
        if (!estimate || !user || !userData) {
            toast.error('Please calculate estimate first');
            return;
        }

        setLoading(true);
        try {
            const rideRef = push(ref(database, 'rides'));
            const rideId = rideRef.key;

            const rideData = {
                riderId: user.uid,
                riderName: userData.name,
                riderPhone: userData.phone || '',
                driverId: null,
                driverName: null,
                pickup: {
                    lat: pickup.lat,
                    lng: pickup.lng,
                    address: pickup.address,
                },
                destination: {
                    lat: destination.lat,
                    lng: destination.lng,
                    address: destination.address,
                },
                status: 'REQUESTED',
                distance: estimate.distance,
                duration: estimate.duration,
                fare: estimate.fare,
                timestamps: {
                    requestedAt: Date.now(),
                    acceptedAt: null,
                    arrivedAt: null,
                    startedAt: null,
                    completedAt: null,
                    cancelledAt: null,
                },
                cancelReason: null,
            };

            await set(rideRef, rideData);

            // Also add to active rides for real-time tracking
            await set(ref(database, `activeRides/${rideId}`), {
                riderId: user.uid,
                driverId: null,
                status: 'REQUESTED',
                driverLocation: null,
            });

            toast.success('Ride requested! Finding a driver...');
            router.push(`/customer/ride/${rideId}`);
        } catch (error) {
            console.error('Error requesting ride:', error);
            toast.error('Error requesting ride');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Book a Ride</h1>
                <p className="text-gray-400">Enter your pickup and destination to get started</p>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
                {/* Booking Form */}
                <div className="lg:col-span-3 space-y-6">
                    <Card>
                        <h2 className="text-lg font-semibold text-white mb-6">Trip Details</h2>

                        <div className="space-y-4">
                            {/* Pickup Location */}
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-violet-500 rounded-full z-10"></div>
                                <Input
                                    placeholder="Enter pickup location"
                                    value={pickup.address}
                                    onChange={(e) => setPickup({ ...pickup, address: e.target.value })}
                                    className="pl-10"
                                />
                            </div>

                            {/* Connector Line */}
                            <div className="flex items-center pl-5">
                                <div className="w-0.5 h-8 bg-gray-700"></div>
                            </div>

                            {/* Destination */}
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full z-10"></div>
                                <Input
                                    placeholder="Enter destination"
                                    value={destination.address}
                                    onChange={(e) => setDestination({ ...destination, address: e.target.value })}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full mt-6"
                            onClick={calculateEstimate}
                            loading={estimating}
                            variant="secondary"
                        >
                            <Navigation className="w-5 h-5 mr-2" />
                            Calculate Fare
                        </Button>
                    </Card>

                    {/* Map Placeholder */}
                    <Card className="h-64 flex items-center justify-center bg-gray-800/50">
                        <div className="text-center">
                            <MapPin className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                            <p className="text-gray-400">Map will be displayed here</p>
                            <p className="text-sm text-gray-500">Connect Mapbox or Google Maps API</p>
                        </div>
                    </Card>
                </div>

                {/* Fare Estimate & Confirm */}
                <div className="lg:col-span-2 space-y-6">
                    {estimate ? (
                        <>
                            <Card className="bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border-violet-500/30">
                                <h2 className="text-lg font-semibold text-white mb-4">Fare Estimate</h2>

                                <div className="text-center py-4">
                                    <p className="text-5xl font-bold text-white">${estimate.fare.toFixed(2)}</p>
                                    <p className="text-gray-400 mt-2">Estimated fare</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="p-4 bg-gray-800/50 rounded-xl text-center">
                                        <Clock className="w-6 h-6 mx-auto text-violet-400 mb-2" />
                                        <p className="text-xl font-semibold text-white">{estimate.duration} min</p>
                                        <p className="text-sm text-gray-400">Duration</p>
                                    </div>
                                    <div className="p-4 bg-gray-800/50 rounded-xl text-center">
                                        <Navigation className="w-6 h-6 mx-auto text-emerald-400 mb-2" />
                                        <p className="text-xl font-semibold text-white">{estimate.distance} km</p>
                                        <p className="text-sm text-gray-400">Distance</p>
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <h2 className="text-lg font-semibold text-white mb-4">Payment Method</h2>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl cursor-pointer border-2 border-violet-500">
                                        <input type="radio" name="payment" defaultChecked className="text-violet-600" />
                                        <CreditCard className="w-6 h-6 text-gray-400" />
                                        <span className="text-white">Credit/Debit Card</span>
                                        <Badge variant="success" className="ml-auto">Default</Badge>
                                    </label>
                                    <label className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl cursor-pointer border border-gray-700">
                                        <input type="radio" name="payment" className="text-violet-600" />
                                        <DollarSign className="w-6 h-6 text-gray-400" />
                                        <span className="text-white">Cash</span>
                                    </label>
                                </div>
                            </Card>

                            <Button
                                className="w-full"
                                size="lg"
                                onClick={requestRide}
                                loading={loading}
                            >
                                <Car className="w-5 h-5 mr-2" />
                                Request Ride
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </>
                    ) : (
                        <Card className="text-center py-12">
                            <Car className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">Enter Trip Details</h3>
                            <p className="text-gray-400">Enter pickup and destination to see fare estimate</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
