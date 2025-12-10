'use client';

import { useEffect, useState } from 'react';
import {
    Users,
    Search,
    Filter,
    Mail,
    Phone,
    Calendar,
    MoreVertical,
    Ban,
    Trash2,
    Eye
} from 'lucide-react';
import { Card, Button, Badge, Input, Modal, Avatar } from '@/components/ui';
import { ref, onValue, update, remove } from 'firebase/database';
import { database } from '@/lib/firebase';
import { User } from '@/types';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'customer' | 'driver' | 'admin'>('all');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        const usersRef = ref(database, 'users');
        const unsubscribe = onValue(usersRef, (snapshot) => {
            if (snapshot.exists()) {
                const usersData: User[] = [];
                snapshot.forEach((child) => {
                    usersData.push({ id: child.key, ...child.val() } as User);
                });
                usersData.sort((a, b) => b.createdAt - a.createdAt);
                setUsers(usersData);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase()) ||
            user.phone?.toLowerCase().includes(search.toLowerCase());

        const matchesFilter = filter === 'all' || user.role.toLowerCase() === filter;

        return matchesSearch && matchesFilter;
    });

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN': return <Badge variant="danger">Admin</Badge>;
            case 'DRIVER': return <Badge variant="info">Driver</Badge>;
            case 'CUSTOMER': return <Badge variant="success">Customer</Badge>;
            default: return <Badge>{role}</Badge>;
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
                    <h1 className="text-3xl font-bold text-white">Users</h1>
                    <p className="text-gray-400 mt-1">Manage all user accounts</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="text-center">
                    <p className="text-3xl font-bold text-white">{users.length}</p>
                    <p className="text-sm text-gray-400">Total Users</p>
                </Card>
                <Card className="text-center bg-emerald-500/10 border-emerald-500/30">
                    <p className="text-3xl font-bold text-emerald-400">
                        {users.filter(u => u.role === 'CUSTOMER').length}
                    </p>
                    <p className="text-sm text-gray-400">Customers</p>
                </Card>
                <Card className="text-center bg-blue-500/10 border-blue-500/30">
                    <p className="text-3xl font-bold text-blue-400">
                        {users.filter(u => u.role === 'DRIVER').length}
                    </p>
                    <p className="text-sm text-gray-400">Drivers</p>
                </Card>
                <Card className="text-center bg-amber-500/10 border-amber-500/30">
                    <p className="text-3xl font-bold text-amber-400">
                        {users.filter(u => u.role === 'ADMIN').length}
                    </p>
                    <p className="text-sm text-gray-400">Admins</p>
                </Card>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Search by name, email, or phone..."
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
                    <option value="all">All Roles</option>
                    <option value="customer">Customers</option>
                    <option value="driver">Drivers</option>
                    <option value="admin">Admins</option>
                </select>
            </div>

            {/* Users Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="text-left py-4 px-4 text-gray-400 font-medium">User</th>
                                <th className="text-left py-4 px-4 text-gray-400 font-medium">Contact</th>
                                <th className="text-left py-4 px-4 text-gray-400 font-medium">Role</th>
                                <th className="text-left py-4 px-4 text-gray-400 font-medium">Joined</th>
                                <th className="text-left py-4 px-4 text-gray-400 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={user.name} src={user.avatar} size="sm" />
                                            <p className="text-white font-medium">{user.name}</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="space-y-1">
                                            <p className="text-white text-sm flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                {user.email}
                                            </p>
                                            {user.phone && (
                                                <p className="text-gray-400 text-sm flex items-center gap-2">
                                                    <Phone className="w-4 h-4" />
                                                    {user.phone}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        {getRoleBadge(user.role)}
                                    </td>
                                    <td className="py-4 px-4">
                                        <p className="text-gray-400 text-sm flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(user.createdAt)}
                                        </p>
                                    </td>
                                    <td className="py-4 px-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedUser(user)}
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            View
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                            <p className="text-gray-400">No users found</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* User Detail Modal */}
            <Modal
                isOpen={!!selectedUser}
                onClose={() => setSelectedUser(null)}
                title="User Details"
            >
                {selectedUser && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl">
                            <Avatar name={selectedUser.name} src={selectedUser.avatar} size="lg" />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white">{selectedUser.name}</h3>
                                {getRoleBadge(selectedUser.role)}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                                <Mail className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-400">Email</p>
                                    <p className="text-white">{selectedUser.email}</p>
                                </div>
                            </div>

                            {selectedUser.phone && (
                                <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                                    <Phone className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-400">Phone</p>
                                        <p className="text-white">{selectedUser.phone}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-400">Joined</p>
                                    <p className="text-white">{formatDate(selectedUser.createdAt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-gray-800">
                            <Button variant="outline" className="flex-1" onClick={() => setSelectedUser(null)}>
                                Close
                            </Button>
                            {selectedUser.role !== 'ADMIN' && (
                                <Button variant="danger" className="flex-1">
                                    <Ban className="w-5 h-5 mr-2" />
                                    Suspend User
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
