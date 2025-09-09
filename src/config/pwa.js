/**
 * PWA Configuration
 * Centralized configuration for Progressive Web App features
 */

export const PWA_CONFIG = {
    // App Information
    app: {
        name: 'Greep SDS - Student Delivery Service',
        shortName: 'Greep SDS',
        description: 'Student Delivery System - Connect students with delivery opportunities',
        version: '1.0.0',
        author: 'Greep Technologies'
    },

    // Theme and Colors
    theme: {
        primaryColor: '#0a84ff',
        backgroundColor: '#ffffff',
        themeColor: '#0a84ff',
        statusBarStyle: 'default'
    },

    // Icons Configuration
    icons: {
        sizes: [16, 32, 72, 96, 128, 144, 152, 192, 384, 512],
        maskable: [192, 512],
        appleTouchIcon: 192
    },

    // Caching Strategy
    caching: {
        staticCacheName: 'greep-sds-static-v1.0.0',
        dynamicCacheName: 'greep-sds-dynamic-v1.0.0',
        maxCacheSize: 50, // MB
        maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        strategies: {
            static: 'cache-first',
            api: 'network-first',
            pages: 'network-first-with-offline-fallback'
        }
    },

    // Offline Configuration
    offline: {
        enabled: true,
        fallbackPage: '/offline.html',
        cachePages: [
            '/',
            '/driver',
            '/admin',
            '/login'
        ],
        cacheAssets: [
            '/static/js/bundle.js',
            '/static/css/main.css',
            '/manifest.json'
        ]
    },

    // Push Notifications
    notifications: {
        enabled: true,
        defaultIcon: '/icons/icon-192x192.png',
        defaultBadge: '/icons/icon-72x72.png',
        defaultTitle: 'Greep SDS',
        defaultBody: 'You have a new notification',
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: '/icons/icon-96x96.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/icons/icon-96x96.png'
            }
        ]
    },

    // Background Sync
    backgroundSync: {
        enabled: true,
        tag: 'background-sync',
        maxRetries: 3,
        retryDelay: 5000 // 5 seconds
    },

    // Install Prompt
    installPrompt: {
        enabled: true,
        autoShow: false,
        delay: 30000, // 30 seconds
        maxShowCount: 3,
        showOnPages: ['/driver', '/admin']
    },

    // Update Strategy
    updates: {
        enabled: true,
        checkInterval: 60000, // 1 minute
        autoUpdate: false,
        showUpdatePrompt: true
    },

    // Analytics and Monitoring
    analytics: {
        enabled: true,
        trackInstall: true,
        trackOfflineUsage: true,
        trackUpdateEvents: true
    },

    // Feature Flags
    features: {
        offlineMode: true,
        pushNotifications: true,
        backgroundSync: true,
        installPrompt: true,
        updateNotifications: true,
        offlineFallback: true,
        cacheApi: true,
        cacheStatic: true,
        cacheDynamic: true
    },

    // API Endpoints
    api: {
        baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
        endpoints: {
            auth: '/api/auth',
            drivers: '/api/drivers',
            deliveries: '/api/deliveries',
            notifications: '/api/notifications',
            messages: '/api/messages'
        }
    },

    // Service Worker
    serviceWorker: {
        enabled: true,
        scope: '/',
        updateViaCache: 'imports',
        skipWaiting: false,
        clientsClaim: true
    },

    // Manifest
    manifest: {
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        startUrl: '/',
        categories: ['business', 'productivity', 'utilities'],
        lang: 'en',
        dir: 'ltr'
    }
};

// PWA Feature Detection
export const PWA_FEATURES = {
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window,
    backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    installPrompt: 'onbeforeinstallprompt' in window,
    offlineStorage: 'indexedDB' in window,
    notifications: 'Notification' in window,
    geolocation: 'geolocation' in navigator,
    camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
};

// PWA Capabilities
export const PWA_CAPABILITIES = {
    canInstall: PWA_FEATURES.installPrompt,
    canWorkOffline: PWA_FEATURES.serviceWorker && PWA_FEATURES.offlineStorage,
    canSendNotifications: PWA_FEATURES.pushNotifications && PWA_FEATURES.notifications,
    canSyncInBackground: PWA_FEATURES.backgroundSync,
    canAccessCamera: PWA_FEATURES.camera,
    canAccessLocation: PWA_FEATURES.geolocation
};

// PWA Status Messages
export const PWA_MESSAGES = {
    install: {
        title: 'Install Greep SDS',
        body: 'Get quick access and work offline',
        button: 'Install App'
    },
    update: {
        title: 'Update Available',
        body: 'A new version of the app is available',
        button: 'Update Now'
    },
    offline: {
        title: 'You\'re Offline',
        body: 'Some features may be limited while offline',
        button: 'Try Again'
    },
    online: {
        title: 'Back Online',
        body: 'All features are now available',
        button: 'Continue'
    }
};

export default PWA_CONFIG;
