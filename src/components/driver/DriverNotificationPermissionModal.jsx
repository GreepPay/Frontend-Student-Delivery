import React, { useState, useEffect } from 'react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import pwaService from '../../services/pwaService';
import notificationPermissionService from '../../services/notificationPermissionService';

const DriverNotificationPermissionModal = ({ isOpen, onClose, onPermissionGranted }) => {
    const [permissionStatus, setPermissionStatus] = useState(null);
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            checkPermissionStatus();
        }
    }, [isOpen]);

    const checkPermissionStatus = () => {
        const status = notificationPermissionService.checkPermissionStatus();
        setPermissionStatus(status);
    };

    const requestPermission = async () => {
        setIsRequesting(true);
        try {
            const granted = await notificationPermissionService.requestPermission();
            if (granted) {
                // Subscribe to push notifications
                const subscription = await pwaService.subscribeToPushNotifications();
                if (subscription) {
                    console.log('✅ Push notification subscription successful');

                    // Send subscription to backend
                    try {
                        const user = JSON.parse(localStorage.getItem('user') || '{}');
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

                onPermissionGranted && onPermissionGranted();
                onClose();
            } else {
                console.log('Permission denied by user');
            }
        } catch (error) {
            console.error('Failed to request permission:', error);
        } finally {
            setIsRequesting(false);
        }
    };

    const testNotification = async () => {
        await pwaService.showPushNotification('Test Delivery Notification', {
            body: 'This is a test notification for delivery assignments',
            tag: 'test-delivery-notification'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <BellIcon className="h-8 w-8 text-green-600 mr-3" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            Enable Delivery Notifications
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                        To receive delivery assignments and updates, we need your permission to send push notifications.
                    </p>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-green-900 mb-2">What you'll receive:</h4>
                        <ul className="text-sm text-green-800 space-y-1">
                            <li>• 🚚 New delivery opportunities in your area</li>
                            <li>• 📍 Pickup and delivery location details</li>
                            <li>• 💰 Delivery fees and payment information</li>
                            <li>• ⏰ Time-sensitive delivery assignments</li>
                        </ul>
                    </div>

                    {permissionStatus && (
                        <div className="text-sm text-gray-500 mb-4">
                            <p>Current Status: <span className="font-medium">{permissionStatus}</span></p>
                        </div>
                    )}
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={requestPermission}
                        disabled={isRequesting}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {isRequesting ? 'Requesting...' : 'Enable Notifications'}
                    </button>

                    {permissionStatus === 'granted' && (
                        <button
                            onClick={testNotification}
                            className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors duration-200"
                        >
                            Test
                        </button>
                    )}
                </div>

                <div className="mt-4 text-xs text-gray-500">
                    <p>You can change notification settings anytime in your browser settings.</p>
                </div>
            </div>
        </div>
    );
};

export default DriverNotificationPermissionModal;
