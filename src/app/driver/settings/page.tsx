'use client';

import { useState } from 'react';
import {
    User,
    Mail,
    Phone,
    Car,
    CreditCard,
    Bell,
    Shield,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card, Button, Input } from '@/components/ui';
import { ref, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function DriverSettingsPage() {
    const { user, userData } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: userData?.name || '',
        phone: userData?.phone || '',
    });

    const [notifications, setNotifications] = useState({
        rideRequests: true,
        earnings: true,
        promotions: false,
    });

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);
        try {
            await updateProfile(user, { displayName: formData.name });
            await update(ref(database, `users/${user.uid}`), {
                name: formData.name,
                phone: formData.phone,
                updatedAt: Date.now(),
            });
            toast.success('Settings saved');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-gray-400 mt-1">Manage your account and preferences</p>
            </div>

            {/* Profile */}
            <Card>
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-400" />
                    Profile Information
                </h2>

                <div className="space-y-4">
                    <Input
                        label="Full Name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        icon={<User className="w-5 h-5" />}
                    />

                    <Input
                        label="Email Address"
                        type="email"
                        value={userData?.email || ''}
                        icon={<Mail className="w-5 h-5" />}
                        disabled
                    />

                    <Input
                        label="Phone Number"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        icon={<Phone className="w-5 h-5" />}
                    />
                </div>

                <Button
                    className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-teal-600"
                    onClick={handleSave}
                    loading={loading}
                >
                    Save Changes
                </Button>
            </Card>

            {/* Vehicle Info */}
            <Card>
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Car className="w-5 h-5 text-emerald-400" />
                    Vehicle Information
                </h2>

                <button className="flex items-center justify-between w-full p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
                    <div className="text-left">
                        <p className="text-white font-medium">Update Vehicle Details</p>
                        <p className="text-sm text-gray-400">Change your vehicle information</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
            </Card>

            {/* Payout */}
            <Card>
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    Payout Settings
                </h2>

                <div className="space-y-3">
                    <button className="flex items-center justify-between w-full p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
                        <div className="text-left">
                            <p className="text-white font-medium">Bank Account</p>
                            <p className="text-sm text-gray-400">Add or update your bank details</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>

                    <button className="flex items-center justify-between w-full p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
                        <div className="text-left">
                            <p className="text-white font-medium">Payout Schedule</p>
                            <p className="text-sm text-gray-400">Weekly (Monday)</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </Card>

            {/* Notifications */}
            <Card>
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-emerald-400" />
                    Notifications
                </h2>

                <div className="space-y-4">
                    {[
                        { key: 'rideRequests', label: 'Ride Requests', description: 'Get notified about new ride requests' },
                        { key: 'earnings', label: 'Earnings Updates', description: 'Receive earnings and payout notifications' },
                        { key: 'promotions', label: 'Promotions', description: 'Promotional offers and bonuses' },
                    ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                            <div>
                                <p className="text-white font-medium">{item.label}</p>
                                <p className="text-sm text-gray-400">{item.description}</p>
                            </div>
                            <button
                                onClick={() => setNotifications({
                                    ...notifications,
                                    [item.key]: !notifications[item.key as keyof typeof notifications],
                                })}
                                className={`w-12 h-6 rounded-full transition-colors ${notifications[item.key as keyof typeof notifications]
                                        ? 'bg-emerald-600'
                                        : 'bg-gray-700'
                                    }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${notifications[item.key as keyof typeof notifications]
                                        ? 'translate-x-6'
                                        : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Security */}
            <Card>
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    Security
                </h2>

                <div className="space-y-3">
                    <button className="flex items-center justify-between w-full p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
                        <div className="text-left">
                            <p className="text-white font-medium">Change Password</p>
                            <p className="text-sm text-gray-400">Update your password</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </Card>
        </div>
    );
}
