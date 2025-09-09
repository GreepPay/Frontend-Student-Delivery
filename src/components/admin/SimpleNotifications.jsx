import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import socketService from '../../services/socketService';
import soundService from '../../services/soundService';
import apiService from '../../services/api';
import notificationManager from '../../services/notificationManager';
import { BellIcon, XMarkIcon, EyeIcon, ClockIcon, UserIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useToast } from '../common/ToastProvider';
import Modal from '../common/Modal';
import Button from '../common/Button';

const SimpleNotifications = () => {
    //console.log('🔔 SimpleNotifications: Component is being rendered');
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [selectedEmergency, setSelectedEmergency] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [selectedNotification, setSelectedNotification] = useState(null);
    const dropdownRef = useRef(null);

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

    useEffect(() => {
        if (!user) return;

        //console.log('🔌 SimpleNotifications: Setting up socket event listeners for user:', user._id || user.id);

        // Load existing notifications from API
        const loadExistingNotifications = async () => {
            try {
                const response = await apiService.getAdminNotifications({ limit: 10 });
                console.log('📋 Loading existing notifications:', response);
                if (response && response.success && response.data?.notifications) {
                    // Filter out driver messages from API response
                    const filteredNotifications = response.data.notifications.filter(notification => {
                        return !(
                            notification.type === 'driver-message' ||
                            notification.type === 'message' ||
                            notification.senderType === 'driver' ||
                            notification.message?.includes('Message from') ||
                            notification.title?.includes('Message from') ||
                            notification.message?.includes('💬') ||
                            notification.message?.toLowerCase().includes('how low can you go') ||
                            notification.message?.toLowerCase().includes('are you sur') ||
                            notification.message?.toLowerCase().includes('hello') ||
                            notification.message?.toLowerCase().includes('hey') ||
                            notification.message?.toLowerCase().includes('test message')
                        );
                    });

                    const existingNotifications = filteredNotifications.map(notification => {
                        // Handle invalid or missing createdAt
                        let timestamp;
                        try {
                            console.log('📅 Processing notification timestamp:', {
                                id: notification._id,
                                createdAt: notification.createdAt,
                                type: typeof notification.createdAt
                            });

                            timestamp = notification.createdAt ? new Date(notification.createdAt) : new Date();
                            // Validate the date
                            if (isNaN(timestamp.getTime())) {
                                console.warn('⚠️ Invalid createdAt date for notification:', notification.createdAt);
                                timestamp = new Date();
                            }
                        } catch (error) {
                            console.warn('⚠️ Error parsing createdAt date:', error);
                            timestamp = new Date();
                        }

                        return {
                            id: notification._id,
                            message: notification.title || notification.message,
                            timestamp: timestamp,
                            type: notification.type,
                            priority: notification.priority || 'medium',
                            isRead: notification.isRead,
                            sender: notification.sender || notification.senderName || notification.from || null,
                            emergencyData: notification.emergencyData || null
                        };
                    });
                    setNotifications(existingNotifications);
                }
            } catch (error) {
                console.error('Error loading existing notifications:', error);
            }
        };

        loadExistingNotifications();

        // Connect to socket
        if (!socketService.isConnected()) {
            //  console.log('🔌 SimpleNotifications: Connecting to socket...');
            socketService.connect(user._id || user.id, user.userType);
        } else {
            //console.log('🔌 SimpleNotifications: Socket already connected');
        }

        // Register this component with the notification manager
        const componentName = 'AdminSimpleNotifications';

        // Listen for notifications - OPTIMIZED FOR IMMEDIATE RESPONSE
        socketService.on('receive_notification', (data) => {
            const notification = notificationManager.processNotification(data, componentName);
            if (notification) {
                addNotification(notification);
            }
        });

        socketService.on('driver-status-changed', (data) => {
            const notification = notificationManager.processNotification({
                ...data,
                message: `Driver ${data.name || 'Unknown'} is now ${data.isOnline ? 'online' : 'offline'}`,
                type: 'driver-status'
            }, componentName);
            if (notification) {
                addNotification(notification);
            }
        });

        socketService.on('delivery-status-changed', (data) => {
            const notification = notificationManager.processNotification({
                ...data,
                message: `Delivery ${data.deliveryCode} status changed to ${data.status}`,
                type: 'delivery-status'
            }, componentName);
            if (notification) {
                addNotification(notification);
            }
        });

        //console.log('🔌 SimpleNotifications: Setting up emergency-alert listener');
        socketService.on('emergency-alert', (data) => {
            const emergencyMessage = `🚨 EMERGENCY from ${data.driverName || 'Unknown Driver'} (${data.driverArea || 'Unknown Area'}): ${data.message}`;

            const notification = notificationManager.processNotification({
                ...data,
                message: emergencyMessage,
                type: 'emergency',
                priority: 'high',
                emergencyData: {
                    driverId: data.driverId,
                    driverName: data.driverName,
                    driverPhone: data.driverPhone,
                    driverEmail: data.driverEmail,
                    driverArea: data.driverArea,
                    message: data.message,
                    contactInfo: data.contactInfo,
                    responseInstructions: data.responseInstructions,
                    socketId: data.socketId
                }
            }, componentName);

            if (notification) {
                addNotification(notification);
            }
        });

        // Listen for new notification events from API - IMPROVED FOR IMMEDIATE RESPONSE
        socketService.on('new-notification', (data) => {
            const notification = notificationManager.processNotification({
                ...data,
                message: data.message || data.title || 'New notification received'
            }, componentName);
            if (notification) {
                addNotification(notification);
            }
        });

        // Driver messages are handled by MultiDriverMessaging component only
        // No notifications in admin bell for driver messages - they appear in Driver Conversations modal

        // Listen for new messages (general)
        socketService.on('new-message', (data) => {
            const notification = notificationManager.processNotification({
                ...data,
                message: `💬 Message from ${data.senderType || 'User'}: ${data.message}`,
                type: 'message',
                sender: data.senderType || 'User'
            }, componentName);
            if (notification) {
                addNotification(notification);
            }
        });

        // Listen for admin notifications (general)
        socketService.on('admin-notification', (data) => {
            const notification = notificationManager.processNotification({
                ...data,
                message: data.message || 'New notification'
            }, componentName);
            if (notification) {
                addNotification(notification);
            }
        });

        // Listen for system notifications
        socketService.on('system-notification', (data) => {
            const notification = notificationManager.processNotification({
                ...data,
                message: data.message || 'System notification',
                type: 'system'
            }, componentName);
            if (notification) {
                addNotification(notification);
            }
        });

        // Listen for any notification event (catch-all)
        socketService.on('notification', (data) => {
            const notification = notificationManager.processNotification({
                ...data,
                message: data.message || 'New notification'
            }, componentName);
            if (notification) {
                addNotification(notification);
            }
        });

        // Check connection status periodically
        const checkConnection = () => {
            setIsConnected(socketService.isConnected());
        };
        checkConnection();
        const interval = setInterval(checkConnection, 30000); // Reduced from 5s to 30s

        return () => {
            clearInterval(interval);
            socketService.off('receive_notification');
            socketService.off('driver-status-changed');
            socketService.off('delivery-status-changed');
            socketService.off('emergency-alert');
            socketService.off('new-notification');
            socketService.off('driver-message');
            socketService.off('new-message');
            socketService.off('admin-notification');
            socketService.off('system-notification');
            socketService.off('notification');
        };
    }, [user]);

    const addNotification = (notification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep only last 10

        // Show snackbar notification for important alerts
        if (notification.type === 'emergency' || notification.priority === 'high') {
            showError(notification.message, 5000);
        } else {
            // Show regular snackbar for other notifications
            showSuccess(notification.message, 3000);
        }

        // Add visual feedback - briefly highlight the bell
        const bell = document.querySelector('.notification-bell');
        if (bell) {
            bell.classList.add('notification-pulse');
            setTimeout(() => {
                bell.classList.remove('notification-pulse');
            }, 1000);
        }
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const markAsRead = async (notificationId) => {
        try {
            const response = await apiService.markAdminNotificationAsRead(notificationId);

            // Update local state regardless of API response
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );

            // Log success
            //console.log('✅ Notification marked as read:', notificationId);
        } catch (error) {
            console.error('Error marking notification as read:', error);
            // Still update local state for better UX
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await apiService.markAllAdminNotificationsAsRead();

            // Update local state regardless of API response
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true }))
            );

            showSuccess('All notifications marked as read');
            //console.log('✅ All notifications marked as read');
        } catch (error) {
            //console.error('Error marking all notifications as read:', error);
            // Still update local state for better UX
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true }))
            );
            showSuccess('All notifications marked as read');
        }
    };

    const formatTimeAgo = (timestamp) => {
        // Handle invalid or missing timestamp
        if (!timestamp || !(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
            console.warn('⚠️ Invalid timestamp provided to formatTimeAgo:', timestamp);
            return 'Recently';
        }

        const now = new Date();
        const diffInSeconds = Math.floor((now - timestamp) / 1000);

        // Handle negative time differences (future dates)
        if (diffInSeconds < 0) {
            return 'Just now';
        }

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return timestamp.toLocaleDateString();
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'emergency-alert':
            case 'emergency':
                return '🚨';
            case 'delivery':
            case 'delivery-status-changed':
                return '📦';
            case 'driver':
            case 'driver-status-changed':
            case 'new_driver_registered':
                return '👤';
            case 'system':
                return '⚙️';
            case 'payment':
                return '💰';
            default:
                return '🔔';
        }
    };

    const getNotificationColor = (type, priority) => {
        if (type === 'emergency' || type === 'emergency-alert' || priority === 'high') {
            return 'text-red-600';
        }
        if (type === 'delivery') {
            return 'text-green-600';
        }
        if (type === 'driver') {
            return 'text-green-600';
        }
        return 'text-gray-600';
    };

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        setSelectedNotification(notification);
    };

    const handleViewAllNotifications = () => {
        setShowDropdown(false);
        navigate('/admin/notifications');
    };





    return (
        <>
            <div className="relative">
                {/* Notification Bell */}
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="notification-bell relative p-2 text-gray-600 hover:text-green-600 transition-all duration-200 hover:bg-green-50 rounded-lg"
                >
                    <BellIcon className="h-6 w-6" />
                    {notifications.filter(n => !n.isRead).length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                            {notifications.filter(n => !n.isRead).length > 99 ? '99+' : notifications.filter(n => !n.isRead).length}
                        </span>
                    )}
                    {!isConnected && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                    )}
                </button>

                {/* Dropdown - Responsive */}
                {showDropdown && (
                    <div ref={dropdownRef} className="absolute right-0 mt-2 w-80 sm:w-72 bg-white rounded-lg shadow-xl border z-50 max-h-[80vh] sm:max-h-96">
                        <div className="p-4 sm:p-3 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 text-base sm:text-sm">Notifications</h3>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={handleViewAllNotifications}
                                        className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center"
                                    >
                                        <EyeIcon className="h-3 w-3 mr-1" />
                                        <span className="hidden sm:inline">View All</span>
                                        <span className="sm:hidden">All</span>
                                    </button>
                                    {notifications.filter(n => !n.isRead).length > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-green-600 hover:text-green-700 font-medium"
                                        >
                                            <span className="hidden sm:inline">Mark all read</span>
                                            <span className="sm:hidden">Read all</span>
                                        </button>
                                    )}

                                    <button onClick={() => setShowDropdown(false)}>
                                        <XMarkIcon className="h-5 w-5 sm:h-4 sm:w-4 text-gray-400 hover:text-gray-600" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                <span className="text-xs text-gray-500">
                                    {isConnected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>
                        </div>

                        <div className="max-h-64 sm:max-h-56 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                    No notifications
                                </div>
                            ) : (
                                notifications.map((notification) => {
                                    return (
                                        <div
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`p-3 sm:p-2 border-b last:border-b-0 cursor-pointer transition-colors ${notification.priority === 'high' ? 'bg-red-50' :
                                                !notification.isRead ? 'bg-green-50' : 'bg-gray-50'
                                                } ${!notification.isRead ? 'hover:bg-green-100' : 'hover:bg-gray-100'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-start space-x-3 sm:space-x-2">
                                                        {!notification.isRead && (
                                                            <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <span className="text-lg sm:text-base">{getNotificationIcon(notification.type)}</span>
                                                                <p className={`text-sm sm:text-xs font-medium ${getNotificationColor(notification.type, notification.priority)} line-clamp-2`}>
                                                                    {notification.message}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                                                                <span className="text-xs text-gray-500 flex items-center">
                                                                    <ClockIcon className="h-3 w-3 mr-1" />
                                                                    {formatTimeAgo(notification.timestamp)}
                                                                </span>
                                                                {notification.sender && (
                                                                    <span className="text-xs text-gray-500 flex items-center">
                                                                        <UserIcon className="h-3 w-3 mr-1" />
                                                                        <span className="truncate">{notification.sender}</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Enhanced Emergency Alert Information - Responsive */}
                                                    {(() => {
                                                        if (notification.type === 'emergency' && notification.emergencyData) {
                                                            return (
                                                                <div className="mt-2 p-2 bg-red-100 rounded border border-red-200">
                                                                    <div className="text-xs space-y-1">
                                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                                                                            <span className="font-medium text-red-800">Driver:</span>
                                                                            <span className="text-red-700 truncate">{notification.emergencyData.driverName}</span>
                                                                        </div>
                                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                                                                            <span className="font-medium text-red-800">Phone:</span>
                                                                            <span className="text-red-700 truncate">{notification.emergencyData.driverPhone}</span>
                                                                        </div>
                                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                                                                            <span className="font-medium text-red-800">Email:</span>
                                                                            <span className="text-red-700 truncate">{notification.emergencyData.driverEmail}</span>
                                                                        </div>
                                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                                                                            <span className="font-medium text-red-800">Area:</span>
                                                                            <span className="text-red-700 truncate">{notification.emergencyData.driverArea}</span>
                                                                        </div>
                                                                        <div className="mt-2 pt-2 border-t border-red-200">
                                                                            <p className="text-xs font-medium text-red-800 mb-1">Quick Actions:</p>
                                                                            <div className="flex flex-wrap gap-1">
                                                                                <button
                                                                                    onClick={() => window.open(`tel:${notification.emergencyData.driverPhone}`, '_blank')}
                                                                                    className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                                                                                    disabled={!notification.emergencyData.driverPhone || notification.emergencyData.driverPhone === 'No phone available'}
                                                                                >
                                                                                    📞 Call
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => window.open(`mailto:${notification.emergencyData.driverEmail}`, '_blank')}
                                                                                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                                                                    disabled={!notification.emergencyData.driverEmail || notification.emergencyData.driverEmail === 'No email available'}
                                                                                >
                                                                                    📧 Email
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setSelectedEmergency(notification.emergencyData);
                                                                                        setReplyMessage('');
                                                                                        setShowReplyModal(true);
                                                                                    }}
                                                                                    className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                                                                                >
                                                                                    💬 Reply
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                                <button
                                                    onClick={() => removeNotification(notification.id)}
                                                    className="text-gray-400 hover:text-gray-600 ml-2"
                                                >
                                                    <XMarkIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Notification Detail Modal */}
            <Modal
                isOpen={!!selectedNotification}
                onClose={() => setSelectedNotification(null)}
                title={
                    <div className="flex items-center">
                        <span className="text-2xl mr-3">{getNotificationIcon(selectedNotification?.type)}</span>
                        Notification Details
                    </div>
                }
                size="md"
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-gray-900 leading-relaxed">
                                {selectedNotification?.message}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <span className="text-gray-900 capitalize">
                                    {selectedNotification?.type ? selectedNotification.type.replace(/_/g, ' ') : 'General'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedNotification?.priority === 'high'
                                    ? 'bg-red-100 text-red-800'
                                    : selectedNotification?.priority === 'medium'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                    {selectedNotification?.priority || 'Medium'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex items-center text-gray-900">
                                <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                                {selectedNotification?.timestamp.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {selectedNotification?.sender && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sender</label>
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <div className="flex items-center text-gray-900">
                                    <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                                    {selectedNotification.sender}
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedNotification?.emergencyData && (
                        <div className="border-t border-gray-200 pt-6">
                            <h4 className="font-medium text-red-800 mb-4 flex items-center">
                                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                                Emergency Contact Information
                            </h4>
                            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-medium">Driver:</span>
                                        <span className="font-semibold text-gray-900">{selectedNotification.emergencyData.driverName}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-medium">Phone:</span>
                                        <span className="font-semibold text-gray-900">{selectedNotification.emergencyData.driverPhone}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-medium">Email:</span>
                                        <span className="font-semibold text-gray-900">{selectedNotification.emergencyData.driverEmail}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-medium">Area:</span>
                                        <span className="font-semibold text-gray-900">{selectedNotification.emergencyData.driverArea}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                        <Button
                            onClick={() => {
                                setSelectedNotification(null);
                                navigate('/admin/notifications');
                            }}
                            variant="primary"
                            fullWidth
                        >
                            View All Notifications
                        </Button>
                        <Button
                            onClick={() => setSelectedNotification(null)}
                            variant="secondary"
                            fullWidth
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Emergency Reply Modal */}
            <Modal
                isOpen={showReplyModal && !!selectedEmergency}
                onClose={() => setShowReplyModal(false)}
                title="Reply to Emergency Alert"
                size="md"
            >
                <div className="space-y-6">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="space-y-2">
                            <p className="text-sm text-red-800">
                                <span className="font-semibold">Driver:</span> {selectedEmergency?.driverName}
                            </p>
                            <p className="text-sm text-red-700">
                                <span className="font-semibold">Message:</span> {selectedEmergency?.message}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Reply:
                        </label>
                        <textarea
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder="Enter your reply to the driver..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                            rows={4}
                            required
                        />
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <Button
                            onClick={() => setShowReplyModal(false)}
                            variant="secondary"
                            fullWidth
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (replyMessage.trim()) {
                                    console.log('📞 Sending emergency reply:', {
                                        driverId: selectedEmergency?.driverId,
                                        message: replyMessage,
                                        adminName: user?.name || 'Admin'
                                    });

                                    socketService.emit('admin-emergency-reply', {
                                        driverId: selectedEmergency?.driverId,
                                        message: replyMessage,
                                        adminName: user?.name || 'Admin'
                                    });

                                    setShowReplyModal(false);
                                    setReplyMessage('');
                                    setSelectedEmergency(null);
                                }
                            }}
                            disabled={!replyMessage.trim()}
                            variant="primary"
                            fullWidth
                        >
                            Send Reply
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default SimpleNotifications; 