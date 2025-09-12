import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socketService from '../../services/socketService';
import soundService from '../../services/soundService';
import DeliveryBroadcastModal from './DeliveryBroadcastModal';
import { useAuth } from '../../context/AuthContext';
import pwaService from '../../services/pwaService';
import notificationPermissionService from '../../services/notificationPermissionService';

const DeliveryBroadcastContext = createContext();

export const useDeliveryBroadcast = () => {
    const context = useContext(DeliveryBroadcastContext);
    if (!context) {
        throw new Error('useDeliveryBroadcast must be used within a DeliveryBroadcastProvider');
    }
    return context;
};

export const DeliveryBroadcastProvider = ({ children }) => {
    const { user } = useAuth();
    const [activeBroadcasts, setActiveBroadcasts] = useState([]);
    const [acceptedDeliveries, setAcceptedDeliveries] = useState(new Set());

    // Handle broadcast accepted
    const handleBroadcastAccepted = useCallback((deliveryId) => {
        console.log('✅ Delivery accepted:', deliveryId);

        // Remove from active broadcasts
        setActiveBroadcasts(prev => prev.filter(b => b.deliveryId !== deliveryId));

        // Add to accepted deliveries to prevent showing again
        setAcceptedDeliveries(prev => new Set([...prev, deliveryId]));
    }, []);

    // Handle broadcast closed
    const handleBroadcastClosed = useCallback((deliveryId) => {
        console.log('❌ Broadcast closed:', deliveryId);
        setActiveBroadcasts(prev => prev.filter(b => b.deliveryId !== deliveryId));
    }, []);

    // Handle broadcast expired
    const handleBroadcastExpired = useCallback((deliveryId) => {
        console.log('⏰ Broadcast expired:', deliveryId);
        setActiveBroadcasts(prev => prev.filter(b => b.deliveryId !== deliveryId));
    }, []);

    // Add broadcast to state helper function
    const addBroadcastToState = useCallback((deliveryData) => {
        setActiveBroadcasts(prev => {
            // Check if this delivery is already being shown
            const existingBroadcast = prev.find(b => b.deliveryId === deliveryData.deliveryId);
            if (existingBroadcast) {
                console.log('🚚 Broadcast already active for delivery:', deliveryData.deliveryId);
                return prev;
            }

            // Check if this delivery was already accepted
            if (acceptedDeliveries.has(deliveryData.deliveryId)) {
                console.log('🚚 Delivery already accepted:', deliveryData.deliveryId);
                return prev;
            }

            // Transform backend data to frontend format with safe defaults
            const broadcastWithEndTime = {
                id: deliveryData.deliveryId,
                deliveryId: deliveryData.deliveryId,
                deliveryCode: deliveryData.deliveryCode || 'N/A',
                pickupLocation: deliveryData.pickupLocation || 'Unknown',
                deliveryLocation: deliveryData.deliveryLocation || 'Unknown',
                customerName: deliveryData.customerName || 'Unknown',
                customerPhone: deliveryData.customerPhone || 'N/A',
                fee: deliveryData.fee || 0,
                driverEarning: deliveryData.driverEarning || deliveryData.fee || 0,
                companyEarning: deliveryData.companyEarning || 0,
                paymentMethod: deliveryData.paymentMethod || 'cash',
                priority: deliveryData.priority || 'normal',
                notes: deliveryData.notes || '',
                estimatedTime: deliveryData.estimatedTime || null,
                pickupCoordinates: deliveryData.pickupCoordinates || null,
                deliveryCoordinates: deliveryData.deliveryCoordinates || null,
                broadcastEndTime: deliveryData.broadcastEndTime ||
                    new Date(Date.now() + (deliveryData.broadcastDuration || 60) * 1000).toISOString(),
                broadcastDuration: deliveryData.broadcastDuration || 60,
                distance: deliveryData.distance || 'Unknown',
                createdAt: deliveryData.createdAt || new Date().toISOString(),
                timeRemaining: deliveryData.timeRemaining ||
                    Math.max(0, (deliveryData.broadcastDuration || 60) * 1000)
            };

            console.log('🚚 Processed broadcast data:', broadcastWithEndTime);
            return [...prev, broadcastWithEndTime];
        });
    }, [acceptedDeliveries]);

    // Test function to manually trigger modal (for debugging)
    const testModal = useCallback(() => {
        const testDelivery = {
            deliveryId: 'test-' + Date.now(),
            deliveryCode: 'TEST-123456',
            pickupLocation: 'Test Pickup Location',
            deliveryLocation: 'Test Delivery Location',
            customerName: 'Test Customer',
            customerPhone: '+9056789766',
            fee: 250,
            driverEarning: 150,
            companyEarning: 100,
            paymentMethod: 'cash',
            priority: 'urgent',
            notes: 'This is a test delivery for the modal system',
            estimatedTime: new Date(Date.now() + 3600000).toISOString(),
            broadcastDuration: 60,
            broadcastEndTime: new Date(Date.now() + 60000).toISOString(),
            createdAt: new Date().toISOString()
        };

        console.log('🧪 Testing modal with delivery:', testDelivery);
        addBroadcastToState(testDelivery);
    }, [addBroadcastToState]);

    // Debug function to manually trigger modal with custom data
    const triggerModal = useCallback((deliveryData) => {
        console.log('🧪 Manually triggering modal with data:', deliveryData);
        addBroadcastToState(deliveryData);
    }, [addBroadcastToState]);

    // Handle new delivery broadcast
    const handleNewBroadcast = useCallback((deliveryData) => {
        console.log('🚚 New delivery broadcast received:', deliveryData);
        console.log('🚚 Delivery data details:', {
            deliveryId: deliveryData?.deliveryId,
            deliveryCode: deliveryData?.deliveryCode,
            pickupLocation: deliveryData?.pickupLocation,
            deliveryLocation: deliveryData?.deliveryLocation,
            fee: deliveryData?.fee
        });

        // Validate delivery data
        if (!deliveryData || !deliveryData.deliveryId) {
            console.warn('🚚 Invalid delivery data received:', deliveryData);
            return;
        }

        // Simplified driver status check - show broadcast regardless of API status
        console.log('✅ Showing broadcast regardless of driver status (for testing)');

        // Play delivery sound IMMEDIATELY
        soundService.playSound('delivery').catch(err => console.log('🔊 Delivery sound failed:', err));

        addBroadcastToState(deliveryData);
    }, [addBroadcastToState]);

    // Handle notification-based delivery events
    const handleNotificationDelivery = useCallback((notificationData) => {
        console.log('📱 Notification delivery received:', notificationData);

        // Extract delivery data from notification format
        let deliveryData = notificationData;

        // If it's a notification object, extract the delivery data
        if (notificationData.notification) {
            deliveryData = notificationData.notification;
        }

        // If it's a message string, try to parse it
        if (typeof notificationData === 'string') {
            console.log('📱 Parsing notification message:', notificationData);
            // Try to extract delivery info from the message
            // This is a fallback for text-based notifications
            const testDelivery = {
                deliveryId: 'notification-' + Date.now(),
                deliveryCode: 'NOTIF-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                pickupLocation: 'Location from notification',
                deliveryLocation: 'Location from notification',
                customerName: 'Customer from notification',
                customerPhone: 'N/A',
                fee: 0,
                driverEarning: 0,
                companyEarning: 0,
                paymentMethod: 'cash',
                priority: 'normal',
                notes: notificationData,
                estimatedTime: new Date(Date.now() + 3600000).toISOString(),
                broadcastDuration: 60,
                createdAt: new Date().toISOString()
            };
            deliveryData = testDelivery;
        }

        // Play delivery sound
        soundService.playSound('delivery').catch(err => console.log('🔊 Delivery sound failed:', err));

        // Add to broadcast state
        addBroadcastToState(deliveryData);
    }, [addBroadcastToState]);

    // Set up socket listeners
    useEffect(() => {
        if (!user) {
            console.log('🔌 DeliveryBroadcastProvider: No user available');
            return;
        }

        console.log('🔌 DeliveryBroadcastProvider: Setting up socket listeners for user:', user._id || user.id);

        // Request notification permissions for drivers
        const requestNotificationPermissions = async () => {
            try {
                const permissionGranted = await notificationPermissionService.enforcePermission('delivery', 'medium');
                if (permissionGranted) {
                    console.log('✅ Notification permissions granted for delivery notifications');

                    // Subscribe to push notifications
                    const subscription = await pwaService.subscribeToPushNotifications();
                    if (subscription) {
                        console.log('✅ Push notification subscription successful');

                        // Send subscription to backend
                        try {
                            await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/driver/push-subscription`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    subscription: subscription,
                                    userId: user._id || user.id
                                })
                            });
                            console.log('✅ Push subscription sent to backend');
                        } catch (error) {
                            console.error('❌ Failed to send push subscription to backend:', error);
                        }
                    }
                } else {
                    console.log('⚠️ Notification permissions not granted');
                }
            } catch (error) {
                console.error('❌ Error requesting notification permissions:', error);
            }
        };

        // Request permissions when component mounts
        requestNotificationPermissions();

        // Ensure socket is connected
        if (!socketService.isConnected() && !socketService.isConnecting()) {
            console.log('🔌 DeliveryBroadcastProvider: Socket not connected, attempting to connect...');
            socketService.connect(user._id || user.id, user.userType || user.role);
        } else {
            console.log('🔌 DeliveryBroadcastProvider: Socket already connected or connecting');
        }

        // Listen for new delivery broadcasts
        socketService.on('delivery-broadcast', handleNewBroadcast);

        // Listen for test broadcast events
        socketService.on('test-delivery-broadcast', handleNewBroadcast);

        // Listen for notification-based delivery events
        socketService.on('new-delivery', handleNewBroadcast);
        socketService.on('delivery-notification', handleNewBroadcast);
        socketService.on('delivery-created', handleNewBroadcast);
        socketService.on('broadcast-delivery', handleNewBroadcast);
        socketService.on('notification-delivery', handleNotificationDelivery); // New listener for notification-based delivery

        // Listen for delivery status changes
        const handleDeliveryStatusChange = (data) => {
            console.log('📡 Delivery status changed:', data);
            // If delivery is assigned or completed, remove from active broadcasts
            if (data.status === 'assigned' || data.status === 'completed') {
                setActiveBroadcasts(prev => prev.filter(b => b.deliveryId !== data.deliveryId));
            }
        };

        socketService.on('delivery-status-changed', handleDeliveryStatusChange);

        return () => {
            console.log('🧹 DeliveryBroadcastProvider: Cleaning up socket listeners');
            socketService.off('delivery-broadcast', handleNewBroadcast);
            socketService.off('test-delivery-broadcast', handleNewBroadcast);
            socketService.off('new-delivery', handleNewBroadcast);
            socketService.off('delivery-notification', handleNewBroadcast);
            socketService.off('delivery-created', handleNewBroadcast);
            socketService.off('broadcast-delivery', handleNewBroadcast);
            socketService.off('notification-delivery', handleNotificationDelivery); // Clean up new listener
            socketService.off('delivery-status-changed', handleDeliveryStatusChange);
        };
    }, [user, handleNewBroadcast, handleNotificationDelivery]);

    // Clean up expired broadcasts periodically
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setActiveBroadcasts(prev =>
                prev.filter(broadcast => {
                    if (!broadcast.broadcastEndTime) return true;
                    const endTime = new Date(broadcast.broadcastEndTime);
                    return endTime > now;
                })
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <DeliveryBroadcastContext.Provider value={{
            activeBroadcasts,
            acceptedDeliveries,
            handleBroadcastAccepted,
            handleBroadcastClosed,
            handleBroadcastExpired,
            testModal,
            triggerModal
        }}>
            {children}

            {/* Render active broadcast modals */}
            {activeBroadcasts.map((broadcast) => (
                <DeliveryBroadcastModal
                    key={broadcast.id}
                    delivery={broadcast}
                    onAccept={handleBroadcastAccepted}
                    onClose={handleBroadcastClosed}
                    onExpire={handleBroadcastExpired}
                />
            ))}
        </DeliveryBroadcastContext.Provider>
    );
};
