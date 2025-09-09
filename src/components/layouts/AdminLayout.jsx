import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdmin } from '../../utils/userHelpers';
import SimpleNotifications from '../admin/SimpleNotifications';
import Avatar from '../common/Avatar';
import GlobalSearch from '../common/GlobalSearch';
import MultiDriverMessaging from '../common/MultiDriverMessaging';
import PWAInstallButton from '../common/PWAInstallButton';
import PWAStatus from '../common/PWAStatus';
import PWANotification from '../common/PWANotification';
import PWAUpdateNotification from '../common/PWAUpdateNotification';
import {
    ChartBarIcon,
    TruckIcon,
    UserGroupIcon,
    UserCircleIcon,
    HomeIcon,
    ChevronDownIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
    XMarkIcon,
    DocumentTextIcon,
    DocumentMagnifyingGlassIcon,
    BellIcon,
    Bars3Icon,
    GiftIcon,
    TrophyIcon
} from '@heroicons/react/24/outline';

const AdminLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: HomeIcon },
        { name: 'Deliveries', href: '/admin/deliveries', icon: TruckIcon },
        { name: 'Drivers', href: '/admin/drivers', icon: UserGroupIcon },
        { name: 'Document Verification', href: '/admin/documents', icon: DocumentMagnifyingGlassIcon },
        { name: 'Analytics', href: '/admin/enhanced-analytics', icon: ChartBarIcon },
        { name: 'Leaderboard', href: '/admin/leaderboard', icon: TrophyIcon },
        { name: 'Referral Rewards', href: '/admin/referral-rewards', icon: GiftIcon },
        { name: 'Notifications', href: '/admin/notifications', icon: BellIcon },
        // Only show remittances for super admins
        ...(isSuperAdmin(user) ? [{ name: 'Remittances', href: '/admin/remittances', icon: DocumentTextIcon }] : []),
        // Only show settings for super admins
        ...(isSuperAdmin(user) ? [{ name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon }] : []),
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    // Updated isActive logic for better path matching
    const isActive = (path) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(path);
    };

    return (
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
                        <h1 className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold text-gray-900">Admin Panel</h1>
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
                                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${active
                                        ? 'bg-green-100 text-green-700 border-r-2 border-green-500'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
                            {/* Admin Messaging */}
                            <MultiDriverMessaging />

                            {/* Notifications */}
                            <SimpleNotifications />

                            {/* User menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <Avatar user={user} size="sm" />
                                    <div className="hidden sm:block text-left">
                                        <div className="text-sm font-medium text-gray-900">
                                            {user?.name || 'Admin User'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {user?.email || 'admin@example.com'}
                                        </div>
                                    </div>
                                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                </button>

                                {/* User dropdown */}
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                        <Link
                                            to="/admin/profile"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <UserCircleIcon className="mr-3 h-4 w-4" />
                                            Profile
                                        </Link>
                                        {isSuperAdmin(user) && (
                                            <Link
                                                to="/admin/settings"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <Cog6ToothIcon className="mr-3 h-4 w-4" />
                                                Settings
                                            </Link>
                                        )}
                                        <hr className="my-1" />
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
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
                        {children}
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

            {/* PWA Install Button */}
            <PWAInstallButton variant="floating" />
            <PWAUpdateNotification />

            {/* PWA Status (for development/debugging) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-4 left-4 z-50 hidden md:block">
                    <PWAStatus showDetails={false} />
                </div>
            )}
        </div>
    );
};

export default AdminLayout; 