import React, { useState, useEffect, useCallback } from 'react';
import {
    TruckIcon,
    UserIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    PlayIcon,
    ArrowDownIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    CurrencyDollarIcon,
    ArrowPathIcon,
    MegaphoneIcon,
    Squares2X2Icon,
    ListBulletIcon,
    FunnelIcon,
    ClipboardDocumentIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import { mapsUtils } from '../../utils/formMemory';
import Pagination from '../../components/common/Pagination';
import { DeliveriesPageSkeleton } from '../../components/common/SkeletonLoader';
import toast from 'react-hot-toast';

const MyDeliveries = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [instructionsCollapsed, setInstructionsCollapsed] = useState(() => {
        const saved = localStorage.getItem('deliveryInstructionsCollapsed');
        return saved ? JSON.parse(saved) : false;
    });

    // Save collapsed state to localStorage
    const toggleInstructions = () => {
        const newState = !instructionsCollapsed;
        setInstructionsCollapsed(newState);
        localStorage.setItem('deliveryInstructionsCollapsed', JSON.stringify(newState));
    };

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12);

    // Load deliveries data
    const loadDeliveries = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.getDriverDeliveries({
                limit: 100,
                page: 1
            });

            if (response.success) {
                const formattedDeliveries = response.data.deliveries?.map(delivery => ({
                    id: delivery._id || delivery.id,
                    deliveryCode: delivery.deliveryCode || delivery.code || null,
                    customerName: delivery.customerName || delivery.customer?.name || null,
                    customerPhone: delivery.customerPhone || delivery.customer?.phone || null,
                    pickupAddress: delivery.pickupLocation || delivery.pickupAddress || null,
                    pickupLocationLink: delivery.pickupLocationLink || null,
                    // Pickup coordinates for distance calculation
                    pickupLat: delivery.pickupLat || delivery.pickupLocation?.lat || delivery.pickup?.lat || null,
                    pickupLng: delivery.pickupLng || delivery.pickupLocation?.lng || delivery.pickup?.lng || null,
                    deliveryAddress: delivery.deliveryLocation || delivery.deliveryAddress || null,
                    deliveryLocationLink: delivery.deliveryLocationLink || null,
                    // Delivery coordinates for distance calculation
                    deliveryLat: delivery.deliveryLat || delivery.deliveryLocation?.lat || delivery.delivery?.lat || null,
                    deliveryLng: delivery.deliveryLng || delivery.deliveryLocation?.lng || delivery.delivery?.lng || null,
                    // Location descriptions for better trip information
                    pickupLocationDescription: delivery.pickupLocationDescription || null,
                    deliveryLocationDescription: delivery.deliveryLocationDescription || null,
                    amount: delivery.fee || delivery.amount || null,
                    status: delivery.status || null,
                    estimatedTime: delivery.estimatedTime || null,
                    createdAt: delivery.createdAt || null,
                    startedAt: delivery.startedAt,
                    completedAt: delivery.completedAt,
                    notes: delivery.notes || null
                })) || [];

                console.log('🚚 MyDeliveries: Raw deliveries from API:', response.data.deliveries);
                console.log('🚚 MyDeliveries: Formatted deliveries:', formattedDeliveries);
                setDeliveries(formattedDeliveries);
            } else {
                // No fallback - if API fails, show error
                console.error('Deliveries API response invalid:', response);
                toast.error('Failed to load deliveries - invalid response');
                setDeliveries([]);
            }
        } catch (error) {
            console.error('Error loading deliveries:', error);
            toast.error('Failed to load deliveries');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDeliveries();
    }, [loadDeliveries]);

    // Refresh deliveries
    const refreshDeliveries = async () => {
        setRefreshing(true);
        await loadDeliveries();
        setRefreshing(false);
        toast.success('Deliveries refreshed!');
    };

    // Status helpers
    const getStatusConfig = (status) => {
        const configs = {
            delivered: {
                color: 'bg-green-500',
                bgColor: 'bg-green-50',
                textColor: 'text-green-700',
                borderColor: 'border-green-200',
                icon: CheckCircleIcon,
                label: 'Delivered'
            },
            assigned: {
                color: 'bg-blue-500',
                bgColor: 'bg-blue-50',
                textColor: 'text-blue-700',
                borderColor: 'border-blue-200',
                icon: TruckIcon,
                label: 'Assigned'
            },
            accepted: {
                color: 'bg-green-500',
                bgColor: 'bg-green-50',
                textColor: 'text-green-700',
                borderColor: 'border-green-200',
                icon: CheckCircleIcon,
                label: 'Accepted'
            },
            pending: {
                color: 'bg-yellow-500',
                bgColor: 'bg-yellow-50',
                textColor: 'text-yellow-700',
                borderColor: 'border-yellow-200',
                icon: ExclamationTriangleIcon,
                label: 'Pending Acceptance'
            },
            picked_up: {
                color: 'bg-purple-500',
                bgColor: 'bg-purple-50',
                textColor: 'text-purple-700',
                borderColor: 'border-purple-200',
                icon: PlayIcon,
                label: 'Picked Up'
            },
            in_transit: {
                color: 'bg-purple-500',
                bgColor: 'bg-purple-50',
                textColor: 'text-purple-700',
                borderColor: 'border-purple-200',
                icon: PlayIcon,
                label: 'In Transit'
            }
        };
        return configs[status] || configs.pending;
    };

    // Action handlers
    const handleAcceptDelivery = async (deliveryId) => {
        try {
            console.log('🚚 MyDeliveries: Accepting delivery:', deliveryId);

            // Try different status values that might be accepted by the backend
            const statusOptions = ['accepted'];
            let success = false;
            let response;

            for (const status of statusOptions) {
                try {
                    console.log(`🚚 MyDeliveries: Trying status: ${status}`);
                    response = await apiService.updateDeliveryStatus(deliveryId, status);

                    if (response.success) {
                        console.log(`🚚 MyDeliveries: Success with status: ${status}`);
                        setDeliveries(prev => prev.map(d =>
                            d.id === deliveryId
                                ? { ...d, status: status }
                                : d
                        ));
                        toast.success('Delivery accepted! You can now start the delivery.');
                        success = true;
                        break;
                    } else {
                        console.log(`🚚 MyDeliveries: Failed with status: ${status}`, response);
                        // Show the specific error message from backend
                        if (response.error) {
                            console.error(`🚚 MyDeliveries: Backend error for status ${status}:`, response.error);
                            toast.error(`Accept failed: ${response.error}`);
                        }
                    }
                } catch (error) {
                    console.log(`🚚 MyDeliveries: Failed with status: ${status}`, error.message);
                    continue;
                }
            }

            if (!success) {
                toast.error('Failed to accept delivery. Please try again or contact support.');
            }
        } catch (error) {
            console.error('Error accepting delivery:', error);
            toast.error('Failed to accept delivery');
        }
    };

    const handleStartDelivery = async (deliveryId) => {
        try {
            console.log('🚚 MyDeliveries: Starting delivery:', deliveryId);

            // First, let's check the current delivery status
            const currentDelivery = deliveries.find(d => d.id === deliveryId);
            console.log('🚚 MyDeliveries: Current delivery status:', currentDelivery?.status);
            console.log('🚚 MyDeliveries: Current delivery data:', currentDelivery);

            // Try different status values that might be accepted by the backend
            const statusOptions = ['picked_up', 'in_transit'];
            let success = false;
            let response;

            for (const status of statusOptions) {
                try {
                    console.log(`🚚 MyDeliveries: Trying start status: ${status}`);
                    response = await apiService.updateDeliveryStatus(deliveryId, status);

                    if (response.success) {
                        console.log(`🚚 MyDeliveries: Success with start status: ${status}`);
                        setDeliveries(prev => prev.map(d =>
                            d.id === deliveryId
                                ? { ...d, status: status, startedAt: new Date().toISOString() }
                                : d
                        ));
                        toast.success('Delivery started! You can now proceed to the delivery location.');
                        success = true;
                        break;
                    } else {
                        console.log(`🚚 MyDeliveries: Failed with start status: ${status}`, response);
                        // Show the specific error message from backend
                        if (response.error) {
                            console.error(`🚚 MyDeliveries: Backend error for status ${status}:`, response.error);
                            toast.error(`Status update failed: ${response.error}`);
                        }
                    }
                } catch (error) {
                    console.log(`🚚 MyDeliveries: Error with start status: ${status}`, error.message);
                    continue;
                }
            }

            if (!success) {
                console.error('🚚 MyDeliveries: All status attempts failed');
                toast.error('Failed to start delivery. Please check the current status and try again.');
            }
        } catch (error) {
            console.error('Error starting delivery:', error);
            toast.error('Failed to start delivery');
        }
    };

    const handleCompleteDelivery = async (deliveryId) => {
        try {
            console.log('🚚 MyDeliveries: Completing delivery:', deliveryId);
            const response = await apiService.updateDeliveryStatus(deliveryId, 'delivered');

            if (response.success) {
                console.log('🚚 MyDeliveries: Delivery completed successfully');
                setDeliveries(prev => prev.map(d =>
                    d.id === deliveryId
                        ? { ...d, status: 'delivered', completedAt: new Date().toISOString() }
                        : d
                ));
                toast.success('🎉 Delivery completed successfully! Payment will be processed.');

                // Trigger earnings calculation after delivery completion
                try {
                    console.log('💰 MyDeliveries: Triggering earnings calculation...');
                    await apiService.calculateDriverEarnings();
                    console.log('✅ MyDeliveries: Earnings calculation triggered successfully');
                } catch (earningsError) {
                    console.warn('⚠️ MyDeliveries: Earnings calculation failed, but delivery was completed:', earningsError);
                    // Don't show error to user since delivery was successful
                }
            } else {
                console.error('🚚 MyDeliveries: Failed to complete delivery:', response);
                if (response.error) {
                    toast.error(`Complete failed: ${response.error}`);
                } else {
                    toast.error(response.message || 'Failed to complete delivery');
                }
            }
        } catch (error) {
            console.error('Error completing delivery:', error);
            toast.error('Failed to complete delivery');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    // Calculate distance between two coordinates using Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in kilometers
        return distance;
    };

    // Helper function to clean address text (remove URLs)
    const cleanAddressText = (text) => {
        if (!text) return '';

        // Remove Google Maps URLs
        const cleaned = text.replace(/https?:\/\/[^\s]+/g, '').trim();

        // If the cleaned text is empty or just whitespace, return a fallback
        if (!cleaned) {
            return 'Location';
        }

        return cleaned;
    };

    // Create a better trip description
    const getTripDescription = (delivery) => {
        const pickupDesc = delivery.pickupLocationDescription ? ` (${delivery.pickupLocationDescription})` : '';
        const deliveryDesc = delivery.deliveryLocationDescription ? ` (${delivery.deliveryLocationDescription})` : '';
        const distance = getDeliveryDistance(delivery);

        // Clean the addresses to remove any URLs
        const cleanPickupAddress = cleanAddressText(delivery.pickupAddress);
        const cleanDeliveryAddress = cleanAddressText(delivery.deliveryAddress);

        return {
            pickup: `${cleanPickupAddress}${pickupDesc}`,
            delivery: `${cleanDeliveryAddress}${deliveryDesc}`,
            distance: distance,
            fullDescription: `${cleanPickupAddress}${pickupDesc} → ${cleanDeliveryAddress}${deliveryDesc} (${distance})`
        };
    };

    // Calculate distance for a delivery
    const getDeliveryDistance = (delivery) => {
        // If coordinates are available, calculate actual distance
        if (delivery.pickupLat && delivery.pickupLng && delivery.deliveryLat && delivery.deliveryLng) {
            const distance = calculateDistance(
                delivery.pickupLat,
                delivery.pickupLng,
                delivery.deliveryLat,
                delivery.deliveryLng
            );
            return `${distance.toFixed(1)} km`;
        }

        // Fallback: estimate based on addresses (rough calculation)
        // This is a simplified estimation - in a real app, you'd use a geocoding service
        if (delivery.pickupAddress && delivery.deliveryAddress) {
            // Simple estimation: assume average city distance of 2-5 km
            const estimatedDistance = Math.random() * 3 + 2; // Random between 2-5 km
            return `~${estimatedDistance.toFixed(1)} km`;
        }

        return '~3.2 km'; // Default fallback
    };

    // Calculate estimated time in minutes for a delivery
    const getEstimatedTime = (delivery) => {
        // If coordinates are available, calculate actual distance and time
        if (delivery.pickupLat && delivery.pickupLng && delivery.deliveryLat && delivery.deliveryLng) {
            const distance = calculateDistance(
                delivery.pickupLat,
                delivery.pickupLng,
                delivery.deliveryLat,
                delivery.deliveryLng
            );
            // Assume average speed of 20 km/h in city traffic
            const timeInHours = distance / 20;
            const timeInMinutes = Math.round(timeInHours * 60);
            return `${timeInMinutes} min`;
        }

        // Fallback: estimate based on addresses
        if (delivery.pickupAddress && delivery.deliveryAddress) {
            // Simple estimation: assume average city distance of 2-5 km
            const estimatedDistance = Math.random() * 3 + 2; // Random between 2-5 km
            const timeInHours = estimatedDistance / 20;
            const timeInMinutes = Math.round(timeInHours * 60);
            return `~${timeInMinutes} min`;
        }

        // Default fallback: assume 25 minutes for typical city delivery
        return '~25 min';
    };

    // Calculate stats
    const stats = {
        total: deliveries.length,
        pending: deliveries.filter(d => d.status === 'pending').length,
        assigned: deliveries.filter(d => d.status === 'assigned').length,
        delivered: deliveries.filter(d => d.status === 'delivered').length,
        inProgress: deliveries.filter(d => ['picked_up', 'in_transit'].includes(d.status)).length
    };

    // Filter deliveries
    const filteredDeliveries = deliveries.filter(delivery => {
        return statusFilter === 'all' || delivery.status === statusFilter;
    });

    // Pagination
    const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDeliveries = filteredDeliveries.slice(startIndex, endIndex);

    if (loading) {
        return <DeliveriesPageSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Deliveries</h1>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base">Track and manage your delivery assignments</p>
                    </div>
                </div>

                {/* Controls Row */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    {/* Left side - Available Deliveries link */}
                    <a
                        href="/driver/broadcasts"
                        className="inline-flex items-center justify-center sm:justify-start px-3 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                    >
                        <MegaphoneIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Available Deliveries</span>
                    </a>

                    {/* Right side - View Mode and Filter */}
                    <div className="flex items-center space-x-3">
                        {/* View Mode Toggle */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-2 sm:px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'grid'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Squares2X2Icon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-2 sm:px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'list'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <ListBulletIcon className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Status Filter */}
                        <div className="relative flex-shrink-0">
                            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white appearance-none min-w-0 w-full sm:w-auto"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="assigned">Assigned</option>
                                <option value="picked_up">In Progress</option>
                                <option value="delivered">Delivered</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pending Deliveries Alert */}
            {stats.pending > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 sm:p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
                            <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg flex-shrink-0">
                                <ExclamationTriangleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base sm:text-lg font-semibold text-yellow-800 mb-1">
                                    🚨 {stats.pending} Delivery{stats.pending > 1 ? 's' : ''} Pending Acceptance
                                </h3>
                                <p className="text-sm sm:text-base text-yellow-700">
                                    You have {stats.pending} delivery{stats.pending > 1 ? 's' : ''} waiting to be accepted.
                                    Click the <strong>"Accept Delivery"</strong> button on each card to start working on them.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setStatusFilter('pending')}
                            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
                        >
                            View Pending ({stats.pending})
                        </button>
                    </div>
                </div>
            )}

            {/* Delivery Process Instructions */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6 mb-6">
                <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <TruckIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">How to Complete Deliveries</h3>
                            <button
                                onClick={toggleInstructions}
                                className="p-1 hover:bg-blue-100 rounded-lg transition-colors"
                                aria-label={instructionsCollapsed ? "Expand instructions" : "Collapse instructions"}
                            >
                                <ChevronDownIcon
                                    className={`w-5 h-5 text-blue-600 transition-transform duration-200 ${instructionsCollapsed ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                        </div>

                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${instructionsCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
                            }`}>
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                                        <div>
                                            <p className="font-medium text-gray-900">Accept Delivery</p>
                                            <p className="text-gray-600">Click "Accept" for pending deliveries</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                                        <div>
                                            <p className="font-medium text-gray-900">Start Delivery</p>
                                            <p className="text-gray-600">Click "Start" when you pick up the item</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                                        <div>
                                            <p className="font-medium text-gray-900">Complete Delivery</p>
                                            <p className="text-gray-600">Click "Complete" when delivered</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-start space-x-2">
                                        <div className="p-1 bg-yellow-100 rounded">
                                            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-medium text-yellow-800 mb-1">💡 Delivery Types</p>
                                            <p className="text-yellow-700">
                                                <strong>Pending Acceptance:</strong> These are manually assigned deliveries. Accept them here to start working on them.
                                                <br />
                                                <strong>Broadcast Deliveries:</strong> Check the "Available Deliveries" page for new broadcast opportunities.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <TruckIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <TruckIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Assigned</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.assigned}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <PlayIcon className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">In Progress</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircleIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Delivered</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deliveries Content */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedDeliveries.map((delivery) => {
                        const statusConfig = getStatusConfig(delivery.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                            <div key={delivery.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
                                {/* Header */}
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <button
                                            onClick={() => copyToClipboard(delivery.deliveryCode)}
                                            className="text-lg font-semibold text-gray-900 hover:text-green-600 transition-colors flex items-center group"
                                        >
                                            {delivery.deliveryCode}
                                            <ClipboardDocumentIcon className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                        <div className="flex items-center space-x-2">
                                            {/* Progress Steps */}
                                            <div className="flex items-center space-x-1">
                                                <div className={`w-2 h-2 rounded-full ${delivery.status === 'pending' ? 'bg-blue-500' : delivery.status === 'accepted' || delivery.status === 'assigned' || delivery.status === 'picked_up' || delivery.status === 'in_transit' || delivery.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                <div className={`w-2 h-2 rounded-full ${delivery.status === 'picked_up' || delivery.status === 'in_transit' || delivery.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                <div className={`w-2 h-2 rounded-full ${delivery.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            </div>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} border`}>
                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                {statusConfig.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <UserIcon className="w-4 h-4" />
                                        <span>{delivery.customerName}</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-4">
                                    {/* Amount & Time */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-green-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Delivery Fee</span>
                                                <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                                            </div>
                                            <p className="text-lg font-bold text-green-600">₺{delivery.amount}</p>
                                        </div>
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Est. Time</span>
                                                <ClockIcon className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <p className="text-sm font-bold text-blue-600 truncate">{getEstimatedTime(delivery)}</p>
                                        </div>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <UserIcon className="w-4 h-4 text-gray-500" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{delivery.customerName}</p>
                                                    <p className="text-xs text-gray-600">{delivery.customerPhone}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => window.open(`https://wa.me/${delivery.customerPhone.replace(/[^0-9]/g, '')}?text=Hello! This is your delivery driver from GrepIt. I will be delivering your order shortly.`, '_blank')}
                                                className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                                            >
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.109" />
                                                </svg>
                                                <span>Contact</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Trip Summary */}
                                    <div className="p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-semibold text-gray-900">🚚 Trip Summary</h4>
                                            <span className="text-xs text-gray-600">{getTripDescription(delivery).distance}</span>
                                        </div>
                                        <div className="text-xs text-gray-700 leading-relaxed">
                                            {getTripDescription(delivery).pickup} → {getTripDescription(delivery).delivery}
                                        </div>
                                    </div>

                                    {/* Route Information */}
                                    <div className="space-y-3">
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Pickup</span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        // Try to extract coordinates from pickupLocationLink first
                                                        if (delivery.pickupLocationLink) {
                                                            const navUrl = mapsUtils.extractAndCreateNavigationLink(
                                                                delivery.pickupLocationLink,
                                                                delivery.pickupLocationDescription || 'Pickup Location'
                                                            );
                                                            if (navUrl) {
                                                                window.open(navUrl, '_blank');
                                                                return;
                                                            }
                                                        }

                                                        // Fallback to coordinates or search
                                                        const mapUrl = mapsUtils.generateCoordinatesSearchLink(
                                                            delivery.pickupCoordinates?.lat || delivery.pickupLat,
                                                            delivery.pickupCoordinates?.lng || delivery.pickupLng,
                                                            delivery.pickupLocation || delivery.pickupAddress,
                                                            15
                                                        );
                                                        if (mapUrl) {
                                                            window.open(mapUrl, '_blank');
                                                        } else {
                                                            // Fallback to search if no coordinates
                                                            const searchUrl = mapsUtils.generateSearchLink(delivery.pickupLocation || delivery.pickupAddress);
                                                            window.open(searchUrl, '_blank');
                                                        }
                                                    }}
                                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-100 px-2 py-1 rounded-md"
                                                >
                                                    Navigate
                                                </button>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 leading-tight">{cleanAddressText(delivery.pickupAddress)}</p>
                                            {delivery.pickupLocationDescription && (
                                                <p className="text-xs text-blue-600 mt-1 font-medium">
                                                    📍 {delivery.pickupLocationDescription}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-600 mt-1">Contact: Greep Admin</p>
                                        </div>

                                        <div className="flex justify-center">
                                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                                <ArrowDownIcon className="w-3 h-3 text-gray-500" />
                                            </div>
                                        </div>

                                        <div className="p-3 bg-green-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Delivery</span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        // Try to extract coordinates from deliveryLocationLink first
                                                        if (delivery.deliveryLocationLink) {
                                                            const navUrl = mapsUtils.extractAndCreateNavigationLink(
                                                                delivery.deliveryLocationLink,
                                                                delivery.deliveryLocationDescription || 'Delivery Location'
                                                            );
                                                            if (navUrl) {
                                                                window.open(navUrl, '_blank');
                                                                return;
                                                            }
                                                        }

                                                        // Fallback to coordinates or search
                                                        const mapUrl = mapsUtils.generateCoordinatesSearchLink(
                                                            delivery.deliveryCoordinates?.lat || delivery.deliveryLat,
                                                            delivery.deliveryCoordinates?.lng || delivery.deliveryLng,
                                                            delivery.deliveryLocation || delivery.deliveryAddress,
                                                            15
                                                        );
                                                        if (mapUrl) {
                                                            window.open(mapUrl, '_blank');
                                                        } else {
                                                            // Fallback to search if no coordinates
                                                            const searchUrl = mapsUtils.generateSearchLink(delivery.deliveryLocation || delivery.deliveryAddress);
                                                            window.open(searchUrl, '_blank');
                                                        }
                                                    }}
                                                    className="text-xs text-green-600 hover:text-green-800 font-medium bg-green-100 px-2 py-1 rounded-md"
                                                >
                                                    Navigate
                                                </button>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 leading-tight">{cleanAddressText(delivery.deliveryAddress)}</p>
                                            {delivery.deliveryLocationDescription && (
                                                <p className="text-xs text-green-600 mt-1 font-medium">
                                                    📍 {delivery.deliveryLocationDescription}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-600 mt-1">Recipient: {delivery.customerName}</p>
                                        </div>
                                    </div>

                                    {/* Delivery Details */}
                                    <div className="grid grid-cols-2 gap-3 text-center">
                                        <div className="p-2 bg-gray-50 rounded-lg">
                                            <CalendarDaysIcon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                                            <p className="text-xs text-gray-600">Date</p>
                                            <p className="text-xs font-medium text-gray-900">{new Date(delivery.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="p-2 bg-gray-50 rounded-lg">
                                            <TruckIcon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                                            <p className="text-xs text-gray-600">Distance</p>
                                            <p className="text-xs font-medium text-gray-900">{getDeliveryDistance(delivery)}</p>
                                        </div>
                                    </div>

                                    {delivery.notes && (
                                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <div className="flex items-start space-x-2">
                                                <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs font-medium text-yellow-800 mb-1">Special Instructions</p>
                                                    <p className="text-xs text-yellow-700 leading-relaxed">{delivery.notes}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="p-6 border-t border-gray-100 space-y-2">
                                    {/* Accept Delivery Button - Show for any pending status */}
                                    {(delivery.status === 'pending' || delivery.status === 'pending_acceptance' || delivery.status === 'pending_assignment' || delivery.status === 'assigned_pending' || delivery.status === 'manual_assignment') && (
                                        <button
                                            onClick={() => handleAcceptDelivery(delivery.id)}
                                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                                        >
                                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                                            Accept Delivery
                                        </button>
                                    )}

                                    {/* Start Delivery Button */}
                                    {(delivery.status === 'accepted' || delivery.status === 'assigned') && (
                                        <button
                                            onClick={() => handleStartDelivery(delivery.id)}
                                            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg text-sm font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                                        >
                                            <PlayIcon className="w-5 h-5 mr-2" />
                                            Start Delivery
                                        </button>
                                    )}

                                    {/* Complete Delivery Button */}
                                    {(delivery.status === 'picked_up' || delivery.status === 'in_transit') && (
                                        <button
                                            onClick={() => handleCompleteDelivery(delivery.id)}
                                            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg text-sm font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                                        >
                                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                                            Complete Delivery
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                // List View
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedDeliveries.map((delivery) => {
                                    const statusConfig = getStatusConfig(delivery.status);
                                    const StatusIcon = statusConfig.icon;

                                    return (
                                        <tr key={delivery.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => copyToClipboard(delivery.deliveryCode)}
                                                    className="text-sm font-medium text-gray-900 hover:text-green-600 transition-colors"
                                                >
                                                    {delivery.deliveryCode}
                                                </button>
                                                <p className="text-xs text-gray-500">{getEstimatedTime(delivery)}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{delivery.customerName}</div>
                                                <div className="text-xs text-gray-500">{delivery.customerPhone}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-gray-900 max-w-xs">
                                                    <div className="truncate mb-1">📍 {delivery.pickupAddress}</div>
                                                    <div className="truncate">🏁 {delivery.deliveryAddress}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">₺{delivery.amount}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                                                    <StatusIcon className="w-3 h-3 mr-1" />
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    {/* Accept Delivery Button - Show for any pending status */}
                                                    {(delivery.status === 'pending' || delivery.status === 'pending_acceptance' || delivery.status === 'pending_assignment' || delivery.status === 'assigned_pending' || delivery.status === 'manual_assignment') && (
                                                        <button
                                                            onClick={() => handleAcceptDelivery(delivery.id)}
                                                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center"
                                                        >
                                                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                                                            Accept
                                                        </button>
                                                    )}

                                                    {/* Start Delivery Button */}
                                                    {(delivery.status === 'accepted' || delivery.status === 'assigned') && (
                                                        <button
                                                            onClick={() => handleStartDelivery(delivery.id)}
                                                            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center"
                                                        >
                                                            <PlayIcon className="w-4 h-4 mr-1" />
                                                            Start
                                                        </button>
                                                    )}

                                                    {/* Complete Delivery Button */}
                                                    {(delivery.status === 'picked_up' || delivery.status === 'in_transit') && (
                                                        <button
                                                            onClick={() => handleCompleteDelivery(delivery.id)}
                                                            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center"
                                                        >
                                                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                                                            Complete
                                                        </button>
                                                    )}

                                                    {/* WhatsApp Button */}
                                                    <button
                                                        onClick={() => window.open(`https://wa.me/${delivery.customerPhone.replace(/[^0-9]/g, '')}?text=Hello! This is your delivery driver from GrepIt. I will be delivering your order shortly.`, '_blank')}
                                                        className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.109" />
                                                        </svg>
                                                        WhatsApp
                                                    </button>
                                                </div>
                                                {/* Debug Info */}
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Status: {delivery.status}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filteredDeliveries.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <TruckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
                    <p className="text-gray-500 mb-4">
                        {statusFilter === 'all'
                            ? "You don't have any deliveries yet."
                            : `No deliveries with "${statusFilter}" status.`
                        }
                    </p>
                    <button
                        onClick={refreshDeliveries}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                        Refresh Deliveries
                    </button>
                </div>
            )}

            {/* Pagination */}
            {filteredDeliveries.length > itemsPerPage && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredDeliveries.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    className="mt-6"
                />
            )}
        </div>
    );
};

export default MyDeliveries;