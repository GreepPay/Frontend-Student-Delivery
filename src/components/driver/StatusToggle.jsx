import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/ToastProvider';
import { useDriverStatus } from '../layouts/DriverLayout';
import apiService from '../../services/api';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const StatusToggle = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const { isOnline: driverLayoutStatus } = useDriverStatus();
    const [isActive, setIsActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch current status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                console.log('🔄 StatusToggle: Fetching driver status from profile...');
                const response = await apiService.getDriverProfile();
                console.log('📊 StatusToggle: Profile response:', response);

                if (response.success && response.data) {
                    // Check multiple possible field names for status (same as DriverLayout)
                    let statusValue = false;

                    console.log('🔍 StatusToggle: Checking status fields in response.data:', {
                        isOnline: response.data.isOnline,
                        status: response.data.status,
                        profileStatus: response.data.profile?.status,
                        isActive: response.data.isActive,
                        fullData: response.data
                    });

                    if (response.data.isOnline !== undefined) {
                        statusValue = response.data.isOnline;
                        console.log('✅ StatusToggle: Using isOnline field:', statusValue);
                    } else if (response.data.status !== undefined) {
                        statusValue = response.data.status === 'active';
                        console.log('✅ StatusToggle: Using status field:', response.data.status, '->', statusValue);
                    } else if (response.data.profile?.status !== undefined) {
                        statusValue = response.data.profile.status === 'active';
                        console.log('✅ StatusToggle: Using profile.status field:', response.data.profile.status, '->', statusValue);
                    } else if (response.data.isActive !== undefined) {
                        statusValue = response.data.isActive;
                        console.log('✅ StatusToggle: Using isActive field:', statusValue);
                    } else {
                        console.log('⚠️ StatusToggle: No status field found, defaulting to false');
                    }

                    console.log('✅ StatusToggle: Final status value:', statusValue);
                    setIsActive(statusValue);
                }
            } catch (error) {
                console.error('❌ StatusToggle: Error fetching driver status:', error);
                // Fallback to DriverLayout status if available
                if (driverLayoutStatus !== undefined) {
                    console.log('🔄 StatusToggle: Using DriverLayout status as fallback:', driverLayoutStatus);
                    setIsActive(driverLayoutStatus);
                } else {
                    // If we can't fetch status, default to inactive for safety
                    setIsActive(false);
                }
            }
        };

        if (user) {
            fetchStatus();
        }
    }, [user]);

    // Sync with DriverLayout status as fallback (only if we haven't loaded from profile yet)
    useEffect(() => {
        if (driverLayoutStatus !== undefined && isActive === false && driverLayoutStatus === true) {
            console.log('🔄 StatusToggle: DriverLayout shows active, but we show inactive - this might be a sync issue');
            // Don't automatically sync - let the profile data be the source of truth
        }
    }, [driverLayoutStatus, isActive]);

    const handleToggleStatus = async () => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            const newStatus = !isActive;
            const statusString = newStatus ? 'active' : 'offline';
            console.log('🔄 StatusToggle: Updating driver status to:', statusString);
            console.log('🔄 StatusToggle: Current isActive state:', isActive);
            console.log('🔄 StatusToggle: New status boolean:', newStatus);

            const response = await apiService.updateDriverStatus(statusString);
            console.log('✅ StatusToggle: Status update response:', response);
            console.log('✅ StatusToggle: Response data:', response.data);

            if (response.success) {
                setIsActive(newStatus);
                console.log('✅ StatusToggle: Status updated successfully, new status:', newStatus);
                showSuccess(
                    newStatus
                        ? 'You are now ACTIVE and ready to receive delivery requests!'
                        : 'You are now INACTIVE and will not receive delivery requests.'
                );
            } else {
                console.error('❌ StatusToggle: Status update failed:', response);
                showError('Failed to update status. Please try again.');
            }
        } catch (error) {
            console.error('Error updating driver status:', error);
            showError('Failed to update status. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            {/* Mobile Layout - Stacked */}
            <div className="block sm:hidden">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Delivery Status</h3>
                    {/* Status Indicator */}
                    <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className={`text-xs font-medium ${isActive ? 'text-green-700' : 'text-gray-600'}`}>
                            {isActive ? 'Ready' : 'Offline'}
                        </span>
                    </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {isActive
                        ? 'You are currently active and receiving delivery requests'
                        : 'You are currently inactive and not receiving delivery requests'
                    }
                </p>

                {/* Mobile Toggle Switch - Centered */}
                <div className="flex items-center justify-center space-x-3 px-4">
                    <span className={`text-sm font-medium whitespace-nowrap ${!isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                        Inactive
                    </span>

                    <button
                        onClick={handleToggleStatus}
                        disabled={isLoading}
                        className={`
                            relative inline-flex h-10 w-16 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex-shrink-0
                            ${isActive
                                ? 'bg-green-600'
                                : 'bg-gray-300'
                            }
                            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        <span
                            className={`
                                inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out
                                ${isActive ? 'translate-x-7' : 'translate-x-1'}
                            `}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    {isActive ? (
                                        <CheckIcon className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <XMarkIcon className="w-4 h-4 text-gray-400" />
                                    )}
                                </div>
                            )}
                        </span>
                    </button>

                    <span className={`text-sm font-medium whitespace-nowrap ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                        Active
                    </span>
                </div>
            </div>

            {/* Desktop Layout - Side by Side */}
            <div className="hidden sm:flex items-center justify-between">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Delivery Status</h3>
                    <p className="text-sm text-gray-600">
                        {isActive
                            ? 'You are currently active and receiving delivery requests'
                            : 'You are currently inactive and not receiving delivery requests'
                        }
                    </p>
                </div>

                {/* Desktop Toggle Switch */}
                <div className="flex items-center space-x-3">
                    <span className={`text-sm font-medium ${!isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                        Inactive
                    </span>

                    <button
                        onClick={handleToggleStatus}
                        disabled={isLoading}
                        className={`
                            relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                            ${isActive
                                ? 'bg-green-600'
                                : 'bg-gray-300'
                            }
                            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        <span
                            className={`
                                inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out
                                ${isActive ? 'translate-x-7' : 'translate-x-1'}
                            `}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    {isActive ? (
                                        <CheckIcon className="w-3 h-3 text-green-600" />
                                    ) : (
                                        <XMarkIcon className="w-3 h-3 text-gray-400" />
                                    )}
                                </div>
                            )}
                        </span>
                    </button>

                    <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                        Active
                    </span>
                </div>
            </div>

            {/* Desktop Status Indicator */}
            <div className="hidden sm:flex items-center mt-4">
                <div className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className={`text-sm font-medium ${isActive ? 'text-green-700' : 'text-gray-600'}`}>
                    {isActive ? 'Ready to deliver' : 'Not available for deliveries'}
                </span>
            </div>
        </div>
    );
};

export default StatusToggle;
