import React, { useState, useEffect, useCallback } from 'react';
import {
    MegaphoneIcon,
    ClockIcon,
    MapPinIcon,
    UserIcon,
    PhoneIcon,
    CheckCircleIcon,
    TruckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import socketService from '../../services/socketService';
import soundService from '../../services/soundService';
import { useToast } from '../../components/common/ToastProvider';

import { useSystemSettings } from '../../context/SystemSettingsContext';
import BroadcastSkeleton from '../../components/common/BroadcastSkeleton';
import { useBroadcasts } from '../../context/BroadcastContext';


const BroadcastPage = () => {
    const { formatCurrency } = useSystemSettings();
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const { broadcasts, loading, fetchBroadcasts } = useBroadcasts();
    const [userLocation, setUserLocation] = useState(null);
    const [locationPermission, setLocationPermission] = useState('prompt');
    const [locationError, setLocationError] = useState(null);
    const [locationResolved, setLocationResolved] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [showManualLocation, setShowManualLocation] = useState(false);
    const [manualLocation, setManualLocation] = useState({ lat: 35.1255, lng: 33.3095 });

    // Helper function to clean location text (remove URLs and show meaningful descriptions)
    const cleanLocationText = (text) => {
        if (!text) return 'Location not specified';

        // Remove Google Maps URLs
        const cleaned = text.replace(/https?:\/\/[^\s]+/g, '').trim();

        // If the cleaned text is empty or just whitespace, return a fallback
        if (!cleaned) {
            return 'Location not specified';
        }

        // If it's just coordinates, provide a more meaningful description
        if (/^\d+\.\d+,\d+\.\d+$/.test(cleaned)) {
            return 'Location coordinates provided';
        }

        return cleaned;
    };

    // Get priority styling
    const getPriorityStyle = (priority) => {
        const styles = {
            high: 'bg-red-50 text-red-700 border-red-300',
            normal: 'bg-green-50 text-green-700 border-green-300',
            low: 'bg-blue-50 text-blue-700 border-blue-300',
            urgent: 'bg-orange-50 text-orange-700 border-orange-300'
        };
        return styles[priority] || styles.normal;
    };


    // Location handling with retry limits - COMPLETELY REWRITTEN
    const getLocation = useCallback(() => {
        // If we've already resolved location, don't try again
        if (locationResolved) {
            return Promise.resolve({ lat: 35.1255, lng: 33.3095 });
        }

        return new Promise((resolve) => {
            // Check if geolocation is supported
            if (!navigator.geolocation) {
                console.log('📍 Geolocation not supported, using default coordinates');
                setLocationResolved(true);
                setLocationError('Location services not supported by your browser');
                resolve({ lat: 35.1255, lng: 33.3095 });
                return;
            }

            // Check if we're in a browser environment that supports geolocation
            if (typeof navigator === 'undefined' || !navigator.geolocation) {
                console.log('📍 Geolocation not available in this environment');
                setLocationResolved(true);
                setLocationError('Location services not available in this environment');
                resolve({ lat: 35.1255, lng: 33.3095 });
                return;
            }

            // Check for macOS/iOS specific issues
            const isMacOS = navigator.platform.indexOf('Mac') !== -1;
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

            if (isMacOS || isIOS) {
                console.log('📍 Detected macOS/iOS platform - using optimized location settings');
            }

            // Single location attempt with immediate fallback
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('📍 Location obtained successfully:', {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLocationResolved(true);
                    setLocationError(null);
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.log('📍 Location failed, using default coordinates:', error.message);
                    setLocationResolved(true);

                    // Handle CoreLocationProvider error specifically
                    let errorMessage = 'Using default location. Enable location services for better results.';

                    if (error.message.includes('CoreLocationProvider') || error.message.includes('kCLErrorLocationUnknown')) {
                        errorMessage = 'macOS/iOS Location Issue: Please enable Location Services in System Preferences > Security & Privacy > Privacy > Location Services and grant permission to your browser.';
                        console.log('📍 CoreLocationProvider error detected - providing macOS/iOS specific guidance');
                    } else {
                        switch (error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage = 'Location permission denied. Please enable location services in your browser settings.';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage = 'Location unavailable. Using default coordinates.';
                                break;
                            case error.TIMEOUT:
                                errorMessage = 'Location request timed out. Using default coordinates.';
                                break;
                            default:
                                errorMessage = 'Location error occurred. Using default coordinates.';
                        }
                    }

                    setLocationError(errorMessage);
                    resolve({ lat: 35.1255, lng: 33.3095 }); // Use default immediately
                },
                {
                    enableHighAccuracy: false, // Set to false for better compatibility
                    timeout: 5000, // Increased timeout for macOS/iOS
                    maximumAge: 600000 // 10 minutes cache
                }
            );
        });
    }, [locationResolved]);

    // Update location in broadcast context
    const updateLocationInContext = useCallback(async () => {
        try {
            const location = await getLocation();
            setUserLocation(location);
            console.log('📍 Updated location in broadcast context:', location);
        } catch (error) {
            console.error('Error updating location in context:', error);
        }
    }, [getLocation]);

    // Handle manual location update
    const handleManualLocationUpdate = useCallback(() => {
        console.log('📍 Updating manual location:', manualLocation);
        setUserLocation(manualLocation);
        setLocationResolved(true);
        setLocationError(null);
        setShowManualLocation(false);
        showSuccess('Location updated manually!');
    }, [manualLocation, setUserLocation, showSuccess]);

    // Request location permission with better error handling
    const requestLocationPermission = useCallback(() => {
        setLocationPermission('requesting');
        setLocationResolved(false);
        setLocationError(null);

        getLocation().then(() => {
            setLocationPermission('granted');
        }).catch(() => {
            setLocationPermission('denied');
        });
    }, [getLocation]);

    // Accept a delivery broadcast
    const acceptBroadcast = async (deliveryId) => {
        try {
            // setAccepting(deliveryId); // This state variable was removed

            const response = await apiService.acceptBroadcastDelivery(deliveryId);

            if (response.success) {

                // Remove the accepted delivery from the list
                fetchBroadcasts();

                // Play success sound
                soundService.playSound('success');

                // Navigate to driver's deliveries page
                setTimeout(() => {
                    window.location.href = '/driver/deliveries';
                }, 1500);
            } else {
                showError(response.message || 'Failed to accept delivery');
            }
        } catch (error) {
            console.error('Error accepting broadcast:', error);
            showError('Failed to accept delivery');
        } finally {
            // setAccepting(null); // This state variable was removed
        }
    };






    // Socket.IO event listeners for real-time updates
    useEffect(() => {
        if (!user) return;

        const socket = socketService.getSocket();
        if (!socket || !socketService.isConnected()) {
            console.log('⚠️ BroadcastPage: Socket not available for real-time updates');
            return;
        }

        console.log('🔌 BroadcastPage: Setting up socket event listeners');

        // Listen for new delivery broadcasts
        const handleNewBroadcast = (data) => {
            console.log('📡 BroadcastPage: New broadcast received:', data);

            // Refresh broadcasts to get updated list
            fetchBroadcasts();

            // Play notification sound
            soundService.playSound('notification');

            // Show snackbar notification with cleaned location descriptions
            const pickupLocation = cleanLocationText(data.pickupLocationDescription || data.pickupLocation);
            const deliveryLocation = cleanLocationText(data.deliveryLocationDescription || data.deliveryLocation);
            const message = `New delivery available: ${pickupLocation} → ${deliveryLocation}`;
            showSuccess(message);
        };

        // Listen for broadcast removal (when accepted by another driver)
        const handleBroadcastRemoved = (data) => {
            console.log('📡 BroadcastPage: Broadcast removed:', data);

            // Refresh broadcasts to get updated list
            fetchBroadcasts();

            // Show snackbar notification
            showSuccess('A delivery was accepted by another driver');
        };

        // Listen for broadcast expiration
        const handleBroadcastExpired = (data) => {
            console.log('📡 BroadcastPage: Broadcast expired:', data);

            // Refresh broadcasts to get updated list
            fetchBroadcasts();

            // Show snackbar notification
            showSuccess('A delivery broadcast has expired');
        };

        // Set up event listeners
        socket.on('delivery-broadcast', handleNewBroadcast);
        socket.on('delivery-accepted-by-other', handleBroadcastRemoved);
        socket.on('broadcast-expired', handleBroadcastExpired);

        console.log('✅ BroadcastPage: Socket event listeners set up successfully');

        return () => {
            if (socket) {
                console.log('🧹 BroadcastPage: Cleaning up socket event listeners');
                socket.off('delivery-broadcast', handleNewBroadcast);
                socket.off('delivery-accepted-by-other', handleBroadcastRemoved);
                socket.off('broadcast-expired', handleBroadcastExpired);
            }
        };
    }, [user, showSuccess, fetchBroadcasts]);

    // Load initial data and set up auto-refresh
    useEffect(() => {
        updateLocationInContext();

        // Auto-refresh every 3 minutes
        const interval = setInterval(() => {
            if (!loading) {
                updateLocationInContext();
            }
        }, 180000); // 3 minutes

        return () => {
            clearInterval(interval);
        };
    }, [updateLocationInContext, loading]);



    // Check if driver is online and ensure socket connection
    useEffect(() => {
        const checkOnlineStatus = async () => {
            try {
                // First, ensure socket is connected
                if (user && !socketService.isConnected()) {
                    console.log('🔌 Attempting to connect socket for user:', user._id || user.id);
                    socketService.ensureInitialized(user._id || user.id, user.userType || user.role);
                }

                // Use socket connection status instead of API polling
                const socketOnline = socketService.isConnected();
                setIsOnline(socketOnline);

                console.log('🔍 Online status check (WebSocket-based):', {
                    socketOnline,
                    finalStatus: socketOnline
                });
            } catch (error) {
                console.error('Error checking online status:', error);
                // Fallback to socket connection status
                const socketOnline = socketService.isConnected();
                setIsOnline(socketOnline);
                console.log('🔍 Error occurred, using socket status:', socketOnline);
            }
        };

        // Initial check
        checkOnlineStatus();

        // Check every 2 minutes (further reduced frequency since WebSocket is real-time)
        const interval = setInterval(checkOnlineStatus, 120000);

        return () => clearInterval(interval);
    }, [user]);

    if (loading) {
        return <BroadcastSkeleton />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-6">
                    <div className="p-3 sm:p-4 lg:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                            <div className="flex items-center space-x-3">
                                <div className="bg-white border-2 border-green-300 p-2 rounded-lg">
                                    <MegaphoneIcon className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Available Deliveries</h1>
                                    <p className="text-sm text-gray-600">Accept deliveries near your location</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                {/* Online Status Indicator */}
                                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 ${isOnline ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-700 border-red-300'}`}>
                                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span className="text-sm font-medium">
                                        {isOnline ? 'Online' : 'Offline'}
                                    </span>
                                </div>

                                {/* Refresh button removed - WebSocket provides real-time updates */}

                                {/* Test Modal Button */}
                                {/* <button
                                    onClick={testModal}
                                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    Test Modal
                                </button> */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Debug Information */}
                {/* <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">🔍 Debug Information</h3>
                    <div className="text-xs text-yellow-700 space-y-1">
                        <div>📍 Location: {userLocation ? `${userLocation.lat}, ${userLocation.lng}` : 'None'}</div>
                        <div>📡 Broadcasts Count: {broadcasts.length}</div>
                        <div>⏳ Loading: {loading.toString()}</div>
                        <div>🔌 Socket Connected: {socketService.isConnected().toString()}</div>
                        <div>🔐 Socket Authenticated: {socketService.isAuthenticated().toString()}</div>
                        <div>👤 User: {capitalizeName(user?.name) || user?.email || 'Unknown'}</div>
                        <div>🆔 User ID: {user?._id || user?.id || 'None'}</div>
                        <div>🔌 Socket URL: {process.env.REACT_APP_SOCKET_URL}</div>
                        <div>🔄 Real-time Updates: Enabled (WebSocket)</div>
                    </div>
                    <div className="mt-3 space-x-2">
                        <button
                            onClick={() => {
                                console.log('🧪 Manual refresh triggered');
                                fetchBroadcasts();
                            }}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Manual Refresh
                        </button>

                {/* Available Deliveries Header */}
                {/* Location Info */}
                <div className="bg-white border-2 border-green-200 rounded-xl p-4 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white border-2 border-green-300 p-2 rounded-lg">
                                <MapPinIcon className="w-5 h-5 text-green-600" />
                            </div>
                            <span className="text-sm text-gray-700">
                                {userLocation ? (
                                    `Your location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                                ) : (
                                    'Location not available'
                                )}
                            </span>
                        </div>

                        {locationError && (
                            <button
                                onClick={requestLocationPermission}
                                disabled={locationPermission === 'requesting'}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {locationPermission === 'requesting' ? 'Requesting...' : 'Enable Location'}
                            </button>
                        )}
                    </div>

                    {locationError && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            ⚠️ {locationError}
                            {locationError.includes('CoreLocationProvider') && (
                                <div className="mt-1 text-xs">
                                    <strong>macOS/iOS Users:</strong> This is a known issue. Try:
                                    <ul className="mt-1 ml-4 list-disc">
                                        <li>Enable Location Services in System Preferences</li>
                                        <li>Grant location permission to your browser</li>
                                        <li>Try refreshing the page</li>
                                    </ul>
                                </div>
                            )}

                            {/* Manual Location Input */}
                            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-blue-800">📍 Set Manual Location</span>
                                    <button
                                        onClick={() => setShowManualLocation(!showManualLocation)}
                                        className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        {showManualLocation ? 'Hide' : 'Show'}
                                    </button>
                                </div>

                                {showManualLocation && (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-blue-700">Latitude:</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={manualLocation.lat}
                                                    onChange={(e) => setManualLocation(prev => ({ ...prev, lat: parseFloat(e.target.value) || 35.1255 }))}
                                                    className="w-full text-xs p-1 border border-blue-300 rounded"
                                                    placeholder="35.1255"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-blue-700">Longitude:</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={manualLocation.lng}
                                                    onChange={(e) => setManualLocation(prev => ({ ...prev, lng: parseFloat(e.target.value) || 33.3095 }))}
                                                    className="w-full text-xs p-1 border border-blue-300 rounded"
                                                    placeholder="33.3095"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleManualLocationUpdate}
                                            className="w-full text-xs bg-blue-600 text-white py-1 px-2 rounded hover:bg-blue-700"
                                        >
                                            Update Location
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Broadcasts Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <BroadcastSkeleton key={i} />
                        ))}
                    </div>
                ) : broadcasts.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
                        <div className="bg-white border-2 border-gray-300 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <MegaphoneIcon className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries available</h3>
                        <p className="text-gray-600 mb-4">There are currently no deliveries in your area.</p>
                        {/* <div className="text-xs text-gray-500 mb-4">
                            Debug: Location = {userLocation ? `${userLocation.lat}, ${userLocation.lng}` : 'None'} |
                            Broadcasts = {broadcasts.length} |
                            Loading = {loading.toString()}
                        </div> */}
                        {/* <button
                            onClick={() => fetchBroadcasts()}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <ArrowPathIcon className="w-4 h-4 mr-2" />
                            Refresh
                        </button> */}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {broadcasts.map((broadcast) => (
                            <div key={broadcast.id || broadcast._id || broadcast.deliveryId} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-200">
                                {/* Header */}
                                <div className="bg-white border-b-2 border-green-200 p-3 sm:p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <div className="bg-white border-2 border-green-300 p-1 rounded-lg">
                                                <TruckIcon className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <span className="text-sm sm:text-base font-semibold text-gray-900">New Delivery</span>
                                                <div className="text-xs text-gray-500">Available for pickup</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg">
                                            <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                                            <span className="text-xs sm:text-sm font-medium text-gray-700">
                                                {broadcast.timeRemaining ? `${Math.floor(broadcast.timeRemaining / 60)}:${(broadcast.timeRemaining % 60).toString().padStart(2, '0')}` : '--:--'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-3 sm:p-4 space-y-3">
                                    {/* Delivery Code and Priority */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <span className="font-mono text-sm bg-white border-2 border-gray-300 px-3 py-1.5 rounded-lg text-gray-700">
                                                #{broadcast.deliveryCode}
                                            </span>
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 ${getPriorityStyle(broadcast.priority)}`}>
                                                {broadcast.priority.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-green-600">
                                                {formatCurrency(broadcast.fee)}
                                            </div>
                                            {broadcast.driverEarning && (
                                                <div className="text-xs text-blue-600 font-medium">
                                                    Your earning: {formatCurrency(broadcast.driverEarning)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <div className="bg-white border-2 border-gray-300 p-1 rounded-lg">
                                                <UserIcon className="w-4 h-4 text-gray-600" />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900">{broadcast.customerName}</span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-white border-2 border-gray-300 p-1 rounded-lg">
                                                <PhoneIcon className="w-4 h-4 text-gray-600" />
                                            </div>
                                            <span className="text-sm text-gray-700">{broadcast.customerPhone}</span>
                                        </div>
                                    </div>

                                    {/* Locations */}
                                    <div className="space-y-3">
                                        <div className="flex items-start space-x-3">
                                            <div className="bg-white border-2 border-green-200 p-2 rounded-lg">
                                                <MapPinIcon className="w-4 h-4 text-green-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-semibold text-gray-900 mb-1">Pickup Location</div>
                                                <div className="text-sm text-gray-700 leading-relaxed">
                                                    {cleanLocationText(broadcast.pickupLocationDescription || broadcast.pickupLocation)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-3">
                                            <div className="bg-white border-2 border-blue-200 p-2 rounded-lg">
                                                <MapPinIcon className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-semibold text-gray-900 mb-1">Delivery Location</div>
                                                <div className="text-sm text-gray-700 leading-relaxed">
                                                    {cleanLocationText(broadcast.deliveryLocationDescription || broadcast.deliveryLocation)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={() => acceptBroadcast(broadcast.id || broadcast._id || broadcast.deliveryId)}
                                        className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
                                    >
                                        <div className="bg-white border-2 border-white p-0.5 rounded-full mr-2">
                                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                        </div>
                                        Accept Delivery
                                    </button>
                                </div>

                                {/* Timer Progress Bar */}
                                <div className="h-1 bg-gray-200">
                                    <div
                                        className="h-full bg-green-500 transition-all duration-1000 ease-linear"
                                        style={{
                                            width: `${broadcast.timeRemaining ? ((broadcast.broadcastDuration || 60) - broadcast.timeRemaining) / (broadcast.broadcastDuration || 60) * 100 : 0}%`
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BroadcastPage;
