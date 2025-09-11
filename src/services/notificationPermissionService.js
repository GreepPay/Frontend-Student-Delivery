/**
 * Notification Permission Service
 * Manages PWA push notification permissions and enforcement
 */

import pwaService from './pwaService';
import toast from 'react-hot-toast';

class NotificationPermissionService {
    constructor() {
        this.permissionStatus = 'default';
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 5000; // 5 seconds
        this.enforcementLevel = 'soft'; // 'soft', 'medium', 'hard'
        this.lastRequestTime = 0;
        this.cooldownPeriod = 30000; // 30 seconds between requests
        this.storageKey = 'greep_notification_permission';
        this.forceRequestKey = 'greep_force_notification_request';

        this.init();
    }

    /**
     * Initialize the service
     */
    init() {
        this.checkPermissionStatus();
        this.loadStoredData();
    }

    /**
     * Check current notification permission status
     */
    checkPermissionStatus() {
        if ('Notification' in window) {
            this.permissionStatus = Notification.permission;
        } else {
            this.permissionStatus = 'unsupported';
        }
        return this.permissionStatus;
    }

    /**
     * Load stored permission data
     */
    loadStoredData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                this.retryCount = data.retryCount || 0;
                this.lastRequestTime = data.lastRequestTime || 0;
            }
        } catch (error) {
            console.error('Failed to load stored permission data:', error);
        }
    }

    /**
     * Save permission data to localStorage
     */
    saveStoredData() {
        try {
            const data = {
                retryCount: this.retryCount,
                lastRequestTime: this.lastRequestTime,
                permissionStatus: this.permissionStatus
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save permission data:', error);
        }
    }

    /**
     * Check if we can request permission (cooldown check)
     */
    canRequestPermission() {
        const now = Date.now();
        return (now - this.lastRequestTime) > this.cooldownPeriod;
    }

    /**
     * Request notification permission with retry logic
     */
    async requestPermission(force = false) {
        // Check if already granted
        if (this.permissionStatus === 'granted') {
            return true;
        }

        // Check cooldown unless forced
        if (!force && !this.canRequestPermission()) {
            const remainingTime = Math.ceil((this.cooldownPeriod - (Date.now() - this.lastRequestTime)) / 1000);
            toast(`Please wait ${remainingTime} seconds before requesting again.`, {
                icon: '⏰',
                duration: 3000
            });
            return false;
        }

        // Check if we've exceeded max retries
        if (this.retryCount >= this.maxRetries && !force) {
            this.showBrowserSettingsPrompt();
            return false;
        }

        this.lastRequestTime = Date.now();
        this.retryCount++;

        try {
            const granted = await pwaService.requestNotificationPermission();

            if (granted) {
                this.permissionStatus = 'granted';
                this.retryCount = 0; // Reset retry count on success
                this.saveStoredData();

                // Show success notification
                toast.success('🔔 Notifications enabled! You\'ll receive delivery updates.');

                // Show test notification
                pwaService.showPushNotification('Notifications Enabled!', {
                    body: 'You\'ll now receive delivery assignments and updates.',
                    tag: 'permission-granted'
                });

                return true;
            } else {
                this.permissionStatus = 'denied';
                this.saveStoredData();

                if (this.retryCount >= this.maxRetries) {
                    this.showBrowserSettingsPrompt();
                } else {
                    toast.error('Please enable notifications to receive delivery updates.');
                }

                return false;
            }
        } catch (error) {
            console.error('Failed to request notification permission:', error);
            toast.error('Failed to enable notifications. Please try again.');
            return false;
        }
    }

    /**
     * Show browser settings prompt
     */
    showBrowserSettingsPrompt() {
        toast.error('Notifications are required. Please enable them in your browser settings.', {
            duration: 8000,
            action: {
                label: 'How to enable',
                onClick: () => this.showBrowserSettingsHelp()
            }
        });
    }

    /**
     * Show browser settings help
     */
    showBrowserSettingsHelp() {
        const userAgent = navigator.userAgent.toLowerCase();
        let instructions = '';

        if (userAgent.includes('chrome')) {
            instructions = 'Chrome: Click the lock icon in the address bar → Notifications → Allow';
        } else if (userAgent.includes('firefox')) {
            instructions = 'Firefox: Click the shield icon → Permissions → Notifications → Allow';
        } else if (userAgent.includes('safari')) {
            instructions = 'Safari: Safari menu → Preferences → Websites → Notifications → Allow';
        } else {
            instructions = 'Look for a lock or shield icon in your browser\'s address bar and enable notifications';
        }

        toast(instructions, {
            icon: 'ℹ️',
            duration: 10000
        });
    }

    /**
     * Check if notifications are required for the current context
     */
    isNotificationRequired(context = 'general') {
        const requiredContexts = ['delivery', 'driver', 'broadcast'];
        return requiredContexts.includes(context);
    }

    /**
     * Enforce notification permission based on enforcement level
     */
    async enforcePermission(context = 'general', forceLevel = null) {
        const level = forceLevel || this.enforcementLevel;
        const isRequired = this.isNotificationRequired(context);

        if (!isRequired && level === 'soft') {
            return true; // Not required, allow to proceed
        }

        if (this.permissionStatus === 'granted') {
            return true;
        }

        if (this.permissionStatus === 'denied') {
            if (level === 'hard') {
                this.showBrowserSettingsPrompt();
                return false;
            } else if (level === 'medium') {
                // Show warning but allow to proceed
                toast('Notifications are recommended for the best experience.', {
                    icon: '⚠️',
                    duration: 5000
                });
                return true;
            }
        }

        // Request permission
        return await this.requestPermission(level === 'hard');
    }

    /**
     * Set enforcement level
     */
    setEnforcementLevel(level) {
        if (['soft', 'medium', 'hard'].includes(level)) {
            this.enforcementLevel = level;
        }
    }

    /**
     * Get permission status info
     */
    getPermissionInfo() {
        return {
            status: this.permissionStatus,
            retryCount: this.retryCount,
            maxRetries: this.maxRetries,
            canRequest: this.canRequestPermission(),
            lastRequestTime: this.lastRequestTime,
            enforcementLevel: this.enforcementLevel,
            isSupported: 'Notification' in window
        };
    }

    /**
     * Reset permission data
     */
    resetPermissionData() {
        this.retryCount = 0;
        this.lastRequestTime = 0;
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.forceRequestKey);
    }

    /**
     * Force request permission (bypasses cooldown and retry limits)
     */
    async forceRequestPermission() {
        localStorage.setItem(this.forceRequestKey, 'true');
        this.retryCount = 0;
        this.lastRequestTime = 0;
        return await this.requestPermission(true);
    }

    /**
     * Check if force request is needed
     */
    shouldForceRequest() {
        return localStorage.getItem(this.forceRequestKey) === 'true';
    }

    /**
     * Clear force request flag
     */
    clearForceRequest() {
        localStorage.removeItem(this.forceRequestKey);
    }

    /**
     * Show permission status in console for debugging
     */
    debugStatus() {
        console.log('🔔 Notification Permission Status:', this.getPermissionInfo());
        console.log('🔔 Browser Support:', 'Notification' in window);
        console.log('🔔 Current Permission:', Notification?.permission || 'Not supported');
    }
}

// Create singleton instance
const notificationPermissionService = new NotificationPermissionService();

export default notificationPermissionService;
