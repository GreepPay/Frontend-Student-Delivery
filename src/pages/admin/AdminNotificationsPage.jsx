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

const AdminNotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, read, system, admin, driver
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Load notifications from API
    useEffect(() => {
        const loadNotifications = async () => {
            setLoading(true);
            try {
                console.log('🔔 AdminNotificationsPage: Loading notifications with filter:', filter);

                // Use the correct admin notifications API
                const response = await apiService.getAdminNotifications({ filter });
                console.log('🔔 AdminNotificationsPage: Notifications API response:', response);

                if (response && response.success) {
                    // The backend returns { data: { notifications: [...] } }
                    const notificationsData = response.data?.notifications || response.data || response.notifications || [];
                    const notificationsArray = Array.isArray(notificationsData) ? notificationsData : [];
                    console.log('🔔 AdminNotificationsPage: Setting notifications array:', notificationsArray);
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

                // Show user-friendly error message
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

                // Always ensure we set an empty array on error
                console.log('🔔 AdminNotificationsPage: Setting empty array due to error');
                setNotifications([]);
            } finally {
                setLoading(false);
            }
        };

        loadNotifications();
    }, [filter]);

    const markAsRead = async (notificationId) => {
        try {
            console.log('🔔 AdminNotificationsPage: Marking notification as read:', notificationId);

            const response = await apiService.markAdminNotificationAsRead(notificationId);
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

            const response = await apiService.deleteAdminNotification(notificationId);
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
            case 'driver_registration':
                return <UserGroupIcon className="w-4 h-4" />;
            case 'system':
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
            case 'driver_registration':
                return 'bg-blue-50 border-blue-200';
            case 'system':
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
        const now = new Date();
        const diff = now - date;
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
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <BellIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Notifications</h1>
                            <p className="text-sm text-gray-600 mt-1">Manage system notifications and alerts</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center space-x-1"
                            >
                                <CheckIcon className="w-3 h-3" />
                                <span>Mark all as read</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-4">
                    <div className="flex items-center space-x-3">
                        <span className="text-xs font-medium text-gray-700">Filter:</span>
                        {['all', 'unread', 'read', 'driver_registration', 'system', 'analytics', 'payment'].map((filterOption) => (
                            <button
                                key={filterOption}
                                onClick={() => setFilter(filterOption)}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${filter === filterOption
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {filterOption.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-3">
                    {filteredNotifications.length === 0 ? (
                        <div className="text-center py-8">
                            <BellIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-900">No notifications</p>
                            <p className="text-xs text-gray-500">No notifications match the current filter.</p>
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`bg-white rounded-lg border p-4 transition-colors ${notification.isRead ? 'border-gray-200' : 'border-green-200 bg-green-50'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1">
                                        {/* Icon */}
                                        <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                                            {getTypeIcon(notification.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                                    {notification.title}
                                                </h3>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                                                    {notification.priority}
                                                </span>
                                                {!notification.isRead && (
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                <span className="flex items-center space-x-1">
                                                    <ClockIcon className="w-3 h-3" />
                                                    <span>{formatTime(notification.createdAt)}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center space-x-1 ml-4">
                                        {!notification.isRead && (
                                            <button
                                                onClick={() => markAsRead(notification._id)}
                                                className="text-green-600 hover:text-green-900 p-1"
                                                title="Mark as read"
                                            >
                                                <CheckIcon className="w-3 h-3" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setSelectedNotification(notification);
                                                setShowDetailsModal(true);
                                            }}
                                            className="text-blue-600 hover:text-blue-900 p-1"
                                            title="View details"
                                        >
                                            <InformationCircleIcon className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => deleteNotification(notification._id)}
                                            className="text-red-600 hover:text-red-900 p-1"
                                            title="Delete notification"
                                        >
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedNotification && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-900">Notification Details</h3>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="space-y-3">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">{selectedNotification.title}</h4>
                                    <p className="text-xs text-gray-600 mt-1">{selectedNotification.message}</p>
                                </div>
                                <div className="text-xs text-gray-500">
                                    <p>Type: {selectedNotification.type}</p>
                                    <p>Priority: {selectedNotification.priority}</p>
                                    <p>Created: {selectedNotification.createdAt.toLocaleString()}</p>
                                </div>
                                {selectedNotification.metadata && (
                                    <div>
                                        <h5 className="text-xs font-medium text-gray-900 mb-1">Metadata:</h5>
                                        <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto">
                                            {JSON.stringify(selectedNotification.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNotificationsPage;
