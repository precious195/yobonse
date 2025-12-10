'use client';

import { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Car,
  DollarSign,
  MapPin,
  BarChart3
} from 'lucide-react';
import { Card, Button, StatsCard } from '@/components/ui';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Ride, User, Driver } from '@/types';
import toast from 'react-hot-toast';

export default function AdminReportsPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    // Fetch rides
    const ridesRef = ref(database, 'rides');
    onValue(ridesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data: Ride[] = [];
        snapshot.forEach((child) => {
          data.push({ id: child.key, ...child.val() } as Ride);
        });
        setRides(data);
      }
    });

    // Fetch users
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data: User[] = [];
        snapshot.forEach((child) => {
          data.push({ id: child.key, ...child.val() } as User);
        });
        setUsers(data);
      }
    });

    // Fetch drivers
    const driversRef = ref(database, 'drivers');
    onValue(driversRef, (snapshot) => {
      if (snapshot.exists()) {
        const data: Driver[] = [];
        snapshot.forEach((child) => {
          data.push({ id: child.key, ...child.val() } as Driver);
        });
        setDrivers(data);
      }
      setLoading(false);
    });
  }, []);

  const getDateRangeStart = () => {
    const now = new Date();
    switch (dateRange) {
      case 'week':
        return now.getTime() - 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return now.getTime() - 30 * 24 * 60 * 60 * 1000;
      case 'year':
        return now.getTime() - 365 * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  };

  const filteredRides = rides.filter(r => r.timestamps.requestedAt >= getDateRangeStart());
  const completedRides = filteredRides.filter(r => r.status === 'COMPLETED');
  const cancelledRides = filteredRides.filter(r => r.status === 'CANCELLED');
  const revenue = completedRides.reduce((sum, r) => sum + (r.fare || 0), 0);
  const totalDistance = completedRides.reduce((sum, r) => sum + (r.distance || 0), 0);
  const avgFare = completedRides.length > 0 ? revenue / completedRides.length : 0;

  const exportCSV = (type: 'rides' | 'users' | 'drivers') => {
    let csvContent = '';
    let filename = '';

    if (type === 'rides') {
      csvContent = 'ID,Rider,Driver,Status,Fare,Distance,Date\n';
      rides.forEach(ride => {
        csvContent += `${ride.id},${ride.riderName},${ride.driverName || 'N/A'},${ride.status},${ride.fare || 0},${ride.distance || 0},${new Date(ride.timestamps.requestedAt).toISOString()}\n`;
      });
      filename = 'rides_report.csv';
    } else if (type === 'users') {
      csvContent = 'ID,Name,Email,Phone,Role,Joined\n';
      users.forEach(user => {
        csvContent += `${user.id},${user.name},${user.email},${user.phone || 'N/A'},${user.role},${new Date(user.createdAt).toISOString()}\n`;
      });
      filename = 'users_report.csv';
    } else if (type === 'drivers') {
      csvContent = 'ID,Vehicle,License Plate,Status,Online\n';
      drivers.forEach(driver => {
        csvContent += `${driver.id},${driver.vehicle?.make} ${driver.vehicle?.model},${driver.vehicle?.licensePlate},${driver.status},${driver.isOnline}\n`;
      });
      filename = 'drivers_report.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-gray-400 mt-1">View performance metrics and export data</p>
        </div>

        <div className="flex items-center gap-2">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${dateRange === range
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
            >
              {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value={`$${revenue.toFixed(2)}`}
          icon={<DollarSign className="w-5 h-5" />}
          change="+12%"
          changeType="increase"
        />
        <StatsCard
          title="Completed Rides"
          value={completedRides.length}
          icon={<Car className="w-5 h-5" />}
          change="+8%"
          changeType="increase"
        />
        <StatsCard
          title="Active Users"
          value={users.length}
          icon={<Users className="w-5 h-5" />}
          change="+15%"
          changeType="increase"
        />
        <StatsCard
          title="Total Distance"
          value={`${totalDistance.toFixed(0)} km`}
          icon={<MapPin className="w-5 h-5" />}
        />
      </div>

      {/* Charts Placeholder */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Revenue Trend
          </h2>
          <div className="h-64 flex items-center justify-center bg-gray-800/50 rounded-xl">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">Chart visualization</p>
              <p className="text-sm text-gray-500">Integrate Chart.js or Recharts</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Car className="w-5 h-5 text-amber-400" />
            Rides by Status
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Completed</span>
              <div className="flex items-center gap-3">
                <div className="w-48 h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(completedRides.length / filteredRides.length) * 100 || 0}%` }}
                  ></div>
                </div>
                <span className="text-white font-medium w-12 text-right">{completedRides.length}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Cancelled</span>
              <div className="flex items-center gap-3">
                <div className="w-48 h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(cancelledRides.length / filteredRides.length) * 100 || 0}%` }}
                  ></div>
                </div>
                <span className="text-white font-medium w-12 text-right">{cancelledRides.length}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Active</span>
              <div className="flex items-center gap-3">
                <div className="w-48 h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full"
                    style={{ width: `${((filteredRides.length - completedRides.length - cancelledRides.length) / filteredRides.length) * 100 || 0}%` }}
                  ></div>
                </div>
                <span className="text-white font-medium w-12 text-right">
                  {filteredRides.length - completedRides.length - cancelledRides.length}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="text-center">
          <DollarSign className="w-8 h-8 mx-auto text-amber-400 mb-2" />
          <p className="text-3xl font-bold text-white">${avgFare.toFixed(2)}</p>
          <p className="text-gray-400">Average Fare</p>
        </Card>
        <Card className="text-center">
          <Car className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
          <p className="text-3xl font-bold text-white">
            {completedRides.length > 0 ? (totalDistance / completedRides.length).toFixed(1) : 0}
          </p>
          <p className="text-gray-400">Avg Distance (km)</p>
        </Card>
        <Card className="text-center">
          <TrendingUp className="w-8 h-8 mx-auto text-violet-400 mb-2" />
          <p className="text-3xl font-bold text-white">
            {filteredRides.length > 0 ? ((completedRides.length / filteredRides.length) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-gray-400">Completion Rate</p>
        </Card>
      </div>

      {/* Export Section */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-400" />
          Export Reports
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => exportCSV('rides')}
            className="p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-white font-medium">Rides Report</p>
                <p className="text-sm text-gray-400">{rides.length} records</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => exportCSV('users')}
            className="p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium">Users Report</p>
                <p className="text-sm text-gray-400">{users.length} records</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => exportCSV('drivers')}
            className="p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white font-medium">Drivers Report</p>
                <p className="text-sm text-gray-400">{drivers.length} records</p>
              </div>
            </div>
          </button>
        </div>
      </Card>
    </div>
  );
}
