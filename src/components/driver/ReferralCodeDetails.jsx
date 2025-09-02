import React from 'react';
import {
    CheckCircleIcon,
    UserIcon,
    ClockIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

const ReferralCodeDetails = ({ referralData, configData }) => {
    if (!referralData?.referralCode) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="text-center">
                    <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Referral Code</h3>
                    <p className="text-gray-600">You don't have a referral code yet. Contact support to get one.</p>
                </div>
            </div>
        );
    }

    const formatReferralCode = (code) => {
        if (!code) return '';
        return code.replace(/(.{4})/g, '$1 ').trim();
    };

    const copyReferralCode = async () => {
        if (!referralData?.referralCode) return;
        try {
            await navigator.clipboard.writeText(referralData.referralCode);
            // You can add a toast notification here
        } catch (error) {
            console.error('Failed to copy referral code:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Main Referral Code Display */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 sm:mb-0">Your Permanent Referral Code</h2>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Status: Active & Permanent</span>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-2">Share this permanent code with new drivers:</p>
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                <div className="bg-white px-4 py-3 rounded-lg border border-green-300">
                                    <p className="font-mono text-lg font-bold text-green-600 text-center sm:text-left">
                                        {formatReferralCode(referralData.referralCode)}
                                    </p>
                                </div>
                                <button
                                    onClick={copyReferralCode}
                                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-sm"
                                >
                                    Copy Code
                                </button>
                            </div>
                        </div>
                        <div className="text-center lg:text-right">
                            <p className="text-sm text-gray-600 mb-1">Rewards</p>
                            <p className="text-sm font-medium text-gray-900">You: {configData?.activationBonus?.referrerPoints || 15} points</p>
                            <p className="text-sm font-medium text-gray-900">Friend: {configData?.activationBonus?.refereePoints || 5} points</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Code Statistics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Code Statistics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                            {referralData.totalUses || 0}
                        </div>
                        <p className="text-sm text-gray-600">Total Uses</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                            {referralData.referralsGiven?.total || 0}
                        </div>
                        <p className="text-sm text-gray-600">Active Referrals</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                            {referralData.referralsGiven?.totalPoints || 0}
                        </div>
                        <p className="text-sm text-gray-600">Total Points Earned</p>
                    </div>
                </div>
            </div>

            {/* Usage History */}
            {referralData?.usageHistory && referralData.usageHistory.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Usage History</h3>
                        <span className="text-sm text-gray-500">Total Uses: {referralData.totalUses || 0}</span>
                    </div>
                    <div className="space-y-3">
                        {referralData.usageHistory.slice(0, 5).map((usage, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <UserIcon className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {usage.driverName || 'New Driver'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Used on {new Date(usage.usedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Status</p>
                                    <p className="text-sm font-medium text-green-600">Active</p>
                                </div>
                            </div>
                        ))}
                        {referralData.usageHistory.length > 5 && (
                            <p className="text-sm text-gray-500 text-center">
                                +{referralData.usageHistory.length - 5} more uses
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Code Benefits */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Permanent Code Benefits</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1" />
                        <div>
                            <p className="font-medium text-gray-900">Never Expires</p>
                            <p className="text-sm text-gray-600">Your code is permanent and can be used anytime</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1" />
                        <div>
                            <p className="font-medium text-gray-900">Reusable</p>
                            <p className="text-sm text-gray-600">Same code can be shared with multiple people</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1" />
                        <div>
                            <p className="font-medium text-gray-900">Continuous Earnings</p>
                            <p className="text-sm text-gray-600">Earn points on every delivery from your referrals</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1" />
                        <div>
                            <p className="font-medium text-gray-900">Complete Tracking</p>
                            <p className="text-sm text-gray-600">Full history of all code uses and earnings</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReferralCodeDetails;
