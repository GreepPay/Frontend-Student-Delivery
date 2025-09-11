/**
 * PWA Service - Handles Progressive Web App functionality
 */

class PWAService {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.isOnline = navigator.onLine;
        this.serviceWorkerRegistration = null;

        this.init();
    }

    /**
     * Initialize PWA service
     */
    init() {
        this.setupInstallPrompt();
        this.setupOnlineOfflineHandlers();
        this.setupServiceWorker();
        this.checkInstallationStatus();
    }

    /**
     * Setup install prompt handling
     */
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📱 PWA: Install prompt triggered');
            e.preventDefault();
            this.deferredPrompt = e;

            // Dispatch custom event for UI components
            window.dispatchEvent(new CustomEvent('pwa-install-available', {
                detail: { canInstall: true }
            }));
        });

        window.addEventListener('appinstalled', () => {
            console.log('🎉 PWA: App installed successfully');
            this.isInstalled = true;
            this.deferredPrompt = null;

            // Dispatch custom event for UI components
            window.dispatchEvent(new CustomEvent('pwa-installed', {
                detail: { installed: true }
            }));
        });
    }

    /**
     * Setup online/offline status handling
     */
    setupOnlineOfflineHandlers() {
        window.addEventListener('online', () => {
            console.log('🌐 PWA: App is back online');
            this.isOnline = true;

            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('pwa-online', {
                detail: { online: true }
            }));
        });

        window.addEventListener('offline', () => {
            console.log('📴 PWA: App is offline');
            this.isOnline = false;

            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('pwa-offline', {
                detail: { online: false }
            }));
        });
    }

    /**
     * Setup service worker handling
     */
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('🔄 PWA: Service worker controller changed');

                // Dispatch custom event
                window.dispatchEvent(new CustomEvent('pwa-update-available', {
                    detail: { updateAvailable: true }
                }));
            });

            // Get service worker registration
            navigator.serviceWorker.getRegistration().then((registration) => {
                this.serviceWorkerRegistration = registration;
            });
        }
    }

    /**
     * Check if app is installed
     */
    checkInstallationStatus() {
        // Check if running in standalone mode (installed)
        this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;

        console.log('📱 PWA: Installation status:', this.isInstalled ? 'Installed' : 'Not installed');
    }

    /**
     * Show install prompt
     */
    async showInstallPrompt() {
        if (!this.deferredPrompt) {
            console.warn('⚠️ PWA: No install prompt available');
            return false;
        }

        try {
            this.deferredPrompt.prompt();
            const choiceResult = await this.deferredPrompt.userChoice;

            if (choiceResult.outcome === 'accepted') {
                console.log('✅ PWA: User accepted installation');
                return true;
            } else {
                console.log('❌ PWA: User declined installation');
                return false;
            }
        } catch (error) {
            console.error('❌ PWA: Install prompt failed:', error);
            return false;
        } finally {
            this.deferredPrompt = null;
        }
    }

    /**
     * Check if app can be installed
     */
    canInstall() {
        return !!this.deferredPrompt;
    }

    /**
     * Check if app is installed
     */
    isAppInstalled() {
        return this.isInstalled;
    }

    /**
     * Check if app is online
     */
    isAppOnline() {
        return this.isOnline;
    }

    /**
     * Update service worker
     */
    async updateServiceWorker() {
        if (!this.serviceWorkerRegistration) {
            console.warn('⚠️ PWA: No service worker registration found');
            return false;
        }

        try {
            await this.serviceWorkerRegistration.update();
            console.log('✅ PWA: Service worker updated');
            return true;
        } catch (error) {
            console.error('❌ PWA: Service worker update failed:', error);
            return false;
        }
    }

    /**
     * Skip waiting for service worker
     */
    async skipWaiting() {
        if (!this.serviceWorkerRegistration || !this.serviceWorkerRegistration.waiting) {
            console.warn('⚠️ PWA: No waiting service worker found');
            return false;
        }

        try {
            this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            console.log('✅ PWA: Service worker skip waiting sent');
            return true;
        } catch (error) {
            console.error('❌ PWA: Skip waiting failed:', error);
            return false;
        }
    }

    /**
     * Get PWA information
     */
    getPWAInfo() {
        return {
            canInstall: this.canInstall(),
            isInstalled: this.isAppInstalled(),
            isOnline: this.isAppOnline(),
            hasServiceWorker: !!this.serviceWorkerRegistration,
            userAgent: navigator.userAgent,
            displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
        };
    }

    /**
     * Show offline notification
     */
    showOfflineNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Greep SDS - Offline', {
                body: 'You are currently offline. Some features may be limited.',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                tag: 'offline-notification'
            });
        }
    }

    /**
     * Show online notification
     */
    showOnlineNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Greep SDS - Online', {
                body: 'You are back online. All features are now available.',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                tag: 'online-notification'
            });
        }
    }

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('⚠️ PWA: Notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            console.warn('⚠️ PWA: Notifications denied');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('❌ PWA: Notification permission request failed:', error);
            return false;
        }
    }

    /**
     * Show push notification
     */
    showPushNotification(title, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const defaultOptions = {
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                tag: 'greep-sds-notification',
                requireInteraction: false,
                silent: false,
                ...options
            };

            return new Notification(title, defaultOptions);
        }
        return null;
    }

    /**
     * Show message notification with preview
     */
    showMessageNotification(senderName, message, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const title = `💬 Message from ${senderName}`;
            const body = message.length > 100 ? message.substring(0, 100) + '...' : message;

            const defaultOptions = {
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                tag: 'driver-message',
                requireInteraction: false,
                silent: false,
                data: {
                    type: 'message',
                    senderName,
                    message
                },
                ...options
            };

            const notification = new Notification(title, {
                ...defaultOptions,
                body
            });

            // Auto-close after 5 seconds unless it's an emergency
            if (!options.requireInteraction) {
                setTimeout(() => {
                    notification.close();
                }, 5000);
            }

            return notification;
        }
        return null;
    }

    /**
     * Subscribe to push notifications
     */
    async subscribeToPushNotifications() {
        if (!this.serviceWorkerRegistration) {
            console.warn('⚠️ PWA: No service worker registration found');
            return null;
        }

        try {
            const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.getVapidPublicKey()
            });

            console.log('✅ PWA: Push subscription successful');
            return subscription;
        } catch (error) {
            console.error('❌ PWA: Push subscription failed:', error);
            return null;
        }
    }

    /**
     * Get VAPID public key
     */
    getVapidPublicKey() {
        // Use environment variable or fallback to generated key
        return process.env.REACT_APP_VAPID_PUBLIC_KEY || 'BKacvFsgtpXRrlQeFd2Z2GBKZaH9uY22mty86opoWMDWQcCjLV2rBcbGpt1U9XTshEayUO1NClABVPXH31gROm0';
    }

    /**
     * Unsubscribe from push notifications
     */
    async unsubscribeFromPushNotifications() {
        if (!this.serviceWorkerRegistration) {
            return false;
        }

        try {
            const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                console.log('✅ PWA: Push unsubscription successful');
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ PWA: Push unsubscription failed:', error);
            return false;
        }
    }

    /**
     * Get current push subscription
     */
    async getPushSubscription() {
        if (!this.serviceWorkerRegistration) {
            return null;
        }

        try {
            return await this.serviceWorkerRegistration.pushManager.getSubscription();
        } catch (error) {
            console.error('❌ PWA: Failed to get push subscription:', error);
            return null;
        }
    }

    /**
     * Add to home screen (iOS)
     */
    showAddToHomeScreenPrompt() {
        // This is a custom implementation for iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;

        if (isIOS && !isInStandaloneMode) {
            // Show custom iOS add to home screen prompt
            return true;
        }

        return false;
    }

    /**
     * Get app version from service worker
     */
    async getAppVersion() {
        if (!this.serviceWorkerRegistration) {
            return null;
        }

        try {
            return new Promise((resolve) => {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data.version);
                };

                this.serviceWorkerRegistration.active?.postMessage(
                    { type: 'GET_VERSION' },
                    [messageChannel.port2]
                );
            });
        } catch (error) {
            console.error('❌ PWA: Failed to get app version:', error);
            return null;
        }
    }
}

// Create singleton instance
const pwaService = new PWAService();

export default pwaService;
