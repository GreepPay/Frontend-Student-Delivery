
/**
 * Formats profit margin for display, handling different data types
 * @param {number|string|null} profitMargin - The profit margin value
 * @param {string} defaultValue - Default value to show for null/undefined
 * @returns {string} Formatted profit margin for display
 */
export const displayProfitMargin = (profitMargin, defaultValue = '—') => {
    if (profitMargin === null || profitMargin === undefined) {
        return defaultValue;
    }

    if (typeof profitMargin === 'string') {
        return profitMargin; // "N/A" or other string values
    }

    if (typeof profitMargin === 'number') {
        return `${profitMargin.toFixed(1)}%`;
    }

    return defaultValue;
};

/**
 * Formats profit margin for display with color coding
 * @param {number|string|null} profitMargin - The profit margin value
 * @param {string} defaultValue - Default value to show for null/undefined
 * @returns {object} Object with display value and color class
 */
export const displayProfitMarginWithColor = (profitMargin, defaultValue = '—') => {
    const displayValue = displayProfitMargin(profitMargin, defaultValue);

    // If it's "N/A" or default value, use gray
    if (displayValue === 'N/A' || displayValue === defaultValue) {
        return {
            value: displayValue,
            color: 'text-gray-500'
        };
    }

    // If it's a number, determine color based on value
    if (typeof profitMargin === 'number') {
        if (profitMargin > 0) {
            return {
                value: displayValue,
                color: 'text-green-600'
            };
        } else if (profitMargin < 0) {
            return {
                value: displayValue,
                color: 'text-red-600'
            };
        } else {
            return {
                value: displayValue,
                color: 'text-gray-600'
            };
        }
    }

    // Default case
    return {
        value: displayValue,
        color: 'text-gray-600'
    };
};

