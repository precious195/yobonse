'use client';

import { useState } from 'react';
import {
    User,
    Mail,
    Phone,
    CreditCard,
    Bell,
    Shield,
    ChevronRight,
    Plus,
    Trash2,
    Check
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card, Button, Input, Badge, Modal } from '@/components/ui';
import { ref, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { updateProfile, updateEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function CustomerSettingsPage() {
    const { user, userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const [formData, setFormData] = useState({
        name: userData?.name || '',
        email: userData?.email || '',
        phone: userData?.phone || '',
    });

    const [notifications, setNotifications] = useState({
        rideUpdates: true,
        promotions: false,
        newsletter: false,
    });

    const savedCards = [
        { id: '1', last4: '4242', brand: 'Visa', isDefault: true },
        { id: '2', last4: '5678', brand: 'Mastercard', isDefault: false },
    ];

    const handleSaveProfile = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Update Firebase Auth profile
            await updateProfile(user, { displayName: formData.name });

            // Update database
            await update(ref(database, `users/${user.uid}`), {
                name: formData.name,
                phone: formData.phone,
                updatedAt: Date.now(),
            });

            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-gray-400 mt-1">Manage your account preferences</p>
            </div>

            {/* Profile Settings */}
            <Card>
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-violet-400" />
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
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    className="w-full mt-6"
                    onClick={handleSaveProfile}
                    loading={loading}
                >
                    Save Changes
                </Button>
            </Card>

            {/* Payment Methods */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-violet-400" />
                        Payment Methods
                    </h2>
                    <Button size="sm" variant="outline" onClick={() => setShowPaymentModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Card
                    </Button>
                </div>

                <div className="space-y-3">
                    {savedCards.map((card) => (
                        <div key={card.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-8 bg-gray-700 rounded flex items-center justify-center">
                                    <span className="text-xs font-bold text-gray-300">{card.brand}</span>
                                </div>
                                <div>
                                    <p className="text-white font-medium">•••• {card.last4}</p>
                                    {card.isDefault && <Badge variant="success">Default</Badge>}
                                </div>
                            </div>
                            <button className="text-gray-400 hover:text-red-400 transition-colors">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Notifications */}
            <Card>
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-violet-400" />
                    Notifications
                </h2>

                <div className="space-y-4">
                    {[
                        { key: 'rideUpdates', label: 'Ride Updates', description: 'Get notified about your ride status' },
                        { key: 'promotions', label: 'Promotions', description: 'Receive promotional offers and discounts' },
                        { key: 'newsletter', label: 'Newsletter', description: 'Stay updated with our latest news' },
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
                                        ? 'bg-violet-600'
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
                    <Shield className="w-5 h-5 text-violet-400" />
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

                    <button className="flex items-center justify-between w-full p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
                        <div className="text-left">
                            <p className="text-white font-medium">Two-Factor Authentication</p>
                            <p className="text-sm text-gray-400">Add an extra layer of security</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-500/30">
                <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
                <p className="text-gray-400 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button variant="danger">
                    Delete Account
                </Button>
            </Card>

            {/* Add Payment Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                title="Add Payment Method"
            >
                <div className="space-y-4">
                    <Input
                        label="Card Number"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        icon={<CreditCard className="w-5 h-5" />}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Expiry Date"
                            type="text"
                            placeholder="MM/YY"
                        />
                        <Input
                            label="CVC"
                            type="text"
                            placeholder="123"
                        />
                    </div>
                    <Input
                        label="Cardholder Name"
                        type="text"
                        placeholder="John Doe"
                    />
                </div>
                <div className="flex gap-4 mt-6">
                    <Button variant="outline" className="flex-1" onClick={() => setShowPaymentModal(false)}>
                        Cancel
                    </Button>
                    <Button className="flex-1">
                        Add Card
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
