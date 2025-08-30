import React, { useState, useEffect } from 'react';
import { ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import socketService from '../../services/socketService';
import toast from 'react-hot-toast';

const RecentActivityWidget = ({ limit = 5, className = '' }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadRecentActivity = async () => {
        try {
            setRefreshing(true);
            console.log('🔍 Loading recent activity with limit:', limit);

            const response = await apiService.getReferralRecentActivity(limit);
            console.log('🔍 Recent activity API response:', response);

            if (response.success) {
                console.log('✅ Recent activity loaded successfully:', response.data);
                setActivities(response.data || []);
            } else {
                console.error('❌ Failed to load recent activity:', response.message);
                toast.error('Failed to load recent activity data');
                setActivities([]); // Show empty state instead of mock data
            }
        } catch (error) {
            console.error('❌ Error loading recent activity:', error);
            console.error('❌ Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            toast.error('Failed to load recent activity');
            setActivities([]); // Show empty state instead of mock data
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadRecentActivity();

        // Set up real-time updates via WebSocket
        const handleReferralUpdate = (data) => {
            console.log('🔔 Received referral update:', data);
            // Show notification for new activity
            toast.success('New referral activity detected!', {
                duration: 3000,
                icon: '🎯'
            });
            // Refresh activity when new referral activity occurs
            loadRecentActivity();
        };

        const handlePointsUpdate = (data) => {
            console.log('🏆 Received points update:', data);
            // Show notification for new activity
            toast.success('New points activity detected!', {
                duration: 3000,
                icon: '🏆'
            });
            // Refresh activity when new points activity occurs
            loadRecentActivity();
        };

        // Listen for referral and points updates
        if (socketService.socket) {
            socketService.socket.on('referral_update', handleReferralUpdate);
            socketService.socket.on('points_update', handlePointsUpdate);
        }

        return () => {
            // Clean up event listeners
            if (socketService.socket) {
                socketService.socket.off('referral_update', handleReferralUpdate);
                socketService.socket.off('points_update', handlePointsUpdate);
            }
        };
    }, [limit]);

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const diff = now - new Date(timestamp);
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return `${days} day${days > 1 ? 's' : ''} ago`;
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'referral_completed':
                return '🎯';
            case 'configuration_updated':
                return '⚙️';
            case 'points_awarded':
                return '🏆';
            case 'referral_started':
                return '🚀';
            default:
                return '📝';
        }
    };

    const getActivityColor = (type) => {
        switch (type) {
            case 'referral_completed':
                return 'text-green-600';
            case 'configuration_updated':
                return 'text-blue-600';
            case 'points_awarded':
                return 'text-yellow-600';
            case 'referral_started':
                return 'text-purple-600';
            default:
                return 'text-gray-600';
        }
    };

    if (loading) {
        return (
            <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300"></div>
                </div>
                <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <button
                    onClick={loadRecentActivity}
                    disabled={refreshing}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Refresh activity"
                >
                    <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="space-y-3">
                {activities.length > 0 ? (
                    activities.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3 flex-1">
                                <span className="text-lg">{getActivityIcon(activity.type)}</span>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {activity.description}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatTimeAgo(activity.timestamp)}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                {activity.points && (
                                    <span className={`text-sm font-medium ${getActivityColor(activity.type)}`}>
                                        +{activity.points} points
                                    </span>
                                )}
                                {activity.status && (
                                    <span className={`text-sm font-medium ${getActivityColor(activity.type)}`}>
                                        {activity.status}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-6 text-gray-500">
                        <ClockIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm font-medium">No recent activity</p>
                        <p className="text-xs text-gray-400 mt-1">Activity will appear here when drivers complete referrals or earn points</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentActivityWidget;
