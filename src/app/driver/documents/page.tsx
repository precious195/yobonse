'use client';

import { useEffect, useState } from 'react';
import {
    FileText,
    Upload,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Eye,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card, Button, Badge, Modal } from '@/components/ui';
import { ref, onValue, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from '@/lib/firebase';
import { Document } from '@/types';
import toast from 'react-hot-toast';

const documentTypes = [
    { type: 'ID_CARD', label: 'ID Card / Passport', description: 'Government-issued ID' },
    { type: 'DRIVERS_LICENSE', label: "Driver's License", description: 'Valid driving license' },
    { type: 'VEHICLE_REGISTRATION', label: 'Vehicle Registration', description: 'Vehicle ownership proof' },
    { type: 'INSURANCE', label: 'Vehicle Insurance', description: 'Active insurance policy' },
    { type: 'PROFILE_PHOTO', label: 'Profile Photo', description: 'Clear face photo' },
];

export default function DriverDocumentsPage() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

    useEffect(() => {
        if (!user?.uid) return;

        const docsRef = ref(database, 'documents');
        const unsubscribe = onValue(docsRef, (snapshot) => {
            if (snapshot.exists()) {
                const docs: Document[] = [];
                snapshot.forEach((child) => {
                    const doc = { id: child.key, ...child.val() } as Document;
                    if (doc.driverId === user.uid) {
                        docs.push(doc);
                    }
                });
                setDocuments(docs);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const getDocByType = (type: string) => {
        return documents.find(d => d.type === type);
    };

    const handleUpload = async (type: string, file: File) => {
        if (!user?.uid) return;

        setUploading(type);
        try {
            // Upload to Firebase Storage
            const fileRef = storageRef(storage, `documents/${user.uid}/${type}_${Date.now()}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);

            // Save to database
            const docId = `${user.uid}_${type}`;
            await set(ref(database, `documents/${docId}`), {
                driverId: user.uid,
                type,
                url,
                status: 'PENDING',
                rejectionReason: null,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });

            toast.success('Document uploaded successfully!');
        } catch (error) {
            toast.error('Failed to upload document');
        } finally {
            setUploading(null);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <CheckCircle className="w-5 h-5 text-emerald-400" />;
            case 'REJECTED':
                return <XCircle className="w-5 h-5 text-red-400" />;
            case 'PENDING':
                return <Clock className="w-5 h-5 text-amber-400" />;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <Badge variant="success">Approved</Badge>;
            case 'REJECTED':
                return <Badge variant="danger">Rejected</Badge>;
            case 'PENDING':
                return <Badge variant="warning">Pending Review</Badge>;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const approvedCount = documents.filter(d => d.status === 'APPROVED').length;
    const pendingCount = documents.filter(d => d.status === 'PENDING').length;
    const rejectedCount = documents.filter(d => d.status === 'REJECTED').length;

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Documents</h1>
                <p className="text-gray-400 mt-1">Upload and manage your verification documents</p>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="text-center bg-emerald-500/10 border-emerald-500/30">
                    <CheckCircle className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{approvedCount}</p>
                    <p className="text-sm text-gray-400">Approved</p>
                </Card>
                <Card className="text-center bg-amber-500/10 border-amber-500/30">
                    <Clock className="w-8 h-8 mx-auto text-amber-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{pendingCount}</p>
                    <p className="text-sm text-gray-400">Pending</p>
                </Card>
                <Card className="text-center bg-red-500/10 border-red-500/30">
                    <XCircle className="w-8 h-8 mx-auto text-red-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{rejectedCount}</p>
                    <p className="text-sm text-gray-400">Rejected</p>
                </Card>
            </div>

            {/* Documents List */}
            <div className="space-y-4">
                {documentTypes.map((docType) => {
                    const doc = getDocByType(docType.type);
                    const isUploading = uploading === docType.type;

                    return (
                        <Card key={docType.type} className={doc?.status === 'REJECTED' ? 'border-red-500/30' : ''}>
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${doc?.status === 'APPROVED' ? 'bg-emerald-500/20' :
                                        doc?.status === 'REJECTED' ? 'bg-red-500/20' :
                                            doc?.status === 'PENDING' ? 'bg-amber-500/20' :
                                                'bg-gray-800'
                                    }`}>
                                    {doc ? getStatusIcon(doc.status) : <FileText className="w-6 h-6 text-gray-400" />}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-white">{docType.label}</h3>
                                        {doc && getStatusBadge(doc.status)}
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1">{docType.description}</p>

                                    {doc?.status === 'REJECTED' && doc.rejectionReason && (
                                        <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-sm text-red-300">{doc.rejectionReason}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {doc && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setPreviewDoc(doc)}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    )}

                                    {(!doc || doc.status === 'REJECTED') && (
                                        <label className="cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        handleUpload(docType.type, e.target.files[0]);
                                                    }
                                                }}
                                                disabled={isUploading}
                                            />
                                            <Button
                                                variant={doc?.status === 'REJECTED' ? 'danger' : 'outline'}
                                                size="sm"
                                                loading={isUploading}
                                                className="pointer-events-none"
                                            >
                                                {doc?.status === 'REJECTED' ? (
                                                    <>
                                                        <RefreshCw className="w-4 h-4 mr-2" />
                                                        Reupload
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-4 h-4 mr-2" />
                                                        Upload
                                                    </>
                                                )}
                                            </Button>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Info Card */}
            <Card className="border-violet-500/30">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Document Verification</h3>
                        <p className="text-gray-400 text-sm mt-1">
                            All documents are reviewed within 1-2 business days. Make sure your documents are:
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-gray-400">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                Clear and readable
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                Not expired
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                Showing all required information
                            </li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Document Preview Modal */}
            <Modal
                isOpen={!!previewDoc}
                onClose={() => setPreviewDoc(null)}
                title="Document Preview"
                size="lg"
            >
                {previewDoc && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-white">
                                {documentTypes.find(d => d.type === previewDoc.type)?.label}
                            </h3>
                            {getStatusBadge(previewDoc.status)}
                        </div>

                        <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden">
                            <img
                                src={previewDoc.url}
                                alt="Document"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <p className="text-sm text-gray-400">
                            Uploaded: {new Date(previewDoc.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                )}
            </Modal>
        </div>
    );
}
