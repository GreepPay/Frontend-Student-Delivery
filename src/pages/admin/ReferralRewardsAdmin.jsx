import React, { useState, useEffect } from 'react';
import {
    CogIcon,
    ChartBarIcon,
    TrophyIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    PlusIcon,
    PencilIcon,
    CheckCircleIcon,
    ArrowTrendingUpIcon,
    CalendarIcon,
    GiftIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import toast from 'react-hot-toast';
import RecentActivityWidget from '../../components/admin/RecentActivityWidget';

const ReferralRewardsAdmin = () => {

    const [configurations, setConfigurations] = useState([]);
    const [profitabilityAnalysis, setProfitabilityAnalysis] = useState(null);
    const [referralStats, setReferralStats] = useState(null);
    const [leaderboard, setLeaderboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [updatingConfigId, setUpdatingConfigId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        activationBonus: {
            enabled: true,
            requiredDeliveries: 3,
            referrerPoints: 20,
            refereePoints: 10
        },
        perDeliveryReward: {
            enabled: true,
            referrerPoints: 8,
            maxDeliveriesPerReferee: 150
        },
        milestones: {
            enabled: true,
            rewards: [
                { deliveryCount: 10, points: 25, description: '10 Deliveries Milestone' },
                { deliveryCount: 25, points: 50, description: '25 Deliveries Milestone' },
                { deliveryCount: 50, points: 75, description: '50 Deliveries Milestone' },
                { deliveryCount: 100, points: 150, description: '100 Deliveries Milestone' }
            ]
        },
        leaderboardRewards: {
            enabled: true,
            rewards: [
                { rank: 1, points: 300, description: '1st Place - Monthly Top Referrer' },
                { rank: 2, points: 150, description: '2nd Place - Monthly Runner Up' },
                { rank: 3, points: 75, description: '3rd Place - Monthly Third Place' }
            ]
        },
        profitabilityControls: {
            maxPointsPerReferee: 300,
            monthlyReferralBudget: 1500,
            maxReferralBudgetPercentage: 25
        },
        redemptionSettings: {
            minimumPointsForCashout: 50,
            cashoutFee: 0,
            maxCashoutsPerMonth: 2,
            allowFreeDeliveries: true,
            pointsPerFreeDelivery: 20
        },
        timeLimits: {
            referralCodeExpiryDays: 30,
            pointsExpiryDays: 365,
            activationBonusExpiryDays: 90
        }
    });

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            setLoading(true);

            const [configsResponse, analysisResponse, statsResponse, leaderboardResponse] = await Promise.allSettled([
                apiService.getReferralRewardsConfiguration(),
                apiService.getReferralRewardsProfitabilityAnalysis(),
                apiService.getReferralRewardsStats(),
                apiService.getReferralRewardsLeaderboard()
            ]);

            if (configsResponse.status === 'fulfilled' && configsResponse.value.success) {
                // The configuration endpoint returns a single config object, not an array
                // We'll wrap it in an array for consistency with the UI
                setConfigurations([configsResponse.value.data]);
            }

            if (analysisResponse.status === 'fulfilled' && analysisResponse.value.success) {
                setProfitabilityAnalysis(analysisResponse.value.data);
            }

            if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
                setReferralStats(statsResponse.value.data.stats);
            }

            if (leaderboardResponse.status === 'fulfilled' && leaderboardResponse.value.success) {
                setLeaderboard(leaderboardResponse.value.data);
            }

        } catch (error) {
            console.error('Error loading admin data:', error);
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateConfiguration = async () => {
        try {
            const response = await apiService.createReferralRewardsConfiguration(formData);
            if (response.success) {
                toast.success('Configuration created successfully!');
                setShowCreateModal(false);
                loadAllData();
            }
        } catch (error) {
            console.error('Error creating configuration:', error);
            toast.error('Failed to create configuration');
        }
    };

    const handleUpdateConfigurationStatus = async (configId, status) => {
        try {
            console.log('🔄 Updating configuration status:', { configId, status });
            setUpdatingConfigId(configId);

            const response = await apiService.updateReferralRewardsConfigurationStatus(configId, status);
            console.log('✅ Configuration status update response:', response);

            if (response.success) {
                toast.success(`Configuration ${status === 'active' ? 'activated' : 'deactivated'} successfully!`);
                // Update the local state immediately for better UX
                setConfigurations(prevConfigs =>
                    prevConfigs.map(config =>
                        config._id === configId
                            ? { ...config, status }
                            : config
                    )
                );
                // Also reload all data to ensure consistency
                loadAllData();
            } else {
                console.error('❌ Configuration update failed:', response);
                toast.error(response.error || 'Failed to update configuration status');
            }
        } catch (error) {
            console.error('❌ Error updating configuration status:', error);
            toast.error(error.response?.data?.error || 'Failed to update configuration status');
        } finally {
            setUpdatingConfigId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map(i => (
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
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Referral Rewards Management</h1>
                    <p className="text-gray-600 mt-2">Manage and monitor the referral rewards system</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm p-6 border border-green-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-500 rounded-lg">
                                <UserGroupIcon className="h-6 w-6 text-white" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-green-700">Total Referrals</p>
                                <p className="text-2xl font-bold text-green-900">
                                    {referralStats?.totalReferrals || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-6 border border-blue-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-500 rounded-lg">
                                <CurrencyDollarIcon className="h-6 w-6 text-white" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-blue-700">Total Points Awarded</p>
                                <p className="text-2xl font-bold text-blue-900">
                                    {referralStats?.totalPointsAwarded || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm p-6 border border-purple-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-500 rounded-lg">
                                <CheckCircleIcon className="h-6 w-6 text-white" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-purple-700">Completion Rate</p>
                                <p className="text-2xl font-bold text-purple-900">
                                    {referralStats?.completionRate || '0%'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-sm p-6 border border-yellow-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-yellow-500 rounded-lg">
                                <TrophyIcon className="h-6 w-6 text-white" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-yellow-700">Active Configs</p>
                                <p className="text-2xl font-bold text-yellow-900">
                                    {Array.isArray(configurations) ? configurations.filter(c => c.status === 'active').length : 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="mb-8">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                            { id: 'configurations', name: 'Configurations', icon: CogIcon },
                            { id: 'profitability', name: 'Profitability', icon: ArrowTrendingUpIcon },
                            { id: 'leaderboard', name: 'Leaderboard', icon: TrophyIcon }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <tab.icon className="h-5 w-5" />
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* System Status */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">System Status</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                    <h3 className="font-semibold text-gray-900 mb-1">System Active</h3>
                                    <p className="text-sm text-gray-600">All services running normally</p>
                                </div>

                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <CalendarIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                    <h3 className="font-semibold text-gray-900 mb-1">Monthly Budget</h3>
                                    <p className="text-sm text-gray-600">
                                        ₺{profitabilityAnalysis?.monthlyBudget || 1500} / ₺{profitabilityAnalysis?.maxBudget || 1500}
                                    </p>
                                </div>

                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <GiftIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                                    <h3 className="font-semibold text-gray-900 mb-1">Active Referrers</h3>
                                    <p className="text-sm text-gray-600">
                                        {referralStats?.activeReferrers || 0} drivers
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                    >
                                        <span className="text-green-700 font-medium">Create New Configuration</span>
                                        <PlusIcon className="h-5 w-5 text-green-600" />
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('profitability')}
                                        className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        <span className="text-blue-700 font-medium">View Profitability Analysis</span>
                                        <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600" />
                                    </button>
                                </div>
                            </div>

                            <RecentActivityWidget limit={5} />
                        </div>
                    </div>
                )}

                {activeTab === 'configurations' && (
                    <div className="space-y-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Configurations</h2>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Create New
                                </button>
                            </div>

                            <div className="space-y-4">
                                {Array.isArray(configurations) && configurations.length > 0 ? (
                                    configurations.map((config, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{config.name}</h3>
                                                    <p className="text-sm text-gray-600">{config.description}</p>
                                                    <div className="flex items-center space-x-4 mt-2">
                                                        <span className={`text-xs px-2 py-1 rounded-full ${config.status === 'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {config.status}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            Created: {new Date(config.createdAt).toLocaleDateString('en-US')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            // TODO: Implement edit functionality
                                                            console.log('Edit config:', config);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateConfigurationStatus(
                                                            config._id,
                                                            config.status === 'active' ? 'inactive' : 'active'
                                                        )}
                                                        disabled={updatingConfigId === config._id}
                                                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${updatingConfigId === config._id
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : config.status === 'active'
                                                                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                            }`}
                                                    >
                                                        {updatingConfigId === config._id ? (
                                                            <span className="flex items-center">
                                                                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Updating...
                                                            </span>
                                                        ) : (
                                                            config.status === 'active' ? 'Deactivate' : 'Activate'
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <CogIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500 text-lg">No configurations found</p>
                                        <p className="text-sm text-gray-400">Create your first configuration to get started</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'profitability' && (
                    <div className="space-y-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Profitability Analysis</h2>

                            {profitabilityAnalysis ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Month</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Total Revenue:</span>
                                                <span className="font-medium">₺{profitabilityAnalysis.totalRevenue || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Company Share (40%):</span>
                                                <span className="font-medium">₺{profitabilityAnalysis.companyShare || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Referral Costs:</span>
                                                <span className="font-medium text-red-600">₺{profitabilityAnalysis.referralCosts || 0}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2">
                                                <span className="text-gray-900 font-medium">Net Profit:</span>
                                                <span className="font-bold text-green-600">₺{profitabilityAnalysis.netProfit || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Completion Rate:</span>
                                                <span className="font-medium text-green-600">
                                                    {referralStats?.completionRate || '0%'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Budget Controls</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600">Monthly Budget Usage</span>
                                                    <span className="text-gray-900">
                                                        {profitabilityAnalysis.budgetUsage || 0}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${Math.min(profitabilityAnalysis.budgetUsage || 0, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                <p>Monthly Budget: ₺{profitabilityAnalysis.monthlyBudget || 1500}</p>
                                                <p>Max Budget: ₺{profitabilityAnalysis.maxBudget || 1500}</p>
                                                <p>Per-Referee Limit: ₺{profitabilityAnalysis.perRefereeLimit || 300}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <ArrowTrendingUpIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg">No profitability data available</p>
                                    <p className="text-sm text-gray-400">Data will appear once referrals are processed</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="space-y-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Monthly Leaderboard</h2>
                                <div className="flex items-center space-x-2">
                                    <TrophyIcon className="h-5 w-5 text-yellow-500" />
                                    <span className="text-sm text-gray-600">August 2025</span>
                                </div>
                            </div>

                            {leaderboard?.leaderboard && leaderboard.leaderboard.length > 0 ? (
                                <div className="space-y-4">
                                    {leaderboard.leaderboard.slice(0, 10).map((entry, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500 text-white' :
                                                    index === 1 ? 'bg-gray-400 text-white' :
                                                        index === 2 ? 'bg-orange-500 text-white' :
                                                            'bg-gray-200 text-gray-700'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {entry.driverName || 'Unknown Driver'}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {entry.totalReferrals} referrals • {entry.totalPoints} points
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">
                                                    {entry.monthlyReward || 0} points
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {index < 3 ? 'Reward' : 'No reward'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <TrophyIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg">No leaderboard data available</p>
                                    <p className="text-sm text-gray-400">Data will appear once referrals are processed</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Configuration Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="mb-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Create New Referral Configuration</h3>
                                <p className="text-sm text-gray-600">
                                    Configure how drivers earn points for referring new drivers to your platform. This system helps grow your driver network through incentivized referrals.
                                </p>
                            </div>

                            <div className="space-y-6">
                                {/* Basic Information Section */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                        <CogIcon className="h-5 w-5 text-gray-600 mr-2" />
                                        Basic Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Configuration Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                                placeholder="e.g., Summer 2024 Referral Program"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                A unique name to identify this referral configuration
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Description <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                                placeholder="e.g., Enhanced rewards for summer driver recruitment"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Brief description of this configuration's purpose
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Reward Structure Section */}
                                <div className="bg-green-50 rounded-lg p-4">
                                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                        <CurrencyDollarIcon className="h-5 w-5 text-green-600 mr-2" />
                                        Reward Structure
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Activation Bonus Points <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.activationBonus.referrerPoints}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    activationBonus: { ...formData.activationBonus, referrerPoints: parseInt(e.target.value) || 0 }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                                placeholder="20"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                <strong>One-time bonus</strong> when a referred driver completes their first 3 deliveries.
                                                This incentivizes quality referrals.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Per-Delivery Reward Points <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.perDeliveryReward.referrerPoints}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    perDeliveryReward: { ...formData.perDeliveryReward, referrerPoints: parseInt(e.target.value) || 0 }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                                placeholder="8"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                <strong>Ongoing reward</strong> for each delivery completed by the referred driver.
                                                Creates long-term value for referrers.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Monthly Budget (₺) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.profitabilityControls.monthlyReferralBudget}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    profitabilityControls: { ...formData.profitabilityControls, monthlyReferralBudget: parseInt(e.target.value) || 0 }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                                placeholder="1500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                <strong>Total monthly spending limit</strong> for all referral rewards.
                                                Helps control costs and maintain profitability.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* How It Works Section */}
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                        <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600 mr-2" />
                                        How This Configuration Works
                                    </h4>
                                    <div className="space-y-3 text-sm text-gray-700">
                                        <div className="flex items-start space-x-3">
                                            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                                            <div>
                                                <p className="font-medium">Driver Shares Referral Code</p>
                                                <p className="text-gray-600">Existing drivers share their unique referral code with potential new drivers.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-3">
                                            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                                            <div>
                                                <p className="font-medium">New Driver Signs Up</p>
                                                <p className="text-gray-600">New driver uses the referral code during registration and gets activated.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-3">
                                            <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                                            <div>
                                                <p className="font-medium">Activation Bonus Earned</p>
                                                <p className="text-gray-600">After 3 deliveries, referrer gets <strong>{formData.activationBonus.referrerPoints} points</strong> as activation bonus.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-3">
                                            <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                                            <div>
                                                <p className="font-medium">Ongoing Rewards</p>
                                                <p className="text-gray-600">Referrer earns <strong>{formData.perDeliveryReward.referrerPoints} points</strong> for each subsequent delivery by the referred driver.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Budget Impact Section */}
                                <div className="bg-yellow-50 rounded-lg p-4">
                                    <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                        <GiftIcon className="h-5 w-5 text-yellow-600 mr-2" />
                                        Budget Impact Estimation
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="bg-white rounded-lg p-3">
                                            <p className="font-medium text-gray-900 mb-2">Example Monthly Scenario:</p>
                                            <ul className="space-y-1 text-gray-600">
                                                <li>• 10 new drivers referred</li>
                                                <li>• Each completes 20 deliveries/month</li>
                                                <li>• Activation bonus: 10 × {formData.activationBonus.referrerPoints} = {10 * formData.activationBonus.referrerPoints} points</li>
                                                <li>• Per-delivery: 200 × {formData.perDeliveryReward.referrerPoints} = {200 * formData.perDeliveryReward.referrerPoints} points</li>
                                                <li className="font-medium text-gray-900 pt-1 border-t">Total: {(10 * formData.activationBonus.referrerPoints) + (200 * formData.perDeliveryReward.referrerPoints)} points</li>
                                            </ul>
                                        </div>
                                        <div className="bg-white rounded-lg p-3">
                                            <p className="font-medium text-gray-900 mb-2">Budget Recommendations:</p>
                                            <ul className="space-y-1 text-gray-600">
                                                <li>• Start with conservative values</li>
                                                <li>• Monitor actual vs. projected costs</li>
                                                <li>• Adjust based on driver behavior</li>
                                                <li>• Budget: ₺{formData.profitabilityControls.monthlyReferralBudget}/month</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Action Buttons */}
                            <div className="bg-gray-50 rounded-lg p-4 mt-6">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        <p className="font-medium mb-1">Ready to create this configuration?</p>
                                        <p>Once created, you can activate it to start the referral program.</p>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => setShowCreateModal(false)}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCreateConfiguration}
                                            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 rounded-md hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm"
                                        >
                                            Create Configuration
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReferralRewardsAdmin;
