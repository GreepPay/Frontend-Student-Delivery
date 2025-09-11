#!/usr/bin/env node

/**
 * Driver Rating Recalculation Script
 * 
 * This script recalculates all driver ratings using the new, more realistic formula:
 * - OLD: (weightedScore / 20) + 1 (too lenient)
 * - NEW: (weightedScore / 20) (more realistic)
 * 
 * Usage: node scripts/recalculateDriverRatings.js
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token-here';

// Create axios instance with auth
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

/**
 * New rating calculation formula (more realistic)
 */
function calculateNewRating(metrics) {
    const {
        acceptanceRate = 0,
        completionRate = 0,
        responseTime = 0,
        reliability = 0,
        customerSatisfaction = 0
    } = metrics;

    // Weighted score calculation (same as before)
    const weightedScore = (
        (acceptanceRate * 0.35) +
        (completionRate * 0.30) +
        (responseTime * 0.20) +
        (reliability * 0.10) +
        (customerSatisfaction * 0.05)
    );

    // NEW FORMULA: More realistic rating distribution
    const finalRating = Math.max(1, Math.min(5, (weightedScore / 20)));

    return {
        weightedScore,
        finalRating: Math.round(finalRating * 10) / 10, // Round to 1 decimal
        oldRating: Math.max(1, Math.min(5, (weightedScore / 20) + 1)) // For comparison
    };
}

/**
 * Fetch all drivers from the API
 */
async function fetchAllDrivers() {
    try {
        console.log('📡 Fetching all drivers...');
        const response = await api.get('/admin/drivers');

        if (response.data.success) {
            console.log(`✅ Found ${response.data.data.length} drivers`);
            return response.data.data;
        } else {
            throw new Error('Failed to fetch drivers');
        }
    } catch (error) {
        console.error('❌ Error fetching drivers:', error.message);
        throw error;
    }
}

/**
 * Update driver rating via API
 */
async function updateDriverRating(driverId, newRating) {
    try {
        const response = await api.put(`/admin/drivers/${driverId}/rating`, {
            rating: newRating
        });

        if (response.data.success) {
            return true;
        } else {
            throw new Error('Failed to update rating');
        }
    } catch (error) {
        console.error(`❌ Error updating driver ${driverId}:`, error.message);
        return false;
    }
}

/**
 * Main recalculation function
 */
async function recalculateAllRatings() {
    try {
        console.log('🚀 Starting driver rating recalculation...');
        console.log('📊 Using new formula: (weightedScore / 20)');
        console.log('');

        // Fetch all drivers
        const drivers = await fetchAllDrivers();

        if (drivers.length === 0) {
            console.log('⚠️  No drivers found to recalculate');
            return;
        }

        let successCount = 0;
        let errorCount = 0;
        const results = [];

        // Process each driver
        for (const driver of drivers) {
            try {
                console.log(`🔄 Processing driver: ${driver.name || driver.email}`);

                // Get driver metrics (you may need to adjust this based on your API)
                const metrics = {
                    acceptanceRate: driver.acceptanceRate || 0,
                    completionRate: driver.completionRate || 0,
                    responseTime: driver.responseTime || 0,
                    reliability: driver.reliability || 0,
                    customerSatisfaction: driver.customerSatisfaction || 0
                };

                // Calculate new rating
                const ratingData = calculateNewRating(metrics);

                console.log(`   📊 Metrics:`, metrics);
                console.log(`   ⭐ Old Rating: ${ratingData.oldRating.toFixed(1)}`);
                console.log(`   ⭐ New Rating: ${ratingData.finalRating.toFixed(1)}`);
                console.log(`   📈 Change: ${(ratingData.finalRating - ratingData.oldRating).toFixed(1)}`);

                // Update driver rating
                const updateSuccess = await updateDriverRating(driver._id, ratingData.finalRating);

                if (updateSuccess) {
                    successCount++;
                    results.push({
                        driverId: driver._id,
                        name: driver.name || driver.email,
                        oldRating: ratingData.oldRating,
                        newRating: ratingData.finalRating,
                        change: ratingData.finalRating - ratingData.oldRating
                    });
                    console.log(`   ✅ Updated successfully`);
                } else {
                    errorCount++;
                    console.log(`   ❌ Update failed`);
                }

                console.log('');

                // Add small delay to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                errorCount++;
                console.error(`❌ Error processing driver ${driver._id}:`, error.message);
            }
        }

        // Summary
        console.log('📊 RECALCULATION SUMMARY');
        console.log('========================');
        console.log(`✅ Successfully updated: ${successCount} drivers`);
        console.log(`❌ Failed updates: ${errorCount} drivers`);
        console.log(`📈 Total processed: ${drivers.length} drivers`);
        console.log('');

        // Show rating distribution
        const ratingDistribution = {};
        results.forEach(result => {
            const rating = result.newRating.toFixed(1);
            ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
        });

        console.log('📊 NEW RATING DISTRIBUTION');
        console.log('==========================');
        Object.entries(ratingDistribution)
            .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
            .forEach(([rating, count]) => {
                console.log(`⭐ ${rating} stars: ${count} drivers`);
            });

        console.log('');
        console.log('🎉 Rating recalculation completed!');

    } catch (error) {
        console.error('💥 Fatal error during recalculation:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    recalculateAllRatings()
        .then(() => {
            console.log('✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Script failed:', error.message);
            process.exit(1);
        });
}

module.exports = {
    recalculateAllRatings,
    calculateNewRating
};
