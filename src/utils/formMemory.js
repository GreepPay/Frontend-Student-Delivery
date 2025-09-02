/**
 * Form Memory Utility
 * Stores and retrieves form data with autocomplete suggestions
 */

class FormMemory {
    constructor() {
        this.storageKey = 'form_memory';
        this.maxHistorySize = 50;
        this.maxSuggestions = 10;
    }

    /**
     * Save form data to memory
     * @param {string} formType - Type of form (e.g., 'delivery', 'customer')
     * @param {Object} formData - Form data to save
     * @param {string} fieldName - Specific field name (optional)
     */
    saveFormData(formType, formData, fieldName = null) {
        try {
            const memory = this.getMemory();

            if (!memory[formType]) {
                memory[formType] = {
                    history: [],
                    suggestions: {},
                    lastUsed: {}
                };
            }

            // Save complete form data to history
            const timestamp = Date.now();
            const entry = {
                data: { ...formData },
                timestamp,
                usageCount: 1
            };

            // Check if similar data already exists
            const existingIndex = memory[formType].history.findIndex(item =>
                this.isSimilarData(item.data, formData)
            );

            if (existingIndex !== -1) {
                // Update existing entry
                memory[formType].history[existingIndex].usageCount++;
                memory[formType].history[existingIndex].timestamp = timestamp;
            } else {
                // Add new entry
                memory[formType].history.unshift(entry);

                // Keep only the most recent entries
                if (memory[formType].history.length > this.maxHistorySize) {
                    memory[formType].history = memory[formType].history.slice(0, this.maxHistorySize);
                }
            }

            // Update suggestions for each field
            this.updateSuggestions(memory[formType], formData);

            // Save to localStorage
            this.saveMemory(memory);

            console.log(`💾 Form memory saved for ${formType}`, { fieldName, timestamp });
        } catch (error) {
            console.error('Error saving form data:', error);
        }
    }

    /**
     * Load saved form data for a specific form type
     * @param {string} formType - Type of form
     * @returns {Object|null} Saved form data or null if not found
     */
    loadFormData(formType) {
        try {
            const memory = this.getMemory();

            if (!memory[formType] || !memory[formType].history || memory[formType].history.length === 0) {
                return null;
            }

            // Return the most recent form data
            const mostRecent = memory[formType].history[0];
            return mostRecent ? mostRecent.data : null;
        } catch (error) {
            console.error('Error loading form data:', error);
            return null;
        }
    }

    /**
     * Clear form data for a specific form type
     * @param {string} formType - Type of form
     */
    clearFormData(formType) {
        try {
            const memory = this.getMemory();

            if (memory[formType]) {
                memory[formType].history = [];
                memory[formType].suggestions = {};
                memory[formType].lastUsed = {};
                this.saveMemory(memory);
                console.log(`🗑️ Form memory cleared for ${formType}`);
            }
        } catch (error) {
            console.error('Error clearing form data:', error);
        }
    }

    /**
     * Get suggestions for a specific field
     * @param {string} formType - Type of form
     * @param {string} fieldName - Field name
     * @param {string} currentValue - Current input value
     * @returns {Array} Array of suggestions
     */
    getSuggestions(formType, fieldName, currentValue = '') {
        try {
            const memory = this.getMemory();

            if (!memory[formType] || !memory[formType].suggestions[fieldName]) {
                return [];
            }

            const suggestions = memory[formType].suggestions[fieldName];

            if (!currentValue) {
                // Return most frequently used values
                return suggestions
                    .sort((a, b) => b.usageCount - a.usageCount)
                    .slice(0, this.maxSuggestions)
                    .map(item => item.value);
            }

            // Filter suggestions based on current input
            const filtered = suggestions
                .filter(item =>
                    item.value.toLowerCase().includes(currentValue.toLowerCase())
                )
                .sort((a, b) => {
                    // Prioritize exact matches
                    if (a.value.toLowerCase() === currentValue.toLowerCase()) return -1;
                    if (b.value.toLowerCase() === currentValue.toLowerCase()) return 1;

                    // Then by usage count
                    return b.usageCount - a.usageCount;
                })
                .slice(0, this.maxSuggestions)
                .map(item => item.value);

            return filtered;
        } catch (error) {
            console.error('Error getting suggestions:', error);
            return [];
        }
    }

    /**
     * Get recent form data
     * @param {string} formType - Type of form
     * @param {number} limit - Number of recent entries to return
     * @returns {Array} Array of recent form data
     */
    getRecentFormData(formType, limit = 5) {
        try {
            const memory = this.getMemory();

            if (!memory[formType] || !memory[formType].history) {
                return [];
            }

            return memory[formType].history
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, limit)
                .map(item => ({
                    ...item.data,
                    lastUsed: new Date(item.timestamp),
                    usageCount: item.usageCount
                }));
        } catch (error) {
            console.error('Error getting recent form data:', error);
            return [];
        }
    }

    /**
     * Get the most recently used value for a specific field
     * @param {string} formType - Type of form
     * @param {string} fieldName - Field name
     * @returns {string|null} Most recent value or null
     */
    getLastUsedValue(formType, fieldName) {
        try {
            const memory = this.getMemory();

            if (!memory[formType] || !memory[formType].lastUsed[fieldName]) {
                return null;
            }

            return memory[formType].lastUsed[fieldName];
        } catch (error) {
            console.error('Error getting last used value:', error);
            return null;
        }
    }

    /**
     * Auto-fill form with recent data
     * @param {string} formType - Type of form
     * @param {Object} currentFormData - Current form data
     * @returns {Object} Auto-filled form data
     */
    autoFillForm(formType, currentFormData = {}) {
        try {
            const memory = this.getMemory();

            if (!memory[formType] || !memory[formType].history.length) {
                return currentFormData;
            }

            // Get the most recently used form data
            const mostRecent = memory[formType].history[0].data;

            // Merge with current form data, prioritizing current data
            const autoFilled = { ...mostRecent, ...currentFormData };

            console.log(`🔄 Auto-filled form for ${formType}`, autoFilled);
            return autoFilled;
        } catch (error) {
            console.error('Error auto-filling form:', error);
            return currentFormData;
        }
    }

    /**
     * Clear form memory
     * @param {string} formType - Type of form (optional, clears all if not specified)
     */
    clearMemory(formType = null) {
        try {
            if (formType) {
                const memory = this.getMemory();
                delete memory[formType];
                this.saveMemory(memory);
                console.log(`🗑️ Cleared memory for ${formType}`);
            } else {
                localStorage.removeItem(this.storageKey);
                console.log('🗑️ Cleared all form memory');
            }
        } catch (error) {
            console.error('Error clearing memory:', error);
        }
    }

    /**
     * Get memory statistics
     * @returns {Object} Memory statistics
     */
    getMemoryStats() {
        try {
            const memory = this.getMemory();
            const stats = {
                totalForms: Object.keys(memory).length,
                totalEntries: 0,
                forms: {}
            };

            Object.entries(memory).forEach(([formType, data]) => {
                stats.forms[formType] = {
                    historyEntries: data.history?.length || 0,
                    suggestionFields: Object.keys(data.suggestions || {}).length,
                    lastUsedFields: Object.keys(data.lastUsed || {}).length
                };
                stats.totalEntries += data.history?.length || 0;
            });

            return stats;
        } catch (error) {
            console.error('Error getting memory stats:', error);
            return { totalForms: 0, totalEntries: 0, forms: {} };
        }
    }

    // Private methods

    /**
     * Get memory from localStorage
     * @returns {Object} Memory data
     */
    getMemory() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error getting memory from localStorage:', error);
            return {};
        }
    }

    /**
     * Save memory to localStorage
     * @param {Object} memory - Memory data to save
     */
    saveMemory(memory) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(memory));
        } catch (error) {
            console.error('Error saving memory to localStorage:', error);
        }
    }

    /**
     * Update suggestions for form fields
     * @param {Object} formMemory - Form memory object
     * @param {Object} formData - Form data
     */
    updateSuggestions(formMemory, formData) {
        Object.entries(formData).forEach(([fieldName, value]) => {
            if (value && typeof value === 'string' && value.trim()) {
                if (!formMemory.suggestions[fieldName]) {
                    formMemory.suggestions[fieldName] = [];
                }

                const existingIndex = formMemory.suggestions[fieldName].findIndex(
                    item => item.value === value
                );

                if (existingIndex !== -1) {
                    formMemory.suggestions[fieldName][existingIndex].usageCount++;
                } else {
                    formMemory.suggestions[fieldName].push({
                        value,
                        usageCount: 1
                    });
                }

                // Keep suggestions sorted by usage count
                formMemory.suggestions[fieldName].sort((a, b) => b.usageCount - a.usageCount);

                // Limit suggestions per field
                if (formMemory.suggestions[fieldName].length > this.maxSuggestions) {
                    formMemory.suggestions[fieldName] = formMemory.suggestions[fieldName].slice(0, this.maxSuggestions);
                }

                // Update last used value
                if (!formMemory.lastUsed) {
                    formMemory.lastUsed = {};
                }
                formMemory.lastUsed[fieldName] = value;
            }
        });
    }

    /**
     * Check if two form data objects are similar
     * @param {Object} data1 - First form data
     * @param {Object} data2 - Second form data
     * @returns {boolean} True if similar
     */
    isSimilarData(data1, data2) {
        // Consider forms similar if key fields match
        const keyFields = ['customerName', 'customerPhone', 'pickupLocationDescription', 'deliveryLocationDescription'];

        return keyFields.every(field => {
            const val1 = data1[field] || '';
            const val2 = data2[field] || '';
            return val1.toLowerCase().trim() === val2.toLowerCase().trim();
        });
    }
}

// Create singleton instance
const formMemory = new FormMemory();

export default formMemory;

// WhatsApp detection utility for international numbers
export const whatsAppUtils = {
    // Check if phone number is connected to WhatsApp
    isWhatsAppNumber: (phoneNumber) => {
        if (!phoneNumber) return false;

        // Remove all non-digit characters
        const cleanNumber = phoneNumber.replace(/\D/g, '');

        // Basic validation for common WhatsApp number formats worldwide
        // WhatsApp supports numbers with 7-15 digits including country code
        return cleanNumber.length >= 7 && cleanNumber.length <= 15;
    },

    // Generate WhatsApp link for international numbers
    generateWhatsAppLink: (phoneNumber, message = '') => {
        if (!phoneNumber) return null;

        // Remove all non-digit characters except +
        let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

        // If number starts with +, keep it, otherwise assume it needs country code
        if (!cleanNumber.startsWith('+')) {
            // For international compatibility, we'll keep the number as is
            // Users should enter the full international format
            // cleanNumber remains unchanged
        }

        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    },

    // Format phone number for display (international)
    formatPhoneNumber: (phoneNumber) => {
        if (!phoneNumber) return '';

        // Remove all non-digit characters except +
        let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

        // If it already has a +, return as is
        if (cleanNumber.startsWith('+')) {
            return cleanNumber;
        }

        // If it's a 10-digit number (common for many countries), add +
        if (cleanNumber.length === 10) {
            return `+${cleanNumber}`;
        }

        // If it's 11 digits and starts with 1 (US/Canada), add +
        if (cleanNumber.length === 11 && cleanNumber.startsWith('1')) {
            return `+${cleanNumber}`;
        }

        // For other formats, just add + if not present
        if (!cleanNumber.startsWith('+')) {
            return `+${cleanNumber}`;
        }

        return cleanNumber;
    },

    // Get country code from phone number
    getCountryCode: (phoneNumber) => {
        if (!phoneNumber) return null;

        const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

        if (cleanNumber.startsWith('+')) {
            // Extract country code (first 1-4 digits after +)
            const match = cleanNumber.match(/^\+(\d{1,4})/);
            return match ? match[1] : null;
        }

        return null;
    },

    // Validate international phone number
    isValidInternationalNumber: (phoneNumber) => {
        if (!phoneNumber) return false;

        const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

        // Must start with + and have 7-15 digits total
        if (!cleanNumber.startsWith('+')) return false;

        const digitsOnly = cleanNumber.replace('+', '');
        return digitsOnly.length >= 7 && digitsOnly.length <= 15;
    }
};

// Google Maps utility
export const mapsUtils = {
    // Generate Google Maps directions link (from current location to destination)
    generateDirectionsLink: (pickupLocation, deliveryLocation) => {
        if (!pickupLocation || !deliveryLocation) return null;

        const encodedPickup = encodeURIComponent(pickupLocation);
        const encodedDelivery = encodeURIComponent(deliveryLocation);

        return `https://www.google.com/maps/dir/${encodedPickup}/${encodedDelivery}`;
    },

    // Generate Google Maps search link for a location
    generateSearchLink: (location) => {
        if (!location) return null;

        const encodedLocation = encodeURIComponent(location);
        return `https://www.google.com/maps/search/${encodedLocation}`;
    },

    // Generate Google Maps link for coordinates (static location)
    generateCoordinatesLink: (lat, lng, zoom = 15) => {
        if (!lat || !lng) return null;

        // Use place format for viewing specific location
        return `https://www.google.com/maps/place/@${lat},${lng},${zoom}z`;
    },

    // Generate Google Maps directions from current location to coordinates
    generateDirectionsToCoordinates: (lat, lng, destinationName = '') => {
        if (!lat || !lng) return null;

        // Use Google Maps directions with "My Location" as origin
        const destination = destinationName ? `${destinationName}/${lat},${lng}` : `${lat},${lng}`;
        return `https://www.google.com/maps/dir/My+Location/${destination}`;
    },

    // Generate Google Maps directions from current location to coordinates with search query
    generateDirectionsToCoordinatesWithSearch: (lat, lng, searchQuery = '', zoom = 15) => {
        if (!lat || !lng) return null;

        if (searchQuery) {
            const encodedQuery = encodeURIComponent(searchQuery);
            // Use directions format: My Location to search query at coordinates
            return `https://www.google.com/maps/dir/My+Location/${encodedQuery}/${lat},${lng}`;
        } else {
            // Simple directions to coordinates
            return `https://www.google.com/maps/dir/My+Location/${lat},${lng}`;
        }
    },

    // Generate Google Maps coordinates with search query
    generateCoordinatesSearchLink: (lat, lng, searchQuery = '', zoom = 15) => {
        if (!lat || !lng) return null;

        if (searchQuery) {
            const encodedQuery = encodeURIComponent(searchQuery);
            // Use place format for viewing specific location
            return `https://www.google.com/maps/place/${encodedQuery}/@${lat},${lng},${zoom}z`;
        } else {
            // Use place format for coordinates only
            return `https://www.google.com/maps/place/@${lat},${lng},${zoom}z`;
        }
    },

    // Extract coordinates from Google Maps URL
    extractCoordinatesFromUrl: (url) => {
        if (!url) return null;

        try {
            // Handle different Google Maps URL formats
            const patterns = [
                // Format: https://www.google.com/maps/@35.196171,33.370403,15z
                /@(-?\d+\.\d+),(-?\d+\.\d+),(\d+)z/,
                // Format: https://www.google.com/maps/place/.../@35.196171,33.370403,15z
                /@(-?\d+\.\d+),(-?\d+\.\d+),(\d+)z/,
                // Format: https://maps.google.com/?q=35.196171,33.326942
                /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
                // Format: https://www.google.com/maps/search/.../@35.196171,33.370403,15z
                /@(-?\d+\.\d+),(-?\d+\.\d+),(\d+)z/
            ];

            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match) {
                    return {
                        lat: parseFloat(match[1]),
                        lng: parseFloat(match[2]),
                        zoom: match[3] ? parseInt(match[3]) : 15
                    };
                }
            }

            return null;
        } catch (error) {
            console.error('Error extracting coordinates from URL:', error);
            return null;
        }
    },

    // Generate navigation link from coordinates (for viewing location)
    generateNavigationLink: (lat, lng, destinationName = '') => {
        if (!lat || !lng) return null;

        // Use the proper Google Maps place format
        // This creates a proper location view with navigation options
        if (destinationName) {
            const encodedName = encodeURIComponent(destinationName);
            return `https://www.google.com/maps/place/${encodedName}/@${lat},${lng},15z`;
        } else {
            return `https://www.google.com/maps/place/@${lat},${lng},15z`;
        }
    },

    // Extract coordinates and create navigation link from URL
    extractAndCreateNavigationLink: (url, destinationName = '') => {
        if (!url) return null;

        console.log('🔍 Extracting coordinates from URL:', url);
        const coords = mapsUtils.extractCoordinatesFromUrl(url);
        console.log('📍 Extracted coordinates:', coords);

        if (coords) {
            const navUrl = mapsUtils.generateNavigationLink(coords.lat, coords.lng, destinationName);
            console.log('🧭 Generated navigation URL:', navUrl);
            return navUrl;
        }

        console.log('❌ No coordinates found in URL');
        return null;
    }
}; 