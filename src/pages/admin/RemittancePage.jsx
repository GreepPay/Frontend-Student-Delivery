import React, { useState, useEffect, useCallback } from 'react';
import { capitalizeName } from '../../utils/nameUtils';
import {
    PlusIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    CurrencyDollarIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import Pagination from '../../components/common/Pagination';
import AdminRemittanceSkeleton from '../../components/common/AdminRemittanceSkeleton';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import BalancedRemittanceCalculator from '../../components/admin/BalancedRemittanceCalculator';
import apiService from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const RemittancePage = () => {
    const { user } = useAuth();
    const [remittances, setRemittances] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [stats, setStats] = useState({
        pending: 0,
        completed: 0,
        cancelled: 0,
        totalAmount: 0
    });
    const [filters, setFilters] = useState({
        status: '',
        driverId: '',
        startDate: '',
        endDate: ''
    });
    const [selectedDriverForDetails, setSelectedDriverForDetails] = useState(null);
    const [driverRemittanceDetails, setDriverRemittanceDetails] = useState(null);
    const [loadingDriverDetails, setLoadingDriverDetails] = useState(false);
    const [selectedDriverDetails, setSelectedDriverDetails] = useState(null);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showBulkGenerateModal, setShowBulkGenerateModal] = useState(false);
    const [showBalancedCalculator, setShowBalancedCalculator] = useState(false);
    const [selectedRemittance, setSelectedRemittance] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    // Form states
    const [formData, setFormData] = useState({
        driverId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [bulkFormData, setBulkFormData] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dueDateDays: 7
    });

    // Toast notification
    const [toastNotification, setToastNotification] = useState({
        show: false,
        message: '',
        type: 'success'
    });

    const loadRemittances = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.getRemittances({
                page: currentPage,
                limit: itemsPerPage,
                ...filters
            });

            if (response && response.success) {
                // Handle the new API response structure
                const remittancesData = response.data?.remittances || response.remittances || [];
                const remittancesArray = Array.isArray(remittancesData) ? remittancesData : [];
                setRemittances(remittancesArray);

                // Handle pagination from the new structure
                const pagination = response.data?.pagination || response.pagination || {};
                setTotalPages(pagination.totalPages || pagination.pages || 1);
                setTotalItems(pagination.totalItems || pagination.total || 0);

                // Also update stats from the same response if available
                const statistics = response.data?.statistics || response.statistics || {};
                if (statistics && Object.keys(statistics).length > 0) {
                    setStats({
                        pending: statistics.pendingRemittances || 0,
                        completed: statistics.completedRemittances || 0,
                        cancelled: statistics.cancelledRemittances || 0,
                        totalAmount: statistics.totalAmount || 0,
                        totalPaid: statistics.totalPaid || 0,
                        totalPending: statistics.totalPending || 0,
                        totalOverdue: statistics.totalOverdue || 0,
                        completionRate: statistics.completionRate || 0
                    });
                }
            } else {
                setRemittances([]);
                setTotalPages(1);
                setTotalItems(0);
            }
        } catch (error) {
            console.error('❌ RemittancePage: Error loading remittances:', error);
            toast.error('Failed to load remittances');
            setRemittances([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, filters]);

    const fetchDrivers = useCallback(async () => {
        try {
            const response = await apiService.getDrivers();
            let driversArray = [];
            if (response && response.success && response.data && response.data.drivers) {
                driversArray = response.data.drivers;
            } else if (response && response.data && response.data.drivers) {
                driversArray = response.data.drivers;
            } else if (response && response.drivers) {
                driversArray = response.drivers;
            } else if (Array.isArray(response)) {
                driversArray = response;
            } else if (response && response.data && Array.isArray(response.data)) {
                driversArray = response.data;
            }
            setDrivers(driversArray);
        } catch (error) {
            console.error('❌ RemittancePage: Error loading drivers:', error);
            setDrivers([]);
        }
    }, []);

    const loadRemittanceStats = useCallback(async () => {
        try {
            const response = await apiService.getRemittanceStats();
            if (response && response.success) {
                const statsData = response.data?.statistics || response.statistics || {};
                setStats({
                    pending: statsData.pendingRemittances || 0,
                    completed: statsData.completedRemittances || 0,
                    cancelled: statsData.cancelledRemittances || 0,
                    totalAmount: statsData.totalAmount || 0,
                    totalPaid: statsData.totalPaid || 0,
                    totalPending: statsData.totalPending || 0,
                    totalOverdue: statsData.totalOverdue || 0,
                    completionRate: statsData.completionRate || 0
                });
            }
        } catch (error) {
            console.error('❌ RemittancePage: Error loading statistics:', error);
            // Don't show error toast as stats might already be loaded from main response
        }
    }, []);

    useEffect(() => {
        loadRemittances();
        fetchDrivers();
        loadRemittanceStats();
    }, [loadRemittances, fetchDrivers, loadRemittanceStats]);

    const loadDriverRemittanceDetails = useCallback(async (driverId, startDate = null, endDate = null) => {
        if (!driverId || driverId.trim() === '') {
            setSelectedDriverDetails(null);
            setDriverRemittanceDetails(null);
            return;
        }

        try {
            setLoadingDriverDetails(true);

            // Use provided date range or default to current month
            const today = new Date();
            const defaultStartDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            const defaultEndDate = today.toISOString().split('T')[0];

            const calculateStartDate = startDate || defaultStartDate;
            const calculateEndDate = endDate || defaultEndDate;

            const summaryResponse = await apiService.getDriverRemittanceSummary(driverId);
            const remittancesResponse = await apiService.getDriverRemittancesForDetails(driverId);
            const paymentStructureResponse = await apiService.getPaymentStructure();

            // Get calculate endpoint data for pending remittance amount
            let calculateResponse = null;
            try {
                calculateResponse = await apiService.calculateDriverRemittance(driverId, calculateStartDate, calculateEndDate);
            } catch (calculateError) {
                console.warn('⚠️ Could not fetch calculate endpoint data:', calculateError);
            }

            const driver = drivers.find(d => (d._id || d.id) === driverId);
            setSelectedDriverDetails(driver);

            // Merge summary data with calculate data for accurate pending amount
            const summaryData = summaryResponse.data || summaryResponse;
            const calculateData = calculateResponse?.data || calculateResponse;

            console.log('🔍 RemittancePage: Summary data received:', summaryData);
            console.log('🔍 RemittancePage: Calculate data received:', calculateData);

            const enhancedSummary = {
                ...summaryData,
                // Use calculate endpoint data for pending remittance if available
                pendingAmount: calculateData?.remittanceAmount || summaryData.pendingAmount || 0,
                totalDriverEarnings: calculateData?.totalDriverEarnings || summaryData.totalDriverEarnings || 0
            };

            console.log('🔍 RemittancePage: Enhanced summary data:', enhancedSummary);

            setDriverRemittanceDetails({
                summary: enhancedSummary,
                remittances: remittancesResponse.data?.remittances || remittancesResponse.remittances || [],
                paymentStructure: paymentStructureResponse.data || paymentStructureResponse
            });
        } catch (error) {
            console.error('❌ RemittancePage: Error loading driver remittance details:', error);
            setSelectedDriverDetails(null);
            setDriverRemittanceDetails(null);
        } finally {
            setLoadingDriverDetails(false);
        }
    }, [drivers]);

    const handleBulkGenerateRemittances = async () => {
        try {
            await apiService.bulkGenerateRemittances(bulkFormData);
            setToastNotification({
                show: true,
                message: 'Bulk remittance generation completed successfully!',
                type: 'success'
            });
            setShowBulkGenerateModal(false);
            setBulkFormData({
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                dueDateDays: 7
            });
            loadRemittances();
            loadRemittanceStats();
        } catch (error) {
            console.error('❌ RemittancePage: Error bulk generating remittances:', error);

            if (error.response?.data?.error) {
                const errorMessage = error.response.data.error;

                if (errorMessage.includes('No remittance amount to generate')) {
                    toast.error('No pending cash deliveries found for any drivers in the selected date range.');
                } else if (errorMessage.includes('Invalid date range')) {
                    toast.error('Please select a valid date range for bulk generation.');
                } else {
                    toast.error(`Bulk generation failed: ${errorMessage}`);
                }
            } else if (error.response?.status === 400) {
                toast.error('Invalid request data. Please check your input and try again.');
            } else if (error.response?.status === 500) {
                toast.error('Server error during bulk generation. Please try again later.');
            } else {
                toast.error('Bulk generation failed. Please try again.');
            }
        }
    };

    const handleCreateRemittance = async () => {
        if (!formData.driverId || formData.driverId.trim() === '') {
            toast.error('Please select a driver');
            return;
        }

        if (!formData.startDate) {
            toast.error('Start date is required');
            return;
        }

        if (!formData.endDate) {
            toast.error('End date is required');
            return;
        }

        if (new Date(formData.endDate) < new Date(formData.startDate)) {
            toast.error('End date cannot be before start date');
            return;
        }

        if (!user) {
            toast.error('User session not found. Please refresh the page and try again.');
            return;
        }

        try {
            const remittanceData = {
                driverId: formData.driverId,
                startDate: formData.startDate,
                endDate: formData.endDate,
                handledByName: user?.name || user?.fullName || 'System Admin'
            };

            await apiService.createRemittance(remittanceData);
            setToastNotification({
                show: true,
                message: 'Remittance created successfully',
                type: 'success'
            });
            setShowCreateModal(false);
            setFormData({ driverId: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] });
            loadRemittances();
        } catch (error) {
            console.error('❌ RemittancePage: Error creating remittance:', error);

            // Check for specific error messages and provide user-friendly feedback
            if (error.response?.data?.error) {
                const errorMessage = error.response.data.error;

                if (errorMessage.includes('No remittance amount to generate')) {
                    toast.error('No pending cash deliveries found for this driver in the selected date range. All deliveries may have been already remitted or cancelled.');
                } else if (errorMessage.includes('Driver not found')) {
                    toast.error('Selected driver not found. Please try selecting a different driver.');
                } else if (errorMessage.includes('Invalid date range')) {
                    toast.error('Please select a valid date range.');
                } else if (errorMessage.includes('No deliveries found')) {
                    toast.error('No deliveries found for this driver in the selected date range.');
                } else {
                    toast.error(`Remittance creation failed: ${errorMessage}`);
                }
            } else if (error.response?.status === 400) {
                toast.error('Invalid request data. Please check your input and try again.');
            } else if (error.response?.status === 401) {
                toast.error('Authentication required. Please log in again.');
            } else if (error.response?.status === 403) {
                toast.error('Permission denied. You do not have access to create remittances.');
            } else if (error.response?.status === 404) {
                toast.error('Service not found. Please contact support.');
            } else if (error.response?.status === 500) {
                toast.error('Server error. Please try again later.');
            } else if (error.code === 'ERR_NETWORK') {
                toast.error('Network error. Please check your connection and try again.');
            } else {
                toast.error('Failed to create remittance. Please try again.');
            }
        }
    };

    const handleCompleteRemittance = async () => {
        try {
            await apiService.completeRemittance(selectedRemittance._id);
            setToastNotification({
                show: true,
                message: 'Remittance completed successfully',
                type: 'success'
            });
            setShowCompleteModal(false);
            setSelectedRemittance(null);
            loadRemittances();
        } catch (error) {
            console.error('❌ RemittancePage: Error completing remittance:', error);

            if (error.response?.data?.error) {
                const errorMessage = error.response.data.error;
                toast.error(`Failed to complete remittance: ${errorMessage}`);
            } else if (error.response?.status === 400) {
                toast.error('Invalid request. Please check the remittance status.');
            } else if (error.response?.status === 404) {
                toast.error('Remittance not found.');
            } else if (error.response?.status === 500) {
                toast.error('Server error. Please try again later.');
            } else {
                toast.error('Failed to complete remittance. Please try again.');
            }
        }
    };

    const handleCancelRemittance = async () => {
        try {
            await apiService.cancelRemittance(selectedRemittance._id, cancelReason);
            setToastNotification({
                show: true,
                message: 'Remittance cancelled successfully',
                type: 'success'
            });
            setShowCancelModal(false);
            setSelectedRemittance(null);
            setCancelReason('');
            loadRemittances();
        } catch (error) {
            console.error('❌ RemittancePage: Error cancelling remittance:', error);

            if (error.response?.data?.error) {
                const errorMessage = error.response.data.error;

                if (errorMessage.includes('reason') && errorMessage.includes('not allowed to be empty')) {
                    toast.error('Please provide a reason for cancelling the remittance.');
                } else {
                    toast.error(`Failed to cancel remittance: ${errorMessage}`);
                }
            } else if (error.response?.status === 400) {
                toast.error('Invalid request. Please check the remittance status and reason.');
            } else if (error.response?.status === 404) {
                toast.error('Remittance not found.');
            } else if (error.response?.status === 500) {
                toast.error('Server error. Please try again later.');
            } else {
                toast.error('Failed to cancel remittance. Please try again.');
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'text-yellow-600 bg-yellow-50';
            case 'completed':
                return 'text-green-600 bg-green-50';
            case 'cancelled':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <ClockIcon className="w-3 h-3" />;
            case 'completed':
                return <CheckCircleIcon className="w-3 h-3" />;
            case 'cancelled':
                return <XCircleIcon className="w-3 h-3" />;
            default:
                return <ClockIcon className="w-3 h-3" />;
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <AdminRemittanceSkeleton />;
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50 flex flex-col">
                {/* Toast Notification */}
                {toastNotification.show && (
                    <div className={`fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg text-xs ${toastNotification.type === 'success'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                        }`}>
                        <div className="flex items-center">
                            <span className="mr-2">
                                {toastNotification.type === 'success' ? '✅' : '❌'}
                            </span>
                            <span>{toastNotification.message}</span>
                            <button
                                onClick={() => setToastNotification({ ...toastNotification, show: false })}
                                className="ml-3 text-white hover:text-gray-200"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                {/* Header - Responsive */}
                <div className="bg-white border-b border-gray-200 px-4 py-4 sm:py-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div>
                            <h1 className="text-xl sm:text-lg font-bold text-gray-900">Remittance Management</h1>
                            <p className="text-sm sm:text-xs text-gray-600">Automatically calculate remittances from completed deliveries</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={async () => {
                                    setRefreshing(true);
                                    try {
                                        await Promise.all([loadRemittances(), loadRemittanceStats()]);
                                        toast.success('Data refreshed successfully');
                                    } catch (error) {
                                        console.error('Error refreshing data:', error);
                                    } finally {
                                        setRefreshing(false);
                                    }
                                }}
                                disabled={refreshing}
                                className="inline-flex items-center px-3 py-2 sm:py-1.5 border border-gray-300 text-sm sm:text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowPathIcon className={`h-4 w-4 sm:h-3 sm:w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                                {refreshing ? 'Refreshing...' : 'Refresh'}
                            </button>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center px-3 py-2 sm:py-1.5 border border-transparent text-sm sm:text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <PlusIcon className="h-4 w-4 sm:h-3 sm:w-3 mr-1" />
                                Calculate
                            </button>
                            <button
                                onClick={() => setShowBalancedCalculator(true)}
                                className="inline-flex items-center px-3 py-2 sm:py-1.5 border border-transparent text-sm sm:text-xs font-medium rounded text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                <PlusIcon className="h-4 w-4 sm:h-3 sm:w-3 mr-1" />
                                Balanced
                            </button>
                            <button
                                onClick={() => setShowBulkGenerateModal(true)}
                                className="inline-flex items-center px-3 py-2 sm:py-1.5 border border-transparent text-sm sm:text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                📊 Bulk
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Stats Bar - Responsive */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200 px-4 py-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm sm:text-xs text-gray-600">Total Amount:</span>
                                <span className="font-semibold text-sm sm:text-xs text-gray-900">₺{(stats.totalAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm sm:text-xs text-gray-600">Completed:</span>
                                <span className="font-semibold text-sm sm:text-xs text-green-700">{stats.completed || 0}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm sm:text-xs text-gray-600">Pending:</span>
                                <span className="font-semibold text-sm sm:text-xs text-yellow-700">{stats.pending || 0}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm sm:text-xs text-gray-600">Cancelled:</span>
                                <span className="font-semibold text-sm sm:text-xs text-red-700">{stats.cancelled || 0}</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm sm:text-xs text-gray-600">Completion Rate:</span>
                            <span className="font-semibold text-sm sm:text-xs text-blue-700">{(stats.completionRate || 0).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                {/* Main Content - Responsive Layout */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Left Panel - Stats and Driver Details - Hidden on mobile, shown on desktop */}
                    <div className="hidden lg:flex lg:w-1/3 flex-col border-r border-gray-200">
                        {/* Stats Cards - Compact */}
                        <div className="bg-white p-3 border-b border-gray-200">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-yellow-50 rounded p-2">
                                    <div className="flex items-center">
                                        <ClockIcon className="h-3 w-3 text-yellow-600 mr-1" />
                                        <span className="text-xs text-yellow-800">Pending</span>
                                    </div>
                                    <p className="text-sm font-bold text-yellow-900">{stats.pending || 0}</p>
                                    <p className="text-xs text-yellow-700">₺{(stats.totalPending || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-green-50 rounded p-2">
                                    <div className="flex items-center">
                                        <CheckCircleIcon className="h-3 w-3 text-green-600 mr-1" />
                                        <span className="text-xs text-green-800">Completed</span>
                                    </div>
                                    <p className="text-sm font-bold text-green-900">{stats.completed || 0}</p>
                                    <p className="text-xs text-green-700">₺{(stats.totalPaid || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-red-50 rounded p-2">
                                    <div className="flex items-center">
                                        <XCircleIcon className="h-3 w-3 text-red-600 mr-1" />
                                        <span className="text-xs text-red-800">Cancelled</span>
                                    </div>
                                    <p className="text-sm font-bold text-red-900">{stats.cancelled || 0}</p>
                                </div>
                                <div className="bg-blue-50 rounded p-2">
                                    <div className="flex items-center">
                                        <CurrencyDollarIcon className="h-3 w-3 text-blue-600 mr-1" />
                                        <span className="text-xs text-blue-800">Total</span>
                                    </div>
                                    <p className="text-sm font-bold text-blue-900">₺{(stats.totalAmount || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-purple-50 rounded p-2">
                                    <div className="flex items-center">
                                        <CurrencyDollarIcon className="h-3 w-3 text-purple-600 mr-1" />
                                        <span className="text-xs text-purple-800">Completion</span>
                                    </div>
                                    <p className="text-sm font-bold text-purple-900">{(stats.completionRate || 0).toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>

                        {/* Driver Selection and Details */}
                        <div className="flex-1 bg-white p-3 overflow-y-auto">
                            <div className="mb-3">
                                <h3 className="text-xs font-semibold text-gray-900 mb-2">Driver Details</h3>
                                <SearchableDropdown
                                    options={drivers.map(driver => ({
                                        value: driver._id || driver.id,
                                        label: `${capitalizeName(driver.name)} (${driver.email})`,
                                        name: capitalizeName(driver.name),
                                        email: driver.email
                                    }))}
                                    value={selectedDriverForDetails || ''}
                                    onChange={(driverId) => {
                                        setSelectedDriverForDetails(driverId);
                                        if (driverId) {
                                            loadDriverRemittanceDetails(driverId);
                                        } else {
                                            setDriverRemittanceDetails(null);
                                        }
                                    }}
                                    placeholder="Select driver"
                                    searchPlaceholder="Search drivers..."
                                    className="text-xs"
                                    allowClear={true}
                                    renderOption={(option, isSelected) => (
                                        <div className="flex flex-col">
                                            <span className="font-medium text-xs">{option.name}</span>
                                            <span className="text-xs text-gray-500">{option.email}</span>
                                        </div>
                                    )}
                                />
                            </div>

                            {/* Driver Details Panel */}
                            {selectedDriverForDetails && (
                                <div className="space-y-3">
                                    {loadingDriverDetails ? (
                                        <div className="flex items-center justify-center py-4">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                            <span className="ml-2 text-xs text-gray-600">Loading...</span>
                                        </div>
                                    ) : driverRemittanceDetails ? (
                                        <div className="space-y-3">
                                            {/* Driver Summary Cards - Compact */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-blue-50 rounded p-2">
                                                    <p className="text-xs text-blue-600 font-medium">Total Earnings</p>
                                                    <p className="text-sm font-bold text-blue-900">
                                                        ₺{(driverRemittanceDetails.summary?.totalEarnings || 0).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="bg-green-50 rounded p-2">
                                                    <p className="text-xs text-green-600 font-medium">Pending</p>
                                                    <p className="text-sm font-bold text-green-900">
                                                        ₺{(driverRemittanceDetails.summary?.pendingAmount || 0).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="bg-purple-50 rounded p-2">
                                                    <p className="text-xs text-purple-600 font-medium">Completed</p>
                                                    <p className="text-sm font-bold text-purple-900">
                                                        {driverRemittanceDetails.summary?.completedCount || 0}
                                                    </p>
                                                </div>
                                                <div className="bg-orange-50 rounded p-2">
                                                    <p className="text-xs text-orange-600 font-medium">Pending Count</p>
                                                    <p className="text-sm font-bold text-orange-900">
                                                        {driverRemittanceDetails.summary?.pendingCount || 0}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Recent Remittances - Compact */}
                                            <div>
                                                <h4 className="text-xs font-semibold text-gray-700 mb-2">Recent Remittances</h4>
                                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                                    {driverRemittanceDetails.remittances.slice(0, 5).map((remittance, index) => (
                                                        <div key={index} className="flex items-center justify-between text-xs bg-gray-50 rounded p-2">
                                                            <div>
                                                                <span className="text-gray-600">
                                                                    {new Date(remittance.createdAt).toLocaleDateString('en-US')}
                                                                </span>
                                                                <span className={`ml-2 px-1 py-0.5 rounded text-xs ${remittance.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                    remittance.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {remittance.status}
                                                                </span>
                                                            </div>
                                                            <span className="font-medium text-gray-900">
                                                                ₺{remittance.amount || 0}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {driverRemittanceDetails.remittances.length === 0 && (
                                                        <div className="text-center py-2 text-xs text-gray-500">
                                                            No remittances found
                                                        </div>
                                                    )}

                                                    {/* Helpful message when no remittances exist */}
                                                    {driverRemittanceDetails.remittances.length === 0 && (
                                                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                                            <div className="flex items-start">
                                                                <div className="flex-shrink-0">
                                                                    <CurrencyDollarIcon className="h-3 w-3 text-blue-600 mt-0.5" />
                                                                </div>
                                                                <div className="ml-2">
                                                                    <p className="text-blue-800 font-medium">No Remittances Yet</p>
                                                                    <p className="text-blue-700">This driver has no remittance history. Remittances are created from completed cash deliveries.</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Helpful message about remittance creation */}
                                                {driverRemittanceDetails.remittances.length > 0 &&
                                                    driverRemittanceDetails.remittances.every(r => r.status === 'cancelled') && (
                                                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                                            <div className="flex items-start">
                                                                <div className="flex-shrink-0">
                                                                    <ClockIcon className="h-3 w-3 text-yellow-600 mt-0.5" />
                                                                </div>
                                                                <div className="ml-2">
                                                                    <p className="text-yellow-800 font-medium">No Pending Deliveries</p>
                                                                    <p className="text-yellow-700">All remittances are cancelled. New remittances can only be created from pending cash deliveries.</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-xs text-gray-500">
                                            No driver details available
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Filters and Table/Cards - Full width on mobile */}
                    <div className="flex-1 lg:w-2/3 flex flex-col">
                        {/* Filters - Responsive */}
                        <div className="bg-white p-4 sm:p-3 border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-2 sm:flex-wrap sm:gap-2">
                                <div className="flex items-center space-x-2">
                                    <FunnelIcon className="h-4 w-4 sm:h-3 sm:w-3 text-gray-400" />
                                    <span className="text-sm sm:text-xs font-medium text-gray-700">Filters:</span>
                                </div>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="px-3 py-2 sm:px-2 sm:py-1 border border-gray-300 rounded text-sm sm:text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <div className="w-full sm:w-32">
                                    <SearchableDropdown
                                        options={[
                                            { value: '', label: 'All Drivers' },
                                            ...drivers.map(driver => ({
                                                value: driver._id || driver.id,
                                                label: capitalizeName(driver.name),
                                                email: driver.email
                                            }))
                                        ]}
                                        value={filters.driverId}
                                        onChange={(driverId) => setFilters({ ...filters, driverId })}
                                        placeholder="All Drivers"
                                        searchPlaceholder="Search drivers..."
                                        className="text-sm sm:text-xs"
                                        showSearch={drivers.length > 5}
                                        maxHeight="max-h-40"
                                        renderOption={(option, isSelected) => (
                                            option.value === '' ? (
                                                <span className="text-gray-700 text-sm sm:text-xs">{option.label}</span>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm sm:text-xs">{option.label}</span>
                                                    <span className="text-sm sm:text-xs text-gray-500">{option.email}</span>
                                                </div>
                                            )
                                        )}
                                    />
                                </div>
                                <div className="flex space-x-2">
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                        className="px-3 py-2 sm:px-2 sm:py-1 border border-gray-300 rounded text-sm sm:text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    />
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                        className="px-3 py-2 sm:px-2 sm:py-1 border border-gray-300 rounded text-sm sm:text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Remittances Content - Responsive */}
                        <div className="flex-1 bg-white overflow-hidden">
                            <div className="h-full flex flex-col">
                                <div className="flex-1 overflow-auto">
                                    {/* Desktop Table View */}
                                    <div className="hidden lg:block">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {(() => {
                                                    // Filter remittances based on current filters
                                                    const filteredRemittances = (Array.isArray(remittances) ? remittances : []).filter(remittance => {
                                                        // Status filter
                                                        if (filters.status && remittance.status !== filters.status) {
                                                            return false;
                                                        }
                                                        // Driver filter
                                                        if (filters.driverId && remittance.driverId !== filters.driverId) {
                                                            return false;
                                                        }
                                                        return true;
                                                    });

                                                    return filteredRemittances.length > 0 ? (
                                                        filteredRemittances.map((remittance) => (
                                                            <tr key={remittance._id} className="hover:bg-gray-50">
                                                                <td className="px-3 py-2 whitespace-nowrap">
                                                                    <div className="text-xs font-medium text-gray-900">
                                                                        {remittance.referenceNumber || 'N/A'}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {remittance.description || 'No description'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2 whitespace-nowrap">
                                                                    <div className="text-xs font-medium text-gray-900">
                                                                        {capitalizeName(remittance.driverName || remittance.driverId?.fullName || remittance.driver?.name || 'Unknown Driver')}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {remittance.driverEmail || remittance.driverId?.email || remittance.driver?.email || 'No email'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2 whitespace-nowrap">
                                                                    <div className="text-xs font-medium text-gray-900">
                                                                        ₺{(remittance.amount || 0).toLocaleString()}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {remittance.deliveryIds?.length || 0} deliveries
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2 whitespace-nowrap">
                                                                    <div className="text-xs font-medium text-gray-900 capitalize">
                                                                        {remittance.paymentMethod || 'N/A'}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {remittance.handledByName || 'Not handled'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2 whitespace-nowrap">
                                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(remittance.status)}`}>
                                                                        {getStatusIcon(remittance.status)}
                                                                        <span className="ml-1 capitalize">{remittance.status}</span>
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2 whitespace-nowrap">
                                                                    <div className="text-xs text-gray-900 max-w-xs truncate" title={remittance.notes || remittance.adminNotes || 'No notes'}>
                                                                        {remittance.notes || remittance.adminNotes || 'No notes'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                                                    {formatDate(remittance.createdAt)}
                                                                </td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                                                                    <div className="flex items-center justify-end space-x-1">
                                                                        {remittance.status === 'pending' && (
                                                                            <>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setSelectedRemittance(remittance);
                                                                                        setShowCompleteModal(true);
                                                                                    }}
                                                                                    className="text-green-600 hover:text-green-900 p-1"
                                                                                    title="Complete"
                                                                                >
                                                                                    <CheckCircleIcon className="w-3 h-3" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setSelectedRemittance(remittance);
                                                                                        setShowCancelModal(true);
                                                                                    }}
                                                                                    className="text-red-600 hover:text-red-900 p-1"
                                                                                    title="Cancel"
                                                                                >
                                                                                    <XCircleIcon className="w-3 h-3" />
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="8" className="px-3 py-8 text-center text-gray-500">
                                                                <div className="flex flex-col items-center">
                                                                    <CurrencyDollarIcon className="h-8 w-8 text-gray-400 mb-2" />
                                                                    <p className="text-sm font-medium">No remittances found</p>
                                                                    <p className="text-xs text-gray-400">Create a new remittance to get started</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="lg:hidden">
                                        {(() => {
                                            // Filter remittances based on current filters
                                            const filteredRemittances = (Array.isArray(remittances) ? remittances : []).filter(remittance => {
                                                // Status filter
                                                if (filters.status && remittance.status !== filters.status) {
                                                    return false;
                                                }
                                                // Driver filter
                                                if (filters.driverId && remittance.driverId !== filters.driverId) {
                                                    return false;
                                                }
                                                return true;
                                            });

                                            return filteredRemittances.length > 0 ? (
                                                <div className="space-y-3 p-4">
                                                    {filteredRemittances.map((remittance) => (
                                                        <div key={remittance._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex-1">
                                                                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                                                        {remittance.referenceNumber || 'N/A'}
                                                                    </h3>
                                                                    <p className="text-xs text-gray-600 mb-2">
                                                                        {remittance.description || 'No description'}
                                                                    </p>
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(remittance.status)}`}>
                                                                            {getStatusIcon(remittance.status)}
                                                                            <span className="ml-1 capitalize">{remittance.status}</span>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-lg font-bold text-gray-900">
                                                                        ₺{(remittance.amount || 0).toLocaleString()}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {remittance.deliveryIds?.length || 0} deliveries
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Driver:</span>
                                                                    <span className="font-medium text-gray-900">
                                                                        {capitalizeName(remittance.driverName || remittance.driverId?.fullName || remittance.driver?.name || 'Unknown Driver')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Email:</span>
                                                                    <span className="text-gray-900">
                                                                        {remittance.driverEmail || remittance.driverId?.email || remittance.driver?.email || 'No email'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Payment Method:</span>
                                                                    <span className="text-gray-900 capitalize">
                                                                        {remittance.paymentMethod || 'N/A'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Handled By:</span>
                                                                    <span className="text-gray-900">
                                                                        {remittance.handledByName || 'Not handled'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Created:</span>
                                                                    <span className="text-gray-900">
                                                                        {formatDate(remittance.createdAt)}
                                                                    </span>
                                                                </div>
                                                                {remittance.notes || remittance.adminNotes ? (
                                                                    <div className="pt-2 border-t border-gray-100">
                                                                        <span className="text-gray-600">Notes:</span>
                                                                        <p className="text-gray-900 mt-1">
                                                                            {remittance.notes || remittance.adminNotes}
                                                                        </p>
                                                                    </div>
                                                                ) : null}
                                                            </div>

                                                            {/* Mobile Actions */}
                                                            {remittance.status === 'pending' && (
                                                                <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-100">
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedRemittance(remittance);
                                                                            setShowCompleteModal(true);
                                                                        }}
                                                                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                                    >
                                                                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                                                                        Complete
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedRemittance(remittance);
                                                                            setShowCancelModal(true);
                                                                        }}
                                                                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                                    >
                                                                        <XCircleIcon className="w-4 h-4 mr-1" />
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-12 px-4">
                                                    <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mb-4" />
                                                    <p className="text-lg font-medium text-gray-900 mb-2">No remittances found</p>
                                                    <p className="text-sm text-gray-500 text-center">Create a new remittance to get started</p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Pagination - Responsive */}
                                {Array.isArray(remittances) && remittances.length > 0 && (
                                    <div className="px-4 sm:px-3 py-3 sm:py-2 border-t border-gray-200">
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={setCurrentPage}
                                            itemsPerPage={itemsPerPage}
                                            onItemsPerPageChange={setItemsPerPage}
                                            totalItems={totalItems}
                                            startIndex={(currentPage - 1) * itemsPerPage + 1}
                                            endIndex={Math.min(currentPage * itemsPerPage, totalItems)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals - Keep existing modal code */}
            {/* Create Remittance Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Create Remittance</h3>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Form Section */}
                                <div className="space-y-4">
                                    <SearchableDropdown
                                        label="Driver"
                                        required={true}
                                        options={drivers.map(driver => ({
                                            value: driver._id || driver.id,
                                            label: `${capitalizeName(driver.name)} (${driver.email})`,
                                            name: capitalizeName(driver.name),
                                            email: driver.email
                                        }))}
                                        value={formData.driverId}
                                        onChange={(driverId) => {
                                            setFormData({ ...formData, driverId });
                                            loadDriverRemittanceDetails(driverId, formData.startDate, formData.endDate);
                                        }}
                                        placeholder="Select Driver"
                                        searchPlaceholder="Search drivers..."
                                        allowClear={true}
                                        renderOption={(option, isSelected) => (
                                            <div className="flex flex-col">
                                                <span className="font-medium">{option.name}</span>
                                                <span className="text-xs text-gray-500">{option.email}</span>
                                            </div>
                                        )}
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => {
                                                const newStartDate = e.target.value;
                                                setFormData({ ...formData, startDate: newStartDate });
                                                // Reload driver details with new date range if driver is selected
                                                if (formData.driverId) {
                                                    loadDriverRemittanceDetails(formData.driverId, newStartDate, formData.endDate);
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            min={formData.startDate}
                                            onChange={(e) => {
                                                const newEndDate = e.target.value;
                                                setFormData({ ...formData, endDate: newEndDate });
                                                // Reload driver details with new date range if driver is selected
                                                if (formData.driverId) {
                                                    loadDriverRemittanceDetails(formData.driverId, formData.startDate, newEndDate);
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                </div>

                                {/* Driver Details Section */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                                        Driver Remittance Details
                                    </h4>

                                    {loadingDriverDetails ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                                            <span className="ml-2 text-sm text-gray-600">Loading driver details...</span>
                                        </div>
                                    ) : selectedDriverDetails && driverRemittanceDetails ? (
                                        <div className="space-y-4">
                                            {/* Driver Info */}
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                        <span className="text-green-600 font-semibold text-sm">
                                                            {selectedDriverDetails.name?.charAt(0)?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{selectedDriverDetails.name}</h5>
                                                        <p className="text-sm text-gray-600">{selectedDriverDetails.email}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Remittance Summary */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-green-50 rounded-lg p-3">
                                                    <p className="text-xs text-green-600 font-medium">Total Earnings</p>
                                                    <p className="text-lg font-bold text-green-700">
                                                        ₺{driverRemittanceDetails.summary?.totalPaid || driverRemittanceDetails.summary?.totalEarnings || 0}
                                                    </p>
                                                </div>
                                                <div className="bg-blue-50 rounded-lg p-3">
                                                    <p className="text-xs text-blue-600 font-medium">Pending Remittance</p>
                                                    <p className="text-lg font-bold text-blue-700">
                                                        ₺{driverRemittanceDetails.summary?.pendingAmount || (driverRemittanceDetails.summary?.totalAmount - driverRemittanceDetails.summary?.totalPaid) || 0}
                                                    </p>
                                                </div>
                                                <div className="bg-purple-50 rounded-lg p-3">
                                                    <p className="text-xs text-purple-600 font-medium">Completed Remittances</p>
                                                    <p className="text-lg font-bold text-purple-700">
                                                        {driverRemittanceDetails.summary?.completedRemittances || driverRemittanceDetails.summary?.completedCount || 0}
                                                    </p>
                                                </div>
                                                <div className="bg-orange-50 rounded-lg p-3">
                                                    <p className="text-xs text-orange-600 font-medium">Pending Remittances</p>
                                                    <p className="text-lg font-bold text-orange-700">
                                                        {driverRemittanceDetails.summary?.pendingRemittances || driverRemittanceDetails.summary?.pendingCount || 0}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Recent Remittances */}
                                            {driverRemittanceDetails.remittances && driverRemittanceDetails.remittances.length > 0 && (
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <p className="text-xs font-medium text-gray-700 mb-2">Recent Remittances</p>
                                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                                        {driverRemittanceDetails.remittances.slice(0, 3).map((remittance, index) => (
                                                            <div key={index} className="flex items-center justify-between text-xs">
                                                                <span className="text-gray-600">
                                                                    {new Date(remittance.createdAt).toLocaleDateString('en-US')}
                                                                </span>
                                                                <span className={`px-2 py-1 rounded-full text-xs ${remittance.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                    remittance.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {remittance.status}
                                                                </span>
                                                                <span className="font-medium text-gray-900">
                                                                    ₺{remittance.amount || 0}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : formData.driverId ? (
                                        <div className="flex items-center justify-center py-8">
                                            <p className="text-sm text-gray-500">No remittance data available for this driver</p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-8">
                                            <p className="text-sm text-gray-500">Select a driver to view their remittance details</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setSelectedDriverDetails(null);
                                    setDriverRemittanceDetails(null);
                                }}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateRemittance}
                                disabled={!formData.driverId || !formData.startDate || !formData.endDate}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Create Remittance
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Complete Remittance Modal */}
            {showCompleteModal && selectedRemittance && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900">Complete Remittance</h3>
                        </div>
                        <div className="p-4">
                            <p className="text-xs text-gray-600">
                                Are you sure you want to mark this remittance as completed?
                            </p>
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
                            <button
                                onClick={() => setShowCompleteModal(false)}
                                className="px-3 py-1.5 text-gray-600 border border-gray-300 rounded text-xs hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCompleteRemittance}
                                className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                            >
                                Complete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Remittance Modal */}
            {showCancelModal && selectedRemittance && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900">Cancel Remittance</h3>
                        </div>
                        <div className="p-4">
                            <div className="space-y-3">
                                <p className="text-xs text-gray-600">
                                    Are you sure you want to cancel this remittance?
                                </p>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
                                    <textarea
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                        rows={3}
                                        placeholder="Enter cancellation reason..."
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="px-3 py-1.5 text-gray-600 border border-gray-300 rounded text-xs hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCancelRemittance}
                                className="px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                            >
                                Cancel Remittance
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Generate Remittances Modal */}
            {showBulkGenerateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900">Bulk Generate Remittances</h3>
                        </div>
                        <div className="p-4">
                            <div className="space-y-3">
                                <p className="text-xs text-gray-600">
                                    Generate remittances for all drivers based on cash deliveries in the specified period.
                                </p>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={bulkFormData.startDate}
                                        onChange={(e) => setBulkFormData({ ...bulkFormData, startDate: e.target.value })}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={bulkFormData.endDate}
                                        onChange={(e) => setBulkFormData({ ...bulkFormData, endDate: e.target.value })}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Due Date (Days)</label>
                                    <input
                                        type="number"
                                        value={bulkFormData.dueDateDays}
                                        onChange={(e) => setBulkFormData({ ...bulkFormData, dueDateDays: parseInt(e.target.value) })}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                        placeholder="7"
                                        min="1"
                                        max="30"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
                            <button
                                onClick={() => setShowBulkGenerateModal(false)}
                                className="px-3 py-1.5 text-gray-600 border border-gray-300 rounded text-xs hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkGenerateRemittances}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            >
                                Generate for All Drivers
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Balanced Remittance Calculator Modal */}
            {showBalancedCalculator && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Balanced Remittance Calculator</h3>
                                <button
                                    onClick={() => setShowBalancedCalculator(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircleIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <BalancedRemittanceCalculator
                                onCalculate={(calculation) => {
                                    console.log('Balanced remittance calculated:', calculation);
                                }}
                                onGenerate={(remittance) => {
                                    console.log('Balanced remittance generated:', remittance);
                                    setShowBalancedCalculator(false);
                                    loadRemittances();
                                    toast.success('Balanced remittance generated successfully!');
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RemittancePage; 