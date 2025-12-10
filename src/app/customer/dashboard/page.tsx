'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    MapPin,
    Clock,
    Car,
    Star,
    ArrowRight,
    Navigation,
    CreditCard,
    Package
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card, Button, Badge, StatsCard } from '@/components/ui';
import { CarAnimation3D } from '@/components/animations/CarAnimation3D';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Ride } from '@/types';

export default function CustomerDashboard() {
    const { userData } = useAuth();
    const [activeRide, setActiveRide] = useState<Ride | null>(null);
    const [recentRides, setRecentRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userData?.id) return;

        const ridesRef = ref(database, 'rides');
        const unsubscribe = onValue(ridesRef, (snapshot) => {
            if (snapshot.exists()) {
                const rides: Ride[] = [];
                snapshot.forEach((child) => {
                    const ride = { id: child.key, ...child.val() } as Ride;
                    if (ride.riderId === userData.id) {
                        rides.push(ride);
                    }
                });

                const active = rides.find(r =>
                    ['REQUESTED', 'ACCEPTED', 'ARRIVING', 'STARTED'].includes(r.status)
                );
                setActiveRide(active || null);

                const completed = rides
                    .filter(r => r.status === 'COMPLETED')
                    .sort((a, b) => (b.timestamps?.completedAt || 0) - (a.timestamps?.completedAt || 0))
                    .slice(0, 5);
                setRecentRides(completed);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userData?.id]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'REQUESTED': return 'warning';
            case 'ACCEPTED': return 'info';
            case 'ARRIVING': return 'info';
            case 'STARTED': return 'success';
            case 'COMPLETED': return 'success';
            case 'CANCELLED': return 'danger';
            default: return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'REQUESTED': return 'Finding Driver...';
            case 'ACCEPTED': return 'Driver Assigned';
            case 'ARRIVING': return 'Driver Arriving';
            case 'STARTED': return 'In Progress';
            case 'COMPLETED': return 'Completed';
            case 'CANCELLED': return 'Cancelled';
            default: return status;
        }
    };

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div>
                <h1 className="text-3xl font-bold text-white">
                    Welcome back, {userData?.name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-gray-400 mt-1">What would you like to do today?</p>
            </div>

            {/* Quick Action Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
                {/* Request Ride Card */}
                <Link href="/customer/ride" className="group">
                    <Card className="p-5 hover:border-violet-500/50 transition-all cursor-pointer bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border-violet-500/20">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-110 transition-transform">
                                <Car className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white">Request Ride</h3>
                                <p className="text-gray-400 text-sm">Go anywhere in the city</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-violet-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Card>
                </Link>

                {/* Send Parcel Card */}
                <Link href="/customer/delivery" className="group">
                    <Card className="p-5 hover:border-emerald-500/50 transition-all cursor-pointer bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border-emerald-500/20">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform">
                                <Package className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white">Send Parcel</h3>
                                <p className="text-gray-400 text-sm">Deliver packages fast</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Card>
                </Link>
            </div>

            {/* Active Ride Card */}
            {activeRide && (
                <Card className="border-violet-500/30 bg-gradient-to-r from-violet-600/10 to-indigo-600/10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                            Active Ride
                        </h2>
                        <Badge variant={getStatusColor(activeRide.status) as any}>
                            {getStatusText(activeRide.status)}
                        </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Pickup</p>
                                    <p className="text-white">{activeRide.pickup?.address || 'Loading...'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Destination</p>
                                    <p className="text-white">{activeRide.destination?.address || 'Loading...'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-center gap-4">
                            {activeRide.driverName && (
                                <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold">{activeRide.driverName[0]}</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{activeRide.driverName}</p>
                                        <div className="flex items-center gap-1 text-amber-400">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="text-sm">4.8</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeRide.fare && (
                                <div className="text-center">
                                    <p className="text-gray-400 text-sm">Estimated Fare</p>
                                    <p className="text-2xl font-bold text-white">K{activeRide.fare}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            {/* Recent Rides */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Recent Rides</h2>
                    <Link href="/customer/history" className="text-violet-400 hover:text-violet-300 text-sm flex items-center gap-1">
                        View All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {recentRides.length > 0 ? (
                    <div className="space-y-3">
                        {recentRides.map((ride) => (
                            <Card key={ride.id} className="hover:border-gray-600 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-indigo-600/20 rounded-xl flex items-center justify-center">
                                            <Car className="w-6 h-6 text-violet-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{ride.destination?.address || 'Unknown'}</p>
                                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(ride.timestamps?.completedAt || 0).toLocaleDateString()}
                                                </span>
                                                {ride.distance && (
                                                    <span className="flex items-center gap-1">
                                                        <Navigation className="w-3 h-3" />
                                                        {ride.distance} km
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-semibold">K{ride.fare || 0}</p>
                                        <Badge variant="success" className="text-xs">Completed</Badge>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-12">
                        <CarAnimation3D />
                        <h3 className="text-lg font-medium text-slate-800 mt-4">No rides yet</h3>
                        <p className="text-slate-500 mt-1">Book your first ride and it will appear here.</p>
                        <Link href="/customer/ride">
                            <Button className="mt-4">
                                <Car className="w-4 h-4 mr-2" />
                                Book Your First Ride
                            </Button>
                        </Link>
                    </Card>
                )}
            </div>
        </div>
    );
}
