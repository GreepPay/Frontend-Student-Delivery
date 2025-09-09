import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.authenticated = false;
        this.initialized = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect(userId, userType) {
        // Prevent multiple connections
        if (this.socket && this.connected) {
            console.log('🔌 SocketService: Already connected, skipping connection');
            return;
        }

        try {
            // Connect to Socket.IO server
            const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
            console.log('🔌 SocketService: Connecting to:', socketUrl);
            this.socket = io(socketUrl, {
                auth: {
                    userId,
                    userType
                },
                transports: ['websocket', 'polling'],
                timeout: 20000,
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000
            });

            this.setupEventListeners();
            this.connected = true;
            this.initialized = true;

            console.log('🔌 Socket connected:', { userId, userType });
        } catch (error) {
            console.error('Socket connection error:', error);
        }
    }

    setupEventListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('🔌 Socket connected successfully');
            this.connected = true;
            this.reconnectAttempts = 0;

            // Send explicit authentication event after connection
            if (this.socket.auth && this.socket.auth.userId) {
                console.log('🔌 Sending explicit authentication event:', {
                    userId: this.socket.auth.userId,
                    userType: this.socket.auth.userType
                });
                this.socket.emit('authenticate', {
                    userId: this.socket.auth.userId,
                    userType: this.socket.auth.userType
                });
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
            this.connected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('🔌 Socket connection error:', error);
            this.reconnectAttempts++;
            this.connected = false;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('🔌 Max reconnection attempts reached. Backend server may not be running.');
                console.error('🔌 Please ensure the backend server is running on the configured SOCKET_URL');
                // Stop trying to reconnect to avoid spam
                this.socket.disconnect();
            }
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('🔌 Socket reconnected after', attemptNumber, 'attempts');
            this.connected = true;
            this.reconnectAttempts = 0;

            // Re-authenticate after reconnection
            if (this.socket.auth && this.socket.auth.userId) {
                console.log('🔌 Re-authenticating after reconnection:', {
                    userId: this.socket.auth.userId,
                    userType: this.socket.auth.userType
                });
                this.socket.emit('authenticate', {
                    userId: this.socket.auth.userId,
                    userType: this.socket.auth.userType
                });
            }
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('🔌 Socket reconnection error:', error);
        });

        this.socket.on('reconnect_failed', () => {
            console.error('🔌 Socket reconnection failed');
        });

        // Listen for authentication confirmation
        this.socket.on('authentication-confirmed', (data) => {
            console.log('✅ Socket authentication confirmed:', data);
            this.authenticated = true;

            // Join admin room after authentication (only if not already in admin room)
            if ((data.userType === 'admin' || data.role === 'admin' || data.role === 'super_admin') &&
                (!data.rooms || !data.rooms.includes('admin'))) {
                console.log('🔌 Joining admin room...');
                this.socket.emit('join-admin-room');
            } else if (data.rooms && data.rooms.includes('admin')) {
                console.log('🔌 Already in admin room, skipping join');
            }
        });

        // Listen for authentication failure
        this.socket.on('authentication-failed', (error) => {
            console.error('❌ Socket authentication failed:', error);
            this.authenticated = false;
        });

        // Listen for real-time notifications
        this.socket.on('new-notification', (notification) => {
            // Check if this is a driver message that should go to messaging system
            const isDriverMessage = (
                notification.type === 'driver-message' ||
                notification.type === 'message' ||
                notification.senderType === 'driver' ||
                notification.message?.includes('Message from') ||
                notification.title?.includes('Message from') ||
                notification.message?.includes('💬') ||
                notification.message?.toLowerCase().includes('how low can you go') ||
                notification.message?.toLowerCase().includes('are you sur') ||
                notification.message?.toLowerCase().includes('hello') ||
                notification.message?.toLowerCase().includes('hey') ||
                notification.message?.toLowerCase().includes('test message')
            );

            if (isDriverMessage) {
                console.log('📱 Driver message notification - routing to messaging system:', notification);
                // Add a flag to indicate this should go to messaging
                notification._routeToMessaging = true;
            } else {
                console.log('📱 New notification received:', notification);
            }
        });

        // Listen for delivery broadcasts
        this.socket.on('delivery-broadcast', (delivery) => {
            console.log('🚚 New delivery broadcast received:', delivery);
        });

        // Listen for toast notifications
        this.socket.on('toast-notification', (toast) => {
            // Skip driver message toasts - they should go to messaging system, not notifications
            if (toast.toastType === 'driver-message' ||
                toast.toastMessage?.includes('Message from') ||
                toast.toastMessage?.toLowerCase().includes('how low can you go') ||
                toast.toastMessage?.toLowerCase().includes('are you sur') ||
                toast.toastMessage?.toLowerCase().includes('hello') ||
                toast.toastMessage?.toLowerCase().includes('hey') ||
                toast.toastMessage?.toLowerCase().includes('test message')) {
                console.log('🍞 Skipping driver message toast:', toast);
                return;
            }
            console.log('🍞 Toast notification received:', toast);
        });

        // Listen for driver status updates
        this.socket.on('driver-status-updated', (status) => {
            console.log('👤 Driver status updated:', status);
        });

        // Listen for delivery status changes
        this.socket.on('delivery-status-changed', (delivery) => {
            console.log('📦 Delivery status changed:', delivery);
        });

        // Listen for broadcast updates
        this.socket.on('broadcast-updated', (broadcast) => {
            console.log('📡 Broadcast updated:', broadcast);
        });

        // Listen for broadcast removal
        this.socket.on('broadcast-removed', (broadcastId) => {
            console.log('🗑️ Broadcast removed:', broadcastId);
        });

        // Listen for system status updates
        this.socket.on('system-status', (status) => {
            console.log('⚙️ System status update:', status);
        });

        // Listen for connection status updates
        this.socket.on('connection-status', (status) => {
            console.log('🔌 Connection status update:', status);
            this.connected = status.connected;
        });

        // Listen for remittance notifications
        this.socket.on('remittance-created', (remittance) => {
            console.log('💰 New remittance created:', remittance);
            this.playNotificationSound();
        });

        // Listen for remittance status updates
        this.socket.on('remittance-status-updated', (remittance) => {
            console.log('💰 Remittance status updated:', remittance);
            this.playNotificationSound();
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            this.authenticated = false;
            this.initialized = false;
            console.log('🔌 Socket disconnected');
        }
    }

    // Check if socket is authenticated
    isAuthenticated() {
        return this.authenticated && this.connected && this.socket?.connected;
    }

    // Join admin room manually
    joinAdminRoom() {
        if (this.socket && this.connected) {
            console.log('🔌 Manually joining admin room...');
            this.socket.emit('join-admin-room');
        } else {
            console.warn('🔌 Cannot join admin room - socket not connected');
        }
    }

    emit(event, data) {
        if (this.socket && this.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn('Socket not connected, cannot emit:', event);
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    // Play notification sound
    playNotificationSound() {
        try {
            // Create audio context for notification sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);

            console.log('🔊 Notification sound played');
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    }

    // Driver-specific methods
    updateDriverStatus(status) {
        this.emit('driver:status', { status });
    }

    updateDriverLocation(location) {
        this.emit('driver:location', location);
    }

    // Admin-specific methods
    requestDriverStatus() {
        this.emit('admin:request-driver-status');
    }

    // Get socket instance for direct access
    getSocket() {
        return this.socket;
    }

    // Check if socket is initialized
    isInitialized() {
        return this.initialized;
    }

    // Force socket initialization if not already done
    ensureInitialized(userId, userType) {
        if (!this.initialized && userId && userType) {
            this.connect(userId, userType);
        }
        return this.initialized;
    }

    // Check connection status
    isConnected() {
        // If socket is not initialized, consider it as not connected yet
        if (!this.initialized || !this.socket) {
            return false;
        }
        return this.connected && this.socket.connected;
    }

    // Alternative method name for consistency
    isSocketConnected() {
        return this.connected && this.socket?.connected;
    }

    // Manual authentication method
    authenticate(userId, userType) {
        if (this.socket && this.connected) {
            console.log('🔌 Manual authentication:', { userId, userType });
            this.socket.emit('authenticate', { userId, userType });
            return true;
        } else {
            console.warn('🔌 Cannot authenticate: socket not connected');
            return false;
        }
    }

    // Force re-authentication
    reAuthenticate() {
        if (this.socket && this.socket.auth) {
            console.log('🔌 Re-authenticating socket...');
            this.socket.emit('authenticate', {
                userId: this.socket.auth.userId,
                userType: this.socket.auth.userType
            });
            return true;
        } else {
            console.warn('🔌 Cannot re-authenticate: no auth data available');
            return false;
        }
    }
}

// Create singleton instance
const socketService = new SocketService();

// Export socket instance for direct access
export const socket = socketService.getSocket();

export default socketService;
export { socketService }; 