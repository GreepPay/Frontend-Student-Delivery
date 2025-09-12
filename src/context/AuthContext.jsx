import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import socketService from '../services/socketService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Global flag to prevent multiple initializations across component re-mounts
let globalInitialized = false;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionWarning, setSessionWarning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const navigate = useNavigate();

    // Session timeout settings (7 days)
    const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const WARNING_TIME = 60 * 60 * 1000; // 1 hour warning

    // Define protected routes that should not trigger logout redirects
    const isProtectedRoute = useCallback((path) => {
        const protectedPaths = [
            '/verify-otp',
            '/admin',
            '/driver',
            '/test-otp' // Include test routes
        ];
        return protectedPaths.some(protectedPath => path.startsWith(protectedPath));
    }, []);

    const isSessionValid = useCallback(() => {
        const token = localStorage.getItem('token');
        const lastActivity = localStorage.getItem('lastActivity');

        if (!token) return false;

        // If no lastActivity timestamp, create one (for existing sessions)
        if (!lastActivity) {
            console.log('🔄 No lastActivity found, creating new timestamp');
            localStorage.setItem('lastActivity', Date.now().toString());
            return true;
        }

        const now = Date.now();
        const timeSinceLastActivity = now - parseInt(lastActivity);

        // Add buffer time to prevent edge case logouts
        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
        const isValid = timeSinceLastActivity < (SESSION_TIMEOUT + bufferTime);

        console.log('🕒 Session validation:', {
            timeSinceLastActivity: Math.round(timeSinceLastActivity / (1000 * 60)), // minutes
            sessionTimeout: Math.round(SESSION_TIMEOUT / (1000 * 60)), // minutes
            isValid
        });

        return isValid;
    }, [SESSION_TIMEOUT]);

    const updateLastActivity = useCallback(() => {
        localStorage.setItem('lastActivity', Date.now().toString());
    }, []);

    // Verify token with backend
    const verifyTokenWithBackend = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return false;

        try {
            const response = await apiService.verifyToken();
            return response.success;
        } catch (error) {
            console.log('🔒 Token verification failed:', error);
            return false;
        }
    }, []);

    // Restore session from localStorage with enhanced validation
    const restoreSession = useCallback(async () => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (!savedToken || !savedUser) {
            console.log('ℹ️ No saved session found');
            return false;
        }

        try {
            const userData = JSON.parse(savedUser);
            console.log('🔄 Attempting to restore session for:', userData.email);

            // Check if session is valid locally first
            if (!isSessionValid()) {
                console.log('⏰ Session expired locally');
                return false;
            }

            // Verify token with backend (with fallback for offline)
            try {
                const tokenValid = await verifyTokenWithBackend();
                if (!tokenValid) {
                    console.log('🔒 Token verification failed');
                    return false;
                }
            } catch (error) {
                console.log('⚠️ Token verification failed (network issue or missing endpoint), proceeding with local validation');
                // Continue with local validation if backend is unreachable or endpoint is missing
                // This prevents hard refresh logouts when the verify-token endpoint doesn't exist
            }

            // Restore the session
            setUser(userData);
            setIsAuthenticated(true);
            updateLastActivity();

            console.log('✅ Session restored successfully');
            return true;
        } catch (error) {
            console.error('❌ Error restoring session:', error);
            return false;
        }
    }, [isSessionValid, verifyTokenWithBackend, updateLastActivity]);

    const resetInactivityTimer = useCallback(() => {
        updateLastActivity();
        setSessionWarning(false);
        setTimeLeft(0);
    }, [updateLastActivity]);

    const logout = useCallback((showToast = true, forceRedirect = false) => {
        console.log('🚪 Logout called');

        // Disconnect socket
        try {
            socketService.disconnect();
            console.log('🔌 Socket disconnected');
        } catch (error) {
            console.warn('⚠️ Socket disconnection failed:', error);
        }

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('lastActivity');
        localStorage.removeItem('driverProfile'); // Clear saved profile data
        setUser(null);
        setIsAuthenticated(false);
        setSessionWarning(false);
        setTimeLeft(0);

        // Reset global flag to allow re-initialization on next login
        globalInitialized = false;

        const currentPath = window.location.pathname;
        const shouldRedirect = forceRedirect || !isProtectedRoute(currentPath);

        console.log('🚪 Current path:', currentPath);
        console.log('🚪 Is protected route:', isProtectedRoute(currentPath));
        console.log('🚪 Force redirect:', forceRedirect);
        console.log('🚪 Should redirect:', shouldRedirect);

        if (shouldRedirect) {
            console.log('🚪 Redirecting to login');
            navigate('/');
        } else {
            console.log('🚪 Not redirecting - user is on protected page');
        }

        if (showToast) {
            toast.success('Logged out successfully');
        }
    }, [navigate, isProtectedRoute]);

    const login = useCallback(async (email, otp, userType) => {
        try {
            console.log(`🔑 Logging in with OTP for ${email} as ${userType}`);

            const response = await apiService.verifyOTP(email, userType, otp);

            console.log('✅ Login successful:', response);

            const { user: userData, token } = response.data || response;

            if (!token || !userData) {
                console.error('❌ Missing token or user data');
                throw new Error('Invalid response from server');
            }

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            updateLastActivity();

            setUser(userData);
            setIsAuthenticated(true);

            // Initialize socket connection for real-time features
            if (userData._id) {
                try {
                    console.log('🔌 Attempting to connect socket for user:', userData._id, 'type:', userData.userType || userData.role);
                    socketService.connect(userData._id, userData.userType || userData.role);

                    // Verify connection was established
                    setTimeout(() => {
                        if (socketService.isConnected()) {
                            console.log('✅ Socket connection verified for user:', userData._id);
                        } else {
                            console.error('❌ Socket connection failed for user:', userData._id);
                            // Try to reconnect
                            console.log('🔄 Attempting socket reconnection...');
                            socketService.connect(userData._id, userData.userType || userData.role);
                        }
                    }, 1000);
                } catch (error) {
                    console.warn('⚠️ Socket initialization failed:', error);
                }
            }

            console.log('✅ Auth state updated successfully');

            return userData;
        } catch (error) {
            console.error('❌ Login failed:', error);
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    }, [updateLastActivity]);

    const sendOTP = useCallback(async (email, userType) => {
        try {
            console.log(`📧 Sending OTP to ${email} for ${userType}`);

            const response = await apiService.sendOTP(email, userType);

            console.log('✅ OTP sent successfully');
            return response;
        } catch (error) {
            console.error('❌ Failed to send OTP:', error);
            throw new Error(error.response?.data?.message || 'Failed to send OTP');
        }
    }, []);

    // Function to update profile data
    const updateProfile = useCallback((profileData) => {
        console.log('🔄 Updating profile data in AuthContext:', profileData);
        setProfile(profileData);

        // Also update user object with profile image if available
        if (profileData?.profileImage && user) {
            setUser(prevUser => ({
                ...prevUser,
                profileImage: profileData.profileImage
            }));
        }
    }, [user]);

    // PWA visibility change handler
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && isAuthenticated) {
                console.log('📱 PWA became active, updating activity timestamp');
                updateLastActivity();

                // Also verify session is still valid when app becomes active
                if (!isSessionValid()) {
                    console.log('⚠️ Session expired while app was inactive, logging out');
                    logout(false, true);
                }
            }
        };

        const handleFocus = () => {
            if (isAuthenticated) {
                console.log('📱 App focused, updating activity timestamp');
                updateLastActivity();
            }
        };

        const handleBeforeUnload = () => {
            if (isAuthenticated) {
                console.log('📱 App closing, updating activity timestamp');
                updateLastActivity();
            }
        };

        // Handle custom logout events from API service
        const handleAuthLogout = (event) => {
            console.log('🔒 Received auth-logout event:', event.detail);
            logout(false, true); // Don't show toast, force redirect
        };

        // Listen for PWA visibility changes and custom logout events
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('auth-logout', handleAuthLogout);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('auth-logout', handleAuthLogout);
        };
    }, [isAuthenticated, updateLastActivity, isSessionValid, logout]);

    // Initialize session once on mount - using global flag to prevent duplicates
    useEffect(() => {
        if (globalInitialized) {
            setIsLoading(false);
            return;
        }

        const initializeSession = async () => {
            console.log('🔄 Initializing auth session (ONCE)...');
            globalInitialized = true; // Set global flag immediately

            // Use the new restoreSession function
            const sessionRestored = await restoreSession();
            if (sessionRestored) {
                console.log('🔄 Session restored, updating activity timestamp');

                // Initialize socket connection for restored session
                const userData = JSON.parse(localStorage.getItem('user'));
                if (userData && userData._id) {
                    try {
                        console.log('🔌 Attempting to connect socket for restored session:', userData._id, 'type:', userData.userType || userData.role);
                        socketService.connect(userData._id, userData.userType || userData.role);

                        // Verify connection was established
                        setTimeout(() => {
                            if (socketService.isConnected()) {
                                console.log('✅ Socket connection verified for restored session:', userData._id);
                            } else {
                                console.error('❌ Socket connection failed for restored session:', userData._id);
                                // Try to reconnect
                                console.log('🔄 Attempting socket reconnection for restored session...');
                                socketService.connect(userData._id, userData.userType || userData.role);
                            }
                        }, 1000);
                    } catch (error) {
                        console.warn('⚠️ Socket initialization failed for restored session:', error);
                    }
                }
            } else {
                console.log('ℹ️ No valid session found');
                // Clear any invalid data but don't redirect if on protected route
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('lastActivity');
            }

            setIsLoading(false);
        };

        initializeSession();
    }, [restoreSession]); // Include dependencies

    // Session timeout monitoring with improved logic
    useEffect(() => {
        if (!isAuthenticated || !globalInitialized) return;

        console.log('🕒 Starting session timeout monitoring...');

        const checkSessionTimeout = () => {
            const lastActivity = localStorage.getItem('lastActivity');
            const token = localStorage.getItem('token');

            if (!lastActivity || !token) {
                console.log('⏰ No session data found - logging out');
                logout(true, true);
                return;
            }

            const now = Date.now();
            const timeSinceLastActivity = now - parseInt(lastActivity);
            const remainingTime = SESSION_TIMEOUT - timeSinceLastActivity;

            // Add buffer time to prevent premature logouts
            const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

            if (remainingTime <= -bufferTime) {
                console.log('⏰ Session expired (with buffer) - logging out');
                logout(true, true); // Force redirect on session timeout
            } else if (remainingTime <= WARNING_TIME && !sessionWarning) {
                console.log('⚠️ Session warning - showing timeout warning');
                setSessionWarning(true);
                setTimeLeft(Math.ceil(remainingTime / 1000));
            }
        };

        // Check less frequently to reduce false positives
        const interval = setInterval(checkSessionTimeout, 60000); // Check every 1 minute
        return () => clearInterval(interval);
    }, [isAuthenticated, logout, sessionWarning, SESSION_TIMEOUT, WARNING_TIME]);

    // Activity listeners (optimized with better tracking)
    useEffect(() => {
        if (!isAuthenticated || !globalInitialized) return;

        const handleActivity = () => {
            resetInactivityTimer();
        };

        // Throttle activity updates to prevent excessive calls
        let lastUpdate = 0;
        const throttledHandleActivity = () => {
            const now = Date.now();
            if (now - lastUpdate > 30000) { // Update at most once per 30 seconds
                lastUpdate = now;
                handleActivity();
            }
        };

        // More comprehensive event list for better activity detection
        const events = [
            'mousedown', 'mousemove', 'keypress', 'keydown', 'scroll',
            'touchstart', 'touchmove', 'click', 'focus', 'blur'
        ];

        events.forEach(event => {
            document.addEventListener(event, throttledHandleActivity, true);
        });

        // Also track visibility changes to handle app switching
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                throttledHandleActivity();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, throttledHandleActivity, true);
            });
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isAuthenticated, resetInactivityTimer]);

    const value = {
        user,
        profile,
        isAuthenticated,
        isLoading,
        login,
        logout,
        sendOTP,
        updateProfile,
        sessionWarning,
        timeLeft,
        resetInactivityTimer
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};