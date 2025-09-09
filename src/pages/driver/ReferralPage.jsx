import React, { useState, useEffect, useCallback } from 'react';
import { capitalizeName } from '../../utils/nameUtils';
import { usePointsNotificationContext } from '../../components/layouts/DriverLayout';
import ReferralCodeDetails from '../../components/driver/ReferralCodeDetails';
import {
    UserGroupIcon,
    GiftIcon,
    TrophyIcon,
    CurrencyDollarIcon,
    CheckCircleIcon,
    ClockIcon,
    ChartBarIcon,
    UserIcon,
    TruckIcon,
    CreditCardIcon,
    InformationCircleIcon,
    StarIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

const ReferralPage = () => {
    const { user } = useAuth();
    const { triggerReferralPoints } = usePointsNotificationContext();
    const [referralData, setReferralData] = useState(null);
    const [configData, setConfigData] = useState(null);
    const [pointsData, setPointsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showRedeemModal, setShowRedeemModal] = useState(false);
    const [redeemAmount, setRedeemAmount] = useState('');
    const [redeemDescription, setRedeemDescription] = useState('');

    const loadAllReferralData = useCallback(async () => {
        try {
            setLoading(true);

            // Load configuration data
            const configResponse = await apiService.getReferralRewardsConfiguration();
            if (configResponse.success) {
                setConfigData(configResponse.data);
            }

            // Load referral data
            console.log('🔍 Loading referral data for user:', user._id || user.id);
            console.log('🔍 Full user object:', user);
            console.log('🔍 User ID being sent to API:', user._id || user.id);

            let codeResponse, statsResponse;
            try {
                codeResponse = await apiService.getDriverReferralCode(user._id || user.id);
                console.log('🔍 Code response received:', codeResponse);
            } catch (error) {
                console.error('❌ Error getting referral code:', error);
                codeResponse = { success: false, error: error.message };
            }

            try {
                statsResponse = await apiService.getDriverReferralStats(user._id || user.id);
                console.log('🔍 Stats response received:', statsResponse);
            } catch (error) {
                console.error('❌ Error getting referral stats:', error);
                statsResponse = { success: false, error: error.message };
            }

            console.log('🔍 API Responses:', {
                codeResponse: codeResponse,
                statsResponse: statsResponse,
                user: user._id || user.id
            });

            // Debug: Check if responses are successful
            console.log('🔍 Response Success Check:', {
                codeSuccess: codeResponse?.success,
                statsSuccess: statsResponse?.success,
                codeData: codeResponse?.data,
                statsData: statsResponse?.data
            });

            if (codeResponse.success && statsResponse.success) {
                // Updated for permanent referral codes
                const mergedData = {
                    ...statsResponse.data,
                    referralCode: codeResponse.data.referralCode || codeResponse.data.code,
                    // Map the correct referral data structure for permanent codes
                    referrals: codeResponse.data.referrals || [], // Use codeResponse for referrals list
                    referralsAsReferrer: codeResponse.data.referrals || [], // Use codeResponse for referrals list
                    referralsGiven: statsResponse.data.referralsGiven || { total: 0, pending: 0, completed: 0, totalPoints: 0 },
                    referralReceived: statsResponse.data.referralReceived,
                    // New permanent code fields
                    totalUses: codeResponse.data.totalUses || 0,
                    usageHistory: codeResponse.data.usageHistory || [],
                    isActive: codeResponse.data.status === 'active',
                    neverExpires: true, // All codes are now permanent
                    // Add activeReferrals count for display
                    activeReferrals: statsResponse.data.referralsGiven?.total || 0,
                    // Add total referrals from codeResponse
                    totalReferrals: codeResponse.data.totalReferrals || 0,
                    completedReferrals: codeResponse.data.completedReferrals || 0,
                    pendingReferrals: codeResponse.data.pendingReferrals || 0
                };
                console.log('🔍 Permanent referral data debug:', {
                    statsResponse: statsResponse.data,
                    codeResponse: codeResponse.data,
                    mergedData,
                    referrals: statsResponse.data.referrals,
                    referralsCount: statsResponse.data.referrals?.length || 0,
                    referralsGiven: statsResponse.data.referralsGiven,
                    referralReceived: statsResponse.data.referralReceived,
                    totalUses: codeResponse.data.totalUses,
                    isActive: codeResponse.data.status
                });
                setReferralData(mergedData);
            } else if (codeResponse.success) {
                setReferralData(codeResponse.data);
            } else if (statsResponse.success) {
                setReferralData({
                    ...statsResponse.data,
                    referrals: statsResponse.data.referrals || [],
                    referralsAsReferrer: statsResponse.data.referrals || []
                });
            } else {
                console.log('⚠️ Both API calls failed, using fallback data');
                // Fallback data structure
                setReferralData({
                    referralCode: 'GRP-SDS001-WI', // Default code format
                    activeReferrals: 0,
                    referrals: [],
                    referralsAsReferrer: [],
                    referralsGiven: { total: 0, pending: 0, completed: 0, totalPoints: 0 },
                    totalUses: 0,
                    usageHistory: [],
                    isActive: true,
                    neverExpires: true
                });
            }

            // Load points data - use stats data for points since it's more accurate
            try {
                const pointsResponse = await apiService.getDriverPointsSummary(user._id || user.id);
                console.log('🔍 Points response received:', pointsResponse);

                // Load points history (handle missing endpoint gracefully)
                let pointsHistoryResponse = null;
                try {
                    pointsHistoryResponse = await apiService.getDriverPointsHistory(user._id || user.id);
                    console.log('🔍 Points history response received:', pointsHistoryResponse);
                } catch (error) {
                    console.log('⚠️ Points history API not available (404), using fallback data');
                    pointsHistoryResponse = { success: false, data: [] };
                }

                // Use stats data for points if available, otherwise use points API
                let totalPoints = 0;
                let availablePoints = 0;

                if (statsResponse?.success && statsResponse.data?.referralsGiven?.totalPoints) {
                    totalPoints = statsResponse.data.referralsGiven.totalPoints;
                    availablePoints = statsResponse.data.referralsGiven.totalPoints;
                    console.log('🔍 Using stats data for points:', totalPoints);
                } else if (pointsResponse.success) {
                    totalPoints = pointsResponse.data.referralPoints || 0;
                    availablePoints = pointsResponse.data.referralPoints || 0;
                    console.log('🔍 Using points API data:', totalPoints);
                }

                // Process points history
                let pointsHistory = [];
                if (pointsHistoryResponse.success && pointsHistoryResponse.data) {
                    pointsHistory = pointsHistoryResponse.data.pointsHistory || pointsHistoryResponse.data || [];
                    console.log('🔍 Processed points history:', pointsHistory);
                }

                // If no points history from API but we have points, create realistic entries
                if (pointsHistory.length === 0 && totalPoints > 0) {
                    // Create realistic points history entries based on referral data
                    const referralEntries = [];

                    // If we have referral data, create entries for each referral
                    if (referralData?.referrals && referralData.referrals.length > 0) {
                        referralData.referrals.forEach((referral, index) => {
                            const referralEntry = {
                                id: `referral-${referral._id || index}`,
                                amount: 15, // Standard referral bonus
                                description: `Referral bonus - Referred ${referral.fullNameComputed || referral.name || 'new driver'}`,
                                timestamp: new Date().toISOString(),
                                type: 'referral',
                                status: 'completed',
                                referralId: referral._id
                            };
                            referralEntries.push(referralEntry);
                        });
                    } else {
                        // Fallback: create a generic referral entry
                        const referralEntry = {
                            id: 'referral-bonus',
                            amount: totalPoints,
                            description: 'Referral bonus - Referred new driver',
                            timestamp: new Date().toISOString(),
                            type: 'referral',
                            status: 'completed'
                        };
                        referralEntries.push(referralEntry);
                    }

                    pointsHistory = referralEntries;
                    console.log('🔍 Created realistic points history entries:', referralEntries);
                }

                const transformedPointsData = {
                    totalPoints,
                    availablePoints,
                    pointsHistory
                };
                console.log('🔍 Final transformed points data:', transformedPointsData);
                setPointsData(transformedPointsData);
            } catch (error) {
                console.error('❌ Error getting points summary:', error);
                console.log('⚠️ Using fallback data due to API error');
                // Fallback data structure
                setPointsData({
                    totalPoints: 0,
                    availablePoints: 0,
                    pointsHistory: []
                });
            }

        } catch (error) {
            console.error('❌ Error loading referral data:', error);
            console.error('❌ Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText
            });
            toast.error('Failed to load referral data');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadAllReferralData();
    }, [loadAllReferralData]);


    const handleRedeemPoints = async () => {
        if (!redeemAmount) {
            toast.error('Please enter the amount to redeem');
            return;
        }

        const amount = parseInt(redeemAmount);
        const minimumPoints = configData?.redemptionSettings?.minimumPointsForCashout || 50;

        if (amount <= 0 || amount > pointsData.availablePoints) {
            toast.error('Invalid amount');
            return;
        }

        if (amount < minimumPoints) {
            toast.error(`Minimum redemption amount is ${minimumPoints} points (₺${minimumPoints})`);
            return;
        }

        if (pointsData.availablePoints < minimumPoints) {
            toast.error(`Minimum ${minimumPoints} points required for redemption. You currently have ${pointsData.availablePoints} points.`);
            return;
        }

        try {
            const response = await apiService.redeemDriverPoints(user._id || user.id, {
                amount,
                description: redeemDescription || 'Points redemption'
            });

            if (response.success) {
                toast.success('Points redeemed successfully!');
                setShowRedeemModal(false);
                setRedeemAmount('');
                setRedeemDescription('');
                loadAllReferralData(); // Refresh data
            }
        } catch (error) {
            console.error('Error redeeming points:', error);
            toast.error('Failed to redeem points');
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
                {/* Header */}
                <div className="mb-4 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Referral Program</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Earn points by referring new drivers to our platform</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm p-4 sm:p-6 border border-green-200">
                        <div className="flex items-center">
                            <div className="p-2 sm:p-3 bg-green-500 rounded-lg">
                                <GiftIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div className="ml-3 sm:ml-4">
                                <p className="text-xs sm:text-sm font-medium text-green-700">Total Points</p>
                                <p className="text-lg sm:text-2xl font-bold text-green-900">
                                    {pointsData?.totalPoints || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-4 sm:p-6 border border-blue-200">
                        <div className="flex items-center">
                            <div className="p-2 sm:p-3 bg-blue-500 rounded-lg">
                                <CurrencyDollarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div className="ml-3 sm:ml-4">
                                <p className="text-xs sm:text-sm font-medium text-blue-700">Available Points</p>
                                <p className="text-lg sm:text-2xl font-bold text-blue-900">
                                    {pointsData?.availablePoints || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm p-4 sm:p-6 border border-purple-200">
                        <div className="flex items-center">
                            <div className="p-2 sm:p-3 bg-purple-500 rounded-lg">
                                <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div className="ml-3 sm:ml-4">
                                <p className="text-xs sm:text-sm font-medium text-purple-700">Active Referrals</p>
                                <p className="text-lg sm:text-2xl font-bold text-purple-900">
                                    {referralData?.referralsGiven?.total || referralData?.totalReferrals || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-sm p-4 sm:p-6 border border-yellow-200">
                        <div className="flex items-center">
                            <div className="p-2 sm:p-3 bg-yellow-500 rounded-lg">
                                <TrophyIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div className="ml-3 sm:ml-4">
                                <p className="text-xs sm:text-sm font-medium text-yellow-700">Total Earned</p>
                                <p className="text-lg sm:text-2xl font-bold text-yellow-900">
                                    {pointsData?.totalPoints || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Test Points Notification Button (for demo) */}
                {/* <div className="mb-4 sm:mb-8">
                                        <button
                        onClick={() => triggerReferralPoints(15, 'Bravo Smith')}
                        className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                        >
                        🎉 Test Points Notification
                                        </button>
                </div> */}

                {/* Referral Code Details Component */}
                <ReferralCodeDetails referralData={referralData} configData={configData} />


                {/* Tab Navigation */}
                <div className="mb-4 sm:mb-8">
                    <nav className="flex flex-wrap space-x-4 sm:space-x-8 overflow-x-auto pb-2">
                        {[
                            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                            { id: 'rewards', name: 'Reward Structure', icon: GiftIcon },
                            { id: 'referrals', name: 'My Referrals', icon: UserGroupIcon },
                            { id: 'history', name: 'Points History', icon: ClockIcon }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-1 sm:space-x-2 py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-4 sm:space-y-8">
                        {/* How It Works */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">How It Works</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                <div className="text-center">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                        <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                                    </div>
                                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">1. Share Your Code</h3>
                                    <p className="text-xs sm:text-sm text-gray-600">Share your permanent referral code with new drivers</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                        <TruckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                    </div>
                                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">2. They Complete Deliveries</h3>
                                    <p className="text-xs sm:text-sm text-gray-600">New drivers complete their first {configData?.activationBonus?.requiredDeliveries || 3} deliveries</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                        <GiftIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                                    </div>
                                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">3. Earn Points</h3>
                                    <p className="text-xs sm:text-sm text-gray-600">You both earn points and continue earning on every delivery</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setShowRedeemModal(true)}
                                        disabled={!pointsData?.availablePoints || pointsData.availablePoints <= 0}
                                        className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="text-green-700 font-medium">Redeem Points</span>
                                        <CreditCardIcon className="h-5 w-5 text-green-600" />
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('referrals')}
                                        className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        <span className="text-blue-700 font-medium">View My Referrals</span>
                                        <UserGroupIcon className="h-5 w-5 text-blue-600" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Program Status</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center">
                                            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                                            <span className="text-sm text-gray-900">Program Active</span>
                                        </div>
                                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Live</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center">
                                            <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
                                            <span className="text-sm text-gray-900">Code Expires</span>
                                        </div>
                                        <span className="text-xs text-gray-600">Never expires</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center">
                                            <InformationCircleIcon className="h-5 w-5 text-purple-500 mr-2" />
                                            <span className="text-sm text-gray-900">Points Expire</span>
                                        </div>
                                        <span className="text-xs text-gray-600">{configData?.timeLimits?.pointsExpiryDays || 365} days</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'rewards' && (
                    <div className="space-y-4 sm:space-y-8">
                        {/* Reward Structure */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Reward Structure</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                {/* Activation Bonus */}
                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                                    <div className="flex items-center mb-3">
                                        <div className="p-2 bg-green-500 rounded-lg">
                                            <GiftIcon className="h-5 w-5 text-white" />
                                        </div>
                                        <h3 className="ml-3 font-semibold text-green-900">Activation Bonus</h3>
                                    </div>
                                    <p className="text-sm text-green-700 mb-2">
                                        When referee completes first {configData?.activationBonus?.requiredDeliveries || 3} deliveries
                                    </p>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-green-900">
                                            You: {configData?.activationBonus?.referrerPoints || 15} points
                                        </p>
                                        <p className="text-sm font-medium text-green-900">
                                            Friend: {configData?.activationBonus?.refereePoints || 5} points
                                        </p>
                                    </div>
                                </div>

                                {/* Per-Delivery Commission */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                                    <div className="flex items-center mb-3">
                                        <div className="p-2 bg-blue-500 rounded-lg">
                                            <TruckIcon className="h-5 w-5 text-white" />
                                        </div>
                                        <h3 className="ml-3 font-semibold text-blue-900">Per-Delivery</h3>
                                    </div>
                                    <p className="text-sm text-blue-700 mb-2">
                                        Every delivery completed by referee
                                    </p>
                                    <p className="text-sm font-medium text-blue-900">
                                        {configData?.perDeliveryReward?.referrerPoints || 5} points per delivery
                                    </p>
                                    <p className="text-xs text-blue-600">
                                        Up to {configData?.perDeliveryReward?.maxDeliveriesPerReferee || 100} deliveries
                                    </p>
                                </div>

                                {/* Milestones */}
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                                    <div className="flex items-center mb-3">
                                        <div className="p-2 bg-purple-500 rounded-lg">
                                            <StarIcon className="h-5 w-5 text-white" />
                                        </div>
                                        <h3 className="ml-3 font-semibold text-purple-900">Milestones</h3>
                                    </div>
                                    <p className="text-sm text-purple-700 mb-2">
                                        Achievement bonuses for delivery milestones
                                    </p>
                                    <div className="space-y-1">
                                        {configData?.milestones?.rewards?.slice(0, 2).map((milestone, index) => (
                                            <p key={index} className="text-xs font-medium text-purple-900">
                                                {milestone.deliveryCount} deliveries: {milestone.points} points
                                            </p>
                                        ))}
                                    </div>
                                </div>

                                {/* Leaderboard */}
                                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                                    <div className="flex items-center mb-3">
                                        <div className="p-2 bg-yellow-500 rounded-lg">
                                            <TrophyIcon className="h-5 w-5 text-white" />
                                        </div>
                                        <h3 className="ml-3 font-semibold text-yellow-900">Leaderboard</h3>
                                    </div>
                                    <p className="text-sm text-yellow-700 mb-2">
                                        Monthly top referrer rewards
                                    </p>
                                    <div className="space-y-1">
                                        {configData?.leaderboardRewards?.rewards?.slice(0, 3).map((reward, index) => (
                                            <p key={index} className="text-xs font-medium text-yellow-900">
                                                {reward.rank === 1 ? '🥇' : reward.rank === 2 ? '🥈' : '🥉'} {reward.points} points
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Redemption Options */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Redemption Options</h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <CreditCardIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                    <h3 className="font-semibold text-gray-900 mb-1">Cash Out</h3>
                                    <p className="text-sm text-gray-600">
                                        Minimum: {configData?.redemptionSettings?.minimumPointsForCashout || 50} points
                                    </p>
                                </div>

                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <GiftIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                    <h3 className="font-semibold text-gray-900 mb-1">Free Deliveries</h3>
                                    <p className="text-sm text-gray-600">
                                        {configData?.redemptionSettings?.pointsPerFreeDelivery || 20} points per delivery
                                    </p>
                                </div>

                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <ClockIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                                    <h3 className="font-semibold text-gray-900 mb-1">Monthly Limit</h3>
                                    <p className="text-sm text-gray-600">
                                        {configData?.redemptionSettings?.maxCashoutsPerMonth || 2} cashouts per month
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'referrals' && (
                    <div className="space-y-4 sm:space-y-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">My Referrals</h2>

                            {referralData?.referrals && referralData.referrals.length > 0 ? (
                                <div className="space-y-4">
                                    {referralData.referrals.map((referral, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                        <UserIcon className="h-5 w-5 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {capitalizeName(referral.fullNameComputed || referral.name || referral.fullName) || 'Unknown Driver'}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Email: {referral.email || 'No email'}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Status: {referral.verificationStatus?.status || 'Unknown'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${referral.verificationStatus?.status === 'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : referral.verificationStatus?.status === 'pending'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {referral.verificationStatus?.status || 'Unknown'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {referral.progress?.deliveriesCompleted || 0} deliveries
                                                    </p>
                                                </div>
                                            </div>
                                            {referral.status === 'in_progress' && (
                                                <div className="mt-3 pt-3 border-t border-gray-100">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">Progress:</span>
                                                        <span className="text-gray-900">
                                                            {referral.progress?.deliveriesCompleted || 0}/{configData?.activationBonus?.requiredDeliveries || 3} deliveries
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                                            style={{
                                                                width: `${Math.min(
                                                                    ((referral.progress?.deliveriesCompleted || 0) / (configData?.activationBonus?.requiredDeliveries || 3)) * 100,
                                                                    100
                                                                )}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg">No referrals yet</p>
                                    <p className="text-sm text-gray-400">Share your referral code to start earning points</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-4 sm:space-y-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Points History</h2>
                                    {pointsData?.pointsHistory && pointsData.pointsHistory.length > 0 &&
                                        pointsData.pointsHistory[0]?.id?.startsWith('referral-') && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Showing estimated history based on referral data
                                            </p>
                                        )}
                                </div>
                                <button
                                    onClick={() => setShowRedeemModal(true)}
                                    disabled={!pointsData?.availablePoints || pointsData.availablePoints <= 0}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Redeem Points
                                </button>
                            </div>

                            <div className="space-y-3">
                                {pointsData?.pointsHistory && pointsData.pointsHistory.length > 0 ? (
                                    pointsData.pointsHistory.slice(0, 10).map((entry, index) => (
                                        <div key={entry.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-lg ${entry.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                                                    }`}>
                                                    {entry.amount > 0 ? (
                                                        <GiftIcon className="h-5 w-5 text-green-600" />
                                                    ) : (
                                                        <CreditCardIcon className="h-5 w-5 text-red-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {entry.description || entry.reason || 'Points transaction'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {entry.timestamp ?
                                                            `${new Date(entry.timestamp).toLocaleDateString()} at ${new Date(entry.timestamp).toLocaleTimeString()}` :
                                                            entry.createdAt ?
                                                                `${new Date(entry.createdAt).toLocaleDateString()} at ${new Date(entry.createdAt).toLocaleTimeString()}` :
                                                                'Date not available'
                                                        }
                                                    </p>
                                                    {entry.type && (
                                                        <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${entry.type === 'referral' ? 'bg-blue-100 text-blue-800' :
                                                            entry.type === 'redeem' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {entry.type}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`text-sm font-bold ${entry.amount > 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {entry.amount > 0 ? '+' : ''}{entry.amount} points
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <GiftIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500 text-lg">No points history yet</p>
                                        <p className="text-sm text-gray-400">Complete referrals to earn points</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Enhanced Redeem Points Modal */}
            {showRedeemModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-t-2xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold mb-2">Redeem Your Points</h3>
                                    <p className="text-green-100">Convert your earned points into rewards</p>
                                </div>
                                <button
                                    onClick={() => setShowRedeemModal(false)}
                                    className="text-white hover:text-green-200 transition-colors"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Points Balance Card */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-green-700 font-medium">Available Points</p>
                                        <p className="text-3xl font-bold text-green-800">{pointsData?.availablePoints || 0}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-green-700">Estimated Value</p>
                                        <p className="text-lg font-semibold text-green-800">
                                            ₺{pointsData?.availablePoints || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Point Value Information */}
                            <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-blue-900 mb-2">Point Value System</h4>
                                        <div className="space-y-2 text-sm text-blue-800">
                                            <p>• <strong>1 Point = ₺1.00</strong> (Turkish Lira)</p>
                                            <p>• Points can be redeemed for cash or gift cards</p>
                                            <p>• Minimum redemption: {configData?.redemptionSettings?.minimumPointsForCashout || 50} points (₺{configData?.redemptionSettings?.minimumPointsForCashout || 50})</p>
                                            <p>• Processing time: 1-3 business days</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Redemption Options */}
                            <div className="mb-6">
                                <h4 className="font-semibold text-gray-900 mb-4">Redemption Options</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors cursor-pointer">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Cash Transfer</p>
                                                <p className="text-sm text-gray-600">Direct bank transfer</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors cursor-pointer">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <GiftIcon className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Gift Cards</p>
                                                <p className="text-sm text-gray-600">Popular retailers</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Redemption Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Amount to Redeem
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={redeemAmount}
                                            onChange={(e) => setRedeemAmount(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                                            placeholder="Enter points amount"
                                            min={configData?.redemptionSettings?.minimumPointsForCashout || 50}
                                            max={pointsData?.availablePoints || 0}
                                        />
                                        <div className="absolute right-3 top-3 text-sm text-gray-500">
                                            points
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-xs text-gray-500">
                                            Available: {pointsData?.availablePoints || 0} points
                                        </p>
                                        {redeemAmount && (
                                            <p className="text-sm font-medium text-green-600">
                                                = ₺{parseFloat(redeemAmount).toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Redemption Method
                                    </label>
                                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                        <option value="cash">Cash Transfer (Bank Account)</option>
                                        <option value="giftcard">Gift Card</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={redeemDescription}
                                        onChange={(e) => setRedeemDescription(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="Optional: e.g., Monthly cash withdrawal"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 mt-8">
                                <button
                                    onClick={() => setShowRedeemModal(false)}
                                    className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRedeemPoints}
                                    disabled={!redeemAmount || parseInt(redeemAmount) < (configData?.redemptionSettings?.minimumPointsForCashout || 50) || parseInt(redeemAmount) > (pointsData?.availablePoints || 0)}
                                    className="flex-1 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    Redeem {redeemAmount ? `${redeemAmount} Points` : 'Points'}
                                </button>
                            </div>

                            {/* Terms and Conditions */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-600 text-center">
                                    By redeeming points, you agree to our terms and conditions.
                                    Redemptions are processed within 1-3 business days.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReferralPage;
