import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
    MagnifyingGlassIcon,
    CommandIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    EnterIcon,
    EscapeIcon,
    HomeIcon,
    UserGroupIcon,
    TruckIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    BellIcon,
    CogIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    QuestionMarkCircleIcon,
    InformationCircleIcon,
    UserIcon,
    TrophyIcon,
    DocumentMagnifyingGlassIcon,
    MegaphoneIcon,
    CommandLineIcon,
    XMarkIcon,
    ClockIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

const GlobalSearch = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [recentSearches, setRecentSearches] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef(null);
    const modalRef = useRef(null);
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    // Debug authentication state
    useEffect(() => {
        console.log('🔍 GlobalSearch - Auth state:', { user, isAuthenticated });
    }, [user, isAuthenticated]);

    // Listen for custom event to open global search - always attach listener regardless of auth state
    useEffect(() => {
        const handleOpenGlobalSearch = () => {
            console.log('🔍 GlobalSearch: Received open-global-search event');
            if (isAuthenticated && user) {
                setIsOpen(true);
            } else {
                console.log('🔍 GlobalSearch: Search blocked - user not authenticated');
                toast.error('Please log in to use search');
            }
        };

        window.addEventListener('open-global-search', handleOpenGlobalSearch);

        return () => {
            window.removeEventListener('open-global-search', handleOpenGlobalSearch);
        };
    }, [isAuthenticated, user]);

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('globalSearchRecent');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (error) {
                console.warn('Failed to load recent searches:', error);
            }
        }
    }, []);

    // Save recent searches to localStorage
    const saveRecentSearch = useCallback((searchTerm) => {
        if (!searchTerm.trim()) return;

        const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('globalSearchRecent', JSON.stringify(updated));
    }, [recentSearches]);

    // Get search suggestions based on current query
    const getSearchSuggestions = useCallback((currentQuery) => {
        if (!currentQuery.trim()) return [];

        const suggestions = [];
        const query = currentQuery.toLowerCase();

        // Add recent searches that match
        recentSearches.forEach(search => {
            if (search.toLowerCase().includes(query) && !suggestions.includes(search)) {
                suggestions.push(search);
            }
        });

        // Add common search terms
        const commonTerms = [
            'deliveries', 'drivers', 'earnings', 'remittance', 'referrals',
            'notifications', 'profile', 'analytics', 'leaderboard', 'documents',
            'broadcasts', 'dashboard', 'settings', 'reports', 'payments'
        ];

        commonTerms.forEach(term => {
            if (term.includes(query) && !suggestions.includes(term)) {
                suggestions.push(term);
            }
        });

        return suggestions.slice(0, 5);
    }, [recentSearches]);

    // Search categories based on user role
    const searchCategories = useMemo(() => {
        const userRole = user?.role || user?.userType;
        console.log('🔍 User role for search:', userRole);

        if (userRole === 'admin' || userRole === 'super_admin') {
            return [
                {
                    id: 'dashboard',
                    name: 'Dashboard',
                    icon: ChartBarIcon,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                    items: [
                        { id: 'admin-dashboard', name: 'Admin Dashboard', path: '/admin', description: 'Overview and key metrics' },
                        { id: 'enhanced-dashboard', name: 'Enhanced Dashboard', path: '/admin/enhanced-dashboard', description: 'Advanced dashboard with real-time data' },
                        { id: 'driver-dashboard', name: 'Driver Dashboard', path: '/driver', description: 'Driver overview and metrics' }
                    ]
                },
                {
                    id: 'deliveries',
                    name: 'Deliveries',
                    icon: TruckIcon,
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
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
                    color: 'text-purple-600',
                    bgColor: 'bg-purple-50',
                    items: [
                        { id: 'all-drivers', name: 'All Drivers', path: '/admin/drivers', description: 'View and manage all drivers' },
                        { id: 'active-drivers', name: 'Active Drivers', path: '/admin/drivers?status=active', description: 'Currently active drivers' },
                        { id: 'suspended-drivers', name: 'Suspended Drivers', path: '/admin/drivers?status=suspended', description: 'Suspended drivers' },
                        { id: 'add-driver', name: 'Add New Driver', path: '/admin/drivers?action=add', description: 'Register a new driver' },
                        { id: 'driver-activation', name: 'Driver Activation', path: '/driver-activation', description: 'Activate new driver accounts' }
                    ]
                },
                {
                    id: 'analytics',
                    name: 'Analytics',
                    icon: ChartBarIcon,
                    color: 'text-indigo-600',
                    bgColor: 'bg-indigo-50',
                    items: [
                        { id: 'analytics-page', name: 'Analytics', path: '/admin/analytics', description: 'Detailed analytics and reports' },
                        { id: 'enhanced-analytics', name: 'Enhanced Analytics', path: '/admin/enhanced-analytics', description: 'Advanced analytics with real-time data' },
                        { id: 'earnings-management', name: 'Earnings Management', path: '/admin/earnings', description: 'Manage driver earnings and payments' }
                    ]
                },
                {
                    id: 'leaderboard',
                    name: 'Leaderboard',
                    icon: TrophyIcon,
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-50',
                    items: [
                        { id: 'leaderboard-page', name: 'Platform Leaderboard', path: '/admin/leaderboard', description: 'View top performers and rankings' },
                        { id: 'overall-champions', name: 'Overall Champions', path: '/admin/leaderboard?category=overall', description: 'Overall performance rankings' },
                        { id: 'delivery-masters', name: 'Delivery Masters', path: '/admin/leaderboard?category=deliveries', description: 'Top delivery performers' },
                        { id: 'top-earners', name: 'Top Earners', path: '/admin/leaderboard?category=earnings', description: 'Highest earning drivers' },
                        { id: 'speed-demons', name: 'Speed Demons', path: '/admin/leaderboard?category=speed', description: 'Fastest delivery drivers' },
                        { id: 'referral-kings', name: 'Referral Kings', path: '/admin/leaderboard?category=referrals', description: 'Top referral performers' }
                    ]
                },
                {
                    id: 'remittance',
                    name: 'Remittance',
                    icon: CurrencyDollarIcon,
                    color: 'text-emerald-600',
                    bgColor: 'bg-emerald-50',
                    items: [
                        { id: 'remittance-page', name: 'Remittance Management', path: '/admin/remittances', description: 'Manage driver remittances' },
                        { id: 'pending-remittances', name: 'Pending Remittances', path: '/admin/remittances?status=pending', description: 'Pending remittance requests' },
                        { id: 'completed-remittances', name: 'Completed Remittances', path: '/admin/remittances?status=completed', description: 'Completed remittances' },
                        { id: 'cancelled-remittances', name: 'Cancelled Remittances', path: '/admin/remittances?status=cancelled', description: 'Cancelled remittances' },
                        { id: 'bulk-remittance', name: 'Bulk Generate Remittances', path: '/admin/remittances?action=bulk', description: 'Generate remittances for all drivers' }
                    ]
                },
                {
                    id: 'documents',
                    name: 'Documents',
                    icon: DocumentMagnifyingGlassIcon,
                    color: 'text-red-600',
                    bgColor: 'bg-red-50',
                    items: [
                        { id: 'document-verification', name: 'Document Verification', path: '/admin/documents', description: 'Verify driver documents and licenses' },
                        { id: 'pending-documents', name: 'Pending Documents', path: '/admin/documents?status=pending', description: 'Documents awaiting verification' },
                        { id: 'approved-documents', name: 'Approved Documents', path: '/admin/documents?status=approved', description: 'Approved driver documents' },
                        { id: 'rejected-documents', name: 'Rejected Documents', path: '/admin/documents?status=rejected', description: 'Rejected driver documents' }
                    ]
                },
                {
                    id: 'referrals',
                    name: 'Referrals',
                    icon: UserGroupIcon,
                    color: 'text-pink-600',
                    bgColor: 'bg-pink-50',
                    items: [
                        { id: 'referral-rewards', name: 'Referral Rewards', path: '/admin/referral-rewards', description: 'Manage referral rewards and bonuses' },
                        { id: 'referral-leaderboard', name: 'Referral Leaderboard', path: '/admin/referral-rewards?tab=leaderboard', description: 'Top referral performers' },
                        { id: 'referral-settings', name: 'Referral Settings', path: '/admin/referral-rewards?tab=settings', description: 'Configure referral program' }
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
                        { id: 'urgent-notifications', name: 'Urgent Notifications', path: '/admin/notifications?filter=urgent', description: 'High priority notifications' },
                        { id: 'broadcast-notifications', name: 'Broadcast Messages', path: '/admin/notifications?type=broadcast', description: 'System broadcast messages' }
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
                        { id: 'admin-management', name: 'Admin Management', path: '/admin/management', description: 'Manage admin accounts' },
                        { id: 'user-management', name: 'User Management', path: '/admin/management?tab=users', description: 'Manage all user accounts' }
                    ]
                }
            ];
        } else {
            return [
                {
                    id: 'dashboard',
                    name: 'Dashboard',
                    icon: ChartBarIcon,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                    items: [
                        { id: 'driver-dashboard', name: 'Driver Dashboard', path: '/driver', description: 'Your delivery dashboard and overview' },
                        { id: 'earnings-dashboard', name: 'Earnings Dashboard', path: '/driver/earnings', description: 'View your earnings and statistics' }
                    ]
                },
                {
                    id: 'deliveries',
                    name: 'My Deliveries',
                    icon: TruckIcon,
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                    items: [
                        { id: 'my-deliveries', name: 'My Deliveries', path: '/driver/deliveries', description: 'View your assigned deliveries' },
                        { id: 'pending-deliveries', name: 'Pending Deliveries', path: '/driver/deliveries?status=pending', description: 'Deliveries awaiting pickup' },
                        { id: 'active-deliveries', name: 'Active Deliveries', path: '/driver/deliveries?status=assigned', description: 'Currently active deliveries' },
                        { id: 'completed-deliveries', name: 'Completed Deliveries', path: '/driver/deliveries?status=delivered', description: 'Completed deliveries' },
                        { id: 'cancelled-deliveries', name: 'Cancelled Deliveries', path: '/driver/deliveries?status=cancelled', description: 'Cancelled deliveries' }
                    ]
                },
                {
                    id: 'broadcasts',
                    name: 'Available Deliveries',
                    icon: MegaphoneIcon,
                    color: 'text-purple-600',
                    bgColor: 'bg-purple-50',
                    items: [
                        { id: 'broadcast-page', name: 'Available Deliveries', path: '/driver/broadcasts', description: 'View available delivery broadcasts' },
                        { id: 'nearby-deliveries', name: 'Nearby Deliveries', path: '/driver/broadcasts?filter=nearby', description: 'Deliveries near your location' },
                        { id: 'urgent-deliveries', name: 'Urgent Deliveries', path: '/driver/broadcasts?filter=urgent', description: 'High priority deliveries' }
                    ]
                },
                {
                    id: 'earnings',
                    name: 'Earnings & Remittance',
                    icon: CurrencyDollarIcon,
                    color: 'text-emerald-600',
                    bgColor: 'bg-emerald-50',
                    items: [
                        { id: 'earnings-page', name: 'Earnings Overview', path: '/driver/earnings', description: 'View your earnings and statistics' },
                        { id: 'earnings-history', name: 'Earnings History', path: '/driver/earnings?tab=history', description: 'Historical earnings data' },
                        { id: 'earnings-analytics', name: 'Earnings Analytics', path: '/driver/earnings?tab=analytics', description: 'Detailed earnings analysis' },
                        { id: 'remittance-page', name: 'Remittance', path: '/driver/remittances', description: 'Request and track remittances' },
                        { id: 'pending-remittances', name: 'Pending Remittances', path: '/driver/remittances?status=pending', description: 'Your pending remittance requests' },
                        { id: 'completed-remittances', name: 'Completed Remittances', path: '/driver/remittances?status=completed', description: 'Your completed remittances' }
                    ]
                },
                {
                    id: 'referrals',
                    name: 'Referrals & Rewards',
                    icon: UserGroupIcon,
                    color: 'text-pink-600',
                    bgColor: 'bg-pink-50',
                    items: [
                        { id: 'referral-page', name: 'Referral Program', path: '/driver/referrals', description: 'Manage your referral program' },
                        { id: 'referral-code', name: 'My Referral Code', path: '/driver/referrals?tab=code', description: 'Share your referral code' },
                        { id: 'referral-history', name: 'Referral History', path: '/driver/referrals?tab=history', description: 'View your referral history' },
                        { id: 'points-rewards', name: 'Points & Rewards', path: '/driver/referrals?tab=points', description: 'Your points and rewards' },
                        { id: 'redeem-points', name: 'Redeem Points', path: '/driver/referrals?action=redeem', description: 'Redeem your earned points' }
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
                        { id: 'unread-notifications', name: 'Unread Notifications', path: '/driver/notifications?filter=unread', description: 'Unread notifications' },
                        { id: 'urgent-notifications', name: 'Urgent Notifications', path: '/driver/notifications?filter=urgent', description: 'High priority notifications' },
                        { id: 'delivery-notifications', name: 'Delivery Notifications', path: '/driver/notifications?type=delivery', description: 'Delivery-related notifications' }
                    ]
                },
                {
                    id: 'profile',
                    name: 'Profile & Settings',
                    icon: UserIcon,
                    color: 'text-indigo-600',
                    bgColor: 'bg-indigo-50',
                    items: [
                        { id: 'profile-page', name: 'Profile Settings', path: '/driver/profile', description: 'Manage your profile and settings' },
                        { id: 'personal-info', name: 'Personal Information', path: '/driver/profile?tab=personal', description: 'Update your personal details' },
                        { id: 'vehicle-info', name: 'Vehicle Information', path: '/driver/profile?tab=vehicle', description: 'Manage your vehicle details' },
                        { id: 'documents', name: 'Documents', path: '/driver/profile?tab=documents', description: 'Upload and manage documents' },
                        { id: 'preferences', name: 'Preferences', path: '/driver/profile?tab=preferences', description: 'Set your delivery preferences' }
                    ]
                }
            ];
        }
    }, [user]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                // Only open search if user is authenticated
                if (isAuthenticated && user) {
                    console.log('🔍 Opening search - user authenticated:', user);
                    setIsOpen(true);
                } else {
                    console.log('🔍 Search blocked - user not authenticated');
                    toast.error('Please log in to use search');
                }
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isAuthenticated, user]);

    // Search functionality with enhanced intelligence
    const performSearch = useCallback((searchQuery) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        const query = searchQuery.toLowerCase();
        const allResults = [];
        const queryWords = query.split(' ').filter(word => word.length > 0);

        // First, search through navigation items
        searchCategories.forEach(category => {
            category.items.forEach(item => {
                // Enhanced search logic
                const searchableText = [
                    item.name.toLowerCase(),
                    item.description.toLowerCase(),
                    category.name.toLowerCase(),
                    // Add common synonyms and keywords
                    ...(item.name.toLowerCase().includes('delivery') ? ['deliveries', 'package', 'order'] : []),
                    ...(item.name.toLowerCase().includes('driver') ? ['drivers', 'courier', 'delivery person'] : []),
                    ...(item.name.toLowerCase().includes('earnings') ? ['money', 'income', 'pay', 'salary'] : []),
                    ...(item.name.toLowerCase().includes('remittance') ? ['payment', 'cash', 'money transfer'] : []),
                    ...(item.name.toLowerCase().includes('referral') ? ['refer', 'invite', 'friend', 'bonus'] : []),
                    ...(item.name.toLowerCase().includes('notification') ? ['alert', 'message', 'update'] : []),
                    ...(item.name.toLowerCase().includes('profile') ? ['account', 'settings', 'personal'] : []),
                    ...(item.name.toLowerCase().includes('analytics') ? ['stats', 'statistics', 'reports', 'data'] : []),
                    ...(item.name.toLowerCase().includes('leaderboard') ? ['ranking', 'top', 'best', 'scores'] : []),
                    ...(item.name.toLowerCase().includes('document') ? ['documents', 'files', 'verification'] : []),
                    ...(item.name.toLowerCase().includes('broadcast') ? ['available', 'open', 'new'] : [])
                ].join(' ');

                // Check if all query words are found (AND logic)
                const allWordsFound = queryWords.every(word =>
                    searchableText.includes(word) ||
                    item.name.toLowerCase().includes(word) ||
                    item.description.toLowerCase().includes(word) ||
                    category.name.toLowerCase().includes(word)
                );

                // Check for exact matches (higher priority)
                const exactMatch = item.name.toLowerCase() === query ||
                    item.description.toLowerCase().includes(query) ||
                    category.name.toLowerCase() === query;

                // Check for partial matches
                const partialMatch = item.name.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query) ||
                    category.name.toLowerCase().includes(query);

                if (exactMatch || allWordsFound || partialMatch) {
                    allResults.push({
                        ...item,
                        category: category.name,
                        categoryIcon: category.icon,
                        categoryColor: category.color,
                        categoryBgColor: category.bgColor,
                        // Add relevance score for better sorting
                        relevanceScore: exactMatch ? 100 :
                            allWordsFound ? 80 :
                                partialMatch ? 60 : 40
                    });
                }
            });
        });

        // Then, try to search through delivery data stored locally
        if (user && (user.userType === 'admin' || user.role === 'admin')) {
            try {
                // Try to get deliveries from localStorage if available
                const storedDeliveries = localStorage.getItem('deliveries');
                if (storedDeliveries) {
                    const deliveries = JSON.parse(storedDeliveries);
                    if (Array.isArray(deliveries)) {
                        const matchingDeliveries = deliveries.filter(delivery => {
                            const deliveryText = [
                                delivery.deliveryCode || '',
                                delivery.customerName || '',
                                delivery.customerPhone || '',
                                delivery.pickupLocationDescription || delivery.pickupLocation || '',
                                delivery.deliveryLocationDescription || delivery.deliveryLocation || '',
                                delivery.status || '',
                                delivery.priority || ''
                            ].join(' ').toLowerCase();

                            return deliveryText.includes(query);
                        });

                        matchingDeliveries.forEach(delivery => {
                            allResults.push({
                                id: `delivery-${delivery._id || delivery.id}`,
                                name: `Delivery ${delivery.deliveryCode || 'Unknown'}`,
                                description: `${delivery.customerName || 'Unknown Customer'} • ${delivery.pickupLocationDescription || delivery.pickupLocation || 'Unknown Pickup'} → ${delivery.deliveryLocationDescription || delivery.deliveryLocation || 'Unknown Delivery'}`,
                                path: `/admin/deliveries?search=${delivery.deliveryCode || delivery._id}`,
                                category: '📦 Deliveries',
                                categoryIcon: TruckIcon,
                                categoryColor: 'text-blue-600',
                                categoryBgColor: 'bg-blue-50',
                                relevanceScore: 90,
                                type: 'delivery',
                                deliveryData: delivery
                            });
                        });
                    }
                }
            } catch (error) {
                console.error('🔍 Error searching local deliveries:', error);
            }
        }

        // Sort results by relevance score
        allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

        setResults(allResults);
        setSelectedIndex(0);
    }, [searchCategories, user]);

    useEffect(() => {
        performSearch(query);
    }, [query, performSearch]);

    // Handle result selection
    const handleResultSelect = (result) => {
        try {
            console.log('🔍 Navigating to:', result.path);

            // Define valid base paths for navigation (without query parameters)
            const validBasePaths = [
                // Admin routes
                '/admin',
                '/admin/deliveries',
                '/admin/drivers',
                '/admin/analytics',
                '/admin/enhanced-analytics',
                '/admin/enhanced-dashboard',
                '/admin/documents',
                '/admin/notifications',
                '/admin/remittances',
                '/admin/settings',
                '/admin/profile',
                '/admin/management',
                '/admin/earnings',
                '/admin/leaderboard',
                '/admin/referral-rewards',

                // Driver routes
                '/driver',
                '/driver/deliveries',
                '/driver/earnings',
                '/driver/remittances',
                '/driver/profile',
                '/driver/notifications',
                '/driver/referrals',
                '/driver/broadcasts',

                // Common routes
                '/driver-activation'
            ];

            // Extract the base path (without query parameters)
            const basePath = result.path.split('?')[0];

            if (validBasePaths.includes(basePath)) {
                // Save the search term to recent searches
                saveRecentSearch(query);
                navigate(result.path);
                setIsOpen(false);
                setQuery('');
                setResults([]);
                setShowSuggestions(false);
            } else {
                console.warn('🔍 Invalid path:', result.path, 'Base path:', basePath);
                toast.error('Invalid navigation path');
            }
        } catch (error) {
            console.error('🔍 Navigation error:', error);
            toast.error('Navigation failed');
        }
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

    // Don't render the search input if not authenticated, but keep the component mounted for event listeners
    if (!isAuthenticated || !user) {
        return <div className="flex-1 max-w-lg mx-4" />; // Return empty div to maintain layout
    }

    // Render the search input that's always visible
    return (
        <>
            {/* Visible Search Input */}
            <div className="relative flex-1 max-w-lg mx-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search..."
                        onClick={() => setIsOpen(true)}
                        readOnly
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                            <CommandLineIcon className="h-3 w-3" />
                            <span>K</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-start sm:items-center justify-center p-2 sm:p-4">
                        <div className="fixed inset-0 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm transition-opacity" />

                        <div
                            ref={modalRef}
                            className="relative w-full max-w-3xl transform rounded-2xl bg-white shadow-2xl border border-gray-100 transition-all duration-300 ease-out mt-4 sm:mt-0"
                        >
                            {/* Search Input */}
                            <div className="flex items-center p-4 sm:p-6 border-b border-gray-100">
                                <div className="flex items-center flex-1 bg-gray-50 rounded-xl px-3 sm:px-4 py-2 sm:py-3 transition-all duration-200 hover:bg-gray-100">
                                    <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="Search for deliveries, drivers, analytics, settings..."
                                        value={query}
                                        onChange={(e) => {
                                            setQuery(e.target.value);
                                            setShowSuggestions(e.target.value.length > 0);
                                        }}
                                        onKeyDown={handleKeyDown}
                                        onFocus={() => setShowSuggestions(query.length > 0)}
                                        className="flex-1 border-none outline-none text-base sm:text-lg bg-transparent placeholder-gray-500 focus:ring-0 focus:outline-none"
                                    />
                                </div>
                                <div className="flex items-center space-x-2 sm:space-x-3 ml-2 sm:ml-4">
                                    <div className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
                                        <CommandLineIcon className="h-3 w-3" />
                                        <span>K</span>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Search Suggestions */}
                            {showSuggestions && query.length > 0 && results.length === 0 && (
                                <div className="p-3 sm:p-4 border-b border-gray-100">
                                    <div className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">Suggestions:</div>
                                    <div className="space-y-1 sm:space-y-2">
                                        {getSearchSuggestions(query).map((suggestion, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    setQuery(suggestion);
                                                    setShowSuggestions(false);
                                                }}
                                                className="flex items-center w-full p-2 text-left text-xs sm:text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <MagnifyingGlassIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-2" />
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Searches */}
                            {!query && recentSearches.length > 0 && (
                                <div className="p-3 sm:p-4 border-b border-gray-100">
                                    <div className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">Recent searches:</div>
                                    <div className="space-y-1 sm:space-y-2">
                                        {recentSearches.map((search, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setQuery(search)}
                                                className="flex items-center w-full p-2 text-left text-xs sm:text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-2" />
                                                {search}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Results */}
                            <div className="max-h-96 overflow-y-auto">
                                {query && results.length === 0 && (
                                    <div className="p-6 sm:p-8 text-center">
                                        <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                                <MagnifyingGlassIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">No results found</h3>
                                                <p className="text-sm sm:text-base text-gray-500">Try searching with different keywords</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!query && (
                                    <div className="p-4 sm:p-6">
                                        <div className="mb-4 sm:mb-6">
                                            <div className="flex items-center mb-3 sm:mb-4">
                                                <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mr-2" />
                                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Quick Access</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                                {searchCategories.slice(0, 4).map(category => (
                                                    <button
                                                        key={category.id}
                                                        onClick={() => {
                                                            navigate(category.items[0].path);
                                                            setIsOpen(false);
                                                        }}
                                                        className="group flex items-center p-3 sm:p-4 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
                                                    >
                                                        <div className={`p-1.5 sm:p-2 rounded-lg ${category.bgColor} mr-2 sm:mr-3 group-hover:scale-105 transition-transform`}>
                                                            <category.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${category.color}`} />
                                                        </div>
                                                        <span className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-gray-900">{category.name}</span>
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
                                        className={`w-full p-3 sm:p-4 text-left transition-all duration-200 ${index === selectedIndex
                                            ? 'bg-blue-50 border-l-4 border-blue-500'
                                            : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <div className={`p-2 sm:p-3 rounded-xl ${result.categoryBgColor} mr-3 sm:mr-4 shadow-sm`}>
                                                <result.categoryIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${result.categoryColor}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{result.name}</h4>
                                                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex-shrink-0 ml-2">
                                                        {result.category}
                                                    </span>
                                                </div>
                                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{result.description}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-gray-100 p-3 sm:p-4 bg-gray-50 rounded-b-2xl">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                    <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-600">
                                        <div className="flex items-center space-x-1 sm:space-x-2">
                                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-400 rounded-full"></div>
                                            <span>↑↓ Navigate</span>
                                        </div>
                                        <div className="flex items-center space-x-1 sm:space-x-2">
                                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-400 rounded-full"></div>
                                            <span>Enter Select</span>
                                        </div>
                                        <div className="flex items-center space-x-1 sm:space-x-2">
                                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-400 rounded-full"></div>
                                            <span>Esc Close</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center sm:justify-end space-x-2">
                                        <span className="text-xs sm:text-sm font-medium text-gray-700">{results.length}</span>
                                        <span className="text-xs sm:text-sm text-gray-500">result{results.length !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GlobalSearch; 