# PWA Icon Conversion Guide

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
```bash
# Install ImageMagick first
brew install imagemagick  # macOS
# or
sudo apt-get install imagemagick  # Ubuntu

# Convert HTML to PNG (if you have a tool that can render HTML)
# This is a placeholder - you'll need to adapt based on your setup
```

### Option 4: Node.js Libraries
```bash
npm install puppeteer
# or
npm install canvas
```

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
```bash
node scripts/test-pwa.js
```
