/**
 * Centralized Notification Configuration
 * Defines notification types, filters, and routing rules
 */

export const NOTIFICATION_TYPES = {
    // Delivery-related notifications
    DELIVERY: {
        types: ['delivery_assigned', 'delivery_status_changed', 'delivery_completed', 'delivery_cancelled', 'delivery_created', 'delivery_broadcast'],
        icon: '📦',
        color: 'green',
        priority: 'high',
        sound: 'delivery'
    },

    // Payment-related notifications
    PAYMENT: {
        types: ['payment_received', 'payment_failed', 'payment_processed', 'payment_refunded'],
        icon: '💰',
        color: 'blue',
        priority: 'high',
        sound: 'notification'
    },

    // Earnings-related notifications
    EARNINGS: {
        types: ['earnings_updated', 'earnings_paid', 'earnings_calculated'],
        icon: '📊',
        color: 'purple',
        priority: 'medium',
        sound: 'notification'
    },

    // Account-related notifications
    ACCOUNT: {
        types: ['account_updated', 'profile_updated', 'status_changed'],
        icon: '👤',
        color: 'gray',
        priority: 'medium',
        sound: 'notification'
    },

    // Document-related notifications
    DOCUMENT: {
        types: ['document_uploaded', 'document_approved', 'document_rejected', 'document_expired'],
        icon: '📄',
        color: 'orange',
        priority: 'medium',
        sound: 'notification'
    },

    // System notifications
    SYSTEM: {
        types: ['system_alert', 'system_notification'],
        icon: '⚙️',
        color: 'gray',
        priority: 'high',
        sound: 'alert'
    },

    // Emergency notifications
    EMERGENCY: {
        types: ['emergency', 'emergency_alert'],
        icon: '🚨',
        color: 'red',
        priority: 'high',
        sound: 'alert'
    }
};

export const NOTIFICATION_FILTERS = {
    DRIVER: {
        'all': { label: 'All', types: undefined },
        'delivery': { label: 'Delivery', types: NOTIFICATION_TYPES.DELIVERY.types },
        'payment': { label: 'Payment', types: NOTIFICATION_TYPES.PAYMENT.types },
        'earnings': { label: 'Earnings', types: NOTIFICATION_TYPES.EARNINGS.types },
        'account': { label: 'Account', types: NOTIFICATION_TYPES.ACCOUNT.types },
        'document': { label: 'Documents', types: NOTIFICATION_TYPES.DOCUMENT.types }
    },

    ADMIN: {
        'all': { label: 'All', types: undefined },
        'unread': { label: 'Unread', types: undefined, filter: 'unread' },
        'read': { label: 'Read', types: undefined, filter: 'read' },
        'driver_active': { label: 'Driver Active', types: ['driver_active'] },
        'system_alert': { label: 'System Alert', types: NOTIFICATION_TYPES.SYSTEM.types },
        'analytics': { label: 'Analytics', types: ['analytics'] },
        'payment': { label: 'Payment', types: NOTIFICATION_TYPES.PAYMENT.types }
    }
};

export const NOTIFICATION_ROUTING = {
    // Messages that should go to messaging system, not notifications
    MESSAGING_TYPES: [
        'driver-message',
        'message',
        'admin-message'
    ],

    // Messages that should be filtered out
    FILTERED_PATTERNS: [
        'Message from',
        '💬',
        'how low can you go',
        'are you sur',
        'hello',
        'hey',
        'test message'
    ],

    // Low priority notifications that can be filtered
    LOW_PRIORITY_TYPES: [
        'system_notification',
        'analytics_update'
    ]
};

export const NOTIFICATION_SETTINGS = {
    // Maximum notifications to keep in memory
    MAX_NOTIFICATIONS: 50,

    // Maximum unread count to display
    MAX_UNREAD_DISPLAY: 99,

    // Auto-cleanup interval (minutes)
    CLEANUP_INTERVAL: 60,

    // Sound settings
    SOUNDS: {
        notification: 'notification',
        delivery: 'delivery',
        alert: 'alert'
    }
};

/**
 * Get notification type configuration
 */
export const getNotificationType = (type) => {
    for (const [category, config] of Object.entries(NOTIFICATION_TYPES)) {
        if (config.types.includes(type)) {
            return { category, ...config };
        }
    }
    return { category: 'unknown', icon: '🔔', color: 'gray', priority: 'medium', sound: 'notification' };
};

/**
 * Check if notification should be routed to messaging
 */
export const shouldRouteToMessaging = (notification) => {
    if (NOTIFICATION_ROUTING.MESSAGING_TYPES.includes(notification.type)) {
        return true;
    }

    if (notification.senderType === 'driver') {
        return true;
    }

    const message = notification.message || notification.title || '';
    return NOTIFICATION_ROUTING.FILTERED_PATTERNS.some(pattern =>
        message.toLowerCase().includes(pattern.toLowerCase())
    );
};

/**
 * Check if notification should be filtered out
 */
export const shouldFilterNotification = (notification) => {
    return shouldRouteToMessaging(notification) ||
        (notification.priority === 'low' &&
            NOTIFICATION_ROUTING.LOW_PRIORITY_TYPES.includes(notification.type));
};

/**
 * Get filter configuration for user type
 */
export const getFilterConfig = (userType) => {
    return userType === 'admin' ? NOTIFICATION_FILTERS.ADMIN : NOTIFICATION_FILTERS.DRIVER;
};
