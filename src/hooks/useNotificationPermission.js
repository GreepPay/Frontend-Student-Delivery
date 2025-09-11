import { useState, useEffect, useCallback } from 'react';
import notificationPermissionService from '../services/notificationPermissionService';

/**
 * Hook for managing notification permissions
 */
export const useNotificationPermission = (context = 'general', enforcementLevel = 'soft') => {
    const [permissionStatus, setPermissionStatus] = useState('default');
    const [isRequesting, setIsRequesting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [permissionInfo, setPermissionInfo] = useState(null);

    // Update permission status
    const updatePermissionStatus = useCallback(() => {
        const status = notificationPermissionService.checkPermissionStatus();
        setPermissionStatus(status);
        setPermissionInfo(notificationPermissionService.getPermissionInfo());
    }, []);

    // Initialize
    useEffect(() => {
        updatePermissionStatus();

        // Set enforcement level
        notificationPermissionService.setEnforcementLevel(enforcementLevel);
    }, [updatePermissionStatus, enforcementLevel]);

    // Request permission
    const requestPermission = useCallback(async (force = false) => {
        setIsRequesting(true);
        try {
            const granted = await notificationPermissionService.requestPermission(force);
            updatePermissionStatus();
            return granted;
        } finally {
            setIsRequesting(false);
        }
    }, [updatePermissionStatus]);

    // Enforce permission
    const enforcePermission = useCallback(async (customContext = null, customLevel = null) => {
        const targetContext = customContext || context;
        const targetLevel = customLevel || enforcementLevel;

        return await notificationPermissionService.enforcePermission(targetContext, targetLevel);
    }, [context, enforcementLevel]);

    // Show permission modal
    const showPermissionModal = useCallback(() => {
        setShowModal(true);
    }, []);

    // Hide permission modal
    const hidePermissionModal = useCallback(() => {
        setShowModal(false);
    }, []);

    // Handle permission granted
    const handlePermissionGranted = useCallback(() => {
        updatePermissionStatus();
        setShowModal(false);
    }, [updatePermissionStatus]);

    // Check if permission is required
    const isRequired = useCallback(() => {
        return notificationPermissionService.isNotificationRequired(context);
    }, [context]);

    // Get permission status
    const getStatus = useCallback(() => {
        return {
            status: permissionStatus,
            isGranted: permissionStatus === 'granted',
            isDenied: permissionStatus === 'denied',
            isDefault: permissionStatus === 'default',
            isUnsupported: permissionStatus === 'unsupported',
            isRequesting,
            showModal,
            permissionInfo
        };
    }, [permissionStatus, isRequesting, showModal, permissionInfo]);

    return {
        // Status
        ...getStatus(),

        // Actions
        requestPermission,
        enforcePermission,
        showPermissionModal,
        hidePermissionModal,
        handlePermissionGranted,
        updatePermissionStatus,

        // Utilities
        isRequired,
        getStatus
    };
};

export default useNotificationPermission;
