'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    MapPin,
    Navigation,
    DollarSign,
    Clock,
    Banknote,
    Car,
    Zap,
    ChevronUp,
    ChevronDown,
    X,
    Target,
    Locate
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card, Button, Badge } from '@/components/ui';
import { RideMap, PlacesAutocomplete } from '@/components/maps/GoogleMap';
import { ref, push, set, get, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { PricingSettings, Location } from '@/types';

// Default pricing (will be overridden by Firebase)
const DEFAULT_PRICING: PricingSettings = {
    rideBaseFare: 15,
    ridePerKmRate: 5,
    rideMinFare: 20,
    deliverySmallBase: 25,
    deliveryMediumBase: 40,
    deliveryLargeBase: 60,
    deliveryExtraLargeBase: 100,
    deliveryPerKmRate: 8,
    deliveryUrgentFee: 20,
    currency: 'ZMW',
    currencySymbol: 'K'
};

export default function RideBookingPage() {
    const router = useRouter();
    const { user, userData } = useAuth();

    const [pickup, setPickup] = useState<Location | null>(null);
    const [destination, setDestination] = useState<Location | null>(null);
    const [selectMode, setSelectMode] = useState<'pickup' | 'destination' | null>(null);
    const [loading, setLoading] = useState(false);
    const [fare, setFare] = useState<number | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [duration, setDuration] = useState<number | null>(null);
    const [panelExpanded, setPanelExpanded] = useState(false);
    const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
    const [nearbyDrivers, setNearbyDrivers] = useState<{ id: string; lat: number; lng: number; heading?: number }[]>([]);
    const [useCustomPrice, setUseCustomPrice] = useState(false);
    const [offeredPrice, setOfferedPrice] = useState<number | null>(null);

    // Fetch pricing from Firebase
    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const settingsRef = ref(database, 'settings/pricing');
                const snapshot = await get(settingsRef);
                if (snapshot.exists()) {
                    setPricing({ ...DEFAULT_PRICING, ...snapshot.val() });
                }
            } catch (error) {
                console.log('Using default pricing');
            }
        };
        fetchPricing();
    }, []);

    // Listen to online drivers in real-time
    useEffect(() => {
        const driversRef = ref(database, 'drivers');
        const locationsRef = ref(database, 'driverLocations');

        // Combined listener for drivers and locations
        const unsubLocations = onValue(locationsRef, async (locSnapshot) => {
            if (!locSnapshot.exists()) {
                setNearbyDrivers([]);
                return;
            }

            const locations = locSnapshot.val();
            const driversSnapshot = await get(driversRef);

            if (!driversSnapshot.exists()) {
                setNearbyDrivers([]);
                return;
            }

            const drivers = driversSnapshot.val();
            const onlineDrivers: { id: string; lat: number; lng: number; heading?: number }[] = [];

            // Only show drivers who are online and approved
            for (const driverId of Object.keys(locations)) {
                const driver = drivers[driverId];
                const location = locations[driverId];

                if (
                    driver &&
                    driver.status === 'APPROVED' &&
                    driver.isOnline &&
                    location?.lat &&
                    location?.lng &&
                    location.updatedAt > Date.now() - 5 * 60 * 1000 // Within last 5 minutes
                ) {
                    onlineDrivers.push({
                        id: driverId,
                        lat: location.lat,
                        lng: location.lng,
                        heading: location.heading || 0,
                    });
                }
            }

            setNearbyDrivers(onlineDrivers);
        });

        return () => unsubLocations();
    }, []);

    // Calculate fare when both locations are set
    useEffect(() => {
        if (pickup && destination) {
            const R = 6371;
            const dLat = (destination.lat - pickup.lat) * Math.PI / 180;
            const dLon = (destination.lng - pickup.lng) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(pickup.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const dist = R * c;
            const dur = Math.ceil((dist / 30) * 60);

            // Use dynamic pricing from Firebase
            let calculatedFare = pricing.rideBaseFare + (dist * pricing.ridePerKmRate);
            calculatedFare = Math.max(calculatedFare, pricing.rideMinFare);

            setDistance(Math.round(dist * 10) / 10);
            setDuration(dur);
            setFare(Math.round(calculatedFare));
            setPanelExpanded(true);
        } else {
            setDistance(null);
            setDuration(null);
            setFare(null);
        }
    }, [pickup, destination, pricing]);

    const handlePickupSelect = (location: Location) => {
        setPickup(location);
        setSelectMode(null);
    };

    const handleDestinationSelect = (location: Location) => {
        setDestination(location);
        setSelectMode(null);
    };

    const handleBookRide = async () => {
        if (!pickup || !destination || !user || !userData) {
            toast.error('Please select pickup and destination');
            return;
        }

        setLoading(true);
        try {
            const rideRef = push(ref(database, 'rides'));
            const rideData = {
                riderId: user.uid,
                riderName: userData.name,
                riderPhone: userData.phone || '',
                pickup: {
                    lat: pickup.lat,
                    lng: pickup.lng,
                    address: pickup.address || 'Selected location',
                },
                destination: {
                    lat: destination.lat,
                    lng: destination.lng,
                    address: destination.address || 'Selected location',
                },
                status: 'REQUESTED',
                fare,
                offeredPrice: useCustomPrice ? offeredPrice : null,
                priceStatus: useCustomPrice ? 'PENDING' : null,
                distance,
                duration,
                paymentMethod: 'CASH',
                timestamps: {
                    requestedAt: Date.now(),
                },
            };

            await set(rideRef, rideData);

            // Find and notify nearby drivers
            try {
                const matchResponse = await fetch('/api/ride-matching', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pickupLat: pickup.lat,
                        pickupLng: pickup.lng,
                        rideId: rideRef.key,
                        maxRadius: 15,
                        limit: 10,
                    }),
                });
                const matchData = await matchResponse.json();

                // Create ride requests for matched drivers
                if (matchData.drivers?.length > 0) {
                    const expiresAt = Date.now() + 60000; // 60 seconds to respond
                    for (const driver of matchData.drivers) {
                        await set(ref(database, `rideRequests/${driver.id}/${rideRef.key}`), {
                            rideId: rideRef.key,
                            pickup: rideData.pickup,
                            destination: rideData.destination,
                            fare,
                            distance,
                            riderName: userData.name,
                            riderPhone: userData.phone || '',
                            expiresAt,
                            createdAt: Date.now(),
                        });
                    }
                    toast.success(`Ride requested! Notified ${matchData.drivers.length} driver(s)...`);
                } else {
                    toast.success('Ride requested! Finding a driver...');
                }
            } catch (matchErr) {
                console.error('Error notifying drivers:', matchErr);
                toast.success('Ride requested! Finding a driver...');
            }

            router.push(`/customer/ride/${rideRef.key}`);
        } catch (error) {
            console.error('Error booking ride:', error);
            toast.error('Failed to book ride');
        } finally {
            setLoading(false);
        }
    };

    const useCurrentLocation = () => {
        if ('geolocation' in navigator) {
            toast.loading('Getting location...', { id: 'location-toast' });

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;

                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode(
                        { location: { lat: latitude, lng: longitude } },
                        (results, status) => {
                            toast.dismiss('location-toast');

                            if (status === 'OK' && results && results[0]) {
                                setPickup({
                                    lat: latitude,
                                    lng: longitude,
                                    address: results[0].formatted_address,
                                });
                                toast.success('Location found!');
                            } else {
                                setPickup({
                                    lat: latitude,
                                    lng: longitude,
                                    address: 'Current location',
                                });
                            }
                        }
                    );
                },
                (error) => {
                    toast.dismiss('location-toast');
                    toast.error('Could not get location');
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        }
    };

    return (
        <div className="h-[calc(100vh-80px)] lg:h-[calc(100vh-32px)] w-full relative overflow-hidden">
            {/* Full Screen Map */}
            <RideMap
                pickup={pickup}
                destination={destination}
                onPickupSelect={handlePickupSelect}
                onDestinationSelect={handleDestinationSelect}
                selectMode={selectMode}
                showRoute={!!(pickup && destination)}
                nearbyDrivers={nearbyDrivers}
                className="absolute inset-0 h-full w-full"
            />

            {/* Floating Top Bar - Location Inputs */}
            <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-30">
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200">
                    {/* Pickup Input */}
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-slate-100 relative">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-violet-500 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 min-w-0 relative z-40">
                            <PlacesAutocomplete
                                placeholder="Where from?"
                                value={pickup?.address || ''}
                                onSelect={handlePickupSelect}
                            />
                        </div>
                        <button
                            onClick={useCurrentLocation}
                            className="p-2 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-colors flex-shrink-0"
                            title="Use current location"
                        >
                            <Locate className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
                        </button>
                        <button
                            onClick={() => setSelectMode(selectMode === 'pickup' ? null : 'pickup')}
                            className={`p-2 rounded-lg sm:rounded-xl transition-colors flex-shrink-0 ${selectMode === 'pickup' ? 'bg-violet-100 text-violet-600' : 'hover:bg-slate-100 text-slate-400'}`}
                        >
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>

                    {/* Destination Input */}
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 relative">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 min-w-0 relative z-40">
                            <PlacesAutocomplete
                                placeholder="Where to?"
                                value={destination?.address || ''}
                                onSelect={handleDestinationSelect}
                            />
                        </div>
                        <button
                            onClick={() => setSelectMode(selectMode === 'destination' ? null : 'destination')}
                            className={`p-2 rounded-lg sm:rounded-xl transition-colors flex-shrink-0 ${selectMode === 'destination' ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-slate-100 text-slate-400'}`}
                        >
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Map Legend - Floating */}
            <div className="absolute bottom-36 sm:bottom-44 right-2 sm:right-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-lg border border-slate-200">
                <div className="flex flex-col gap-1.5 sm:gap-2 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-violet-500 rounded-full"></div>
                        <span className="text-slate-600">Pickup</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                        <span className="text-slate-600">Drop-off</span>
                    </div>
                </div>
            </div>

            {/* Floating Bottom Panel */}
            <div className="absolute bottom-0 left-0 right-0 z-20 safe-area-bottom">
                <div className="bg-white rounded-t-2xl sm:rounded-t-3xl shadow-2xl border-t border-slate-200">
                    {/* Handle */}
                    <button
                        onClick={() => setPanelExpanded(!panelExpanded)}
                        className="w-full flex justify-center py-2 sm:py-3"
                    >
                        <div className="w-10 sm:w-12 h-1 sm:h-1.5 bg-slate-300 rounded-full"></div>
                    </button>

                    {/* Trip Estimate - Always visible when available */}
                    {fare && distance && duration && (
                        <div className="px-4 sm:px-6 pb-3 sm:pb-4 flex items-center justify-between border-b border-slate-100">
                            <div className="flex items-center gap-4 sm:gap-6">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                                    <span className="text-slate-600 font-medium text-sm sm:text-base">{distance} km</span>
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                                    <span className="text-slate-600 font-medium text-sm sm:text-base">{duration} min</span>
                                </div>
                            </div>
                            <div className="text-xl sm:text-2xl font-bold text-slate-900">{pricing.currencySymbol}{fare}</div>
                        </div>
                    )}

                    {/* Expandable Content - WITHOUT the button */}
                    {panelExpanded && (
                        <div className="px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 max-h-40 overflow-y-auto border-b border-slate-100">
                            {/* Ride Type Selection */}
                            <div className="flex gap-2 sm:gap-3">
                                <button className="flex-1 p-3 sm:p-4 bg-violet-50 border-2 border-violet-500 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 transition-all">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-violet-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Car className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600" />
                                    </div>
                                    <div className="text-left min-w-0">
                                        <p className="font-semibold text-slate-900 text-sm sm:text-base">Standard</p>
                                        <p className="text-xs text-slate-500 truncate">Everyday</p>
                                    </div>
                                </button>

                                <button className="flex-1 p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 opacity-50">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                                    </div>
                                    <div className="text-left min-w-0">
                                        <p className="font-semibold text-slate-900 text-sm sm:text-base">Premium</p>
                                        <p className="text-xs text-slate-500 truncate">Soon</p>
                                    </div>
                                </button>
                            </div>

                            {/* Payment Method */}
                            <div className="flex items-center justify-between p-3 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-xl sm:rounded-2xl">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                                        <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 text-sm sm:text-base">Cash</p>
                                        <p className="text-xs text-slate-500">Pay driver directly</p>
                                    </div>
                                </div>
                                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full"></div>
                            </div>

                            {/* Offer Your Price */}
                            <div className="p-3 sm:p-4 bg-violet-50 border border-violet-200 rounded-xl sm:rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-violet-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                                            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 text-sm sm:text-base">Offer Your Price</p>
                                            <p className="text-xs text-slate-500">Negotiate with drivers</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setUseCustomPrice(!useCustomPrice);
                                            if (!useCustomPrice && fare) setOfferedPrice(fare);
                                        }}
                                        className={`w-12 h-6 rounded-full transition-colors ${useCustomPrice ? 'bg-violet-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${useCustomPrice ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                                {useCustomPrice && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-bold text-violet-600">{pricing.currencySymbol}</span>
                                        <input
                                            type="number"
                                            value={offeredPrice || ''}
                                            onChange={(e) => setOfferedPrice(Number(e.target.value) || null)}
                                            className="flex-1 px-3 py-2 bg-white border border-violet-300 rounded-lg text-lg font-semibold text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
                                            placeholder={String(fare || '')}
                                            min={1}
                                        />
                                        {fare && offeredPrice && offeredPrice < fare && (
                                            <span className="text-xs text-amber-600">Below estimate</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Book Button - ALWAYS VISIBLE */}
                    <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white">
                        <Button
                            size="lg"
                            className="w-full py-4 sm:py-5 text-base sm:text-lg font-semibold shadow-lg"
                            onClick={handleBookRide}
                            loading={loading}
                            disabled={!pickup || !destination}
                        >
                            <Car className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                            {useCustomPrice && offeredPrice
                                ? `Offer Ride · ${pricing.currencySymbol}${offeredPrice}`
                                : fare ? `Request Ride · ${pricing.currencySymbol}${fare}` : 'Request Ride'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
