import React, { useState, useEffect } from 'react';
import {
    BellIcon,
    BellSlashIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useNotificationPermission } from '../../hooks/useNotificationPermission';
import pwaService from '../../services/pwaService';
import soundService from '../../services/soundService';
import toast from 'react-hot-toast';

const NotificationSettings = ({ className = '' }) => {
    const {
        isGranted: notificationGranted,
        isDenied: notificationDenied,
        isDefault: notificationDefault,
        isUnsupported: notificationUnsupported,
        requestPermission,
        showPermissionModal,
        permissionInfo
    } = useNotificationPermission('general', 'soft');

    const [soundEnabled, setSoundEnabled] = useState(false);
    const [pushSubscription, setPushSubscription] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        checkSoundPermission();
        checkPushSubscription();
    }, []);

    const checkSoundPermission = async () => {
        try {
            const status = soundService.getPermissionStatus();
            setSoundEnabled(status.isInitialized && status.audioContextState === 'running');
        } catch (error) {
            console.error('Error checking sound permission:', error);
        }
    };

    const checkPushSubscription = async () => {
        try {
            const subscription = await pwaService.getPushSubscription();
            setPushSubscription(subscription);
        } catch (error) {
            console.error('Error checking push subscription:', error);
        }
    };

    const handleNotificationToggle = async () => {
        if (notificationGranted) {
            // Disable notifications
            try {
                await pwaService.unsubscribeFromPushNotifications();
                setPushSubscription(null);
                toast.success('Notifications disabled');
            } catch (error) {
                console.error('Error disabling notifications:', error);
                toast.error('Failed to disable notifications');
            }
        } else {
            // Enable notifications
            setIsLoading(true);
            try {
                const granted = await requestPermission();
                if (granted) {
                    const subscription = await pwaService.subscribeToPushNotifications();
                    setPushSubscription(subscription);
                    toast.success('Notifications enabled');
                }
            } catch (error) {
                console.error('Error enabling notifications:', error);
                toast.error('Failed to enable notifications');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSoundToggle = async () => {
        if (soundEnabled) {
            // Disable sound
            setSoundEnabled(false);
            toast.success('Notification sounds disabled');
        } else {
            // Enable sound
            try {
                const granted = await soundService.requestPermission();
                if (granted) {
                    setSoundEnabled(true);
                    await soundService.playSound('notification');
                    toast.success('Notification sounds enabled');
                } else {
                    toast.error('Failed to enable notification sounds');
                }
            } catch (error) {
                console.error('Error enabling sound:', error);
                toast.error('Failed to enable notification sounds');
            }
        }
    };

    const testNotification = () => {
        if (notificationGranted) {
            pwaService.showPushNotification('Test Notification', {
                body: 'This is a test notification to verify everything is working correctly.',
                tag: 'test-notification'
            });
            toast.success('Test notification sent');
        } else {
            toast.error('Please enable notifications first');
        }
    };

    const testSound = async () => {
        if (soundEnabled) {
            await soundService.playSound('notification');
            toast.success('Test sound played');
        } else {
            toast.error('Please enable notification sounds first');
        }
    };

    const getNotificationStatus = () => {
        if (notificationUnsupported) {
            return { status: 'unsupported', color: 'text-yellow-600', icon: ExclamationTriangleIcon };
        } else if (notificationGranted) {
            return { status: 'enabled', color: 'text-green-600', icon: CheckCircleIcon };
        } else if (notificationDenied) {
            return { status: 'blocked', color: 'text-red-600', icon: XCircleIcon };
        } else {
            return { status: 'disabled', color: 'text-gray-600', icon: BellSlashIcon };
        }
    };

    const getSoundStatus = () => {
        if (soundEnabled) {
            return { status: 'enabled', color: 'text-green-600', icon: CheckCircleIcon };
        } else {
            return { status: 'disabled', color: 'text-gray-600', icon: XCircleIcon };
        }
    };

    const notificationStatus = getNotificationStatus();
    const soundStatus = getSoundStatus();

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
            <div className="p-6">
                <div className="flex items-center mb-6">
                    <BellIcon className="h-6 w-6 text-gray-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
                </div>

                <div className="space-y-6">
                    {/* Push Notifications */}
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center">
                                <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
                                <notificationStatus.icon className={`h-4 w-4 ml-2 ${notificationStatus.color}`} />
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                Receive notifications even when the app is closed
                            </p>
                            {notificationStatus.status === 'blocked' && (
                                <p className="text-xs text-red-600 mt-1">
                                    Notifications are blocked. Enable them in your browser settings.
                                </p>
                            )}
                            {notificationStatus.status === 'unsupported' && (
                                <p className="text-xs text-yellow-600 mt-1">
                                    Your browser doesn't support push notifications.
                                </p>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={testNotification}
                                disabled={!notificationGranted}
                                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Test
                            </button>
                            <button
                                onClick={handleNotificationToggle}
                                disabled={isLoading || notificationUnsupported}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationGranted ? 'bg-green-600' : 'bg-gray-200'
                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationGranted ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Notification Sounds */}
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center">
                                <h4 className="text-sm font-medium text-gray-900">Notification Sounds</h4>
                                <soundStatus.icon className={`h-4 w-4 ml-2 ${soundStatus.color}`} />
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                Play sounds when notifications are received
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={testSound}
                                disabled={!soundEnabled}
                                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Test
                            </button>
                            <button
                                onClick={handleSoundToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${soundEnabled ? 'bg-green-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Permission Info */}
                    {permissionInfo && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Permission Details</h5>
                            <div className="text-xs text-gray-600 space-y-1">
                                <p>Status: {permissionInfo.status}</p>
                                <p>Retry Count: {permissionInfo.retryCount}/{permissionInfo.maxRetries}</p>
                                <p>Browser Support: {permissionInfo.isSupported ? 'Yes' : 'No'}</p>
                                {permissionInfo.lastRequestTime && (
                                    <p>Last Request: {new Date(permissionInfo.lastRequestTime).toLocaleString()}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Help Text */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex">
                            <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">Why enable notifications?</p>
                                <ul className="space-y-1 text-xs">
                                    <li>• Get instant delivery assignments</li>
                                    <li>• Receive payment confirmations</li>
                                    <li>• Stay updated with important announcements</li>
                                    <li>• Never miss time-sensitive opportunities</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettings;
