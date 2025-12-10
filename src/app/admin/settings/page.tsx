'use client';

import { useState } from 'react';
import {
    Settings,
    Globe,
    DollarSign,
    Percent,
    Bell,
    Shield,
    Database,
    ChevronRight,
    Save
} from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(false);

    const [settings, setSettings] = useState({
        platformName: 'YABONSE',
        supportEmail: 'support@rideflow.com',
        baseFare: 2.00,
        perKmRate: 1.50,
        perMinRate: 0.25,
        platformFee: 20,
        minDriverRating: 4.0,
    });

    const handleSave = async () => {
        setLoading(true);
        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Settings saved successfully');
        setLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-gray-400 mt-1">Configure platform settings</p>
            </div>

            {/* General Settings */}
            <Card>
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-amber-400" />
                    General Settings
                </h2>

                <div className="space-y-4">
                    <Input
                        label="Platform Name"
                        type="text"
                        value={settings.platformName}
                        onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                    />

                    <Input
                        label="Support Email"
                        type="email"
                        value={settings.supportEmail}
                        onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    />
                </div>
            </Card>

            {/* Pricing Settings */}
            <Card>
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                    Pricing Configuration
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                    <Input
                        label="Base Fare ($)"
                        type="number"
                        step="0.01"
                        value={settings.baseFare}
                        onChange={(e) => setSettings({ ...settings, baseFare: parseFloat(e.target.value) })}
                    />

                    <Input
                        label="Per Kilometer Rate ($)"
                        type="number"
                        step="0.01"
                        value={settings.perKmRate}
                        onChange={(e) => setSettings({ ...settings, perKmRate: parseFloat(e.target.value) })}
                    />

                    <Input
                        label="Per Minute Rate ($)"
                        type="number"
                        step="0.01"
                        value={settings.perMinRate}
                        onChange={(e) => setSettings({ ...settings, perMinRate: parseFloat(e.target.value) })}
                    />

                    <Input
                        label="Platform Fee (%)"
                        type="number"
                        value={settings.platformFee}
                        onChange={(e) => setSettings({ ...settings, platformFee: parseInt(e.target.value) })}
                    />
                </div>

                <div className="mt-4 p-4 bg-gray-800/50 rounded-xl">
                    <p className="text-sm text-gray-400">
                        <strong className="text-white">Fare Formula:</strong> Base Fare + (Distance × Per KM Rate) + (Duration × Per Min Rate)
                    </p>
                </div>
            </Card>

            {/* Driver Settings */}
            <Card>
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Percent className="w-5 h-5 text-amber-400" />
                    Driver Requirements
                </h2>

                <div className="space-y-4">
                    <Input
                        label="Minimum Driver Rating"
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={settings.minDriverRating}
                        onChange={(e) => setSettings({ ...settings, minDriverRating: parseFloat(e.target.value) })}
                    />
                </div>
            </Card>

            {/* Quick Links */}
            <Card>
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-amber-400" />
                    Quick Actions
                </h2>

                <div className="space-y-3">
                    <button className="flex items-center justify-between w-full p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-gray-400" />
                            <div className="text-left">
                                <p className="text-white font-medium">Notification Templates</p>
                                <p className="text-sm text-gray-400">Customize email and push notifications</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>

                    <button className="flex items-center justify-between w-full p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-gray-400" />
                            <div className="text-left">
                                <p className="text-white font-medium">Security Settings</p>
                                <p className="text-sm text-gray-400">Configure authentication and access</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>

                    <button className="flex items-center justify-between w-full p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
                        <div className="flex items-center gap-3">
                            <Database className="w-5 h-5 text-gray-400" />
                            <div className="text-left">
                                <p className="text-white font-medium">Database Backup</p>
                                <p className="text-sm text-gray-400">Manage data backups and exports</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </Card>

            {/* Save Button */}
            <Button
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600"
                size="lg"
                onClick={handleSave}
                loading={loading}
            >
                <Save className="w-5 h-5 mr-2" />
                Save All Settings
            </Button>
        </div>
    );
}
