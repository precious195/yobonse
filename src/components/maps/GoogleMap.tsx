'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import {
    GoogleMap,
    useJsApiLoader,
    Marker,
    DirectionsRenderer,
    Circle,
} from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBHQFrTn3RR8FpNPnvw_EmJ_rBlmyd45ks';

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ['places', 'geometry'];

const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

const defaultCenter = {
    lat: -15.3875, // Lusaka, Zambia as default
    lng: 28.3228,
};

// Cream white map theme
const mapStyles: google.maps.MapTypeStyle[] = [
    { elementType: 'geometry', stylers: [{ color: '#faf8f5' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#5c5c5c' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
    {
        featureType: 'administrative',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#e8e4de' }],
    },
    {
        featureType: 'administrative.land_parcel',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#8a8a8a' }],
    },
    {
        featureType: 'landscape.natural',
        elementType: 'geometry',
        stylers: [{ color: '#f5f2ed' }],
    },
    {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [{ color: '#ebe7e0' }],
    },
    {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#6b6b6b' }],
    },
    {
        featureType: 'poi.park',
        elementType: 'geometry.fill',
        stylers: [{ color: '#d4e8d4' }],
    },
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }],
    },
    {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#e8e4de' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#f8f4ee' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#e0dcd5' }],
    },
    {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{ color: '#ebe7e0' }],
    },
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#c9dff0' }],
    },
    {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#7a9eb8' }],
    },
];

interface Location {
    lat: number;
    lng: number;
    address?: string;
}

interface RideMapProps {
    pickup?: Location | null;
    destination?: Location | null;
    driverLocation?: Location | null;
    onPickupSelect?: (location: Location) => void;
    onDestinationSelect?: (location: Location) => void;
    showRoute?: boolean;
    selectMode?: 'pickup' | 'destination' | null;
    className?: string;
}

export function RideMap({
    pickup,
    destination,
    driverLocation,
    onPickupSelect,
    onDestinationSelect,
    showRoute = false,
    selectMode = null,
    className = '',
}: RideMapProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

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
                (error) => {
                    console.error('Error getting location:', error);
                }
            );
        }
    }, []);

    // Calculate route when pickup and destination are set
    useEffect(() => {
        if (!isLoaded || !pickup || !destination || !showRoute) return;

        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
            {
                origin: { lat: pickup.lat, lng: pickup.lng },
                destination: { lat: destination.lat, lng: destination.lng },
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === 'OK' && result) {
                    setDirections(result);
                }
            }
        );
    }, [isLoaded, pickup, destination, showRoute]);

    // Fit bounds when markers change
    useEffect(() => {
        if (!map) return;

        const bounds = new google.maps.LatLngBounds();
        let hasPoints = false;

        if (pickup) {
            bounds.extend({ lat: pickup.lat, lng: pickup.lng });
            hasPoints = true;
        }
        if (destination) {
            bounds.extend({ lat: destination.lat, lng: destination.lng });
            hasPoints = true;
        }
        if (driverLocation) {
            bounds.extend({ lat: driverLocation.lat, lng: driverLocation.lng });
            hasPoints = true;
        }

        if (hasPoints) {
            map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
        }
    }, [map, pickup, destination, driverLocation]);

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const handleMapClick = useCallback(
        async (e: google.maps.MapMouseEvent) => {
            if (!e.latLng || !selectMode) return;

            const lat = e.latLng.lat();
            const lng = e.latLng.lng();

            // Reverse geocode to get address
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                const location: Location = {
                    lat,
                    lng,
                    address: status === 'OK' && results && results[0]
                        ? results[0].formatted_address
                        : 'Selected location',
                };

                if (selectMode === 'pickup' && onPickupSelect) {
                    onPickupSelect(location);
                } else if (selectMode === 'destination' && onDestinationSelect) {
                    onDestinationSelect(location);
                }
            });
        },
        [selectMode, onPickupSelect, onDestinationSelect]
    );

    if (loadError) {
        return (
            <div className={`flex items-center justify-center bg-slate-100 rounded-xl ${className}`}>
                <p className="text-red-500">Error loading maps</p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className={`flex items-center justify-center bg-slate-100 rounded-xl ${className}`}>
                <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className={`relative rounded-xl overflow-hidden ${className}`}>
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={currentLocation || pickup || defaultCenter}
                zoom={14}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={handleMapClick}
                options={{
                    styles: mapStyles,
                    disableDefaultUI: true,
                    zoomControl: true,
                    fullscreenControl: true,
                    clickableIcons: false,
                }}
            >
                {/* Current Location */}
                {currentLocation && !pickup && (
                    <Circle
                        center={currentLocation}
                        radius={100}
                        options={{
                            fillColor: '#8b5cf6',
                            fillOpacity: 0.2,
                            strokeColor: '#8b5cf6',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                        }}
                    />
                )}

                {/* Pickup Marker - Draggable */}
                {pickup && (
                    <Marker
                        position={{ lat: pickup.lat, lng: pickup.lng }}
                        draggable={true}
                        onDragEnd={(e) => {
                            if (e.latLng && onPickupSelect) {
                                const lat = e.latLng.lat();
                                const lng = e.latLng.lng();
                                const geocoder = new google.maps.Geocoder();
                                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                                    onPickupSelect({
                                        lat,
                                        lng,
                                        address: status === 'OK' && results && results[0]
                                            ? results[0].formatted_address
                                            : 'Selected location',
                                    });
                                });
                            }
                        }}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 12,
                            fillColor: '#8b5cf6',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 3,
                        }}
                        title="Drag to adjust pickup"
                        animation={google.maps.Animation.DROP}
                    />
                )}

                {/* Destination Marker - Draggable */}
                {destination && (
                    <Marker
                        position={{ lat: destination.lat, lng: destination.lng }}
                        draggable={true}
                        onDragEnd={(e) => {
                            if (e.latLng && onDestinationSelect) {
                                const lat = e.latLng.lat();
                                const lng = e.latLng.lng();
                                const geocoder = new google.maps.Geocoder();
                                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                                    onDestinationSelect({
                                        lat,
                                        lng,
                                        address: status === 'OK' && results && results[0]
                                            ? results[0].formatted_address
                                            : 'Selected location',
                                    });
                                });
                            }
                        }}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 12,
                            fillColor: '#10b981',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 3,
                        }}
                        title="Drag to adjust destination"
                        animation={google.maps.Animation.DROP}
                    />
                )}

                {/* Driver Marker */}
                {driverLocation && (
                    <Marker
                        position={{ lat: driverLocation.lat, lng: driverLocation.lng }}
                        icon={{
                            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                            scale: 2,
                            fillColor: '#f59e0b',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 1,
                            anchor: new google.maps.Point(12, 24),
                        }}
                        title="Driver"
                    />
                )}

                {/* Route */}
                {directions && (
                    <DirectionsRenderer
                        directions={directions}
                        options={{
                            suppressMarkers: true,
                            polylineOptions: {
                                strokeColor: '#8b5cf6',
                                strokeWeight: 4,
                                strokeOpacity: 0.8,
                            },
                        }}
                    />
                )}
            </GoogleMap>

            {/* Selection Mode Indicator */}
            {selectMode && (
                <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border border-slate-200 z-10">
                    <p className="text-slate-700 text-sm font-medium">
                        👆 Click on the map to select your{' '}
                        <span className={selectMode === 'pickup' ? 'text-violet-600 font-bold' : 'text-emerald-600 font-bold'}>
                            {selectMode}
                        </span>{' '}
                        location
                    </p>
                </div>
            )}
        </div>
    );
}

// Places Autocomplete Component - Robust Implementation
interface PlacesAutocompleteProps {
    placeholder?: string;
    onSelect: (location: Location) => void;
    value?: string;
    className?: string;
}

export function PlacesAutocomplete({
    placeholder = 'Search location...',
    onSelect,
    value = '',
    className = '',
}: PlacesAutocompleteProps) {
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries,
    });

    const [inputValue, setInputValue] = useState(value);
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showPredictions, setShowPredictions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);

    // Initialize autocomplete service once
    useEffect(() => {
        if (isLoaded && !autocompleteServiceRef.current) {
            autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        }
    }, [isLoaded]);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const searchPlaces = useCallback((query: string) => {
        if (!isLoaded || !autocompleteServiceRef.current || query.length < 2) {
            setPredictions([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);

        // Zambia bounds for location biasing
        const zambiaBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(-18.0, 22.0), // SW
            new google.maps.LatLng(-8.0, 34.0)   // NE
        );

        // Lusaka center for location biasing
        const lusakaLocation = new google.maps.LatLng(-15.3875, 28.3228);

        autocompleteServiceRef.current.getPlacePredictions(
            {
                input: query,
                bounds: zambiaBounds,
                location: lusakaLocation,
                radius: 50000, // 50km radius from Lusaka
                componentRestrictions: { country: 'zm' }, // Restrict to Zambia
                types: ['establishment', 'geocode'], // Include businesses and addresses
            },
            (predictions, status) => {
                setIsSearching(false);
                if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                    setPredictions(predictions);
                    setShowPredictions(true);
                } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                    // Try again without country restriction for broader results
                    autocompleteServiceRef.current?.getPlacePredictions(
                        {
                            input: query,
                            location: lusakaLocation,
                            radius: 100000,
                        },
                        (fallbackPredictions, fallbackStatus) => {
                            if (fallbackStatus === google.maps.places.PlacesServiceStatus.OK && fallbackPredictions) {
                                setPredictions(fallbackPredictions);
                                setShowPredictions(true);
                            } else {
                                setPredictions([]);
                            }
                        }
                    );
                } else {
                    setPredictions([]);
                }
            }
        );
    }, [isLoaded]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);

        // Clear previous debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (val.length < 2) {
            setPredictions([]);
            setShowPredictions(false);
            return;
        }

        // Debounce the search
        debounceRef.current = setTimeout(() => {
            searchPlaces(val);
        }, 300);
    };

    const handlePredictionClick = (prediction: google.maps.places.AutocompletePrediction) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                const location = results[0].geometry.location;
                onSelect({
                    lat: location.lat(),
                    lng: location.lng(),
                    address: prediction.description,
                });
                setInputValue(prediction.description);
                setPredictions([]);
                setShowPredictions(false);
            }
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            setShowPredictions(false);
        }
    };

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => predictions.length > 0 && setShowPredictions(true)}
                    onBlur={() => setTimeout(() => setShowPredictions(false), 250)}
                    placeholder={placeholder}
                    className="w-full bg-transparent border-0 px-0 py-1 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 transition-all"
                />
                {isSearching && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {showPredictions && predictions.length > 0 && (
                <div className="absolute z-[100] w-full left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto" style={{ minWidth: '280px' }}>
                    {predictions.map((prediction, index) => (
                        <button
                            key={prediction.place_id}
                            onClick={() => handlePredictionClick(prediction)}
                            className={`w-full px-4 py-3 text-left hover:bg-violet-50 transition-colors flex items-start gap-3 ${index !== predictions.length - 1 ? 'border-b border-slate-100' : ''
                                }`}
                        >
                            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-slate-900 text-sm font-medium truncate">
                                    {prediction.structured_formatting.main_text}
                                </p>
                                <p className="text-slate-500 text-xs truncate">
                                    {prediction.structured_formatting.secondary_text}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {showPredictions && predictions.length === 0 && inputValue.length >= 2 && !isSearching && (
                <div className="absolute z-50 w-full left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-center">
                    <p className="text-slate-500 text-sm">No locations found. Try a different search term.</p>
                </div>
            )}
        </div>
    );
}

export default RideMap;

