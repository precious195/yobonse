'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Car,
    Map,
    CreditCard,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    Shield,
    DollarSign,
    Package
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Avatar, Spinner } from '@/components/ui';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useState } from 'react';

const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Drivers', href: '/admin/drivers', icon: Car },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Rides', href: '/admin/rides', icon: Map },
    { name: 'Deliveries', href: '/admin/deliveries', icon: Package },
    { name: 'Pricing', href: '/admin/pricing', icon: DollarSign },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Reports', href: '/admin/reports', icon: FileText },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, userData, loading, signOut } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Allow login page to render without any auth checks
    const isLoginPage = pathname === '/admin/login';

    useEffect(() => {
        // Skip all redirects for login page
        if (isLoginPage) return;

        if (!loading && !user) {
            router.push('/admin/login');
        }
        if (!loading && userData && userData.role !== 'ADMIN') {
            router.push('/');
        }
    }, [user, userData, loading, router, isLoginPage]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/admin/login');
    };

    // If on login page, just render the children without any layout
    if (isLoginPage) {
        return <>{children}</>;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!user || userData?.role !== 'ADMIN') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-slate-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-screen w-72 bg-white/95 backdrop-blur-xl border-r border-slate-200 shadow-lg transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
                        <Link href="/admin/dashboard" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-slate-900">YABONSE</span>
                                <span className="text-xs text-violet-600 block">Admin Panel</span>
                            </div>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Admin Info */}
                    <div className="px-6 py-4 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <Avatar name={userData?.name || 'Admin'} size="md" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 truncate">{userData?.name}</p>
                                <p className="text-sm text-violet-600">Administrator</p>
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
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700 border border-violet-200'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Theme Toggle & Sign Out */}
                    <div className="px-4 py-4 border-t border-slate-200 space-y-2">
                        <ThemeToggle
                            showLabel
                            className="w-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                        />
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
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
                <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-200 lg:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-slate-600 hover:text-slate-900"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-slate-900">Admin</span>
                    </div>
                    <Avatar name={userData?.name || 'Admin'} size="sm" />
                </header>

                {/* Page content */}
                <main className="p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
