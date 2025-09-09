import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import dashboardWebSocketService from '../../services/dashboardWebSocketService';
import { DashboardSkeleton } from '../../components/common/SkeletonLoader';
import DriverMessageToAdmin from '../../components/driver/DriverMessageToAdmin';
import DriverLeaderboard from '../../components/driver/DriverLeaderboard';
import { capitalizeName } from '../../utils/nameUtils';
import {
    TruckIcon,
    CurrencyDollarIcon,
    CheckCircleIcon,
    StarIcon,
    FunnelIcon,
    MegaphoneIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Available period options for filtering (moved outside component to avoid dependency warning)
const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'currentPeriod', label: 'This Month' },
    { value: 'allTime', label: 'All Time' }
];

const DashboardContent = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('today');
    const [dashboardData, setDashboardData] = useState(null);

    // Debug user object structure
    useEffect(() => {
        console.log('🔍 User object structure:', user);
        console.log('🔍 User fields:', {
            id: user?.id,
            _id: user?._id,
            email: user?.email,
            name: user?.name,
            fullName: user?.fullName,
            userType: user?.userType,
            role: user?.role
        });
    }, [user]);

    // Initialize WebSocket for real-time updates
    useEffect(() => {
        if (user?._id || user?.id) {
            dashboardWebSocketService.initialize();

            // Subscribe to driver dashboard updates
            const unsubscribe = dashboardWebSocketService.subscribe('driver-dashboard-update', (data) => {
                console.log('📊 Received real-time dashboard update:', data);
                if (data.period === selectedPeriod) {
                    setDashboardData(data.dashboardData);
                }
            });

            // Subscribe to delivery updates
            const unsubscribeDeliveries = dashboardWebSocketService.subscribe('delivery-update', (data) => {
                console.log('📦 Received delivery update:', data);
                // Refresh dashboard data when deliveries change
                loadDashboardData(true);
            });

            // Subscribe to earnings updates
            const unsubscribeEarnings = dashboardWebSocketService.subscribe('earnings-update', (data) => {
                console.log('💰 Received earnings update:', data);
                // Refresh dashboard data when earnings change
                loadDashboardData(true);
            });

            return () => {
                unsubscribe();
                unsubscribeDeliveries();
                unsubscribeEarnings();
            };
        }
    }, [user, selectedPeriod]);

    // Load dashboard data from comprehensive endpoint
    const loadDashboardData = useCallback(async (silent = false) => {
        try {
            if (!silent) {
                setLoading(true);
            }

            console.log('📊 Loading dashboard data for period:', selectedPeriod);
            console.log('📊 Silent mode:', silent);

            // Try WebSocket first, fallback to API
            const webSocketRequested = false; // FORCE API CALLS FOR DEBUGGING
            // const webSocketRequested = dashboardWebSocketService.requestDashboardData(selectedPeriod, 'driver');

            if (!webSocketRequested) {
                console.log('📊 WebSocket not available, using API fallback');
                // Try the earnings endpoint first since the response structure matches
                try {
                    console.log('📊 Trying earnings endpoint first...');
                    const response = await apiService.getDriverEarnings(selectedPeriod);

                    if (response.success && response.data) {
                        console.log('📊 Earnings API response received:', {
                            success: response.success,
                            message: response.message,
                            data: response.data,
                            period: selectedPeriod,
                            fullResponse: response
                        });
                        console.log('📊 RAW EARNINGS RESPONSE:', JSON.stringify(response, null, 2));

                        // Check if the response has meaningful data
                        const hasData = response.data?.summary && (
                            response.data.summary.totalDeliveries > 0 ||
                            response.data.summary.totalEarnings > 0 ||
                            response.data.summary.completionRate > 0
                        );

                        // Check for rating data
                        const hasRatingData = response.data?.performance?.rating > 0 ||
                            response.data?.summary?.rating > 0 ||
                            response.data?.rating > 0;

                        console.log('📊 Rating data check:', {
                            hasRatingData,
                            performanceRating: response.data?.performance?.rating,
                            summaryRating: response.data?.summary?.rating,
                            directRating: response.data?.rating
                        });

                        if (!hasData) {
                            console.warn('⚠️ Earnings API returned empty/zero data - this might indicate:');
                            console.warn('   1. Driver has no delivery history');
                            console.warn('   2. Backend endpoint needs implementation');
                            console.warn('   3. Period filtering issue');
                        }

                        if (!hasRatingData) {
                            console.warn('⚠️ No rating data found in API response');
                        }

                        setDashboardData(response.data);
                        return;
                    }
                } catch (earningsError) {
                    console.log('📊 Earnings endpoint failed, trying dashboard endpoint:', earningsError);
                }

                // Fallback to dashboard endpoint
                const response = await apiService.getDashboardData(selectedPeriod);

                if (response.success && response.data) {
                    console.log('📊 Dashboard API response received:', {
                        success: response.success,
                        message: response.message,
                        data: response.data,
                        period: selectedPeriod,
                        fullResponse: response
                    });
                    console.log('📊 RAW RESPONSE DATA:', JSON.stringify(response, null, 2));
                    console.log('📊 DATA STRUCTURE ANALYSIS:', {
                        hasSummary: !!response.data.summary,
                        hasEarnings: !!response.data.earnings,
                        hasQuickStats: !!response.data.quickStats,
                        hasAnalytics: !!response.data.analytics,
                        summaryKeys: response.data.summary ? Object.keys(response.data.summary) : 'none',
                        earningsKeys: response.data.earnings ? Object.keys(response.data.earnings) : 'none',
                        quickStatsKeys: response.data.quickStats ? Object.keys(response.data.quickStats) : 'none'
                    });
                    setDashboardData(response.data);
                } else {
                    console.warn('⚠️ Invalid dashboard response:', response);
                    throw new Error('Invalid response structure');
                }
            } else {
                console.log('📊 Dashboard data requested via WebSocket');

                // Add a timeout fallback in case WebSocket doesn't respond
                setTimeout(async () => {
                    if (!dashboardData) {
                        console.log('📊 WebSocket timeout, using API fallback');
                        try {
                            const response = await apiService.getDashboardData(selectedPeriod);
                            if (response.success && response.data) {
                                setDashboardData(response.data);
                            }
                        } catch (error) {
                            console.error('❌ API fallback also failed:', error);
                        }
                    }
                }, 3000); // 3 second timeout
            }

        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);

            // Show appropriate error messages
            if (!silent) {
                if (error.response?.status === 400) {
                    toast.error(`Period "${selectedPeriod}" validation failed. Backend may not support this period type yet.`);
                } else if (error.response?.status === 401) {
                    toast.error('Please log in again to view dashboard data.');
                } else if (error.response?.status === 500) {
                    toast.error(`Server error for period "${selectedPeriod}". Backend may need implementation.`);
                } else {
                    toast.error(`Failed to load dashboard data for "${selectedPeriod}": ${error.response?.data?.error || error.message}`);
                }
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, [selectedPeriod]);



    // Period change handler
    const handlePeriodChange = (period) => {
        console.log('🔄 Period changed from', selectedPeriod, 'to', period);
        setSelectedPeriod(period);

        // Force immediate API call for debugging
        if (period === 'currentPeriod') {
            console.log('🚨 FORCING API CALL FOR currentPeriod/month');
            setTimeout(() => {
                loadDashboardData();
            }, 100);
        }
    };

    // Load dashboard data when period changes
    useEffect(() => {
        console.log('🔄 Period changed, loading dashboard data for:', selectedPeriod);
        loadDashboardData();
    }, [selectedPeriod, loadDashboardData]);

    useEffect(() => {
        // Subscribe to WebSocket dashboard data updates
        const unsubscribe = dashboardWebSocketService.subscribe('dashboard-data-response', (data) => {
            console.log('📊 Received dashboard data via WebSocket:', data);
            if (data.success && data.data) {
                setDashboardData(data.data);
            }
        });

        // Refresh data every 30 seconds (silent refresh)
        const interval = setInterval(() => loadDashboardData(true), 60000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [loadDashboardData]); // Added loadDashboardData dependency back

    // Get current period data based on selected filter
    const getCurrentPeriodData = () => {
        console.log('🔍 getCurrentPeriodData called with selectedPeriod:', selectedPeriod);
        console.log('🔍 dashboardData:', dashboardData);

        // Handle the new backend data structure
        if (dashboardData?.summary) {
            console.log('🔍 Using summary data from backend:', dashboardData.summary);
            console.log('🔍 Completion rate from summary:', dashboardData.summary.completionRate);

            // Check if all values are zero (backend issue)
            const allZero = !dashboardData.summary.totalDeliveries &&
                !dashboardData.summary.totalEarnings &&
                !dashboardData.summary.completionRate;

            if (allZero) {
                console.warn('⚠️ Backend returned all zero values - this indicates a backend issue or new driver');
                console.log('💡 This could mean:');
                console.log('   1. Driver has no delivery history yet');
                console.log('   2. Backend API endpoint needs implementation');
                console.log('   3. Period filtering is not working correctly');
            }

            return {
                deliveries: dashboardData.summary.totalDeliveries,
                totalDeliveries: dashboardData.summary.totalDeliveries,
                earnings: dashboardData.summary.totalEarnings,
                totalEarnings: dashboardData.summary.totalEarnings,
                completionRate: dashboardData.summary.completionRate || 0,
                remissionOwed: dashboardData.summary.totalRemissionOwed
            };
        }

        // Fallback to old structure if available
        if (dashboardData?.quickStats) {
            console.log('🔍 Using quickStats data:', dashboardData.quickStats);

            switch (selectedPeriod) {
                case 'today':
                    console.log('🔍 Today completion rate:', dashboardData.quickStats.today?.completionRate);
                    return dashboardData.quickStats.today;
                case 'thisWeek':
                    console.log('🔍 This week completion rate:', dashboardData.quickStats.thisWeek?.completionRate);
                    return dashboardData.quickStats.thisWeek;
                case 'currentPeriod':
                    // Use analytics data as fallback if quickStats is empty
                    const currentPeriodData = dashboardData.quickStats.currentPeriod;
                    console.log('🔍 Current period completion rate:', currentPeriodData?.completionRate);
                    if (currentPeriodData && (currentPeriodData.deliveries > 0 || currentPeriodData.totalDeliveries > 0)) {
                        return currentPeriodData;
                    }
                    // Fallback to analytics data
                    if (dashboardData.analytics?.current?.stats) {
                        console.log('🔍 Using analytics fallback for currentPeriod:', dashboardData.analytics.current.stats);
                        console.log('🔍 Analytics completion rate:', dashboardData.analytics.current.stats.completionRate);
                        return {
                            deliveries: dashboardData.analytics.current.stats.totalDeliveries,
                            totalDeliveries: dashboardData.analytics.current.stats.totalDeliveries,
                            earnings: dashboardData.analytics.current.stats.totalEarnings,
                            totalEarnings: dashboardData.analytics.current.stats.totalEarnings,
                            completionRate: dashboardData.analytics.current.stats.completionRate
                        };
                    }
                    return currentPeriodData;
                case 'allTime':
                    console.log('🔍 All time completion rate:', dashboardData.quickStats.allTime?.completionRate);
                    return dashboardData.quickStats.allTime;
                default:
                    console.log('🔍 Default completion rate:', dashboardData.quickStats.today?.completionRate);
                    return dashboardData.quickStats.today;
            }
        }

        // If no data structure matches, return null
        console.warn('⚠️ No matching data structure found in dashboardData');
        return null;
    };

    const currentData = getCurrentPeriodData();
    const rating = dashboardData?.performance?.rating || 0;

    // Debug rating data
    console.log('⭐ RATING DEBUG:', {
        hasPerformance: !!dashboardData?.performance,
        performanceData: dashboardData?.performance,
        rating: rating,
        alternativeRatingSources: {
            summaryRating: dashboardData?.summary?.rating,
            currentDataRating: currentData?.rating,
            analyticsRating: dashboardData?.analytics?.rating,
            quickStatsRating: dashboardData?.quickStats?.rating
        }
    });

    console.log('📊 CURRENT DATA BEING USED:', {
        selectedPeriod,
        currentData,
        hasSummary: !!dashboardData?.summary,
        hasQuickStats: !!dashboardData?.quickStats,
        hasAnalytics: !!dashboardData?.analytics,
        summaryData: dashboardData?.summary,
        quickStatsKeys: dashboardData?.quickStats ? Object.keys(dashboardData.quickStats) : 'none',
        analyticsKeys: dashboardData?.analytics ? Object.keys(dashboardData.analytics) : 'none'
    });

    // Main dashboard metrics based on the comprehensive payload design
    const dashboardMetrics = [
        {
            title: "Total Deliveries",
            value: currentData?.deliveries || currentData?.totalDeliveries || 0,
            icon: TruckIcon,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            title: 'Completion Rate',
            value: (() => {
                // Try to get completion rate from backend data
                const backendCompletionRate = currentData?.completionRate;
                if (backendCompletionRate !== undefined && backendCompletionRate !== null && backendCompletionRate > 0) {
                    console.log('🔍 Using backend completion rate:', backendCompletionRate);
                    return backendCompletionRate;
                }

                // Fallback calculation if backend doesn't provide it
                const totalDeliveries = currentData?.deliveries || currentData?.totalDeliveries || 0;
                const completedDeliveries = currentData?.completedDeliveries || 0;

                if (totalDeliveries > 0) {
                    const calculatedRate = Math.round((completedDeliveries / totalDeliveries) * 100);
                    console.log('🔍 Calculated completion rate:', calculatedRate, 'from', completedDeliveries, '/', totalDeliveries);
                    return calculatedRate;
                }

                // If no deliveries at all, this could be a new driver
                if (totalDeliveries === 0 && completedDeliveries === 0) {
                    console.log('🔍 New driver detected - no delivery history yet');
                    // Return a placeholder value for new drivers
                    return 0; // Keep as 0 for new drivers
                }

                console.log('🔍 No completion rate data available, defaulting to 0');
                return 0;
            })(),
            icon: CheckCircleIcon,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
        },
        {
            title: 'Total Earnings',
            value: currentData?.earnings || currentData?.totalEarnings || 0,
            icon: CurrencyDollarIcon,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
        },
        {
            title: 'Algorithm Rating',
            value: (() => {
                // Try multiple possible sources for rating data
                const possibleRatingSources = [
                    dashboardData?.performance?.rating,
                    dashboardData?.summary?.rating,
                    currentData?.rating,
                    dashboardData?.analytics?.rating,
                    dashboardData?.quickStats?.rating,
                    dashboardData?.rating
                ];

                // Find the first non-zero rating
                const foundRating = possibleRatingSources.find(rating =>
                    rating !== undefined && rating !== null && rating > 0
                );

                if (foundRating !== undefined) {
                    console.log('⭐ Using rating from source:', foundRating);
                    return foundRating;
                }

                // If no rating found, this could be a new driver
                console.log('⭐ No rating data available - new driver or backend issue');
                return 0; // Keep as 0 for new drivers
            })(),
            icon: StarIcon,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50'
        }
    ];

    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                                Driver Dashboard
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Welcome back, {capitalizeName(user?.fullName || user?.name || 'Driver')}! Here's your delivery overview.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hidden md:block">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <button
                            onClick={() => navigate('/driver/deliveries')}
                            className="bg-green-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base font-medium"
                        >
                            <TruckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span>View All Deliveries</span>
                        </button>
                        <button
                            onClick={() => navigate('/driver/earnings')}
                            className="bg-green-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base font-medium"
                        >
                            <CurrencyDollarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span>View Earnings</span>
                        </button>
                        <button
                            onClick={() => navigate('/driver/broadcasts')}
                            className="bg-blue-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base font-medium"
                        >
                            <MegaphoneIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span>Available Deliveries</span>
                        </button>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                            <FunnelIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                            <span className="text-sm sm:text-base text-gray-600 font-medium">Filter by Period:</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm sm:text-base text-gray-600">Showing stats for:</span>
                            <select
                                value={selectedPeriod}
                                onChange={(e) => handlePeriodChange(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                            >
                                {periodOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {dashboardMetrics.map((metric, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm sm:text-base text-gray-600 mb-2 truncate">{metric.title}</p>
                                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                                            {metric.value === null ? '0' :
                                                metric.title === 'Total Earnings' ? `₺${metric.value?.toFixed(2) || '0.00'}` :
                                                    metric.title === 'Algorithm Rating' ? metric.value?.toFixed(1) || '0' :
                                                        metric.title === 'Completion Rate' ? `${metric.value || 0}%` :
                                                            metric.value || '0'}
                                        </p>
                                    </div>
                                    <div className={`p-2 sm:p-3 rounded-lg ${metric.bgColor} flex-shrink-0`}>
                                        <metric.icon className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${metric.color}`} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Helpful message for new drivers or when data is missing */}
                    {/* {currentData && (
                        (currentData.deliveries === 0 || currentData.totalDeliveries === 0) ||
                        (dashboardData?.performance?.rating === 0 || dashboardData?.summary?.rating === 0)
                    ) && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-blue-900">No delivery history yet</h3>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Your completion rate and algorithm rating will appear once you complete your first delivery.
                                            Start accepting deliveries to see your performance metrics!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )} */}
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    {/* Current Deliveries */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-4 sm:p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Current Deliveries</h2>
                                <button
                                    onClick={() => navigate('/driver/deliveries')}
                                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                                >
                                    View all
                                </button>
                            </div>
                        </div>
                        <div className="p-4 sm:p-6">
                            {dashboardData?.earnings && dashboardData.earnings.length > 0 ? (
                                <div className="space-y-3 sm:space-y-4">
                                    {dashboardData.earnings.slice(0, 3).map((earning, index) => (
                                        <div key={index} className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4 sm:p-5 hover:shadow-md transition-all duration-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-green-500 rounded-lg">
                                                        <TruckIcon className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                                                            Week {earning.week}, {earning.year}
                                                        </h3>
                                                        <p className="text-xs text-gray-600">
                                                            {earning.deliveries} delivery{earning.deliveries !== 1 ? 'ies' : ''} completed
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className="flex space-x-1">
                                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                    </div>
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                        Delivered
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white rounded-lg p-3 border border-green-100">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs text-gray-600 font-medium">Revenue</p>
                                                            <p className="text-lg font-bold text-gray-900">₺{earning.revenue}</p>
                                                        </div>
                                                        <div className="p-2 bg-blue-50 rounded-lg">
                                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white rounded-lg p-3 border border-green-100">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs text-gray-600 font-medium">Your Earnings</p>
                                                            <p className="text-lg font-bold text-green-600">₺{earning.earnings}</p>
                                                        </div>
                                                        <div className="p-2 bg-green-50 rounded-lg">
                                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {earning.remissionOwed > 0 && (
                                                <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs text-orange-700 font-medium">Remission Owed</p>
                                                            <p className="text-sm font-semibold text-orange-800">₺{earning.remissionOwed}</p>
                                                        </div>
                                                        <div className="p-2 bg-orange-100 rounded-lg">
                                                            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                        <TruckIcon className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries yet</h3>
                                    <p className="text-gray-500 text-sm">Complete your first delivery to see your earnings here</p>
                                    <button
                                        onClick={() => navigate('/driver/broadcasts')}
                                        className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                    >
                                        Find Available Deliveries
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Earnings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-4 sm:p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Earnings</h2>
                                <button
                                    onClick={() => navigate('/driver/earnings')}
                                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                                >
                                    View all
                                </button>
                            </div>
                        </div>
                        <div className="p-4 sm:p-6">
                            {dashboardData?.summary ? (
                                <div className="space-y-3 sm:space-y-4">
                                    {[
                                        {
                                            period: 'Total Earnings',
                                            amount: dashboardData.summary.totalEarnings || 0,
                                            description: 'All time earnings'
                                        },
                                        {
                                            period: 'Total Deliveries',
                                            amount: dashboardData.summary.totalDeliveries || 0,
                                            description: 'Completed deliveries',
                                            isDelivery: true
                                        },
                                        {
                                            period: 'Remission Owed',
                                            amount: dashboardData.summary.totalRemissionOwed || 0,
                                            description: 'Pending remission',
                                            isRemission: true
                                        }
                                    ].filter(item => item.amount > 0 || item.isDelivery).map((item, index) => (
                                        <div key={index} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border border-gray-100 rounded-lg">
                                            <div className={`p-2 rounded-lg ${item.isDelivery ? 'bg-blue-50' : item.isRemission ? 'bg-orange-50' : 'bg-green-50'}`}>
                                                {item.isDelivery ? (
                                                    <TruckIcon className="h-5 w-5 text-blue-600" />
                                                ) : item.isRemission ? (
                                                    <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                    </svg>
                                                ) : (
                                                    <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 text-sm sm:text-base">{item.period}</p>
                                                <p className="text-xs sm:text-sm text-gray-600">{item.description}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                                                    {item.isDelivery ? item.amount : `₺${item.amount}`}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No recent earnings data</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Leaderboard Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                    <DriverLeaderboard
                        currentDriverId={user?._id || user?.id}
                        dashboardPeriod={selectedPeriod}
                    />
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Quick Actions</h2>
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs sm:text-sm text-gray-600">Live Support</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Message to Admin - Enhanced */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                    <div className="p-2 bg-blue-500 rounded-xl">
                                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Message Admin</h3>
                                        <p className="text-xs sm:text-sm text-gray-600">Direct communication</p>
                                    </div>
                                </div>
                            </div>
                            <DriverMessageToAdmin />
                        </div>

                        {/* WhatsApp Support - Enhanced */}
                        <a
                            href="https://wa.me/905338329785"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                    <div className="p-2 bg-green-500 rounded-xl group-hover:bg-green-600 transition-colors">
                                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 2.079.529 4.0 1.459 5.68L.029 24l6.592-1.729c1.618.826 3.436 1.296 5.396 1.296 6.621 0 11.988-5.367 11.988-11.987C23.988 5.367 18.621.001 12.017.001zM12.017 21.92c-1.737 0-3.396-.441-4.838-1.204l-.347-.206-3.595.942.959-3.507-.225-.359a9.861 9.861 0 01-1.474-5.298c0-5.464 4.445-9.909 9.909-9.909s9.909 4.445 9.909 9.909-4.445 9.909-9.909 9.909z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 group-hover:text-green-700 text-sm sm:text-base">WhatsApp Support</h3>
                                        <p className="text-xs sm:text-sm text-gray-600">24/7 Live Chat</p>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </div>
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs sm:text-sm font-medium text-green-700">Online Now</span>
                                </div>
                                <p className="text-base sm:text-lg font-bold text-gray-900">+90 533 832 97 85</p>
                                <p className="text-xs sm:text-sm text-gray-600">Tap to start chatting</p>
                            </div>
                        </a>

                        {/* Instagram - Enhanced */}
                        <a
                            href="https://instagram.com/greepit"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-100 p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                    <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl group-hover:from-pink-600 group-hover:to-purple-600 transition-colors">
                                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 group-hover:text-pink-700 text-sm sm:text-base">Follow Us</h3>
                                        <p className="text-xs sm:text-sm text-gray-600">Stay Connected</p>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </div>
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs sm:text-sm font-medium text-pink-700">Latest Updates</span>
                                </div>
                                <p className="text-base sm:text-lg font-bold text-gray-900">@greepit</p>
                                <p className="text-xs sm:text-sm text-gray-600">Follow for news & tips</p>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main wrapper component
const DriverDashboard = () => {
    return <DashboardContent />;
};

export default DriverDashboard;