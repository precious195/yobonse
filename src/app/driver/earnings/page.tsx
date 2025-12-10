'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Car,
  Clock,
  ChevronRight,
  Download
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card, Button, Badge } from '@/components/ui';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { DriverEarnings, Ride } from '@/types';

export default function DriverEarningsPage() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<DriverEarnings | null>(null);
  const [completedRides, setCompletedRides] = useState<Ride[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    // Listen to earnings
    const earningsRef = ref(database, `earnings/${user.uid}`);
    const unsubEarnings = onValue(earningsRef, (snapshot) => {
      if (snapshot.exists()) {
        setEarnings(snapshot.val() as DriverEarnings);
      } else {
        setEarnings({
          today: 0,
          week: 0,
          month: 0,
          total: 0,
          trips: { today: 0, week: 0, month: 0, total: 0 },
        });
      }
    });

    // Listen to completed rides
    const ridesRef = ref(database, 'rides');
    const unsubRides = onValue(ridesRef, (snapshot) => {
      if (snapshot.exists()) {
        const rides: Ride[] = [];
        snapshot.forEach((child) => {
          const ride = { id: child.key, ...child.val() } as Ride;
          if (ride.driverId === user.uid && ride.status === 'COMPLETED') {
            rides.push(ride);
          }
        });
        rides.sort((a, b) => (b.timestamps.completedAt || 0) - (a.timestamps.completedAt || 0));
        setCompletedRides(rides);
      }
      setLoading(false);
    });

    return () => {
      unsubEarnings();
      unsubRides();
    };
  }, [user?.uid]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPeriodEarnings = () => {
    if (!earnings) return { amount: 0, trips: 0 };
    return {
      amount: earnings[selectedPeriod],
      trips: earnings.trips[selectedPeriod],
    };
  };

  const periodData = getPeriodEarnings();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Earnings</h1>
          <p className="text-gray-400 mt-1">Track your earnings and trip history</p>
        </div>
        <Button variant="outline">
          <Download className="w-5 h-5 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {(['today', 'week', 'month'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-6 py-2 rounded-xl font-medium transition-all ${selectedPeriod === period
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Earnings Card */}
      <Card className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border-emerald-500/30">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="text-center md:text-left">
            <p className="text-gray-400 mb-2">
              {selectedPeriod === 'today' ? "Today's" : selectedPeriod === 'week' ? 'This Week' : 'This Month'} Earnings
            </p>
            <p className="text-5xl font-bold text-white">
              ${periodData.amount.toFixed(2)}
            </p>
            <div className="flex items-center gap-2 mt-3 justify-center md:justify-start">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400">+12% from last {selectedPeriod}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-800/50 rounded-xl text-center">
              <Car className="w-6 h-6 mx-auto text-emerald-400 mb-2" />
              <p className="text-2xl font-bold text-white">{periodData.trips}</p>
              <p className="text-sm text-gray-400">Trips</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-xl text-center">
              <Clock className="w-6 h-6 mx-auto text-violet-400 mb-2" />
              <p className="text-2xl font-bold text-white">
                {periodData.trips > 0 ? (periodData.amount / periodData.trips).toFixed(2) : '0.00'}
              </p>
              <p className="text-sm text-gray-400">Avg/Trip</p>
            </div>
          </div>
        </div>
      </Card>

      {/* All Time Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="text-center">
          <DollarSign className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">${earnings?.total.toFixed(2) || '0.00'}</p>
          <p className="text-sm text-gray-400">Total Earnings</p>
        </Card>
        <Card className="text-center">
          <Car className="w-8 h-8 mx-auto text-violet-400 mb-2" />
          <p className="text-2xl font-bold text-white">{earnings?.trips.total || 0}</p>
          <p className="text-sm text-gray-400">Total Trips</p>
        </Card>
        <Card className="text-center">
          <TrendingUp className="w-8 h-8 mx-auto text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">
            ${earnings && earnings.trips.total > 0 ? (earnings.total / earnings.trips.total).toFixed(2) : '0.00'}
          </p>
          <p className="text-sm text-gray-400">Avg per Trip</p>
        </Card>
        <Card className="text-center">
          <Calendar className="w-8 h-8 mx-auto text-cyan-400 mb-2" />
          <p className="text-2xl font-bold text-white">
            {completedRides.length > 0 ?
              Math.ceil((Date.now() - completedRides[completedRides.length - 1].timestamps.completedAt!) / (1000 * 60 * 60 * 24))
              : 0}
          </p>
          <p className="text-sm text-gray-400">Days Active</p>
        </Card>
      </div>

      {/* Recent Trips */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Recent Trips</h2>
          <a href="/driver/history" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
            View All
          </a>
        </div>

        {completedRides.length === 0 ? (
          <div className="text-center py-8">
            <Car className="w-12 h-12 mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400">No completed trips yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedRides.slice(0, 5).map((ride) => (
              <div key={ride.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center">
                    <Car className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium truncate max-w-[200px]">
                      {ride.destination.address}
                    </p>
                    <p className="text-sm text-gray-400">
                      {formatDate(ride.timestamps.completedAt!)} at {formatTime(ride.timestamps.completedAt!)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-400">+${ride.fare?.toFixed(2)}</p>
                  <p className="text-sm text-gray-400">{ride.distance?.toFixed(1)} km</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Payout Info */}
      <Card className="border-amber-500/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Weekly Payouts</h3>
            <p className="text-gray-400 text-sm mt-1">
              Earnings are transferred to your bank account every Monday. Make sure your payment details are up to date.
            </p>
          </div>
          <Button variant="outline" size="sm">
            Payment Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}
