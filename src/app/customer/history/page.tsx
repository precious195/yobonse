'use client';

import { useEffect, useState } from 'react';
import {
    Car,
    MapPin,
    Calendar,
    Clock,
    DollarSign,
    Star,
    ChevronRight,
    Download,
    Filter
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card, Button, Badge, Modal, Avatar } from '@/components/ui';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Ride } from '@/types';

export default function RideHistoryPage() {
    const { user } = useAuth();
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
    const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

    useEffect(() => {
        if (!user?.uid) return;

        const ridesRef = ref(database, 'rides');
        const unsubscribe = onValue(ridesRef, (snapshot) => {
            if (snapshot.exists()) {
                const ridesData: Ride[] = [];
                snapshot.forEach((child) => {
                    const ride = { id: child.key, ...child.val() } as Ride;
                    if (ride.riderId === user.uid &&
                        ['COMPLETED', 'CANCELLED'].includes(ride.status)) {
                        ridesData.push(ride);
                    }
                });

                // Sort by date descending
                ridesData.sort((a, b) =>
                    (b.timestamps.completedAt || b.timestamps.cancelledAt || 0) -
                    (a.timestamps.completedAt || a.timestamps.cancelledAt || 0)
                );

                setRides(ridesData);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const filteredRides = rides.filter(ride => {
        if (filter === 'all') return true;
        return ride.status === filter.toUpperCase();
    });

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Ride History</h1>
                    <p className="text-gray-400 mt-1">View all your past rides</p>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                        <option value="all">All Rides</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="text-center">
                    <p className="text-3xl font-bold text-white">{rides.length}</p>
                    <p className="text-sm text-gray-400">Total Rides</p>
                </Card>
                <Card className="text-center">
                    <p className="text-3xl font-bold text-white">
                        ${rides.filter(r => r.status === 'COMPLETED').reduce((sum, r) => sum + (r.fare || 0), 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-400">Total Spent</p>
                </Card>
                <Card className="text-center">
                    <p className="text-3xl font-bold text-white">
                        {rides.filter(r => r.status === 'COMPLETED').reduce((sum, r) => sum + (r.distance || 0), 0).toFixed(1)} km
                    </p>
                    <p className="text-sm text-gray-400">Distance Covered</p>
                </Card>
            </div>

            {/* Rides List */}
            {filteredRides.length === 0 ? (
                <Card className="text-center py-12">
                    <Car className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No rides found</h3>
                    <p className="text-gray-400">Your ride history will appear here</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredRides.map((ride) => (
                        <Card
                            key={ride.id}
                            hover
                            className="cursor-pointer"
                            onClick={() => setSelectedRide(ride)}
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Car className="w-6 h-6 text-gray-400" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-medium text-white truncate">{ride.destination.address}</p>
                                            <p className="text-sm text-gray-400 truncate">From: {ride.pickup.address}</p>
                                        </div>
                                        <Badge variant={ride.status === 'COMPLETED' ? 'success' : 'danger'}>
                                            {ride.status}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(ride.timestamps.completedAt || ride.timestamps.cancelledAt || ride.timestamps.requestedAt)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {formatTime(ride.timestamps.requestedAt)}
                                        </span>
                                        {ride.status === 'COMPLETED' && (
                                            <span className="flex items-center gap-1 text-white font-medium">
                                                <DollarSign className="w-4 h-4" />
                                                {ride.fare?.toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <ChevronRight className="w-5 h-5 text-gray-500" />
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Ride Detail Modal */}
            <Modal
                isOpen={!!selectedRide}
                onClose={() => setSelectedRide(null)}
                title="Ride Details"
                size="lg"
            >
                {selectedRide && (
                    <div className="space-y-6">
                        {/* Status */}
                        <div className="flex items-center justify-between">
                            <Badge variant={selectedRide.status === 'COMPLETED' ? 'success' : 'danger'} className="text-base px-4 py-1">
                                {selectedRide.status}
                            </Badge>
                            <p className="text-gray-400">
                                {formatDate(selectedRide.timestamps.completedAt || selectedRide.timestamps.cancelledAt || selectedRide.timestamps.requestedAt)}
                            </p>
                        </div>

                        {/* Route */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Pickup</p>
                                    <p className="text-white">{selectedRide.pickup.address}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Destination</p>
                                    <p className="text-white">{selectedRide.destination.address}</p>
                                </div>
                            </div>
                        </div>

                        {/* Driver Info */}
                        {selectedRide.driverId && (
                            <div className="p-4 bg-gray-800/50 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <Avatar name={selectedRide.driverName || 'Driver'} size="md" />
                                    <div className="flex-1">
                                        <p className="font-medium text-white">{selectedRide.driverName}</p>
                                        <div className="flex items-center gap-1 text-amber-400">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="text-sm">4.9</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Trip Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-800/50 rounded-xl text-center">
                                <MapPin className="w-6 h-6 mx-auto text-violet-400 mb-2" />
                                <p className="text-xl font-bold text-white">{selectedRide.distance?.toFixed(1)}</p>
                                <p className="text-sm text-gray-400">km</p>
                            </div>
                            <div className="p-4 bg-gray-800/50 rounded-xl text-center">
                                <Clock className="w-6 h-6 mx-auto text-emerald-400 mb-2" />
                                <p className="text-xl font-bold text-white">{selectedRide.duration}</p>
                                <p className="text-sm text-gray-400">min</p>
                            </div>
                            <div className="p-4 bg-gray-800/50 rounded-xl text-center">
                                <DollarSign className="w-6 h-6 mx-auto text-amber-400 mb-2" />
                                <p className="text-xl font-bold text-white">${selectedRide.fare?.toFixed(2)}</p>
                                <p className="text-sm text-gray-400">fare</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Button variant="outline" className="flex-1">
                                <Download className="w-5 h-5 mr-2" />
                                Download Receipt
                            </Button>
                            <Button className="flex-1" onClick={() => setSelectedRide(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
