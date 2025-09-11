#!/usr/bin/env node

/**
 * Generate VAPID keys for push notifications
 * Run with: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push');

console.log('🔑 Generating VAPID keys for push notifications...\n');

try {
    const vapidKeys = webpush.generateVAPIDKeys();

    console.log('✅ VAPID Keys Generated Successfully!\n');
    console.log('📋 Copy these keys to your environment variables:\n');
    console.log('Public Key (for frontend):');
    console.log(`REACT_APP_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\n`);
    console.log('Private Key (for backend - keep secret!):');
    console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`);
    console.log('VAPID Email (for identification):');
    console.log(`VAPID_EMAIL=mailto:your-email@example.com\n`);

    console.log('🔧 Next steps:');
    console.log('1. Add these to your .env files');
    console.log('2. Update the getVapidPublicKey() method in pwaService.js');
    console.log('3. Configure your backend to use the private key for sending push notifications');
    console.log('4. Test push notifications in your app\n');

    console.log('⚠️  Security Note:');
    console.log('- Keep the private key secret and never commit it to version control');
    console.log('- Use environment variables to store these keys');
    console.log('- The public key can be safely exposed in your frontend code\n');

} catch (error) {
    console.error('❌ Error generating VAPID keys:', error.message);
    console.log('\n💡 Make sure you have web-push installed:');
    console.log('npm install web-push');
    process.exit(1);
}
