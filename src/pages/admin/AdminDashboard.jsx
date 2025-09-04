import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TruckIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    ClockIcon,
    ChartBarIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    ClipboardDocumentIcon,
    MegaphoneIcon,
    MagnifyingGlassIcon,
    TrophyIcon
} from '@heroicons/react/24/outline';
import { getDashboardData } from '../../services/dashboardService';
import apiService from '../../services/api';
import toast from 'react-hot-toast';
import socketService from '../../services/socketService';
import { validateLeaderboardData, calculateLeaderboardStats } from '../../utils/leaderboardValidator';
import { capitalizeName } from '../../utils/nameUtils';
import { isDriverVerified } from '../../utils/verificationHelpers';
import VerifiedBadge from '../../components/common/VerifiedBadge';
import { useSystemSettings } from '../../context/SystemSettingsContext';
import RealTimeDriverStatus from '../../components/admin/RealTimeDriverStatus';
import ReferralCodeTester from '../../components/admin/ReferralCodeTester';

import { DashboardSkeleton } from '../../components/common/SkeletonLoader';

const AdminDashboard = () => {
    const { formatCurrency } = useSystemSettings();
    const navigate = useNavigate();

    // Helper function to format payment method for display
    const formatPaymentMethod = (paymentMethod) => {
        if (!paymentMethod) return 'Payment method not specified';

        // Convert to lowercase for consistent comparison
        const method = paymentMethod.toLowerCase().trim();

        // Map common payment method values to user-friendly display names
        const paymentMethodMap = {
            'naira': 'Naira',
            'naira_transfer': 'Naira Transfer',
            'cash': 'Cash',
            'card': 'Card',
            'credit_card': 'Credit Card',
            'debit_card': 'Debit Card',
            'bank_transfer': 'Bank Transfer',
            'isbank_transfer': 'İşbank Transfer',
            'mobile_money': 'Mobile Money',
            'paypal': 'PayPal',
            'stripe': 'Stripe',
            'paystack': 'Paystack',
            'flutterwave': 'Flutterwave',
            'online': 'Online Payment'
        };

        // Return mapped value or capitalize the original
        return paymentMethodMap[method] || paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1);
    };

    // Helper function to get payment method icon
    const getPaymentMethodIcon = (paymentMethod) => {
        if (!paymentMethod) return null;

        const method = paymentMethod.toLowerCase().trim();

        // Map payment methods to appropriate icons
        const iconMap = {
            'naira': '₦',
            'naira_transfer': '₦',
            'cash': '💵',
            'card': '💳',
            'credit_card': '💳',
            'debit_card': '💳',
            'bank_transfer': '🏦',
            'isbank_transfer': '🏦',
            'mobile_money': '📱',
            'paypal': '🔵',
            'stripe': '💳',
            'paystack': '🔴',
            'flutterwave': '🟣',
            'online': '🌐'
        };

        const icon = iconMap[method];
        return icon ? (
            <span className="text-sm" title={formatPaymentMethod(paymentMethod)}>
                {icon}
            </span>
        ) : null;
    };
    const [dashboardData, setDashboardData] = useState(null);
    const [recentDeliveries, setRecentDeliveries] = useState([]);
    const [topDrivers, setTopDrivers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('today');
    const [isCopying, setIsCopying] = useState(false);
    const [showReferralTester, setShowReferralTester] = useState(false);

    // Copy leaderboard functionality
    const copyLeaderboardToClipboard = async () => {
        try {
            setIsCopying(true);

            console.log('📋 Copy function - topDrivers:', topDrivers);
            console.log('📋 Copy function - topDrivers length:', topDrivers.length);
            console.log('📋 Copy function - selectedPeriod:', selectedPeriod);

            if (topDrivers.length === 0) {
                toast.error('No driver data to copy');
                return;
            }

            const periodText = selectedPeriod === 'today' ? 'Today' :
                selectedPeriod === 'thisWeek' ? 'This Week' :
                    selectedPeriod === 'thisMonth' ? 'This Month' : 'All Time';

            let leaderboardText = `🏆 *Driver Leaderboard - ${periodText}*\n\n`;

            topDrivers.slice(0, 5).forEach((driver, index) => {
                const rank = index + 1;
                const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                const name = capitalizeName(driver.name || driver.fullNameComputed || 'Unknown Driver');
                const deliveries = driver.totalDeliveries || 0;
                const earnings = formatCurrency(driver.totalEarnings || 0);
                const avgEarnings = driver.avgEarningsPerDelivery ? `€${driver.avgEarningsPerDelivery}/delivery` : 'N/A';
                const rating = driver.rating || 'N/A';
                const avgTime = driver.avgDeliveryTime ? `${Math.round(driver.avgDeliveryTime)}m` : 'N/A';

                leaderboardText += `${rankEmoji} *${name}*\n`;
                leaderboardText += `📦 ${deliveries} deliveries | ⭐ ${rating} | ⏱️ ${avgTime}\n`;
                leaderboardText += `💰 ${earnings} (${avgEarnings})\n\n`;
            });

            leaderboardText += `📊 *Summary*\n`;
            leaderboardText += `Total Drivers: ${topDrivers.length}\n`;
            leaderboardText += `Total Earnings: ${formatCurrency(topDrivers.reduce((sum, driver) => sum + (driver.totalEarnings || 0), 0))}\n`;
            leaderboardText += `Total Deliveries: ${topDrivers.reduce((sum, driver) => sum + (driver.totalDeliveries || 0), 0)}\n\n`;
            leaderboardText += `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n\n`;
            leaderboardText += `📞 Need help? Contact us:\n`;
            leaderboardText += `WhatsApp: +90 533 832 97 85\n`;
            leaderboardText += `Instagram: @greepit`;

            await navigator.clipboard.writeText(leaderboardText);
            toast.success('Leaderboard copied to clipboard! Ready to share on WhatsApp');
        } catch (error) {
            console.error('Error copying leaderboard:', error);
            toast.error('Failed to copy leaderboard');
        } finally {
            setIsCopying(false);
        }
    };



    const loadDashboardData = async (silent = false) => {
        try {
            console.log('🔄 AdminDashboard: Loading dashboard data for period:', selectedPeriod, 'silent:', silent, 'at', new Date().toISOString());

            if (!silent) {
                setIsLoading(true);
            } else {
                setIsRefreshing(true);
            }

            console.log('🔄 AdminDashboard: Making single API call to get all dashboard data for period:', selectedPeriod);
            const dashboardResponse = await getDashboardData(selectedPeriod);

            console.log('✅ AdminDashboard: Dashboard data loaded successfully:', dashboardResponse);

            // Extract data from the response structure
            if (dashboardResponse && dashboardResponse.data) {
                const { analytics, recentDeliveries, topDrivers } = dashboardResponse.data;

                // Check if backend returned the correct period
                const backendPeriod = analytics?.period;
                if (backendPeriod && backendPeriod !== selectedPeriod) {
                    console.warn('⚠️ AdminDashboard: Backend returned wrong period!', {
                        requested: selectedPeriod,
                        received: backendPeriod
                    });
                    toast.error(`Backend returned ${backendPeriod} data instead of ${selectedPeriod}`);
                }

                console.log('📊 AdminDashboard: Extracted data:', {
                    analytics: analytics?.stats,
                    recentDeliveriesCount: recentDeliveries?.length || 0,
                    topDriversCount: topDrivers?.length || 0,
                    period: backendPeriod
                });

                // Set dashboard stats
                setDashboardData({
                    totalDeliveries: analytics?.stats?.totalDeliveries || 0,
                    activeDrivers: analytics?.stats?.activeDrivers || 0,
                    totalRevenue: analytics?.stats?.totalRevenue || 0,
                    pendingDeliveries: analytics?.stats?.pendingDeliveries || 0,
                    completedDeliveries: analytics?.stats?.completedDeliveries || 0,
                    totalDrivers: analytics?.stats?.totalDrivers || 0,
                    deliveryGrowth: '+0%',
                    driverGrowth: '+0%',
                    revenueGrowth: '+0%',
                    pendingGrowth: '+0%'
                });

                // Set recent deliveries
                setRecentDeliveries(recentDeliveries || []);

                // Get top drivers from the dedicated leaderboard API
                console.log('🏆 AdminDashboard: Fetching top drivers from leaderboard API');
                try {
                    const leaderboardResponse = await apiService.getLeaderboard('overall', selectedPeriod, 5);

                    if (leaderboardResponse.success && leaderboardResponse.data) {
                        const leaderboardData = leaderboardResponse.data.leaderboard || leaderboardResponse.data;

                        if (Array.isArray(leaderboardData)) {
                            console.log('✅ AdminDashboard: Leaderboard data received:', leaderboardData);

                            // Use the validator to ensure data consistency
                            const processedTopDrivers = validateLeaderboardData(leaderboardData);

                            console.log('🏆 AdminDashboard: Validated leaderboard drivers:', processedTopDrivers);
                            setTopDrivers(processedTopDrivers);
                        } else {
                            console.warn('⚠️ AdminDashboard: Invalid leaderboard data structure:', leaderboardData);
                            setTopDrivers([]);
                        }
                    } else {
                        console.warn('⚠️ AdminDashboard: Leaderboard API returned invalid response:', leaderboardResponse);
                        setTopDrivers([]);
                    }
                } catch (leaderboardError) {
                    console.error('❌ AdminDashboard: Error fetching leaderboard data:', leaderboardError);

                    // Try to use dashboard data as fallback
                    if (topDrivers && Array.isArray(topDrivers) && topDrivers.length > 0) {
                        console.log('🔄 AdminDashboard: Using dashboard data as fallback');
                        const processedTopDrivers = validateLeaderboardData(topDrivers);
                        setTopDrivers(processedTopDrivers);
                    } else {
                        console.log('⚠️ AdminDashboard: No fallback data available, setting empty array');
                        setTopDrivers([]);
                    }
                }
            } else {
                // Fallback to the old structure if needed
                setDashboardData(dashboardResponse);
                setRecentDeliveries([]);
                setTopDrivers([]);
            }
        } catch (error) {
            console.error('❌ AdminDashboard: Error loading dashboard data:', error);

            // Provide specific error feedback
            if (error.message?.includes('401')) {
                toast.error('Session expired. Please log in again.');
            } else if (error.message?.includes('403')) {
                toast.error('Access denied. Please contact support.');
            } else if (error.message?.includes('500')) {
                toast.error('Server error. Please try again later.');
            } else {
                toast.error('Failed to load dashboard data. Please check your connection.');
            }

            // Set fallback data to prevent UI from breaking
            setDashboardData({
                totalDeliveries: 0,
                activeDrivers: 0,
                totalRevenue: 0,
                pendingDeliveries: 0,
                completedDeliveries: 0,
                totalDrivers: 0,
                deliveryGrowth: '+0%',
                driverGrowth: '+0%',
                revenueGrowth: '+0%',
                pendingGrowth: '+0%'
            });
            setRecentDeliveries([]);
            setTopDrivers([]);
        } finally {
            if (!silent) {
                setIsLoading(false);
            } else {
                setIsRefreshing(false);
            }
        }
    };

    useEffect(() => {
        console.log('🔄 AdminDashboard: useEffect triggered for period:', selectedPeriod, 'at', new Date().toISOString());
        loadDashboardData();

        // Set up auto-refresh every 60 seconds (reduced from 30)
        const interval = setInterval(() => {
            console.log('🔄 AdminDashboard: Auto-refresh triggered for period:', selectedPeriod, 'at', new Date().toISOString());
            loadDashboardData(true); // Silent refresh
        }, 60000);

        return () => clearInterval(interval);
    }, [selectedPeriod]); // Changed dependency to selectedPeriod



    // Socket listener for real-time driver status updates
    useEffect(() => {
        const socket = socketService.getSocket();
        if (!socket || !socketService.isConnected()) {
            console.log('⚠️ AdminDashboard: Socket not available for real-time updates');
            return;
        }

        console.log('🔌 AdminDashboard: Setting up socket event listeners');

        const handleDriverStatusChanged = (data) => {
            console.log('🔄 AdminDashboard: Driver status changed, refreshing dashboard data:', data);
            // Refresh dashboard data when driver status changes
            loadDashboardData(true); // Silent refresh
        };

        const handleLeaderboardUpdate = (data) => {
            console.log('🏆 AdminDashboard: Leaderboard update received:', data);
            // Refresh leaderboard data specifically
            if (data.period === selectedPeriod) {
                loadDashboardData(true); // Silent refresh
            }
        };

        socket.on('driver-status-changed', handleDriverStatusChanged);
        socket.on('leaderboard-update', handleLeaderboardUpdate);

        return () => {
            if (socket) {
                console.log('🧹 AdminDashboard: Cleaning up socket event listeners');
                socket.off('driver-status-changed', handleDriverStatusChanged);
                socket.off('leaderboard-update', handleLeaderboardUpdate);
            }
        };
    }, [selectedPeriod]); // Added selectedPeriod dependency

    // Show skeleton loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4">
                    <DashboardSkeleton />
                </div>
            </div>
        );
    }

    const stats = [
        {
            title: 'Total Deliveries',
            value: dashboardData?.totalDeliveries?.toLocaleString() || '0',
            change: dashboardData?.deliveryGrowth || '+0%',
            icon: TruckIcon,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            description: 'All time deliveries',
            trend: 'up'
        },
        {
            title: 'Active Drivers',
            value: dashboardData?.activeDrivers?.toLocaleString() || '0',
            change: dashboardData?.driverGrowth || '+0%',
            icon: UserGroupIcon,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            description: 'Currently online',
            trend: 'up'
        },
        {
            title: 'Total Revenue',
            value: formatCurrency(dashboardData?.totalRevenue || 0),
            change: dashboardData?.revenueGrowth || '+0%',
            icon: CurrencyDollarIcon,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            description: 'Platform earnings',
            trend: 'up'
        },
        {
            title: 'Pending Deliveries',
            value: dashboardData?.pendingDeliveries?.toLocaleString() || '0',
            change: dashboardData?.pendingGrowth || '+0%',
            icon: ClockIcon,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            description: 'Awaiting assignment',
            trend: 'down'
        }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50';
            case 'in_progress': return 'text-blue-600 bg-blue-50';
            case 'pending': return 'text-yellow-600 bg-yellow-50';
            case 'cancelled': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircleIcon className="w-3 h-3" />;
            case 'in_progress': return <TruckIcon className="w-3 h-3" />;
            case 'pending': return <ClockIcon className="w-3 h-3" />;
            case 'cancelled': return <ExclamationTriangleIcon className="w-3 h-3" />;
            default: return <ClockIcon className="w-3 h-3" />;
        }
    };

    // const getTrendIcon = (trend) => { // Unused function
    //     if (trend === 'up') {
    //         return <ArrowUpIcon className="w-3 h-3 text-green-600" />;
    //     }
    //     return <ArrowDownIcon className="w-3 h-3 text-red-600" />;
    // };

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                {/* Subtle refresh indicator */}
                {isRefreshing && (
                    <div className="fixed top-0 left-0 right-0 z-50">
                        <div className="h-0.5 bg-gradient-to-r from-green-400 to-green-600 animate-pulse"></div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4">
                    {/* Header */}
                    <div className="mb-3 sm:mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                            <div>
                                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                                <p className="mt-0.5 text-xs text-gray-600">
                                    Monitor and manage your delivery platform •
                                    <span className="font-medium text-green-600 ml-1">
                                        {selectedPeriod === 'today' ? 'Today' :
                                            selectedPeriod === 'thisWeek' ? 'This Week' :
                                                selectedPeriod === 'thisMonth' ? 'This Month' :
                                                    selectedPeriod === 'allTime' ? 'All Time' : 'Today'}
                                    </span>
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => {
                                        const newPeriod = e.target.value;
                                        console.log('📊 AdminDashboard: Period changed from', selectedPeriod, 'to', newPeriod, 'at', new Date().toISOString());
                                        setSelectedPeriod(newPeriod);
                                        // The useEffect with selectedPeriod dependency will automatically trigger loadDashboardData()
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="today">Today</option>
                                    <option value="thisWeek">This Week</option>
                                    <option value="thisMonth">This Month</option>
                                    <option value="allTime">All Time</option>
                                </select>

                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                                        <div className={`p-1 sm:p-1.5 rounded-lg ${stat.bgColor}`}>
                                            <Icon className={`w-3 h-3 ${stat.color}`} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">{stat.change}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm font-bold text-gray-900">{stat.value}</p>
                                        <p className="text-xs text-gray-600 mt-0.5">{stat.title}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch">
                        {/* Enhanced Recent Deliveries */}
                        <div className="xl:col-span-2">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
                                <div className="px-3 py-2 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xs font-semibold text-gray-900">Live Delivery Activity</h2>
                                        <button
                                            onClick={() => navigate('/admin/deliveries')}
                                            className="text-xs text-green-600 hover:text-green-700 font-medium"
                                        >
                                            View all →
                                        </button>
                                    </div>
                                </div>
                                <div className="p-2 flex-1 flex flex-col">
                                    {recentDeliveries.length === 0 ? (
                                        <div className="text-center py-3 flex-1 flex items-center justify-center">
                                            <div>
                                                <TruckIcon className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                                                <p className="text-xs text-gray-500">No recent deliveries</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1 flex-1 overflow-y-auto">
                                            {recentDeliveries.slice(0, 6).map((delivery, index) => (
                                                <div key={delivery._id || delivery.id || `delivery-${index}`} className="flex items-start justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                                                    <div className="flex items-start space-x-2 min-w-0 flex-1">
                                                        <div className={`p-1 rounded-full flex-shrink-0 ${getStatusColor(delivery.status)}`}>
                                                            {getStatusIcon(delivery.status)}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <p className="text-xs font-medium text-gray-900 truncate">#{delivery.deliveryCode || delivery.id}</p>
                                                                {delivery.priority === 'high' && (
                                                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded-full flex-shrink-0">Priority</span>
                                                                )}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-xs text-gray-600 break-words leading-tight">
                                                                    <span className="font-medium">{delivery.customerName || 'Customer'}</span>
                                                                </p>
                                                                <p className="text-xs text-gray-500 break-words leading-tight truncate">
                                                                    📍 {delivery.pickupLocationDescription || delivery.pickupLocation || delivery.pickupAddress || delivery.pickup || 'Pickup location'}
                                                                </p>
                                                                <p className="text-xs text-gray-500 break-words leading-tight truncate">
                                                                    🎯 {delivery.deliveryLocationDescription || delivery.deliveryLocation || delivery.deliveryAddress || delivery.delivery || 'Delivery location'}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center space-x-2 mt-2 flex-wrap gap-1">
                                                                <span className="text-xs text-gray-500">
                                                                    {delivery.assignedTo ? `👤 ${delivery.assignedTo.name || delivery.assignedTo.fullNameComputed}` : '🚫 Unassigned'}
                                                                </span>
                                                                {delivery.estimatedTime && (
                                                                    <span className="text-xs text-gray-500">
                                                                        ⏱️ {delivery.estimatedTime}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right ml-2 flex-shrink-0">
                                                        <p className="text-xs font-bold text-gray-900">{formatCurrency(delivery.fee || delivery.amount)}</p>
                                                        <p className="text-xs text-gray-500 flex items-center justify-end space-x-1">
                                                            {getPaymentMethodIcon(delivery.paymentMethod)}
                                                            <span>{formatPaymentMethod(delivery.paymentMethod)}</span>
                                                        </p>
                                                        {delivery.createdAt && (
                                                            <p className="text-xs text-gray-400">
                                                                {new Date(delivery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Driver Status and Leaderboard */}
                        <div className="space-y-4">
                            {/* Real-time Driver Status */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <RealTimeDriverStatus />
                            </div>

                            {/* Leaderboard */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="px-3 py-2 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xs font-semibold text-gray-900">Top Drivers</h2>
                                        <div className="flex items-center space-x-1">
                                            <button
                                                onClick={copyLeaderboardToClipboard}
                                                disabled={isCopying}
                                                className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                                            >
                                                {isCopying ? 'Copying...' : 'Copy'}
                                            </button>
                                            <button
                                                onClick={() => loadDashboardData(false)}
                                                className="text-xs text-gray-500 hover:text-gray-700"
                                            >
                                                ↻
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2">
                                    {topDrivers.length === 0 ? (
                                        <div className="text-center py-3">
                                            <TrophyIcon className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                                            <p className="text-xs text-gray-500">No driver data available</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {topDrivers.slice(0, 5).map((driver, index) => {
                                                const getRankBadge = (rank) => {
                                                    switch (rank) {
                                                        case 0: return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '🥇' };
                                                        case 1: return { bg: 'bg-gray-100', text: 'text-gray-700', icon: '🥈' };
                                                        case 2: return { bg: 'bg-orange-100', text: 'text-orange-700', icon: '🥉' };
                                                        default: return { bg: 'bg-blue-100', text: 'text-blue-700', icon: `#${rank + 1}` };
                                                    }
                                                };

                                                const rankBadge = getRankBadge(index);
                                                const isOnline = driver.isOnline || driver.isActive;
                                                const points = driver.points || 0;
                                                const rating = driver.rating || 0;

                                                return (
                                                    <div key={driver._id || driver.id || `driver-${index}`} className="flex items-start justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                                                        <div className="flex items-start space-x-2 min-w-0 flex-1">
                                                            <div className={`w-6 h-6 ${rankBadge.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                                                                <span className="text-xs font-bold">{rankBadge.icon}</span>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center space-x-2 mb-1">
                                                                    <p className="text-xs font-medium text-gray-900 truncate">{capitalizeName(driver.name || driver.fullNameComputed)}</p>
                                                                    <VerifiedBadge
                                                                        isVerified={isDriverVerified(driver)}
                                                                        size="xs"
                                                                        className="flex-shrink-0"
                                                                    />
                                                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                                </div>
                                                                <div className="flex items-center space-x-2 flex-wrap gap-1">
                                                                    <span className="text-xs text-gray-600">
                                                                        📦 {driver.totalDeliveries || 0}
                                                                    </span>
                                                                    <span className="text-xs text-gray-600">
                                                                        ⭐ {rating.toFixed(1)}
                                                                    </span>
                                                                    {driver.avgDeliveryTime && (
                                                                        <span className="text-xs text-gray-600">
                                                                            ⏱️ {Math.round(driver.avgDeliveryTime)}m
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs font-semibold text-green-600">
                                                                        🏆 {points} pts
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right ml-2 flex-shrink-0">
                                                            <p className="text-xs font-bold text-gray-900">{formatCurrency(driver.totalEarnings)}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {driver.avgEarningsPerDelivery ? `€${driver.avgEarningsPerDelivery}/delivery` : 'N/A'}
                                                            </p>
                                                            {driver.achievements && driver.achievements.length > 0 && (
                                                                <div className="flex justify-end space-x-1 mt-1">
                                                                    {driver.achievements.slice(0, 2).map((achievement, idx) => (
                                                                        <span key={idx} className="text-xs bg-green-100 text-green-700 px-1 rounded">
                                                                            {achievement}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Section */}
                    <div className="mt-4">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="px-3 py-2 border-b border-gray-200">
                                <h2 className="text-xs font-semibold text-gray-900">Quick Actions</h2>
                            </div>
                            <div className="p-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3">
                                    <button
                                        onClick={() => navigate('/admin/drivers')}
                                        className="p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors text-left"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <UserGroupIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-xs font-medium text-blue-900">Manage Drivers</h3>
                                                <p className="text-xs text-blue-700 hidden sm:block">View and manage driver accounts</p>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => navigate('/admin/deliveries')}
                                        className="p-2 sm:p-3 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors text-left"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <TruckIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-xs font-medium text-green-900">Track Deliveries</h3>
                                                <p className="text-xs text-green-700 hidden sm:block">Monitor delivery status and progress</p>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => navigate('/admin/enhanced-analytics')}
                                        className="p-2 sm:p-3 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-colors text-left"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <ChartBarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-xs font-medium text-purple-900">View Analytics</h3>
                                                <p className="text-xs text-purple-700 hidden sm:block">Detailed performance insights</p>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => navigate('/admin/broadcasts')}
                                        className="p-2 sm:p-3 bg-orange-50 border border-orange-200 rounded hover:bg-orange-100 transition-colors text-left"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <MegaphoneIcon className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-xs font-medium text-orange-900">Broadcast Monitor</h3>
                                                <p className="text-xs text-orange-700 hidden sm:block">Monitor delivery broadcasts</p>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            console.log('🔍 AdminDashboard: Dispatching open-global-search event');
                                            if (typeof window !== 'undefined') {
                                                const event = new CustomEvent('open-global-search');
                                                window.dispatchEvent(event);
                                                console.log('🔍 AdminDashboard: Event dispatched successfully');
                                            } else {
                                                console.error('🔍 AdminDashboard: Window is undefined');
                                            }
                                        }}
                                        className="p-2 sm:p-3 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors text-left"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <MagnifyingGlassIcon className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-xs font-medium text-indigo-900">Global Search</h3>
                                                <p className="text-xs text-indigo-700 hidden sm:block">Search across all entities</p>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setShowReferralTester(true)}
                                        className="p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded hover:bg-yellow-100 transition-colors text-left"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <TrophyIcon className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-xs font-medium text-yellow-900">Test Referral Codes</h3>
                                                <p className="text-xs text-yellow-700 hidden sm:block">Debug referral system</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Referral Code Tester Modal */}
            {showReferralTester && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <TrophyIcon className="w-6 h-6 text-yellow-600" />
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Referral Code System Tester</h2>
                                    <p className="text-sm text-gray-500">Debug and test referral code functionality</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowReferralTester(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <ReferralCodeTester />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminDashboard;
