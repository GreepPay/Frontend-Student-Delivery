import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socketService';
import { BellIcon, XMarkIcon, TruckIcon, ChatBubbleLeftRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const RealTimeNotifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const dropdownRef = useRef(null);
    const processedNotifications = useRef(new Set()); // Track processed notifications to prevent duplicates

    // Handle click outside dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotifications]);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    const addNotification = useCallback((notification) => {
        if (!notification || !notification.id) {
            console.warn('Invalid notification:', notification);
            return;
        }

        setNotifications(prev => [notification, ...prev]);

        // Auto-remove notification after 10 seconds
        setTimeout(() => {
            removeNotification(notification.id);
        }, 10000);
    }, [removeNotification]);

    useEffect(() => {
        if (!user) {
            console.log('🔌 No user available for admin notifications');
            return;
        }

        console.log('🔌 Setting up admin notifications for user:', user._id || user.id);

        // Clear old notifications on mount
        setNotifications([]);

        // Check initial connection status
        setIsConnected(socketService.isConnected());

        // Set up periodic connection check
        const interval = setInterval(() => {
            const connected = socketService.isConnected();
            setIsConnected(connected);
        }, 5000);

        // Connect to socket if not already connected
        if (!socketService.isConnected()) {
            socketService.connect(user._id || user.id, user.userType);
        }

        // Helper function to create unique notification ID
        const createNotificationId = (data) => {
            if (data.id) return data.id;
            if (data.message && data.timestamp) {
                return `${data.message}-${data.timestamp}`;
            }
            return `${Date.now()}-${Math.random()}`;
        };

        // Helper function to check if notification is duplicate
        const isDuplicateNotification = (notificationId) => {
            if (processedNotifications.current.has(notificationId)) {
                return true;
            }
            processedNotifications.current.add(notificationId);
            // Clean up old entries to prevent memory leaks
            if (processedNotifications.current.size > 100) {
                const entries = Array.from(processedNotifications.current);
                processedNotifications.current = new Set(entries.slice(-50));
            }
            return false;
        };

        // Socket event listeners
        socketService.on('connect', () => {
            setIsConnected(true);
        });

        socketService.on('disconnect', () => {
            setIsConnected(false);
        });

        socketService.on('authenticated', (data) => {
            setIsConnected(true);
        });

        socketService.on('authentication_error', (error) => {
            setIsConnected(false);
        });

        socketService.on('driver-status-changed', (data) => {
            if (!data || typeof data !== 'object') {
                console.warn('Invalid driver-status-changed data:', data);
                return;
            }

            const notificationId = createNotificationId(data);
            if (isDuplicateNotification(notificationId)) {
                console.log('🔄 Duplicate driver-status-changed detected, skipping:', notificationId);
                return;
            }

            addNotification({
                id: notificationId,
                type: 'driver-status',
                title: 'Driver Status Update',
                message: `${data.name || 'Unknown driver'} is now ${data.isOnline ? 'online' : 'offline'}`,
                timestamp: new Date(),
                data
            });
        });

        socketService.on('delivery-status-changed', (data) => {
            const notificationId = createNotificationId(data);
            if (isDuplicateNotification(notificationId)) {
                console.log('🔄 Duplicate delivery-status-changed detected, skipping:', notificationId);
                return;
            }

            addNotification({
                id: notificationId,
                type: 'delivery-status',
                title: 'Delivery Status Update',
                message: `Delivery ${data.deliveryCode} status changed to ${data.status}`,
                timestamp: new Date(),
                data
            });
        });

        // Note: Driver messages are now handled by AdminMessaging component
        // Exclude from notifications to route to messaging system
        socketService.on('new-message', (data) => {
            console.log('💬 RealTimeNotifications: New message received, routing to AdminMessaging');
            // Don't add to notifications - AdminMessaging component handles this
        });

        socketService.on('delivery-assigned', (data) => {
            const notificationId = createNotificationId(data);
            if (isDuplicateNotification(notificationId)) {
                console.log('🔄 Duplicate delivery-assigned detected, skipping:', notificationId);
                return;
            }

            addNotification({
                id: notificationId,
                type: 'delivery-assigned',
                title: 'Delivery Assigned',
                message: `Delivery ${data.deliveryCode} assigned to driver`,
                timestamp: new Date(),
                data
            });
        });

        socketService.on('emergency-alert', (data) => {
            const notificationId = createNotificationId(data);
            if (isDuplicateNotification(notificationId)) {
                console.log('🔄 Duplicate emergency-alert detected, skipping:', notificationId);
                return;
            }

            addNotification({
                id: notificationId,
                type: 'emergency',
                title: '🚨 Emergency Alert',
                message: `Emergency from driver: ${data.message}`,
                timestamp: new Date(),
                data,
                priority: 'high'
            });
        });

        // Listen for test notifications


        return () => {
            clearInterval(interval);
            socketService.off('connect');
            socketService.off('disconnect');
            socketService.off('authenticated');
            socketService.off('authentication_error');
            socketService.off('driver-status-changed');
            socketService.off('delivery-status-changed');
            socketService.off('new-message');
            socketService.off('delivery-assigned');
            socketService.off('emergency-alert');

        };
    }, [user]);

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'driver-status':
                return <TruckIcon className="h-5 w-5" />;
            case 'delivery-status':
                return <TruckIcon className="h-5 w-5" />;
            case 'message':
                return <ChatBubbleLeftRightIcon className="h-5 w-5" />;
            case 'delivery-assigned':
                return <TruckIcon className="h-5 w-5" />;
            case 'emergency':
                return <ExclamationTriangleIcon className="h-5 w-5" />;
            default:
                return <BellIcon className="h-5 w-5" />;
        }
    };

    const getNotificationColor = (type, priority) => {
        if (priority === 'high') return 'bg-red-50 border-red-200 text-red-800';

        switch (type) {
            case 'emergency':
                return 'bg-red-50 border-red-200 text-red-800';
            case 'driver-status':
                return 'bg-blue-50 border-blue-200 text-blue-800';
            case 'delivery-status':
                return 'bg-green-50 border-green-200 text-green-800';
            case 'message':
                return 'bg-purple-50 border-purple-200 text-purple-800';

            default:
                return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    };

    const formatTime = (timestamp) => {
        return timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="relative">
            {/* Notification Bell */}
            <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
                <BellIcon className="h-6 w-6" />
                {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {notifications.length}
                    </span>
                )}
                {!isConnected && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
                <div ref={dropdownRef} className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Real-time Notifications</h3>
                            <button
                                onClick={() => setShowNotifications(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <span className="text-xs text-gray-500">
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </span>

                        </div>
                    </div>

                    <div className="p-2">
                        {notifications.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <BellIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-3 border rounded-lg mb-2 ${getNotificationColor(notification.type, notification.priority)}`}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">
                                                {notification.title}
                                            </p>
                                            <p className="text-sm mt-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatTime(notification.timestamp)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeNotification(notification.id)}
                                            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                                        >
                                            <XMarkIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RealTimeNotifications; 