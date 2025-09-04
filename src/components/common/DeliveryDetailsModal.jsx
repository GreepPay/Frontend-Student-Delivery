import React from 'react';
import { XMarkIcon, TruckIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline';
//import { mapsUtils } from '../../utils/formMemory';

const DeliveryDetailsModal = ({
    delivery,
    isOpen,
    onClose,
    showActions = false,
    onAccept,
    onStart,
    onComplete,
    onEdit,
    onDelete,
    drivers = [] // Add drivers prop for fallback driver lookup
}) => {
    if (!isOpen || !delivery) return null;

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'assigned': 'bg-blue-100 text-blue-800',
            'accepted': 'bg-blue-100 text-blue-800',
            'picked_up': 'bg-orange-100 text-orange-800',
            'in_transit': 'bg-purple-100 text-purple-800',
            'delivered': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800',
            'failed': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'low': 'bg-gray-100 text-gray-800',
            'normal': 'bg-green-100 text-green-800',
            'high': 'bg-orange-100 text-orange-800',
            'urgent': 'bg-red-100 text-red-800'
        };
        return colors[priority] || 'bg-gray-100 text-gray-800';
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

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <TruckIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Delivery Details</h3>
                                <p className="text-sm text-gray-500">{delivery.deliveryCode || delivery.id}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                        {/* Status and Cost */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                                    {delivery.status}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(delivery.priority)}`}>
                                    {delivery.priority}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-bold text-green-600">₺{delivery.fee}</div>
                                <div className="text-xs text-gray-500 flex items-center justify-end space-x-1">
                                    {getPaymentMethodIcon(delivery.paymentMethod)}
                                    <span>{formatPaymentMethod(delivery.paymentMethod)}</span>
                                </div>
                                {/* Debug info - remove this after fixing */}
                                <div className="text-xs text-gray-400 mt-1">
                                    Raw: {delivery.paymentMethod}
                                </div>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Customer Information</h4>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <UserIcon className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-900">{delivery.customerName || 'N/A'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <PhoneIcon className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-900">{delivery.customerPhone || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Route Information */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-900">Route Information</h4>

                            {/* Pickup */}
                            <div className="bg-blue-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-blue-700">Pickup</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            // Use the same robust URL formatting logic as NotificationsPage
                                            console.log('🔍 Pickup location link:', delivery.pickupLocationLink);

                                            let navigationUrl = null;

                                            if (delivery.pickupLocationLink) {
                                                // Replace malformed URLs with proper Google Maps routing URLs
                                                let formattedUrl = delivery.pickupLocationLink.replace(
                                                    /https:\/\/maps\.google\.com\/\?q=([^,\s]+),([^,\s]+)/g,
                                                    (match, lat, lng) => {
                                                        return `https://www.google.com/maps/dir/My+Location/${lat},${lng}`;
                                                    }
                                                );

                                                // Also replace static coordinate URLs with routing URLs
                                                formattedUrl = formattedUrl.replace(
                                                    /https:\/\/www\.google\.com\/maps\/@([^,\s]+),([^,\s]+),(\d+)z/g,
                                                    (match, lat, lng, zoom) => {
                                                        return `https://www.google.com/maps/dir/My+Location/${lat},${lng}`;
                                                    }
                                                );

                                                // If it's already a navigation URL, use it directly
                                                if (formattedUrl.includes('/maps/dir/')) {
                                                    navigationUrl = formattedUrl;
                                                } else {
                                                    // Try to extract coordinates from any remaining format
                                                    const coordMatch = formattedUrl.match(/(\d+\.\d+),(\d+\.\d+)/);
                                                    if (coordMatch) {
                                                        navigationUrl = `https://www.google.com/maps/dir/My+Location/${coordMatch[1]},${coordMatch[2]}`;
                                                    }
                                                }
                                            }

                                            if (navigationUrl) {
                                                console.log('✅ Navigation URL generated:', navigationUrl);
                                                window.open(navigationUrl, '_blank');
                                            } else {
                                                // Fallback to search by location description
                                                console.log('📍 No coordinates found, using search fallback');
                                                const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(delivery.pickupLocationDescription || delivery.pickupLocation || '')}`;
                                                console.log('🔍 Search URL:', searchUrl);
                                                window.open(searchUrl, '_blank');
                                            }
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-100 px-2 py-1 rounded-md"
                                    >
                                        Navigate
                                    </button>
                                </div>
                                <p className="text-sm text-gray-900">{delivery.pickupLocationDescription || delivery.pickupLocation}</p>
                            </div>

                            {/* Delivery */}
                            <div className="bg-green-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-green-700">Delivery</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            // Use the same robust URL formatting logic as NotificationsPage
                                            console.log('🔍 Delivery location link:', delivery.deliveryLocationLink);

                                            let navigationUrl = null;

                                            if (delivery.deliveryLocationLink) {
                                                // Replace malformed URLs with proper Google Maps routing URLs
                                                let formattedUrl = delivery.deliveryLocationLink.replace(
                                                    /https:\/\/maps\.google\.com\/\?q=([^,\s]+),([^,\s]+)/g,
                                                    (match, lat, lng) => {
                                                        return `https://www.google.com/maps/dir/My+Location/${lat},${lng}`;
                                                    }
                                                );

                                                // Also replace static coordinate URLs with routing URLs
                                                formattedUrl = formattedUrl.replace(
                                                    /https:\/\/www\.google\.com\/maps\/@([^,\s]+),([^,\s]+),(\d+)z/g,
                                                    (match, lat, lng, zoom) => {
                                                        return `https://www.google.com/maps/dir/My+Location/${lat},${lng}`;
                                                    }
                                                );

                                                // If it's already a navigation URL, use it directly
                                                if (formattedUrl.includes('/maps/dir/')) {
                                                    navigationUrl = formattedUrl;
                                                } else {
                                                    // Try to extract coordinates from any remaining format
                                                    const coordMatch = formattedUrl.match(/(\d+\.\d+),(\d+\.\d+)/);
                                                    if (coordMatch) {
                                                        navigationUrl = `https://www.google.com/maps/dir/My+Location/${coordMatch[1]},${coordMatch[2]}`;
                                                    }
                                                }
                                            }

                                            if (navigationUrl) {
                                                console.log('✅ Navigation URL generated:', navigationUrl);
                                                window.open(navigationUrl, '_blank');
                                            } else {
                                                // Fallback to search by location description
                                                console.log('📍 No coordinates found, using search fallback');
                                                const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(delivery.deliveryLocationDescription || delivery.deliveryLocation || '')}`;
                                                console.log('🔍 Search URL:', searchUrl);
                                                window.open(searchUrl, '_blank');
                                            }
                                        }}
                                        className="text-xs text-green-600 hover:text-green-800 font-medium bg-green-100 px-2 py-1 rounded-md"
                                    >
                                        Navigate
                                    </button>
                                </div>
                                <p className="text-sm text-gray-900">{delivery.deliveryLocationDescription || delivery.deliveryLocation}</p>
                            </div>
                        </div>

                        {/* Assignment */}
                        <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Assignment</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Assigned To:</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {delivery.assignedTo ? (
                                            (() => {
                                                // assignedTo is already an object with driver info
                                                if (typeof delivery.assignedTo === 'object' && delivery.assignedTo !== null) {
                                                    // Access driver properties directly
                                                    const driverName = delivery.assignedTo.name ||
                                                        delivery.assignedTo.fullName ||
                                                        delivery.assignedTo.fullNameComputed ||
                                                        'Unknown Driver';
                                                    return driverName;
                                                } else {
                                                    // Fallback: try to find driver by ID
                                                    const assignedDriver = drivers.find(driver =>
                                                        driver._id === delivery.assignedTo || driver.id === delivery.assignedTo
                                                    );
                                                    return assignedDriver ? assignedDriver.name : 'Unknown Driver';
                                                }
                                            })()
                                        ) : 'Unassigned'}
                                    </span>
                                </div>
                                {delivery.estimatedTime && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Estimated Time:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {new Date(delivery.estimatedTime).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        {delivery.notes && (
                            <div className="bg-yellow-50 rounded-lg p-3">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Special Instructions</h4>
                                <p className="text-sm text-gray-700">{delivery.notes}</p>
                            </div>
                        )}

                        {/* Timestamps */}
                        <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Timestamps</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                                <div className="flex justify-between">
                                    <span>Created:</span>
                                    <span>{new Date(delivery.createdAt).toLocaleString()}</span>
                                </div>
                                {delivery.updatedAt && (
                                    <div className="flex justify-between">
                                        <span>Updated:</span>
                                        <span>{new Date(delivery.updatedAt).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    {showActions && (
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                            <div className="flex space-x-2">
                                {/* Accept Delivery Button */}
                                {(delivery.status === 'pending' || delivery.status === 'pending_acceptance') && onAccept && (
                                    <button
                                        onClick={() => onAccept(delivery.id)}
                                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Accept
                                    </button>
                                )}

                                {/* Start Delivery Button */}
                                {(delivery.status === 'accepted' || delivery.status === 'assigned') && onStart && (
                                    <button
                                        onClick={() => onStart(delivery.id)}
                                        className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                    >
                                        Start
                                    </button>
                                )}

                                {/* Complete Delivery Button */}
                                {(delivery.status === 'picked_up' || delivery.status === 'in_transit') && onComplete && (
                                    <button
                                        onClick={() => onComplete(delivery.id)}
                                        className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                    >
                                        Complete
                                    </button>
                                )}

                                {/* Edit Button */}
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit(delivery)}
                                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Edit
                                    </button>
                                )}

                                {/* Delete Button */}
                                {onDelete && (
                                    <button
                                        onClick={() => onDelete(delivery.id)}
                                        className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeliveryDetailsModal;
