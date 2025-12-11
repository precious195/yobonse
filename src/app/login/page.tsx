'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Car, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button, Input, Card } from '@/components/ui';
import toast from 'react-hot-toast';
import { ref, get } from 'firebase/database';
import { database, auth } from '@/lib/firebase';

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

            // Fetch user role to determine redirect
            if (auth.currentUser) {
                const snapshot = await get(ref(database, `users/${auth.currentUser.uid}`));
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    toast.success('Welcome back!');

                    if (data.role === 'DRIVER') {
                        router.push('/driver/dashboard');
                    } else if (data.role === 'ADMIN') {
                        router.push('/admin/dashboard');
                    } else {
                        router.push('/customer/dashboard');
                    }
                    return;
                }
            }

            // Fallback
            router.push('/customer/dashboard');
        } catch (err) {
            // Error is already handled in auth context
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-50 flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <Car className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold gradient-text">YABONSE</span>
                    </Link>
                </div>

                <Card className="shadow-xl">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h1>
                        <p className="text-slate-500">Sign in to continue to YABONSE</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
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
                                className="absolute right-4 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-slate-600">
                                <input type="checkbox" className="rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                                Remember me
                            </label>
                            <Link href="/forgot-password" className="text-violet-600 hover:text-violet-700 font-medium">
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
                        <p className="text-slate-500">
                            Don't have an account?{' '}
                            <Link href="/register" className="text-violet-600 hover:text-violet-700 font-medium">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <p className="text-center text-slate-400 text-sm mb-4">Or continue as</p>
                        <div className="grid grid-cols-2 gap-4">
                            <Link
                                href="/driver-register"
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-medium transition-colors"
                            >
                                <Car className="w-5 h-5" />
                                Driver
                            </Link>
                            <Link
                                href="/admin/login"
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-medium transition-colors"
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
