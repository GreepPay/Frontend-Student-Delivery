import React, { useState, useEffect, useRef } from 'react';
import {
    TruckIcon,
    MapPinIcon,
    ClockIcon,
    UserIcon,
    PhoneIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XMarkIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../common/ToastProvider';
import apiService from '../../services/api';
import soundService from '../../services/soundService';
import { formatCurrency } from '../../services/systemSettings';

const DeliveryBroadcastSnackbar = ({ delivery, onAccept, onClose, onExpire }) => {
    const { showSuccess, showError } = useToast();
    const [timeRemaining, setTimeRemaining] = useState(delivery.broadcastDuration || 60);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const timerRef = useRef(null);
    const intervalRef = useRef(null);

    // Calculate time remaining
    useEffect(() => {
        if (delivery?.broadcastEndTime) {
            const calculateTimeRemaining = () => {
                try {
                    const now = new Date();
                    const endTime = new Date(delivery.broadcastEndTime);
                    const diff = Math.max(0, Math.floor((endTime - now) / 1000));

                    if (diff <= 0) {
                        clearInterval(intervalRef.current);
                        onExpire && onExpire(delivery.deliveryId || delivery.id);
                        return;
                    }

                    setTimeRemaining(diff);
                } catch (error) {
                    console.error('Error calculating time remaining:', error);
                    clearInterval(intervalRef.current);
                }
            };

            calculateTimeRemaining();
            intervalRef.current = setInterval(calculateTimeRemaining, 1000);

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        }
    }, [delivery?.broadcastEndTime, onExpire, delivery?.deliveryId, delivery?.id]);

    // Play notification sound when component mounts
    useEffect(() => {
        try {
            soundService.playSound('delivery');
        } catch (error) {
            console.warn('Could not play delivery sound:', error);
        }
    }, []);

    // Format time remaining
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Get priority color
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'normal':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'low':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

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

    // Handle accept delivery
    const handleAccept = async () => {
        try {
            setIsAccepting(true);
            const deliveryId = delivery.deliveryId || delivery.id;
            const response = await apiService.acceptBroadcastDelivery(deliveryId);

            if (response.success) {
                showSuccess('Delivery accepted successfully!');
                soundService.playSound('success');
                onAccept && onAccept(deliveryId);
            } else {
                showError(response.message || 'Failed to accept delivery');
            }
        } catch (error) {
            console.error('Error accepting delivery:', error);
            showError('Failed to accept delivery');
        } finally {
            setIsAccepting(false);
        }
    };

    // Handle close
    const handleClose = () => {
        const deliveryId = delivery.deliveryId || delivery.id;
        onClose && onClose(deliveryId);
    };

    // Safety check
    if (!delivery) {
        console.warn('DeliveryBroadcastSnackbar: No delivery data provided');
        return null;
    }

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 max-w-lg w-full transition-all duration-300 ease-out">
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <TruckIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">New Delivery Available!</h3>
                                <p className="text-green-100 text-sm">Tap to view details</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="bg-white/20 px-3 py-1.5 rounded-lg flex items-center space-x-1">
                                <ClockIcon className="h-4 w-4" />
                                <span className="font-mono font-semibold text-sm">{formatTime(timeRemaining)}</span>
                            </div>
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-white/80 hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-white/10"
                            >
                                {isExpanded ? (
                                    <ChevronUpIcon className="h-5 w-5" />
                                ) : (
                                    <ChevronDownIcon className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Delivery Code and Priority */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700">
                                #{delivery.deliveryCode}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(delivery.priority)}`}>
                                {delivery.priority?.toUpperCase()}
                            </span>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(delivery.fee)}
                            </div>
                            {delivery.driverEarning && (
                                <div className="text-sm text-blue-600 font-medium">
                                    Your Earning: {formatCurrency(delivery.driverEarning)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <UserIcon className="h-4 w-4 text-gray-500" />
                            <span className="font-semibold text-gray-900">{delivery.customerName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <PhoneIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{delivery.customerPhone}</span>
                        </div>
                    </div>

                    {/* Locations */}
                    <div className="space-y-3 mb-4">
                        <div className="flex items-start space-x-3">
                            <div className="bg-green-100 p-2 rounded-lg">
                                <MapPinIcon className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900 mb-1">Pickup Location</div>
                                <div className="text-sm text-gray-600 leading-relaxed">{delivery.pickupLocationDescription || delivery.pickupLocation}</div>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="bg-red-100 p-2 rounded-lg">
                                <MapPinIcon className="h-4 w-4 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900 mb-1">Delivery Location</div>
                                <div className="text-sm text-gray-600 leading-relaxed">{delivery.deliveryLocationDescription || delivery.deliveryLocation}</div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Details (when expanded) */}
                    {isExpanded && (
                        <div className="border-t border-gray-200 pt-4 space-y-3">
                            {delivery.notes && (
                                <div className="bg-blue-50 rounded-lg p-3">
                                    <div className="text-sm font-semibold text-blue-900 mb-1">Notes</div>
                                    <div className="text-sm text-blue-800">{delivery.notes}</div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-xs font-medium text-gray-500 mb-1">Payment Method</div>
                                    <div className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                                        {getPaymentMethodIcon(delivery.paymentMethod)}
                                        <span>{formatPaymentMethod(delivery.paymentMethod)}</span>
                                    </div>
                                </div>
                                {delivery.estimatedTime && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="text-xs font-medium text-gray-500 mb-1">Estimated Time</div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            {new Date(delivery.estimatedTime).toLocaleTimeString()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-3 mt-6">
                        <button
                            onClick={handleAccept}
                            disabled={isAccepting || timeRemaining <= 0}
                            className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg"
                        >
                            {isAccepting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Accepting...
                                </>
                            ) : (
                                <>
                                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                                    Accept Delivery
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleClose}
                            className="px-4 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Timer Progress Bar */}
                <div className="h-1 bg-gray-200">
                    <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-1000 ease-linear"
                        style={{
                            width: `${((delivery.broadcastDuration || 60) - timeRemaining) / (delivery.broadcastDuration || 60) * 100}%`
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default DeliveryBroadcastSnackbar;

