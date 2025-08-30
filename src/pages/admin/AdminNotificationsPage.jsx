import React, { useState, useEffect } from 'react';
import {
    BellIcon,
    CheckIcon,
    XMarkIcon,
    InformationCircleIcon,
    ClockIcon,
    UserGroupIcon,
    TruckIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import apiService from '../../services/api';
import socketService from '../../services/socketService';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

const AdminNotificationsPage = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, read, system, admin, driver
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Load notifications from API
    const loadNotifications = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            console.log('🔔 AdminNotificationsPage: Loading notifications with filter:', filter);

            // Check if user is authenticated
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('🔔 AdminNotificationsPage: No authentication token found');
                if (!silent) {
                    toast.error('Authentication required. Please log in again.');
                }
                setNotifications([]);
                return;
            }

            // Use the correct admin notifications API
            const response = await apiService.getAdminNotifications({ filter });
            console.log('🔔 AdminNotificationsPage: Notifications API response:', response);

            if (response && response.success) {
                // The backend returns { data: { notifications: [...] } }
                const notificationsData = response.data?.notifications || response.data || response.notifications || [];
                const notificationsArray = Array.isArray(notificationsData) ? notificationsData : [];
                console.log('🔔 AdminNotificationsPage: Setting notifications array:', notificationsArray);

                // Debug: Log the notification data to see what we're getting
                notificationsArray.forEach((notification, index) => {
                    console.log(`📅 Notification ${index + 1}:`, {
                        id: notification._id,
                        idType: typeof notification._id,
                        idLength: notification._id ? notification._id.length : 0,
                        createdAt: notification.createdAt,
                        type: typeof notification.createdAt,
                        isValid: notification.createdAt ? !isNaN(new Date(notification.createdAt).getTime()) : false,
                        fullNotification: notification
                    });
                });

                setNotifications(notificationsArray);
            } else {
                console.warn('🔔 AdminNotificationsPage: Backend returned unsuccessful response:', response);
                setNotifications([]);
            }
        } catch (error) {
            console.error('❌ AdminNotificationsPage: Error loading notifications:', error);
            console.error('❌ AdminNotificationsPage: Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });

            // Show user-friendly error message only for non-silent loads
            if (!silent) {
                if (error.response?.status === 400) {
                    toast.error('Notifications failed: Invalid filter parameter.');
                } else if (error.response?.status === 401) {
                    toast.error('Notifications failed: Authentication required.');
                } else if (error.response?.status === 403) {
                    toast.error('Notifications failed: Permission denied.');
                } else if (error.response?.status === 404) {
                    toast.error('Notifications failed: Notifications endpoint not found.');
                } else if (error.response?.status === 500) {
                    toast.error('Notifications failed: Server error. Please try again later.');
                } else {
                    toast.error('Failed to load notifications');
                }
            }

            // Always ensure we set an empty array on error
            console.log('🔔 AdminNotificationsPage: Setting empty array due to error');
            setNotifications([]);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Initial load and filter changes
    useEffect(() => {
        loadNotifications();
    }, [filter]);

    // WebSocket setup for real-time notifications
    useEffect(() => {
        if (!user) return;

        console.log('🔌 AdminNotificationsPage: Setting up WebSocket for real-time notifications');

        // Connect to socket if not already connected
        if (!socketService.isConnected()) {
            socketService.connect(user._id || user.id, user.userType || user.role);
        }

        // Listen for new notifications from WebSocket
        socketService.on('new-notification', (notification) => {
            console.log('🔔 AdminNotificationsPage: Received new notification via WebSocket:', notification);

            // Add new notification to the top of the list
            const newNotification = {
                _id: notification._id || Date.now().toString(),
                title: notification.title || notification.message || 'New Notification',
                message: notification.message || notification.title || 'You have a new notification',
                type: notification.type || 'notification',
                priority: notification.priority || 'medium',
                isRead: false,
                createdAt: notification.createdAt || new Date().toISOString(),
                sender: notification.sender || notification.senderName || null,
                emergencyData: notification.emergencyData || null
            };

            setNotifications(prev => [newNotification, ...prev]);
        });

        // Listen for notification updates (mark as read, etc.)
        socketService.on('notification-updated', (data) => {
            console.log('🔔 AdminNotificationsPage: Notification updated via WebSocket:', data);

            setNotifications(prev =>
                prev.map(notification =>
                    notification._id === data._id
                        ? { ...notification, ...data }
                        : notification
                )
            );
        });

        // Listen for notification deletions
        socketService.on('notification-deleted', (notificationId) => {
            console.log('🔔 AdminNotificationsPage: Notification deleted via WebSocket:', notificationId);

            setNotifications(prev =>
                prev.filter(notification => notification._id !== notificationId)
            );
        });

        // Listen for driver status changes
        socketService.on('driver-status-changed', (data) => {
            console.log('🔔 AdminNotificationsPage: Driver status changed via WebSocket:', data);

            const statusNotification = {
                _id: Date.now().toString(),
                title: 'Driver Status Update',
                message: `${data.name || 'Unknown driver'} is now ${data.isOnline ? 'online' : 'offline'}`,
                type: 'driver_status',
                priority: 'medium',
                isRead: false,
                createdAt: new Date().toISOString(),
                sender: data.name || 'System'
            };

            setNotifications(prev => [statusNotification, ...prev]);
        });

        // Listen for delivery status changes
        socketService.on('delivery-status-changed', (data) => {
            console.log('🔔 AdminNotificationsPage: Delivery status changed via WebSocket:', data);

            const deliveryNotification = {
                _id: Date.now().toString(),
                title: 'Delivery Status Update',
                message: `Delivery ${data.deliveryCode || 'Unknown'} status changed to ${data.status}`,
                type: 'delivery_status',
                priority: 'medium',
                isRead: false,
                createdAt: new Date().toISOString(),
                sender: 'System'
            };

            setNotifications(prev => [deliveryNotification, ...prev]);
        });

        // Listen for emergency alerts
        socketService.on('emergency-alert', (data) => {
            console.log('🔔 AdminNotificationsPage: Emergency alert via WebSocket:', data);

            const emergencyNotification = {
                _id: Date.now().toString(),
                title: '🚨 Emergency Alert',
                message: `Emergency from driver: ${data.message}`,
                type: 'emergency',
                priority: 'high',
                isRead: false,
                createdAt: new Date().toISOString(),
                sender: data.driverName || 'Driver',
                emergencyData: data
            };

            setNotifications(prev => [emergencyNotification, ...prev]);
        });

        return () => {
            // Clean up WebSocket listeners
            socketService.off('new-notification');
            socketService.off('notification-updated');
            socketService.off('notification-deleted');
            socketService.off('driver-status-changed');
            socketService.off('delivery-status-changed');
            socketService.off('emergency-alert');
        };
    }, [user]);

    const markAsRead = async (notificationId) => {
        try {
            console.log('🔔 AdminNotificationsPage: Marking notification as read:', notificationId);

            // Validate notification ID
            if (!notificationId) {
                console.error('❌ AdminNotificationsPage: No notification ID provided');
                toast.error('Invalid notification ID');
                return;
            }

            // Clean the notification ID - remove any suffixes or invalid characters
            let cleanId = notificationId;
            if (typeof notificationId === 'string') {
                // Extract only the MongoDB ObjectId part (24 hex characters)
                const objectIdMatch = notificationId.match(/^[a-fA-F0-9]{24}/);
                if (objectIdMatch) {
                    cleanId = objectIdMatch[0];
                    console.log('🔔 AdminNotificationsPage: Cleaned notification ID for mark as read:', cleanId);
                } else {
                    console.error('❌ AdminNotificationsPage: Invalid notification ID format:', notificationId);
                    toast.error('Invalid notification ID format');
                    return;
                }
            }

            const response = await apiService.markAdminNotificationAsRead(cleanId);
            console.log('✅ AdminNotificationsPage: Notification marked as read:', response);

            if (response && response.success) {
                setNotifications(prev => {
                    const prevArray = Array.isArray(prev) ? prev : [];
                    return prevArray.map(notification =>
                        notification._id === notificationId
                            ? { ...notification, isRead: true }
                            : notification
                    );
                });
                toast.success('Notification marked as read');
            } else {
                toast.error('Failed to mark notification as read');
            }
        } catch (error) {
            console.error('❌ AdminNotificationsPage: Error marking notification as read:', error);
            toast.error('Failed to mark notification as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            console.log('🔔 AdminNotificationsPage: Marking all notifications as read');

            const response = await apiService.markAllAdminNotificationsAsRead();
            console.log('✅ AdminNotificationsPage: All notifications marked as read:', response);

            if (response && response.success) {
                setNotifications(prev => {
                    const prevArray = Array.isArray(prev) ? prev : [];
                    return prevArray.map(notification => ({ ...notification, isRead: true }));
                });
                toast.success('All notifications marked as read');
            } else {
                toast.error('Failed to mark all notifications as read');
            }
        } catch (error) {
            console.error('❌ AdminNotificationsPage: Error marking all notifications as read:', error);
            toast.error('Failed to mark all notifications as read');
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            console.log('🔔 AdminNotificationsPage: Deleting notification:', notificationId);

            // Validate notification ID
            if (!notificationId) {
                console.error('❌ AdminNotificationsPage: No notification ID provided');
                toast.error('Invalid notification ID');
                return;
            }

            // Clean the notification ID - remove any suffixes or invalid characters
            let cleanId = notificationId;
            if (typeof notificationId === 'string') {
                // Extract only the MongoDB ObjectId part (24 hex characters)
                const objectIdMatch = notificationId.match(/^[a-fA-F0-9]{24}/);
                if (objectIdMatch) {
                    cleanId = objectIdMatch[0];
                    console.log('🔔 AdminNotificationsPage: Cleaned notification ID:', cleanId);
                } else {
                    console.error('❌ AdminNotificationsPage: Invalid notification ID format:', notificationId);
                    toast.error('Invalid notification ID format');
                    return;
                }
            }

            const response = await apiService.deleteAdminNotification(cleanId);
            console.log('✅ AdminNotificationsPage: Notification deleted:', response);

            if (response && response.success) {
                setNotifications(prev => {
                    const prevArray = Array.isArray(prev) ? prev : [];
                    return prevArray.filter(notification => notification._id !== notificationId);
                });
                toast.success('Notification deleted');
            } else {
                toast.error('Failed to delete notification');
            }
        } catch (error) {
            console.error('❌ AdminNotificationsPage: Error deleting notification:', error);
            toast.error('Failed to delete notification');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'text-red-600 bg-red-50';
            case 'medium':
                return 'text-yellow-600 bg-yellow-50';
            case 'low':
                return 'text-green-600 bg-green-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'driver_active':
                return <UserGroupIcon className="w-4 h-4" />;
            case 'system_alert':
                return <InformationCircleIcon className="w-4 h-4" />;
            case 'analytics':
                return <ChartBarIcon className="w-4 h-4" />;
            case 'payment':
                return <CurrencyDollarIcon className="w-4 h-4" />;
            case 'document_verification':
                return <DocumentTextIcon className="w-4 h-4" />;
            case 'delivery':
                return <TruckIcon className="w-4 h-4" />;
            default:
                return <BellIcon className="w-4 h-4" />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'driver_active':
                return 'bg-blue-50 border-blue-200';
            case 'system_alert':
                return 'bg-gray-50 border-gray-200';
            case 'analytics':
                return 'bg-purple-50 border-purple-200';
            case 'payment':
                return 'bg-green-50 border-green-200';
            case 'document_verification':
                return 'bg-orange-50 border-orange-200';
            case 'delivery':
                return 'bg-indigo-50 border-indigo-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    const formatTime = (date) => {
        // Debug: Log what we're receiving
        console.log('🔍 formatTime called with:', {
            date: date,
            type: typeof date,
            isDate: date instanceof Date,
            isValid: date ? !isNaN(new Date(date).getTime()) : false
        });

        // Handle invalid or missing date
        if (!date) {
            console.warn('⚠️ No date provided to formatTime');
            return 'Recently';
        }

        // Convert to Date object if it's a string
        let dateObj;
        try {
            dateObj = date instanceof Date ? date : new Date(date);

            // Validate the date
            if (isNaN(dateObj.getTime())) {
                console.warn('⚠️ Invalid date provided to formatTime:', date);
                return 'Recently';
            }
        } catch (error) {
            console.warn('⚠️ Error parsing date in formatTime:', error);
            return 'Recently';
        }

        const now = new Date();
        const diff = now - dateObj;

        // Handle negative time differences (future dates)
        if (diff < 0) {
            return 'Just now';
        }

        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (hours < 24) {
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        }
    };

    // Ensure notifications is always an array
    const notificationsArray = Array.isArray(notifications) ? notifications : [];

    const filteredNotifications = notificationsArray.filter(notification => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !notification.isRead;
        if (filter === 'read') return notification.isRead;
        return notification.type === filter;
    });

    const unreadCount = notificationsArray.filter(n => !n.isRead).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
                        <div className="space-y-3">
                            {[...Array(5)].map((_, index) => (
                                <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header - Responsive */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <BellIcon className="w-5 h-5 sm:w-4 sm:h-4 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-xl lg:text-2xl font-bold text-gray-900">Admin Notifications</h1>
                            <p className="text-sm text-gray-600 mt-1">Manage system notifications and alerts</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="px-4 py-2 sm:px-3 sm:py-1.5 bg-green-600 text-white text-sm sm:text-xs rounded hover:bg-green-700 flex items-center space-x-1"
                            >
                                <CheckIcon className="w-4 h-4 sm:w-3 sm:h-3" />
                                <span>Mark all as read</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters - Responsive */}
                <div className="mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                        <span className="text-sm sm:text-xs font-medium text-gray-700">Filter:</span>
                        <div className="flex flex-wrap gap-2">
                            {['all', 'unread', 'read', 'driver_active', 'system_alert', 'analytics', 'payment'].map((filterOption) => (
                                <button
                                    key={filterOption}
                                    onClick={() => setFilter(filterOption)}
                                    className={`px-3 py-2 sm:px-2 sm:py-1 rounded text-sm sm:text-xs font-medium transition-colors ${filter === filterOption
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {filterOption.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Notifications List - Responsive */}
                <div className="space-y-3">
                    {filteredNotifications.length === 0 ? (
                        <div className="text-center py-8">
                            <BellIcon className="w-12 h-12 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-4 sm:mb-2" />
                            <p className="text-lg sm:text-sm font-medium text-gray-900 mb-2 sm:mb-1">No notifications</p>
                            <p className="text-sm sm:text-xs text-gray-500">No notifications match the current filter.</p>
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`bg-white rounded-lg border p-4 sm:p-3 transition-colors ${notification.isRead ? 'border-gray-200' : 'border-green-200 bg-green-50'
                                    }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                                    <div className="flex items-start space-x-3 flex-1">
                                        {/* Icon */}
                                        <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                                            {getTypeIcon(notification.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-1">
                                                <h3 className="text-base sm:text-sm font-medium text-gray-900 truncate">
                                                    {notification.title}
                                                </h3>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                                                    {notification.priority}
                                                </span>
                                                {!notification.isRead && (
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                )}
                                            </div>
                                            <p className="text-sm sm:text-xs text-gray-600 mb-3 sm:mb-2 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center space-x-4 text-sm sm:text-xs text-gray-500">
                                                <span className="flex items-center space-x-1">
                                                    <ClockIcon className="w-4 h-4 sm:w-3 sm:h-3" />
                                                    <span>{formatTime(notification.createdAt || notification.timestamp || notification.date)}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions - Responsive */}
                                    <div className="flex items-center justify-end space-x-2 sm:space-x-1 sm:ml-4">
                                        {!notification.isRead && (
                                            <button
                                                onClick={() => markAsRead(notification._id)}
                                                className="px-3 py-2 sm:p-1 text-green-600 hover:text-green-900 rounded hover:bg-green-50 flex items-center space-x-1 sm:space-x-0"
                                                title="Mark as read"
                                            >
                                                <CheckIcon className="w-4 h-4 sm:w-3 sm:h-3" />
                                                <span className="sm:hidden text-sm">Mark as read</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setSelectedNotification(notification);
                                                setShowDetailsModal(true);
                                            }}
                                            className="px-3 py-2 sm:p-1 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50 flex items-center space-x-1 sm:space-x-0"
                                            title="View details"
                                        >
                                            <InformationCircleIcon className="w-4 h-4 sm:w-3 sm:h-3" />
                                            <span className="sm:hidden text-sm">View details</span>
                                        </button>
                                        <button
                                            onClick={() => deleteNotification(notification._id)}
                                            className="px-3 py-2 sm:p-1 text-red-600 hover:text-red-900 rounded hover:bg-red-50 flex items-center space-x-1 sm:space-x-0"
                                            title="Delete notification"
                                        >
                                            <XMarkIcon className="w-4 h-4 sm:w-3 sm:h-3" />
                                            <span className="sm:hidden text-sm">Delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Details Modal - Responsive */}
            <Modal
                isOpen={showDetailsModal && !!selectedNotification}
                onClose={() => setShowDetailsModal(false)}
                title="Notification Details"
                size="md"
            >
                <div className="space-y-6">
                    <div>
                        <h4 className="text-lg sm:text-base font-semibold text-gray-900 mb-3 sm:mb-2">{selectedNotification?.title}</h4>
                        <div className="bg-gray-50 p-4 sm:p-3 rounded-lg border border-gray-200">
                            <p className="text-gray-700 leading-relaxed text-sm sm:text-xs">{selectedNotification?.message}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                        <div>
                            <label className="block text-sm sm:text-xs font-medium text-gray-700 mb-2 sm:mb-1">Type</label>
                            <div className="bg-white p-3 sm:p-2 rounded-lg border border-gray-200">
                                <span className="text-gray-900 capitalize text-sm sm:text-xs">{selectedNotification?.type}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm sm:text-xs font-medium text-gray-700 mb-2 sm:mb-1">Priority</label>
                            <div className="bg-white p-3 sm:p-2 rounded-lg border border-gray-200">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedNotification?.priority === 'high'
                                    ? 'bg-red-100 text-red-800'
                                    : selectedNotification?.priority === 'medium'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                    {selectedNotification?.priority}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm sm:text-xs font-medium text-gray-700 mb-2 sm:mb-1">Created</label>
                        <div className="bg-white p-3 sm:p-2 rounded-lg border border-gray-200">
                            <div className="flex items-center text-gray-900">
                                <ClockIcon className="h-4 w-4 sm:h-3 sm:w-3 mr-2 text-gray-500" />
                                <span className="text-sm sm:text-xs">
                                    {(() => {
                                        try {
                                            const date = selectedNotification?.createdAt;
                                            if (!date) return 'Unknown';
                                            const dateObj = date instanceof Date ? date : new Date(date);
                                            if (isNaN(dateObj.getTime())) return 'Invalid Date';
                                            return dateObj.toLocaleString();
                                        } catch (error) {
                                            console.warn('⚠️ Error formatting date in modal:', error);
                                            return 'Invalid Date';
                                        }
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {selectedNotification?.metadata && (
                        <div>
                            <label className="block text-sm sm:text-xs font-medium text-gray-700 mb-2 sm:mb-1">Metadata</label>
                            <div className="bg-gray-50 p-4 sm:p-3 rounded-lg border border-gray-200">
                                <pre className="text-sm sm:text-xs text-gray-700 overflow-auto whitespace-pre-wrap max-h-32 sm:max-h-24">
                                    {JSON.stringify(selectedNotification.metadata, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    <div className="flex space-x-3 pt-4 sm:pt-3">
                        <Button
                            onClick={() => setShowDetailsModal(false)}
                            variant="secondary"
                            fullWidth
                            className="px-4 py-2 sm:px-3 sm:py-2 text-sm sm:text-xs"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminNotificationsPage;
