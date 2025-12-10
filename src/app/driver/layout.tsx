'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Car,
    Home,
    Clock,
    Settings,
    LogOut,
    FileText,
    DollarSign,
    Menu,
    X,
    Navigation
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Avatar, Spinner, Badge } from '@/components/ui';
import { useState, useEffect as useEff } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Driver } from '@/types';

const navigation = [
    { name: 'Dashboard', href: '/driver/dashboard', icon: Home },
    { name: 'Active Trip', href: '/driver/trip', icon: Navigation },
    { name: 'Earnings', href: '/driver/earnings', icon: DollarSign },
    { name: 'Documents', href: '/driver/documents', icon: FileText },
    { name: 'History', href: '/driver/history', icon: Clock },
    { name: 'Settings', href: '/driver/settings', icon: Settings },
];

export default function DriverLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, userData, loading, signOut } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [driverData, setDriverData] = useState<Driver | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
        if (!loading && userData && userData.role !== 'DRIVER') {
            router.push('/customer/dashboard');
        }
    }, [user, userData, loading, router]);

    // Fetch driver data
    useEff(() => {
        if (!user?.uid) return;

        const driverRef = ref(database, `drivers/${user.uid}`);
        const unsubscribe = onValue(driverRef, (snapshot) => {
            if (snapshot.exists()) {
                setDriverData({ id: snapshot.key, ...snapshot.val() } as Driver);
            }
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const getStatusBadge = () => {
        if (!driverData) return null;
        switch (driverData.status) {
            case 'PENDING':
                return <Badge variant="warning">Pending Verification</Badge>;
            case 'APPROVED':
                return driverData.isOnline
                    ? <Badge variant="success">Online</Badge>
                    : <Badge variant="default">Offline</Badge>;
            case 'REJECTED':
                return <Badge variant="danger">Rejected</Badge>;
            case 'BLOCKED':
                return <Badge variant="danger">Blocked</Badge>;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f]">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-screen w-72 bg-gray-900/95 backdrop-blur-xl border-r border-gray-800 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                                <Car className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-white">RideFlow</span>
                                <span className="text-xs text-emerald-400 block">Driver</span>
                            </div>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-gray-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Driver Info */}
                    <div className="px-6 py-4 border-b border-gray-800">
                        <div className="flex items-center gap-3">
                            <Avatar name={userData?.name || 'Driver'} size="md" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">{userData?.name}</p>
                                {getStatusBadge()}
                            </div>
                        </div>
                        {driverData?.vehicle && (
                            <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
                                <p className="text-sm text-white">
                                    {driverData.vehicle.make} {driverData.vehicle.model}
                                </p>
                                <p className="text-xs text-gray-400">{driverData.vehicle.licensePlate}</p>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                            ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-white border border-emerald-500/30'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                        }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Sign Out */}
                    <div className="px-4 py-4 border-t border-gray-800">
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-72">
                {/* Mobile header */}
                <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 lg:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-gray-400 hover:text-white"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
                            <Car className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-white">Driver</span>
                    </div>
                    <Avatar name={userData?.name || 'Driver'} size="sm" />
                </header>

                {/* Page content */}
                <main className="p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
