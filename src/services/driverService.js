import apiService, { api } from './api.js';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL;

// Driver Management Service
class DriverService {
    // Get all drivers with filters
    async getDrivers(filters = {}) {
        try {
            console.log('🚗 DriverService: Fetching drivers with filters:', filters);
            const response = await apiService.getDrivers(filters);
            console.log('🚗 DriverService: Raw API response:', response);
            console.log('🚗 DriverService: Response type:', typeof response);
            console.log('🚗 DriverService: Response keys:', Object.keys(response || {}));

            // Handle different response structures more robustly
            if (response && typeof response === 'object') {
                // Check if response has a drivers property
                if (response.drivers && Array.isArray(response.drivers)) {
                    console.log('🚗 DriverService: Found drivers in response.drivers:', response.drivers.length);
                    return response;
                }

                // Check if response has a data property with drivers
                if (response.data && response.data.drivers && Array.isArray(response.data.drivers)) {
                    console.log('🚗 DriverService: Found drivers in response.data.drivers:', response.data.drivers.length);
                    return response.data;
                }

                // Check if response has a data property that is an array
                if (response.data && Array.isArray(response.data)) {
                    console.log('🚗 DriverService: Found drivers in response.data array:', response.data.length);
                    return { drivers: response.data };
                }

                // Check if response is directly an array
                if (Array.isArray(response)) {
                    console.log('🚗 DriverService: Response is directly an array:', response.length);
                    return { drivers: response };
                }

                // Check if response has any array-like properties
                const arrayKeys = Object.keys(response).filter(key => Array.isArray(response[key]));
                if (arrayKeys.length > 0) {
                    console.log('🚗 DriverService: Found array properties:', arrayKeys);
                    // Use the first array property as drivers
                    const firstArray = response[arrayKeys[0]];
                    console.log('🚗 DriverService: Using first array as drivers:', firstArray.length);
                    return { drivers: firstArray };
                }

                // If response has other properties but no clear drivers array
                console.log('🚗 DriverService: No clear drivers array found, checking response structure:', response);
                console.log('🚗 DriverService: Response properties:', Object.keys(response));

                // Try to find any property that might contain driver data
                for (const [key, value] of Object.entries(response)) {
                    if (Array.isArray(value) && value.length > 0) {
                        console.log('🚗 DriverService: Found potential drivers in property:', key, value.length);
                        return { drivers: value };
                    }
                }

                console.log('🚗 DriverService: No drivers found in response, returning empty array');
                return { drivers: [] };
            }

            // Fallback for unexpected response types
            console.log('🚗 DriverService: Unexpected response type:', typeof response);
            return { drivers: [] };
        } catch (error) {
            console.error('❌ DriverService: Error fetching drivers:', error);
            // Return empty array structure on error
            return { drivers: [] };
        }
    }

    // Get single driver by ID
    async getDriver(driverId) {
        try {
            const response = await apiService.getDriver(driverId);
            return response;
        } catch (error) {
            console.error('Error fetching driver:', error);
            throw error;
        }
    }

    // Create new driver
    async createDriver(driverData) {
        try {
            const response = await apiService.createDriver(driverData);
            return response;
        } catch (error) {
            console.error('Error creating driver:', error);
            throw error;
        }
    }

    // Invite new driver (OTP-based)
    async inviteDriver(driverData) {
        try {
            const response = await apiService.inviteDriver(driverData);
            return response;
        } catch (error) {
            console.error('Error inviting driver:', error);
            throw error;
        }
    }

    // Get pending invitations
    async getPendingInvitations(page = 1, limit = 20) {
        try {
            const response = await apiService.getPendingInvitations(page, limit);
            return response;
        } catch (error) {
            console.error('Error fetching pending invitations:', error);
            throw error;
        }
    }

    // Cancel invitation
    async cancelInvitation(invitationId) {
        try {
            const response = await apiService.cancelInvitation(invitationId);
            return response;
        } catch (error) {
            console.error('Error canceling invitation:', error);
            throw error;
        }
    }

    // Resend invitation
    async resendInvitation(invitationId) {
        try {
            const response = await apiService.resendInvitation(invitationId);
            return response;
        } catch (error) {
            console.error('Error resending invitation:', error);
            throw error;
        }
    }

    // Update driver
    async updateDriver(driverId, driverData) {
        try {
            const response = await apiService.updateDriver(driverId, driverData);
            return response;
        } catch (error) {
            console.error('Error updating driver:', error);
            throw error;
        }
    }

    // Delete driver
    async deleteDriver(driverId) {
        try {
            const response = await apiService.deleteDriver(driverId);
            return response;
        } catch (error) {
            console.error('Error deleting driver:', error);
            throw error;
        }
    }

    // Suspend driver
    async suspendDriver(driverId, reason = '') {
        try {
            console.log('🚗 DriverService: Suspending driver:', driverId, 'with reason:', reason);
            const response = await api.post(`/admin/drivers/${driverId}/suspend`, { reason });
            console.log('✅ DriverService: Driver suspended successfully');
            return response.data;
        } catch (error) {
            console.error('❌ DriverService: Error suspending driver:', error);
            throw error;
        }
    }

    // Unsuspend driver
    async unsuspendDriver(driverId) {
        try {
            console.log('🚗 DriverService: Unsuspending driver:', driverId);
            const response = await api.post(`/admin/drivers/${driverId}/unsuspend`);
            console.log('✅ DriverService: Driver unsuspended successfully');
            return response.data;
        } catch (error) {
            console.error('❌ DriverService: Error unsuspending driver:', error);
            throw error;
        }
    }

    // Update driver verification status
    async updateDriverVerification(driverId, verificationData) {
        try {
            console.log('🚗 DriverService: Updating driver verification:', driverId, verificationData);
            const response = await api.put(`/admin/drivers/${driverId}/verification`, verificationData);
            console.log('✅ DriverService: Driver verification updated successfully');
            return response.data;
        } catch (error) {
            console.error('❌ DriverService: Error updating driver verification:', error);
            throw error;
        }
    }

    // Get driver status overview
    async getDriverStatus() {
        try {
            console.log('🚗 DriverService: Fetching driver status overview');
            const response = await api.get('/admin/drivers/status');
            console.log('✅ DriverService: Driver status fetched successfully');
            return response.data;
        } catch (error) {
            console.error('❌ DriverService: Error fetching driver status:', error);
            throw error;
        }
    }

    // Update driver documents
    async updateDriverDocuments(driverId, documentType, documentData) {
        try {
            console.log('🚗 DriverService: Updating driver documents:', driverId, documentType);
            const response = await api.put(`/admin/drivers/${driverId}/documents/${documentType}`, documentData);
            console.log('✅ DriverService: Driver documents updated successfully');
            return response.data;
        } catch (error) {
            console.error('❌ DriverService: Error updating driver documents:', error);
            throw error;
        }
    }

    // Get driver statistics
    async getDriverStatistics(driverId, period = 'allTime', customDateRange = null) {
        try {
            console.log('🚗 DriverService: Fetching driver statistics:', driverId, period);

            const params = new URLSearchParams();
            params.append('period', period);

            // Add custom date range if provided
            if (customDateRange && customDateRange.start && customDateRange.end) {
                params.append('startDate', customDateRange.start);
                params.append('endDate', customDateRange.end);
            }

            // Add driver ID if provided
            if (driverId) {
                params.append('driverId', driverId);
            }

            const queryString = params.toString();
            const url = `/admin/drivers/statistics${queryString ? `?${queryString}` : ''}`;

            const response = await api.get(url);
            console.log('✅ DriverService: Driver statistics fetched successfully');

            // Ensure consistent data structure
            const data = response.data || response;

            return {
                success: true,
                data: {
                    // Always include both all-time and filtered statistics
                    allTime: {
                        totalDeliveries: data.allTime?.totalDeliveries || 0,
                        completedDeliveries: data.allTime?.completedDeliveries || 0,
                        totalEarnings: data.allTime?.totalEarnings || 0,
                        averageRating: data.allTime?.averageRating || 0
                    },
                    filtered: {
                        totalDeliveries: data.filtered?.totalDeliveries || 0,
                        completedDeliveries: data.filtered?.completedDeliveries || 0,
                        totalEarnings: data.filtered?.totalEarnings || 0,
                        averageRating: data.filtered?.averageRating || 0
                    },
                    period: period,
                    dateRange: customDateRange,
                    calculationMethod: 'real-time-aggregation'
                }
            };
        } catch (error) {
            console.error('❌ DriverService: Error fetching driver statistics:', error);
            return {
                success: false,
                error: error.message,
                data: {
                    allTime: { totalDeliveries: 0, completedDeliveries: 0, totalEarnings: 0, averageRating: 0 },
                    filtered: { totalDeliveries: 0, completedDeliveries: 0, totalEarnings: 0, averageRating: 0 },
                    period: period,
                    dateRange: customDateRange,
                    calculationMethod: 'real-time-aggregation'
                }
            };
        }
    }

    // Get driver analytics with date range support
    async getDriverAnalytics(driverId, period = 'month') {
        try {
            console.log('🚗 DriverService: Fetching driver analytics:', driverId, period);
            const response = await api.get(`/admin/drivers/${driverId}/analytics?period=${period}`);
            console.log('✅ DriverService: Driver analytics fetched successfully');

            // Ensure consistent data structure
            const data = response.data || response;

            return {
                success: true,
                data: {
                    period: period,
                    statistics: {
                        totalDeliveries: data.totalDeliveries || 0,
                        completedDeliveries: data.completedDeliveries || 0,
                        totalEarnings: data.totalEarnings || 0,
                        averageRating: data.averageRating || 0,
                        onTimeDeliveries: data.onTimeDeliveries || 0,
                        lateDeliveries: data.lateDeliveries || 0
                    },
                    breakdown: data.breakdown || [],
                    calculationMethod: 'real-time-aggregation'
                }
            };
        } catch (error) {
            console.error('❌ DriverService: Error fetching driver analytics:', error);
            return {
                success: false,
                error: error.message,
                data: {
                    period: period,
                    statistics: {
                        totalDeliveries: 0,
                        completedDeliveries: 0,
                        totalEarnings: 0,
                        averageRating: 0,
                        onTimeDeliveries: 0,
                        lateDeliveries: 0
                    },
                    breakdown: [],
                    calculationMethod: 'real-time-aggregation'
                }
            };
        }
    }

    // Get driver deliveries
    async getDriverDeliveries(driverId, filters = {}) {
        try {
            console.log('🚗 DriverService: Fetching driver deliveries:', driverId, filters);

            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, String(value));
                }
            });

            const queryParams = params.toString();
            const response = await api.get(`/admin/drivers/${driverId}/deliveries?${queryParams}`);
            console.log('✅ DriverService: Driver deliveries fetched successfully');
            return response.data;
        } catch (error) {
            console.error('❌ DriverService: Error fetching driver deliveries:', error);
            throw error;
        }
    }

    // Get driver earnings
    async getDriverEarnings(driverId, period = 'month') {
        try {
            console.log('🚗 DriverService: Fetching driver earnings:', driverId, period);
            const response = await api.get(`/admin/drivers/${driverId}/earnings?period=${period}`);
            console.log('✅ DriverService: Driver earnings fetched successfully');
            return response.data;
        } catch (error) {
            console.error('❌ DriverService: Error fetching driver earnings:', error);
            throw error;
        }
    }

    // Bulk operations
    async bulkSuspendDrivers(driverIds, reason = '') {
        try {
            console.log('🚗 DriverService: Bulk suspending drivers:', driverIds, 'with reason:', reason);
            const response = await api.post('/admin/drivers/bulk-suspend', { driverIds, reason });
            console.log('✅ DriverService: Drivers bulk suspended successfully');
            return response.data;
        } catch (error) {
            console.error('❌ DriverService: Error bulk suspending drivers:', error);
            throw error;
        }
    }

    async bulkUnsuspendDrivers(driverIds) {
        try {
            console.log('🚗 DriverService: Bulk unsuspending drivers:', driverIds);
            const response = await api.post('/admin/drivers/bulk-unsuspend', { driverIds });
            console.log('✅ DriverService: Drivers bulk unsuspended successfully');
            return response.data;
        } catch (error) {
            console.error('❌ DriverService: Error bulk unsuspending drivers:', error);
            throw error;
        }
    }

    // Export drivers data
    async exportDrivers(format = 'csv', filters = {}) {
        try {
            console.log('🚗 DriverService: Exporting drivers data:', format, filters);

            // Prepare the request data
            const requestData = {
                format: format,
                ...filters
            };

            console.log('🚗 DriverService: Export request data:', requestData);

            // Try POST method first (most common for export operations)
            try {
                const response = await api.post('/admin/drivers/export', requestData, {
                    responseType: 'blob'
                });

                console.log('✅ DriverService: Drivers data exported successfully via POST');

                const blob = response.data;
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `drivers-export-${new Date().toISOString().split('T')[0]}.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                return { success: true };
            } catch (postError) {
                console.log('🚗 DriverService: POST export failed, trying GET method:', postError.response?.status);

                // If POST fails, try GET method with query parameters
                const queryParams = new URLSearchParams();
                queryParams.append('format', format);
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        queryParams.append(key, String(value));
                    }
                });

                const response = await api.get(`/admin/drivers/export?${queryParams}`, {
                    responseType: 'blob'
                });

                console.log('✅ DriverService: Drivers data exported successfully via GET');

                const blob = response.data;
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `drivers-export-${new Date().toISOString().split('T')[0]}.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                return { success: true };
            }
        } catch (error) {
            console.error('❌ DriverService: Error exporting drivers data:', error);
            console.error('❌ DriverService: Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });

            // Show user-friendly error message
            if (error.response?.status === 400) {
                throw new Error('Export failed: Invalid request parameters. Please check your filters.');
            } else if (error.response?.status === 401) {
                throw new Error('Export failed: Authentication required.');
            } else if (error.response?.status === 403) {
                throw new Error('Export failed: Permission denied.');
            } else if (error.response?.status === 404) {
                throw new Error('Export failed: Export endpoint not found.');
            } else if (error.response?.status === 500) {
                throw new Error('Export failed: Server error. Please try again later.');
            } else {
                throw new Error(`Export failed: ${error.message}`);
            }
        }
    }
}

// Create singleton instance
const driverService = new DriverService();

export default driverService;
