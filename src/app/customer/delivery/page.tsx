'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    MapPin,
    Package,
    User,
    Phone,
    FileText,
    AlertTriangle,
    Zap,
    Banknote,
    Navigation,
    Clock,
    ChevronUp,
    ChevronDown,
    Locate
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button, Card } from '@/components/ui';
import { RideMap, PlacesAutocomplete } from '@/components/maps/GoogleMap';
import { ref, push, set, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Location, ParcelSize, PricingSettings } from '@/types';

// Default pricing (will be overridden by Firebase settings)
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

const PARCEL_SIZES = [
    { id: 'SMALL' as ParcelSize, name: 'Small', desc: 'Documents, envelopes', icon: '📄', maxWeight: '1kg' },
    { id: 'MEDIUM' as ParcelSize, name: 'Medium', desc: 'Shoebox size', icon: '📦', maxWeight: '5kg' },
    { id: 'LARGE' as ParcelSize, name: 'Large', desc: 'Large box', icon: '📦', maxWeight: '20kg' },
    { id: 'EXTRA_LARGE' as ParcelSize, name: 'Extra Large', desc: 'Furniture, appliances', icon: '🚚', maxWeight: '50kg' },
];

export default function DeliveryPage() {
    const router = useRouter();
    const { user, userData } = useAuth();

    // Locations
    const [pickup, setPickup] = useState<Location | null>(null);
    const [dropoff, setDropoff] = useState<Location | null>(null);
    const [selectMode, setSelectMode] = useState<'pickup' | 'destination' | null>(null);

    // Recipient
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');

    // Parcel
    const [parcelSize, setParcelSize] = useState<ParcelSize>('SMALL');
    const [description, setDescription] = useState('');
    const [isFragile, setIsFragile] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);

    // UI State
    const [loading, setLoading] = useState(false);
    const [panelExpanded, setPanelExpanded] = useState(true);
    const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);

    // Calculated values
    const [distance, setDistance] = useState<number | null>(null);
    const [duration, setDuration] = useState<number | null>(null);
    const [fare, setFare] = useState<number | null>(null);

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

    // Calculate fare when route changes
    useEffect(() => {
        if (distance && parcelSize) {
            let baseFare = pricing.deliverySmallBase;
            switch (parcelSize) {
                case 'MEDIUM': baseFare = pricing.deliveryMediumBase; break;
                case 'LARGE': baseFare = pricing.deliveryLargeBase; break;
                case 'EXTRA_LARGE': baseFare = pricing.deliveryExtraLargeBase; break;
            }

            let calculatedFare = baseFare + (distance * pricing.deliveryPerKmRate);
            if (isUrgent) {
                calculatedFare += pricing.deliveryUrgentFee;
            }

            setFare(Math.round(calculatedFare));
        }
    }, [distance, parcelSize, isUrgent, pricing]);

    const handlePickupSelect = useCallback((location: Location) => {
        setPickup(location);
        setSelectMode(null);
    }, []);

    const handleDropoffSelect = useCallback((location: Location) => {
        setDropoff(location);
        setSelectMode(null);
    }, []);

    const handleRouteCalculated = useCallback((dist: number, dur: number) => {
        setDistance(Math.round(dist * 10) / 10);
        setDuration(Math.round(dur));
    }, []);

    const useCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation not supported');
            return;
        }

        toast.loading('Getting your location...', { id: 'location' });

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode(
                    { location: { lat: latitude, lng: longitude } },
                    (results, status) => {
                        toast.dismiss('location');
                        if (status === 'OK' && results && results[0]) {
                            handlePickupSelect({
                                lat: latitude,
                                lng: longitude,
                                address: results[0].formatted_address,
                            });
                            toast.success('Location found!');
                        } else {
                            handlePickupSelect({
                                lat: latitude,
                                lng: longitude,
                                address: 'Current Location',
                            });
                        }
                    }
                );
            },
            (error) => {
                toast.dismiss('location');
                toast.error('Could not get your location');
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const handleSendParcel = async () => {
        if (!user || !userData) {
            toast.error('Please log in first');
            router.push('/login');
            return;
        }

        if (!pickup || !dropoff) {
            toast.error('Please select pickup and dropoff locations');
            return;
        }

        if (!recipientName.trim()) {
            toast.error('Please enter recipient name');
            return;
        }

        if (!recipientPhone.trim()) {
            toast.error('Please enter recipient phone number');
            return;
        }

        setLoading(true);
        try {
            const deliveryRef = push(ref(database, 'deliveries'));
            const deliveryData = {
                senderId: user.uid,
                senderName: userData.name,
                senderPhone: userData.phone || '',
                pickup: {
                    lat: pickup.lat,
                    lng: pickup.lng,
                    address: pickup.address || 'Selected location',
                },
                dropoff: {
                    lat: dropoff.lat,
                    lng: dropoff.lng,
                    address: dropoff.address || 'Selected location',
                },
                recipient: {
                    name: recipientName.trim(),
                    phone: recipientPhone.trim(),
                },
                parcel: {
                    size: parcelSize,
                    description: description.trim(),
                    isFragile,
                    isUrgent,
                },
                status: 'REQUESTED',
                fare,
                distance,
                duration,
                paymentMethod: 'CASH',
                timestamps: {
                    requestedAt: Date.now(),
                },
            };

            await set(deliveryRef, deliveryData);
            toast.success('Delivery request sent!');
            router.push(`/customer/delivery/${deliveryRef.key}`);
        } catch (error) {
            console.error('Error creating delivery:', error);
            toast.error('Failed to create delivery');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative h-[calc(100vh-4rem)] sm:h-screen bg-slate-50 overflow-hidden">
            {/* Map */}
            <RideMap
                pickup={pickup}
                destination={dropoff}
                onPickupSelect={handlePickupSelect}
                onDestinationSelect={handleDropoffSelect}
                onRouteCalculated={handleRouteCalculated}
                selectMode={selectMode}
                showRoute={!!(pickup && dropoff)}
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
                                placeholder="Pickup location"
                                value={pickup?.address || ''}
                                onSelect={handlePickupSelect}
                            />
                        </div>
                        <button
                            onClick={useCurrentLocation}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                            title="Use current location"
                        >
                            <Locate className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
                        </button>
                        <button
                            onClick={() => setSelectMode(selectMode === 'pickup' ? null : 'pickup')}
                            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${selectMode === 'pickup' ? 'bg-violet-100 text-violet-600' : 'hover:bg-slate-100 text-slate-400'}`}
                        >
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>

                    {/* Dropoff Input */}
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 relative">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 min-w-0 relative z-40">
                            <PlacesAutocomplete
                                placeholder="Dropoff location"
                                value={dropoff?.address || ''}
                                onSelect={handleDropoffSelect}
                            />
                        </div>
                        <button
                            onClick={() => setSelectMode(selectMode === 'destination' ? null : 'destination')}
                            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${selectMode === 'destination' ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-slate-100 text-slate-400'}`}
                        >
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Bottom Panel */}
            <div className="absolute bottom-0 left-0 right-0 z-20 safe-area-bottom">
                <div className="bg-white rounded-t-2xl sm:rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[70vh] overflow-hidden flex flex-col">
                    {/* Handle */}
                    <button
                        onClick={() => setPanelExpanded(!panelExpanded)}
                        className="w-full flex justify-center py-2 sm:py-3 flex-shrink-0"
                    >
                        <div className="w-10 sm:w-12 h-1 sm:h-1.5 bg-slate-300 rounded-full"></div>
                    </button>

                    {/* Trip Estimate */}
                    {fare && distance && duration && (
                        <div className="px-4 sm:px-6 pb-3 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
                            <div className="flex items-center gap-4 sm:gap-6">
                                <div className="flex items-center gap-1.5">
                                    <Navigation className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-slate-600 font-medium text-sm">{distance} km</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-slate-600 font-medium text-sm">{duration} min</span>
                                </div>
                            </div>
                            <div className="text-xl sm:text-2xl font-bold text-slate-900">{pricing.currencySymbol}{fare}</div>
                        </div>
                    )}

                    {/* Expandable Content */}
                    {panelExpanded && (
                        <div className="px-4 sm:px-6 py-4 space-y-4 overflow-y-auto flex-1">
                            {/* Parcel Size Selection */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <Package className="w-4 h-4" /> Parcel Size
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {PARCEL_SIZES.map((size) => {
                                        const isSelected = parcelSize === size.id;
                                        return (
                                            <button
                                                key={size.id}
                                                onClick={() => setParcelSize(size.id)}
                                                className={`p-3 rounded-xl border-2 transition-all text-left relative ${isSelected
                                                    ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-600 ring-opacity-50'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    }`}
                                            >
                                                {/* Selection indicator */}
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                                                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{size.icon}</span>
                                                    <div>
                                                        <p className={`font-semibold text-sm ${isSelected ? 'text-purple-700' : 'text-slate-900'}`}>{size.name}</p>
                                                        <p className={`text-xs ${isSelected ? 'text-purple-500' : 'text-slate-500'}`}>{size.maxWeight}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Recipient Info */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4" /> Recipient
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <User className="w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Recipient name"
                                            value={recipientName}
                                            onChange={(e) => setRecipientName(e.target.value)}
                                            className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-900 placeholder-slate-400"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <input
                                            type="tel"
                                            placeholder="Recipient phone"
                                            value={recipientPhone}
                                            onChange={(e) => setRecipientPhone(e.target.value)}
                                            className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-900 placeholder-slate-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Description (optional)
                                </h3>
                                <textarea
                                    placeholder="What are you sending?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none resize-none"
                                    rows={2}
                                />
                            </div>

                            {/* Options */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsFragile(!isFragile)}
                                    className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${isFragile ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600'
                                        }`}
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-sm font-medium">Fragile</span>
                                </button>
                                <button
                                    onClick={() => setIsUrgent(!isUrgent)}
                                    className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${isUrgent ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-600'
                                        }`}
                                >
                                    <Zap className="w-4 h-4" />
                                    <span className="text-sm font-medium">Urgent (+{pricing.currencySymbol}{pricing.deliveryUrgentFee})</span>
                                </button>
                            </div>

                            {/* Payment */}
                            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <Banknote className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 text-sm">Cash</p>
                                        <p className="text-xs text-slate-500">Pay driver on delivery</p>
                                    </div>
                                </div>
                                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            </div>
                        </div>
                    )}

                    {/* Send Button - Always Visible */}
                    <div className="px-4 sm:px-6 py-4 bg-white border-t border-slate-100 flex-shrink-0">
                        <Button
                            size="lg"
                            className="w-full py-4 text-base font-semibold shadow-lg"
                            onClick={handleSendParcel}
                            loading={loading}
                            disabled={!pickup || !dropoff || !recipientName || !recipientPhone}
                        >
                            <Package className="w-5 h-5 mr-2" />
                            {fare ? `Send Parcel · ${pricing.currencySymbol}${fare}` : 'Send Parcel'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
