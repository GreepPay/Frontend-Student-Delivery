// Development Helper Utilities

class DevHelpers {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
    }

    // Get development status
    getStatus() {
        return {
            isDevelopment: this.isDevelopment,
            // Rate limiting removed
        };
    }

    // Development-only API retry with exponential backoff
    async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
        if (!this.isDevelopment) {
            return fn(); // In production, just call the function once
        }

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                // Rate limiting removed - all requests allowed
                throw error;
            }
        }
    }

    // Development-only: Force allow next request for specific endpoint
    forceAllowNextRequest(endpoint) {
        if (this.isDevelopment) {
            return true; // Rate limiting removed
        }
        return false;
    }

    // Development-only: Log API call for debugging
    logApiCall(method, url, data = null) {
        if (this.isDevelopment) {
            console.log(`🔧 API Call: ${method} ${url}`, data ? { data } : '');
        }
    }

    // Development-only: Simulate network delay
    async simulateDelay(ms = 100) {
        if (this.isDevelopment) {
            await new Promise(resolve => setTimeout(resolve, ms));
        }
    }
}

// Create a singleton instance
const devHelpers = new DevHelpers();

// Expose to window for development debugging
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    window.devHelpers = devHelpers;
    console.log('🔧 Development helpers available at window.devHelpers');
    console.log('🔧 Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(devHelpers)));
}

export default devHelpers;
