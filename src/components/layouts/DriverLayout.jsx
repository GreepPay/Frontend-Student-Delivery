import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationsDropdown from '../driver/NotificationsDropdown';
import Avatar from '../common/Avatar';
import SoundPermissionModal from '../common/SoundPermissionModal';
import NotificationPermissionModal from '../common/NotificationPermissionModal';
import NotificationEnforcer from '../common/NotificationEnforcer';
import GlobalSearch from '../common/GlobalSearch';
import DriverMessageToAdmin from '../driver/DriverMessageToAdmin';
import PointsNotification from '../common/PointsNotification';
import usePointsNotification from '../../hooks/usePointsNotification';
import { useNotificationPermission } from '../../hooks/useNotificationPermission';
import PWAInstallButton from '../common/PWAInstallButton';
import PWAStatus from '../common/PWAStatus';
import PWANotification from '../common/PWANotification';
import PWAUpdateNotification from '../common/PWAUpdateNotification';
import apiService from '../../services/api';
import {
    TruckIcon,
    UserCircleIcon,
    HomeIcon,
    CurrencyDollarIcon,
    XMarkIcon,
    ChevronDownIcon,
    ArrowRightOnRectangleIcon,
    DocumentTextIcon,
    BellIcon,
    Bars3Icon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import socketService from '../../services/socketService';
import { capitalizeName } from '../../utils/nameUtils';
import VerifiedBadge from '../common/VerifiedBadge';
import { isDriverVerified } from '../../utils/verificationHelpers';

// Create context for driver status
const DriverStatusContext = createContext();

// Create context for points notifications
const PointsNotificationContext = createContext();

// Hook to use driver status
export const useDriverStatus = () => {
    const context = useContext(DriverStatusContext);
    if (!context) {
        throw new Error('useDriverStatus must be used within DriverLayout');
    }
    return context;
};

// Hook to use points notifications
export const usePointsNotificationContext = () => {
    const context = useContext(PointsNotificationContext);
    if (!context) {
        throw new Error('usePointsNotificationContext must be used within DriverLayout');
    }
    return context;
};

const DriverLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [showSoundPermission, setShowSoundPermission] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    const [socketAuthenticated, setSocketAuthenticated] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, profile, logout, updateProfile } = useAuth();
    const pointsNotification = usePointsNotification();
    const { notification, hidePointsNotification } = pointsNotification;

    // Notification permission management
    const {
        showModal: showNotificationModal,
        hideModal: hideNotificationModal,
        handlePermissionGranted: onNotificationPermissionGranted
    } = useNotificationPermission('driver', 'medium');

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    // Load driver profile data
    const loadDriverProfile = useCallback(async () => {
        if (!user?.id) return;

        try {
            console.log('🔄 Loading driver profile data...');
            const data = await apiService.getDriverProfile();

            if (data.success && data.data) {
                console.log('✅ Driver profile loaded:', data.data);
                console.log('🔍 Profile structure:', {
                    profileImage: data.data.profileImage,
                    profilePicture: data.data.profilePicture,
                    fullName: data.data.profile?.personalDetails?.fullName,
                    personalDetails: data.data.profile?.personalDetails,
                    profile: data.data.profile
                });
                updateProfile(data.data);
            } else {
                console.warn('⚠️ Failed to load driver profile:', data);
            }
        } catch (error) {
            console.error('❌ Error loading driver profile:', error);
        }
    }, [user?.id, updateProfile]);

    const loadDriverStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');

            console.log('🔍 Loading driver status from database...');

            const response = await fetch(`${API_BASE_URL}/driver/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Profile API response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('📊 Profile API result:', result);

                if (result.success && result.data) {
                    // Check multiple possible field names for status
                    let statusValue = null;

                    if (result.data.isOnline !== undefined) {
                        statusValue = result.data.isOnline;
                    } else if (result.data.status !== undefined) {
                        statusValue = result.data.status === 'active';
                    } else if (result.data.profile?.status !== undefined) {
                        statusValue = result.data.profile.status === 'active';
                    }

                    console.log('📊 Driver status value:', statusValue);
                    // Only update if we got a valid status value, otherwise keep current state
                    if (statusValue !== null && statusValue !== undefined) {
                        setIsOnline(statusValue);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error loading driver status:', error);
        }
    }, [API_BASE_URL]);

    // Load profile and status on mount
    useEffect(() => {
        loadDriverProfile();
        loadDriverStatus();
    }, [loadDriverProfile, loadDriverStatus]);

    // Monitor socket connection status
    useEffect(() => {
        const checkSocketStatus = () => {
            const connected = socketService.isConnected();
            const authenticated = socketService.isAuthenticated();
            setSocketConnected(connected);
            setSocketAuthenticated(authenticated);
            console.log('🔌 Socket status:', { connected, authenticated });
        };

        // Check immediately
        checkSocketStatus();

        // Check every 30 seconds (reduced frequency to prevent API spam)
        const interval = setInterval(checkSocketStatus, 30000);

        return () => clearInterval(interval);
    }, []);

    const navigation = [
        { name: 'Dashboard', href: '/driver', icon: HomeIcon },
        { name: 'Broadcast', href: '/driver/broadcasts', icon: TruckIcon },
        { name: 'My Deliveries', href: '/driver/deliveries', icon: TruckIcon },
        { name: 'Earnings', href: '/driver/earnings', icon: CurrencyDollarIcon },
        { name: 'Referrals', href: '/driver/referrals', icon: UserGroupIcon },
        { name: 'Remittances', href: '/driver/remittances', icon: DocumentTextIcon },
        { name: 'Notifications', href: '/driver/notifications', icon: BellIcon },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const isActive = (path) => {
        if (path === '/driver') {
            return location.pathname === '/driver';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <DriverStatusContext.Provider value={{ isOnline, setIsOnline }}>
            <PointsNotificationContext.Provider value={pointsNotification}>
                <div className="flex h-screen bg-gray-50">
                    {/* Mobile sidebar overlay */}
                    {sidebarOpen && (
                        <div className="fixed inset-0 z-50 lg:hidden">
                            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                        </div>
                    )}

                    {/* Sidebar */}
                    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                        <div className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-gray-200 bg-white">
                            <div className="flex items-center">
                                <img
                                    src="/icons/White.png"
                                    alt="Student Delivery Logo"
                                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-xl shadow-lg"
                                />
                                <h1 className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold text-gray-900">Driver Panel</h1>
                            </div>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>
                        </div>

                        <nav className="flex-1 mt-6 sm:mt-8 px-3 sm:px-4 overflow-y-auto">
                            <div className="space-y-1 sm:space-y-2">
                                {navigation.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${active
                                                ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-r-2 border-green-500 shadow-sm'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                        >
                                            <Icon className={`mr-3 h-5 w-5 ${active ? 'text-green-600' : 'text-gray-400'}`} />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </nav>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Top navigation */}
                        <header className="bg-white shadow-sm border-b border-gray-200">
                            <div className="flex items-center justify-between h-16 px-4 sm:px-6">
                                {/* Mobile menu button */}
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                                >
                                    <Bars3Icon className="h-6 w-6" />
                                </button>

                                {/* Search bar - visible on all devices */}
                                <div className="flex flex-1 max-w-lg mx-4">
                                    <GlobalSearch />
                                </div>



                                {/* Right side */}
                                <div className="flex items-center space-x-2 sm:space-x-4">
                                    {/* Socket Connection Status */}
                                    {/* <div className="flex items-center space-x-1">
                                        <div className={`w-2 h-2 rounded-full ${socketAuthenticated ? 'bg-green-500' : socketConnected ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                    </div> */}

                                    {/* Driver Messaging */}
                                    <DriverMessageToAdmin />

                                    {/* Notifications */}
                                    <NotificationsDropdown />

                                    {/* User menu */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <Avatar
                                                className="border-2 border-primary-200 shadow-lg"
                                                user={{
                                                    name: profile?.fullName || profile?.name || user?.name || 'Driver',
                                                    profileImage: profile?.profileImage || profile?.profilePicture || user?.profileImage,
                                                    email: user?.email
                                                }}
                                                size="sm"
                                                showVerifiedBadge={true}
                                            />
                                            <div className="hidden sm:block text-left">
                                                <div className="flex items-center space-x-2">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {capitalizeName(profile?.fullName || profile?.name || user?.name || 'Driver')}
                                                    </div>
                                                    {(() => {
                                                        const verified = isDriverVerified(user || profile);
                                                        console.log('🔍 Header verification status:', {
                                                            verified,
                                                            user: user?.id,
                                                            profile: profile?.id,
                                                            userVerification: user?.verification,
                                                            profileVerification: profile?.verification,
                                                            userStatus: user?.status,
                                                            profileStatus: profile?.status
                                                        });
                                                        return (
                                                            <VerifiedBadge
                                                                isVerified={verified}
                                                                size="xs"
                                                            />
                                                        );
                                                    })()}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {user?.email || 'aguntawisdom@gmail.com'}
                                                </div>
                                            </div>
                                            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                        </button>

                                        {/* User dropdown */}
                                        {userMenuOpen && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                                <button
                                                    onClick={() => {
                                                        navigate('/driver/profile');
                                                        setUserMenuOpen(false);
                                                    }}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                >
                                                    <UserCircleIcon className="mr-3 h-4 w-4" />
                                                    Profile Settings
                                                </button>
                                                <hr className="my-1" />
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                                                >
                                                    <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                                                    Logout
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Main content area */}
                        <main className="flex-1 overflow-y-auto">
                            <div className="p-4 sm:p-6">
                                <NotificationEnforcer
                                    context="driver"
                                    enforcementLevel="medium"
                                    showWarning={true}
                                >
                                    {children}
                                </NotificationEnforcer>
                            </div>
                        </main>
                    </div>

                    {/* Close user menu when clicking outside */}
                    {userMenuOpen && (
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setUserMenuOpen(false)}
                        />
                    )}



                    {/* Sound Permission Modal */}
                    <SoundPermissionModal
                        isOpen={showSoundPermission}
                        onClose={() => setShowSoundPermission(false)}
                        onAllow={() => {
                            setShowSoundPermission(false);
                            // Handle sound permission allowance
                        }}
                    />

                    {/* Notification Permission Modal */}
                    <NotificationPermissionModal
                        isOpen={showNotificationModal}
                        onClose={hideNotificationModal}
                        onPermissionGranted={onNotificationPermissionGranted}
                        forceShow={false}
                        title="Enable Push Notifications"
                        description="Stay updated with delivery assignments and important updates even when the app is closed."
                    />

                    {/* Points Notification */}
                    <PointsNotification
                        points={notification.points}
                        reason={notification.reason}
                        isVisible={notification.isVisible}
                        onClose={hidePointsNotification}
                    />

                    {/* PWA Install Button */}
                    <PWAInstallButton variant="floating" />
                    <PWAUpdateNotification />

                    {/* PWA Status (for development/debugging) */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="fixed bottom-4 left-4 z-50">
                            <PWAStatus showDetails={false} />
                        </div>
                    )}

                </div>
            </PointsNotificationContext.Provider>
        </DriverStatusContext.Provider>
    );
};

export default DriverLayout; 