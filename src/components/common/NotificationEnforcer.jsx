import React, { useEffect, useState } from 'react';
import { useNotificationPermission } from '../../hooks/useNotificationPermission';
import NotificationPermissionModal from './NotificationPermissionModal';
import { BellIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const NotificationEnforcer = ({
    context = 'general',
    enforcementLevel = 'soft',
    children,
    showWarning = true,
    className = ''
}) => {
    const {
        isGranted,
        isDenied,
        isDefault,
        isUnsupported,
        isRequired,
        enforcePermission,
        showPermissionModal,
        permissionInfo
    } = useNotificationPermission(context, enforcementLevel);

    const [hasShownWarning, setHasShownWarning] = useState(false);
    const [shouldBlock, setShouldBlock] = useState(false);

    // Check if we should enforce permissions
    useEffect(() => {
        const checkEnforcement = async () => {
            if (isRequired() && enforcementLevel !== 'soft') {
                const allowed = await enforcePermission();

                if (!allowed && enforcementLevel === 'hard') {
                    setShouldBlock(true);
                    if (!hasShownWarning) {
                        toast.error('Notifications are required to use this feature.');
                        setHasShownWarning(true);
                    }
                } else if (!allowed && enforcementLevel === 'medium' && showWarning && !hasShownWarning) {
                    toast('Enable notifications for the best experience.', {
                        icon: '⚠️',
                        duration: 5000
                    });
                    setHasShownWarning(true);
                }
            }
        };

        checkEnforcement();
    }, [isGranted, isDenied, isDefault, enforcementLevel, isRequired, enforcePermission, hasShownWarning, showWarning]);

    // Show permission modal for required contexts
    useEffect(() => {
        if (isRequired() && isDefault && enforcementLevel !== 'soft') {
            const timer = setTimeout(() => {
                showPermissionModal();
            }, 1000); // Small delay to let the page load

            return () => clearTimeout(timer);
        }
    }, [isRequired, isDefault, enforcementLevel, showPermissionModal]);

    // Block access if hard enforcement and permission denied
    if (shouldBlock && enforcementLevel === 'hard') {
        return (
            <div className={`bg-red-50 border border-red-200 rounded-lg p-6 text-center ${className}`}>
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                    Notifications Required
                </h3>
                <p className="text-red-700 mb-4">
                    This feature requires notification permissions to work properly.
                    Please enable notifications to continue.
                </p>
                <button
                    onClick={showPermissionModal}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                    Enable Notifications
                </button>
            </div>
        );
    }

    // Show warning banner for medium enforcement
    if (enforcementLevel === 'medium' && !isGranted && isRequired() && showWarning) {
        return (
            <div className={className}>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                        <BellIcon className="h-5 w-5 text-yellow-600 mr-2" />
                        <div className="flex-1">
                            <p className="text-sm text-yellow-800">
                                <strong>Enable notifications</strong> to receive delivery assignments and updates.
                            </p>
                        </div>
                        <button
                            onClick={showPermissionModal}
                            className="ml-3 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                        >
                            Enable
                        </button>
                    </div>
                </div>
                {children}
            </div>
        );
    }

    // Show soft warning for soft enforcement
    if (enforcementLevel === 'soft' && !isGranted && isRequired() && showWarning && !hasShownWarning) {
        return (
            <div className={className}>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <BellIcon className="h-4 w-4 text-blue-600 mr-2" />
                            <p className="text-sm text-blue-800">
                                Enable notifications for delivery updates
                            </p>
                        </div>
                        <button
                            onClick={showPermissionModal}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Enable
                        </button>
                    </div>
                </div>
                {children}
            </div>
        );
    }

    return (
        <div className={className}>
            {children}
        </div>
    );
};

export default NotificationEnforcer;
