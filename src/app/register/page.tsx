'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Car, Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button, Input, Card } from '@/components/ui';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const router = useRouter();
    const { signUp, loading, error, clearError } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [validationError, setValidationError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setValidationError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setValidationError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setValidationError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setValidationError('Password must be at least 6 characters');
            return;
        }

        try {
            await signUp(formData.email, formData.password, formData.name, 'CUSTOMER');
            toast.success('Account created successfully!');
            router.push('/customer/dashboard');
        } catch (err) {
            // Error is already handled in auth context
        }
    };

    return (
        <div className="min-h-screen animated-gradient flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                            <Car className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold gradient-text">RideFlow</span>
                    </Link>
                </div>

                <Card className="backdrop-blur-xl">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
                        <p className="text-gray-400">Join RideFlow and start riding today</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Full Name"
                            type="text"
                            name="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            icon={<User className="w-5 h-5" />}
                            required
                        />

                        <Input
                            label="Email Address"
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            icon={<Mail className="w-5 h-5" />}
                            required
                        />

                        <Input
                            label="Phone Number (Optional)"
                            type="tel"
                            name="phone"
                            placeholder="+1 (555) 000-0000"
                            value={formData.phone}
                            onChange={handleChange}
                            icon={<Phone className="w-5 h-5" />}
                        />

                        <div className="relative">
                            <Input
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                placeholder="Create a strong password"
                                value={formData.password}
                                onChange={handleChange}
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
                            name="confirmPassword"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            icon={<Lock className="w-5 h-5" />}
                            required
                        />

                        {(error || validationError) && (
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                {error || validationError}
                            </div>
                        )}

                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                id="terms"
                                className="mt-1 rounded border-gray-600 bg-gray-800 text-violet-600 focus:ring-violet-500"
                                required
                            />
                            <label htmlFor="terms" className="text-sm text-gray-400">
                                I agree to the{' '}
                                <a href="#" className="text-violet-400 hover:text-violet-300">Terms of Service</a>
                                {' '}and{' '}
                                <a href="#" className="text-violet-400 hover:text-violet-300">Privacy Policy</a>
                            </label>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            loading={loading}
                        >
                            Create Account
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-400">
                            Already have an account?{' '}
                            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-800">
                        <p className="text-center text-gray-500 text-sm mb-4">Want to drive with us?</p>
                        <Link
                            href="/driver-register"
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 font-medium transition-colors"
                        >
                            <Car className="w-5 h-5" />
                            Register as a Driver
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}
