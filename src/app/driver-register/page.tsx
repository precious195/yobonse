'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Car,
    Mail,
    Lock,
    Eye,
    EyeOff,
    User,
    Phone,
    FileText,
    Upload,
    CheckCircle,
    ArrowRight,
    ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button, Input, Card } from '@/components/ui';
import { ref, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

type Step = 1 | 2 | 3;

export default function DriverRegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Step 1: Personal Info
    const [personalInfo, setPersonalInfo] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });

    // Step 2: Vehicle Info
    const [vehicleInfo, setVehicleInfo] = useState({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        licensePlate: '',
    });

    // Step 3: Documents
    const [documents, setDocuments] = useState({
        idCard: null as File | null,
        driversLicense: null as File | null,
        vehicleRegistration: null as File | null,
    });

    const handleFileChange = (type: keyof typeof documents) => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setDocuments({ ...documents, [type]: e.target.files[0] });
        }
    };

    const validateStep1 = () => {
        if (personalInfo.password !== personalInfo.confirmPassword) {
            toast.error('Passwords do not match');
            return false;
        }
        if (personalInfo.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return false;
        }
        if (!personalInfo.name || !personalInfo.email || !personalInfo.phone) {
            toast.error('Please fill in all fields');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!vehicleInfo.make || !vehicleInfo.model || !vehicleInfo.color || !vehicleInfo.licensePlate) {
            toast.error('Please fill in all vehicle details');
            return false;
        }
        return true;
    };

    const validateStep3 = () => {
        if (!documents.idCard || !documents.driversLicense || !documents.vehicleRegistration) {
            toast.error('Please upload all required documents');
            return false;
        }
        return true;
    };

    const nextStep = () => {
        if (step === 1 && validateStep1()) setStep(2);
        else if (step === 2 && validateStep2()) setStep(3);
    };

    const prevStep = () => {
        if (step > 1) setStep((step - 1) as Step);
    };

    const uploadDocument = async (file: File, userId: string, type: string) => {
        const fileRef = storageRef(storage, `documents/${userId}/${type}_${Date.now()}`);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
    };

    const handleSubmit = async () => {
        if (!validateStep3()) return;

        setLoading(true);
        try {
            // Create Firebase Auth user
            const { user } = await createUserWithEmailAndPassword(
                auth,
                personalInfo.email,
                personalInfo.password
            );

            // Update display name
            await updateProfile(user, { displayName: personalInfo.name });

            // Create user record
            const now = Date.now();
            await set(ref(database, `users/${user.uid}`), {
                email: personalInfo.email,
                phone: personalInfo.phone,
                name: personalInfo.name,
                role: 'DRIVER',
                avatar: null,
                createdAt: now,
                updatedAt: now,
            });

            // Upload documents
            const [idCardUrl, licenseUrl, registrationUrl] = await Promise.all([
                uploadDocument(documents.idCard!, user.uid, 'id_card'),
                uploadDocument(documents.driversLicense!, user.uid, 'drivers_license'),
                uploadDocument(documents.vehicleRegistration!, user.uid, 'vehicle_registration'),
            ]);

            // Create driver record
            await set(ref(database, `drivers/${user.uid}`), {
                userId: user.uid,
                status: 'PENDING',
                isOnline: false,
                currentLocation: null,
                vehicle: vehicleInfo,
                rating: {
                    average: 0,
                    count: 0,
                },
                createdAt: now,
                updatedAt: now,
            });

            // Create document records
            const docTypes = [
                { type: 'ID_CARD', url: idCardUrl },
                { type: 'DRIVERS_LICENSE', url: licenseUrl },
                { type: 'VEHICLE_REGISTRATION', url: registrationUrl },
            ];

            for (const doc of docTypes) {
                const docRef = ref(database, `documents/${user.uid}_${doc.type}`);
                await set(docRef, {
                    driverId: user.uid,
                    type: doc.type,
                    url: doc.url,
                    status: 'PENDING',
                    rejectionReason: null,
                    createdAt: now,
                    updatedAt: now,
                });
            }

            toast.success('Registration successful! Your application is under review.');
            router.push('/driver/dashboard');
        } catch (error: any) {
            console.error('Registration error:', error);
            toast.error(error.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen animated-gradient flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-lg">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                            <Car className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold gradient-text">YABONSE</span>
                    </Link>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${step >= s
                                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                                    : 'bg-gray-800 text-gray-500'
                                    }`}
                            >
                                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                            </div>
                            {s < 3 && (
                                <div
                                    className={`w-16 h-1 mx-2 rounded ${step > s ? 'bg-violet-600' : 'bg-gray-800'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <Card className="backdrop-blur-xl">
                    {/* Step 1: Personal Info */}
                    {step === 1 && (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-white mb-2">Personal Information</h1>
                                <p className="text-gray-400">Tell us about yourself</p>
                            </div>

                            <div className="space-y-5">
                                <Input
                                    label="Full Name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={personalInfo.name}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                                    icon={<User className="w-5 h-5" />}
                                    required
                                />

                                <Input
                                    label="Email Address"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={personalInfo.email}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                                    icon={<Mail className="w-5 h-5" />}
                                    required
                                />

                                <Input
                                    label="Phone Number"
                                    type="tel"
                                    placeholder="+1 (555) 000-0000"
                                    value={personalInfo.phone}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                                    icon={<Phone className="w-5 h-5" />}
                                    required
                                />

                                <div className="relative">
                                    <Input
                                        label="Password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Create a strong password"
                                        value={personalInfo.password}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, password: e.target.value })}
                                        icon={<Lock className="w-5 h-5" />}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-[42px] text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>

                                <Input
                                    label="Confirm Password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Confirm your password"
                                    value={personalInfo.confirmPassword}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, confirmPassword: e.target.value })}
                                    icon={<Lock className="w-5 h-5" />}
                                    required
                                />
                            </div>
                        </>
                    )}

                    {/* Step 2: Vehicle Info */}
                    {step === 2 && (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-white mb-2">Vehicle Information</h1>
                                <p className="text-gray-400">Tell us about your vehicle</p>
                            </div>

                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Make"
                                        type="text"
                                        placeholder="Toyota"
                                        value={vehicleInfo.make}
                                        onChange={(e) => setVehicleInfo({ ...vehicleInfo, make: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Model"
                                        type="text"
                                        placeholder="Camry"
                                        value={vehicleInfo.model}
                                        onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Year"
                                        type="number"
                                        placeholder="2022"
                                        value={vehicleInfo.year}
                                        onChange={(e) => setVehicleInfo({ ...vehicleInfo, year: parseInt(e.target.value) })}
                                        required
                                    />
                                    <Input
                                        label="Color"
                                        type="text"
                                        placeholder="Silver"
                                        value={vehicleInfo.color}
                                        onChange={(e) => setVehicleInfo({ ...vehicleInfo, color: e.target.value })}
                                        required
                                    />
                                </div>

                                <Input
                                    label="License Plate"
                                    type="text"
                                    placeholder="ABC-1234"
                                    value={vehicleInfo.licensePlate}
                                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, licensePlate: e.target.value })}
                                    icon={<Car className="w-5 h-5" />}
                                    required
                                />
                            </div>
                        </>
                    )}

                    {/* Step 3: Documents */}
                    {step === 3 && (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-white mb-2">Upload Documents</h1>
                                <p className="text-gray-400">Upload required documents for verification</p>
                            </div>

                            <div className="space-y-5">
                                {[
                                    { key: 'idCard', label: 'ID Card / Passport', accept: 'image/*,.pdf' },
                                    { key: 'driversLicense', label: "Driver's License", accept: 'image/*,.pdf' },
                                    { key: 'vehicleRegistration', label: 'Vehicle Registration', accept: 'image/*,.pdf' },
                                ].map((doc) => (
                                    <div key={doc.key}>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            {doc.label}
                                        </label>
                                        <label className={`flex items-center gap-4 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${documents[doc.key as keyof typeof documents]
                                            ? 'border-emerald-500 bg-emerald-500/10'
                                            : 'border-gray-700 hover:border-violet-500'
                                            }`}>
                                            <input
                                                type="file"
                                                accept={doc.accept}
                                                onChange={handleFileChange(doc.key as keyof typeof documents)}
                                                className="hidden"
                                            />
                                            {documents[doc.key as keyof typeof documents] ? (
                                                <>
                                                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                                                    <span className="text-emerald-400 truncate">
                                                        {(documents[doc.key as keyof typeof documents] as File).name}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-6 h-6 text-gray-400" />
                                                    <span className="text-gray-400">Click to upload {doc.label}</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-4 mt-8">
                        {step > 1 && (
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={prevStep}
                            >
                                <ArrowLeft className="w-5 h-5 mr-2" />
                                Back
                            </Button>
                        )}

                        {step < 3 ? (
                            <Button
                                className="flex-1"
                                onClick={nextStep}
                            >
                                Next
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                className="flex-1"
                                onClick={handleSubmit}
                                loading={loading}
                            >
                                Submit Application
                            </Button>
                        )}
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-gray-400">
                            Already have an account?{' '}
                            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
