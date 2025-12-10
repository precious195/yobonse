'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Modal } from '@/components/ui';
import CheckoutForm from './CheckoutForm';

// Initialize Stripe outside component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    onSuccess: () => void;
}

export default function PaymentModal({ isOpen, onClose, amount, onSuccess }: PaymentModalProps) {
    const [clientSecret, setClientSecret] = useState('');

    useEffect(() => {
        if (isOpen && amount > 0) {
            // Create PaymentIntent as soon as the modal opens
            fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount }),
            })
                .then((res) => res.json())
                .then((data) => setClientSecret(data.clientSecret))
                .catch((err) => console.error('Error creating payment intent:', err));
        }
    }, [isOpen, amount]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Secure Payment">
            {clientSecret ? (
                <Elements
                    stripe={stripePromise}
                    options={{
                        clientSecret,
                        appearance: {
                            theme: 'night',
                            variables: {
                                colorPrimary: '#8b5cf6',
                                colorBackground: '#1f2937',
                                colorText: '#ffffff',
                                colorDanger: '#ef4444',
                                fontFamily: 'Inter, system-ui, sans-serif',
                            },
                        },
                    }}
                >
                    <CheckoutForm
                        amount={amount}
                        onSuccess={onSuccess}
                        onCancel={onClose}
                    />
                </Elements>
            ) : (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full"></div>
                </div>
            )}
        </Modal>
    );
}
