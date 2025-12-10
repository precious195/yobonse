'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Phone,
  MessageSquare,
  Navigation,
  Clock,
  MapPin,
  DollarSign,
  Star,
  X,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card, Button, Badge, Modal, Avatar } from '@/components/ui';
import { RideMap } from '@/components/maps/GoogleMap';
import PaymentModal from '@/components/payment/PaymentModal';
import { ref, onValue, update, set, push } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Ride, DriverLocation } from '@/types';
import toast from 'react-hot-toast';

export default function RideTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const rideId = params.id as string;

  const [ride, setRide] = useState<Ride | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!rideId) return;

    // Listen to ride updates
    const rideRef = ref(database, `rides/${rideId}`);
    const unsubRide = onValue(rideRef, (snapshot) => {
      if (snapshot.exists()) {
        const rideData = { id: snapshot.key, ...snapshot.val() } as Ride;
        setRide(rideData);

        // Logic for showing modals
        if (rideData.status === 'COMPLETED') {
          if (rideData.paymentStatus === 'PENDING' || !rideData.paymentStatus) {
            setShowPaymentModal(true);
          } else if (!rideData.paymentStatus || rideData.paymentStatus === 'COMPLETED') {
            // Only show rating checks if payment is done or not needed logic? 
            // actually, let's allow rating after payment
            if (rideData.paymentStatus === 'COMPLETED') {
              // Check if already rated? For now just show if not handled
              setShowRatingModal(true);
            }
          }
        }
      }
      setLoading(false);
    });

    return () => unsubRide();
  }, [rideId]);

  // Listen to driver location when ride has a driver
  useEffect(() => {
    if (!ride?.driverId) return;

    const locationRef = ref(database, `driverLocations/${ride.driverId}`);
    const unsubLocation = onValue(locationRef, (snapshot) => {
      if (snapshot.exists()) {
        setDriverLocation(snapshot.val() as DriverLocation);
      }
    });

    return () => unsubLocation();
  }, [ride?.driverId]);

  const handleCancelRide = async () => {
    if (!rideId) return;

    setCancelling(true);
    try {
      await update(ref(database, `rides/${rideId}`), {
        status: 'CANCELLED',
        'timestamps/cancelledAt': Date.now(),
      });
      toast.success('Ride cancelled');
      router.push('/customer/dashboard');
    } catch (error) {
      toast.error('Failed to cancel ride');
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!rideId) return;

    try {
      await update(ref(database, `rides/${rideId}`), {
        paymentStatus: 'COMPLETED'
      });
      setShowPaymentModal(false);
      setShowRatingModal(true);
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  };

  const handleSubmitRating = async () => {
    if (!ride || !ride.driverId) return;

    try {
      // Save rating
      const ratingRef = push(ref(database, 'ratings'));
      await set(ratingRef, {
        rideId: ride.id,
        riderId: user?.uid,
        driverId: ride.driverId,
        rating,
        comment,
        createdAt: Date.now(),
      });

      toast.success('Thanks for your feedback!');
      setShowRatingModal(false);
      router.push('/customer/dashboard');
    } catch (error) {
      toast.error('Failed to submit rating');
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return { text: 'Finding Driver', color: 'warning', description: 'Looking for nearby drivers...' };
      case 'ACCEPTED':
        return { text: 'Driver Assigned', color: 'info', description: 'Your driver is on the way to pickup' };
      case 'ARRIVING':
        return { text: 'Driver Arriving', color: 'info', description: 'Driver is almost at pickup location' };
      case 'STARTED':
        return { text: 'Trip In Progress', color: 'success', description: 'Enjoy your ride!' };
      case 'COMPLETED':
        return { text: 'Trip Completed', color: 'success', description: 'Thanks for riding with us!' };
      case 'CANCELLED':
        return { text: 'Cancelled', color: 'danger', description: 'This ride was cancelled' };
      default:
        return { text: status, color: 'default', description: '' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-white mb-2">Ride not found</h2>
        <p className="text-gray-400">This ride doesn't exist or has been removed</p>
      </div>
    );
  }

  const statusInfo = getStatusInfo(ride.status);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Map */}
        <div className="order-2 lg:order-1">
          <RideMap
            pickup={{ lat: ride.pickup.lat, lng: ride.pickup.lng, address: ride.pickup.address }}
            destination={{ lat: ride.destination.lat, lng: ride.destination.lng, address: ride.destination.address }}
            driverLocation={driverLocation ? { lat: driverLocation.lat, lng: driverLocation.lng } : null}
            showRoute={true}
            className="h-[500px]"
          />

          {/* Map Legend */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-violet-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Pickup</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Destination</span>
            </div>
            {driverLocation && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                <span className="text-sm text-gray-400">Driver</span>
              </div>
            )}
          </div>
        </div>

        {/* Ride Details */}
        <div className="order-1 lg:order-2 space-y-6">
          {/* Status Card */}
          <Card className={`border-${statusInfo.color === 'success' ? 'emerald' : statusInfo.color === 'warning' ? 'amber' : 'violet'}-500/30`}>
            <div className="flex items-center gap-4">
              {ride.status === 'REQUESTED' && (
                <div className="animate-spin w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full"></div>
              )}
              {ride.status !== 'REQUESTED' && (
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${ride.status === 'COMPLETED' ? 'bg-emerald-500/20' :
                  ride.status === 'CANCELLED' ? 'bg-red-500/20' : 'bg-violet-500/20'
                  }`}>
                  {ride.status === 'COMPLETED' ? (
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <Navigation className="w-6 h-6 text-violet-400" />
                  )}
                </div>
              )}
              <div>
                <Badge variant={statusInfo.color as any} className="mb-1">
                  {statusInfo.text}
                </Badge>
                <p className="text-gray-400">{statusInfo.description}</p>
              </div>
            </div>
          </Card>

          {/* Driver Info */}
          {ride.driverName && (
            <Card>
              <div className="flex items-center gap-4">
                <Avatar name={ride.driverName} size="lg" />
                <div className="flex-1">
                  <p className="font-semibold text-white text-lg">{ride.driverName}</p>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span>4.9</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Route Details */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Trip Details</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pickup</p>
                  <p className="text-white">{ride.pickup.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Destination</p>
                  <p className="text-white">{ride.destination.address}</p>
                </div>
              </div>
            </div>

            {/* Trip Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-800">
              <div className="text-center">
                <MapPin className="w-5 h-5 mx-auto text-violet-400 mb-1" />
                <p className="text-lg font-bold text-white">{ride.distance} km</p>
                <p className="text-xs text-gray-400">Distance</p>
              </div>
              <div className="text-center">
                <Clock className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
                <p className="text-lg font-bold text-white">{ride.duration} min</p>
                <p className="text-xs text-gray-400">Duration</p>
              </div>
              <div className="text-center">
                <DollarSign className="w-5 h-5 mx-auto text-amber-400 mb-1" />
                <p className="text-lg font-bold text-white">${ride.fare?.toFixed(2)}</p>
                <p className="text-xs text-gray-400">Fare</p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            {['REQUESTED', 'ACCEPTED', 'ARRIVING'].includes(ride.status) && (
              <Button
                variant="danger"
                className="w-full"
                onClick={() => setShowCancelModal(true)}
              >
                <X className="w-5 h-5 mr-2" />
                Cancel Ride
              </Button>
            )}

            {/* Show Pay button if payment pending and completed (fallback if modal closed) */}
            {ride.status === 'COMPLETED' && (!ride.paymentStatus || ride.paymentStatus === 'PENDING') && (
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowPaymentModal(true)}
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Pay for Ride
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Ride"
      >
        <div className="space-y-6">
          <p className="text-gray-400">Are you sure you want to cancel this ride?</p>
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowCancelModal(false)}>
              Keep Ride
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleCancelRide} loading={cancelling}>
              Cancel Ride
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={ride.fare || 0}
        onSuccess={handlePaymentSuccess}
      />

      {/* Rating Modal */}
      <Modal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        title="Rate Your Trip"
      >
        <div className="space-y-6">
          <div className="text-center">
            <Avatar name={ride.driverName || 'Driver'} size="lg" className="mx-auto mb-3" />
            <p className="text-lg font-semibold text-white">{ride.driverName}</p>
            <p className="text-gray-400">How was your ride?</p>
          </div>

          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  className={`w-10 h-10 ${star <= rating ? 'text-amber-400 fill-current' : 'text-gray-600'
                    }`}
                />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (optional)"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            rows={3}
          />

          <Button className="w-full" onClick={handleSubmitRating}>
            Submit Rating
          </Button>
        </div>
      </Modal>
    </div>
  );
}
