'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Car, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button, Input, Card } from '@/components/ui';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const router = useRouter();
    const { signIn, loading, error, clearError } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        try {
            await signIn(email, password);
            toast.success('Welcome back!');
            // Redirect will be handled by auth context based on user role
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
                        <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
                        <p className="text-gray-400">Sign in to continue to RideFlow</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={<Mail className="w-5 h-5" />}
                            required
                        />

                        <div className="relative">
                            <Input
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-gray-400">
                                <input type="checkbox" className="rounded border-gray-600 bg-gray-800 text-violet-600 focus:ring-violet-500" />
                                Remember me
                            </label>
                            <Link href="/forgot-password" className="text-violet-400 hover:text-violet-300 transition-colors">
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            loading={loading}
                        >
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-400">
                            Don't have an account?{' '}
                            <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-800">
                        <p className="text-center text-gray-500 text-sm mb-4">Or continue as</p>
                        <div className="grid grid-cols-2 gap-4">
                            <Link
                                href="/driver-register"
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 font-medium transition-colors"
                            >
                                <Car className="w-5 h-5" />
                                Driver
                            </Link>
                            <Link
                                href="/admin/login"
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 font-medium transition-colors"
                            >
                                Admin
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
