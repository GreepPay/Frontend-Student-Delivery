/**
 * Centralized Notification Manager
 * Prevents duplicate notifications across admin and driver interfaces
 */

import toast from 'react-hot-toast';
import soundService from './soundService';

class NotificationManager {
    constructor() {
        this.processedNotifications = new Set();
        this.toastIds = new Set();
        this.listeners = new Map();
        this.maxProcessedSize = 100;
    }

    /**
     * Create a unique notification ID for deduplication
     */
    createNotificationId(data) {
        const timestamp = data.timestamp || new Date().toISOString();
        const message = data.message || data.title || '';
        const type = data.type || 'notification';
        const sender = data.sender || data.senderName || data.driverName || '';

        return `${type}_${message}_${sender}_${timestamp}`.replace(/\s+/g, '_');
    }

    /**
     * Check if notification is duplicate
     */
    isDuplicate(notificationId) {
        if (this.processedNotifications.has(notificationId)) {
            console.log('🔄 NotificationManager: Duplicate notification detected, skipping:', notificationId);
            return true;
        }

        this.processedNotifications.add(notificationId);

        // Clean up old entries to prevent memory leaks
        if (this.processedNotifications.size > this.maxProcessedSize) {
            const entries = Array.from(this.processedNotifications);
            this.processedNotifications = new Set(entries.slice(-50));
        }

        return false;
    }

    /**
     * Show toast notification with deduplication
     */
    showToast(message, type = 'info', options = {}) {
        const toastId = `${type}_${message}`;

        if (this.toastIds.has(toastId)) {
            console.log('🔄 NotificationManager: Duplicate toast detected, skipping:', toastId);
            return;
        }

        this.toastIds.add(toastId);

        // Remove from set after toast duration
        const duration = options.duration || 4000;
        setTimeout(() => {
            this.toastIds.delete(toastId);
        }, duration + 1000);

        // Show the toast
        switch (type) {
            case 'success':
                return toast.success(message, options);
            case 'error':
                return toast.error(message, options);
            case 'warning':
                return toast(message, { ...options, icon: '⚠️' });
            default:
                return toast(message, options);
        }
    }

    /**
     * Play sound for notification
     */
    playNotificationSound(type, priority = 'medium') {
        try {
            if (type === 'emergency-alert' || priority === 'high') {
                soundService.playSound('alert');
            } else if (type === 'delivery') {
                soundService.playSound('delivery');
            } else {
                soundService.playSound('notification');
            }
        } catch (error) {
            console.log('🔊 NotificationManager: Sound play failed:', error);
        }
    }

    /**
     * Process incoming notification data
     */
    processNotification(data, source = 'unknown') {
        // Skip driver messages - they should go to messaging system, not notifications
        if (data._routeToMessaging ||
            data.type === 'driver-message' ||
            data.type === 'message' ||
            data.senderType === 'driver' ||
            data.message?.includes('Message from') ||
            data.title?.includes('Message from') ||
            data.message?.includes('💬') ||
            data.message?.toLowerCase().includes('how low can you go') ||
            data.message?.toLowerCase().includes('are you sur') ||
            data.message?.toLowerCase().includes('hello') ||
            data.message?.toLowerCase().includes('hey') ||
            data.message?.toLowerCase().includes('test message')) {
            console.log(`🔔 NotificationManager: Skipping driver message notification from ${source}:`, data);
            return null;
        }

        const notificationId = this.createNotificationId(data);

        if (this.isDuplicate(notificationId)) {
            return null;
        }

        console.log(`🔔 NotificationManager: Processing notification from ${source}:`, data);

        // Play sound
        this.playNotificationSound(data.type, data.priority);

        // Create standardized notification object
        const notification = {
            id: notificationId,
            message: data.message || data.title || 'New notification received',
            timestamp: new Date(data.timestamp || Date.now()),
            type: data.type || 'notification',
            priority: data.priority || 'medium',
            isRead: false,
            sender: data.sender || data.senderName || data.driverName || null,
            emergencyData: data.emergencyData || null,
            metadata: data
        };

        return notification;
    }

    /**
     * Register a notification listener
     */
    registerListener(eventName, callback, componentName) {
        const listenerKey = `${eventName}_${componentName}`;

        if (this.listeners.has(listenerKey)) {
            console.log(`🔄 NotificationManager: Listener already registered for ${listenerKey}`);
            return;
        }

        this.listeners.set(listenerKey, {
            eventName,
            callback,
            componentName
        });

        console.log(`📝 NotificationManager: Registered listener for ${listenerKey}`);
    }

    /**
     * Unregister a notification listener
     */
    unregisterListener(eventName, componentName) {
        const listenerKey = `${eventName}_${componentName}`;

        if (this.listeners.has(listenerKey)) {
            this.listeners.delete(listenerKey);
            console.log(`🗑️ NotificationManager: Unregistered listener for ${listenerKey}`);
        }
    }

    /**
     * Get all registered listeners
     */
    getListeners() {
        return Array.from(this.listeners.values());
    }

    /**
     * Clear all processed notifications (useful for testing)
     */
    clearProcessedNotifications() {
        this.processedNotifications.clear();
        this.toastIds.clear();
        console.log('🧹 NotificationManager: Cleared all processed notifications');
    }

    /**
     * Get statistics about processed notifications
     */
    getStats() {
        return {
            processedCount: this.processedNotifications.size,
            activeToasts: this.toastIds.size,
            registeredListeners: this.listeners.size
        };
    }
}

// Create singleton instance
const notificationManager = new NotificationManager();

export default notificationManager;
