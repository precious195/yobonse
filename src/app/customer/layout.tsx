'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Car,
    Home,
    Clock,
    Settings,
    LogOut,
    MapPin,
    Menu,
    X,
    Package,
    PlusCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Avatar, Spinner } from '@/components/ui';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const navigation = [
    { name: 'Dashboard', href: '/customer/dashboard', icon: Home },
    { name: 'Book Now', href: '/customer/book', icon: PlusCircle },
    { name: 'Request Ride', href: '/customer/ride', icon: MapPin },
    { name: 'Send Parcel', href: '/customer/delivery', icon: Package },
    { name: 'History', href: '/customer/history', icon: Clock },
    { name: 'Settings', href: '/customer/settings', icon: Settings },
];

export default function CustomerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, userData, loading, signOut } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen" style={{ background: 'var(--background)' }}>
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-screen w-72 shadow-lg transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                                <Car className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>YABONSE</span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden" style={{ color: 'var(--muted)' }}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--sidebar-border)', background: 'var(--background-secondary)' }}>
                        <div className="flex items-center gap-3">
                            <Avatar name={userData?.name || 'User'} size="md" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate" style={{ color: 'var(--foreground)' }}>{userData?.name}</p>
                                <p className="text-sm truncate" style={{ color: 'var(--muted)' }}>{userData?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium`}
                                    style={{
                                        background: isActive ? 'var(--primary)' : 'transparent',
                                        color: isActive ? 'white' : 'var(--muted)',
                                    }}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Theme Toggle & Sign Out */}
                    <div className="px-4 py-4 space-y-2" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
                        <ThemeToggle
                            showLabel
                            className="w-full"
                        />
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
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
                <header
                    className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur-xl lg:hidden"
                    style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderBottom: '1px solid var(--sidebar-border)'
                    }}
                >
                    <button
                        onClick={() => setSidebarOpen(true)}
                        style={{ color: 'var(--muted)' }}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                            <Car className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold" style={{ color: 'var(--foreground)' }}>YABONSE</span>
                    </Link>
                    <Avatar name={userData?.name || 'User'} size="sm" />
                </header>

                {/* Page content */}
                <main className="p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
