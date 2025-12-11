'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    MapPin,
    Navigation,
    DollarSign,
    Clock,
    Car,
    X,
    CheckCircle,
    Maximize2,
    Minimize2,
    RefreshCw,
    List,
    Map as MapIcon
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card, Button, Badge, Modal } from '@/components/ui';
import { ref, onValue, get, set, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Ride } from '@/types';
import toast from 'react-hot-toast';
import {
    GoogleMap,
    useJsApiLoader,
    Marker,
    InfoWindow,
} from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBHQFrTn3RR8FpNPnvw_EmJ_rBlmyd45ks';
const libraries: ("places" | "geometry")[] = ['places', 'geometry'];

// Cream map theme
const mapStyles: google.maps.MapTypeStyle[] = [
    { elementType: 'geometry', stylers: [{ color: '#faf8f5' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#5c5c5c' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e8e4de' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9dff0' }] },
    { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#d4e8d4' }] },
];

const defaultCenter = { lat: -15.3875, lng: 28.3228 }; // Lusaka

export default function AvailableRidesPage() {
    const router = useRouter();
    const { user, userData } = useAuth();
    const [availableRides, setAvailableRides] = useState<Ride[]>([]);
    const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [counterPrice, setCounterPrice] = useState<number | null>(null);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries,
    });

    // Get current location
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => console.error('Location error:', error)
            );
        }
    }, []);

    // Listen to available rides (REQUESTED status)
    useEffect(() => {
        const ridesRef = ref(database, 'rides');
        const unsubscribe = onValue(ridesRef, (snapshot) => {
            if (snapshot.exists()) {
                const rides: Ride[] = [];
                snapshot.forEach((child) => {
                    const ride = { id: child.key, ...child.val() } as Ride;
                    // Only show REQUESTED rides (no driver assigned yet)
                    if (ride.status === 'REQUESTED' && !ride.driverId) {
                        rides.push(ride);
                    }
                });
                setAvailableRides(rides);
            } else {
                setAvailableRides([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);
    }, []);

    // Fit bounds to show all ride markers
    useEffect(() => {
        if (!map || availableRides.length === 0) return;

        const bounds = new google.maps.LatLngBounds();

        if (currentLocation) {
            bounds.extend(currentLocation);
        }

        availableRides.forEach((ride) => {
            bounds.extend({ lat: ride.pickup.lat, lng: ride.pickup.lng });
        });

        map.fitBounds(bounds, { top: 50, right: 50, bottom: 150, left: 50 });
    }, [map, availableRides, currentLocation]);

    const handleRideClick = (ride: Ride) => {
        setSelectedRide(ride);
        setCounterPrice(null);
        setShowDetailsModal(true);
    };

    const handleAcceptRide = async () => {
        if (!selectedRide || !user?.uid || !userData) return;

        setAccepting(true);
        try {
            // Determine final accepted price
            const finalPrice = counterPrice || selectedRide.offeredPrice || selectedRide.fare;

            // Update ride with driver info and accepted price
            await update(ref(database, `rides/${selectedRide.id}`), {
                driverId: user.uid,
                driverName: userData.name,
                status: 'ACCEPTED',
                acceptedPrice: finalPrice,
                priceStatus: 'ACCEPTED',
                counterPrice: counterPrice || null,
                'timestamps/acceptedAt': Date.now(),
            });

            // Remove all ride requests for this ride from all drivers
            const rideRequestsRef = ref(database, 'rideRequests');
            const snapshot = await get(rideRequestsRef);
            if (snapshot.exists()) {
                const allRequests = snapshot.val();
                for (const driverId of Object.keys(allRequests)) {
                    if (allRequests[driverId][selectedRide.id]) {
                        await set(ref(database, `rideRequests/${driverId}/${selectedRide.id}`), null);
                    }
                }
            }

            toast.success('Ride accepted!');
            setShowDetailsModal(false);
            router.push(`/driver/trip/${selectedRide.id}`);
        } catch (error) {
            console.error('Error accepting ride:', error);
            toast.error('Failed to accept ride');
        } finally {
            setAccepting(false);
        }
    };

    const calculateDistance = (ride: Ride): string => {
        if (!currentLocation) return 'N/A';
        const R = 6371;
        const dLat = (ride.pickup.lat - currentLocation.lat) * Math.PI / 180;
        const dLon = (ride.pickup.lng - currentLocation.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(currentLocation.lat * Math.PI / 180) * Math.cos(ride.pickup.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dist = R * c;
        return `${dist.toFixed(1)} km away`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const mapContainerStyle = {
        width: '100%',
        height: isFullScreen ? '100vh' : 'calc(100vh - 200px)',
    };

    return (
        <div className={`${isFullScreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
            {/* Header */}
            <div className={`flex items-center justify-between mb-4 ${isFullScreen ? 'absolute top-4 left-4 right-4 z-10' : ''}`}>
                <div className={isFullScreen ? 'bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg' : ''}>
                    <h1 className="text-xl sm:text-2xl font-bold" style={{ color: isFullScreen ? '#1f2937' : 'var(--foreground)' }}>
                        Available Rides
                    </h1>
                    <p className="text-sm" style={{ color: isFullScreen ? '#6b7280' : 'var(--muted)' }}>
                        {availableRides.length} ride{availableRides.length !== 1 ? 's' : ''} waiting
                    </p>
                </div>

                <div className={`flex gap-2 ${isFullScreen ? 'bg-white/95 backdrop-blur-sm rounded-xl p-2 shadow-lg' : ''}`}>
                    {/* View Toggle */}
                    <button
                        onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        title={viewMode === 'map' ? 'Switch to list view' : 'Switch to map view'}
                    >
                        {viewMode === 'map' ? (
                            <List className="w-5 h-5 text-slate-600" />
                        ) : (
                            <MapIcon className="w-5 h-5 text-slate-600" />
                        )}
                    </button>

                    {/* Fullscreen Toggle (map mode only) */}
                    {viewMode === 'map' && (
                        <button
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            title={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                        >
                            {isFullScreen ? (
                                <Minimize2 className="w-5 h-5 text-slate-600" />
                            ) : (
                                <Maximize2 className="w-5 h-5 text-slate-600" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Map View */}
            {viewMode === 'map' && isLoaded && (
                <div className={`relative rounded-xl overflow-hidden ${isFullScreen ? '' : 'border border-slate-200'}`}>
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={currentLocation || defaultCenter}
                        zoom={13}
                        onLoad={onMapLoad}
                        options={{
                            styles: mapStyles,
                            disableDefaultUI: true,
                            zoomControl: true,
                            fullscreenControl: false,
                        }}
                    >
                        {/* Current location marker */}
                        {currentLocation && (
                            <Marker
                                position={currentLocation}
                                icon={{
                                    path: google.maps.SymbolPath.CIRCLE,
                                    scale: 10,
                                    fillColor: '#3b82f6',
                                    fillOpacity: 1,
                                    strokeColor: '#ffffff',
                                    strokeWeight: 3,
                                }}
                                title="Your location"
                            />
                        )}

                        {/* Ride pickup markers */}
                        {availableRides.map((ride) => (
                            <Marker
                                key={ride.id}
                                position={{ lat: ride.pickup.lat, lng: ride.pickup.lng }}
                                onClick={() => handleRideClick(ride)}
                                icon={{
                                    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                                    scale: 2,
                                    fillColor: '#8b5cf6',
                                    fillOpacity: 1,
                                    strokeColor: '#ffffff',
                                    strokeWeight: 2,
                                    anchor: new google.maps.Point(12, 24),
                                }}
                                title={`K${ride.fare} - ${ride.pickup.address}`}
                            />
                        ))}
                    </GoogleMap>

                    {/* Floating ride cards at bottom */}
                    {availableRides.length > 0 && (
                        <div className={`absolute bottom-4 left-4 right-4 ${isFullScreen ? 'max-h-48' : 'max-h-32'} overflow-x-auto flex gap-3 pb-2`}>
                            {availableRides.map((ride) => (
                                <button
                                    key={ride.id}
                                    onClick={() => handleRideClick(ride)}
                                    className="flex-shrink-0 bg-white rounded-xl p-3 shadow-lg border border-slate-200 text-left hover:shadow-xl transition-shadow min-w-[200px]"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-lg font-bold text-slate-900">K{ride.fare}</span>
                                        <Badge variant="info">{ride.distance} km</Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{ride.pickup.address}</p>
                                    <p className="text-xs text-emerald-600 mt-1">{calculateDistance(ride)}</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {availableRides.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                            <div className="text-center p-6">
                                <Car className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-700 mb-2">No rides available</h3>
                                <p className="text-slate-500">Check back soon for new ride requests</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <div className="space-y-4">
                    {availableRides.length === 0 ? (
                        <Card className="text-center py-12">
                            <Car className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                                No rides available
                            </h3>
                            <p style={{ color: 'var(--muted)' }}>Check back soon for new ride requests</p>
                        </Card>
                    ) : (
                        availableRides.map((ride) => (
                            <div
                                key={ride.id}
                                onClick={() => handleRideClick(ride)}
                                className="cursor-pointer hover:shadow-lg transition-shadow p-6 rounded-xl"
                                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                                            <Car className="w-6 h-6 text-violet-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                                {ride.riderName}
                                            </p>
                                            <p className="text-sm text-emerald-600">{calculateDistance(ride)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-emerald-600">K{ride.fare}</p>
                                        <p className="text-sm" style={{ color: 'var(--muted)' }}>{ride.distance} km</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                                        </div>
                                        <div>
                                            <p className="text-xs" style={{ color: 'var(--muted)' }}>Pickup</p>
                                            <p className="text-sm" style={{ color: 'var(--foreground)' }}>{ride.pickup.address}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                        </div>
                                        <div>
                                            <p className="text-xs" style={{ color: 'var(--muted)' }}>Destination</p>
                                            <p className="text-sm" style={{ color: 'var(--foreground)' }}>{ride.destination.address}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Ride Details Modal */}
            <Modal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                title="Ride Details"
                size="md"
            >
                {selectedRide && (
                    <div className="space-y-6">
                        {/* Fare */}
                        <div className="text-center py-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                            {selectedRide.offeredPrice ? (
                                <>
                                    <p className="text-xs text-violet-600 mb-1">Customer Offer</p>
                                    <p className="text-4xl font-bold text-violet-600">K{selectedRide.offeredPrice}</p>
                                    <p className="text-sm text-slate-500 mt-1 line-through">Est. K{selectedRide.fare}</p>
                                </>
                            ) : (
                                <p className="text-4xl font-bold text-emerald-600">K{selectedRide.fare}</p>
                            )}
                            <div className="flex items-center justify-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" /> {selectedRide.distance} km
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" /> {selectedRide.duration} min
                                </span>
                            </div>
                        </div>

                        {/* Rider Info */}
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center">
                                <span className="text-lg font-bold text-violet-600">
                                    {selectedRide.riderName?.charAt(0) || '?'}
                                </span>
                            </div>
                            <div>
                                <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                    {selectedRide.riderName}
                                </p>
                                <p className="text-sm text-emerald-600">{calculateDistance(selectedRide)}</p>
                            </div>
                        </div>

                        {/* Route */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
                                </div>
                                <div>
                                    <p className="text-sm" style={{ color: 'var(--muted)' }}>Pickup</p>
                                    <p style={{ color: 'var(--foreground)' }}>{selectedRide.pickup.address}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                </div>
                                <div>
                                    <p className="text-sm" style={{ color: 'var(--muted)' }}>Destination</p>
                                    <p style={{ color: 'var(--foreground)' }}>{selectedRide.destination.address}</p>
                                </div>
                            </div>
                        </div>

                        {/* Counter Offer (if customer offered a price) */}
                        {selectedRide.offeredPrice && (
                            <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl space-y-3">
                                <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                                    Counter offer (optional)
                                </p>
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-violet-600">K</span>
                                    <input
                                        type="number"
                                        value={counterPrice || ''}
                                        onChange={(e) => setCounterPrice(Number(e.target.value) || null)}
                                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-violet-300 dark:border-violet-600 rounded-lg text-lg font-semibold text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        placeholder={String(selectedRide.fare || '')}
                                        min={1}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowDetailsModal(false)}
                            >
                                <X className="w-5 h-5 mr-2" />
                                Close
                            </Button>
                            <Button
                                onClick={handleAcceptRide}
                                loading={accepting}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600"
                            >
                                <CheckCircle className="w-5 h-5 mr-2" />
                                {counterPrice ? `Accept K${counterPrice}` :
                                    selectedRide.offeredPrice ? `Accept K${selectedRide.offeredPrice}` :
                                        'Accept Ride'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
