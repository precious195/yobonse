'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    updateProfile,
} from 'firebase/auth';
import { ref, get, set, serverTimestamp } from 'firebase/database';
import { auth, database } from './firebase';
import { User, UserRole } from '@/types';

interface AuthContextType {
    user: FirebaseUser | null;
    userData: User | null;
    loading: boolean;
    error: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name: string, role?: UserRole) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch user data from Realtime Database
    const fetchUserData = useCallback(async (uid: string) => {
        try {
            const snapshot = await get(ref(database, `users/${uid}`));
            if (snapshot.exists()) {
                setUserData({ id: uid, ...snapshot.val() } as User);
            } else {
                setUserData(null);
            }
        } catch (err) {
            console.error('Error fetching user data:', err);
            setUserData(null);
        }
    }, []);

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await fetchUserData(firebaseUser.uid);
            } else {
                setUserData(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [fetchUserData]);

    // Sign in with email and password
    const signIn = async (email: string, password: string) => {
        try {
            setError(null);
            setLoading(true);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError(getAuthErrorMessage(err.code));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Sign up with email and password
    const signUp = async (
        email: string,
        password: string,
        name: string,
        role: UserRole = 'CUSTOMER'
    ) => {
        try {
            setError(null);
            setLoading(true);

            // Create Firebase Auth user
            const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);

            // Update display name
            await updateProfile(newUser, { displayName: name });

            // Create user record in Realtime Database
            const now = Date.now();
            const userRecord: Omit<User, 'id'> = {
                email,
                phone: null,
                name,
                role,
                avatar: null,
                createdAt: now,
                updatedAt: now,
            };

            await set(ref(database, `users/${newUser.uid}`), userRecord);
            setUserData({ id: newUser.uid, ...userRecord });
        } catch (err: any) {
            setError(getAuthErrorMessage(err.code));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Sign out
    const signOut = async () => {
        try {
            setError(null);
            await firebaseSignOut(auth);
            setUserData(null);
        } catch (err: any) {
            setError(getAuthErrorMessage(err.code));
            throw err;
        }
    };

    // Reset password
    const resetPassword = async (email: string) => {
        try {
            setError(null);
            await sendPasswordResetEmail(auth, email);
        } catch (err: any) {
            setError(getAuthErrorMessage(err.code));
            throw err;
        }
    };

    // Clear error
    const clearError = () => setError(null);

    return (
        <AuthContext.Provider
            value={{
                user,
                userData,
                loading,
                error,
                signIn,
                signUp,
                signOut,
                resetPassword,
                clearError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Helper function to convert Firebase auth error codes to user-friendly messages
function getAuthErrorMessage(code: string): string {
    switch (code) {
        case 'auth/email-already-in-use':
            return 'This email is already registered. Please sign in instead.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/operation-not-allowed':
            return 'Email/password accounts are not enabled. Please contact support.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/user-disabled':
            return 'This account has been disabled. Please contact support.';
        case 'auth/user-not-found':
            return 'No account found with this email address.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/invalid-credential':
            return 'Invalid email or password. Please try again.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        default:
            return 'An error occurred. Please try again.';
    }
}
