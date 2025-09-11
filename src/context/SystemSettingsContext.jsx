import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import systemSettingsService from '../services/systemSettingsService';

const SystemSettingsContext = createContext();

export const useSystemSettings = () => {
    const context = useContext(SystemSettingsContext);
    if (!context) {
        throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
    }
    return context;
};

export const SystemSettingsProvider = ({ children }) => {
    const { user } = useAuth();
    const [settings, setSettings] = useState({
        public: null,
        driver: null,
        admin: null
    });
    const [loading, setLoading] = useState({
        public: false,
        driver: false,
        admin: false
    });
    const [error, setError] = useState(null);
    const [loaded, setLoaded] = useState({
        public: false,
        driver: false,
        admin: false
    });

    // Load public settings (no auth required)
    const loadPublicSettings = useCallback(async () => {
        if (loading.public || loaded.public) return;

        setLoading(prev => ({ ...prev, public: true }));
        setError(null);

        try {
            const response = await systemSettingsService.getPublicSettings();
            setSettings(prev => ({ ...prev, public: response.data }));
            setLoaded(prev => ({ ...prev, public: true }));
        } catch (error) {
            console.error('Error loading public settings:', error);
            setError('Failed to load public settings');
        } finally {
            setLoading(prev => ({ ...prev, public: false }));
        }
    }, [loading.public, loaded.public]);

    // Load driver settings (driver auth required)
    const loadDriverSettings = useCallback(async () => {
        if (!user || user.userType !== 'driver' || loading.driver || loaded.driver) return;

        setLoading(prev => ({ ...prev, driver: true }));
        setError(null);

        try {
            const response = await systemSettingsService.getDriverSettings();
            setSettings(prev => ({ ...prev, driver: response.data }));
            setLoaded(prev => ({ ...prev, driver: true }));
        } catch (error) {
            console.error('Error loading driver settings:', error);

            // Don't show error to users for 403/401 - just use defaults
            if (error.response?.status === 403 || error.response?.status === 401) {
                console.warn('Driver settings access forbidden - using default settings');
                // Set default driver settings to prevent UI breaks
                setSettings(prev => ({
                    ...prev,
                    driver: {
                        earnings: { minimumPayout: 50, payoutSchedule: 'weekly' },
                        notifications: { pushEnabled: true, emailEnabled: true },
                        delivery: { maxDistance: 50, autoAccept: false }
                    }
                }));
            } else {
                setError('Failed to load driver settings');
            }
        } finally {
            setLoading(prev => ({ ...prev, driver: false }));
        }
    }, [user, loading.driver, loaded.driver]);

    // Load admin settings (admin auth required)
    const loadAdminSettings = useCallback(async () => {
        if (!user || (user.userType !== 'admin' && user.userType !== 'super_admin') || loading.admin || loaded.admin) return;

        setLoading(prev => ({ ...prev, admin: true }));
        setError(null);

        try {
            const response = await systemSettingsService.getAdminSettings();
            setSettings(prev => ({ ...prev, admin: response.data }));
            setLoaded(prev => ({ ...prev, admin: true }));
        } catch (error) {
            console.error('Error loading admin settings:', error);
            setError('Failed to load admin settings');
        } finally {
            setLoading(prev => ({ ...prev, admin: false }));
        }
    }, [user, loading.admin, loaded.admin]);

    // Update admin settings
    const updateAdminSettings = useCallback(async (updates) => {
        if (!user || (user.userType !== 'admin' && user.userType !== 'super_admin')) {
            throw new Error('Admin access required');
        }

        try {
            const response = await systemSettingsService.updateAdminSettings(updates);
            setSettings(prev => ({ ...prev, admin: response.data }));
            // Reset loaded state to allow future reloads for both admin and public settings
            // This ensures currency changes are reflected immediately across the platform
            setLoaded(prev => ({ ...prev, admin: false, public: false }));

            // Immediately refresh public settings to reflect changes like currency
            await loadPublicSettings();

            return response;
        } catch (error) {
            console.error('Error updating admin settings:', error);
            throw error;
        }
    }, [user, loadPublicSettings]);

    // Update specific settings category
    const updateSettingsCategory = useCallback(async (category, categorySettings) => {
        if (!user || (user.userType !== 'admin' && user.userType !== 'super_admin')) {
            throw new Error('Admin access required');
        }

        try {
            const response = await systemSettingsService.updateSettingsCategory(category, categorySettings);
            setSettings(prev => ({ ...prev, admin: response.data }));
            // Reset loaded state to allow future reloads for both admin and public settings
            // This ensures changes like currency are reflected immediately across the platform
            setLoaded(prev => ({ ...prev, admin: false, public: false }));

            // Immediately refresh public settings to reflect changes like currency
            await loadPublicSettings();

            return response;
        } catch (error) {
            console.error(`Error updating ${category} settings:`, error);
            throw error;
        }
    }, [user, loadPublicSettings]);

    // Get setting value with fallback
    const getSetting = useCallback((category, key, defaultValue = null) => {
        // Try admin settings first
        if (settings.admin && settings.admin[category] && settings.admin[category][key] !== undefined) {
            return settings.admin[category][key];
        }

        // Try driver settings
        if (settings.driver && settings.driver[category] && settings.driver[category][key] !== undefined) {
            return settings.driver[category][key];
        }

        // Try public settings
        if (settings.public && settings.public[category] && settings.public[category][key] !== undefined) {
            return settings.public[category][key];
        }

        return defaultValue;
    }, [settings]);

    // Format currency based on settings (synchronous version for JSX)
    const formatCurrency = useCallback((amount) => {
        try {
            const currency = getSetting('display', 'currency', 'TRY');
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount)) return '₺0.00';

            // Use Turkish Lira symbol instead of TRY code
            if (currency === 'TRY') {
                return `₺${numAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`;
            }

            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(numAmount);
        } catch (error) {
            console.error('Error formatting currency:', error);
            return `₺${parseFloat(amount || 0).toFixed(2)}`; // Default fallback
        }
    }, [getSetting]);

    // Async format currency for when you need the full service
    const formatCurrencyAsync = useCallback(async (amount) => {
        try {
            return await systemSettingsService.formatCurrency(amount);
        } catch (error) {
            console.error('Error formatting currency:', error);
            return `₺${parseFloat(amount || 0).toFixed(2)}`; // Default fallback
        }
    }, []);

    // Check if maintenance mode is enabled
    const isMaintenanceMode = useCallback(() => {
        return getSetting('system', 'maintenanceMode', false);
    }, [getSetting]);

    // Check if new registrations are allowed
    const areNewRegistrationsAllowed = useCallback(() => {
        return getSetting('system', 'allowNewRegistrations', true);
    }, [getSetting]);

    // Get currency
    const getCurrency = useCallback(() => {
        return getSetting('display', 'currency', 'TRY');
    }, [getSetting]);

    // Get language
    const getLanguage = useCallback(() => {
        return getSetting('display', 'language', 'en');
    }, [getSetting]);

    // Get timezone
    const getTimezone = useCallback(() => {
        return getSetting('display', 'timezone', 'Europe/Istanbul');
    }, [getSetting]);

    // Get commission rate
    const getCommissionRate = useCallback(() => {
        return getSetting('earnings', 'commissionRate', 80);
    }, [getSetting]);

    // Get minimum payout
    const getMinimumPayout = useCallback(() => {
        return getSetting('earnings', 'minimumPayout', 100);
    }, [getSetting]);

    // Get max delivery distance
    const getMaxDeliveryDistance = useCallback(() => {
        return getSetting('delivery', 'maxDeliveryDistance', 50);
    }, [getSetting]);

    // Get delivery time estimate
    const getDeliveryTimeEstimate = useCallback(() => {
        return getSetting('delivery', 'deliveryTimeEstimate', 30);
    }, [getSetting]);

    // Load settings based on user type
    useEffect(() => {
        // Always load public settings
        loadPublicSettings();

        // Load role-specific settings
        if (user) {
            if (user.userType === 'driver') {
                loadDriverSettings();
            } else if (user.userType === 'admin' || user.userType === 'super_admin') {
                loadAdminSettings();
            }
        }
    }, [user]); // Only depend on user, not the loading functions

    // Refresh settings
    const refreshSettings = useCallback(async () => {
        // Reset loaded state to force reload
        setLoaded({ public: false, driver: false, admin: false });

        await Promise.all([
            loadPublicSettings(),
            user?.userType === 'driver' ? loadDriverSettings() : Promise.resolve(),
            (user?.userType === 'admin' || user?.userType === 'super_admin') ? loadAdminSettings() : Promise.resolve()
        ]);
    }, [user, loadPublicSettings, loadDriverSettings, loadAdminSettings]);

    const value = {
        // Settings data
        settings,
        loading,
        error,

        // Loading functions
        loadPublicSettings,
        loadDriverSettings,
        loadAdminSettings,
        refreshSettings,

        // Manual refresh functions
        refreshPublicSettings: () => {
            setLoaded(prev => ({ ...prev, public: false }));
            loadPublicSettings();
        },
        refreshDriverSettings: () => {
            setLoaded(prev => ({ ...prev, driver: false }));
            loadDriverSettings();
        },
        refreshAdminSettings: () => {
            setLoaded(prev => ({ ...prev, admin: false }));
            loadAdminSettings();
        },

        // Update functions
        updateAdminSettings,
        updateSettingsCategory,

        // Getter functions
        getSetting,
        formatCurrency,
        formatCurrencyAsync,
        isMaintenanceMode,
        areNewRegistrationsAllowed,
        getCurrency,
        getLanguage,
        getTimezone,
        getCommissionRate,
        getMinimumPayout,
        getMaxDeliveryDistance,
        getDeliveryTimeEstimate,

        // Convenience getters
        publicSettings: settings.public,
        driverSettings: settings.driver,
        adminSettings: settings.admin,

        // Loading states
        isLoadingPublic: loading.public,
        isLoadingDriver: loading.driver,
        isLoadingAdmin: loading.admin,

        // User type checks
        isDriver: user?.userType === 'driver',
        isAdmin: user?.userType === 'admin' || user?.userType === 'super_admin',
        canManageSettings: user?.userType === 'admin' || user?.userType === 'super_admin'
    };

    return (
        <SystemSettingsContext.Provider value={value}>
            {children}
        </SystemSettingsContext.Provider>
    );
};
