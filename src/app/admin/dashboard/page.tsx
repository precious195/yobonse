'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Users,
    Car,
    DollarSign,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    MapPin,
    ArrowRight,
    Activity
} from 'lucide-react';
import { Card, Badge, StatsCard, Button } from '@/components/ui';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { AppStats, Driver, Ride, User } from '@/types';

export default function AdminDashboard() {
    const [stats, setStats] = useState<AppStats>({
        totalUsers: 0,
        totalDrivers: 0,
        totalRides: 0,
        totalRevenue: 0,
        activeRides: 0,
        onlineDrivers: 0,
    });
    const [pendingDrivers, setPendingDrivers] = useState<Driver[]>([]);
    const [recentRides, setRecentRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Listen to stats
        const statsRef = ref(database, 'stats');
        const unsubStats = onValue(statsRef, (snapshot) => {
            if (snapshot.exists()) {
                setStats(snapshot.val() as AppStats);
            }
        });

        // Listen to users to calculate stats
        const usersRef = ref(database, 'users');
        const unsubUsers = onValue(usersRef, (snapshot) => {
            if (snapshot.exists()) {
                const usersData = snapshot.val();
                const count = Object.keys(usersData).length;
                setStats(prev => ({ ...prev, totalUsers: count }));
            }
        });

        // Listen to drivers
        const driversRef = ref(database, 'drivers');
        const unsubDrivers = onValue(driversRef, (snapshot) => {
            if (snapshot.exists()) {
                const driversData = snapshot.val();
                const drivers: Driver[] = Object.entries(driversData).map(([id, data]: [string, any]) => ({
                    id,
                    ...data,
                }));

                // Calculate stats
                const total = drivers.length;
                const online = drivers.filter(d => d.isOnline).length;
                const pending = drivers.filter(d => d.status === 'PENDING');

                setStats(prev => ({
                    ...prev,
                    totalDrivers: total,
                    onlineDrivers: online,
                }));
                setPendingDrivers(pending.slice(0, 5));
            }
            setLoading(false);
        });

        // Listen to rides
        const ridesRef = ref(database, 'rides');
        const unsubRides = onValue(ridesRef, (snapshot) => {
            if (snapshot.exists()) {
                const ridesData = snapshot.val();
                const rides: Ride[] = Object.entries(ridesData).map(([id, data]: [string, any]) => ({
                    id,
                    ...data,
                }));

                // Calculate stats
                const total = rides.length;
                const active = rides.filter(r =>
                    ['REQUESTED', 'ACCEPTED', 'ARRIVING', 'STARTED'].includes(r.status)
                ).length;
                const revenue = rides
                    .filter(r => r.status === 'COMPLETED')
                    .reduce((sum, r) => sum + (r.fare || 0), 0);

                setStats(prev => ({
                    ...prev,
                    totalRides: total,
                    activeRides: active,
                    totalRevenue: revenue,
                }));

                // Get recent rides
                const recent = rides
                    .sort((a, b) => b.timestamps.requestedAt - a.timestamps.requestedAt)
                    .slice(0, 5);
                setRecentRides(recent);
            }
        });

        return () => {
            unsubStats();
            unsubUsers();
            unsubDrivers();
            unsubRides();
        };
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'REQUESTED': return <Badge variant="warning">Requested</Badge>;
            case 'ACCEPTED': return <Badge variant="info">Accepted</Badge>;
            case 'ARRIVING': return <Badge variant="info">Arriving</Badge>;
            case 'STARTED': return <Badge variant="success">In Progress</Badge>;
            case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
            case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
                <p className="text-slate-500 mt-1">Monitor your platform's performance in real-time</p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Users"
                    value={stats.totalUsers.toLocaleString()}
                    icon={<Users className="w-5 h-5" />}
                    change="+12%"
                    changeType="increase"
                />
                <StatsCard
                    title="Total Drivers"
                    value={stats.totalDrivers.toLocaleString()}
                    icon={<Car className="w-5 h-5" />}
                    change="+8%"
                    changeType="increase"
                />
                <StatsCard
                    title="Total Rides"
                    value={stats.totalRides.toLocaleString()}
                    icon={<MapPin className="w-5 h-5" />}
                    change="+24%"
                    changeType="increase"
                />
                <StatsCard
                    title="Total Revenue"
                    value={`$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    icon={<DollarSign className="w-5 h-5" />}
                    change="+18%"
                    changeType="increase"
                />
            </div>

            {/* Live Stats */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border-emerald-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Online Drivers</p>
                            <p className="text-4xl font-bold text-white mt-1">{stats.onlineDrivers}</p>
                        </div>
                        <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                            <Activity className="w-7 h-7 text-emerald-400" />
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border-violet-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Active Rides</p>
                            <p className="text-4xl font-bold text-white mt-1">{stats.activeRides}</p>
                        </div>
                        <div className="w-14 h-14 bg-violet-500/20 rounded-xl flex items-center justify-center">
                            <MapPin className="w-7 h-7 text-violet-400" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Content Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Pending Driver Verifications */}
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-white">Pending Verifications</h2>
                        <Link href="/admin/drivers?status=pending" className="text-amber-400 hover:text-amber-300 text-sm font-medium">
                            View All
                        </Link>
                    </div>

                    {pendingDrivers.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
                            <p className="text-gray-400">No pending verifications</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingDrivers.map((driver) => (
                                <div key={driver.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
                                            {driver.userId.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{driver.vehicle?.make} {driver.vehicle?.model}</p>
                                            <p className="text-sm text-gray-400">{driver.vehicle?.licensePlate}</p>
                                        </div>
                                    </div>
                                    <Link href={`/admin/drivers/${driver.id}`}>
                                        <Button size="sm" variant="outline">
                                            Review
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Recent Rides */}
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-white">Recent Rides</h2>
                        <Link href="/admin/rides" className="text-violet-400 hover:text-violet-300 text-sm font-medium">
                            View All
                        </Link>
                    </div>

                    {recentRides.length === 0 ? (
                        <div className="text-center py-8">
                            <Car className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                            <p className="text-gray-400">No rides yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentRides.map((ride) => (
                                <div key={ride.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center">
                                            <Car className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white truncate max-w-[200px]">
                                                {ride.destination.address}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {new Date(ride.timestamps.requestedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {getStatusBadge(ride.status)}
                                        <p className="text-sm text-gray-400 mt-1">${ride.fare?.toFixed(2) || '0.00'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
                <Link href="/admin/drivers">
                    <Card hover className="cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                <Car className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-white">Manage Drivers</h3>
                                <p className="text-sm text-gray-400">View and verify drivers</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                        </div>
                    </Card>
                </Link>

                <Link href="/admin/users">
                    <Card hover className="cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-white">Manage Users</h3>
                                <p className="text-sm text-gray-400">View customer accounts</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                        </div>
                    </Card>
                </Link>

                <Link href="/admin/reports">
                    <Card hover className="cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-white">View Reports</h3>
                                <p className="text-sm text-gray-400">Analytics & exports</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                        </div>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
