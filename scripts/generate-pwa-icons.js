#!/usr/bin/env node

/**
 * PWA Icon Generator Script
 * Generates all required PWA icons from the existing favicon
 */

const fs = require('fs');
const path = require('path');

// Icon sizes required for PWA
const iconSizes = [
    { size: 16, name: 'icon-16x16.png' },
    { size: 32, name: 'icon-32x32.png' },
    { size: 72, name: 'icon-72x72.png' },
    { size: 96, name: 'icon-96x96.png' },
    { size: 128, name: 'icon-128x128.png' },
    { size: 144, name: 'icon-144x144.png' },
    { size: 152, name: 'icon-152x152.png' },
    { size: 192, name: 'icon-192x192.png' },
    { size: 384, name: 'icon-384x384.png' },
    { size: 512, name: 'icon-512x512.png' }
];

// Create a simple SVG icon as fallback
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

// Create a simple HTML file to convert SVG to PNG (placeholder)
const createIconHTML = (size, filename) => {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; }
    svg { width: ${size}px; height: ${size}px; }
  </style>
</head>
<body>
  ${createSVGIcon(size)}
</body>
</html>`;
};

// Generate icons
function generateIcons() {
    const iconsDir = path.join(__dirname, '..', 'public', 'icons');

    // Ensure icons directory exists
    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
    }

    console.log('🎨 Generating PWA icons...');

    // Create HTML files for each icon size (these can be converted to PNG manually)
    iconSizes.forEach(({ size, name }) => {
        const htmlContent = createIconHTML(size, name);
        const htmlPath = path.join(iconsDir, name.replace('.png', '.html'));

        fs.writeFileSync(htmlPath, htmlContent);
        console.log(`✅ Created ${name.replace('.png', '.html')} (${size}x${size})`);
    });

    // Create a simple favicon.ico
    const faviconSVG = createSVGIcon(32);
    const faviconPath = path.join(__dirname, '..', 'public', 'favicon.svg');
    fs.writeFileSync(faviconPath, faviconSVG);
    console.log('✅ Created favicon.svg');

    // Create a README with instructions
    const readmeContent = `# PWA Icons

This directory contains the generated PWA icons for Greep SDS.

## Icon Sizes Generated:
${iconSizes.map(({ size, name }) => `- ${name} (${size}x${size}px)`).join('\n')}

## Manual Conversion Required:
The HTML files in this directory need to be converted to PNG format. You can:

1. Open each HTML file in a browser
2. Take a screenshot or use browser dev tools to save as PNG
3. Or use online SVG to PNG converters
4. Or use tools like ImageMagick, GIMP, or online converters

## Recommended Tools:
- Online: https://convertio.co/svg-png/
- Desktop: GIMP, ImageMagick, or any image editor
- Command line: ImageMagick (convert command)

## Icon Design:
- Blue gradient background (#0a84ff to #667eea)
- White "S" letter (main logo)
- White "SDS" text below
- Rounded corners (80px radius)

## Usage:
Once converted to PNG, these icons will be used by the PWA manifest for:
- App installation
- Home screen icons
- Splash screens
- App shortcuts
`;

    const readmePath = path.join(iconsDir, 'README.md');
    fs.writeFileSync(readmePath, readmeContent);
    console.log('✅ Created README.md with conversion instructions');

    console.log('\n🎉 PWA icon generation complete!');
    console.log('📝 Next steps:');
    console.log('1. Convert the HTML files to PNG format');
    console.log('2. Place the PNG files in the /public/icons/ directory');
    console.log('3. Test the PWA installation');
}

// Run the script
if (require.main === module) {
    generateIcons();
}

module.exports = { generateIcons, iconSizes };
