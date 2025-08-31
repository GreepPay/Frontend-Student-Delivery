import api from './api';

class EarningsValidationService {
    // Validate a specific driver's earnings
    static async validateDriverEarnings(driverId) {
        try {
            console.log('🔍 EarningsValidationService: Validating driver earnings for:', driverId);

            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/earnings/validate/${driverId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Validation failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ EarningsValidationService: Driver validation result:', data);

            return {
                isValid: data.isValid || false,
                driverTotals: data.driverTotals || {},
                actualTotals: data.actualTotals || {},
                discrepancies: data.discrepancies || [],
                message: data.message || 'Validation completed'
            };
        } catch (error) {
            console.error('❌ EarningsValidationService: Error validating driver earnings:', error);
            throw error;
        }
    }

    // Fix a specific driver's earnings
    static async fixDriverEarnings(driverId) {
        try {
            console.log('🔧 EarningsValidationService: Fixing driver earnings for:', driverId);

            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/earnings/fix/${driverId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Fix failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ EarningsValidationService: Driver earnings fix result:', data);

            return {
                success: data.success || false,
                message: data.message || 'Fix completed',
                changes: data.changes || [],
                newTotals: data.newTotals || {}
            };
        } catch (error) {
            console.error('❌ EarningsValidationService: Error fixing driver earnings:', error);
            throw error;
        }
    }

    // Validate all drivers' earnings
    static async validateAllDriversEarnings() {
        try {
            console.log('🔍 EarningsValidationService: Validating all drivers earnings');

            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/earnings/validate-all`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Bulk validation failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ EarningsValidationService: All drivers validation result:', data);

            return {
                validDrivers: data.validDrivers || 0,
                invalidDrivers: data.invalidDrivers || 0,
                totalDrivers: data.totalDrivers || 0,
                details: data.details || [],
                summary: data.summary || {}
            };
        } catch (error) {
            console.error('❌ EarningsValidationService: Error validating all drivers earnings:', error);
            throw error;
        }
    }

    // Ensure delivery earnings are calculated
    static async ensureDeliveryEarningsCalculated(deliveryId) {
        try {
            console.log('💰 EarningsValidationService: Ensuring earnings calculated for delivery:', deliveryId);

            // This would typically be called from the backend when a delivery is marked as delivered
            // For frontend, we can validate that the delivery has earnings
            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/deliveries/${deliveryId}/earnings-check`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ EarningsValidationService: Delivery earnings check result:', data);
                return data;
            } else {
                console.warn('⚠️ EarningsValidationService: Delivery earnings check failed:', response.status);
                return { hasEarnings: false, message: 'Earnings check failed' };
            }
        } catch (error) {
            console.error('❌ EarningsValidationService: Error checking delivery earnings:', error);
            return { hasEarnings: false, message: 'Earnings check error' };
        }
    }

    // Update driver total earnings
    static async updateDriverTotalEarnings(driverId) {
        try {
            console.log('💰 EarningsValidationService: Updating driver total earnings for:', driverId);

            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/drivers/${driverId}/earnings/recalculate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Recalculation failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ EarningsValidationService: Driver earnings recalculation result:', data);

            return {
                success: data.success || false,
                oldTotal: data.oldTotal || 0,
                newTotal: data.newTotal || 0,
                message: data.message || 'Recalculation completed'
            };
        } catch (error) {
            console.error('❌ EarningsValidationService: Error updating driver total earnings:', error);
            throw error;
        }
    }

    // Get earnings validation status for dashboard
    static async getEarningsValidationStatus() {
        try {
            console.log('📊 EarningsValidationService: Getting earnings validation status');

            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/earnings/status`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Status check failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ EarningsValidationService: Earnings validation status:', data);

            return {
                lastValidation: data.lastValidation || null,
                totalDrivers: data.totalDrivers || 0,
                validDrivers: data.validDrivers || 0,
                invalidDrivers: data.invalidDrivers || 0,
                validationRate: data.validationRate || 0,
                needsAttention: data.needsAttention || false
            };
        } catch (error) {
            console.error('❌ EarningsValidationService: Error getting earnings validation status:', error);
            return {
                lastValidation: null,
                totalDrivers: 0,
                validDrivers: 0,
                invalidDrivers: 0,
                validationRate: 0,
                needsAttention: false
            };
        }
    }
}

export default EarningsValidationService;
