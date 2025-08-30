// Development Helper Utilities

class DevHelpers {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
    }

    // Get development status
    getStatus() {
        return {
            isDevelopment: this.isDevelopment,
            rateLimitBypass: false, // Rate limiting removed
            rateLimiterStatus: { activeEndpoints: 0, minInterval: 0 } // Rate limiting removed
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
                if (error.response?.status === 429 && attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt);
                    console.log(`🔧 Development: Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
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
