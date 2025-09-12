import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import requestDeduplicator from '../utils/requestDeduplicator';
import socketService from '../services/socketService';
import { useAuth } from './AuthContext';

const BroadcastContext = createContext();

export const useBroadcasts = () => {
    const context = useContext(BroadcastContext);
    if (!context) {
        throw new Error('useBroadcasts must be used within a BroadcastProvider');
    }
    return context;
};

export const BroadcastProvider = ({ children }) => {
    const { user } = useAuth();
    const [broadcasts, setBroadcasts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastFetchTime, setLastFetchTime] = useState(null);
    const [userLocation, setUserLocation] = useState(null);

    // Global broadcast fetching function
    const fetchBroadcasts = useCallback(async (location, force = false) => {
        console.log('📍 BroadcastContext: fetchBroadcasts called with:', { location, force });

        if (!location) {
            console.log('📍 BroadcastContext: No location provided');
            return;
        }

        const now = Date.now();
        const timeSinceLastFetch = lastFetchTime ? now - lastFetchTime : Infinity;
        const minInterval = 30000; // 30 seconds minimum between API fetches (increased since WebSocket handles real-time)

        // Don't fetch if we recently fetched and this isn't a forced refresh
        if (!force && timeSinceLastFetch < minInterval) {
            console.log(`📍 BroadcastContext: Skipping API fetch, last fetch was ${Math.round(timeSinceLastFetch / 1000)}s ago. WebSocket handles real-time updates.`);
            return;
        }

        const endpoint = '/delivery/broadcast/active';
        const requestKey = `${endpoint}?lat=${location.lat}&lng=${location.lng}`;

        return requestDeduplicator.execute(requestKey, async () => {
            // Rate limiting removed - all requests allowed

            setLoading(true);
            try {
                console.log('📡 BroadcastContext: Fetching broadcasts for location:', location);
                const response = await apiService.getActiveBroadcasts(location.lat, location.lng);

                if (response && response.success) {
                    const broadcastsData = response.data?.broadcasts || response.data || [];
                    console.log('📡 BroadcastContext: Received broadcasts from API:', broadcastsData);
                    setBroadcasts(broadcastsData);
                    setLastFetchTime(now);
                } else {
                    console.warn('📡 BroadcastContext: No broadcasts data in API response:', response);
                    // Don't clear broadcasts on API failure, keep existing ones from WebSocket
                }
            } catch (error) {
                console.error('❌ BroadcastContext: Error fetching broadcasts from API:', error);

                console.warn('⚠️ BroadcastContext: API fetch failed, keeping existing broadcasts from WebSocket');
            } finally {
                setLoading(false);
            }
        });
    }, [lastFetchTime]);

    // Update user location
    const updateLocation = useCallback((location) => {
        setUserLocation(location);
        if (location) {
            fetchBroadcasts(location, true); // Force refresh with new location
        }
    }, [fetchBroadcasts]);

    // Refresh broadcasts
    const refreshBroadcasts = useCallback(() => {
        if (userLocation) {
            return fetchBroadcasts(userLocation, true);
        }
    }, [userLocation, fetchBroadcasts]);

    // Add new broadcast to the list (for real-time updates)
    const addNewBroadcast = useCallback((newBroadcast) => {
        console.log('🚚 BroadcastContext: Adding new broadcast via socket:', newBroadcast);
        console.log('🚚 BroadcastContext: Current broadcasts before adding:', broadcasts);

        setBroadcasts(prev => {
            // Check if broadcast already exists
            const exists = prev.find(b => b.id === newBroadcast.id || b.deliveryId === newBroadcast.deliveryId);
            if (exists) {
                console.log('🚚 BroadcastContext: Broadcast already exists, skipping');
                return prev;
            }

            // Add new broadcast to the beginning of the list
            const updatedBroadcasts = [newBroadcast, ...prev];
            console.log('🚚 BroadcastContext: Updated broadcasts after adding:', updatedBroadcasts);
            return updatedBroadcasts;
        });
    }, [broadcasts]);

    // Remove broadcast from the list (when accepted by another driver)
    const removeBroadcast = useCallback((deliveryId) => {
        console.log('🚚 BroadcastContext: Removing broadcast:', deliveryId);
        console.log('🚚 BroadcastContext: Current broadcasts before removing:', broadcasts);

        setBroadcasts(prev => {
            const updatedBroadcasts = prev.filter(b => b.id !== deliveryId && b.deliveryId !== deliveryId);
            console.log('🚚 BroadcastContext: Updated broadcasts after removing:', updatedBroadcasts);
            return updatedBroadcasts;
        });
    }, [broadcasts]);

    // Set up socket listeners for real-time updates
    useEffect(() => {
        if (!user) return;

        console.log('🔌 BroadcastContext: Setting up socket listeners for real-time updates');

        // Ensure socket is connected
        if (!socketService.isConnected() && !socketService.isConnecting()) {
            console.log('🔌 BroadcastContext: Connecting to socket...');
            socketService.connect(user._id || user.id, user.userType || user.role);
        } else {
            console.log('🔌 BroadcastContext: Socket already connected or connecting, skipping...');
        }

        // Listen for new delivery broadcasts
        const handleNewBroadcast = (data) => {
            console.log('🚚 BroadcastContext: Received new broadcast via socket:', data);
            console.log('🚚 BroadcastContext: Socket data type:', typeof data);
            console.log('🚚 BroadcastContext: Socket data keys:', Object.keys(data || {}));

            // Transform socket data to match broadcast format
            const broadcastData = {
                id: data.deliveryId || data.id,
                deliveryId: data.deliveryId || data.id,
                deliveryCode: data.deliveryCode,
                pickupLocation: data.pickupLocation,
                deliveryLocation: data.deliveryLocation,
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                fee: data.fee,
                paymentMethod: data.paymentMethod,
                priority: data.priority,
                notes: data.notes,
                estimatedTime: data.estimatedTime,
                broadcastEndTime: data.broadcastEndTime,
                broadcastDuration: data.broadcastDuration,
                distance: data.distance,
                createdAt: data.createdAt || new Date().toISOString()
            };

            console.log('🚚 BroadcastContext: Transformed broadcast data:', broadcastData);
            addNewBroadcast(broadcastData);
        };

        // Listen for broadcast removal (when accepted by another driver)
        const handleBroadcastRemoved = (data) => {
            console.log('🚚 BroadcastContext: Broadcast removed via socket:', data);
            removeBroadcast(data.deliveryId || data.id);
        };

        // Listen for broadcast expiration
        const handleBroadcastExpired = (data) => {
            console.log('🚚 BroadcastContext: Broadcast expired via socket:', data);
            removeBroadcast(data.deliveryId || data.id);
        };

        // Set up event listeners
        socketService.on('delivery-broadcast', handleNewBroadcast);
        socketService.on('test-delivery-broadcast', handleNewBroadcast);
        socketService.on('delivery-accepted-by-other', handleBroadcastRemoved);
        socketService.on('broadcast-expired', handleBroadcastExpired);

        return () => {
            console.log('🧹 BroadcastContext: Cleaning up socket listeners');
            socketService.off('delivery-broadcast', handleNewBroadcast);
            socketService.off('test-delivery-broadcast', handleNewBroadcast);
            socketService.off('delivery-accepted-by-other', handleBroadcastRemoved);
            socketService.off('broadcast-expired', handleBroadcastExpired);
        };
    }, [user, addNewBroadcast, removeBroadcast]);

    // Auto-refresh every 2 minutes (reduced frequency)
    useEffect(() => {
        if (!userLocation) return;

        const interval = setInterval(() => {
            fetchBroadcasts(userLocation, false); // Not forced
        }, 120000); // 2 minutes

        return () => clearInterval(interval);
    }, [userLocation, fetchBroadcasts]);

    const value = {
        broadcasts,
        loading,
        userLocation,
        updateLocation,
        refreshBroadcasts,
        fetchBroadcasts,
        addNewBroadcast,
        removeBroadcast
    };

    return (
        <BroadcastContext.Provider value={value}>
            {children}
        </BroadcastContext.Provider>
    );
};
