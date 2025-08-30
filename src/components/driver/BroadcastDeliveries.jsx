import React, { useState, useEffect, useCallback } from 'react';
import {
    TruckIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    UserIcon,
    PhoneIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

const BroadcastDeliveries = () => {
    const [broadcasts, setBroadcasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [acceptingDelivery, setAcceptingDelivery] = useState(null);

    // Load user's current location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error('Error getting location:', error);
                    toast.error('Unable to get your location. Please enable location services.');
                }
            );
        } else {
            toast.error('Geolocation is not supported by this browser.');
        }
    }, []);

    // Load active broadcasts
    const loadBroadcasts = useCallback(async (silent = false) => {
        if (!userLocation) {
            console.log('📍 BroadcastDeliveries: No user location available');
            return;
        }

        // Prevent multiple simultaneous requests
        if (loading && !silent) {
            console.log('📡 BroadcastDeliveries: Request already in progress, skipping');
            return;
        }

        if (!silent) {
            setLoading(true);
        }

        try {
            console.log('📡 BroadcastDeliveries: Loading broadcasts for location:', userLocation);
            const response = await apiService.getActiveBroadcasts(
                userLocation.lat,
                userLocation.lng
            );

            if (response && response.success) {
                const broadcastsData = response.data?.broadcasts || response.data || [];
                console.log('📡 BroadcastDeliveries: Received broadcasts:', broadcastsData);
                setBroadcasts(broadcastsData);
            } else {
                console.warn('📡 BroadcastDeliveries: No broadcasts data in response:', response);
                setBroadcasts([]);
            }
        } catch (error) {
            console.error('❌ BroadcastDeliveries: Error loading broadcasts:', error);

            if (!silent) {
                toast.error('Failed to load available deliveries');
            }
            setBroadcasts([]);
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, [userLocation, loading]);

    useEffect(() => {
        if (userLocation) {
            loadBroadcasts();
        }
    }, [loadBroadcasts, userLocation]);

    // Refresh broadcasts
    const refreshBroadcasts = async () => {
        setRefreshing(true);
        await loadBroadcasts(false); // Not silent for manual refresh
        setRefreshing(false);
        toast.success('Refreshed available deliveries!');
    };

    // Accept delivery
    const acceptDelivery = async (deliveryId) => {
        try {
            setAcceptingDelivery(deliveryId);
            const response = await apiService.acceptBroadcastDelivery(deliveryId);

            if (response.success) {
                toast.success('Delivery accepted successfully!');
                // Remove the accepted delivery from the list
                setBroadcasts(prev => prev.filter(b => b.id !== deliveryId));
            } else {
                toast.error(response.message || 'Failed to accept delivery');
            }
        } catch (error) {
            console.error('Error accepting delivery:', error);
            toast.error('Failed to accept delivery');
        } finally {
            setAcceptingDelivery(null);
        }
    };

    // Calculate time remaining for broadcast
    const getTimeRemaining = (endTime) => {
        const now = new Date().getTime();
        const end = new Date(endTime).getTime();
        const remaining = Math.max(0, Math.floor((end - now) / 1000));

        if (remaining <= 0) return 'Expired';

        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Get priority color
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'normal':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'low':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    // Auto-refresh broadcasts every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (userLocation && !loading) {
                loadBroadcasts(true); // Silent refresh to avoid UI flicker
            }
        }, 60000); // Changed from 10000 to 60000 (60 seconds)

        return () => clearInterval(interval);
    }, [loadBroadcasts, userLocation, loading]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading available deliveries...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Available Deliveries</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Accept deliveries near your location. First come, first served!
                            </p>
                        </div>
                        {/* Refresh button removed - WebSocket provides real-time updates */}
                    </div>
                </div>
            </div>

            {/* Location Status */}
            {userLocation ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <MapPinIcon className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-sm text-green-800">
                            Location detected: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                        <span className="text-sm text-yellow-800">
                            Getting your location... Please enable location services.
                        </span>
                    </div>
                </div>
            )}

            {/* Broadcasts List */}
            {broadcasts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-4 py-12 sm:px-6">
                        <div className="text-center">
                            <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No deliveries available</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                There are currently no deliveries being broadcast in your area.
                            </p>
                            <div className="mt-6">
                                {/* Refresh button removed - WebSocket provides real-time updates */}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {broadcasts.map((broadcast) => (
                        <div key={broadcast.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {/* Header with priority and time */}
                            <div className="px-4 py-3 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(broadcast.priority)}`}>
                                        {broadcast.priority.charAt(0).toUpperCase() + broadcast.priority.slice(1)} Priority
                                    </span>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <ClockIcon className="w-4 h-4 mr-1" />
                                        {getTimeRemaining(broadcast.broadcastEndTime)}
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Details */}
                            <div className="p-4 space-y-4">
                                {/* Amount */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-500">Amount</span>
                                    <span className="text-lg font-bold text-green-600">₺{broadcast.fee}</span>
                                </div>

                                {/* Customer Info */}
                                <div>
                                    <div className="flex items-center mb-2">
                                        <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-sm font-medium text-gray-900">{broadcast.customerName}</span>
                                    </div>
                                    {broadcast.customerPhone && (
                                        <div className="flex items-center">
                                            <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-600">{broadcast.customerPhone}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Route */}
                                <div className="space-y-2">
                                    <div>
                                        <div className="flex items-center mb-1">
                                            <MapPinIcon className="w-4 h-4 text-green-500 mr-2" />
                                            <span className="text-xs font-medium text-gray-500">PICKUP</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{broadcast.pickupLocationDescription || broadcast.pickupLocation}</p>
                                    </div>
                                    <div className="flex justify-center">
                                        <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center mb-1">
                                            <MapPinIcon className="w-4 h-4 text-red-500 mr-2" />
                                            <span className="text-xs font-medium text-gray-500">DELIVERY</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{broadcast.deliveryLocationDescription || broadcast.deliveryLocation}</p>
                                    </div>
                                </div>

                                {/* Distance and Time */}
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                    <span>Distance: {broadcast.distance} km</span>
                                    <span>Est: {broadcast.estimatedTime ? new Date(broadcast.estimatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                                </div>

                                {/* Notes */}
                                {broadcast.notes && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-sm text-gray-700">{broadcast.notes}</p>
                                    </div>
                                )}

                                {/* Accept Button */}
                                <button
                                    onClick={() => acceptDelivery(broadcast.id)}
                                    disabled={acceptingDelivery === broadcast.id || getTimeRemaining(broadcast.broadcastEndTime) === 'Expired'}
                                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${acceptingDelivery === broadcast.id || getTimeRemaining(broadcast.broadcastEndTime) === 'Expired'
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                                        }`}
                                >
                                    {acceptingDelivery === broadcast.id ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Accepting...
                                        </div>
                                    ) : getTimeRemaining(broadcast.broadcastEndTime) === 'Expired' ? (
                                        'Expired'
                                    ) : (
                                        <div className="flex items-center justify-center">
                                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                                            Accept Delivery
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Auto-refresh notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                    <ArrowPathIcon className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm text-blue-800">
                        Available deliveries automatically refresh every 10 seconds
                    </span>
                </div>
            </div>
        </div>
    );
};

export default BroadcastDeliveries;
