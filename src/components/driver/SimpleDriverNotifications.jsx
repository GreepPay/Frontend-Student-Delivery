import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socketService';
import soundService from '../../services/soundService';
import notificationManager from '../../services/notificationManager';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const SimpleDriverNotifications = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const dropdownRef = useRef(null);
    const listenersSet = useRef(false);



    // Handle click outside dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    // Main useEffect for socket connection and notifications
    useEffect(() => {
        if (!user) {
            return;
        }

        // Connect to socket
        if (!socketService.isInitialized() || (!socketService.isConnected() && !socketService.isConnecting())) {
            const userId = user._id || user.id;
            console.log('🔌 SimpleDriverNotifications: Connecting to socket...');
            socketService.connect(userId, user.userType);
        } else {
            console.log('🔌 SimpleDriverNotifications: Socket already connected or connecting, skipping...');
        }

        // Only set up listeners once
        if (listenersSet.current) {
            return;
        }

        listenersSet.current = true;
        const componentName = 'DriverSimpleNotifications';

        // Remove existing listeners to prevent duplicates
        socketService.off('notification');
        socketService.off('delivery_update');
        socketService.off('system_alert');

        // Listen for general notifications with better filtering
        socketService.on('notification', (data) => {
            // Skip driver messages and low priority notifications
            if (data._routeToMessaging ||
                data.type === 'driver-message' ||
                data.type === 'message' ||
                data.senderType === 'driver' ||
                data.message?.includes('Message from') ||
                data.message?.includes('💬') ||
                (data.priority === 'low' && data.type !== 'delivery')) {
                console.log('🔔 SimpleDriverNotifications: Skipping notification:', data.type);
                return;
            }

            const notification = notificationManager.processNotification({
                ...data,
                message: data.message || 'New notification received'
            }, componentName);
            if (notification) {
                addNotification(notification);
            }
        });

        // Listen for delivery updates
        socketService.on('delivery_update', (data) => {
            const notification = notificationManager.processNotification({
                ...data,
                message: `📦 ${data.message || 'Delivery status updated'}`,
                type: 'delivery_update'
            }, componentName);
            if (notification) {
                addNotification(notification);
            }
        });

        // Listen for system alerts
        socketService.on('system_alert', (data) => {
            const notification = notificationManager.processNotification({
                ...data,
                message: `⚠️ ${data.message || 'System alert'}`,
                type: 'system_alert',
                priority: 'high'
            }, componentName);
            if (notification) {
                addNotification(notification);
            }
        });

        // Check connection status
        const checkConnection = () => {
            if (socketService.isInitialized()) {
                setIsConnected(socketService.isConnected());
            } else {
                setIsConnected(false);
            }
        };
        checkConnection();
        const interval = setInterval(checkConnection, 30000); // Reduced from 5s to 30s

        return () => {
            clearInterval(interval);
            socketService.off('notification');
            socketService.off('delivery_update');
            socketService.off('system_alert');
            listenersSet.current = false;
        };
    }); // Removed [user] dependency so it runs on every render



    const addNotification = (notification) => {
        setNotifications(prev => {
            const newNotifications = [notification, ...prev.slice(0, 9)]; // Keep only last 10
            return newNotifications;
        });
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleNotificationClick = () => {
        // On mobile, navigate to notifications page
        // On desktop, toggle dropdown
        if (window.innerWidth < 640) {
            navigate('/driver/notifications');
        } else {
            setShowDropdown(!showDropdown);
        }
    };

    return (
        <div className="relative">
            {/* Notification Bell */}
            <button
                onClick={handleNotificationClick}
                className="relative p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg"
                aria-label="Notifications"
            >
                <BellIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-medium">
                        {notifications.length > 99 ? '99+' : notifications.length}
                    </span>
                )}
                {!isConnected && (
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div ref={dropdownRef} className="absolute mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] sm:max-h-96 sm:right-0 sm:left-auto right-0 left-4 sm:left-auto sm:w-72 md:w-80 lg:w-96 hidden sm:block">
                    {/* Header */}
                    <div className="p-3 sm:p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Notifications</h3>
                            <button
                                onClick={() => setShowDropdown(false)}
                                className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Close notifications"
                            >
                                <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <span className="text-xs text-gray-500">
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-48 sm:max-h-64 md:max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                <div className="flex flex-col items-center space-y-2">
                                    <BellIcon className="h-8 w-8 text-gray-300" />
                                    <p className="text-sm">No notifications</p>
                                </div>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                // Determine background color and icon based on notification type
                                let bgColor = 'bg-white';
                                let icon = '📢';

                                if (notification.type === 'system_alert') {
                                    bgColor = 'bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500';
                                    icon = '⚠️';
                                } else if (notification.type === 'delivery_update') {
                                    bgColor = 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500';
                                    icon = '📦';
                                } else if (notification.type === 'notification') {
                                    bgColor = 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500';
                                    icon = '🔔';
                                }

                                return (
                                    <div
                                        key={notification.id}
                                        className={`p-4 border-b border-gray-100 last:border-b-0 ${bgColor} hover:bg-gray-50 transition-all duration-200`}
                                    >
                                        <div className="flex justify-between items-start space-x-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start space-x-3">
                                                    <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
                                                    <p className="text-sm text-gray-900 leading-relaxed break-words font-medium">
                                                        {notification.message}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2 ml-8">
                                                    {notification.timestamp.toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeNotification(notification.id)}
                                                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                aria-label="Remove notification"
                                            >
                                                <XMarkIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer for mobile */}
                    <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
                            <button
                                onClick={() => setNotifications([])}
                                className="text-primary-600 hover:text-primary-700 font-medium"
                            >
                                Clear all
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimpleDriverNotifications; 