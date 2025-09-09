#!/usr/bin/env node

/**
 * Script to help reduce API spam in development
 * This script provides options to optimize development server behavior
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 API Spam Reduction Tool');
console.log('==========================\n');

// Check if we're in development
const isDev = process.env.NODE_ENV === 'development';

if (!isDev) {
    console.log('⚠️  This tool is designed for development environment only.');
    console.log('   Set NODE_ENV=development to use this tool.\n');
}

// Function to restart development server with optimized settings
function restartDevServer() {
    console.log('🔄 Restarting development server with optimized settings...');

    try {
        // Kill existing processes
        console.log('   Stopping existing development server...');
        execSync('pkill -f "react-scripts start"', { stdio: 'ignore' });

        // Wait a moment
        setTimeout(() => {
            console.log('   Starting optimized development server...');
            execSync('npm start', { stdio: 'inherit' });
        }, 2000);

    } catch (error) {
        console.log('   No existing server found, starting fresh...');
        execSync('npm start', { stdio: 'inherit' });
    }
}

// Function to clear browser cache and service worker
function clearBrowserCache() {
    console.log('🧹 Clearing browser cache and service worker...');
    console.log('   Please manually clear your browser cache and unregister the service worker:');
    console.log('   1. Open Developer Tools (F12)');
    console.log('   2. Go to Application tab');
    console.log('   3. Click "Clear storage" or "Unregister" for service worker');
    console.log('   4. Refresh the page\n');
}

// Function to show current optimization status
function showStatus() {
    console.log('📊 Current Optimization Status:');
    console.log('===============================');

    // Check service worker
    const swPath = path.join(__dirname, '../public/service-worker.js');
    if (fs.existsSync(swPath)) {
        const swContent = fs.readFileSync(swPath, 'utf8');
        const hasHmrSkip = swContent.includes('Skip Hot Module Replacement');
        console.log(`   Service Worker HMR Skip: ${hasHmrSkip ? '✅ Enabled' : '❌ Disabled'}`);
    }

    // Check polling intervals
    const devConfigPath = path.join(__dirname, '../src/config/development.js');
    if (fs.existsSync(devConfigPath)) {
        console.log('   Development Config: ✅ Available');
    } else {
        console.log('   Development Config: ❌ Missing');
    }

    console.log('\n   Optimizations Applied:');
    console.log('   • Socket status polling: 30s (was 5s)');
    console.log('   • Connection checks: 30s (was 5s)');
    console.log('   • Online status checks: 2min (was 1min)');
    console.log('   • Service worker skips HMR requests');
    console.log('   • Reduced API polling frequency\n');
}

// Function to show network monitoring tips
function showMonitoringTips() {
    console.log('🔍 Network Monitoring Tips:');
    console.log('===========================');
    console.log('1. Open Developer Tools (F12)');
    console.log('2. Go to Network tab');
    console.log('3. Filter by "Fetch/XHR" to see API requests');
    console.log('4. Look for patterns in request frequency');
    console.log('5. Check for HMR requests (hot-update, webpack-hmr)');
    console.log('6. Monitor WebSocket connections in Network tab\n');

    console.log('🚨 Signs of API Spam:');
    console.log('• Multiple identical requests per second');
    console.log('• Requests with alternating 304/200 status codes');
    console.log('• Requests to hot-update or webpack-hmr endpoints');
    console.log('• High frequency polling (every 1-5 seconds)\n');
}

// Main menu
function showMenu() {
    console.log('Available Options:');
    console.log('1. Show current optimization status');
    console.log('2. Restart development server');
    console.log('3. Clear browser cache instructions');
    console.log('4. Show network monitoring tips');
    console.log('5. Exit\n');

    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Choose an option (1-5): ', (answer) => {
        switch (answer.trim()) {
            case '1':
                showStatus();
                rl.close();
                break;
            case '2':
                restartDevServer();
                rl.close();
                break;
            case '3':
                clearBrowserCache();
                rl.close();
                break;
            case '4':
                showMonitoringTips();
                rl.close();
                break;
            case '5':
                console.log('👋 Goodbye!');
                rl.close();
                break;
            default:
                console.log('❌ Invalid option. Please choose 1-5.');
                showMenu();
        }
    });
}

// Run the tool
if (require.main === module) {
    showStatus();
    showMenu();
}

module.exports = {
    restartDevServer,
    clearBrowserCache,
    showStatus,
    showMonitoringTips
};


