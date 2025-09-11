import React, { useState, useEffect } from 'react';
import {
    BellIcon,
    XMarkIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import pwaService from '../../services/pwaService';
import toast from 'react-hot-toast';

const NotificationPermissionModal = ({
    isOpen,
    onClose,
    onPermissionGranted,
    forceShow = false,
    title = "Enable Push Notifications",
    description = "Stay updated with delivery assignments and important updates even when the app is closed."
}) => {
    const [permissionStatus, setPermissionStatus] = useState('default');
    const [isRequesting, setIsRequesting] = useState(false);
    const [showSkip, setShowSkip] = useState(!forceShow);
    const [retryCount, setRetryCount] = useState(0);
    const [maxRetries] = useState(3);

    useEffect(() => {
        if (isOpen) {
            checkPermissionStatus();
        }
    }, [isOpen]);

    const checkPermissionStatus = () => {
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
        } else {
            setPermissionStatus('unsupported');
        }
    };

    const requestPermission = async () => {
        if (permissionStatus === 'granted') {
            onPermissionGranted && onPermissionGranted();
            onClose();
            return;
        }

        setIsRequesting(true);
        try {
            const granted = await pwaService.requestNotificationPermission();

            if (granted) {
                setPermissionStatus('granted');
                toast.success('🔔 Notifications enabled! You\'ll now receive delivery updates.');
                onPermissionGranted && onPermissionGranted();

                // Show a test notification
                pwaService.showPushNotification('Notifications Enabled!', {
                    body: 'You\'ll now receive delivery assignments and updates.',
                    tag: 'permission-granted'
                });

                onClose();
            } else {
                setRetryCount(prev => prev + 1);
                if (retryCount < maxRetries) {
                    toast.error('Please enable notifications to receive delivery updates.');
                } else {
                    toast.error('Notifications are required for this app. Please enable them in your browser settings.');
                }
            }
        } catch (error) {
            console.error('Failed to request notification permission:', error);
            toast.error('Failed to enable notifications. Please try again.');
        } finally {
            setIsRequesting(false);
        }
    };

    const handleSkip = () => {
        if (forceShow && retryCount < maxRetries) {
            toast.error('Notifications are required to use this app effectively.');
            setRetryCount(prev => prev + 1);
            return;
        }
        onClose();
    };

    const openBrowserSettings = () => {
        toast('Please enable notifications in your browser settings and refresh the page.', {
            icon: 'ℹ️',
            duration: 5000
        });
    };

    if (!isOpen) return null;

    const getStatusIcon = () => {
        switch (permissionStatus) {
            case 'granted':
                return <CheckCircleIcon className="h-8 w-8 text-green-600" />;
            case 'denied':
                return <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />;
            case 'unsupported':
                return <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />;
            default:
                return <BellIcon className="h-8 w-8 text-blue-600" />;
        }
    };

    const getStatusMessage = () => {
        switch (permissionStatus) {
            case 'granted':
                return 'Notifications are already enabled!';
            case 'denied':
                return 'Notifications were blocked. Please enable them in your browser settings.';
            case 'unsupported':
                return 'Your browser doesn\'t support notifications.';
            default:
                return 'Click "Enable Notifications" to get started.';
        }
    };

    const getStatusColor = () => {
        switch (permissionStatus) {
            case 'granted':
                return 'text-green-600';
            case 'denied':
                return 'text-red-600';
            case 'unsupported':
                return 'text-yellow-600';
            default:
                return 'text-blue-600';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full mx-4 shadow-2xl">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            {getStatusIcon()}
                            <h3 className="text-lg font-semibold text-gray-900">
                                {title}
                            </h3>
                        </div>
                        {showSkip && (
                            <button
                                onClick={handleSkip}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        )}
                    </div>

                    <div className="mb-6">
                        <p className="text-gray-600 mb-4">
                            {description}
                        </p>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                                <InformationCircleIcon className="h-4 w-4 mr-2" />
                                What you'll receive:
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• 🚚 Instant delivery assignments</li>
                                <li>• 💰 Payment confirmations</li>
                                <li>• 📱 Important app updates</li>
                                <li>• 🔔 System notifications</li>
                            </ul>
                        </div>

                        <div className={`text-sm ${getStatusColor()}`}>
                            <p className="font-medium">{getStatusMessage()}</p>
                        </div>

                        {permissionStatus === 'denied' && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">
                                    <strong>Notifications are blocked.</strong> To enable them:
                                </p>
                                <ol className="text-sm text-red-700 mt-2 space-y-1">
                                    <li>1. Click the lock icon in your browser's address bar</li>
                                    <li>2. Set notifications to "Allow"</li>
                                    <li>3. Refresh this page</li>
                                </ol>
                            </div>
                        )}

                        {permissionStatus === 'unsupported' && (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or Safari.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex space-x-3">
                        {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' && (
                            <button
                                onClick={requestPermission}
                                disabled={isRequesting}
                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                            >
                                {isRequesting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Enabling...
                                    </>
                                ) : (
                                    <>
                                        <BellIcon className="h-4 w-4 mr-2" />
                                        Enable Notifications
                                    </>
                                )}
                            </button>
                        )}

                        {permissionStatus === 'denied' && (
                            <button
                                onClick={openBrowserSettings}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Open Settings
                            </button>
                        )}

                        {showSkip && (
                            <button
                                onClick={handleSkip}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                            >
                                {forceShow && retryCount < maxRetries ? 'Remind Later' : 'Skip'}
                            </button>
                        )}
                    </div>

                    <div className="mt-4 text-xs text-gray-500">
                        <p>
                            {forceShow
                                ? 'Notifications are essential for receiving delivery assignments.'
                                : 'You can enable notifications later in your profile settings.'
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationPermissionModal;
