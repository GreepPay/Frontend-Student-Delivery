import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socketService';
import { BellIcon, XMarkIcon, TruckIcon, ChatBubbleLeftRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const DriverRealTimeNotifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const dropdownRef = useRef(null);

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
        if (!user) return;

        const userId = user._id || user.id;
        console.log('🔌 Setting up driver notifications for user:', userId);

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
            socketService.connect(userId, user.userType);
        }

        // Socket event listeners
        socketService.on('connect', () => {
            console.log('✅ Driver socket connected');
            setIsConnected(true);
        });

        socketService.on('disconnect', () => {
            console.log('❌ Driver socket disconnected');
            setIsConnected(false);
        });

        socketService.on('authenticated', (data) => {
            console.log('✅ Driver socket authenticated:', data);
            setIsConnected(true);
        });

        socketService.on('authentication_error', (error) => {
            console.error('❌ Driver socket authentication error:', error);
            setIsConnected(false);
        });

        socketService.on('delivery-assigned', (data) => {
            if (!data || typeof data !== 'object') {
                console.warn('Invalid delivery-assigned data:', data);
                return;
            }

            addNotification({
                id: Date.now(),
                type: 'delivery-assigned',
                title: '🚚 New Delivery Assigned',
                message: `You have been assigned delivery ${data.deliveryCode || 'Unknown'}`,
                timestamp: new Date(),
                data
            });
        });

        // Listen for new notifications from the notification service
        socketService.on('new-notification', (notification) => {
            console.log('🎉 Driver received new notification:', notification);

            // Play sound for delivery assignments
            if (notification.type === 'delivery_assigned') {
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    // Delivery assignment sound
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.3);
                } catch (error) {
                    console.log('Sound generation failed:', error);
                }
            }

            addNotification({
                id: Date.now(),
                type: notification.type || 'notification',
                title: notification.title || 'New Notification',
                message: notification.message,
                timestamp: new Date(),
                data: notification.data || notification
            });
        });

        socketService.on('new-message', (data) => {
            // Don't show admin messages as notifications - they should appear in message box
            if (data.senderType === 'admin' || data.sender === 'admin' || data.adminId) {
                console.log('📨 Admin message received - will be handled by message box component');
                return;
            }

            addNotification({
                id: Date.now(),
                type: 'message',
                title: '💬 New Message',
                message: `New message from ${data.senderType}: ${data.message.substring(0, 50)}...`,
                timestamp: new Date(),
                data
            });
        });

        socketService.on('status-update', (data) => {
            addNotification({
                id: Date.now(),
                type: 'status-update',
                title: '📊 Status Update',
                message: data.message,
                timestamp: new Date(),
                data
            });
        });



        return () => {
            clearInterval(interval);
            socketService.off('connect');
            socketService.off('disconnect');
            socketService.off('authenticated');
            socketService.off('authentication_error');
            socketService.off('delivery-assigned');
            socketService.off('new-notification');
            socketService.off('new-message');
            socketService.off('status-update');


        };
    }, [user]);

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'delivery-assigned':
                return <TruckIcon className="h-5 w-5" />;
            case 'message':
                return <ChatBubbleLeftRightIcon className="h-5 w-5" />;
            case 'status-update':
                return <CheckCircleIcon className="h-5 w-5" />;

            default:
                return <BellIcon className="h-5 w-5" />;
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'delivery-assigned':
                return 'bg-blue-50 border-blue-200 text-blue-800';
            case 'message':
                return 'bg-purple-50 border-purple-200 text-purple-800';
            case 'status-update':
                return 'bg-green-50 border-green-200 text-green-800';

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
                                    className={`p-3 border rounded-lg mb-2 ${getNotificationColor(notification.type)}`}
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

export default DriverRealTimeNotifications; 