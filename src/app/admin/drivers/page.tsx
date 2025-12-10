'use client';

import { useEffect, useState } from 'react';
import {
    Car,
    Search,
    Filter,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    MoreVertical,
    Ban,
    Check
} from 'lucide-react';
import { Card, Button, Badge, Input, Modal, Avatar } from '@/components/ui';
import { ref, onValue, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Driver, Document, User } from '@/types';
import toast from 'react-hot-toast';

export default function AdminDriversPage() {
    const [drivers, setDrivers] = useState<(Driver & { user?: User })[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'blocked'>('all');
    const [selectedDriver, setSelectedDriver] = useState<(Driver & { user?: User }) | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        // Listen to drivers
        const driversRef = ref(database, 'drivers');
        const unsubDrivers = onValue(driversRef, (snapshot) => {
            if (snapshot.exists()) {
                const driversData: Driver[] = [];
                snapshot.forEach((child) => {
                    driversData.push({ id: child.key, ...child.val() } as Driver);
                });

                // Fetch user data for each driver
                const usersRef = ref(database, 'users');
                onValue(usersRef, (usersSnapshot) => {
                    if (usersSnapshot.exists()) {
                        const users = usersSnapshot.val();
                        const driversWithUsers = driversData.map(driver => ({
                            ...driver,
                            user: users[driver.userId] ? { id: driver.userId, ...users[driver.userId] } : undefined,
                        }));
                        setDrivers(driversWithUsers);
                    }
                }, { onlyOnce: true });
            }
            setLoading(false);
        });

        // Listen to documents
        const docsRef = ref(database, 'documents');
        const unsubDocs = onValue(docsRef, (snapshot) => {
            if (snapshot.exists()) {
                const docs: Document[] = [];
                snapshot.forEach((child) => {
                    docs.push({ id: child.key, ...child.val() } as Document);
                });
                setDocuments(docs);
            }
        });

        return () => {
            unsubDrivers();
            unsubDocs();
        };
    }, []);

    const filteredDrivers = drivers.filter(driver => {
        const matchesSearch =
            driver.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            driver.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
            driver.vehicle?.licensePlate?.toLowerCase().includes(search.toLowerCase());

        const matchesFilter = filter === 'all' || driver.status.toLowerCase() === filter;

        return matchesSearch && matchesFilter;
    });

    const getDriverDocuments = (driverId: string) => {
        return documents.filter(d => d.driverId === driverId);
    };

    const updateDriverStatus = async (driverId: string, status: string) => {
        setActionLoading(true);
        try {
            await update(ref(database, `drivers/${driverId}`), {
                status,
                updatedAt: Date.now(),
            });
            toast.success(`Driver ${status.toLowerCase()}`);
            setSelectedDriver(null);
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    const updateDocumentStatus = async (docId: string, status: string, reason?: string) => {
        try {
            await update(ref(database, `documents/${docId}`), {
                status,
                rejectionReason: reason || null,
                updatedAt: Date.now(),
            });
            toast.success(`Document ${status.toLowerCase()}`);
        } catch (error) {
            toast.error('Failed to update document');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <Badge variant="success">Approved</Badge>;
            case 'REJECTED': return <Badge variant="danger">Rejected</Badge>;
            case 'PENDING': return <Badge variant="warning">Pending</Badge>;
            case 'BLOCKED': return <Badge variant="danger">Blocked</Badge>;
            default: return <Badge>{status}</Badge>;
        }
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
                    <h1 className="text-3xl font-bold text-slate-900">Drivers</h1>
                    <p className="text-slate-500 mt-1">Manage and verify driver accounts</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="text-center">
                    <p className="text-3xl font-bold text-slate-900">{drivers.length}</p>
                    <p className="text-sm text-slate-500">Total</p>
                </Card>
                <Card className="text-center bg-amber-50 border-amber-200">
                    <p className="text-3xl font-bold text-amber-600">
                        {drivers.filter(d => d.status === 'PENDING').length}
                    </p>
                    <p className="text-sm text-slate-500">Pending</p>
                </Card>
                <Card className="text-center bg-emerald-50 border-emerald-200">
                    <p className="text-3xl font-bold text-emerald-600">
                        {drivers.filter(d => d.status === 'APPROVED').length}
                    </p>
                    <p className="text-sm text-slate-500">Approved</p>
                </Card>
                <Card className="text-center">
                    <p className="text-3xl font-bold text-slate-900">
                        {drivers.filter(d => d.isOnline).length}
                    </p>
                    <p className="text-sm text-slate-500">Online</p>
                </Card>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Search by name, email, or license plate..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        icon={<Search className="w-5 h-5" />}
                    />
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="blocked">Blocked</option>
                </select>
            </div>

            {/* Drivers Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-4 px-4 text-slate-600 font-medium">Driver</th>
                                <th className="text-left py-4 px-4 text-slate-600 font-medium">Vehicle</th>
                                <th className="text-left py-4 px-4 text-slate-600 font-medium">Status</th>
                                <th className="text-left py-4 px-4 text-slate-600 font-medium">Online</th>
                                <th className="text-left py-4 px-4 text-slate-600 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDrivers.map((driver) => (
                                <tr key={driver.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={driver.user?.name || 'Driver'} size="sm" />
                                            <div>
                                                <p className="text-slate-900 font-medium">{driver.user?.name}</p>
                                                <p className="text-sm text-slate-500">{driver.user?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <p className="text-slate-900">{driver.vehicle?.make} {driver.vehicle?.model}</p>
                                        <p className="text-sm text-slate-500">{driver.vehicle?.licensePlate}</p>
                                    </td>
                                    <td className="py-4 px-4">
                                        {getStatusBadge(driver.status)}
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className={`w-3 h-3 rounded-full ${driver.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedDriver(driver)}
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            View
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredDrivers.length === 0 && (
                        <div className="text-center py-12">
                            <Car className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                            <p className="text-slate-500">No drivers found</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Driver Detail Modal */}
            <Modal
                isOpen={!!selectedDriver}
                onClose={() => setSelectedDriver(null)}
                title="Driver Details"
                size="lg"
            >
                {selectedDriver && (
                    <div className="space-y-6">
                        {/* Driver Info */}
                        <div className="flex items-center gap-4 p-4 bg-slate-100 rounded-xl">
                            <Avatar name={selectedDriver.user?.name || 'Driver'} size="lg" />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900">{selectedDriver.user?.name}</h3>
                                <p className="text-slate-600">{selectedDriver.user?.email}</p>
                                <p className="text-slate-600">{selectedDriver.user?.phone}</p>
                            </div>
                            {getStatusBadge(selectedDriver.status)}
                        </div>

                        {/* Vehicle Info */}
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-3">Vehicle Information</h4>
                            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-100 rounded-xl">
                                <div>
                                    <p className="text-sm text-slate-500">Make</p>
                                    <p className="text-slate-900">{selectedDriver.vehicle?.make}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Model</p>
                                    <p className="text-slate-900">{selectedDriver.vehicle?.model}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Year</p>
                                    <p className="text-slate-900">{selectedDriver.vehicle?.year}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Color</p>
                                    <p className="text-slate-900">{selectedDriver.vehicle?.color}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-slate-500">License Plate</p>
                                    <p className="text-slate-900 font-mono">{selectedDriver.vehicle?.licensePlate}</p>
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-3">Documents</h4>
                            <div className="space-y-3">
                                {getDriverDocuments(selectedDriver.id).map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-100 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            {doc.status === 'APPROVED' ? (
                                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                            ) : doc.status === 'REJECTED' ? (
                                                <XCircle className="w-5 h-5 text-red-500" />
                                            ) : (
                                                <Clock className="w-5 h-5 text-amber-500" />
                                            )}
                                            <div>
                                                <p className="text-slate-900 font-medium">{doc.type.replace(/_/g, ' ')}</p>
                                                {getStatusBadge(doc.status)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </a>
                                            {doc.status === 'PENDING' && (
                                                <>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                        onClick={() => updateDocumentStatus(doc.id, 'APPROVED')}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="bg-red-100 text-red-700 hover:bg-red-200"
                                                        onClick={() => updateDocumentStatus(doc.id, 'REJECTED', 'Document unclear')}
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {getDriverDocuments(selectedDriver.id).length === 0 && (
                                    <p className="text-slate-500 text-center py-4">No documents uploaded</p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4 border-t border-slate-200">
                            {selectedDriver.status === 'PENDING' && (
                                <>
                                    <Button
                                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600"
                                        onClick={() => updateDriverStatus(selectedDriver.id, 'APPROVED')}
                                        loading={actionLoading}
                                    >
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Approve Driver
                                    </Button>
                                    <Button
                                        variant="danger"
                                        className="flex-1"
                                        onClick={() => updateDriverStatus(selectedDriver.id, 'REJECTED')}
                                        loading={actionLoading}
                                    >
                                        <XCircle className="w-5 h-5 mr-2" />
                                        Reject
                                    </Button>
                                </>
                            )}
                            {selectedDriver.status === 'APPROVED' && (
                                <Button
                                    variant="danger"
                                    className="w-full"
                                    onClick={() => updateDriverStatus(selectedDriver.id, 'BLOCKED')}
                                    loading={actionLoading}
                                >
                                    <Ban className="w-5 h-5 mr-2" />
                                    Block Driver
                                </Button>
                            )}
                            {selectedDriver.status === 'BLOCKED' && (
                                <Button
                                    className="w-full"
                                    onClick={() => updateDriverStatus(selectedDriver.id, 'APPROVED')}
                                    loading={actionLoading}
                                >
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Unblock Driver
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
