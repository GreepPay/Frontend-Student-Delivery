import React, { useState, useEffect } from 'react';
import { BellIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import pwaService from '../../services/pwaService';
import notificationPermissionService from '../../services/notificationPermissionService';

const NotificationDebugger = () => {
    const [permissionStatus, setPermissionStatus] = useState('unknown');
    const [pushSubscription, setPushSubscription] = useState(null);
    const [serviceWorkerStatus, setServiceWorkerStatus] = useState('unknown');
    const [testResult, setTestResult] = useState(null);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        // Check notification permission
        const permission = notificationPermissionService.checkPermissionStatus();
        setPermissionStatus(permission);

        // Check push subscription
        const subscription = await pwaService.getPushSubscription();
        setPushSubscription(subscription);

        // Check service worker
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            setServiceWorkerStatus(registration ? 'registered' : 'not registered');
        } else {
            setServiceWorkerStatus('not supported');
        }
    };

    const testNotification = async () => {
        try {
            setTestResult('Testing...');

            // Test browser notification
            if (permissionStatus === 'granted') {
                const notification = pwaService.showPushNotification('Test Delivery Notification', {
                    body: 'This is a test notification for delivery assignments',
                    tag: 'test-delivery-notification',
                    requireInteraction: true
                });

                if (notification) {
                    setTestResult('success');
                    setTimeout(() => setTestResult(null), 3000);
                } else {
                    setTestResult('failed');
                }
            } else {
                setTestResult('permission denied');
            }
        } catch (error) {
            console.error('Test notification failed:', error);
            setTestResult('error');
        }
    };

    const requestPermission = async () => {
        try {
            const granted = await notificationPermissionService.requestPermission();
            if (granted) {
                await checkStatus();
                setTestResult('permission granted');
                setTimeout(() => setTestResult(null), 3000);
            } else {
                setTestResult('permission denied');
                setTimeout(() => setTestResult(null), 3000);
            }
        } catch (error) {
            console.error('Permission request failed:', error);
            setTestResult('error');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'granted':
            case 'registered':
                return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            case 'denied':
            case 'not registered':
            case 'not supported':
                return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
            default:
                return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'granted':
            case 'registered':
                return 'text-green-600';
            case 'denied':
            case 'not registered':
            case 'not supported':
                return 'text-red-600';
            default:
                return 'text-yellow-600';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center mb-4">
                <BellIcon className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Notification Debugger</h3>
            </div>

            <div className="space-y-4">
                {/* Permission Status */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                        {getStatusIcon(permissionStatus)}
                        <span className="ml-2 font-medium">Notification Permission</span>
                    </div>
                    <span className={`font-medium ${getStatusColor(permissionStatus)}`}>
                        {permissionStatus}
                    </span>
                </div>

                {/* Push Subscription */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                        {getStatusIcon(pushSubscription ? 'registered' : 'not registered')}
                        <span className="ml-2 font-medium">Push Subscription</span>
                    </div>
                    <span className={`font-medium ${getStatusColor(pushSubscription ? 'registered' : 'not registered')}`}>
                        {pushSubscription ? 'Active' : 'Not Active'}
                    </span>
                </div>

                {/* Service Worker */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                        {getStatusIcon(serviceWorkerStatus)}
                        <span className="ml-2 font-medium">Service Worker</span>
                    </div>
                    <span className={`font-medium ${getStatusColor(serviceWorkerStatus)}`}>
                        {serviceWorkerStatus}
                    </span>
                </div>

                {/* Test Result */}
                {testResult && (
                    <div className={`p-3 rounded-lg ${testResult === 'success' || testResult === 'permission granted'
                            ? 'bg-green-50 text-green-800'
                            : 'bg-red-50 text-red-800'
                        }`}>
                        <div className="flex items-center">
                            {testResult === 'success' || testResult === 'permission granted' ? (
                                <CheckCircleIcon className="h-5 w-5 mr-2" />
                            ) : (
                                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                            )}
                            <span className="font-medium">
                                {testResult === 'success' && 'Test notification sent successfully!'}
                                {testResult === 'permission granted' && 'Permission granted successfully!'}
                                {testResult === 'permission denied' && 'Permission denied by user'}
                                {testResult === 'failed' && 'Test notification failed'}
                                {testResult === 'error' && 'An error occurred'}
                                {testResult === 'Testing...' && 'Testing notification...'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                    <button
                        onClick={checkStatus}
                        className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                    >
                        Refresh Status
                    </button>

                    {permissionStatus !== 'granted' && (
                        <button
                            onClick={requestPermission}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                            Request Permission
                        </button>
                    )}

                    {permissionStatus === 'granted' && (
                        <button
                            onClick={testNotification}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                            Test Notification
                        </button>
                    )}
                </div>

                {/* Debug Info */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Debug Information:</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                        <p>• Browser: {navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'}</p>
                        <p>• PWA Support: {window.matchMedia('(display-mode: standalone)').matches ? 'Installed' : 'Browser'}</p>
                        <p>• HTTPS: {window.location.protocol === 'https:' ? 'Yes' : 'No'}</p>
                        <p>• Local Storage: {localStorage.getItem('token') ? 'Token Present' : 'No Token'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationDebugger;
