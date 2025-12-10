'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Car, Package, ArrowRight, Clock, MapPin, History } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui';
import { ref, get, query, orderByChild, equalTo, limitToLast } from 'firebase/database';
import { database } from '@/lib/firebase';

interface RecentActivity {
    type: 'ride' | 'delivery';
    destination: string;
    fare: number;
    date: string;
}

export default function BookPage() {
    const { user, userData } = useAuth();
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [stats, setStats] = useState({ rides: 0, deliveries: 0 });

    useEffect(() => {
        if (!user) return;

        const fetchActivity = async () => {
            try {
                // Fetch recent rides
                const ridesRef = ref(database, 'rides');
                const ridesSnapshot = await get(ridesRef);

                // Fetch recent deliveries
                const deliveriesRef = ref(database, 'deliveries');
                const deliveriesSnapshot = await get(deliveriesRef);

                const activities: RecentActivity[] = [];
                let rideCount = 0;
                let deliveryCount = 0;

                if (ridesSnapshot.exists()) {
                    ridesSnapshot.forEach((child) => {
                        const ride = child.val();
                        if (ride.riderId === user.uid) {
                            rideCount++;
                            if (ride.status === 'COMPLETED' && activities.length < 3) {
                                activities.push({
                                    type: 'ride',
                                    destination: ride.destination?.address || 'Unknown',
                                    fare: ride.fare || 0,
                                    date: new Date(ride.timestamps?.completedAt || ride.timestamps?.requestedAt).toLocaleDateString()
                                });
                            }
                        }
                    });
                }

                if (deliveriesSnapshot.exists()) {
                    deliveriesSnapshot.forEach((child) => {
                        const delivery = child.val();
                        if (delivery.senderId === user.uid) {
                            deliveryCount++;
                            if (delivery.status === 'DELIVERED' && activities.length < 3) {
                                activities.push({
                                    type: 'delivery',
                                    destination: delivery.dropoff?.address || 'Unknown',
                                    fare: delivery.fare || 0,
                                    date: new Date(delivery.timestamps?.deliveredAt || delivery.timestamps?.requestedAt).toLocaleDateString()
                                });
                            }
                        }
                    });
                }

                setRecentActivity(activities.slice(0, 3));
                setStats({ rides: rideCount, deliveries: deliveryCount });
            } catch (error) {
                console.error('Error fetching activity:', error);
            }
        };

        fetchActivity();
    }, [user]);

    return (
        <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8" style={{ background: 'var(--background)' }}>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8 sm:mb-12">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                        What would you like to do?
                    </h1>
                    <p className="text-lg" style={{ color: 'var(--muted)' }}>
                        Choose a service to get started
                    </p>
                </div>

                {/* Service Cards */}
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
                    {/* Request Ride Card - Purple Primary */}
                    <Link href="/customer/ride" className="group">
                        <div
                            className="p-6 sm:p-8 h-full rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
                            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                        >
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 dark:bg-purple-900/20 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:scale-150 transition-transform duration-500" />

                            <div className="relative">
                                {/* Icon */}
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                                    <Car className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                </div>

                                {/* Content */}
                                <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                                    Request Ride
                                </h2>
                                <p className="mb-6" style={{ color: 'var(--muted)' }}>
                                    Get a ride to your destination with our verified drivers
                                </p>

                                {/* Action */}
                                <div className="flex items-center font-semibold group-hover:gap-3 gap-2 transition-all" style={{ color: 'var(--primary)' }}>
                                    <span>Book Now</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Send Parcel Card - Green Accent */}
                    <Link href="/customer/delivery" className="group">
                        <div
                            className="p-6 sm:p-8 h-full rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
                            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                        >
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 dark:bg-emerald-900/20 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:scale-150 transition-transform duration-500" />

                            <div className="relative">
                                {/* Icon */}
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                                    <Package className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                </div>

                                {/* Content */}
                                <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                                    Send Parcel
                                </h2>
                                <p className="mb-6" style={{ color: 'var(--muted)' }}>
                                    Deliver packages anywhere in the city quickly and safely
                                </p>

                                {/* Action */}
                                <div className="flex items-center font-semibold group-hover:gap-3 gap-2 transition-all" style={{ color: 'var(--accent)' }}>
                                    <span>Send Now</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 sm:p-6 text-center rounded-2xl shadow-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Car className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                            <span className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{stats.rides}</span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>Total Rides</p>
                    </div>
                    <div className="p-4 sm:p-6 text-center rounded-2xl shadow-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Package className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                            <span className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{stats.deliveries}</span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>Total Deliveries</p>
                    </div>
                </div>

                {/* Recent Activity */}
                {recentActivity.length > 0 && (
                    <div className="p-4 sm:p-6 rounded-2xl shadow-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                            <History className="w-5 h-5" style={{ color: 'var(--muted)' }} />
                            Recent Activity
                        </h3>
                        <div className="space-y-3">
                            {recentActivity.map((activity, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 rounded-xl"
                                    style={{ background: 'var(--background-secondary)' }}
                                >
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{
                                            background: activity.type === 'ride'
                                                ? 'rgba(124, 58, 237, 0.1)'
                                                : 'rgba(5, 150, 105, 0.1)'
                                        }}
                                    >
                                        {activity.type === 'ride'
                                            ? <Car className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                                            : <Package className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate" style={{ color: 'var(--foreground)' }}>{activity.destination}</p>
                                        <p className="text-sm" style={{ color: 'var(--muted)' }}>{activity.date}</p>
                                    </div>
                                    <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                        K{activity.fare}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

