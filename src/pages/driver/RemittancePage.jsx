import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatCardSkeleton, RemittanceItemSkeleton } from '../../components/common/SkeletonLoader';
import apiService from '../../services/api';
import Pagination from '../../components/common/Pagination';
import RemittanceDetailsModal from '../../components/common/RemittanceDetailsModal';
import { useSystemSettings } from '../../context/SystemSettingsContext';
import {
    CurrencyDollarIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    PlusIcon,
    BanknotesIcon,
    InformationCircleIcon,
    EyeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const RemittancePage = () => {
    const { formatCurrency } = useSystemSettings();
    const { user } = useAuth();
    const [remittances, setRemittances] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedRemittance, setSelectedRemittance] = useState(null);
    const [requestAmount, setRequestAmount] = useState('');
    const [filters, setFilters] = useState({
        status: ''
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const fetchRemittances = useCallback(async () => {
        try {
            setLoading(true);
            const driverId = user._id || user.id;
            if (!driverId) {
                console.error('No driver ID available');
                return;
            }

            // Call real remittances API
            const response = await apiService.getDriverRemittances();

            if (response.success && response.data) {
                const remittancesData = response.data.remittances || [];
                setRemittances(remittancesData);
                setSummary(response.data.summary || {
                    totalEarnings: 0,
                    availableBalance: 0,
                    pendingAmount: 0,
                    totalPaidOut: 0,
                    lastPayout: null
                });
                console.log('✅ Remittances loaded from API:', response.data);
                console.log('📊 Remittances data structure:', remittancesData.map(r => ({
                    reference: r.referenceNumber || r.reference,
                    status: r.status,
                    amount: r.amount
                })));
            } else {
                console.error('Remittances API response invalid:', response);
                toast.error('Failed to load remittances data');
                setRemittances([]);
                setSummary({
                    totalEarnings: 0,
                    availableBalance: 0,
                    pendingAmount: 0,
                    totalPaidOut: 0,
                    lastPayout: null
                });
            }
        } catch (error) {
            console.error('Error fetching remittances:', error);
            toast.error('Failed to load remittances');
        } finally {
            setLoading(false);
        }
    }, [user]);

    const fetchSummary = useCallback(async () => {
        try {
            const driverId = user._id || user.id;
            if (!driverId) {
                console.error('No driver ID available');
                return;
            }
            // Summary is loaded with remittances in this implementation
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchRemittances();
            fetchSummary();
        }
    }, [user, fetchRemittances, fetchSummary]);

    // Refresh data
    const refreshData = async () => {
        setRefreshing(true);
        await fetchRemittances();
        await fetchSummary();
        setRefreshing(false);
        toast.success('Data refreshed!');
    };

    // Request new remittance
    const handleRequestRemittance = async () => {
        if (!requestAmount || parseFloat(requestAmount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (parseFloat(requestAmount) > summary.availableBalance) {
            toast.error('Amount exceeds available balance');
            return;
        }

        try {
            // Mock successful request
            const newRemittance = {
                id: Date.now(),
                amount: parseFloat(requestAmount),
                status: 'pending',
                requestDate: new Date().toISOString(),
                method: 'bank_transfer',
                reference: `REF-${Date.now()}`,
                description: 'Payout request'
            };

            setRemittances(prev => [newRemittance, ...prev]);
            setSummary(prev => ({
                ...prev,
                availableBalance: prev.availableBalance - parseFloat(requestAmount),
                pendingAmount: prev.pendingAmount + parseFloat(requestAmount)
            }));

            setShowRequestModal(false);
            setRequestAmount('');
            toast.success('Remittance request submitted successfully!');
        } catch (error) {
            console.error('Error requesting remittance:', error);
            toast.error('Failed to submit remittance request');
        }
    };

    const handleViewRemittance = (remittance) => {
        setSelectedRemittance(remittance);
        setShowDetailsModal(true);
    };

    const handleCloseDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedRemittance(null);
    };

    // Status helpers
    const getStatusConfig = (status) => {
        const configs = {
            completed: {
                color: 'bg-green-500',
                bgColor: 'bg-green-50',
                textColor: 'text-green-700',
                borderColor: 'border-green-200',
                icon: CheckCircleIcon,
                label: 'Completed'
            },
            pending: {
                color: 'bg-yellow-500',
                bgColor: 'bg-yellow-50',
                textColor: 'text-yellow-700',
                borderColor: 'border-yellow-200',
                icon: ClockIcon,
                label: 'Pending'
            },
            processing: {
                color: 'bg-blue-500',
                bgColor: 'bg-blue-50',
                textColor: 'text-blue-700',
                borderColor: 'border-blue-200',
                icon: ArrowPathIcon,
                label: 'Processing'
            },
            rejected: {
                color: 'bg-red-500',
                bgColor: 'bg-red-50',
                textColor: 'text-red-700',
                borderColor: 'border-red-200',
                icon: XCircleIcon,
                label: 'Rejected'
            }
        };
        return configs[status] || configs.pending;
    };

    // Filter remittances
    const filteredRemittances = remittances.filter(remittance => {
        if (!filters.status) {
            return true; // Show all if no filter selected
        }

        // Normalize status values for comparison
        const remittanceStatus = (remittance.status || '').toLowerCase().trim();
        const filterStatus = (filters.status || '').toLowerCase().trim();

        const matches = remittanceStatus === filterStatus;

        console.log('🔍 Filtering remittance:', {
            reference: remittance.referenceNumber || remittance.reference,
            originalStatus: remittance.status,
            normalizedStatus: remittanceStatus,
            filterStatus: filterStatus,
            matches: matches
        });

        return matches;
    });

    // Pagination
    const totalPages = Math.ceil(filteredRemittances.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedRemittances = filteredRemittances.slice(startIndex, endIndex);



    if (loading) {
        return (
            <div className="space-y-6">
                {/* Balance Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                </div>

                {/* Remittances List Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <RemittanceItemSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Remittance Details Modal */}
            <RemittanceDetailsModal
                isOpen={showDetailsModal}
                onClose={handleCloseDetailsModal}
                remittance={selectedRemittance}
            />

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Remittances</h1>
                            <p className="text-gray-600 mt-1">Manage your payout requests and payment history</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Refresh button removed - WebSocket provides real-time updates */}
                            <div className="relative">
                                <button
                                    disabled={true}
                                    className="bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 cursor-not-allowed opacity-50"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    <span>Request Payout</span>
                                </button>
                                <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                    Coming Soon
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Available Balance */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 mb-2">Available Balance</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {formatCurrency(summary.availableBalance || 0)}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-green-50">
                                    <BanknotesIcon className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        {/* Pending Payouts */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 mb-2">Pending Payouts</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {formatCurrency(summary.pendingAmount || 0)}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-yellow-50">
                                    <ClockIcon className="h-6 w-6 text-yellow-600" />
                                </div>
                            </div>
                        </div>

                        {/* Total Paid Out */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 mb-2">Total Paid Out</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {formatCurrency(summary.totalPaidOut || 0)}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-blue-50">
                                    <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        {/* Last Payout */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 mb-2">Last Payout</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {formatCurrency(summary.lastPayout?.amount || 0)}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-purple-50">
                                    <DocumentTextIcon className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filter Section */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                            <span className="text-sm text-gray-600">Filter by Status:</span>
                        </div>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    {/* Remittances List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {paginatedRemittances.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Reference
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Method
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Request Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedRemittances.map((remittance, index) => {
                                            const statusConfig = getStatusConfig(remittance.status);
                                            const StatusIcon = statusConfig.icon;

                                            return (
                                                <tr key={remittance._id || remittance.id || remittance.referenceNumber || remittance.reference || `remittance-${index}`} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {remittance.referenceNumber || remittance.reference || 'N/A'}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {remittance.description}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {formatCurrency(remittance.amount)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} border`}>
                                                            <StatusIcon className="w-3 h-3 mr-1" />
                                                            {statusConfig.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {remittance.paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                                                            remittance.paymentMethod === 'mobile_money' ? 'Mobile Money' :
                                                                remittance.paymentMethod === 'cash' ? 'Cash' :
                                                                    'Other'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {remittance.createdAt ? new Date(remittance.createdAt).toLocaleDateString() : 'N/A'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {remittance.createdAt ? new Date(remittance.createdAt).toLocaleTimeString() : 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button
                                                            onClick={() => handleViewRemittance(remittance)}
                                                            className="text-green-600 hover:text-green-900 flex items-center"
                                                        >
                                                            <EyeIcon className="w-4 h-4 mr-1" />
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No remittances found</h3>
                                <p className="text-gray-500 mb-6">
                                    {filters.status ?
                                        `No remittances with "${filters.status}" status.` :
                                        "You haven't made any payout requests yet."
                                    }
                                </p>
                                <div className="relative inline-block">
                                    <button
                                        disabled={true}
                                        className="inline-flex items-center px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-50"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-2" />
                                        Request Your First Payout
                                    </button>
                                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                        Coming Soon
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {filteredRemittances.length > itemsPerPage && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredRemittances.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    )}

                    {/* Support Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Support & Information</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Support Cards */}
                            <div className="space-y-4">
                                <a
                                    href="https://wa.me/905338329785"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all group"
                                >
                                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                        <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 2.079.529 4.0 1.459 5.68L.029 24l6.592-1.729c1.618.826 3.436 1.296 5.396 1.296 6.621 0 11.988-5.367 11.988-11.987C23.988 5.367 18.621.001 12.017.001zM12.017 21.92c-1.737 0-3.396-.441-4.838-1.204l-.347-.206-3.595.942.959-3.507-.225-.359a9.861 9.861 0 01-1.474-5.298c0-5.464 4.445-9.909 9.909-9.909s9.909 4.445 9.909 9.909-4.445 9.909-9.909 9.909z" />
                                            <path d="M17.185 14.716c-.301-.15-1.781-.879-2.057-.979-.276-.101-.477-.151-.678.15-.2.301-.776.979-.951 1.181-.175.2-.351.226-.652.075-.301-.15-1.271-.468-2.42-1.493-.894-.798-1.497-1.784-1.672-2.085-.176-.301-.019-.464.132-.613.135-.133.301-.351.452-.527.15-.175.2-.301.301-.502.101-.2.05-.376-.025-.527-.075-.15-.678-1.634-.931-2.235-.246-.584-.497-.505-.678-.515-.176-.009-.376-.009-.577-.009s-.527.075-.803.376c-.276.301-1.053 1.029-1.053 2.51s1.078 2.909 1.228 3.109c.15.2 2.12 3.237 5.136 4.541.717.31 1.277.494 1.714.632.72.229 1.375.196 1.893.119.577-.086 1.781-.728 2.032-1.431.252-.703.252-1.305.176-1.431-.075-.125-.276-.2-.577-.351z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 group-hover:text-green-700">WhatsApp Support</h3>
                                        <p className="text-sm text-gray-600">+90 533 832 97 85</p>
                                    </div>
                                </a>

                                <a
                                    href="https://instagram.com/greepit"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-all group"
                                >
                                    <div className="p-2 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition-colors">
                                        <svg className="h-6 w-6 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 group-hover:text-pink-700">Follow Us</h3>
                                        <p className="text-sm text-gray-600">@greepit</p>
                                    </div>
                                </a>
                            </div>

                            {/* Payout Information */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex">
                                    <InformationCircleIcon className="w-5 h-5 text-blue-400 mt-0.5" />
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-800">Payout Information</h3>
                                        <div className="mt-2 text-sm text-blue-700">
                                            <ul className="list-disc list-inside space-y-1">
                                                <li>Payouts are processed within 1-3 business days</li>
                                                <li>Minimum payout amount is ₺50</li>
                                                <li>You can request payouts when your balance reaches ₺25</li>
                                                <li>All transactions are secure and encrypted</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Request Remittance Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Request Payout</h3>

                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">Available Balance:</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(summary.availableBalance || 0)}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payout Amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">₺</span>
                                    <input
                                        type="number"
                                        value={requestAmount}
                                        onChange={(e) => setRequestAmount(e.target.value)}
                                        placeholder="0.00"
                                        max={summary.availableBalance}
                                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Maximum: {formatCurrency(summary.availableBalance || 0)}
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Method
                                </label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="mobile_money">Mobile Money</option>
                                </select>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowRequestModal(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <div className="flex-1 relative">
                                    <button
                                        disabled={true}
                                        className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-400 border border-transparent rounded-md cursor-not-allowed opacity-50"
                                    >
                                        Request Payout
                                    </button>
                                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-1 py-0.5 rounded-full font-medium">
                                        Coming Soon
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

export default RemittancePage; 