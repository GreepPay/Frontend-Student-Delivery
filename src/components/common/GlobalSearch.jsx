import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    MagnifyingGlassIcon,
    TruckIcon,
    UserIcon,
    ChartBarIcon,
    BellIcon,
    CogIcon,
    CurrencyDollarIcon,
    XMarkIcon,
    CommandLineIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

const GlobalSearch = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const modalRef = useRef(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Search categories based on user role
    const searchCategories = useMemo(() => user?.role === 'admin' ? [
        {
            id: 'deliveries',
            name: 'Deliveries',
            icon: TruckIcon,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            items: [
                { id: 'all-deliveries', name: 'All Deliveries', path: '/admin/deliveries', description: 'View and manage all deliveries' },
                { id: 'pending-deliveries', name: 'Pending Deliveries', path: '/admin/deliveries?status=pending', description: 'Deliveries awaiting assignment' },
                { id: 'assigned-deliveries', name: 'Assigned Deliveries', path: '/admin/deliveries?status=assigned', description: 'Deliveries assigned to drivers' },
                { id: 'picked-up-deliveries', name: 'Picked Up Deliveries', path: '/admin/deliveries?status=picked_up', description: 'Deliveries picked up by drivers' },
                { id: 'delivered-deliveries', name: 'Delivered', path: '/admin/deliveries?status=delivered', description: 'Completed deliveries' },
                { id: 'cancelled-deliveries', name: 'Cancelled Deliveries', path: '/admin/deliveries?status=cancelled', description: 'Cancelled deliveries' },
                { id: 'create-delivery', name: 'Create New Delivery', path: '/admin/deliveries?action=create', description: 'Add a new delivery' }
            ]
        },
        {
            id: 'drivers',
            name: 'Drivers',
            icon: UserIcon,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            items: [
                { id: 'all-drivers', name: 'All Drivers', path: '/admin/drivers', description: 'View and manage all drivers' },
                { id: 'active-drivers', name: 'Active Drivers', path: '/admin/drivers?status=active', description: 'Currently active drivers' },
                { id: 'suspended-drivers', name: 'Suspended Drivers', path: '/admin/drivers?status=suspended', description: 'Suspended drivers' },
                { id: 'add-driver', name: 'Add New Driver', path: '/admin/drivers?action=add', description: 'Register a new driver' }
            ]
        },
        {
            id: 'analytics',
            name: 'Analytics',
            icon: ChartBarIcon,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            items: [
                { id: 'dashboard', name: 'Dashboard', path: '/admin/dashboard', description: 'Overview and key metrics' },
                { id: 'analytics-page', name: 'Analytics', path: '/admin/analytics', description: 'Detailed analytics and reports' },
                { id: 'earnings-management', name: 'Earnings Management', path: '/admin/earnings', description: 'Manage driver earnings and payments' }
            ]
        },
        {
            id: 'notifications',
            name: 'Notifications',
            icon: BellIcon,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            items: [
                { id: 'all-notifications', name: 'All Notifications', path: '/admin/notifications', description: 'View all system notifications' },
                { id: 'unread-notifications', name: 'Unread Notifications', path: '/admin/notifications?filter=unread', description: 'Unread notifications' },
                { id: 'urgent-notifications', name: 'Urgent Notifications', path: '/admin/notifications?filter=urgent', description: 'High priority notifications' }
            ]
        },
        {
            id: 'remittance',
            name: 'Remittance',
            icon: CurrencyDollarIcon,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            items: [
                { id: 'remittance-page', name: 'Remittance Management', path: '/admin/remittance', description: 'Manage driver remittances' },
                { id: 'pending-remittances', name: 'Pending Remittances', path: '/admin/remittance?status=pending', description: 'Pending remittance requests' },
                { id: 'completed-remittances', name: 'Completed Remittances', path: '/admin/remittance?status=completed', description: 'Completed remittances' }
            ]
        },
        {
            id: 'settings',
            name: 'Settings',
            icon: CogIcon,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
            items: [
                { id: 'system-settings', name: 'System Settings', path: '/admin/settings', description: 'Configure system parameters' },
                { id: 'profile-settings', name: 'Profile Settings', path: '/admin/profile', description: 'Manage your profile' },
                { id: 'admin-management', name: 'Admin Management', path: '/admin/management', description: 'Manage admin accounts' }
            ]
        }
    ] : [
        {
            id: 'deliveries',
            name: 'My Deliveries',
            icon: TruckIcon,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            items: [
                { id: 'my-deliveries', name: 'My Deliveries', path: '/driver/deliveries', description: 'View your assigned deliveries' },
                { id: 'pending-deliveries', name: 'Pending Deliveries', path: '/driver/deliveries?status=pending', description: 'Deliveries awaiting pickup' },
                { id: 'active-deliveries', name: 'Active Deliveries', path: '/driver/deliveries?status=assigned', description: 'Currently active deliveries' },
                { id: 'completed-deliveries', name: 'Completed Deliveries', path: '/driver/deliveries?status=delivered', description: 'Completed deliveries' }
            ]
        },
        {
            id: 'earnings',
            name: 'Earnings',
            icon: CurrencyDollarIcon,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            items: [
                { id: 'earnings-page', name: 'Earnings Overview', path: '/driver/earnings', description: 'View your earnings and statistics' },
                { id: 'earnings-history', name: 'Earnings History', path: '/driver/earnings?tab=history', description: 'Historical earnings data' },
                { id: 'remittance-page', name: 'Remittance', path: '/driver/remittance', description: 'Request and track remittances' }
            ]
        },
        {
            id: 'notifications',
            name: 'Notifications',
            icon: BellIcon,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            items: [
                { id: 'all-notifications', name: 'All Notifications', path: '/driver/notifications', description: 'View all notifications' },
                { id: 'unread-notifications', name: 'Unread Notifications', path: '/driver/notifications?filter=unread', description: 'Unread notifications' }
            ]
        },
        {
            id: 'profile',
            name: 'Profile',
            icon: UserIcon,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            items: [
                { id: 'profile-page', name: 'Profile Settings', path: '/driver/profile', description: 'Manage your profile and settings' },
                { id: 'dashboard', name: 'Dashboard', path: '/driver/dashboard', description: 'Your delivery dashboard' }
            ]
        }
    ], [user?.role]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Search functionality
    const performSearch = useCallback((searchQuery) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        const query = searchQuery.toLowerCase();
        const allResults = [];

        searchCategories.forEach(category => {
            category.items.forEach(item => {
                if (item.name.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query) ||
                    category.name.toLowerCase().includes(query)) {
                    allResults.push({
                        ...item,
                        category: category.name,
                        categoryIcon: category.icon,
                        categoryColor: category.color,
                        categoryBgColor: category.bgColor
                    });
                }
            });
        });

        setResults(allResults);
        setSelectedIndex(0);
    }, [searchCategories]);

    useEffect(() => {
        performSearch(query);
    }, [query, performSearch]);

    // Handle result selection
    const handleResultSelect = (result) => {
        navigate(result.path);
        setIsOpen(false);
        setQuery('');
        setResults([]);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results.length > 0) {
            e.preventDefault();
            handleResultSelect(results[selectedIndex]);
        }
    };

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        }
    }, [isOpen]);

    // Close modal when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm transition-opacity" />

                <div
                    ref={modalRef}
                    className="relative w-full max-w-3xl transform rounded-2xl bg-white shadow-2xl border border-gray-100 transition-all duration-300 ease-out"
                >
                    {/* Search Input */}
                    <div className="flex items-center p-6 border-b border-gray-100">
                        <div className="flex items-center flex-1 bg-gray-50 rounded-xl px-4 py-3 transition-all duration-200 hover:bg-gray-100">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-3" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search for deliveries, drivers, analytics, settings..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 border-none outline-none text-lg bg-transparent placeholder-gray-500 focus:ring-0 focus:outline-none"
                            />
                        </div>
                        <div className="flex items-center space-x-3 ml-4">
                            <div className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
                                <CommandLineIcon className="h-3 w-3" />
                                <span>K</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-96 overflow-y-auto">
                        {query && results.length === 0 && (
                            <div className="p-8 text-center">
                                <div className="flex flex-col items-center space-y-3">
                                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                        <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No results found</h3>
                                        <p className="text-gray-500">Try searching with different keywords</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!query && (
                            <div className="p-6">
                                <div className="mb-6">
                                    <div className="flex items-center mb-4">
                                        <SparklesIcon className="h-5 w-5 text-blue-500 mr-2" />
                                        <h3 className="text-lg font-semibold text-gray-900">Quick Access</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {searchCategories.slice(0, 4).map(category => (
                                            <button
                                                key={category.id}
                                                onClick={() => navigate(category.items[0].path)}
                                                className="group flex items-center p-4 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
                                            >
                                                <div className={`p-2 rounded-lg ${category.bgColor} mr-3 group-hover:scale-105 transition-transform`}>
                                                    <category.icon className={`h-5 w-5 ${category.color}`} />
                                                </div>
                                                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{category.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {results.map((result, index) => (
                            <button
                                key={result.id}
                                onClick={() => handleResultSelect(result)}
                                className={`w-full p-4 text-left transition-all duration-200 ${index === selectedIndex
                                    ? 'bg-blue-50 border-l-4 border-blue-500'
                                    : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <div className={`p-3 rounded-xl ${result.categoryBgColor} mr-4 shadow-sm`}>
                                        <result.categoryIcon className={`h-6 w-6 ${result.categoryColor}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-semibold text-gray-900">{result.name}</h4>
                                            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                                                {result.category}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">{result.description}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-2">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                    <span>↑↓ Navigate</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                    <span>Enter Select</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                    <span>Esc Close</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-700">{results.length}</span>
                                <span className="text-sm text-gray-500">result{results.length !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch; 