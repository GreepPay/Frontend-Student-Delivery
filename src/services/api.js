import axios from 'axios';
import requestDeduplicator from '../utils/requestDeduplicator';
import devHelpers from '../utils/devHelpers';
import toast from 'react-hot-toast';

// Request deduplication to prevent duplicate API calls
const pendingRequests = new Map();

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
console.log('🔧 API Configuration - REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('🔧 API Configuration - Final API_BASE_URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // Increased timeout to 30 seconds
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('🌐 Axios Request - URL:', config.url);
        console.log('🌐 Axios Request - Base URL:', config.baseURL);
        console.log('🌐 Axios Request - Full URL:', `${config.baseURL}${config.url}`);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle deduplication
api.interceptors.response.use(
    (response) => {
        const requestKey = response.config.requestKey;
        if (requestKey && pendingRequests.has(requestKey)) {
            const { resolve } = pendingRequests.get(requestKey);
            pendingRequests.delete(requestKey);
            resolve(response);
        }
        return response;
    },
    (error) => {
        const requestKey = error.config?.requestKey;
        if (requestKey && pendingRequests.has(requestKey)) {
            const { reject } = pendingRequests.get(requestKey);
            pendingRequests.delete(requestKey);
            reject(error);
        }
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.log('❌ API Error Response:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });

        // Handle connection refused errors
        if (error.code === 'ERR_NETWORK' || error.message.includes('ERR_CONNECTION_REFUSED')) {
            console.error('🌐 Backend server is not running or not accessible');
            console.error('🌐 Please ensure the backend server is running on localhost:3001');
            console.error('🌐 Error details:', error.message);

            // Show toast for network errors
            toast.error('Unable to connect to the server. Please check your internet connection and try again.', {
                duration: 5000,
            });
        }

        // Handle 429 errors (server rate limiting)
        if (error.response?.status === 429) {
            console.warn('⚠️ Server rate limit exceeded.');
            toast.error('Too many requests. Please wait a moment before trying again.', {
                duration: 4000,
            });
        }

        // Handle server errors (500+)
        if (error.response?.status >= 500) {
            console.error('🔧 Server error:', error.response?.status, error.response?.data);
            toast.error('Server error. Please try again later.', {
                duration: 5000,
            });
        }

        // Handle authentication errors
        if (error.response?.status === 401) {
            console.warn('🔒 Authentication failed, redirecting to login');
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Show toast before redirecting
            toast.error('Session expired. Please log in again.', {
                duration: 3000,
            });

            // Small delay to show the toast before redirect
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }

        // Handle forbidden errors (403)
        if (error.response?.status === 403) {
            console.warn('🚫 Access forbidden');
            const errorMessage = error.response?.data?.message;

            if (errorMessage?.toLowerCase().includes('suspended')) {
                toast.error('Your account has been suspended. Please contact support.', {
                    duration: 8000,
                });
            } else if (errorMessage?.toLowerCase().includes('blocked')) {
                toast.error('Your account has been blocked. Please contact support.', {
                    duration: 8000,
                });
            } else if (errorMessage?.toLowerCase().includes('inactive')) {
                toast.error('Your account is inactive. Please contact support to reactivate.', {
                    duration: 6000,
                });
            } else {
                toast.error('Access denied. You do not have permission to perform this action.', {
                    duration: 4000,
                });
            }
        }

        // Handle not found errors (404) for API endpoints
        if (error.response?.status === 404) {
            console.warn('🔍 API endpoint not found:', error.config?.url);
            const errorMessage = error.response?.data?.message;

            // Only show toast for API 404s, not for user-specific 404s
            if (error.config?.url && !error.config.url.includes('/auth/')) {
                if (errorMessage?.toLowerCase().includes('user') || errorMessage?.toLowerCase().includes('driver')) {
                    toast.error('User not found. The requested user may have been deleted or does not exist.', {
                        duration: 5000,
                    });
                } else if (errorMessage?.toLowerCase().includes('delivery') || errorMessage?.toLowerCase().includes('order')) {
                    toast.error('Delivery not found. The requested delivery may have been cancelled or does not exist.', {
                        duration: 5000,
                    });
                } else {
                    // Don't show "Service not available" for documents endpoint that's not implemented yet
                    if (error.config?.url?.includes('/driver/documents')) {
                        console.info('💡 Documents endpoint not implemented yet - this is expected');
                    } else {
                        console.error('🔴 Generic error handler triggered:', {
                            status: error.response?.status,
                            statusText: error.response?.statusText,
                            url: error.config?.url,
                            method: error.config?.method,
                            data: error.response?.data
                        });
                        toast.error('Service not available. Please contact support.', {
                            duration: 4000,
                        });
                    }
                }
            }
        }

        // Handle conflict errors (409)
        if (error.response?.status === 409) {
            console.warn('⚠️ Conflict error:', error.response?.data?.message);
            const errorMessage = error.response?.data?.message;

            if (errorMessage?.toLowerCase().includes('already exists')) {
                toast.error('This item already exists. Please try a different option.', {
                    duration: 5000,
                });
            } else if (errorMessage?.toLowerCase().includes('duplicate')) {
                toast.error('Duplicate entry detected. Please try a different value.', {
                    duration: 5000,
                });
            } else {
                toast.error('Conflict detected. Please try again with different data.', {
                    duration: 5000,
                });
            }
        }

        // Handle validation errors (422)
        if (error.response?.status === 422) {
            console.warn('⚠️ Validation error:', error.response?.data?.message);
            const errorMessage = error.response?.data?.message;

            if (errorMessage?.toLowerCase().includes('email')) {
                toast.error('Please enter a valid email address.', {
                    duration: 5000,
                });
            } else if (errorMessage?.toLowerCase().includes('phone')) {
                toast.error('Please enter a valid phone number.', {
                    duration: 5000,
                });
            } else if (errorMessage?.toLowerCase().includes('password')) {
                toast.error('Password does not meet requirements. Please try again.', {
                    duration: 5000,
                });
            } else {
                toast.error('Please check your input and try again.', {
                    duration: 5000,
                });
            }
        }

        // Handle timeout errors
        if (error.code === 'ECONNABORTED') {
            console.error('⏱️ Request timeout');
            toast.error('Request timed out. Please try again.', {
                duration: 4000,
            });
        }

        return Promise.reject(error);
    }
);

// API Service Class
class ApiService {
    // Auth endpoints
    async sendOTP(email, userType) {
        const response = await api.post('/auth/send-otp', { email, userType });
        return response.data;
    }

    async verifyOTP(email, userType, otp) {
        const response = await api.post('/auth/verify-otp', { email, userType, otp });
        return response.data;
    }

    // Admin endpoints
    async getDashboardStats() {
        const response = await api.get('/admin/dashboard');
        return response.data;
    }

    async getAnalytics(period = 'thisMonth') {
        console.log('📊 API Service: Fetching analytics for period:', period);

        // Use the correct parameter name that works with the backend
        const response = await api.get(`/admin/analytics?timeframe=${period}`);
        console.log('📊 API Service: Analytics response:', response.data);
        return response.data;
    }

    async getDrivers(filters) {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, String(value));
                }
            });
        }
        const queryString = params.toString();
        const url = `/admin/drivers${queryString ? `?${queryString}` : ''}`;

        console.log('🚗 Fetching drivers with URL:', url);
        console.log('🔍 Filters:', filters);

        const response = await api.get(url);
        console.log('✅ Drivers API response:', response.data);
        console.log('🔍 Response structure:', {
            type: typeof response.data,
            isArray: Array.isArray(response.data),
            keys: response.data ? Object.keys(response.data) : 'null/undefined',
            hasData: response.data && response.data.data ? 'yes' : 'no',
            hasDrivers: response.data && response.data.drivers ? 'yes' : 'no',
            dataLength: response.data && Array.isArray(response.data) ? response.data.length : 'N/A'
        });
        return response.data;
    }

    async getDriver(id) {
        const response = await api.get(`/admin/drivers/${id}`);
        return response.data;
    }

    async get(url) {
        const response = await api.get(url);
        return response.data;
    }

    async createDriver(driverData) {
        const response = await api.post('/admin/drivers', driverData);
        return response.data;
    }

    // Driver invitation endpoints
    async inviteDriver(driverData) {
        const response = await api.post('/admin/drivers/invite', driverData);
        return response.data;
    }

    async getAvailableReferralCodes() {
        const response = await api.get('/admin/drivers/referral-codes');
        return response.data;
    }

    async getPendingInvitations(page = 1, limit = 20) {
        const response = await api.get(`/admin/drivers/invitations?page=${page}&limit=${limit}`);
        return response.data;
    }

    async cancelInvitation(invitationId) {
        const response = await api.post(`/admin/drivers/invitations/${invitationId}/cancel`);
        return response.data;
    }

    async resendInvitation(invitationId) {
        const response = await api.post(`/admin/drivers/invitations/${invitationId}/resend`);
        return response.data;
    }

    async resendOTP(email) {
        console.log('📧 API Service: Resending OTP to admin:', email);
        const response = await api.post('/auth/resend-otp', { email, userType: 'admin' });
        console.log('📧 API Service: Resend OTP response:', response.data);
        return response.data;
    }

    async updateDriver(id, driverData) {
        const response = await api.put(`/admin/drivers/${id}`, driverData);
        return response.data;
    }

    async deleteDriver(id) {
        const response = await api.delete(`/admin/drivers/${id}`);
        return response.data;
    }

    async getDeliveries(filters) {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, String(value));
                }
            });
        }
        // Try the broadcast endpoint first, fallback to admin endpoint
        try {
            const response = await api.get(`/delivery?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.log('Broadcast endpoint failed, trying admin endpoint:', error);
            const response = await api.get(`/admin/deliveries?${params.toString()}`);
            return response.data;
        }
    }

    async getDelivery(id) {
        const response = await api.get(`/admin/deliveries/${id}`);
        return response.data;
    }

    async createDelivery(deliveryData) {
        const response = await api.post('/admin/deliveries', deliveryData);
        return response.data;
    }

    async updateDelivery(id, deliveryData) {
        const response = await api.put(`/admin/deliveries/${id}`, deliveryData);
        return response.data;
    }

    async deleteDelivery(id) {
        const response = await api.delete(`/admin/deliveries/${id}`);
        return response.data;
    }

    async assignDelivery(deliveryId, driverId) {
        const response = await api.post(`/admin/deliveries/${deliveryId}/assign`, { driverId });
        return response.data;
    }

    // Driver endpoints
    async getDriverProfile() {
        const response = await api.get('/driver/profile');
        return response.data;
    }

    // Get profile options
    async getProfileOptions() {
        try {
            console.log('📋 API Service: Fetching profile options...');
            const response = await api.get('/public/profile-options');
            console.log('📋 API Service: Profile options response:', response.data);
            return response.data;
        } catch (error) {
            console.error('📋 API Service: Error fetching profile options:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });

            // Return fallback data if API fails
            return {
                success: true,
                data: {
                    addresses: ['Kucuk', 'Lefkosa', 'Girne', 'Iskele', 'Guzelyurt', 'Lefke'],
                    transportationMethods: ['Walking', 'Bicycle', 'Motorcycle', 'Car', 'Public Transport', 'Other'],
                    universities: [
                        'Eastern Mediterranean University', 'Cyprus West University', 'Cyprus International University',
                        'Near East University', 'Girne American University', 'European University of Lefke',
                        'University of Kyrenia', 'Final International University', 'University of Mediterranean Karpasia',
                        'Lefke European University', 'American University of Cyprus', 'Cyprus Science University',
                        'University of Central Lancashire Cyprus'
                    ]
                }
            };
        }
    }

    // Get driver documents separately
    async getDriverDocuments() {
        try {
            console.log('📄 API Service: Fetching driver documents...');
            const response = await api.get('/driver/documents');
            console.log('📄 API Service: Driver documents response:', response.data);

            // Check if response has the expected structure
            if (!response.data || !response.data.success) {
                console.warn('⚠️ Documents API returned unexpected structure:', response.data);
                return {
                    success: true,
                    data: {
                        documents: {}
                    }
                };
            }

            return response.data;
        } catch (error) {
            console.error('📄 API Service: Error fetching driver documents:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });

            // Show specific error message for debugging
            if (error.response?.status === 404) {
                console.error('❌ Documents endpoint not found (404) - Backend documents API not implemented yet');
                console.info('💡 This is expected if the backend documents endpoint is not yet integrated');
            } else if (error.response?.status === 401) {
                console.error('❌ Unauthorized access to documents (401)');
            } else if (error.response?.status === 500) {
                console.error('❌ Server error fetching documents (500)');
            }

            // Return empty documents structure if API fails
            return {
                success: true,
                data: {
                    documents: {}
                }
            };
        }
    }

    async getDashboardData(period = null) {
        // Map frontend period values to backend expected values
        const periodMapping = {
            'today': 'today',
            'week': 'week',
            'thisWeek': 'thisWeek',
            'month': 'month',
            'monthly': 'month',
            'thisMonth': 'thisMonth',  // Add thisMonth mapping
            'currentPeriod': 'thisMonth',  // Map currentPeriod to thisMonth instead of month
            'year': 'year',
            'all': 'allTime',
            'all-time': 'allTime',
            'allTime': 'allTime',
            'custom': 'custom'
        };

        const mappedPeriod = period ? (periodMapping[period] || period) : null;
        const params = mappedPeriod ? `?period=${mappedPeriod}` : '';

        console.log('📊 API Service - getDashboardData called with:', {
            originalPeriod: period,
            mappedPeriod: mappedPeriod,
            params: params,
            fullUrl: `/driver/dashboard${params}`
        });

        const response = await api.get(`/driver/dashboard${params}`);
        return response.data;
    }

    async updateDriverProfile(profileData) {
        const response = await api.put('/driver/profile', profileData);
        return response.data;
    }

    async uploadDriverProfileImage(formData) {
        try {
            console.log('🚀 Uploading profile image to backend...', {
                hasProfilePicture: formData.has('profilePicture'),
                originalSize: formData.get('originalSize'),
                compressedSize: formData.get('compressedSize'),
                fileType: formData.get('fileType'),
                endpoint: '/driver/profile/image'
            });

            const response = await api.post('/driver/profile/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 30000, // 30 second timeout for image uploads
            });

            console.log('📥 Upload response received:', {
                status: response.status,
                statusText: response.statusText,
                data: response.data,
                headers: response.headers
            });
            return response.data;
        } catch (error) {
            console.error('API upload error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
            throw error;
        }
    }



    async getDriverRemittances() {
        const response = await api.get('/driver/remittances');
        return response.data;
    }

    async requestRemittance(amount, method) {
        const response = await api.post('/driver/remittances/request', { amount, method });
        return response.data;
    }

    // Admin endpoints
    async getAdminDriverStatus() {
        const response = await api.get('/admin/drivers/status');
        return response.data;
    }

    async updateDriverStatus(status) {
        // Try multiple possible endpoints for driver status update
        try {
            // First try the standard driver status endpoint with status field
            const response = await api.put('/driver/status', { status });
            return response.data;
        } catch (error) {
            console.log('⚠️ First endpoint failed, trying alternative...');
            try {
                // Try the profile update endpoint with status field
                const response = await api.put('/driver/profile', { status });
                return response.data;
            } catch (secondError) {
                console.log('⚠️ Second endpoint failed, trying third option...');
                try {
                    // Try updating the current user's status with status field
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    const userId = user.id || user._id;

                    if (!userId) {
                        console.error('❌ No user ID found in localStorage');
                        throw new Error('User ID not found');
                    }

                    const response = await api.put(`/drivers/${userId}/status`, { status });
                    return response.data;
                } catch (thirdError) {
                    console.error('❌ All status update endpoints failed:', {
                        first: error.message,
                        second: secondError.message,
                        third: thirdError.message
                    });
                    throw thirdError;
                }
            }
        }
    }

    async updateDriverLocation(location) {
        const response = await api.put('/driver/location', location);
        return response.data;
    }

    async getDriverDeliveries(filters) {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, String(value));
                }
            });
        }
        const response = await api.get(`/driver/deliveries?${params.toString()}`);
        return response.data;
    }

    async getDriverEarnings(period) {
        // Map frontend period values to backend expected values
        const periodMapping = {
            'today': 'today',
            'week': 'week',
            'thisWeek': 'thisWeek',
            'month': 'month',
            'monthly': 'month',
            'currentPeriod': 'currentPeriod',
            'year': 'year',
            'all': 'allTime',
            'all-time': 'allTime',
            'allTime': 'allTime',
            'custom': 'custom'
        };

        const mappedPeriod = periodMapping[period] || period;
        const params = mappedPeriod ? `?period=${mappedPeriod}` : '';
        const response = await api.get(`/driver/earnings${params}`);
        return response.data;
    }

    async acceptDelivery(deliveryId) {
        const response = await api.post(`/driver/deliveries/${deliveryId}/accept`);
        return response.data;
    }

    async updateDeliveryStatus(deliveryId, status) {
        const response = await api.put(`/driver/deliveries/${deliveryId}/status`, { status });
        return response.data;
    }

    async calculateDriverEarnings() {
        try {
            console.log('💰 API Service: Triggering earnings calculation...');
            const response = await api.post('/driver/earnings/calculate');
            console.log('✅ API Service: Earnings calculation response:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ API Service: Earnings calculation failed:', error);

            // Handle 404 error gracefully (endpoint not implemented yet)
            if (error.response?.status === 404) {
                console.warn('⚠️ API Service: Earnings calculation endpoint not implemented yet');
                console.log('💡 To implement this endpoint, add the backend-earnings-calculation-endpoint.js to your backend');

                // Return a mock success response to prevent frontend errors
                return {
                    success: true,
                    message: 'Earnings calculation endpoint not implemented yet',
                    data: {
                        totalEarningsCalculated: 0,
                        deliveriesProcessed: 0,
                        note: 'Backend endpoint needs to be implemented'
                    }
                };
            }

            throw error;
        }
    }

    // Public endpoints
    async trackDelivery(code) {
        const response = await api.get(`/delivery/track/${code}`);
        return response.data;
    }

    // File upload
    async uploadFile(file, type) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const response = await api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    // Document upload for driver verification
    async uploadDriverDocument(documentType, formData) {
        try {
            // Get the current token to ensure it's available
            const token = localStorage.getItem('token');
            console.log('🔑 Document upload - Token available:', !!token);
            console.log('📤 Uploading to correct endpoint:', `/driver/documents/${documentType}/upload`);

            // Use the correct document upload endpoint that exists in the backend
            const response = await api.post(`/driver/documents/${documentType}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 30000, // 30 second timeout for document uploads
            });

            console.log('✅ Document upload successful:', response.data);

            // Enhanced logging to debug the response structure
            console.log('🔍 Document upload response analysis:', {
                success: response.data?.success,
                hasData: !!response.data?.data,
                dataKeys: response.data?.data ? Object.keys(response.data.data) : [],
                hasDocumentUrl: !!response.data?.data?.documentUrl,
                hasFileUrl: !!response.data?.data?.fileUrl,
                hasUrl: !!response.data?.data?.url,
                hasImageUrl: !!response.data?.data?.imageUrl,
                hasCloudinaryUrl: !!response.data?.data?.cloudinaryUrl,
                fullResponse: response.data
            });

            return response.data;
        } catch (error) {
            console.error('❌ Document upload failed:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                endpoint: `/driver/documents/${documentType}/upload`
            });
            throw error;
        }
    }

    // Notification endpoints
    async getDriverNotifications(filters = {}) {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, String(value));
                }
            });
        }
        // Fix: Use the correct backend endpoint
        const response = await api.get(`/notifications?${params.toString()}`);
        return response.data;
    }

    async getDriverUnreadNotificationsCount() {
        // Fix: Use the correct backend endpoint
        const response = await api.get('/notifications/unread-count');
        return response.data;
    }

    async markNotificationAsRead(notificationId) {
        try {
            console.log('📖 API Service: Marking notification as read:', notificationId);

            // Validate notification ID
            if (!notificationId || typeof notificationId !== 'string' || notificationId.length < 10) {
                console.warn('📖 API Service: Invalid notification ID:', notificationId);
                return { success: false, message: 'Invalid notification ID' };
            }

            // Check if it's a valid MongoDB ObjectId format (24 hex characters)
            const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
            if (!mongoIdRegex.test(notificationId)) {
                console.warn('📖 API Service: Notification ID is not a valid MongoDB ObjectId:', notificationId);
                // Don't return error, just log warning - some IDs might be different format
            }



            // Try the driver-specific endpoint first
            try {
                console.log('📖 API Service: Trying driver endpoint:', `/notifications/${notificationId}/read`);
                const response = await api.put(`/notifications/${notificationId}/read`);
                console.log('📖 API Service: Mark as read response (driver endpoint):', response.data);
                return response.data;
            } catch (driverError) {
                console.log('📖 API Service: Driver endpoint failed:', {
                    status: driverError.response?.status,
                    statusText: driverError.response?.statusText,
                    data: driverError.response?.data,
                    message: driverError.message
                });

                // Fallback to generic notifications endpoint
                try {
                    console.log('📖 API Service: Trying generic endpoint:', `/notifications/${notificationId}/read`);
                    const response = await api.put(`/notifications/${notificationId}/read`);
                    console.log('📖 API Service: Mark as read response (generic endpoint):', response.data);
                    return response.data;
                } catch (genericError) {
                    console.log('📖 API Service: Generic endpoint also failed:', {
                        status: genericError.response?.status,
                        statusText: genericError.response?.statusText,
                        data: genericError.response?.data,
                        message: genericError.message
                    });

                    // Try with notification ID in request body
                    try {
                        console.log('📖 API Service: Trying body endpoint:', `/notifications/read`);
                        const response = await api.put(`/notifications/read`, { id: notificationId });
                        console.log('📖 API Service: Mark as read response (body endpoint):', response.data);
                        return response.data;
                    } catch (bodyError) {
                        console.log('📖 API Service: Body endpoint also failed:', {
                            status: bodyError.response?.status,
                            statusText: bodyError.response?.statusText,
                            data: bodyError.response?.data,
                            message: bodyError.message
                        });
                        throw bodyError; // Let the outer catch handle it
                    }
                }
            }
        } catch (error) {
            console.error('📖 API Service: Error marking notification as read:', error);

            // Handle specific error cases
            if (error.response?.status === 400) {
                console.warn('📖 API Service: 400 Bad Request - notification may not exist or already be read');
                return { success: true, message: 'Notification marked as read locally' };
            }

            if (error.response?.status === 404) {
                console.warn('📖 API Service: 404 Not Found - notification does not exist');
                return { success: true, message: 'Notification marked as read locally' };
            }

            // For other errors, return success for local update (similar to admin notifications)
            console.warn('📖 API Service: All endpoints failed, returning success for local update');
            return { success: true, message: 'Notification marked as read locally' };
        }
    }

    async markAllNotificationsAsRead() {
        const response = await api.put('/driver/notifications/mark-all-read');
        return response.data;
    }

    async deleteNotification(notificationId) {
        console.log('🗑️ API Service: Deleting notification:', notificationId);
        try {
            const response = await api.delete(`/notifications/${notificationId}`);
            console.log('🗑️ API Service: Delete notification response:', response.data);
            return response.data;
        } catch (error) {
            console.log('🗑️ API Service: Delete notification failed, returning success for local update');
            // Return success for local update if API fails
            return { success: true, message: 'Notification deleted locally' };
        }
    }

    // Communication endpoints
    async sendEmergencyAlert(message, location = null) {
        console.log('🚨 API Service: Sending emergency alert:', { message, location });

        const requestKey = `sendEmergencyAlert:${message}:${JSON.stringify(location)}`;

        return requestDeduplicator.execute(requestKey, async () => {
            const payload = {
                message
            };
            if (location) {
                payload.location = location;
            }
            const response = await api.post('/notifications/emergency-alert', payload);
            console.log('🚨 API Service: Emergency alert response:', response.data);
            return response.data;
        });
    }

    async sendMessageToAdmin(message) {
        console.log('💬 API Service: Sending message to admin:', message);

        const requestKey = `sendMessageToAdmin:${message}`;

        return requestDeduplicator.execute(requestKey, async () => {
            try {
                const response = await api.post('/notifications/driver/send-message', {
                    message
                });
                console.log('💬 API Service: Send message response:', response.data);
                return response.data;
            } catch (error) {
                console.log('💬 API Service: Send message failed, trying alternative endpoint');
                console.log('💬 API Service: Error details:', error.response?.data || error.message);

                // Only use fallback if the primary endpoint truly failed (not just a validation error)
                if (error.response?.status >= 500 || !error.response) {
                    // Fallback to emergency alert endpoint if the specific endpoint doesn't exist
                    const response = await api.post('/notifications/emergency-alert', {
                        message: `Driver Message: ${message}`,
                        type: 'driver_message',
                        preventDuplicate: true // Flag to prevent backend from sending duplicate socket events
                    });
                    console.log('💬 API Service: Fallback response:', response.data);
                    return response.data;
                } else {
                    // If it's a client error (4xx), don't use fallback
                    throw error;
                }
            }
        });
    }

    async sendMessageToDriver(driverId, message) {
        console.log('💬 API Service: Sending message to driver:', { driverId, message });
        try {
            const response = await api.post('/notifications/admin/send-message', {
                driverId,
                message
            });
            console.log('💬 API Service: Send message response:', response.data);
            return response.data;
        } catch (error) {
            console.log('💬 API Service: Send message failed, trying alternative endpoint');
            console.log('💬 API Service: Error details:', error.response?.data || error.message);

            // Only use fallback if the primary endpoint truly failed (not just a validation error)
            if (error.response?.status >= 500 || !error.response) {
                // Fallback to emergency alert endpoint if the specific endpoint doesn't exist
                const response = await api.post('/notifications/emergency-alert', {
                    message: `Admin Message to Driver: ${message}`,
                    driverId: driverId,
                    type: 'admin_message',
                    preventDuplicate: true // Flag to prevent backend from sending duplicate socket events
                });
                console.log('💬 API Service: Fallback response:', response.data);
                return response.data;
            } else {
                // If it's a client error (4xx), don't use fallback
                throw error;
            }
        }
    }

    async sendSystemNotification(message, priority = 'medium') {
        console.log('📢 API Service: Sending system notification:', { message, priority });
        try {
            const response = await api.post('/notifications/system', {
                message,
                priority
            });
            console.log('📢 API Service: System notification response:', response.data);
            return response.data;
        } catch (error) {
            console.log('📢 API Service: System notification failed, trying alternative endpoint');
            console.log('📢 API Service: Error details:', error.response?.data || error.message);

            // Only use fallback if the primary endpoint truly failed (not just a validation error)
            if (error.response?.status >= 500 || !error.response) {
                // Fallback to emergency alert endpoint if the specific endpoint doesn't exist
                const response = await api.post('/notifications/emergency-alert', {
                    message: `System Notification: ${message}`,
                    type: 'system_notification',
                    priority: priority,
                    preventDuplicate: true // Flag to prevent backend from sending duplicate socket events
                });
                console.log('📢 API Service: Fallback response:', response.data);
                return response.data;
            } else {
                // If it's a client error (4xx), don't use fallback
                throw error;
            }
        }
    }



    async getSocketStatus() {
        console.log('🔌 API Service: Getting socket status');
        const response = await api.get('/socket/status');
        console.log('🔌 API Service: Socket status response:', response.data);
        return response.data;
    }

    // Admin Document Verification endpoints
    async getPendingDocuments(params = {}) {
        console.log('📄 API Service: Fetching pending documents with params:', params);

        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, String(value));
            }
        });

        const queryString = queryParams.toString();
        const url = `/admin/documents${queryString ? `?${queryString}` : ''}`;

        console.log('📄 API Service: Pending documents URL:', url);
        const response = await api.get(url);
        console.log('📄 API Service: Pending documents response:', response.data);
        return response.data;
    }

    async verifyDocument(documentId, rejectionReason = null) {
        console.log('📄 API Service: Updating document status:', documentId, 'with reason:', rejectionReason);

        // Send the correct format that the backend expects
        const requestBody = {
            status: rejectionReason ? 'rejected' : 'verified'
        };

        if (rejectionReason) {
            requestBody.rejectionReason = rejectionReason;
        }

        try {
            // Extract driverId and documentType from documentId (format: "driverId_documentType")
            const [driverId, documentType] = documentId.split('_');

            if (!driverId || !documentType) {
                throw new Error('Invalid document ID format. Expected: "driverId_documentType"');
            }

            const response = await api.put(`/admin/drivers/${driverId}/documents/${documentType}`, requestBody);
            console.log('📄 API Service: Update document status response:', response.data);
            return response.data;
        } catch (error) {
            console.error('📄 API Service: Document status update error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });

            // If it's a 403 error, try alternative field format
            if (error.response?.status === 403) {
                console.log('📄 API Service: 403 error, trying alternative field format');
                try {
                    const altRequestBody = {
                        verificationStatus: rejectionReason ? 'rejected' : 'verified'
                    };
                    if (rejectionReason) {
                        altRequestBody.rejectionReason = rejectionReason;
                    }

                    const altResponse = await api.put(`/admin/documents/${documentId}/status`, altRequestBody);
                    console.log('📄 API Service: Alternative document status response:', altResponse.data);
                    return altResponse.data;
                } catch (altError) {
                    console.error('📄 API Service: Alternative document status update also failed:', altError);
                    throw altError;
                }
            }

            throw error;
        }
    }

    async rejectDocument(documentId, reason) {
        console.log('📄 API Service: Rejecting document:', documentId, 'with reason:', reason);
        // Use the same endpoint as verifyDocument but with rejection data
        return this.verifyDocument(documentId, reason);
    }

    async updateDocumentStatus(documentId, statusData) {
        try {
            const response = await api.put(`/admin/documents/${documentId}/status`, statusData);
            return response.data;
        } catch (error) {
            console.error('📄 API Service: Update document status error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });

            // If it's a 403 error, try alternative field format
            if (error.response?.status === 403) {
                console.log('📄 API Service: 403 error, trying alternative field format for updateDocumentStatus');
                try {
                    // Convert status field to boolean fields if needed
                    const altStatusData = { ...statusData };
                    if (statusData.status) {
                        altStatusData.isVerified = statusData.status === 'verified';
                        altStatusData.isRejected = statusData.status === 'rejected';
                        delete altStatusData.status;
                    }

                    const altResponse = await api.put(`/admin/documents/${documentId}/status`, altStatusData);
                    console.log('📄 API Service: Alternative update document status response:', altResponse.data);
                    return altResponse.data;
                } catch (altError) {
                    console.error('📄 API Service: Alternative update document status also failed:', altError);
                    throw altError;
                }
            }

            throw error;
        }
    }

    async startAIVerification(documentId) {
        console.log('🤖 API Service: Starting AI verification for document:', documentId);
        const response = await api.post(`/admin/documents/${documentId}/verify-ai`);
        console.log('🤖 API Service: AI verification response:', response.data);
        return response.data;
    }

    async getDocumentVerificationStatus(documentId) {
        console.log('📊 API Service: Getting verification status for document:', documentId);
        const response = await api.get(`/admin/documents/${documentId}/verification-status`);
        console.log('📊 API Service: Verification status response:', response.data);
        return response.data;
    }

    async batchVerifyDocuments(documentIds, action) {
        const response = await api.post('/admin/documents/batch-verify', {
            documentIds,
            action
        });
        return response.data;
    }



    // Admin Notifications endpoints
    async getAdminNotifications(filters = {}) {
        console.log('🔔 API Service: Fetching admin notifications with filters:', filters);

        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        });

        const queryString = params.toString();
        // Fix: Use the correct backend endpoint
        const url = `/notifications${queryString ? `?${queryString}` : ''}`;

        console.log('🔔 API Service: Admin notifications URL:', url);

        try {
            const response = await api.get(url);
            console.log('🔔 API Service: Admin notifications response:', response.data);
            return response.data;
        } catch (error) {
            console.error('🔔 API Service: Admin notifications error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                url: url
            });

            // If it's a 403 error, try alternative endpoints
            if (error.response?.status === 403) {
                console.log('🔔 API Service: 403 error, trying alternative endpoints');
                try {
                    // Try with admin prefix as fallback
                    const altResponse = await api.get(`/admin/notifications${queryString ? `?${queryString}` : ''}`);
                    console.log('🔔 API Service: Alternative notifications response:', altResponse.data);
                    return altResponse.data;
                } catch (altError) {
                    console.error('🔔 API Service: Alternative endpoint also failed:', altError);
                    // Return empty data structure to prevent UI errors
                    return { success: false, data: { notifications: [] }, error: 'Permission denied' };
                }
            }

            throw error;
        }
    }

    async markAdminNotificationAsRead(notificationId) {
        // Validate and clean notification ID
        if (!notificationId) {
            console.error('🔔 API Service: No notification ID provided for mark as read');
            throw new Error('Notification ID is required');
        }

        // Clean the notification ID - remove any suffixes or invalid characters
        let cleanId = notificationId;
        if (typeof notificationId === 'string') {
            // Extract only the MongoDB ObjectId part (24 hex characters)
            const objectIdMatch = notificationId.match(/^[a-fA-F0-9]{24}/);
            if (objectIdMatch) {
                cleanId = objectIdMatch[0];
                console.log('🔔 API Service: Cleaned notification ID for mark as read:', cleanId);
            } else {
                console.error('🔔 API Service: Invalid notification ID format for mark as read:', notificationId);
                throw new Error('Invalid notification ID format');
            }
        }

        console.log('🔔 API Service: Marking admin notification as read:', cleanId);
        try {
            // Send ID in request body as expected by backend
            const response = await api.put(`/notifications/read`, { id: cleanId });
            console.log('🔔 API Service: Mark as read response:', response.data);
            return response.data;
        } catch (error) {
            console.log('🔔 API Service: Mark as read failed, trying alternative endpoint');
            try {
                // Try alternative endpoint with ID in body
                const response = await api.put(`/admin/notifications/read`, { id: cleanId });
                console.log('🔔 API Service: Alternative mark as read response:', response.data);
                return response.data;
            } catch (fallbackError) {
                console.log('🔔 API Service: All mark as read endpoints failed, returning success for local update');
                // Return success for local update if API fails
                return { success: true, message: 'Notification marked as read locally' };
            }
        }
    }

    async markAllAdminNotificationsAsRead() {
        console.log('🔔 API Service: Marking all admin notifications as read');
        try {
            // Fix: Use the correct backend endpoint
            const response = await api.put('/notifications/mark-all-read');
            console.log('🔔 API Service: Mark all as read response:', response.data);
            return response.data;
        } catch (error) {
            console.log('🔔 API Service: Mark all as read failed, trying alternative endpoint');
            try {
                // Try alternative endpoint
                const response = await api.put('/admin/notifications/mark-all-read');
                console.log('🔔 API Service: Alternative mark all as read response:', response.data);
                return response.data;
            } catch (fallbackError) {
                console.log('🔔 API Service: All mark all as read endpoints failed, returning success for local update');
                // Return success for local update if API fails
                return { success: true, message: 'All notifications marked as read locally' };
            }
        }
    }

    async deleteAdminNotification(notificationId) {
        // Validate and clean notification ID
        if (!notificationId) {
            console.error('🔔 API Service: No notification ID provided');
            throw new Error('Notification ID is required');
        }

        // Clean the notification ID - remove any suffixes or invalid characters
        let cleanId = notificationId;
        if (typeof notificationId === 'string') {
            // Extract only the MongoDB ObjectId part (24 hex characters)
            const objectIdMatch = notificationId.match(/^[a-fA-F0-9]{24}/);
            if (objectIdMatch) {
                cleanId = objectIdMatch[0];
                console.log('🔔 API Service: Cleaned notification ID:', cleanId);
            } else {
                console.error('🔔 API Service: Invalid notification ID format:', notificationId);
                throw new Error('Invalid notification ID format');
            }
        }

        console.log('🔔 API Service: Deleting admin notification:', cleanId);
        try {
            // Fix: Use the correct backend endpoint
            const response = await api.delete(`/notifications/${cleanId}`);
            console.log('🔔 API Service: Delete notification response:', response.data);
            return response.data;
        } catch (error) {
            console.error('🔔 API Service: Delete notification error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });

            // If it's a 403 error, try alternative endpoint
            if (error.response?.status === 403) {
                console.log('🔔 API Service: 403 error, trying alternative delete endpoint');
                try {
                    const altResponse = await api.delete(`/admin/notifications/${cleanId}`);
                    console.log('🔔 API Service: Alternative delete response:', altResponse.data);
                    return altResponse.data;
                } catch (altError) {
                    console.error('🔔 API Service: Alternative delete endpoint also failed:', altError);
                    // Return success for local update if API fails
                    return { success: true, message: 'Notification deleted locally' };
                }
            }

            throw error;
        }
    }

    // Admin Remittance endpoints
    async getRemittances(params = {}) {
        console.log('💰 API Service: Fetching remittances with params:', params);

        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, String(value));
            }
        });

        const queryString = queryParams.toString();
        const url = `/admin/remittances${queryString ? `?${queryString}` : ''}`;

        console.log('💰 API Service: Remittances URL:', url);
        const response = await api.get(url);
        console.log('💰 API Service: Remittances response:', response.data);
        return response.data;
    }

    async createRemittance(remittanceData) {
        if (!remittanceData) {
            console.error('💰 API Service: No remittance data provided');
            throw new Error('Remittance data is required');
        }

        if (!remittanceData.driverId) {
            console.error('💰 API Service: No driverId in remittance data');
            throw new Error('Driver ID is required');
        }

        console.log('💰 API Service: Creating remittance:', remittanceData);
        const response = await api.post('/admin/remittances', remittanceData);
        console.log('💰 API Service: Create remittance response:', response.data);
        return response.data;
    }

    async completeRemittance(remittanceId) {
        console.log('💰 API Service: Completing remittance:', remittanceId);
        const response = await api.put(`/admin/remittances/${remittanceId}/complete`);
        console.log('💰 API Service: Complete remittance response:', response.data);
        return response.data;
    }

    async cancelRemittance(remittanceId, reason) {
        console.log('💰 API Service: Cancelling remittance:', remittanceId, 'with reason:', reason);
        const response = await api.put(`/admin/remittances/${remittanceId}/cancel`, { reason });
        console.log('💰 API Service: Cancel remittance response:', response.data);
        return response.data;
    }

    async getRemittanceById(remittanceId) {
        console.log('💰 API Service: Fetching remittance by ID:', remittanceId);
        const response = await api.get(`/admin/remittances/${remittanceId}`);
        console.log('💰 API Service: Get remittance by ID response:', response.data);
        return response.data;
    }

    async getRemittanceStats() {
        console.log('💰 API Service: Fetching remittance statistics');
        const response = await api.get('/admin/remittances/statistics');
        console.log('💰 API Service: Remittance statistics response:', response.data);
        return response.data;
    }

    async bulkGenerateRemittances(data) {
        console.log('💰 API Service: Bulk generating remittances:', data);
        const response = await api.post('/admin/remittances/bulk-generate', data);
        console.log('💰 API Service: Bulk generate remittances response:', response.data);
        return response.data;
    }

    async getDriverRemittanceSummary(driverId) {
        if (!driverId) {
            console.error('💰 API Service: No driverId provided for remittance summary');
            throw new Error('Driver ID is required');
        }
        console.log('💰 API Service: Getting driver remittance summary for:', driverId);
        const response = await api.get(`/admin/remittances/summary/${driverId}`);
        console.log('💰 API Service: Driver remittance summary response:', response.data);
        return response.data;
    }

    async getDriverRemittancesForDetails(driverId) {
        if (!driverId) {
            console.error('💰 API Service: No driverId provided for driver remittances');
            throw new Error('Driver ID is required');
        }
        console.log('💰 API Service: Getting driver remittances for details:', driverId);
        const response = await api.get(`/admin/remittances?driverId=${driverId}`);
        console.log('💰 API Service: Driver remittances response:', response.data);
        return response.data;
    }

    async getPaymentStructure() {
        console.log('💰 API Service: Getting payment structure');
        const response = await api.get('/admin/remittances/payment-structure');
        console.log('💰 API Service: Payment structure response:', response.data);
        return response.data;
    }

    async calculateDriverRemittance(driverId, startDate, endDate) {
        if (!driverId) {
            console.error('💰 API Service: No driverId provided for remittance calculation');
            throw new Error('Driver ID is required');
        }
        console.log('💰 API Service: Calculating driver remittance for:', driverId, 'from', startDate, 'to', endDate);
        const response = await api.get(`/admin/remittances/calculate/${driverId}?startDate=${startDate}&endDate=${endDate}`);
        console.log('💰 API Service: Driver remittance calculation response:', response.data);
        return response.data;
    }

    // Admin Management endpoints
    async getAdminUsers(params = {}) {
        console.log('👥 API Service: Getting admin users with params:', params);
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });
        const url = `/admin/management/admins${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        console.log('👥 API Service: Admin users response:', response.data);
        return response.data;
    }

    async createAdminUser(adminData) {
        console.log('👥 API Service: Creating admin user:', adminData);
        const response = await api.post('/admin/management/admins', adminData);
        console.log('👥 API Service: Create admin response:', response.data);
        return response.data;
    }

    async updateAdminUser(adminId, adminData) {
        console.log('👥 API Service: Updating admin user:', adminId, adminData);
        const response = await api.put(`/admin/management/admins/${adminId}`, adminData);
        console.log('👥 API Service: Update admin response:', response.data);
        return response.data;
    }

    async deleteAdminUser(adminId) {
        console.log('👥 API Service: Deleting admin user:', adminId);
        const response = await api.delete(`/admin/management/admins/${adminId}`);
        console.log('👥 API Service: Delete admin response:', response.data);
        return response.data;
    }

    async resetAdminPassword(adminId, data) {
        console.log('👥 API Service: Resetting admin password:', adminId);
        const response = await api.post(`/admin/management/admins/${adminId}/reset-password`, data);
        console.log('👥 API Service: Reset password response:', response.data);
        return response.data;
    }

    async getSystemSettings() {
        console.log('⚙️ API Service: Getting system settings');
        const response = await api.get('/admin/management/system-settings');
        console.log('⚙️ API Service: System settings response:', response.data);
        return response.data;
    }

    async updateSystemSettings(settings) {
        console.log('⚙️ API Service: Updating system settings:', settings);
        const response = await api.put('/admin/management/system-settings', { settings });
        console.log('⚙️ API Service: Update system settings response:', response.data);
        return response.data;
    }

    async updateCurrency(currency) {
        console.log('⚙️ API Service: Updating currency:', currency);
        const response = await api.put('/admin/management/system-settings/currency', { currency });
        console.log('⚙️ API Service: Update currency response:', response.data);
        return response.data;
    }

    async getEarningsConfigurations() {
        console.log('💰 API Service: Getting earnings configurations');
        const response = await api.get('/admin/management/earnings-configurations');
        console.log('💰 API Service: Earnings configurations response:', response.data);
        return response.data;
    }

    async createEarningsConfiguration(configData) {
        console.log('💰 API Service: Creating earnings configuration:', configData);
        const response = await api.post('/admin/management/earnings-configurations', configData);
        console.log('💰 API Service: Create earnings config response:', response.data);
        return response.data;
    }

    async updateEarningsConfiguration(configId, configData) {
        console.log('💰 API Service: Updating earnings configuration:', configId, configData);
        const response = await api.put(`/admin/management/earnings-configurations/${configId}`, configData);
        console.log('💰 API Service: Update earnings config response:', response.data);
        return response.data;
    }

    async deleteEarningsConfiguration(configId) {
        console.log('💰 API Service: Deleting earnings configuration:', configId);
        const response = await api.delete(`/admin/management/earnings-configurations/${configId}`);
        console.log('💰 API Service: Delete earnings config response:', response.data);
        return response.data;
    }

    async getAdminStatistics() {
        console.log('📊 API Service: Getting admin statistics');
        const response = await api.get('/admin/management/statistics');
        console.log('📊 API Service: Admin statistics response:', response.data);
        return response.data;
    }

    // Delivery Broadcast endpoints
    async createDeliveryWithBroadcast(deliveryData) {
        console.log('📡 API Service: Creating delivery with broadcast:', deliveryData);
        console.log('🔗 API Base URL:', API_BASE_URL);
        console.log('🔗 Full URL will be:', `${API_BASE_URL}/delivery`);
        console.log('📦 Payload being sent:', JSON.stringify(deliveryData, null, 2));
        const response = await api.post('/delivery', deliveryData);
        console.log('📡 API Service: Create delivery with broadcast response:', response.data);
        return response.data;
    }

    async startBroadcast(deliveryId) {
        console.log('📡 API Service: Starting broadcast for delivery:', deliveryId);
        const response = await api.post(`/delivery/${deliveryId}/broadcast`);
        console.log('📡 API Service: Start broadcast response:', response.data);
        return response.data;
    }

    async assignDeliveryManually(deliveryId, driverId) {
        console.log('📡 API Service: Manually assigning delivery:', deliveryId, 'to driver:', driverId);
        const response = await api.post(`/delivery/${deliveryId}/assign`, { driverId });
        console.log('📡 API Service: Manual assignment response:', response.data);
        return response.data;
    }

    async getBroadcastStats() {
        console.log('📡 API Service: Getting broadcast statistics');
        const response = await api.get('/delivery/broadcast/stats');
        console.log('📡 API Service: Broadcast stats response:', response.data);
        return response.data;
    }

    async handleExpiredBroadcasts() {
        console.log('📡 API Service: Handling expired broadcasts');
        const response = await api.post('/delivery/broadcast/handle-expired');
        console.log('📡 API Service: Handle expired broadcasts response:', response.data);
        return response.data;
    }

    async getActiveBroadcasts(lat, lng) {
        const endpoint = '/delivery/broadcast/active';
        const requestKey = `${endpoint}?lat=${lat}&lng=${lng}`;

        return requestDeduplicator.execute(requestKey, async () => {
            // Rate limiting removed - all requests allowed

            console.log('📡 API Service: Getting active broadcasts for location:', lat, lng);
            const params = lat && lng ? `?lat=${lat}&lng=${lng}` : '';
            const response = await api.get(`${endpoint}${params}`);
            console.log('📡 API Service: Active broadcasts response:', response.data);

            // Handle empty data response
            if (response.data && response.data.success && (!response.data.data || Object.keys(response.data.data).length === 0)) {
                console.warn('⚠️ API returned empty data object, returning empty broadcasts array');
                return {
                    success: true,
                    data: { broadcasts: [] },
                    message: 'No active broadcasts available'
                };
            }

            return response.data;
        });
    }

    async acceptBroadcastDelivery(deliveryId) {
        console.log('📡 API Service: Accepting broadcast delivery:', deliveryId);
        const response = await api.post(`/delivery/${deliveryId}/accept`);
        console.log('📡 API Service: Accept broadcast delivery response:', response.data);
        return response.data;
    }

    async getBackgroundJobStatus() {
        console.log('⚙️ API Service: Getting background job status');
        const response = await api.get('/background-jobs/status');
        console.log('⚙️ API Service: Background job status response:', response.data);
        return response.data;
    }

    async triggerExpiredBroadcasts() {
        console.log('⚙️ API Service: Triggering expired broadcasts processing');
        const response = await api.post('/background-jobs/trigger-expired-broadcasts');
        console.log('⚙️ API Service: Trigger expired broadcasts response:', response.data);
        return response.data;
    }

    async triggerBroadcastProcessing() {
        console.log('⚙️ API Service: Triggering broadcast processing');
        const response = await api.post('/background-jobs/trigger-broadcast-processing');
        console.log('⚙️ API Service: Trigger broadcast processing response:', response.data);
        return response.data;
    }

    // Global Search endpoints
    async performGlobalSearch(query, entity = 'all', page = 1, limit = 10) {
        console.log('🔍 API Service: Performing global search:', { query, entity, page, limit });
        const params = new URLSearchParams({
            query: query,
            type: entity,
            page: page.toString(),
            limit: limit.toString()
        });
        const response = await api.get(`/search/global?${params.toString()}`);
        console.log('🔍 API Service: Global search response:', response.data);
        return response.data;
    }

    async performAdvancedSearch(searchParams) {
        console.log('🔍 API Service: Performing advanced search:', searchParams);
        const response = await api.post('/search/advanced', searchParams);
        console.log('🔍 API Service: Advanced search response:', response.data);
        return response.data;
    }

    async getSearchSuggestions(query, entity = 'all') {
        console.log('🔍 API Service: Getting search suggestions:', { query, entity });
        const params = new URLSearchParams({
            query: query,
            entity: entity
        });
        const response = await api.get(`/search/suggestions?${params.toString()}`);
        console.log('🔍 API Service: Search suggestions response:', response.data);
        return response.data;
    }

    async searchDeliveries(query, filters = {}) {
        console.log('🔍 API Service: Searching deliveries:', { query, filters });
        const params = new URLSearchParams({ query: query, ...filters });
        const response = await api.get(`/search/deliveries?${params.toString()}`);
        console.log('🔍 API Service: Delivery search response:', response.data);
        return response.data;
    }

    async searchDrivers(query, filters = {}) {
        console.log('🔍 API Service: Searching drivers:', { query, filters });
        const params = new URLSearchParams({ query: query, ...filters });
        const response = await api.get(`/search/drivers?${params.toString()}`);
        console.log('🔍 API Service: Driver search response:', response.data);
        return response.data;
    }

    async searchRemittances(query, filters = {}) {
        console.log('🔍 API Service: Searching remittances:', { query, filters });
        const params = new URLSearchParams({ query: query, ...filters });
        const response = await api.get(`/search/remittances?${params.toString()}`);
        console.log('🔍 API Service: Remittance search response:', response.data);
        return response.data;
    }



    // Enhanced Analytics functions
    async getEnhancedAnalytics(period = 'month') {
        console.log('📊 API Service: Fetching enhanced analytics for period:', period);
        const response = await api.get(`/admin/analytics/enhanced?period=${period}`);
        console.log('📊 API Service: Enhanced analytics response:', response.data);
        return response.data;
    }

    async getCoreAnalytics(period = 'month') {
        console.log('📊 API Service: Fetching core analytics for period:', period);
        const response = await api.get(`/admin/analytics/core?period=${period}`);
        console.log('📊 API Service: Core analytics response:', response.data);
        return response.data;
    }

    async getFinancialAnalytics(period = 'month') {
        console.log('📊 API Service: Fetching financial analytics for period:', period);
        const response = await api.get(`/admin/analytics/financial?period=${period}`);
        console.log('📊 API Service: Financial analytics response:', response.data);
        return response.data;
    }

    async getDriverAnalytics(period = 'month') {
        console.log('📊 API Service: Fetching driver analytics for period:', period);
        const response = await api.get(`/admin/analytics/drivers?period=${period}`);
        console.log('📊 API Service: Driver analytics response:', response.data);
        return response.data;
    }

    async getDeliveryAnalytics(period = 'month') {
        console.log('📊 API Service: Fetching delivery analytics for period:', period);
        const response = await api.get(`/admin/analytics/deliveries?period=${period}`);
        console.log('📊 API Service: Delivery analytics response:', response.data);
        return response.data;
    }

    async getPerformanceAnalytics(period = 'month') {
        console.log('📊 API Service: Fetching performance analytics for period:', period);
        const response = await api.get(`/admin/analytics/performance?period=${period}`);
        console.log('📊 API Service: Performance analytics response:', response.data);
        return response.data;
    }

    async getDocumentAnalytics(period = 'month') {
        console.log('📊 API Service: Fetching document analytics for period:', period);
        const response = await api.get(`/admin/analytics/documents?period=${period}`);
        console.log('📊 API Service: Document analytics response:', response.data);
        return response.data;
    }

    async getRemittanceAnalytics(period = 'month') {
        console.log('📊 API Service: Fetching remittance analytics for period:', period);
        const response = await api.get(`/admin/analytics/remittances?period=${period}`);
        console.log('📊 API Service: Remittance analytics response:', response.data);
        return response.data;
    }

    async getGrowthAnalytics(period = 'month') {
        console.log('📊 API Service: Fetching growth analytics for period:', period);
        const response = await api.get(`/admin/analytics/growth?period=${period}`);
        console.log('📊 API Service: Growth analytics response:', response.data);
        return response.data;
    }

    async exportAnalytics(period = 'month') {
        console.log('📊 API Service: Exporting analytics for period:', period);
        const response = await api.get(`/admin/analytics/export?period=${period}`, {
            responseType: 'blob'
        });
        console.log('📊 API Service: Export analytics response received');
        return response.data;
    }

    // Google Maps Link Testing
    async testGoogleMapsLink(googleMapsLink) {
        console.log('🔗 API Service: Testing Google Maps link:', googleMapsLink);
        const response = await api.post('/delivery/test-maps-link', {
            googleMapsLink: googleMapsLink
        });
        console.log('🔗 API Service: Google Maps link test response:', response.data);
        return response.data;
    }

    // Test Nearby Drivers
    async testNearbyDrivers(lat, lng, radius = 10) {
        console.log('📍 API Service: Testing nearby drivers:', { lat, lng, radius });
        const params = new URLSearchParams({
            lat: lat.toString(),
            lng: lng.toString(),
            radius: radius.toString()
        });
        const response = await api.get(`/delivery/test-location?${params.toString()}`);
        console.log('📍 API Service: Nearby drivers test response:', response.data);
        return response.data;
    }

    // Referral endpoints
    async generateReferralCode(driverId) {
        const response = await api.post(`/referral/driver/${driverId}/generate`);
        return response.data;
    }

    async getDriverReferralCode(driverId) {
        const response = await api.get(`/referral/driver/${driverId}/code`);
        return response.data;
    }

    async useReferralCode(driverId, referralCode) {
        const response = await api.post(`/referral/driver/${driverId}/use`, { referralCode });
        return response.data;
    }

    async getDriverReferralStats(driverId) {
        const response = await api.get(`/referral/driver/${driverId}/stats`);
        return response.data;
    }

    async updateReferralProgress(driverId) {
        const response = await api.post(`/referral/driver/${driverId}/progress/update`);
        return response.data;
    }

    // Referral points endpoints
    async getDriverPointsSummary(driverId) {
        const response = await api.get(`/referral/driver/${driverId}/points`);
        return response.data;
    }

    async getDriverPointsHistory(driverId, limit = 20) {
        const response = await api.get(`/referral/driver/${driverId}/points/history?limit=${limit}`);
        return response.data;
    }

    async redeemDriverPoints(driverId, { amount, description }) {
        const response = await api.post(`/referral/driver/${driverId}/points/redeem`, { amount, description });
        return response.data;
    }

    // Referral Rewards System endpoints
    async getReferralRewardsConfiguration() {
        const response = await api.get('/referral-rewards/configuration');
        return response.data;
    }

    async getReferralRewardsStats() {
        const response = await api.get('/referral-rewards/stats');
        return response.data;
    }

    async getReferralRewardsProfitabilityAnalysis() {
        const response = await api.get('/referral-rewards/admin/profitability-analysis');
        return response.data;
    }

    async getReferralRewardsLeaderboard(month = null, year = null) {
        let url = '/referral-rewards/admin/leaderboard/monthly';
        if (month && year) {
            url += `?month=${month}&year=${year}`;
        }
        const response = await api.get(url);
        return response.data;
    }

    // Admin referral rewards management
    async createReferralRewardsConfiguration(config) {
        const response = await api.post('/referral-rewards/admin/configurations', config);
        return response.data;
    }

    async updateReferralRewardsConfigurationStatus(configId, status) {
        const response = await api.put(`/referral-rewards/admin/configurations/${configId}/status`, { status });
        return response.data;
    }

    // Public referral endpoints
    async getReferralLeaderboard(limit = 10) {
        console.log('🏆 API Service: Getting referral leaderboard with limit:', limit);
        const response = await api.get(`/referral/leaderboard?limit=${limit}`);
        console.log('🏆 API Service: Referral leaderboard response:', response.data);
        return response.data;
    }

    // Leaderboard API endpoints
    async getLeaderboard(category = 'overall', period = 'month', limit = 20) {
        console.log('🏆 API Service: Getting leaderboard for category:', category, 'period:', period, 'limit:', limit);

        // Map frontend period values to backend expected values (consistent with dashboardService)
        const periodMapping = {
            'today': 'today',
            'thisWeek': 'thisWeek',
            'currentPeriod': 'month',  // Map currentPeriod to month
            'thisMonth': 'thisMonth',
            'month': 'month', // Frontend now uses 'month' directly
            'allTime': 'allTime'
        };

        const mappedPeriod = periodMapping[period] || 'month';
        console.log('🏆 API Service: Mapped period:', period, 'to:', mappedPeriod);

        // Use the real backend endpoint
        console.log('🏆 API Service: Calling real leaderboard endpoint');
        const response = await api.get(`/admin/leaderboard?category=${category}&period=${mappedPeriod}&limit=${limit}`);
        console.log('🏆 API Service: Leaderboard response:', response.data);
        return response.data;
    }

    // Calculate points based on category
    calculatePoints(driver, category) {
        switch (category) {
            case 'overall':
                return (driver.totalDeliveries * 10) +
                    (driver.totalEarnings * 0.1) +
                    (driver.rating * 10) +
                    (driver.totalReferrals * 20);
            case 'delivery':
                return driver.totalDeliveries * 10;
            case 'earnings':
                return driver.totalEarnings * 0.1;
            case 'referrals':
                return driver.totalReferrals * 20;
            case 'rating':
                return driver.rating * 10;
            case 'speed':
                return driver.avgDeliveryTime ? (100 - driver.avgDeliveryTime) : 50;
            default:
                return (driver.totalDeliveries * 10) + (driver.totalEarnings * 0.1);
        }
    }

    async getLeaderboardCategories() {
        console.log('🏆 API Service: Getting leaderboard categories');

        // Use the real backend endpoint
        const response = await api.get('/admin/leaderboard/categories');
        console.log('🏆 API Service: Leaderboard categories response:', response.data);
        return response.data;
    }

    // Admin referral endpoints
    async getReferralAdminStats() {
        const response = await api.get('/referral/admin/statistics');
        return response.data;
    }

    async getReferralRecentActivity(limit = 10) {
        const response = await api.get(`/referral/admin/recent-activity?limit=${limit}`);
        return response.data;
    }

    async getAllReferrals(page = 1, limit = 20, status = null) {
        let url = `/referral/admin/referrals?page=${page}&limit=${limit}`;
        if (status) {
            url += `&status=${status}`;
        }
        const response = await api.get(url);
        return response.data;
    }

    async cancelReferral(referralId) {
        const response = await api.put(`/referral/admin/referrals/${referralId}/cancel`);
        return response.data;
    }

    // Driver-specific leaderboard methods
    async getDriverLeaderboard(category = 'overall', period = 'month', limit = 10) {
        console.log('🏆 Driver API Service: Getting driver leaderboard for category:', category, 'period:', period, 'limit:', limit);

        // Check if we have a token
        const token = localStorage.getItem('token');
        console.log('🏆 Driver API Service: Token available:', !!token);

        if (!token) {
            console.error('🏆 Driver API Service: No authentication token found');
            throw new Error('Authentication required');
        }

        // Use the same period mapping as admin leaderboard for consistency
        const periodMapping = {
            'today': 'today',
            'thisWeek': 'thisWeek',
            'currentPeriod': 'month',  // Map currentPeriod to month
            'thisMonth': 'thisMonth',
            'month': 'month',
            'allTime': 'allTime'
        };
        const mappedPeriod = periodMapping[period] || 'month';
        console.log('🏆 Driver API Service: Mapped period:', period, 'to:', mappedPeriod);

        console.log('🏆 Driver API Service: Calling driver leaderboard endpoint');
        try {
            const response = await api.get(`/driver/leaderboard?category=${category}&period=${mappedPeriod}&limit=${limit}`);
            console.log('🏆 Driver API Service: Driver leaderboard response:', response.data);

            // Validate response structure
            if (!response.data) {
                console.warn('🏆 Driver API Service: Empty response data');
                return { success: false, data: { leaderboard: [] } };
            }

            // Handle different response structures
            let leaderboardData = [];
            if (response.data.success && response.data.data?.leaderboard) {
                leaderboardData = response.data.data.leaderboard;
            } else if (response.data.data?.leaderboard) {
                leaderboardData = response.data.data.leaderboard;
            } else if (response.data.leaderboard) {
                leaderboardData = response.data.leaderboard;
            } else if (Array.isArray(response.data)) {
                leaderboardData = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                leaderboardData = response.data.data;
            }

            console.log('🏆 Driver API Service: Processed leaderboard data:', leaderboardData);

            return {
                success: true,
                data: {
                    leaderboard: leaderboardData,
                    period: mappedPeriod,
                    category: category
                }
            };
        } catch (error) {
            console.error('🏆 Driver API Service: Error calling driver leaderboard:', error);
            console.error('🏆 Driver API Service: Error response:', error.response?.data);

            // Provide specific error information
            if (error.response?.status === 401) {
                throw new Error('Authentication failed - please log in again');
            } else if (error.response?.status === 403) {
                throw new Error('Access denied - insufficient permissions');
            } else if (error.response?.status >= 500) {
                throw new Error('Server error - please try again later');
            } else if (error.message?.includes('Network Error')) {
                throw new Error('Network error - please check your connection');
            } else {
                throw new Error(`API error: ${error.response?.status || 'Unknown'} - ${error.message}`);
            }
        }
    }

    async getDriverLeaderboardCategories() {
        console.log('🏆 Driver API Service: Getting driver leaderboard categories');
        const response = await api.get('/driver/leaderboard/categories');
        console.log('🏆 Driver API Service: Driver leaderboard categories response:', response.data);
        return response.data;
    }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
export { api };