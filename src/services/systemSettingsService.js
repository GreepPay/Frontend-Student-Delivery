import api from './api';

class SystemSettingsService {
    // Get public settings (no authentication required)
    async getPublicSettings() {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/system-settings/public`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch public settings');
            }

            return data;
        } catch (error) {
            console.error('Error fetching public settings:', error);
            throw error;
        }
    }

    // Get driver settings (driver authentication required)
    async getDriverSettings() {
        try {
            const response = await api.get('/system-settings/driver');
            return response.data;
        } catch (error) {
            console.error('Error fetching driver settings:', error);

            // Return default settings for 403/401 errors to prevent app crashes
            if (error.response?.status === 403 || error.response?.status === 401) {
                console.warn('Driver settings endpoint forbidden - returning defaults');
                return {
                    success: true,
                    data: {
                        earnings: { minimumPayout: 50, payoutSchedule: 'weekly' },
                        notifications: { pushEnabled: true, emailEnabled: true },
                        delivery: { maxDistance: 50, autoAccept: false }
                    }
                };
            }

            throw error;
        }
    }

    // Get admin settings (admin authentication required)
    async getAdminSettings() {
        try {
            const response = await api.get('/system-settings/admin');
            return response.data;
        } catch (error) {
            console.error('Error fetching admin settings:', error);
            throw error;
        }
    }

    // Update admin settings (admin authentication required)
    async updateAdminSettings(updates) {
        try {
            const response = await api.put('/system-settings/admin', { updates });
            return response.data;
        } catch (error) {
            console.error('Error updating admin settings:', error);
            throw error;
        }
    }

    // Update specific setting category (admin authentication required)
    async updateSettingsCategory(category, settings) {
        try {
            const updates = { [category]: settings };
            const response = await api.put('/system-settings/admin', { updates });
            return response.data;
        } catch (error) {
            console.error(`Error updating ${category} settings:`, error);
            throw error;
        }
    }

    // Get specific setting value
    async getSettingValue(category, key) {
        try {
            const response = await api.get('/system-settings/admin');
            const settings = response.data.data;

            if (settings && settings[category] && settings[category][key] !== undefined) {
                return settings[category][key];
            }

            return null;
        } catch (error) {
            console.error(`Error getting setting value ${category}.${key}:`, error);
            return null;
        }
    }

    // Get currency settings (public)
    async getCurrencySettings() {
        try {
            const response = await this.getPublicSettings();
            return response.data.display?.currency || 'TRY';
        } catch (error) {
            console.error('Error getting currency settings:', error);
            return 'TRY'; // Default fallback
        }
    }

    // Get language settings (public)
    async getLanguageSettings() {
        try {
            const response = await this.getPublicSettings();
            return response.data.display?.language || 'en';
        } catch (error) {
            console.error('Error getting language settings:', error);
            return 'en'; // Default fallback
        }
    }

    // Get notification settings (driver/admin)
    async getNotificationSettings() {
        try {
            const response = await this.getDriverSettings();
            return response.data.notifications || {};
        } catch (error) {
            console.error('Error getting notification settings:', error);
            return {};
        }
    }

    // Get delivery settings (driver/admin)
    async getDeliverySettings() {
        try {
            const response = await this.getDriverSettings();
            return response.data.delivery || {};
        } catch (error) {
            console.error('Error getting delivery settings:', error);
            return {};
        }
    }

    // Get earnings settings (driver/admin)
    async getEarningsSettings() {
        try {
            const response = await this.getDriverSettings();
            return response.data.earnings || {};
        } catch (error) {
            console.error('Error getting earnings settings:', error);
            return {};
        }
    }

    // Check if maintenance mode is enabled (public)
    async isMaintenanceMode() {
        try {
            const response = await this.getPublicSettings();
            return response.data.system?.maintenanceMode || false;
        } catch (error) {
            console.error('Error checking maintenance mode:', error);
            return false;
        }
    }

    // Check if new registrations are allowed (public)
    async areNewRegistrationsAllowed() {
        try {
            const response = await this.getPublicSettings();
            return response.data.system?.allowNewRegistrations || true;
        } catch (error) {
            console.error('Error checking new registrations:', error);
            return true;
        }
    }

    // Format currency based on system settings
    async formatCurrency(amount) {
        try {
            const currency = await this.getCurrencySettings();
            const formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2
            });
            return formatter.format(amount);
        } catch (error) {
            console.error('Error formatting currency:', error);
            return `$${amount.toFixed(2)}`; // Default fallback
        }
    }

    // Get timezone settings
    async getTimezoneSettings() {
        try {
            const response = await this.getDriverSettings();
            return response.data.display?.timezone || 'Europe/Istanbul';
        } catch (error) {
            console.error('Error getting timezone settings:', error);
            return 'Europe/Istanbul'; // Default fallback
        }
    }

    // Get commission rate (driver)
    async getCommissionRate() {
        try {
            const response = await this.getDriverSettings();
            return response.data.earnings?.commissionRate || 80;
        } catch (error) {
            console.error('Error getting commission rate:', error);
            return 80; // Default fallback
        }
    }

    // Get minimum payout amount (driver)
    async getMinimumPayout() {
        try {
            const response = await this.getDriverSettings();
            return response.data.earnings?.minimumPayout || 100;
        } catch (error) {
            console.error('Error getting minimum payout:', error);
            return 100; // Default fallback
        }
    }

    // Get max delivery distance (driver)
    async getMaxDeliveryDistance() {
        try {
            const response = await this.getDriverSettings();
            return response.data.delivery?.maxDeliveryDistance || 50;
        } catch (error) {
            console.error('Error getting max delivery distance:', error);
            return 50; // Default fallback
        }
    }

    // Get delivery time estimate (driver)
    async getDeliveryTimeEstimate() {
        try {
            const response = await this.getDriverSettings();
            return response.data.delivery?.deliveryTimeEstimate || 30;
        } catch (error) {
            console.error('Error getting delivery time estimate:', error);
            return 30; // Default fallback
        }
    }
}

// Create and export a singleton instance
const systemSettingsService = new SystemSettingsService();
export default systemSettingsService;
