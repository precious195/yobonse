'use client';

import { useEffect, useState } from 'react';
import {
  Map,
  Search,
  Filter,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Eye,
  XCircle
} from 'lucide-react';
import { Card, Button, Badge, Input, Modal, Avatar } from '@/components/ui';
import { ref, onValue, update, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Ride } from '@/types';
import toast from 'react-hot-toast';

export default function AdminRidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  useEffect(() => {
    const ridesRef = ref(database, 'rides');
    const unsubscribe = onValue(ridesRef, (snapshot) => {
      if (snapshot.exists()) {
        const ridesData: Ride[] = [];
        snapshot.forEach((child) => {
          ridesData.push({ id: child.key, ...child.val() } as Ride);
        });
        ridesData.sort((a, b) => b.timestamps.requestedAt - a.timestamps.requestedAt);
        setRides(ridesData);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredRides = rides.filter(ride => {
    const matchesSearch =
      ride.riderName?.toLowerCase().includes(search.toLowerCase()) ||
      ride.driverName?.toLowerCase().includes(search.toLowerCase()) ||
      ride.pickup.address?.toLowerCase().includes(search.toLowerCase()) ||
      ride.destination.address?.toLowerCase().includes(search.toLowerCase());

    let matchesFilter = true;
    if (filter === 'active') {
      matchesFilter = ['REQUESTED', 'ACCEPTED', 'ARRIVING', 'STARTED'].includes(ride.status);
    } else if (filter === 'completed') {
      matchesFilter = ride.status === 'COMPLETED';
    } else if (filter === 'cancelled') {
      matchesFilter = ride.status === 'CANCELLED';
    }

    return matchesSearch && matchesFilter;
  });

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED': return <Badge variant="warning">Requested</Badge>;
      case 'ACCEPTED': return <Badge variant="info">Accepted</Badge>;
      case 'ARRIVING': return <Badge variant="info">Arriving</Badge>;
      case 'STARTED': return <Badge variant="success">In Progress</Badge>;
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const cancelRide = async (rideId: string) => {
    try {
      await update(ref(database, `rides/${rideId}`), {
        status: 'CANCELLED',
        'timestamps/cancelledAt': Date.now(),
        cancelReason: 'Cancelled by admin',
      });
      await set(ref(database, `activeRides/${rideId}`), null);
      toast.success('Ride cancelled');
      setSelectedRide(null);
    } catch (error) {
      toast.error('Failed to cancel ride');
    }
  };

  const stats = {
    total: rides.length,
    active: rides.filter(r => ['REQUESTED', 'ACCEPTED', 'ARRIVING', 'STARTED'].includes(r.status)).length,
    completed: rides.filter(r => r.status === 'COMPLETED').length,
    revenue: rides.filter(r => r.status === 'COMPLETED').reduce((sum, r) => sum + (r.fare || 0), 0),
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
          <h1 className="text-3xl font-bold text-white">Rides</h1>
          <p className="text-gray-400 mt-1">Monitor and manage all rides</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-white">{stats.total}</p>
          <p className="text-sm text-gray-400">Total Rides</p>
        </Card>
        <Card className="text-center bg-violet-500/10 border-violet-500/30">
          <p className="text-3xl font-bold text-violet-400">{stats.active}</p>
          <p className="text-sm text-gray-400">Active</p>
        </Card>
        <Card className="text-center bg-emerald-500/10 border-emerald-500/30">
          <p className="text-3xl font-bold text-emerald-400">{stats.completed}</p>
          <p className="text-sm text-gray-400">Completed</p>
        </Card>
        <Card className="text-center bg-amber-500/10 border-amber-500/30">
          <p className="text-3xl font-bold text-amber-400">${stats.revenue.toFixed(2)}</p>
          <p className="text-sm text-gray-400">Revenue</p>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by rider, driver, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">All Rides</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Rides Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Rider</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Driver</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Route</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Status</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Fare</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Date</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRides.map((ride) => (
                <tr key={ride.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={ride.riderName} size="sm" />
                      <p className="text-white">{ride.riderName}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {ride.driverName ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={ride.driverName} size="sm" />
                        <p className="text-white">{ride.driverName}</p>
                      </div>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-white text-sm truncate max-w-[200px]">{ride.destination.address}</p>
                    <p className="text-gray-400 text-xs">{ride.distance?.toFixed(1)} km</p>
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(ride.status)}
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-white font-medium">${ride.fare?.toFixed(2) || '0.00'}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-gray-400 text-sm">{formatDate(ride.timestamps.requestedAt)}</p>
                    <p className="text-gray-500 text-xs">{formatTime(ride.timestamps.requestedAt)}</p>
                  </td>
                  <td className="py-4 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRide(ride)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRides.length === 0 && (
            <div className="text-center py-12">
              <Map className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">No rides found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Ride Detail Modal */}
      <Modal
        isOpen={!!selectedRide}
        onClose={() => setSelectedRide(null)}
        title="Ride Details"
        size="lg"
      >
        {selectedRide && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              {getStatusBadge(selectedRide.status)}
              <p className="text-gray-400">
                {formatDate(selectedRide.timestamps.requestedAt)} at {formatTime(selectedRide.timestamps.requestedAt)}
              </p>
            </div>

            {/* Rider & Driver */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-xl">
                <p className="text-sm text-gray-400 mb-2">Rider</p>
                <div className="flex items-center gap-3">
                  <Avatar name={selectedRide.riderName} size="md" />
                  <div>
                    <p className="text-white font-medium">{selectedRide.riderName}</p>
                    <p className="text-gray-400 text-sm">{selectedRide.riderPhone}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-xl">
                <p className="text-sm text-gray-400 mb-2">Driver</p>
                {selectedRide.driverName ? (
                  <div className="flex items-center gap-3">
                    <Avatar name={selectedRide.driverName} size="md" />
                    <p className="text-white font-medium">{selectedRide.driverName}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">No driver assigned</p>
                )}
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
              <div className="p-4 bg-gray-800/50 rounded-xl text-center">
                <MapPin className="w-5 h-5 mx-auto text-violet-400 mb-1" />
                <p className="text-xl font-bold text-white">{selectedRide.distance?.toFixed(1)}</p>
                <p className="text-sm text-gray-400">km</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-xl text-center">
                <Clock className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
                <p className="text-xl font-bold text-white">{selectedRide.duration}</p>
                <p className="text-sm text-gray-400">min</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-xl text-center">
                <DollarSign className="w-5 h-5 mx-auto text-amber-400 mb-1" />
                <p className="text-xl font-bold text-white">${selectedRide.fare?.toFixed(2)}</p>
                <p className="text-sm text-gray-400">fare</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-800">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedRide(null)}>
                Close
              </Button>
              {['REQUESTED', 'ACCEPTED', 'ARRIVING', 'STARTED'].includes(selectedRide.status) && (
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => cancelRide(selectedRide.id)}
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Cancel Ride
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
