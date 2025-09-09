/**
 * Simple verification helpers for driver verification status
 */

/**
 * Check if a driver is verified
 * @param {Object} driver - Driver object
 * @returns {boolean} - True if driver is verified
 */
export const isDriverVerified = (driver) => {
    if (!driver) return false;

    // Check various verification fields
    return !!(
        driver.isVerified ||
        driver.verified ||
        driver.verificationStatus?.status === 'verified' ||
        driver.profileVerification?.studentVerified ||
        driver.profileVerification?.profileVerified ||
        driver.status === 'verified'
    );
};

/**
 * Get verification status for display
 * @param {Object} driver - Driver object
 * @returns {Object} - Verification status object
 */
export const getVerificationStatus = (driver) => {
    if (!driver) {
        return {
            isVerified: false,
            status: 'unknown',
            message: 'Driver data not available'
        };
    }

    const verified = isDriverVerified(driver);

    return {
        isVerified: verified,
        status: verified ? 'verified' : 'pending',
        message: verified ? 'Account verified' : 'Verification pending'
    };
};

const verificationHelpers = {
    isDriverVerified,
    getVerificationStatus
};

export default verificationHelpers;