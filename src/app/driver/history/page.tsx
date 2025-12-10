'use client';

import { useEffect, useState } from 'react';
import {
  Car,
  Calendar,
  Clock,
  DollarSign,
  Star,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card, Badge, Modal, Avatar } from '@/components/ui';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Ride } from '@/types';

export default function DriverHistoryPage() {
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const ridesRef = ref(database, 'rides');
    const unsubscribe = onValue(ridesRef, (snapshot) => {
      if (snapshot.exists()) {
        const ridesData: Ride[] = [];
        snapshot.forEach((child) => {
          const ride = { id: child.key, ...child.val() } as Ride;
          if (ride.driverId === user.uid &&
            ['COMPLETED', 'CANCELLED'].includes(ride.status)) {
            ridesData.push(ride);
          }
        });
        ridesData.sort((a, b) =>
          (b.timestamps.completedAt || b.timestamps.cancelledAt || 0) -
          (a.timestamps.completedAt || a.timestamps.cancelledAt || 0)
        );
        setRides(ridesData);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const completedRides = rides.filter(r => r.status === 'COMPLETED');
  const totalEarnings = completedRides.reduce((sum, r) => sum + (r.fare || 0), 0);
  const totalDistance = completedRides.reduce((sum, r) => sum + (r.distance || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Trip History</h1>
        <p className="text-gray-400 mt-1">View all your completed trips</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-white">{completedRides.length}</p>
          <p className="text-sm text-gray-400">Completed Trips</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-emerald-400">${totalEarnings.toFixed(2)}</p>
          <p className="text-sm text-gray-400">Total Earned</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-white">{totalDistance.toFixed(0)} km</p>
          <p className="text-sm text-gray-400">Distance Driven</p>
        </Card>
      </div>

      {/* Trips List */}
      {rides.length === 0 ? (
        <Card className="text-center py-12">
          <Car className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No trips yet</h3>
          <p className="text-gray-400">Your completed trips will appear here</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => (
            <Card
              key={ride.id}
              hover
              className="cursor-pointer"
              onClick={() => setSelectedRide(ride)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ride.status === 'COMPLETED' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                  }`}>
                  <Car className={`w-6 h-6 ${ride.status === 'COMPLETED' ? 'text-emerald-400' : 'text-red-400'
                    }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white truncate">{ride.destination.address}</p>
                      <p className="text-sm text-gray-400 truncate">From: {ride.pickup.address}</p>
                    </div>
                    <Badge variant={ride.status === 'COMPLETED' ? 'success' : 'danger'}>
                      {ride.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(ride.timestamps.completedAt || ride.timestamps.cancelledAt || ride.timestamps.requestedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {ride.distance?.toFixed(1)} km
                    </span>
                    {ride.status === 'COMPLETED' && (
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        +${ride.fare?.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-500" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Trip Detail Modal */}
      <Modal
        isOpen={!!selectedRide}
        onClose={() => setSelectedRide(null)}
        title="Trip Details"
      >
        {selectedRide && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant={selectedRide.status === 'COMPLETED' ? 'success' : 'danger'}>
                {selectedRide.status}
              </Badge>
              <p className="text-gray-400">
                {formatDate(selectedRide.timestamps.completedAt || selectedRide.timestamps.cancelledAt || selectedRide.timestamps.requestedAt)}
              </p>
            </div>

            {/* Passenger */}
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <p className="text-sm text-gray-400 mb-2">Passenger</p>
              <div className="flex items-center gap-3">
                <Avatar name={selectedRide.riderName} size="md" />
                <div>
                  <p className="font-medium text-white">{selectedRide.riderName}</p>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm">5.0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Route */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pickup</p>
                  <p className="text-white">{selectedRide.pickup.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Destination</p>
                  <p className="text-white">{selectedRide.destination.address}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-gray-800/50 rounded-xl text-center">
                <p className="text-xl font-bold text-white">{selectedRide.distance?.toFixed(1)}</p>
                <p className="text-sm text-gray-400">km</p>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-xl text-center">
                <p className="text-xl font-bold text-white">{selectedRide.duration}</p>
                <p className="text-sm text-gray-400">min</p>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-xl text-center">
                <p className="text-xl font-bold text-emerald-400">${selectedRide.fare?.toFixed(2)}</p>
                <p className="text-sm text-gray-400">earned</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
