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
    CreditCard
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card, Button, Badge, StatsCard } from '@/components/ui';
import { ref, onValue, query, orderByChild, equalTo, limitToLast } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Ride } from '@/types';

export default function CustomerDashboard() {
    const { userData } = useAuth();
    const [activeRide, setActiveRide] = useState<Ride | null>(null);
    const [recentRides, setRecentRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userData?.id) return;

        // Listen for active rides
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

                // Find active ride
                const active = rides.find(r =>
                    ['REQUESTED', 'ACCEPTED', 'ARRIVING', 'STARTED'].includes(r.status)
                );
                setActiveRide(active || null);

                // Get recent completed rides
                const completed = rides
                    .filter(r => r.status === 'COMPLETED')
                    .sort((a, b) => (b.timestamps.completedAt || 0) - (a.timestamps.completedAt || 0))
                    .slice(0, 3);
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        Welcome back, {userData?.name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-gray-400 mt-1">Where would you like to go today?</p>
                </div>
                <Link href="/customer/ride">
                    <Button size="lg" className="group">
                        <MapPin className="w-5 h-5 mr-2" />
                        Book a Ride
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
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

                        {activeRide.driverName && (
                            <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl">
                                <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                    {activeRide.driverName.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-white">{activeRide.driverName}</p>
                                    <div className="flex items-center gap-1 text-amber-400">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="text-sm">4.9</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-white">${activeRide.fare?.toFixed(2)}</p>
                                    <p className="text-sm text-gray-400">{activeRide.duration} min</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex gap-4">
                        <Link href={`/customer/ride/${activeRide.id}`} className="flex-1">
                            <Button className="w-full">
                                <Navigation className="w-5 h-5 mr-2" />
                                Track Ride
                            </Button>
                        </Link>
                    </div>
                </Card>
            )}

            {/* Quick Actions */}
            {!activeRide && (
                <div className="grid md:grid-cols-3 gap-6">
                    <Link href="/customer/ride">
                        <Card hover className="cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                    <Car className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Book a Ride</h3>
                                    <p className="text-sm text-gray-400">Get picked up now</p>
                                </div>
                            </div>
                        </Card>
                    </Link>

                    <Link href="/customer/history">
                        <Card hover className="cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                    <Clock className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Ride History</h3>
                                    <p className="text-sm text-gray-400">View past trips</p>
                                </div>
                            </div>
                        </Card>
                    </Link>

                    <Link href="/customer/settings">
                        <Card hover className="cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                    <CreditCard className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Payment</h3>
                                    <p className="text-sm text-gray-400">Manage payment methods</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                </div>
            )}

            {/* Recent Rides */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Recent Rides</h2>
                    <Link href="/customer/history" className="text-violet-400 hover:text-violet-300 text-sm font-medium">
                        View All
                    </Link>
                </div>

                {recentRides.length === 0 ? (
                    <Card className="text-center py-12">
                        <Car className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No rides yet</h3>
                        <p className="text-gray-400 mb-6">Book your first ride and it will appear here</p>
                        <Link href="/customer/ride">
                            <Button>Book Your First Ride</Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {recentRides.map((ride) => (
                            <Card key={ride.id} hover className="cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
                                        <Car className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">{ride.destination.address}</p>
                                        <p className="text-sm text-gray-400">
                                            {new Date(ride.timestamps.completedAt!).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-white">${ride.fare?.toFixed(2)}</p>
                                        <Badge variant="success" className="mt-1">Completed</Badge>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
