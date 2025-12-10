'use client';

import { useState, useEffect } from 'react';
import {
    DollarSign,
    Save,
    Car,
    Package,
    AlertCircle,
    Check
} from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import { ref, get, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';
import { PricingSettings } from '@/types';

const DEFAULT_PRICING: PricingSettings = {
    rideBaseFare: 15,
    ridePerKmRate: 5,
    rideMinFare: 20,
    deliverySmallBase: 25,
    deliveryMediumBase: 40,
    deliveryLargeBase: 60,
    deliveryExtraLargeBase: 100,
    deliveryPerKmRate: 8,
    deliveryUrgentFee: 20,
    currency: 'ZMW',
    currencySymbol: 'K'
};

export default function PricingPage() {
    const { user } = useAuth();
    const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPricing();
    }, []);

    const fetchPricing = async () => {
        try {
            const settingsRef = ref(database, 'settings/pricing');
            const snapshot = await get(settingsRef);
            if (snapshot.exists()) {
                setPricing({ ...DEFAULT_PRICING, ...snapshot.val() });
            }
        } catch (error) {
            console.error('Error fetching pricing:', error);
            toast.error('Failed to load pricing');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const settingsRef = ref(database, 'settings/pricing');
            await set(settingsRef, {
                ...pricing,
                updatedAt: Date.now(),
                updatedBy: user.uid
            });
            toast.success('Pricing updated successfully!');
        } catch (error) {
            console.error('Error saving pricing:', error);
            toast.error('Failed to save pricing');
        } finally {
            setSaving(false);
        }
    };

    const updatePricing = (field: keyof PricingSettings, value: string | number) => {
        setPricing(prev => ({
            ...prev,
            [field]: typeof value === 'string' && !isNaN(Number(value)) && field !== 'currency' && field !== 'currencySymbol'
                ? Number(value)
                : value
        }));
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pricing Control</h1>
                    <p className="text-slate-500">Manage prices for rides and deliveries</p>
                </div>
                <Button onClick={handleSave} loading={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                </Button>
            </div>

            {/* Currency Settings */}
            <Card>
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-violet-600" />
                        Currency Settings
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Currency Code</label>
                            <input
                                type="text"
                                value={pricing.currency}
                                onChange={(e) => updatePricing('currency', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                placeholder="ZMW"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Currency Symbol</label>
                            <input
                                type="text"
                                value={pricing.currencySymbol}
                                onChange={(e) => updatePricing('currencySymbol', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                placeholder="K"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Ride Pricing */}
            <Card>
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Car className="w-5 h-5 text-violet-600" />
                        Ride Pricing
                    </h2>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Base Fare ({pricing.currencySymbol})
                            </label>
                            <input
                                type="number"
                                value={pricing.rideBaseFare}
                                onChange={(e) => updatePricing('rideBaseFare', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Starting price for all rides</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Per KM Rate ({pricing.currencySymbol})
                            </label>
                            <input
                                type="number"
                                value={pricing.ridePerKmRate}
                                onChange={(e) => updatePricing('ridePerKmRate', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Price per kilometer</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Minimum Fare ({pricing.currencySymbol})
                            </label>
                            <input
                                type="number"
                                value={pricing.rideMinFare}
                                onChange={(e) => updatePricing('rideMinFare', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Lowest ride price</p>
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-violet-50 rounded-xl">
                        <p className="text-sm text-violet-700">
                            <strong>Formula:</strong> Base Fare + (Distance × Per KM Rate)
                        </p>
                    </div>
                </div>
            </Card>

            {/* Delivery Pricing */}
            <Card>
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-emerald-600" />
                        Delivery Pricing
                    </h2>

                    {/* Size-based pricing */}
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Base Price by Parcel Size</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                📄 Small ({pricing.currencySymbol})
                            </label>
                            <input
                                type="number"
                                value={pricing.deliverySmallBase}
                                onChange={(e) => updatePricing('deliverySmallBase', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Up to 1kg</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                📦 Medium ({pricing.currencySymbol})
                            </label>
                            <input
                                type="number"
                                value={pricing.deliveryMediumBase}
                                onChange={(e) => updatePricing('deliveryMediumBase', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Up to 5kg</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                📦 Large ({pricing.currencySymbol})
                            </label>
                            <input
                                type="number"
                                value={pricing.deliveryLargeBase}
                                onChange={(e) => updatePricing('deliveryLargeBase', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Up to 20kg</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                🚚 Extra Large ({pricing.currencySymbol})
                            </label>
                            <input
                                type="number"
                                value={pricing.deliveryExtraLargeBase}
                                onChange={(e) => updatePricing('deliveryExtraLargeBase', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Up to 50kg</p>
                        </div>
                    </div>

                    {/* Additional fees */}
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Additional Fees</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                Per KM Rate ({pricing.currencySymbol})
                            </label>
                            <input
                                type="number"
                                value={pricing.deliveryPerKmRate}
                                onChange={(e) => updatePricing('deliveryPerKmRate', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Added to base price per km</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                Urgent Fee ({pricing.currencySymbol})
                            </label>
                            <input
                                type="number"
                                value={pricing.deliveryUrgentFee}
                                onChange={(e) => updatePricing('deliveryUrgentFee', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Extra charge for urgent deliveries</p>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-emerald-50 rounded-xl">
                        <p className="text-sm text-emerald-700">
                            <strong>Formula:</strong> Base Price (by size) + (Distance × Per KM) + Urgent Fee (if applicable)
                        </p>
                    </div>
                </div>
            </Card>

            {/* Preview */}
            <Card>
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Price Preview (10km trip)</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-violet-50 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Car className="w-5 h-5 text-violet-600" />
                                <span className="font-semibold text-slate-900">Ride</span>
                            </div>
                            <p className="text-2xl font-bold text-violet-600">
                                {pricing.currencySymbol}{pricing.rideBaseFare + (pricing.ridePerKmRate * 10)}
                            </p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Package className="w-5 h-5 text-emerald-600" />
                                <span className="font-semibold text-slate-900">Delivery (Medium)</span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-600">
                                {pricing.currencySymbol}{pricing.deliveryMediumBase + (pricing.deliveryPerKmRate * 10)}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
