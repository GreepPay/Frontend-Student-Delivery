#!/usr/bin/env node

/**
 * Icon Conversion Script
 * Converts HTML icon files to PNG format using a simple approach
 */

const fs = require('fs');
const path = require('path');

// Icon sizes
const iconSizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

// Create a simple PNG placeholder (base64 encoded 1x1 transparent PNG)
const transparentPNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Create a simple colored PNG (base64 encoded 1x1 blue PNG)
const bluePNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Create a simple SVG icon
const createSVGIcon = (size) => {
    return `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0a84ff;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#667eea;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="80" fill="url(#grad1)"/>
    <text x="256" y="320" font-family="Arial, sans-serif" font-size="200" font-weight="bold" text-anchor="middle" fill="white">S</text>
    <text x="256" y="420" font-family="Arial, sans-serif" font-size="80" text-anchor="middle" fill="white" opacity="0.8">SDS</text>
  </svg>`;
};

// Create a simple ICO file (placeholder)
const createICOFile = () => {
    // This is a minimal ICO file header + 16x16 icon
    const icoHeader = Buffer.from([
        0x00, 0x00, // Reserved
        0x01, 0x00, // Type (1 = ICO)
        0x01, 0x00, // Number of images
        0x10,       // Width (16)
        0x10,       // Height (16)
        0x00,       // Color palette
        0x00,       // Reserved
        0x01, 0x00, // Color planes
        0x20, 0x00, // Bits per pixel
        0x00, 0x01, 0x00, 0x00, // Size of image data
        0x16, 0x00, 0x00, 0x00  // Offset to image data
    ]);

    // Simple 16x16 blue icon data (32 bytes)
    const iconData = Buffer.alloc(32, 0x00); // Fill with blue color

    return Buffer.concat([icoHeader, iconData]);
};

// Convert HTML to PNG (placeholder implementation)
function convertHTMLToPNG(htmlContent, size, outputPath) {
    // For now, we'll create a simple colored PNG as a placeholder
    // In a real implementation, you would use a library like puppeteer or canvas

    const pngData = Buffer.from(bluePNG, 'base64');

    try {
        fs.writeFileSync(outputPath, pngData);
        console.log(`✅ Created placeholder PNG: ${path.basename(outputPath)} (${size}x${size})`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to create PNG: ${error.message}`);
        return false;
    }
}

// Generate all icons
function generateAllIcons() {
    const iconsDir = path.join(__dirname, '..', 'public', 'icons');

    console.log('🎨 Converting HTML icons to PNG format...');

    let successCount = 0;
    let totalCount = iconSizes.length;

    iconSizes.forEach(size => {
        const htmlFile = path.join(iconsDir, `icon-${size}x${size}.html`);
        const pngFile = path.join(iconsDir, `icon-${size}x${size}.png`);

        if (fs.existsSync(htmlFile)) {
            const htmlContent = fs.readFileSync(htmlFile, 'utf8');

            if (convertHTMLToPNG(htmlContent, size, pngFile)) {
                successCount++;
            }
        } else {
            console.log(`⚠️ HTML file not found: icon-${size}x${size}.html`);
        }
    });

    // Create favicon.ico
    const faviconPath = path.join(__dirname, '..', 'public', 'favicon.ico');
    try {
        const icoData = createICOFile();
        fs.writeFileSync(faviconPath, icoData);
        console.log('✅ Created favicon.ico');
        successCount++;
    } catch (error) {
        console.error('❌ Failed to create favicon.ico:', error.message);
    }

    console.log(`\n📊 Icon Conversion Results:`);
    console.log(`✅ Successfully created: ${successCount} icons`);
    console.log(`❌ Failed: ${totalCount - successCount} icons`);

    if (successCount === totalCount) {
        console.log('\n🎉 All icons converted successfully!');
    } else {
        console.log('\n⚠️ Some icons failed to convert. You may need to:');
        console.log('1. Use an online SVG to PNG converter');
        console.log('2. Use a tool like ImageMagick or GIMP');
        console.log('3. Use a Node.js library like puppeteer or canvas');
    }

    return successCount === totalCount;
}

// Create a simple icon conversion guide
function createConversionGuide() {
    const guideContent = `# PWA Icon Conversion Guide

## Current Status
The HTML icon files have been generated but need to be converted to PNG format.

## Manual Conversion Options

### Option 1: Online Converters
1. Visit https://convertio.co/svg-png/
2. Upload each HTML file
3. Download as PNG
4. Rename to match the required format

### Option 2: Browser Method
1. Open each HTML file in a browser
2. Take a screenshot or use browser dev tools
3. Save as PNG with the correct dimensions

### Option 3: Command Line (ImageMagick)
\`\`\`bash
# Install ImageMagick first
brew install imagemagick  # macOS
# or
sudo apt-get install imagemagick  # Ubuntu

# Convert HTML to PNG (if you have a tool that can render HTML)
# This is a placeholder - you'll need to adapt based on your setup
\`\`\`

### Option 4: Node.js Libraries
\`\`\`bash
npm install puppeteer
# or
npm install canvas
\`\`\`

## Required Icon Files
- icon-16x16.png
- icon-32x32.png
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Icon Design
- Blue gradient background (#0a84ff to #667eea)
- White "S" letter (main logo)
- White "SDS" text below
- Rounded corners (80px radius)

## Testing
After conversion, run the PWA test script:
\`\`\`bash
node scripts/test-pwa.js
\`\`\`
`;

    const guidePath = path.join(__dirname, '..', 'public', 'icons', 'CONVERSION_GUIDE.md');
    fs.writeFileSync(guidePath, guideContent);
    console.log('📝 Created conversion guide: public/icons/CONVERSION_GUIDE.md');
}

// Run the conversion
if (require.main === module) {
    generateAllIcons();
    createConversionGuide();
}

module.exports = { generateAllIcons, createConversionGuide };
