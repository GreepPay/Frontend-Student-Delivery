/**
 * Development Configuration
 * Controls development-specific settings to reduce API spam
 */

export const DEV_CONFIG = {
    // Polling intervals (in milliseconds)
    POLLING_INTERVALS: {
        SOCKET_STATUS: 30000,      // 30 seconds (was 5s)
        CONNECTION_CHECK: 30000,   // 30 seconds (was 5s)
        LOCATION_UPDATE: 180000,   // 3 minutes (unchanged)
        ONLINE_STATUS: 120000,     // 2 minutes (was 60s)
    },

    // HMR and development server settings
    HMR: {
        ENABLED: true,
        POLL_INTERVAL: 1000,       // How often to check for updates
    },

    // Service worker settings for development
    SERVICE_WORKER: {
        ENABLED: true,
        SKIP_HMR_REQUESTS: true,   // Skip HMR requests
        CACHE_HMR: false,          // Don't cache HMR responses
    },

    // Socket connection settings
    SOCKET: {
        RECONNECT_ATTEMPTS: 5,
        RECONNECT_DELAY: 1000,
        RECONNECT_DELAY_MAX: 5000,
    }
};

// Helper function to get polling interval
export const getPollingInterval = (type) => {
    return DEV_CONFIG.POLLING_INTERVALS[type] || 30000;
};

// Helper function to check if we're in development
export const isDevelopment = () => {
    return process.env.NODE_ENV === 'development';
};

// Helper function to get optimized interval based on environment
export const getOptimizedInterval = (defaultInterval, type) => {
    if (isDevelopment()) {
        return getPollingInterval(type);
    }
    return defaultInterval;
};






