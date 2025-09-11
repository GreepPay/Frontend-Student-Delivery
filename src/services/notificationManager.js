/**
 * Centralized Notification Manager
 * Prevents duplicate notifications across admin and driver interfaces
 */

import toast from 'react-hot-toast';
import soundService from './soundService';
import { shouldFilterNotification, getNotificationType } from '../config/notifications';

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
        const id = data._id || data.id || '';

        // Use the actual ID if available, otherwise create a hash
        if (id) {
            return id;
        }

        // Create a more stable hash for deduplication
        const content = `${type}_${message}_${sender}`.replace(/\s+/g, '_').toLowerCase();
        return `${content}_${Math.floor(Date.now() / 60000)}`; // Group by minute
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
        // Use centralized filtering logic
        if (shouldFilterNotification(data)) {
            console.log(`🔔 NotificationManager: Filtering notification from ${source}:`, data.type);
            return null;
        }

        const notificationId = this.createNotificationId(data);

        if (this.isDuplicate(notificationId)) {
            return null;
        }

        console.log(`🔔 NotificationManager: Processing notification from ${source}:`, data);

        // Get notification type configuration
        const typeConfig = getNotificationType(data.type);

        // Play sound based on type configuration
        this.playNotificationSound(data.type, data.priority || typeConfig.priority);

        // Create standardized notification object
        const notification = {
            id: notificationId,
            message: data.message || data.title || 'New notification received',
            timestamp: new Date(data.timestamp || Date.now()),
            type: data.type || 'notification',
            priority: data.priority || typeConfig.priority,
            isRead: false,
            sender: data.sender || data.senderName || data.driverName || null,
            emergencyData: data.emergencyData || null,
            metadata: data,
            icon: typeConfig.icon,
            color: typeConfig.color
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
