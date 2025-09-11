import React, { useState, useEffect } from 'react';
import {
    CalculatorIcon,
    InformationCircleIcon,
    CurrencyDollarIcon,
    BanknotesIcon,
    CreditCardIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import toast from 'react-hot-toast';
import BalancedRemittanceExplanation from '../common/BalancedRemittanceExplanation';
import { useAuth } from '../../context/AuthContext';

const BalancedRemittanceCalculator = ({
    driverId: propDriverId,
    driverName: propDriverName,
    startDate: propStartDate,
    endDate: propEndDate,
    onCalculate,
    onGenerate,
    showGenerateButton = true
}) => {
    const [loading, setLoading] = useState(false);
    const [calculation, setCalculation] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);

    // Internal state for driver selection
    const [drivers, setDrivers] = useState([]);
    const [selectedDriverId, setSelectedDriverId] = useState(propDriverId || '');
    const [selectedDriverName, setSelectedDriverName] = useState(propDriverName || '');
    const [startDate, setStartDate] = useState(propStartDate || new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(propEndDate || new Date().toISOString().split('T')[0]);
    const [loadingDrivers, setLoadingDrivers] = useState(false);

    // Get current user for handledByName
    const { user } = useAuth();

    // Fetch drivers on component mount
    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                setLoadingDrivers(true);
                const response = await apiService.getDrivers();
                if (response.success && response.data) {
                    setDrivers(response.data);
                } else {
                    toast.error('Failed to load drivers');
                }
            } catch (error) {
                console.error('Error fetching drivers:', error);
                toast.error('Failed to load drivers');
            } finally {
                setLoadingDrivers(false);
            }
        };

        if (drivers.length === 0) {
            fetchDrivers();
        }
    }, []);

    const calculateBalancedRemittance = async () => {
        if (!selectedDriverId) {
            toast.error('Please select a driver first');
            return;
        }

        try {
            setLoading(true);
            const result = await apiService.calculateBalancedRemittance(selectedDriverId, startDate, endDate);

            if (result.success) {
                setCalculation(result.data);
                if (onCalculate) {
                    onCalculate(result.data);
                }
                toast.success('Balanced remittance calculated successfully');
            } else {
                toast.error(result.message || 'Failed to calculate balanced remittance');
            }
        } catch (error) {
            console.error('Error calculating balanced remittance:', error);
            toast.error('Failed to calculate balanced remittance');
        } finally {
            setLoading(false);
        }
    };

    const generateBalancedRemittance = async () => {
        if (!calculation) {
            toast.error('Please calculate remittance first');
            return;
        }

        if (!user) {
            toast.error('User session not found. Please refresh the page and try again.');
            return;
        }

        try {
            setLoading(true);
            const remittanceData = {
                driverId: selectedDriverId,
                startDate,
                endDate,
                remittanceType: 'balanced',
                amount: Math.abs(calculation.netRemittanceAmount),
                cashRemittanceOwed: calculation.cashRemittanceOwed,
                nonCashEarningsOwed: calculation.nonCashEarningsOwed,
                netRemittanceAmount: calculation.netRemittanceAmount,
                breakdown: calculation.breakdown,
                handledByName: user?.name || user?.fullName || 'System Admin'
            };

            const result = await apiService.generateBalancedRemittance(remittanceData);

            if (result.success) {
                toast.success('Balanced remittance generated successfully');
                if (onGenerate) {
                    onGenerate(result.data);
                }
            } else {
                toast.error(result.message || 'Failed to generate balanced remittance');
            }
        } catch (error) {
            console.error('Error generating balanced remittance:', error);
            toast.error('Failed to generate balanced remittance');
        } finally {
            setLoading(false);
        }
    };

    const getRemittanceType = () => {
        if (!calculation) return null;

        if (calculation.netRemittanceAmount > 0) {
            return {
                type: 'driver_owes_company',
                label: 'Driver owes company',
                color: 'text-red-600',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200'
            };
        } else if (calculation.netRemittanceAmount < 0) {
            return {
                type: 'company_owes_driver',
                label: 'Company owes driver',
                color: 'text-green-600',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200'
            };
        } else {
            return {
                type: 'balanced',
                label: 'Balanced (no remittance needed)',
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200'
            };
        }
    };

    const remittanceType = getRemittanceType();

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg mr-3">
                        <CalculatorIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Balanced Remittance Calculator</h3>
                        <p className="text-sm text-gray-600">
                            {selectedDriverName && `For ${selectedDriverName}`} • {startDate} to {endDate}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowExplanation(true)}
                    className="flex items-center text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                >
                    <InformationCircleIcon className="h-4 w-4 mr-1" />
                    How it works
                </button>
            </div>

            {/* Driver Selection and Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Driver Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Driver <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select
                            value={selectedDriverId}
                            onChange={(e) => {
                                const driverId = e.target.value;
                                const driver = drivers.find(d => (d._id || d.id) === driverId);
                                setSelectedDriverId(driverId);
                                setSelectedDriverName(driver?.name || '');
                                setCalculation(null); // Reset calculation when driver changes
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                            disabled={loadingDrivers}
                        >
                            <option value="">Select a driver</option>
                            {drivers.map((driver) => (
                                <option key={driver._id || driver.id} value={driver._id || driver.id}>
                                    {driver.name} ({driver.email})
                                </option>
                            ))}
                        </select>
                        {loadingDrivers && (
                            <div className="absolute right-3 top-2.5">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Start Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                            setStartDate(e.target.value);
                            setCalculation(null); // Reset calculation when date changes
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                </div>

                {/* End Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                            setEndDate(e.target.value);
                            setCalculation(null); // Reset calculation when date changes
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                </div>
            </div>

            {/* Calculate Button */}
            <div className="mb-6">
                <button
                    onClick={calculateBalancedRemittance}
                    disabled={loading || !selectedDriverId}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Calculating...
                        </>
                    ) : (
                        <>
                            <CalculatorIcon className="h-4 w-4 mr-2" />
                            Calculate Balanced Remittance
                        </>
                    )}
                </button>
            </div>

            {/* Results */}
            {calculation && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Cash Remittance Owed */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <CurrencyDollarIcon className="h-5 w-5 text-red-600 mr-2" />
                                <h4 className="font-semibold text-red-900">Cash Remittance</h4>
                            </div>
                            <p className="text-2xl font-bold text-red-600">
                                ₺{calculation.cashRemittanceOwed?.toLocaleString() || '0'}
                            </p>
                            <p className="text-xs text-red-700 mt-1">
                                Driver owes company
                            </p>
                        </div>

                        {/* Non-Cash Earnings Owed */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <CreditCardIcon className="h-5 w-5 text-green-600 mr-2" />
                                <h4 className="font-semibold text-green-900">Non-Cash Earnings</h4>
                            </div>
                            <p className="text-2xl font-bold text-green-600">
                                ₺{calculation.nonCashEarningsOwed?.toLocaleString() || '0'}
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                                Company owes driver
                            </p>
                        </div>

                        {/* Net Remittance */}
                        <div className={`${remittanceType?.bgColor} border ${remittanceType?.borderColor} rounded-lg p-4`}>
                            <div className="flex items-center mb-2">
                                <BanknotesIcon className={`h-5 w-5 ${remittanceType?.color} mr-2`} />
                                <h4 className={`font-semibold ${remittanceType?.color}`}>Net Remittance</h4>
                            </div>
                            <p className={`text-2xl font-bold ${remittanceType?.color}`}>
                                ₺{Math.abs(calculation.netRemittanceAmount || 0).toLocaleString()}
                            </p>
                            <p className={`text-xs ${remittanceType?.color} mt-1`}>
                                {remittanceType?.label}
                            </p>
                        </div>
                    </div>

                    {/* Detailed Breakdown */}
                    {calculation.breakdown && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-4">Detailed Breakdown</h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Cash Deliveries */}
                                <div>
                                    <h5 className="font-medium text-red-900 mb-3">Cash Deliveries</h5>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Total Cash Collected:</span>
                                            <span className="font-medium">₺{calculation.breakdown.cash?.totalAmount?.toLocaleString() || '0'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Number of Deliveries:</span>
                                            <span className="font-medium">{calculation.breakdown.cash?.count || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Company Share (33%):</span>
                                            <span className="font-medium text-red-600">₺{calculation.breakdown.cash?.companyShare?.toLocaleString() || '0'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Non-Cash Deliveries */}
                                <div>
                                    <h5 className="font-medium text-green-900 mb-3">Non-Cash Deliveries</h5>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Total Non-Cash Amount:</span>
                                            <span className="font-medium">₺{calculation.breakdown.nonCash?.totalAmount?.toLocaleString() || '0'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Number of Deliveries:</span>
                                            <span className="font-medium">{calculation.breakdown.nonCash?.count || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Driver Share (67%):</span>
                                            <span className="font-medium text-green-600">₺{calculation.breakdown.nonCash?.driverShare?.toLocaleString() || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Calculation Formula */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-3">Calculation</h4>
                        <div className="text-sm text-blue-800 space-y-1">
                            <div className="flex items-center justify-between">
                                <span>Cash Remittance Owed:</span>
                                <span className="font-mono">₺{calculation.cashRemittanceOwed?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Non-Cash Earnings Owed:</span>
                                <span className="font-mono">₺{calculation.nonCashEarningsOwed?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="border-t border-blue-300 pt-2 mt-2">
                                <div className="flex items-center justify-between font-semibold">
                                    <span>Net Remittance:</span>
                                    <span className="font-mono">
                                        ₺{calculation.cashRemittanceOwed?.toLocaleString() || '0'} - ₺{calculation.nonCashEarningsOwed?.toLocaleString() || '0'} = ₺{calculation.netRemittanceAmount?.toLocaleString() || '0'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    {showGenerateButton && (
                        <div className="flex justify-end">
                            <button
                                onClick={generateBalancedRemittance}
                                disabled={loading}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-6 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                                        Generate Balanced Remittance
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Explanation Modal */}
            <BalancedRemittanceExplanation
                isOpen={showExplanation}
                onClose={() => setShowExplanation(false)}
            />
        </div>
    );
};

export default BalancedRemittanceCalculator;
