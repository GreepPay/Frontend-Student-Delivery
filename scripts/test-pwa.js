#!/usr/bin/env node

/**
 * PWA Test Script
 * Tests PWA functionality and provides a comprehensive report
 */

const fs = require('fs');
const path = require('path');

// PWA Test Results
const testResults = {
    manifest: { passed: 0, failed: 0, tests: [] },
    serviceWorker: { passed: 0, failed: 0, tests: [] },
    icons: { passed: 0, failed: 0, tests: [] },
    metaTags: { passed: 0, failed: 0, tests: [] },
    offline: { passed: 0, failed: 0, tests: [] }
};

// Test Manifest
function testManifest() {
    console.log('🔍 Testing Web App Manifest...');

    const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');

    try {
        if (!fs.existsSync(manifestPath)) {
            testResults.manifest.tests.push({
                name: 'Manifest file exists',
                status: 'FAILED',
                message: 'manifest.json not found'
            });
            testResults.manifest.failed++;
            return;
        }

        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestContent);

        // Test required fields
        const requiredFields = [
            'name', 'short_name', 'start_url', 'display', 'background_color', 'theme_color', 'icons'
        ];

        requiredFields.forEach(field => {
            if (manifest[field]) {
                testResults.manifest.tests.push({
                    name: `Manifest has ${field}`,
                    status: 'PASSED',
                    message: `${field}: ${manifest[field]}`
                });
                testResults.manifest.passed++;
            } else {
                testResults.manifest.tests.push({
                    name: `Manifest has ${field}`,
                    status: 'FAILED',
                    message: `Missing required field: ${field}`
                });
                testResults.manifest.failed++;
            }
        });

        // Test icons
        if (manifest.icons && Array.isArray(manifest.icons)) {
            testResults.manifest.tests.push({
                name: 'Manifest has icons array',
                status: 'PASSED',
                message: `Found ${manifest.icons.length} icons`
            });
            testResults.manifest.passed++;
        } else {
            testResults.manifest.tests.push({
                name: 'Manifest has icons array',
                status: 'FAILED',
                message: 'Icons array is missing or invalid'
            });
            testResults.manifest.failed++;
        }

        console.log('✅ Manifest tests completed');
    } catch (error) {
        testResults.manifest.tests.push({
            name: 'Manifest parsing',
            status: 'FAILED',
            message: `Error parsing manifest: ${error.message}`
        });
        testResults.manifest.failed++;
    }
}

// Test Service Worker
function testServiceWorker() {
    console.log('🔍 Testing Service Worker...');

    const swPath = path.join(__dirname, '..', 'public', 'service-worker.js');

    try {
        if (!fs.existsSync(swPath)) {
            testResults.serviceWorker.tests.push({
                name: 'Service Worker file exists',
                status: 'FAILED',
                message: 'service-worker.js not found'
            });
            testResults.serviceWorker.failed++;
            return;
        }

        const swContent = fs.readFileSync(swPath, 'utf8');

        // Test required service worker features
        const requiredFeatures = [
            'addEventListener(\'install\'',
            'addEventListener(\'activate\'',
            'addEventListener(\'fetch\'',
            'caches.open',
            'caches.match'
        ];

        requiredFeatures.forEach(feature => {
            if (swContent.includes(feature)) {
                testResults.serviceWorker.tests.push({
                    name: `Service Worker has ${feature}`,
                    status: 'PASSED',
                    message: 'Feature found in service worker'
                });
                testResults.serviceWorker.passed++;
            } else {
                testResults.serviceWorker.tests.push({
                    name: `Service Worker has ${feature}`,
                    status: 'FAILED',
                    message: `Missing feature: ${feature}`
                });
                testResults.serviceWorker.failed++;
            }
        });

        // Test caching strategies
        const cachingStrategies = [
            'cache-first',
            'network-first',
            'network-first-with-offline-fallback'
        ];

        cachingStrategies.forEach(strategy => {
            if (swContent.includes(strategy)) {
                testResults.serviceWorker.tests.push({
                    name: `Service Worker has ${strategy} strategy`,
                    status: 'PASSED',
                    message: 'Caching strategy found'
                });
                testResults.serviceWorker.passed++;
            }
        });

        console.log('✅ Service Worker tests completed');
    } catch (error) {
        testResults.serviceWorker.tests.push({
            name: 'Service Worker file reading',
            status: 'FAILED',
            message: `Error reading service worker: ${error.message}`
        });
        testResults.serviceWorker.failed++;
    }
}

// Test Icons
function testIcons() {
    console.log('🔍 Testing PWA Icons...');

    const iconsDir = path.join(__dirname, '..', 'public', 'icons');
    const requiredSizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

    try {
        if (!fs.existsSync(iconsDir)) {
            testResults.icons.tests.push({
                name: 'Icons directory exists',
                status: 'FAILED',
                message: 'Icons directory not found'
            });
            testResults.icons.failed++;
            return;
        }

        const iconFiles = fs.readdirSync(iconsDir);

        testResults.icons.tests.push({
            name: 'Icons directory exists',
            status: 'PASSED',
            message: `Found ${iconFiles.length} icon files`
        });
        testResults.icons.passed++;

        // Check for required icon sizes
        requiredSizes.forEach(size => {
            const iconFile = `icon-${size}x${size}.png`;
            const iconPath = path.join(iconsDir, iconFile);

            if (fs.existsSync(iconPath)) {
                testResults.icons.tests.push({
                    name: `Icon ${size}x${size} exists`,
                    status: 'PASSED',
                    message: `Found ${iconFile}`
                });
                testResults.icons.passed++;
            } else {
                testResults.icons.tests.push({
                    name: `Icon ${size}x${size} exists`,
                    status: 'FAILED',
                    message: `Missing ${iconFile}`
                });
                testResults.icons.failed++;
            }
        });

        console.log('✅ Icon tests completed');
    } catch (error) {
        testResults.icons.tests.push({
            name: 'Icons directory access',
            status: 'FAILED',
            message: `Error accessing icons directory: ${error.message}`
        });
        testResults.icons.failed++;
    }
}

// Test Meta Tags
function testMetaTags() {
    console.log('🔍 Testing PWA Meta Tags...');

    const indexPath = path.join(__dirname, '..', 'public', 'index.html');

    try {
        if (!fs.existsSync(indexPath)) {
            testResults.metaTags.tests.push({
                name: 'Index.html exists',
                status: 'FAILED',
                message: 'index.html not found'
            });
            testResults.metaTags.failed++;
            return;
        }

        const indexContent = fs.readFileSync(indexPath, 'utf8');

        // Test required meta tags
        const requiredMetaTags = [
            'theme-color',
            'apple-mobile-web-app-capable',
            'apple-mobile-web-app-status-bar-style',
            'apple-mobile-web-app-title',
            'msapplication-TileColor',
            'application-name',
            'mobile-web-app-capable'
        ];

        requiredMetaTags.forEach(tag => {
            if (indexContent.includes(tag)) {
                testResults.metaTags.tests.push({
                    name: `Meta tag ${tag} exists`,
                    status: 'PASSED',
                    message: 'Meta tag found'
                });
                testResults.metaTags.passed++;
            } else {
                testResults.metaTags.tests.push({
                    name: `Meta tag ${tag} exists`,
                    status: 'FAILED',
                    message: `Missing meta tag: ${tag}`
                });
                testResults.metaTags.failed++;
            }
        });

        // Test manifest link
        if (indexContent.includes('rel="manifest"')) {
            testResults.metaTags.tests.push({
                name: 'Manifest link exists',
                status: 'PASSED',
                message: 'Manifest link found'
            });
            testResults.metaTags.passed++;
        } else {
            testResults.metaTags.tests.push({
                name: 'Manifest link exists',
                status: 'FAILED',
                message: 'Manifest link not found'
            });
            testResults.metaTags.failed++;
        }

        // Test service worker registration
        if (indexContent.includes('serviceWorker.register') || indexContent.includes('service-worker.js')) {
            testResults.metaTags.tests.push({
                name: 'Service Worker registration exists',
                status: 'PASSED',
                message: 'Service worker registration found'
            });
            testResults.metaTags.passed++;
        } else {
            testResults.metaTags.tests.push({
                name: 'Service Worker registration exists',
                status: 'FAILED',
                message: 'Service worker registration not found'
            });
            testResults.metaTags.failed++;
        }

        console.log('✅ Meta tags tests completed');
    } catch (error) {
        testResults.metaTags.tests.push({
            name: 'Index.html reading',
            status: 'FAILED',
            message: `Error reading index.html: ${error.message}`
        });
        testResults.metaTags.failed++;
    }
}

// Test Offline Support
function testOfflineSupport() {
    console.log('🔍 Testing Offline Support...');

    const offlinePath = path.join(__dirname, '..', 'public', 'offline.html');

    try {
        if (!fs.existsSync(offlinePath)) {
            testResults.offline.tests.push({
                name: 'Offline page exists',
                status: 'FAILED',
                message: 'offline.html not found'
            });
            testResults.offline.failed++;
            return;
        }

        const offlineContent = fs.readFileSync(offlinePath, 'utf8');

        // Test offline page features
        const offlineFeatures = [
            'You\'re Offline',
            'Try Again',
            'addEventListener("online"',
            'addEventListener("offline"',
            'navigator.onLine'
        ];

        offlineFeatures.forEach(feature => {
            if (offlineContent.includes(feature)) {
                testResults.offline.tests.push({
                    name: `Offline page has ${feature}`,
                    status: 'PASSED',
                    message: 'Feature found in offline page'
                });
                testResults.offline.passed++;
            } else {
                testResults.offline.tests.push({
                    name: `Offline page has ${feature}`,
                    status: 'FAILED',
                    message: `Missing feature: ${feature}`
                });
                testResults.offline.failed++;
            }
        });

        console.log('✅ Offline support tests completed');
    } catch (error) {
        testResults.offline.tests.push({
            name: 'Offline page reading',
            status: 'FAILED',
            message: `Error reading offline page: ${error.message}`
        });
        testResults.offline.failed++;
    }
}

// Generate Report
function generateReport() {
    console.log('\n📊 PWA Test Report');
    console.log('='.repeat(50));

    const categories = ['manifest', 'serviceWorker', 'icons', 'metaTags', 'offline'];
    let totalPassed = 0;
    let totalFailed = 0;

    categories.forEach(category => {
        const results = testResults[category];
        const total = results.passed + results.failed;
        const percentage = total > 0 ? Math.round((results.passed / total) * 100) : 0;

        console.log(`\n📋 ${category.toUpperCase()} (${percentage}% - ${results.passed}/${total})`);
        console.log('-'.repeat(30));

        results.tests.forEach(test => {
            const status = test.status === 'PASSED' ? '✅' : '❌';
            console.log(`${status} ${test.name}`);
            if (test.message) {
                console.log(`   ${test.message}`);
            }
        });

        totalPassed += results.passed;
        totalFailed += results.failed;
    });

    const overallTotal = totalPassed + totalFailed;
    const overallPercentage = overallTotal > 0 ? Math.round((totalPassed / overallTotal) * 100) : 0;

    console.log('\n🎯 OVERALL RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${overallTotal}`);
    console.log(`Passed: ${totalPassed} (${overallPercentage}%)`);
    console.log(`Failed: ${totalFailed}`);

    if (overallPercentage >= 90) {
        console.log('\n🎉 EXCELLENT! Your PWA is ready for production!');
    } else if (overallPercentage >= 80) {
        console.log('\n👍 GOOD! Your PWA is mostly ready, but check the failed tests.');
    } else if (overallPercentage >= 70) {
        console.log('\n⚠️  FAIR! Your PWA needs some improvements before going live.');
    } else {
        console.log('\n❌ POOR! Your PWA needs significant work before it\'s ready.');
    }

    console.log('\n📝 Next Steps:');
    console.log('1. Fix any failed tests above');
    console.log('2. Convert HTML icon files to PNG format');
    console.log('3. Test PWA installation in browser');
    console.log('4. Test offline functionality');
    console.log('5. Deploy to HTTPS for full PWA features');

    return {
        totalPassed,
        totalFailed,
        overallPercentage,
        results: testResults
    };
}

// Run all tests
function runTests() {
    console.log('🚀 Starting PWA Tests for Greep SDS...\n');

    testManifest();
    testServiceWorker();
    testIcons();
    testMetaTags();
    testOfflineSupport();

    return generateReport();
}

// Run the tests
if (require.main === module) {
    runTests();
}

module.exports = { runTests, testResults };
