'use client';

import { useEffect, useState } from 'react';
import {
    CreditCard,
    Search,
    Filter,
    DollarSign,
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    Download
} from 'lucide-react';
import { Card, Button, Badge, Input, Modal } from '@/components/ui';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Ride, Payment } from '@/types';

export default function AdminPaymentsPage() {
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

    useEffect(() => {
        const ridesRef = ref(database, 'rides');
        const unsubscribe = onValue(ridesRef, (snapshot) => {
            if (snapshot.exists()) {
                const ridesData: Ride[] = [];
                snapshot.forEach((child) => {
                    const ride = { id: child.key, ...child.val() } as Ride;
                    if (ride.status === 'COMPLETED') {
                        ridesData.push(ride);
                    }
                });
                ridesData.sort((a, b) => (b.timestamps.completedAt || 0) - (a.timestamps.completedAt || 0));
                setRides(ridesData);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredRides = rides.filter(ride => {
        const matchesSearch =
            ride.riderName?.toLowerCase().includes(search.toLowerCase()) ||
            ride.driverName?.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    const totalRevenue = rides.reduce((sum, r) => sum + (r.fare || 0), 0);
    const platformFee = totalRevenue * 0.2; // 20% platform fee
    const driverEarnings = totalRevenue - platformFee;

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
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
                <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Payments</h1>
                    <p className="text-gray-400 mt-1">Track all payment transactions</p>
                </div>
                <Button variant="outline">
                    <Download className="w-5 h-5 mr-2" />
                    Export
                </Button>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border-emerald-500/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Revenue</p>
                            <p className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                            <ArrowUpRight className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Platform Fees (20%)</p>
                            <p className="text-2xl font-bold text-white">${platformFee.toFixed(2)}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center">
                            <ArrowDownLeft className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Driver Payouts</p>
                            <p className="text-2xl font-bold text-white">${driverEarnings.toFixed(2)}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Transactions</p>
                            <p className="text-2xl font-bold text-white">{rides.length}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search */}
            <div className="flex gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Search by rider or driver name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        icon={<Search className="w-5 h-5" />}
                    />
                </div>
            </div>

            {/* Transactions Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="text-left py-4 px-4 text-gray-400 font-medium">Transaction</th>
                                <th className="text-left py-4 px-4 text-gray-400 font-medium">Rider</th>
                                <th className="text-left py-4 px-4 text-gray-400 font-medium">Driver</th>
                                <th className="text-left py-4 px-4 text-gray-400 font-medium">Amount</th>
                                <th className="text-left py-4 px-4 text-gray-400 font-medium">Fee</th>
                                <th className="text-left py-4 px-4 text-gray-400 font-medium">Date</th>
                                <th className="text-left py-4 px-4 text-gray-400 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRides.map((ride) => (
                                <tr key={ride.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                    <td className="py-4 px-4">
                                        <p className="text-white font-mono text-sm">{ride.id?.slice(0, 8)}...</p>
                                    </td>
                                    <td className="py-4 px-4">
                                        <p className="text-white">{ride.riderName}</p>
                                    </td>
                                    <td className="py-4 px-4">
                                        <p className="text-white">{ride.driverName || '—'}</p>
                                    </td>
                                    <td className="py-4 px-4">
                                        <p className="text-white font-medium">${ride.fare?.toFixed(2)}</p>
                                    </td>
                                    <td className="py-4 px-4">
                                        <p className="text-amber-400">${((ride.fare || 0) * 0.2).toFixed(2)}</p>
                                    </td>
                                    <td className="py-4 px-4">
                                        <p className="text-gray-400 text-sm">
                                            {formatDate(ride.timestamps.completedAt || ride.timestamps.requestedAt)}
                                        </p>
                                    </td>
                                    <td className="py-4 px-4">
                                        <Badge variant="success">Completed</Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredRides.length === 0 && (
                        <div className="text-center py-12">
                            <CreditCard className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                            <p className="text-gray-400">No transactions found</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
