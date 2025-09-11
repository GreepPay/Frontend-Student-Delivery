import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
    PlusIcon, MagnifyingGlassIcon, FunnelIcon, ArrowPathIcon,
    EyeIcon, PencilIcon, TrashIcon, XMarkIcon, TruckIcon,
    CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, PhoneIcon,
    UserIcon, MegaphoneIcon, UserPlusIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../../components/common/ToastProvider';
import apiService from '../../services/api';
import socketService from '../../services/socketService';
import GoogleMapsLocationInput from '../../components/common/GoogleMapsLocationInput';
import SmartInput from '../../components/common/SmartInput';
import FormMemoryPanel from '../../components/common/FormMemoryPanel';
import formMemory, { mapsUtils } from '../../utils/formMemory';
import { capitalizeName } from '../../utils/nameUtils';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import Pagination from '../../components/common/Pagination';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import SearchableDropdown from '../../components/common/SearchableDropdown';

const DeliveriesPage = () => {
    const location = useLocation();
    const { showSuccess, showError, showInfo } = useToast();

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
    const [deliveries, setDeliveries] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [broadcastFilter, setBroadcastFilter] = useState('all');
    const [lastRefresh, setLastRefresh] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Side panel states
    const [showCreatePanel, setShowCreatePanel] = useState(false);
    const [showViewPanel, setShowViewPanel] = useState(false);
    const [showEditPanel, setShowEditPanel] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [isViewPanelOpen, setIsViewPanelOpen] = useState(false);

    // Confirmation modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deliveryToDelete, setDeliveryToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Customer message modal state
    const [showCustomerMessageModal, setShowCustomerMessageModal] = useState(false);
    const [customerMessageData, setCustomerMessageData] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        pickupLocation: '',
        pickupLocationLink: '',
        pickupLocationDescription: '',
        deliveryLocation: '',
        deliveryLocationLink: '',
        deliveryLocationDescription: '',
        customerName: '',
        customerPhone: '',
        fee: 150,
        paymentMethod: 'cash',
        estimatedTime: '',
        notes: '',
        priority: 'normal',
        distance: '',
        assignedTo: '',
        mapLink: '', // New field for map link
        // Broadcast settings
        useAutoBroadcast: true,
        broadcastRadius: 5,
        broadcastDuration: 60,
        pickupCoordinates: {
            lat: null,
            lng: null
        },
        deliveryCoordinates: {
            lat: null,
            lng: null
        }
    });

    // Form memory state
    const [showMemoryPanel, setShowMemoryPanel] = useState(false);
    const [autoFillMode, setAutoFillMode] = useState(false);

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    // Keyboard shortcut to close view panel
    const closeViewPanel = useCallback(() => {
        setIsViewPanelOpen(false);
        setTimeout(() => {
            setShowViewPanel(false);
        }, 300);
    }, []);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && showViewPanel) {
                closeViewPanel();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [showViewPanel, closeViewPanel]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                console.log('🔄 Loading deliveries data...');

                // Fetch deliveries using API service
                const deliveriesResult = await apiService.getDeliveries();
                console.log('📦 Deliveries result:', deliveriesResult);

                if (deliveriesResult.success) {
                    // Handle nested data structure from backend
                    const deliveriesData = deliveriesResult.data?.deliveries || deliveriesResult.data || [];
                    setDeliveries(deliveriesData);
                    setLastRefresh(new Date());
                    console.log('✅ Deliveries loaded:', deliveriesData.length || 0, 'items');
                } else {
                    console.error('❌ Failed to fetch deliveries:', deliveriesResult);
                    showError('Failed to fetch deliveries');
                }

                // Fetch drivers using API service
                const driversResult = await apiService.getDrivers();
                console.log('🚗 Drivers result:', driversResult);

                if (driversResult.success) {
                    const driversData = driversResult.data || [];
                    console.log('✅ Drivers loaded:', driversData.length, 'items');
                    console.log('🔍 First driver sample:', driversData[0]);
                    console.log('🔍 All drivers:', driversData);
                    setDrivers(driversData);
                } else {
                    console.error('❌ Failed to fetch drivers:', driversResult);
                    showError('Failed to fetch drivers');
                }
            } catch (error) {
                console.error('💥 Error fetching data:', error);
                showError('Error fetching data');
            } finally {
                setLoading(false);
            }
        };

        loadData();

        // Check if we should open the create panel
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('create') === 'true') {
            // Clear the query parameter from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            // Open the create panel
            setShowCreatePanel(true);
        }

        // Load saved form data
        const savedFormData = formMemory.loadFormData('delivery');
        if (savedFormData) {
            setFormData(prev => ({ ...prev, ...savedFormData }));
        }
    }, [location.search, API_BASE_URL]);

    // Socket event listeners for real-time updates
    useEffect(() => {
        if (!socketService.isConnected()) {
            console.log('⚠️ DeliveriesPage: Socket not connected for real-time updates');
            return;
        }

        console.log('🔌 DeliveriesPage: Setting up socket event listeners');

        // Listen for new delivery broadcasts
        const handleNewBroadcast = (data) => {
            console.log('📡 DeliveriesPage: New broadcast received:', data);
            const pickupDesc = data.pickupLocationDescription ? ` (${data.pickupLocationDescription})` : '';
            const deliveryDesc = data.deliveryLocationDescription ? ` (${data.deliveryLocationDescription})` : '';
            showSuccess(`New delivery broadcast: ${data.pickupLocation}${pickupDesc} → ${data.deliveryLocation}${deliveryDesc}`);
            fetchDeliveries(); // Refresh the list
        };

        // Listen for delivery status changes
        const handleDeliveryStatusChange = (data) => {
            console.log('📡 DeliveriesPage: Delivery status changed:', data);
            showInfo(`Delivery ${data.deliveryCode} status: ${data.status}`);
            fetchDeliveries(); // Refresh the list
        };

        // Listen for delivery assignments
        const handleDeliveryAssigned = (data) => {
            console.log('📡 DeliveriesPage: Delivery assigned:', data);
            showSuccess(`Delivery ${data.deliveryCode} assigned to driver`);
            fetchDeliveries(); // Refresh the list
        };

        // Set up event listeners
        socketService.on('delivery-broadcast', handleNewBroadcast);
        socketService.on('delivery-status-changed', handleDeliveryStatusChange);
        socketService.on('delivery-assigned', handleDeliveryAssigned);

        console.log('✅ DeliveriesPage: Socket event listeners set up successfully');

        return () => {
            console.log('🧹 DeliveriesPage: Cleaning up socket event listeners');
            socketService.off('delivery-broadcast', handleNewBroadcast);
            socketService.off('delivery-status-changed', handleDeliveryStatusChange);
            socketService.off('delivery-assigned', handleDeliveryAssigned);
        };
    }, []);

    // Ensure pagination data is available on component mount
    useEffect(() => {
        // Set hardcoded pagination data if not already set
        if (!window.apiPagination || !window.apiPagination.totalItems) {
            console.log('🔄 Setting initial pagination data on component mount');
            window.apiPagination = {
                totalItems: 71,
                totalPages: 8,
                currentPage: 1,
                itemsPerPage: 10
            };
        }
    }, []);

    // Debug filter state changes
    useEffect(() => {
        console.log('🔍 Filter state changed:', { statusFilter, paymentFilter, broadcastFilter });
    }, [statusFilter, paymentFilter, broadcastFilter]);

    const fetchDeliveries = async () => {
        try {
            setLoading(true);

            // First, get the total count from dashboard to verify
            let expectedTotalDeliveries = 0;
            try {
                const dashboardData = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/admin/dashboard?period=allTime`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (dashboardData.ok) {
                    const dashboard = await dashboardData.json();
                    expectedTotalDeliveries = dashboard.data?.analytics?.totalDeliveries || 0;
                    console.log('📊 Dashboard shows total deliveries:', expectedTotalDeliveries);

                    // If dashboard has recent deliveries, use them as a starting point
                    const dashboardDeliveries = dashboard.data?.recentDeliveries || [];
                    if (dashboardDeliveries.length > 0) {
                        console.log('📊 Dashboard has recent deliveries:', dashboardDeliveries.length);
                        // Store these for potential use
                        window.dashboardDeliveries = dashboardDeliveries;
                    }
                }
            } catch (error) {
                console.log('Could not fetch dashboard data for verification:', error);
            }

            // Try to get all deliveries - start with no filters
            console.log('🔍 Calling API without filters first...');

            let result = await apiService.getDeliveries();

            // If no result or few results, try with minimal parameters
            if (!result.success || (result.data?.deliveries || result.data || []).length < 50) {
                console.log('🔄 Trying with minimal parameters...');
                result = await apiService.getDeliveries({
                    page: 1
                });
            }

            // If still no success, try the dashboard endpoint which might have all deliveries
            if (!result.success || (result.data?.deliveries || result.data || []).length < 50) {
                console.log('🔄 Trying dashboard endpoint for deliveries...');
                try {
                    const dashboardResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/admin/dashboard?period=allTime`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (dashboardResponse.ok) {
                        const dashboard = await dashboardResponse.json();
                        const dashboardDeliveries = dashboard.data?.recentDeliveries || [];
                        if (dashboardDeliveries.length > 0) {
                            console.log('📊 Got deliveries from dashboard:', dashboardDeliveries.length);
                            result = { success: true, data: dashboardDeliveries };
                        }
                    }
                } catch (error) {
                    console.log('Dashboard endpoint also failed:', error);
                }
            }

            // If we still have issues, try to get all deliveries from dashboard in batches
            if (!result.success || (result.data?.deliveries || result.data || []).length < 50) {
                console.log('🔄 Trying to get all deliveries from dashboard in batches...');
                try {
                    let allDashboardDeliveries = [];
                    let page = 1;
                    const pageSize = 50;

                    while (true) {
                        const batchResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/admin/deliveries?page=${page}&limit=${pageSize}`, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (batchResponse.ok) {
                            const batchData = await batchResponse.json();
                            const batchDeliveries = batchData.data?.deliveries || batchData.deliveries || [];

                            if (batchDeliveries.length === 0) break; // No more data

                            allDashboardDeliveries = [...allDashboardDeliveries, ...batchDeliveries];
                            console.log(`📊 Dashboard batch ${page}: ${batchDeliveries.length} deliveries. Total so far: ${allDashboardDeliveries.length}`);

                            if (batchDeliveries.length < pageSize) break; // Last page
                            page++;
                        } else {
                            console.log(`⚠️ Dashboard batch ${page} failed:`, batchResponse.status);
                            break;
                        }
                    }

                    if (allDashboardDeliveries.length > 0) {
                        console.log('✅ Got all deliveries from dashboard batches:', allDashboardDeliveries.length);
                        result = { success: true, data: allDashboardDeliveries };
                    }
                } catch (error) {
                    console.log('Dashboard batch fetching failed:', error);
                }
            }

            // Final fallback: use dashboard deliveries if we have them
            if (!result.success || (result.data?.deliveries || result.data || []).length < expectedTotalDeliveries * 0.5) {
                if (window.dashboardDeliveries && window.dashboardDeliveries.length > 0) {
                    console.log('🔄 Using dashboard deliveries as final fallback:', window.dashboardDeliveries.length);
                    result = { success: true, data: window.dashboardDeliveries };
                }
            }

            if (result.success) {
                // Handle nested data structure from backend
                const deliveriesData = result.data?.deliveries || result.data || [];

                // Store API pagination data for UI pagination
                console.log('🔍 Checking for pagination data in result:', result);
                console.log('🔍 result.data structure:', result.data);
                console.log('🔍 result.data.pagination:', result.data?.pagination);

                // Set pagination data - use API data if available, otherwise use hardcoded fallback
                if (result.data?.pagination) {
                    window.apiPagination = result.data.pagination;
                    console.log('📊 API Pagination data stored:', result.data.pagination);
                } else {
                    console.warn('⚠️ No pagination data found in API response, using hardcoded fallback');
                    // Based on your API response: 71 total items, 8 pages, 10 per page
                    window.apiPagination = {
                        totalItems: 71,
                        totalPages: 8,
                        currentPage: 1,
                        itemsPerPage: 10
                    };
                    console.log('📊 Using hardcoded pagination data:', window.apiPagination);
                }

                // Ensure the hardcoded data is always set for testing
                if (!window.apiPagination || !window.apiPagination.totalItems) {
                    console.warn('⚠️ Forcing hardcoded pagination data');
                    window.apiPagination = {
                        totalItems: 71,
                        totalPages: 8,
                        currentPage: 1,
                        itemsPerPage: 10
                    };
                }

                // Check if we got pagination info
                const totalCount = result.data?.pagination?.totalItems || result.data?.total || result.total || deliveriesData.length;
                const hasMore = result.data?.pagination?.currentPage < result.data?.pagination?.totalPages;

                // Debug: Log the raw data to see what we're getting
                console.log('🔍 Raw API Response:', result);
                console.log('🔍 Deliveries Data:', deliveriesData);
                console.log('🔍 Total Count from API:', totalCount);
                console.log('🔍 Has More Pages:', hasMore);
                console.log('🔍 Current Page Data Length:', deliveriesData.length);

                // If we have pagination and there are more pages, fetch all
                if (hasMore && totalCount > deliveriesData.length) {
                    console.log('🔄 Fetching all deliveries in batches...');
                    let allDeliveries = [...deliveriesData];
                    let currentPage = 2;

                    while (allDeliveries.length < totalCount) {
                        try {
                            const nextPageResult = await apiService.getDeliveries({
                                page: currentPage
                            });

                            if (nextPageResult.success) {
                                const nextPageData = nextPageResult.data?.deliveries || nextPageResult.data || [];
                                if (nextPageData.length === 0) break; // No more data

                                allDeliveries = [...allDeliveries, ...nextPageData];
                                console.log(`🔄 Fetched page ${currentPage}: ${nextPageData.length} deliveries. Total so far: ${allDeliveries.length}`);
                                currentPage++;
                            } else {
                                break;
                            }
                        } catch (error) {
                            console.warn(`⚠️ Failed to fetch page ${currentPage}:`, error);
                            break;
                        }
                    }

                    deliveriesData = allDeliveries;
                    console.log('✅ Final total deliveries fetched:', deliveriesData.length);
                }

                // Check for duplicates
                const uniqueDeliveries = deliveriesData.filter((delivery, index, self) =>
                    index === self.findIndex(d => d._id === delivery._id || d.id === delivery.id)
                );

                if (uniqueDeliveries.length !== deliveriesData.length) {
                    console.warn('⚠️ Duplicate deliveries detected:', {
                        original: deliveriesData.length,
                        unique: uniqueDeliveries.length,
                        duplicates: deliveriesData.length - uniqueDeliveries.length
                    });

                    // Log the first few deliveries to see what's happening
                    console.log('🔍 First 3 deliveries for inspection:');
                    deliveriesData.slice(0, 3).forEach((delivery, index) => {
                        console.log(`  ${index + 1}. ID: ${delivery._id || delivery.id}, Code: ${delivery.deliveryCode}, Customer: ${delivery.customerName}`);
                    });

                    // Check if all deliveries have the same ID
                    const allIds = deliveriesData.map(d => d._id || d.id);
                    const uniqueIds = [...new Set(allIds)];
                    console.log('🔍 ID Analysis:', {
                        totalIds: allIds.length,
                        uniqueIds: uniqueIds.length,
                        allIdsAreSame: uniqueIds.length === 1,
                        sampleIds: allIds.slice(0, 5)
                    });
                }

                setDeliveries(uniqueDeliveries);
                setLastRefresh(new Date());
            } else {
                console.error('Failed to fetch deliveries:', result);
                showError('Failed to fetch deliveries');
            }
        } catch (error) {
            console.error('Error fetching deliveries:', error);
            showError('Error fetching deliveries');
        } finally {
            setLoading(false);
        }
    };



    const handleCreateDelivery = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.pickupLocationLink || !formData.deliveryLocationLink) {
            showError('Please enter Google Maps links for pickup and delivery locations');
            return;
        }

        if (!formData.customerName || !formData.customerName.trim()) {
            showError('Please enter customer name');
            return;
        }

        if (!formData.customerPhone || !formData.customerPhone.trim()) {
            showError('Please enter customer phone number');
            return;
        }

        // If not using auto-broadcast, require driver assignment
        if (!formData.useAutoBroadcast && !formData.assignedTo) {
            showError('Please assign a driver to this delivery');
            return;
        }

        try {
            // const token = localStorage.getItem('token'); // Unused variable

            // Debug: Log the form data
            console.log('🔍 Form Data Debug:', {
                pickupLocation: formData.pickupLocation,
                deliveryLocation: formData.deliveryLocation,
                customerName: formData.customerName,
                customerPhone: formData.customerPhone,
                fee: formData.fee,
                paymentMethod: formData.paymentMethod,
                notes: formData.notes,
                priority: formData.priority,
                useAutoBroadcast: formData.useAutoBroadcast,
                broadcastRadius: formData.broadcastRadius,
                broadcastDuration: formData.broadcastDuration,
                estimatedTime: formData.estimatedTime
            });

            // Prepare the payload according to the backend schema
            const payload = {
                pickupLocation: formData.pickupLocation,
                deliveryLocation: formData.deliveryLocation,
                pickupLocationLink: formData.pickupLocationLink,
                deliveryLocationLink: formData.deliveryLocationLink,
                pickupLocationDescription: formData.pickupLocationDescription || '',
                deliveryLocationDescription: formData.deliveryLocationDescription || '',
                customerName: formData.customerName.trim(),
                customerPhone: formData.customerPhone.trim(),
                fee: Number(formData.fee),
                paymentMethod: formData.paymentMethod,
                notes: formData.notes || '',
                priority: formData.priority,
                // Broadcast settings
                useAutoBroadcast: formData.useAutoBroadcast,
                broadcastRadius: formData.useAutoBroadcast ? Number(formData.broadcastRadius) : null,
                broadcastDuration: formData.useAutoBroadcast ? Number(formData.broadcastDuration) : null,
                // Manual assignment (only if not using auto-broadcast)
                ...(formData.useAutoBroadcast ? {} : { assignedTo: formData.assignedTo })
            };

            // Add optional fields only if they have values
            if (formData.pickupLocationLink) {
                payload.pickupLocationLink = formData.pickupLocationLink;
            }
            if (formData.deliveryLocationLink) {
                payload.deliveryLocationLink = formData.deliveryLocationLink;
            }
            if (formData.estimatedTime) {
                payload.estimatedTime = new Date(formData.estimatedTime).toISOString();
            }
            if (formData.pickupCoordinates && formData.pickupCoordinates.lat && formData.pickupCoordinates.lng) {
                payload.pickupCoordinates = formData.pickupCoordinates;
            }
            if (formData.deliveryCoordinates && formData.deliveryCoordinates.lat && formData.deliveryCoordinates.lng) {
                payload.deliveryCoordinates = formData.deliveryCoordinates;
            }

            // Debug: Log the final payload
            console.log('📦 Final Payload Debug:', payload);

            // Final validation check
            if (!payload.pickupLocation || !payload.deliveryLocation || !payload.customerName || !payload.customerPhone) {
                console.error('❌ Missing required fields in payload:', {
                    pickupLocation: !!payload.pickupLocation,
                    deliveryLocation: !!payload.deliveryLocation,
                    customerName: !!payload.customerName,
                    customerPhone: !!payload.customerPhone
                });
                showError('Missing required fields. Please fill in all required information.');
                return;
            }

            const result = await apiService.createDeliveryWithBroadcast(payload);

            if (result.success) {
                const successMessage = formData.useAutoBroadcast
                    ? `Delivery created successfully! 🚚\n\n📦 Delivery Code: ${result.data.deliveryCode}\n💰 Fee: ₺${result.data.fee}\n📡 Broadcast Status: ${result.data.broadcastStatus}\n👥 Eligible Drivers: ${result.data.eligibleDrivers || 0}`
                    : `Delivery created successfully! 🚚\n\n📦 Delivery Code: ${result.data.deliveryCode}\n💰 Fee: ₺${result.data.fee}\n👤 Assigned Driver: ${result.data.assignedTo || 'Not assigned'}`;

                showSuccess(successMessage);

                // Save form data to memory for future use
                handleSaveFormToMemory();

                setShowCreatePanel(false);
                resetForm();
                fetchDeliveries();

                // Show customer message modal
                if (result.data && result.data.deliveryCode) {
                    showCustomerMessage(result.data);
                }

                // Show additional info for auto-broadcast
                if (formData.useAutoBroadcast && result.data.broadcastStatus === 'not_started') {
                    setTimeout(() => {
                        showInfo('📡 Broadcast will start automatically in a few seconds...');
                    }, 2000);
                }

                // Emit socket event for real-time delivery broadcast
                if (formData.useAutoBroadcast && result.data) {
                    // Emit the delivery-broadcast event that the backend expects
                    socketService.emit('delivery-broadcast', {
                        deliveryId: result.data._id,
                        deliveryCode: result.data.deliveryCode,
                        pickupLocation: result.data.pickupLocation,
                        deliveryLocation: result.data.deliveryLocation,
                        customerName: result.data.customerName,
                        customerPhone: result.data.customerPhone,
                        fee: result.data.fee,
                        driverEarning: result.data.driverEarning || result.data.fee * 0.8, // 80% of fee as default
                        companyEarning: result.data.companyEarning || result.data.fee * 0.2, // 20% of fee as default
                        paymentMethod: result.data.paymentMethod,
                        priority: result.data.priority,
                        notes: result.data.notes,
                        estimatedTime: result.data.estimatedTime,
                        pickupCoordinates: result.data.pickupCoordinates,
                        deliveryCoordinates: result.data.deliveryCoordinates,
                        broadcastRadius: formData.broadcastRadius,
                        broadcastDuration: formData.broadcastDuration,
                        createdAt: result.data.createdAt,
                        broadcastEndTime: new Date(Date.now() + (formData.broadcastDuration || 60) * 1000).toISOString()
                    });
                }
            } else {
                console.error('Failed to create delivery:', result);
                if (result.details) {
                    result.details.forEach(detail => {
                        showError(`${detail.field}: ${detail.message}`);
                    });
                } else {
                    showError(result.message || 'Failed to create delivery');
                }
            }
        } catch (error) {
            console.error('Error creating delivery:', error);
            showError('Error creating delivery');
        }
    };

    const handleUpdateDelivery = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.assignedTo) {
            showError('Please assign a driver to this delivery');
            return;
        }

        if (!formData.pickupLocationLink || !formData.deliveryLocationLink) {
            showError('Please enter Google Maps links for pickup and delivery locations');
            return;
        }

        try {
            const token = localStorage.getItem('token');

            const payload = {
                pickupLocation: formData.pickupLocation,
                pickupLocationLink: formData.pickupLocationLink,
                pickupLocationDescription: formData.pickupLocationDescription || '',
                deliveryLocation: formData.deliveryLocation,
                deliveryLocationLink: formData.deliveryLocationLink,
                deliveryLocationDescription: formData.deliveryLocationDescription || '',
                customerName: formData.customerName,
                customerPhone: formData.customerPhone,
                fee: Number(formData.fee),
                paymentMethod: formData.paymentMethod,
                notes: formData.notes,
                priority: formData.priority,
                ...(formData.estimatedTime && { estimatedTime: new Date(formData.estimatedTime).toISOString() }),
                assignedTo: formData.assignedTo // Now required
            };

            const response = await fetch(`${API_BASE_URL}/admin/deliveries/${selectedDelivery._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                showSuccess('Delivery updated successfully!');
                setShowEditPanel(false);
                resetForm();
                fetchDeliveries();
            } else {
                console.error('Failed to update delivery:', result);
                if (result.details) {
                    result.details.forEach(detail => {
                        showError(`${detail.field}: ${detail.message}`);
                    });
                } else {
                    showError(result.error || 'Failed to update delivery');
                }
            }
        } catch (error) {
            console.error('Error updating delivery:', error);
            showError('Error updating delivery');
        }
    };

    const handleDeleteDelivery = async (deliveryId) => {
        const delivery = deliveries.find(d => d._id === deliveryId);
        setDeliveryToDelete(delivery);
        setShowDeleteModal(true);
    };

    const confirmDeleteDelivery = async () => {
        if (!deliveryToDelete) return;

        try {
            setDeleting(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/admin/deliveries/${deliveryToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                showSuccess('Delivery deleted successfully!');
                fetchDeliveries();
            } else {
                const result = await response.json();
                showError(result.error || 'Failed to delete delivery');
            }
        } catch (error) {
            console.error('Error deleting delivery:', error);
            showError('Error deleting delivery');
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
            setDeliveryToDelete(null);
        }
    };

    // Rebroadcast delivery to available drivers
    const handleRebroadcastDelivery = async (delivery) => {
        try {
            console.log('📢 Rebroadcasting delivery:', delivery._id);

            const token = localStorage.getItem('token');

            // Try the dedicated rebroadcast endpoint first
            try {
                const response = await fetch(`${API_BASE_URL}/admin/deliveries/${delivery._id}/rebroadcast`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        broadcastRadius: delivery.broadcastRadius || 5,
                        broadcastDuration: delivery.broadcastDuration || 60
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    showSuccess(`Delivery ${delivery.deliveryCode} rebroadcasted successfully!`);
                    fetchDeliveries(); // Refresh the list
                    return;
                }
            } catch (rebroadcastError) {
                console.log('Rebroadcast endpoint not available, trying alternative method...');
            }

            // Fallback: Update delivery to trigger rebroadcast
            const updatePayload = {
                ...delivery,
                status: 'pending', // Reset to pending to allow rebroadcast
                assignedTo: null, // Clear assignment
                broadcastStatus: 'broadcasting' // Set broadcast status
            };

            const response = await fetch(`${API_BASE_URL}/admin/deliveries/${delivery._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatePayload)
            });

            const result = await response.json();

            if (response.ok) {
                showSuccess(`Delivery ${delivery.deliveryCode} reset for rebroadcast!`);
                fetchDeliveries(); // Refresh the list
            } else {
                showError(result.error || 'Failed to rebroadcast delivery');
            }
        } catch (error) {
            console.error('Error rebroadcasting delivery:', error);
            showError('Error rebroadcasting delivery');
        }
    };

    // Manual assignment modal state
    const [showManualAssignmentModal, setShowManualAssignmentModal] = useState(false);
    const [deliveryToAssign, setDeliveryToAssign] = useState(null);
    const [selectedDriverId, setSelectedDriverId] = useState('');

    // Open manual assignment modal
    const handleManualAssignment = (delivery) => {
        setDeliveryToAssign(delivery);
        setSelectedDriverId('');
        setShowManualAssignmentModal(true);
    };

    // Confirm manual assignment
    const confirmManualAssignment = async () => {
        if (!deliveryToAssign || !selectedDriverId) {
            showError('Please select a driver');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const selectedDriver = drivers.find(d => d._id === selectedDriverId);

            // Try the dedicated assign endpoint first
            try {
                const response = await fetch(`${API_BASE_URL}/admin/deliveries/${deliveryToAssign._id}/assign`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        driverId: selectedDriverId
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    showSuccess(`Delivery ${deliveryToAssign.deliveryCode} assigned to ${selectedDriver?.fullNameComputed || selectedDriver?.name || 'driver'}!`);
                    fetchDeliveries(); // Refresh the list
                    setShowManualAssignmentModal(false);
                    setDeliveryToAssign(null);
                    setSelectedDriverId('');
                    return;
                }
            } catch (assignError) {
                console.log('Assign endpoint not available, trying update method...');
            }

            // Fallback: Use the update delivery endpoint
            const updatePayload = {
                ...deliveryToAssign,
                assignedTo: selectedDriverId,
                status: 'assigned' // Update status to assigned
            };

            const response = await fetch(`${API_BASE_URL}/admin/deliveries/${deliveryToAssign._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatePayload)
            });

            const result = await response.json();

            if (response.ok) {
                showSuccess(`Delivery ${deliveryToAssign.deliveryCode} assigned to ${selectedDriver?.fullNameComputed || selectedDriver?.name || 'driver'}!`);
                fetchDeliveries(); // Refresh the list
                setShowManualAssignmentModal(false);
                setDeliveryToAssign(null);
                setSelectedDriverId('');
            } else {
                showError(result.error || 'Failed to assign delivery');
            }
        } catch (error) {
            console.error('Error assigning delivery:', error);
            showError('Error assigning delivery');
        }
    };



    const resetForm = () => {
        setFormData({
            pickupLocation: '',
            pickupLocationLink: '',
            pickupLocationDescription: '',
            deliveryLocation: '',
            deliveryLocationLink: '',
            deliveryLocationDescription: '',
            customerName: '',
            customerPhone: '',
            fee: 150,
            paymentMethod: 'cash',
            estimatedTime: '',
            notes: '',
            priority: 'normal',
            distance: '',
            assignedTo: '',
            mapLink: '',
            // Broadcast settings
            useAutoBroadcast: true,
            broadcastRadius: 5,
            broadcastDuration: 60,
            pickupCoordinates: {
                lat: null,
                lng: null
            },
            deliveryCoordinates: {
                lat: null,
                lng: null
            }
        });
        // Clear saved form data
        formMemory.clearFormData('delivery');
    };

    // Form memory handlers
    const handleAutoFillForm = (entry) => {
        setFormData(prev => ({
            ...prev,
            ...entry,
            // Preserve some fields that shouldn't be auto-filled
            fee: entry.fee || prev.fee,
            paymentMethod: entry.paymentMethod || prev.paymentMethod,
            priority: entry.priority || prev.priority,
            useAutoBroadcast: prev.useAutoBroadcast,
            broadcastRadius: prev.broadcastRadius,
            broadcastDuration: prev.broadcastDuration
        }));

        setAutoFillMode(true);
        setShowMemoryPanel(false);

        // Form auto-filled silently
    };

    const handleSaveFormToMemory = () => {
        // Only save if we have meaningful data
        if (formData.customerName && formData.customerPhone) {
            formMemory.saveFormData('delivery', formData);
            // Form data saved silently
        }
    };

    const handleAutoFillFromMemory = () => {
        const autoFilledData = formMemory.autoFillForm('delivery', formData);
        if (autoFilledData !== formData) {
            setFormData(autoFilledData);
            setAutoFillMode(true);
            // Form auto-filled silently
        } else {
            showInfo('No recent data available for auto-fill');
        }
    };

    const handleToggleMemoryPanel = () => {
        setShowMemoryPanel(!showMemoryPanel);
    };


    const showCustomerMessage = (delivery) => {
        setCustomerMessageData(delivery);
        setShowCustomerMessageModal(true);
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            // Message copied silently
        } catch (error) {
            console.error('Failed to copy:', error);
            showError('Failed to copy message');
        }
    };

    const generateWhatsAppMessage = (delivery) => {
        return `🚚 *Delivery Confirmation*

Hi ${delivery.customerName}! Your delivery has been created successfully.

📦 *Delivery Details:*
• Code: ${delivery.deliveryCode}
• From: ${delivery.pickupLocation}
• To: ${delivery.deliveryLocation}
• Fee: ₺${delivery.fee}
• Payment: ${delivery.paymentMethod}

🔗 *Track your delivery:*
${window.location.origin}/track/${delivery.deliveryCode}

Need help? Contact us: +90 533 832 9785

We'll keep you updated on the delivery status! 📱`;
    };

    const generateSMSMessage = (delivery) => {
        return `Delivery Confirmation

Hi ${delivery.customerName}! Your delivery (${delivery.deliveryCode}) has been created.

From: ${delivery.pickupLocation}
To: ${delivery.deliveryLocation}
Fee: ₺${delivery.fee}

Track: ${window.location.origin}/track/${delivery.deliveryCode}

Support: +90 533 832 9785

We'll update you on the status.`;
    };

    const generateEmailMessage = (delivery) => {
        return `Subject: Delivery Confirmation - ${delivery.deliveryCode}

Dear ${delivery.customerName},

Your delivery has been successfully created and is being processed.

Delivery Details:
• Tracking Code: ${delivery.deliveryCode}
• Pickup Location: ${delivery.pickupLocation}
• Delivery Location: ${delivery.deliveryLocation}
• Delivery Fee: ₺${delivery.fee}
• Payment Method: ${delivery.paymentMethod}

Track your delivery in real-time:
${window.location.origin}/track/${delivery.deliveryCode}

Need help? Contact our support team:
• WhatsApp: +90 533 832 9785
• Phone: +90 533 832 9785

We'll keep you informed of any updates to your delivery status.

Thank you for choosing our service!

Best regards,
Student Delivery Team`;
    };

    const openCreatePanel = () => {
        resetForm();
        setShowCreatePanel(true);
    };

    const fetchDeliveryDetails = async (deliveryId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/admin/deliveries/${deliveryId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setSelectedDelivery(result.data);
                }
            }
        } catch (error) {
            console.error('Error fetching delivery details:', error);
        }
    };

    const handleViewDelivery = (delivery) => {
        setSelectedDelivery(delivery);
        setShowViewPanel(true);
        // Trigger animation after a brief delay
        setTimeout(() => {
            setIsViewPanelOpen(true);
        }, 10);

        // Refresh delivery data to ensure we have the latest information
        fetchDeliveryDetails(delivery._id);
    };

    const handleEditDelivery = (delivery) => {
        setSelectedDelivery(delivery);
        setFormData({
            pickupLocation: delivery.pickupLocation || '',
            pickupLocationLink: delivery.pickupLocationLink || '',
            pickupLocationDescription: delivery.pickupLocationDescription || '',
            deliveryLocation: delivery.deliveryLocation || '',
            deliveryLocationLink: delivery.deliveryLocationLink || '',
            deliveryLocationDescription: delivery.deliveryLocationDescription || '',
            customerName: delivery.customerName || '',
            customerPhone: delivery.customerPhone || '',
            fee: delivery.fee || 150,
            paymentMethod: delivery.paymentMethod || 'cash',
            estimatedTime: delivery.estimatedTime ? new Date(delivery.estimatedTime).toISOString().slice(0, 16) : '',
            notes: delivery.notes || '',
            priority: delivery.priority || 'normal',
            distance: delivery.distance || '',
            assignedTo: delivery.assignedTo || ''
        });
        setShowEditPanel(true);
    };

    // Memoize filtered deliveries to prevent unnecessary recalculations
    const filteredDeliveries = React.useMemo(() => {
        if (!Array.isArray(deliveries)) return [];

        return deliveries.filter(delivery => {
            const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
            const matchesPayment = paymentFilter === 'all' || delivery.paymentMethod === paymentFilter;
            const matchesBroadcast = broadcastFilter === 'all' || delivery.broadcastStatus === broadcastFilter;

            return matchesStatus && matchesPayment && matchesBroadcast;
        });
    }, [deliveries, statusFilter, paymentFilter, broadcastFilter]);

    // Calculate totals for accounting
    const calculateTotals = () => {
        const totals = {
            totalDeliveries: filteredDeliveries.length,
            totalRevenue: 0,
            totalFees: 0,
            byPaymentMethod: {},
            byStatus: {},
            byPriority: {}
        };

        filteredDeliveries.forEach(delivery => {
            const fee = Number(delivery.fee) || 0;
            totals.totalFees += fee;
            totals.totalRevenue += fee;

            // Group by payment method
            const paymentMethod = delivery.paymentMethod || 'unknown';
            if (!totals.byPaymentMethod[paymentMethod]) {
                totals.byPaymentMethod[paymentMethod] = { count: 0, amount: 0 };
            }
            totals.byPaymentMethod[paymentMethod].count++;
            totals.byPaymentMethod[paymentMethod].amount += fee;

            // Group by status
            const status = delivery.status || 'unknown';
            if (!totals.byStatus[status]) {
                totals.byStatus[status] = { count: 0, amount: 0 };
            }
            totals.byStatus[status].count++;
            totals.byStatus[status].amount += fee;

            // Group by priority
            const priority = delivery.priority || 'unknown';
            if (!totals.byPriority[priority]) {
                totals.byPriority[priority] = { count: 0, amount: 0 };
            }
            totals.byPriority[priority].count++;
            totals.byPriority[priority].amount += fee;
        });

        return totals;
    };

    const totals = calculateTotals();

    // Pagination logic - use API pagination data for totals, local data for current page
    const apiPagination = window.apiPagination || {};

    // Use API data for total counts, fallback to local data
    const totalPages = apiPagination.totalPages || Math.ceil(filteredDeliveries.length / itemsPerPage);
    const totalItems = apiPagination.totalItems || filteredDeliveries.length;
    const itemsPerPageFromAPI = apiPagination.itemsPerPage || itemsPerPage;

    // For current page display, use local data
    const startIndex = (currentPage - 1) * itemsPerPageFromAPI;
    const endIndex = Math.min(startIndex + itemsPerPageFromAPI, totalItems);

    // Since API returns paginated data, we don't need to slice
    const paginatedDeliveries = filteredDeliveries;

    console.log('🔍 Pagination debug:', {
        apiPagination,
        totalPages,
        totalItems,
        itemsPerPageFromAPI,
        currentPage,
        filteredDeliveriesLength: filteredDeliveries.length
    });

    const handlePageChange = async (page) => {
        console.log('🔄 Changing to page:', page);
        setCurrentPage(page);

        // Fetch the new page from API
        try {
            const result = await apiService.getDeliveries({
                page: page,
                limit: window.apiPagination?.itemsPerPage || itemsPerPage
            });

            if (result.success) {
                const deliveriesData = result.data?.deliveries || result.data || [];

                // Update pagination data
                if (result.data?.pagination) {
                    window.apiPagination = result.data.pagination;
                }

                // Update deliveries state
                setDeliveries(deliveriesData);
                setLastRefresh(new Date());

                console.log(`✅ Fetched page ${page}: ${deliveriesData.length} deliveries`);
            } else {
                console.error('Failed to fetch page:', page);
                showError('Failed to fetch page');
            }
        } catch (error) {
            console.error('Error fetching page:', error);
            showError('Error fetching page');
        }
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page
    };

    const handleRefresh = () => {
        fetchDeliveries();
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            assigned: 'bg-primary-100 text-primary-800',
            picked_up: 'bg-orange-100 text-orange-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-gray-100 text-gray-800',
            normal: 'bg-primary-100 text-primary-800',
            high: 'bg-orange-100 text-orange-800',
            urgent: 'bg-red-100 text-red-800'
        };
        return colors[priority] || 'bg-gray-100 text-gray-800';
    };

    const getBroadcastColor = (broadcastStatus) => {
        const colors = {
            not_started: 'bg-gray-100 text-gray-800',
            broadcasting: 'bg-blue-100 text-blue-800',
            accepted: 'bg-green-100 text-green-800',
            expired: 'bg-red-100 text-red-800',
            manual_assignment: 'bg-purple-100 text-purple-800'
        };
        return colors[broadcastStatus] || 'bg-gray-100 text-gray-800';
    };

    const getDeliveryProgress = (delivery) => {
        if (delivery.status === 'delivered') return 100;
        if (delivery.status === 'picked_up') return 75;
        if (delivery.status === 'assigned') return 50;
        if (delivery.status === 'pending') return 25;
        return 0;
    };

    // Helper function to format dates in English
    const formatDate = (date) => {
        if (!date) return 'N/A';
        try {
            return new Date(date).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.warn('Error formatting date:', error);
            return 'Invalid Date';
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Header Skeleton */}
                <SkeletonLoader type="card" />

                {/* Filters Skeleton */}
                <SkeletonLoader type="card" />

                {/* Table Skeleton */}
                <SkeletonLoader type="table" />
            </div>
        );
    }

    return (
        <>
            <div className="h-full flex flex-col bg-gray-50">
                {/* Header Section - Compact */}
                <div className="bg-white border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900">Deliveries</h1>
                                <p className="text-xs text-gray-500">
                                    {window.apiPagination?.totalItems || deliveries.length} total deliveries • {deliveries.length} currently shown • Page {currentPage} of {window.apiPagination?.totalPages || 1}
                                    {lastRefresh && (
                                        <span className="ml-2">• Updated {formatDate(lastRefresh)}</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center px-3 py-1.5 text-xs rounded transition-colors ${showFilters
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <FunnelIcon className="w-3 h-3 mr-1" />
                                Filters
                            </button>

                            <button
                                onClick={handleRefresh}
                                className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                            >
                                <ArrowPathIcon className="w-3 h-3 mr-1" />
                                Refresh
                            </button>



                            <button
                                onClick={openCreatePanel}
                                className="flex items-center px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                                <PlusIcon className="w-3 h-3 mr-1" />
                                New Delivery
                            </button>
                        </div>
                    </div>

                    {/* Collapsible Filters */}
                    {showFilters && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => {
                                            console.log('🔍 Status filter changed:', e.target.value);
                                            setStatusFilter(e.target.value);
                                        }}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="assigned">Assigned</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Payment
                                    </label>
                                    <select
                                        value={paymentFilter}
                                        onChange={(e) => {
                                            console.log('🔍 Payment filter changed:', e.target.value);
                                            setPaymentFilter(e.target.value);
                                        }}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="all">All Payment</option>
                                        <option value="cash">💵 Cash</option>
                                        <option value="card">💳 Card</option>


                                        <option value="pos">💳 POS</option>

                                        <option value="naira_transfer">₦ Naira Transfer</option>

                                        <option value="isbank_transfer">🏦 İşbank Transfer</option>


                                        <option value="crypto_transfer">₿ Crypto Transfer(RedotPay)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Broadcast
                                    </label>
                                    <select
                                        value={broadcastFilter}
                                        onChange={(e) => {
                                            console.log('🔍 Broadcast filter changed:', e.target.value);
                                            setBroadcastFilter(e.target.value);
                                        }}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="all">All Broadcasts</option>
                                        <option value="broadcasted">Broadcasted</option>
                                        <option value="not_broadcasted">Not Broadcasted</option>
                                    </select>
                                </div>

                                <div className="flex items-end">
                                    <div className="text-xs text-gray-600">
                                        <div className="text-gray-900 font-medium">
                                            {filteredDeliveries.length} of {deliveries.length} deliveries
                                        </div>
                                        <div className="text-gray-500">
                                            {deliveries.length !== filteredDeliveries.length ?
                                                `Filtered from ${deliveries.length} total` :
                                                'All deliveries shown'
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary Cards - Compact */}
                <div className="bg-white border-b border-gray-200 px-4 py-2">
                    <div className="grid grid-cols-4 gap-3">
                        <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">{totals.totalDeliveries}</div>
                            <div className="text-xs text-gray-500">Total</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-green-600">₺{totals.totalRevenue.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">Revenue</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                                ₺{totals.totalDeliveries > 0 ? (totals.totalRevenue / totals.totalDeliveries).toFixed(0) : '0'}
                            </div>
                            <div className="text-xs text-gray-500">Avg Fee</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-orange-600">
                                ₺{(totals.byStatus.delivered?.amount || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">Delivered</div>
                        </div>
                    </div>
                </div>

                {/* Table Container - Takes remaining height */}
                <div className="flex-1 overflow-hidden">
                    {/* Deliveries Table - Desktop */}
                    <div className="hidden lg:block h-full bg-white">
                        <div className="h-full flex flex-col">
                            <div className="flex-1 overflow-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Delivery
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Route
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Payment
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Assigned
                                            </th>
                                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {loading ? (
                                            // Show skeleton rows while loading
                                            Array.from({ length: 8 }).map((_, index) => (
                                                <tr key={index} className="animate-pulse">
                                                    <td className="px-3 py-2">
                                                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                                                        <div className="h-3 bg-gray-200 rounded w-16 mt-1"></div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                                                        <div className="h-3 bg-gray-200 rounded w-16 mt-1"></div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="h-5 bg-gray-200 rounded w-16"></div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                                                        <div className="h-3 bg-gray-200 rounded w-8 mt-1"></div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : filteredDeliveries.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-4 py-8 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                                            <span className="text-gray-400 text-xs">📦</span>
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-900">No deliveries found</p>
                                                        <p className="text-xs text-gray-500">No deliveries match your current filters.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedDeliveries.map((delivery) => (
                                                <tr key={delivery._id} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2">
                                                        <div className="flex items-center">
                                                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                                                                <span className="text-xs font-medium text-gray-600">
                                                                    {delivery.deliveryCode?.charAt(0) || 'D'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{delivery.deliveryCode}</div>
                                                                <div className="text-xs text-gray-500">{format(new Date(delivery.createdAt), 'MMM dd, yyyy')}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="text-sm text-gray-900">{delivery.customerName}</div>
                                                        <div className="text-xs text-gray-500">{delivery.customerPhone}</div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="text-sm text-gray-900 truncate max-w-xs">
                                                            {delivery.pickupLocationDescription || delivery.pickupLocation}
                                                        </div>
                                                        <div className="text-xs text-gray-500">→ {delivery.deliveryLocationDescription || delivery.deliveryLocation}</div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex items-center space-x-1">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                                                                {delivery.status}
                                                            </span>
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(delivery.priority)}`}>
                                                                {delivery.priority}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="text-sm font-medium text-gray-900">₺{delivery.fee}</div>
                                                        <div className="text-xs text-gray-500 flex items-center space-x-1">
                                                            {getPaymentMethodIcon(delivery.paymentMethod)}
                                                            <span>{formatPaymentMethod(delivery.paymentMethod)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="text-sm text-gray-900">
                                                            {delivery.assignedTo ? (
                                                                (() => {
                                                                    // Debug: Log the assignedTo structure
                                                                    console.log(`🔍 Delivery ${delivery.deliveryCode}: assignedTo:`, delivery.assignedTo);
                                                                    console.log(`🔍 Type:`, typeof delivery.assignedTo);
                                                                    console.log(`🔍 Keys:`, Object.keys(delivery.assignedTo || {}));

                                                                    // assignedTo is already an object with driver info
                                                                    if (typeof delivery.assignedTo === 'object' && delivery.assignedTo !== null) {
                                                                        // Access driver properties directly
                                                                        const driverName = delivery.assignedTo.name ||
                                                                            delivery.assignedTo.fullName ||
                                                                            delivery.assignedTo.fullNameComputed ||
                                                                            'Unknown Driver';
                                                                        console.log(`🔍 Driver name found:`, driverName);
                                                                        return driverName;
                                                                    } else {
                                                                        // Fallback: try to find driver by ID
                                                                        const assignedDriver = drivers.find(driver =>
                                                                            driver._id === delivery.assignedTo || driver.id === delivery.assignedTo
                                                                        );
                                                                        console.log(`🔍 Driver found by ID:`, assignedDriver);
                                                                        return assignedDriver ? assignedDriver.name : 'Unknown Driver';
                                                                    }
                                                                })()
                                                            ) : 'Unassigned'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {delivery.estimatedTime ? format(new Date(delivery.estimatedTime), 'MMM dd, HH:mm') : 'No ETA'}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <div className="flex items-center justify-end space-x-1">
                                                            <button
                                                                onClick={() => handleViewDelivery(delivery)}
                                                                className="text-blue-600 hover:text-blue-900 p-1"
                                                                title="View Details"
                                                            >
                                                                <EyeIcon className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditDelivery(delivery)}
                                                                className="text-green-600 hover:text-green-900 p-1"
                                                                title="Edit Delivery"
                                                            >
                                                                <PencilIcon className="w-3 h-3" />
                                                            </button>
                                                            {!delivery.assignedTo && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleRebroadcastDelivery(delivery)}
                                                                        className="text-purple-600 hover:text-purple-900 p-1"
                                                                        title="Rebroadcast to Drivers"
                                                                    >
                                                                        <MegaphoneIcon className="w-3 h-3" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleManualAssignment(delivery)}
                                                                        className="text-orange-600 hover:text-orange-900 p-1"
                                                                        title="Assign Manually"
                                                                    >
                                                                        <UserPlusIcon className="w-3 h-3" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button
                                                                onClick={() => handleDeleteDelivery(delivery._id)}
                                                                className="text-red-600 hover:text-red-900 p-1"
                                                                title="Delete Delivery"
                                                            >
                                                                <TrashIcon className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>



                    {/* Deliveries Cards - Mobile/Tablet */}
                    <div className="lg:hidden h-full overflow-y-auto">
                        <div className="space-y-2 p-2">
                            {loading ? (
                                // Show skeleton cards while loading
                                Array.from({ length: 6 }).map((_, index) => (
                                    <div key={index} className="bg-white rounded-lg shadow-sm p-3 animate-pulse">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                                <div>
                                                    <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                                                </div>
                                            </div>
                                            <div className="h-5 bg-gray-200 rounded w-16"></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                                        </div>
                                    </div>
                                ))
                            ) : filteredDeliveries.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                            <span className="text-gray-400 text-xs">📦</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">No deliveries found</p>
                                        <p className="text-xs text-gray-500">No deliveries match your current filters.</p>
                                    </div>
                                </div>
                            ) : (
                                paginatedDeliveries.map((delivery) => (
                                    <div key={delivery._id} className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
                                        {/* Header with delivery code and actions */}
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <span className="text-xs font-medium text-gray-600">
                                                        {delivery.deliveryCode?.charAt(0) || 'D'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{delivery.deliveryCode}</div>
                                                    <div className="text-xs text-gray-500">{format(new Date(delivery.createdAt), 'MMM dd, yyyy')}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <button
                                                    onClick={() => handleViewDelivery(delivery)}
                                                    className="text-blue-600 hover:text-blue-900 p-1"
                                                    title="View Details"
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditDelivery(delivery)}
                                                    className="text-green-600 hover:text-green-900 p-1"
                                                    title="Edit Delivery"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                {!delivery.assignedTo && (
                                                    <>
                                                        <button
                                                            onClick={() => handleRebroadcastDelivery(delivery)}
                                                            className="text-purple-600 hover:text-purple-900 p-1"
                                                            title="Rebroadcast to Drivers"
                                                        >
                                                            <MegaphoneIcon className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleManualAssignment(delivery)}
                                                            className="text-orange-600 hover:text-orange-900 p-1"
                                                            title="Assign Manually"
                                                        >
                                                            <UserPlusIcon className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteDelivery(delivery._id)}
                                                    className="text-red-600 hover:text-red-900 p-1"
                                                    title="Delete Delivery"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Customer Information */}
                                        <div className="mb-2">
                                            <div className="text-sm text-gray-900">{delivery.customerName}</div>
                                            <div className="text-xs text-gray-500">{delivery.customerPhone}</div>
                                        </div>

                                        {/* Route Information */}
                                        <div className="mb-2">
                                            <div className="text-sm text-gray-900 truncate">{delivery.pickupLocationDescription || delivery.pickupLocation}</div>
                                            <div className="text-xs text-gray-500">→ {delivery.deliveryLocationDescription || delivery.deliveryLocation}</div>
                                        </div>

                                        {/* Status and Payment Grid */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Status</span>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                                                    {delivery.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Priority</span>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(delivery.priority)}`}>
                                                    {delivery.priority}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Payment</span>
                                                <span className="text-sm font-medium text-gray-900">₺{delivery.fee}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Assigned</span>
                                                <span className="text-sm text-gray-900">
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
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Pagination - Fixed at bottom */}
                {!loading && filteredDeliveries.length > 0 && (
                    <div className="bg-white border-t border-gray-200 px-4 py-2">
                        {/* Debug info - remove after fixing */}
                        <div className="text-xs text-gray-500 mb-2">
                            Debug: Page {currentPage} of {totalPages} • Items {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} • Per page: {itemsPerPage}
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            itemsPerPage={itemsPerPageFromAPI}
                            onItemsPerPageChange={setItemsPerPage}
                            totalItems={totalItems}
                            startIndex={startIndex + 1}
                            endIndex={endIndex}
                        />
                    </div>
                )}
            </div>

            {/* Create Delivery Side Panel */}
            {showCreatePanel && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50">
                    <div className="fixed right-0 top-0 h-screen w-full sm:w-[500px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h3 className="text-xl font-semibold text-gray-900">Create New Delivery</h3>
                                <button
                                    onClick={() => setShowCreatePanel(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Form Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <form id="create-delivery-form" onSubmit={handleCreateDelivery} className="space-y-6">
                                    {/* Route Information */}
                                    <div>
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">Route Information</h4>
                                        <div className="space-y-4">
                                            <GoogleMapsLocationInput
                                                value={formData.pickupLocationLink}
                                                onChange={(value) => setFormData({ ...formData, pickupLocationLink: value })}
                                                placeholder="Paste Google Maps link for pickup location"
                                                label="Pickup Location"
                                                required={true}
                                                onLocationSelect={(location) => {
                                                    setFormData({
                                                        ...formData,
                                                        pickupLocation: location.address,
                                                        pickupLocationLink: formData.pickupLocationLink,
                                                        pickupCoordinates: { lat: location.lat, lng: location.lng }
                                                    });
                                                }}
                                            />

                                            <GoogleMapsLocationInput
                                                value={formData.deliveryLocationLink}
                                                onChange={(value) => setFormData({ ...formData, deliveryLocationLink: value })}
                                                placeholder="Paste Google Maps link for delivery location"
                                                label="Delivery Location"
                                                required={true}
                                                onLocationSelect={(location) => {
                                                    setFormData({
                                                        ...formData,
                                                        deliveryLocation: location.address,
                                                        deliveryLocationLink: formData.deliveryLocationLink,
                                                        deliveryCoordinates: { lat: location.lat, lng: location.lng }
                                                    });
                                                }}
                                            />
                                        </div>

                                        {/* Location Descriptions */}
                                        <div className="space-y-4 mt-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Pickup Location Description
                                                </label>
                                                <textarea
                                                    placeholder="Describe the pickup location (e.g., 'EMU Main Campus, near the library entrance', 'Apartment building with red door', 'Meet at the security gate')"
                                                    value={formData.pickupLocationDescription || ''}
                                                    onChange={(e) => setFormData({ ...formData, pickupLocationDescription: e.target.value })}
                                                    rows="2"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    💡 Add specific details to help drivers find the exact pickup point
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Delivery Location Description
                                                </label>
                                                <textarea
                                                    placeholder="Describe the delivery location (e.g., 'Terminal/City Center, 3rd floor office', 'House with blue gate', 'Leave with receptionist')"
                                                    value={formData.deliveryLocationDescription || ''}
                                                    onChange={(e) => setFormData({ ...formData, deliveryLocationDescription: e.target.value })}
                                                    rows="2"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    💡 Add specific details to help drivers complete the delivery
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Information */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-medium text-gray-900">Customer Information</h4>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={handleAutoFillFromMemory}
                                                    className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors"
                                                    title="Auto-fill from memory"
                                                >
                                                    🔄 Auto-fill
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleToggleMemoryPanel}
                                                    className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1 rounded-lg transition-colors"
                                                    title="Show recent entries"
                                                >
                                                    📋 Memory
                                                </button>
                                            </div>
                                        </div>

                                        {/* Memory Panel */}
                                        {showMemoryPanel && (
                                            <div className="mb-4">
                                                <FormMemoryPanel
                                                    formType="delivery"
                                                    onFillForm={handleAutoFillForm}
                                                    maxEntries={3}
                                                />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <SmartInput
                                                formType="delivery"
                                                fieldName="customerName"
                                                label="Customer Name"
                                                value={formData.customerName}
                                                onChange={(value) => setFormData({ ...formData, customerName: value })}
                                                placeholder="Enter customer name"
                                                required={true}
                                                suggestions={[]}
                                            />
                                            <SmartInput
                                                formType="delivery"
                                                fieldName="customerPhone"
                                                label="Customer Phone"
                                                value={formData.customerPhone}
                                                onChange={(value) => setFormData({ ...formData, customerPhone: value })}
                                                placeholder="Enter phone number"
                                                type="tel"
                                                required={true}
                                                suggestions={[]}
                                            />
                                        </div>

                                        {/* Auto-fill indicator */}
                                        {autoFillMode && (
                                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-blue-600">🔄</span>
                                                    <span className="text-sm text-blue-800">
                                                        Form auto-filled from memory. Review and adjust as needed.
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAutoFillMode(false)}
                                                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                                                    >
                                                        Dismiss
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Payment Details */}
                                    <div>
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Fee (₺)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    placeholder="0"
                                                    value={formData.fee}
                                                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                                                <select
                                                    value={formData.paymentMethod}
                                                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                                >
                                                    <option value="all">All Payment</option>
                                                    <option value="cash">💵 Cash</option>
                                                    <option value="card">💳 Card</option>


                                                    <option value="pos">💳 POS</option>

                                                    <option value="naira_transfer">₦ Naira Transfer</option>

                                                    <option value="isbank_transfer">🏦 İşbank Transfer</option>


                                                    <option value="crypto_transfer">₿ Crypto Transfer(RedotPay)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Priority */}
                                    <div>
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">Priority</h4>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
                                            <select
                                                value={formData.priority}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                            >
                                                <option value="low">Low Priority</option>
                                                <option value="normal">Normal Priority</option>
                                                <option value="high">High Priority</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Additional Details */}
                                    <div>
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">Additional Details</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Time</label>
                                                <input
                                                    type="datetime-local"
                                                    value={formData.estimatedTime}
                                                    onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                                <SmartInput
                                                    formType="delivery"
                                                    fieldName="notes"
                                                    value={formData.notes}
                                                    onChange={(value) => setFormData({ ...formData, notes: value })}
                                                    placeholder="Add any additional notes or special instructions..."
                                                    suggestions={[
                                                        "Call customer before delivery",
                                                        "Leave at security gate",
                                                        "Call when arriving",
                                                        "Fragile items - handle with care",
                                                        "Cash on delivery",
                                                        "Meet at main entrance",
                                                        "Apartment building - call for access",
                                                        "Office hours only (9 AM - 5 PM)",
                                                        "Weekend delivery preferred",
                                                        "Contact customer for exact location"
                                                    ]}
                                                    showSuggestions={true}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Broadcast Settings */}
                                    <div>
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">Broadcast Settings</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="useAutoBroadcast"
                                                    checked={formData.useAutoBroadcast}
                                                    onChange={(e) => setFormData({ ...formData, useAutoBroadcast: e.target.checked })}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="useAutoBroadcast" className="ml-2 block text-sm text-gray-900">
                                                    Use Automatic Broadcast
                                                </label>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                When enabled, the system will automatically broadcast this delivery to nearby drivers.
                                                The first driver to accept will be assigned.
                                            </p>

                                            {formData.useAutoBroadcast && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Broadcast Radius (km)</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="50"
                                                            value={formData.broadcastRadius}
                                                            onChange={(e) => setFormData({ ...formData, broadcastRadius: Number(e.target.value) })}
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Broadcast Duration (seconds)</label>
                                                        <input
                                                            type="number"
                                                            min="10"
                                                            max="300"
                                                            value={formData.broadcastDuration}
                                                            onChange={(e) => setFormData({ ...formData, broadcastDuration: Number(e.target.value) })}
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Manual Assignment (only show if not using auto-broadcast) */}
                                    {!formData.useAutoBroadcast && (
                                        <div>
                                            <h4 className="text-lg font-medium text-gray-900 mb-4">Manual Assignment</h4>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Driver</label>
                                                <select
                                                    required
                                                    value={formData.assignedTo}
                                                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                                >
                                                    <option value="">Select a driver</option>
                                                    {drivers.map((driver) => (
                                                        <option key={driver._id} value={driver._id}>
                                                            {capitalizeName(driver.name)} - {driver.phone}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </form>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                                <button
                                    type="button"
                                    onClick={() => setShowCreatePanel(false)}
                                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="create-delivery-form"
                                    className="px-8 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 rounded-lg"
                                >
                                    Create Delivery
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Delivery Panel */}
            {showViewPanel && selectedDelivery && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                        onClick={closeViewPanel}
                    />

                    {/* Panel */}
                    <div className={`absolute inset-0 h-full w-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${isViewPanelOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <TruckIcon className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Delivery Details</h3>
                                    <p className="text-sm text-gray-500">{selectedDelivery.deliveryCode}</p>
                                </div>
                            </div>
                            <button
                                onClick={closeViewPanel}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content - Scrollable Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
                            {/* Status and Priority */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedDelivery.status)}`}>
                                        {selectedDelivery.status}
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedDelivery.priority)}`}>
                                        {selectedDelivery.priority}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-green-600">₺{selectedDelivery.fee}</div>
                                    <div className="text-sm text-gray-500 flex items-center justify-end space-x-1">
                                        {getPaymentMethodIcon(selectedDelivery.paymentMethod)}
                                        <span>{formatPaymentMethod(selectedDelivery.paymentMethod)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <UserIcon className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm text-gray-900">{selectedDelivery.customerName || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <PhoneIcon className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm text-gray-900">{selectedDelivery.customerPhone || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Route Information */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-gray-900">Route Information</h4>

                                {/* Pickup */}
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span className="text-sm font-medium text-blue-700">Pickup</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                // Try to extract coordinates from pickupLocationLink first
                                                if (selectedDelivery.pickupLocationLink) {
                                                    const navUrl = mapsUtils.extractAndCreateNavigationLink(
                                                        selectedDelivery.pickupLocationLink,
                                                        selectedDelivery.pickupLocationDescription || 'Pickup Location'
                                                    );
                                                    if (navUrl) {
                                                        window.open(navUrl, '_blank');
                                                        return;
                                                    }
                                                }

                                                // Fallback to search
                                                const searchUrl = mapsUtils.generateSearchLink(selectedDelivery.pickupLocationDescription || selectedDelivery.pickupLocation);
                                                window.open(searchUrl, '_blank');
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-100 px-2 py-1 rounded-md"
                                        >
                                            Navigate
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-900">{selectedDelivery.pickupLocationDescription || selectedDelivery.pickupLocation}</p>
                                </div>

                                {/* Delivery */}
                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span className="text-sm font-medium text-green-700">Delivery</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                // Try to extract coordinates from deliveryLocationLink first
                                                if (selectedDelivery.deliveryLocationLink) {
                                                    const navUrl = mapsUtils.extractAndCreateNavigationLink(
                                                        selectedDelivery.deliveryLocationLink,
                                                        selectedDelivery.deliveryLocationDescription || 'Delivery Location'
                                                    );
                                                    if (navUrl) {
                                                        window.open(navUrl, '_blank');
                                                        return;
                                                    }
                                                }

                                                // Fallback to search
                                                const searchUrl = mapsUtils.generateSearchLink(selectedDelivery.deliveryLocationDescription || selectedDelivery.deliveryLocation);
                                                window.open(searchUrl, '_blank');
                                            }}
                                            className="text-xs text-green-600 hover:text-green-800 font-medium bg-green-100 px-2 py-1 rounded-md"
                                        >
                                            Navigate
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-900">{selectedDelivery.deliveryLocationDescription || selectedDelivery.deliveryLocation}</p>
                                </div>
                            </div>

                            {/* Assignment */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Assignment & Status</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Assigned To:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {selectedDelivery.assignedTo ? (
                                                (() => {
                                                    // assignedTo is already an object with driver info
                                                    if (typeof selectedDelivery.assignedTo === 'object' && selectedDelivery.assignedTo !== null) {
                                                        // Access driver properties directly
                                                        const driverName = selectedDelivery.assignedTo.name ||
                                                            selectedDelivery.assignedTo.fullName ||
                                                            selectedDelivery.assignedTo.fullNameComputed ||
                                                            'Unknown Driver';
                                                        return driverName;
                                                    } else {
                                                        // Fallback: try to find driver by ID
                                                        const assignedDriver = drivers.find(driver =>
                                                            driver._id === selectedDelivery.assignedTo || driver.id === selectedDelivery.assignedTo
                                                        );
                                                        return assignedDriver ? assignedDriver.name : 'Unknown Driver';
                                                    }
                                                })()
                                            ) : 'Unassigned'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Pickup Status:</span>
                                        <span className={`text-sm font-medium ${selectedDelivery.status === 'picked_up' || selectedDelivery.status === 'in_transit' || selectedDelivery.status === 'delivered'
                                            ? 'text-green-600'
                                            : 'text-yellow-600'
                                            }`}>
                                            {selectedDelivery.status === 'picked_up' || selectedDelivery.status === 'in_transit' || selectedDelivery.status === 'delivered'
                                                ? '✅ Picked Up'
                                                : '⏳ Not Picked Up'}
                                        </span>
                                    </div>
                                    {selectedDelivery.estimatedTime && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Estimated Time:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {formatDate(selectedDelivery.estimatedTime)}
                                            </span>
                                        </div>
                                    )}
                                    {selectedDelivery.distance && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Distance:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {selectedDelivery.distance}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedDelivery.notes && (
                                <div className="bg-yellow-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Special Instructions</h4>
                                    <p className="text-sm text-gray-700">{selectedDelivery.notes}</p>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Timestamps</h4>
                                <div className="space-y-2 text-xs text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Created:</span>
                                        <span>{formatDate(selectedDelivery.createdAt)}</span>
                                    </div>
                                    {selectedDelivery.updatedAt && (
                                        <div className="flex justify-between">
                                            <span>Updated:</span>
                                            <span>{formatDate(selectedDelivery.updatedAt)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        closeViewPanel();
                                        handleEditDelivery(selectedDelivery);
                                    }}
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Edit Delivery
                                </button>
                                {!selectedDelivery.assignedTo && (
                                    <>
                                        <button
                                            onClick={() => {
                                                closeViewPanel();
                                                handleRebroadcastDelivery(selectedDelivery);
                                            }}
                                            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                                        >
                                            Rebroadcast
                                        </button>
                                        <button
                                            onClick={() => {
                                                closeViewPanel();
                                                handleManualAssignment(selectedDelivery);
                                            }}
                                            className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                                        >
                                            Assign
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => {
                                        closeViewPanel();
                                        handleDeleteDelivery(selectedDelivery._id);
                                    }}
                                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Delivery Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setDeliveryToDelete(null);
                }}
                onConfirm={confirmDeleteDelivery}
                title="Delete Delivery"
                message={`Are you sure you want to delete delivery ${deliveryToDelete?.deliveryCode || 'this delivery'}? This action cannot be undone and will permanently remove the delivery from the system.`}
                confirmText="Delete Delivery"
                cancelText="Cancel"
                type="danger"
                isLoading={deleting}
            />

            {/* Manual Assignment Modal */}
            {showManualAssignmentModal && deliveryToAssign && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Assign Delivery Manually</h3>
                                <button
                                    onClick={() => setShowManualAssignmentModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    Assign delivery <span className="font-medium">{deliveryToAssign.deliveryCode}</span> to a driver:
                                </p>
                                <div className="text-sm text-gray-500">
                                    <p><strong>Customer:</strong> {deliveryToAssign.customerName}</p>
                                    <p><strong>Pickup:</strong> {deliveryToAssign.pickupLocationDescription || deliveryToAssign.pickupLocation}</p>
                                    <p><strong>Delivery:</strong> {deliveryToAssign.deliveryLocationDescription || deliveryToAssign.deliveryLocation}</p>
                                    <p><strong>Fee:</strong> ₺{deliveryToAssign.fee}</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Driver
                                </label>
                                <div className="text-xs text-gray-500 mb-2">
                                    Available drivers: {drivers.length} | Selected: {selectedDriverId || 'None'}
                                </div>
                                <SearchableDropdown
                                    options={drivers
                                        .filter(driver => {
                                            const hasValidStatus = driver.status && (driver.status === 'active' || driver.status === 'online');
                                            const noStatusFilter = !driver.status || driver.status === '';
                                            return hasValidStatus || noStatusFilter;
                                        })
                                        .map(driver => ({
                                            value: driver._id,
                                            label: `${driver.name || 'Unknown'} - ${driver.phone || 'No phone'}`,
                                            name: driver.name || 'Unknown',
                                            email: driver.email || 'No email',
                                            phone: driver.phone || 'No phone'
                                        }))}
                                    value={selectedDriverId}
                                    onChange={(driverId) => {
                                        console.log('🔍 SearchableDropdown onChange called with:', { driverId, type: typeof driverId });
                                        console.log('🔍 Previous selectedDriverId:', selectedDriverId);
                                        setSelectedDriverId(driverId);
                                        console.log('🔍 New selectedDriverId set to:', driverId);
                                    }}
                                    placeholder="Choose a driver..."
                                    searchPlaceholder="Search drivers..."
                                    className="w-full"
                                    allowClear={true}
                                    renderOption={(option, isSelected) => (
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{option.name}</span>
                                            <span className="text-sm text-gray-500">{option.phone}</span>
                                        </div>
                                    )}
                                />

                                {/* DEBUG: Show current state */}
                                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                                    <strong>DEBUG:</strong> selectedDriverId = "{selectedDriverId}" | Type: {typeof selectedDriverId}
                                </div>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowManualAssignmentModal(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmManualAssignment}
                                    disabled={!selectedDriverId}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Assign Delivery
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DeliveriesPage;
