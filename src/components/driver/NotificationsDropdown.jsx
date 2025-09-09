import React, { useState, useEffect, useRef } from 'react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socketService';
import apiService from '../../services/api';
import soundService from '../../services/soundService';
import NotificationsDropdownSkeleton from '../common/NotificationsDropdownSkeleton';
import { useNavigate } from 'react-router-dom';

const NotificationsDropdown = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [markingAsRead, setMarkingAsRead] = useState(new Set());
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    // Initial load of unread count
    useEffect(() => {
        fetchUnreadCount();
    }, []);

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    // Load notifications when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // WebSocket setup for real-time notifications
    useEffect(() => {
        if (!user) return;

        console.log('🔌 NotificationsDropdown: Setting up WebSocket for real-time updates');

        // Connect to socket if not already connected
        if (!socketService.isConnected()) {
            socketService.connect(user._id || user.id, user.userType || user.role);
        }

        // Listen for new notifications
        socketService.on('new-notification', (data) => {
            console.log('🔔 NotificationsDropdown: Received new notification via WebSocket:', data);

            // Play sound for new notifications
            soundService.playSound('notification');

            const newNotification = {
                _id: data._id || Date.now().toString(),
                title: data.title || 'New Notification',
                message: data.message || 'You have a new notification',
                type: data.type || 'notification',
                priority: data.priority || 'medium',
                isRead: false,
                createdAt: data.createdAt || new Date().toISOString()
            };

            // Add to notifications list if dropdown is open
            if (isOpen) {
                setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep only 5 notifications
            }

            // Update unread count
            setUnreadCount(prev => prev + 1);
        });

        // Listen for delivery assignments
        socketService.on('delivery-assigned', (data) => {
            console.log('🚚 NotificationsDropdown: Received delivery assignment via WebSocket:', data);

            // Play delivery sound
            soundService.playSound('delivery');

            const deliveryNotification = {
                _id: data._id || Date.now().toString(),
                title: 'New Delivery Assigned',
                message: `You have been assigned delivery ${data.deliveryCode || 'Unknown'}`,
                type: 'delivery',
                priority: 'high',
                isRead: false,
                createdAt: data.createdAt || new Date().toISOString()
            };

            // Add to notifications list if dropdown is open
            if (isOpen) {
                setNotifications(prev => [deliveryNotification, ...prev.slice(0, 4)]);
            }

            // Update unread count
            setUnreadCount(prev => prev + 1);
        });

        // Listen for admin messages
        socketService.on('admin-message', (data) => {
            console.log('💬 NotificationsDropdown: ===== ADMIN MESSAGE RECEIVED =====');
            console.log('💬 NotificationsDropdown: Received admin message via WebSocket:', data);

            // Play notification sound
            soundService.playSound('notification');

            const messageNotification = {
                _id: data._id || Date.now().toString(),
                title: 'Message from Admin',
                message: data.message || 'You have a new message from admin',
                type: 'message',
                priority: 'medium',
                isRead: false,
                createdAt: data.createdAt || new Date().toISOString()
            };

            // Add to notifications list if dropdown is open
            if (isOpen) {
                setNotifications(prev => [messageNotification, ...prev.slice(0, 4)]);
            }

            // Update unread count
            setUnreadCount(prev => prev + 1);
        });

        // Listen for notification updates (mark as read, etc.)
        socketService.on('notification-updated', (data) => {
            console.log('🔔 NotificationsDropdown: Notification updated via WebSocket:', data);

            setNotifications(prev =>
                prev.map(notification =>
                    notification._id === data._id
                        ? { ...notification, ...data }
                        : notification
                )
            );

            // Update unread count if notification was marked as read
            if (data.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        });

        // Listen for notification deletions
        socketService.on('notification-deleted', (notificationId) => {
            console.log('🔔 NotificationsDropdown: Notification deleted via WebSocket:', notificationId);

            setNotifications(prev => {
                const deletedNotification = prev.find(n => n._id === notificationId);
                if (deletedNotification && !deletedNotification.isRead) {
                    setUnreadCount(prevCount => Math.max(0, prevCount - 1));
                }
                return prev.filter(notification => notification._id !== notificationId);
            });
        });

        // Listen for payment notifications
        socketService.on('payment-received', (data) => {
            console.log('💰 NotificationsDropdown: Payment received via WebSocket:', data);

            // Play notification sound
            soundService.playSound('notification');

            const paymentNotification = {
                _id: data._id || Date.now().toString(),
                title: 'Payment Received',
                message: `Payment of ₺${data.amount || 'Unknown'} received for delivery ${data.deliveryCode || 'Unknown'}`,
                type: 'payment',
                priority: 'high',
                isRead: false,
                createdAt: data.createdAt || new Date().toISOString()
            };

            // Add to notifications list if dropdown is open
            if (isOpen) {
                setNotifications(prev => [paymentNotification, ...prev.slice(0, 4)]);
            }

            // Update unread count
            setUnreadCount(prev => prev + 1);
        });

        return () => {
            // Clean up WebSocket listeners
            socketService.off('new-notification');
            socketService.off('delivery-assigned');
            socketService.off('admin-message');
            socketService.off('notification-updated');
            socketService.off('notification-deleted');
            socketService.off('payment-received');
        };
    }, [user, isOpen]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await apiService.getDriverNotifications({ limit: 5 });

            if (response.success) {
                setNotifications(response.data.notifications || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await apiService.getDriverUnreadNotificationsCount();

            if (response.success) {
                setUnreadCount(response.data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            console.log('📖 NotificationsDropdown: Marking notification as read:', notificationId);

            // Validate notification ID
            if (!notificationId || typeof notificationId !== 'string') {
                console.warn('📖 NotificationsDropdown: Invalid notification ID:', notificationId);
                return;
            }

            // Check if already marking this notification as read
            if (markingAsRead.has(notificationId)) {
                console.log('📖 NotificationsDropdown: Already marking notification as read:', notificationId);
                return;
            }

            // Add to marking set
            setMarkingAsRead(prev => new Set(prev).add(notificationId));

            const response = await apiService.markNotificationAsRead(notificationId);

            if (response.success) {
                setNotifications(prev =>
                    prev.map(notification =>
                        notification._id === notificationId
                            ? { ...notification, isRead: true }
                            : notification
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } else {
                // Always fallback to local update for any API failure
                setNotifications(prev =>
                    prev.map(notification =>
                        notification._id === notificationId
                            ? { ...notification, isRead: true }
                            : notification
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            // Fallback to local update
            setNotifications(prev =>
                prev.map(notification =>
                    notification._id === notificationId
                        ? { ...notification, isRead: true }
                        : notification
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } finally {
            // Remove from marking set
            setMarkingAsRead(prev => {
                const newSet = new Set(prev);
                newSet.delete(notificationId);
                return newSet;
            });
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            return `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const handleNotificationClick = () => {
        // On mobile, navigate to notifications page
        // On desktop, toggle dropdown
        if (window.innerWidth < 640) {
            navigate('/driver/notifications');
        } else {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={handleNotificationClick}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[80vh] overflow-hidden sm:right-0 sm:left-auto right-0 left-4 sm:left-auto sm:w-80 lg:w-96 hidden sm:block"
                >
                    <div className="p-3 sm:p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Notifications</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        {unreadCount > 0 && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto scrollbar-hide">
                        {loading ? (
                            <NotificationsDropdownSkeleton />
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center">
                                <BellIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`p-3 sm:p-4 transition-colors ${markingAsRead.has(notification._id)
                                            ? 'cursor-not-allowed opacity-75'
                                            : 'hover:bg-gray-50 cursor-pointer'
                                            } ${!notification.isRead ? 'bg-blue-50' : ''}`}
                                        onClick={() => {
                                            if (!notification.isRead && notification._id && !markingAsRead.has(notification._id)) {
                                                markAsRead(notification._id);
                                            }
                                        }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-xs sm:text-sm font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'
                                                    }`}>
                                                    {notification.title}
                                                </h4>
                                                <p className={`text-xs sm:text-sm mt-1 ${notification.isRead ? 'text-gray-600' : 'text-gray-800'
                                                    } line-clamp-2`}>
                                                    {notification.message}
                                                </p>
                                                <span className="text-xs text-gray-500 mt-2 block">
                                                    {formatDate(notification.createdAt)}
                                                </span>
                                            </div>

                                            {!notification.isRead && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (notification._id && !markingAsRead.has(notification._id)) {
                                                            markAsRead(notification._id);
                                                        }
                                                    }}
                                                    disabled={markingAsRead.has(notification._id)}
                                                    className={`ml-2 p-1 flex-shrink-0 ${markingAsRead.has(notification._id)
                                                        ? 'text-gray-300 cursor-not-allowed'
                                                        : 'text-gray-400 hover:text-gray-600'
                                                        }`}
                                                    title={markingAsRead.has(notification._id) ? 'Marking as read...' : 'Mark as read'}
                                                >
                                                    {markingAsRead.has(notification._id) ? (
                                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                                    ) : (
                                                        <XMarkIcon className="w-4 h-4" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 sm:p-4 border-t border-gray-200">
                            <a
                                href="/driver/notifications"
                                className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium"
                            >
                                View all notifications →
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsDropdown;
