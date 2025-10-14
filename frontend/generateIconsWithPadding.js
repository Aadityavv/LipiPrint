const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_IMAGE = './src/AppLogo.jpeg';
const PADDING_PERCENTAGE = 0.1; // 10% padding on all sides (logo will be 80% of icon size)

// iOS icon sizes
const iosIcons = [
  { size: 20, scale: 2, name: '20@2x.png' },
  { size: 20, scale: 3, name: '20@3x.png' },
  { size: 29, scale: 2, name: '29@2x.png' },
  { size: 29, scale: 3, name: '29@3x.png' },
  { size: 40, scale: 2, name: '40@2x.png' },
  { size: 40, scale: 3, name: '40@3x.png' },
  { size: 60, scale: 2, name: '60@2x.png' },
  { size: 60, scale: 3, name: '60@3x.png' },
  { size: 1024, scale: 1, name: '1024.png' },
];

// Android icon sizes (mipmap densities)
const androidIcons = [
  { folder: 'mipmap-ldpi', size: 36 },
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

// Android adaptive icon foreground sizes
const androidAdaptiveIcons = [
  { folder: 'mipmap-ldpi-v26', size: 81 },
  { folder: 'mipmap-mdpi-v26', size: 108 },
  { folder: 'mipmap-hdpi-v26', size: 162 },
  { folder: 'mipmap-xhdpi-v26', size: 216 },
  { folder: 'mipmap-xxhdpi-v26', size: 324 },
  { folder: 'mipmap-xxxhdpi-v26', size: 432 },
];

async function generateIconsWithPadding() {
  console.log('🎨 Generating app icons with padding...\n');

  // Generate iOS icons
  console.log('📱 Generating iOS icons...');
  const iosPath = './ios/LipiPrintApp/Images.xcassets/AppIcon.appiconset';
  
  for (const icon of iosIcons) {
    const outputSize = icon.size * icon.scale;
    const logoSize = Math.floor(outputSize * (1 - PADDING_PERCENTAGE * 2)); // Logo size with padding
    const padding = Math.floor((outputSize - logoSize) / 2);
    const outputPath = path.join(iosPath, icon.name);
    
    await sharp(INPUT_IMAGE)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`  ✅ Created ${icon.name} (${outputSize}x${outputSize}) with ${padding}px padding`);
  }

  // Generate Android standard icons
  console.log('\n🤖 Generating Android icons...');
  const androidResPath = './android/app/src/main/res';
  
  for (const icon of androidIcons) {
    const folderPath = path.join(androidResPath, icon.folder);
    const logoSize = Math.floor(icon.size * (1 - PADDING_PERCENTAGE * 2));
    const padding = Math.floor((icon.size - logoSize) / 2);
    
    // Standard icon
    const outputPath = path.join(folderPath, 'ic_launcher.png');
    await sharp(INPUT_IMAGE)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(outputPath);
    
    // Round icon
    const roundOutputPath = path.join(folderPath, 'ic_launcher_round.png');
    await sharp(INPUT_IMAGE)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(roundOutputPath);
    
    console.log(`  ✅ Created ${icon.folder}/ic_launcher.png (${icon.size}x${icon.size}) with ${padding}px padding`);
  }

  // Generate Android adaptive icons (foreground) - these need more padding for adaptive icons
  console.log('\n🎯 Generating Android adaptive icons...');
  const adaptivePaddingPercentage = 0.15; // 15% padding for adaptive icons
  
  for (const icon of androidAdaptiveIcons) {
    const folderPath = path.join(androidResPath, icon.folder);
    const logoSize = Math.floor(icon.size * (1 - adaptivePaddingPercentage * 2));
    const padding = Math.floor((icon.size - logoSize) / 2);
    const outputPath = path.join(folderPath, 'ic_foreground.png');
    
    await sharp(INPUT_IMAGE)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`  ✅ Created ${icon.folder}/ic_foreground.png (${icon.size}x${icon.size}) with ${padding}px padding`);
  }

  console.log('\n✨ All icons generated with padding!');
  console.log('📏 Standard icons: 10% padding (logo is 80% of icon size)');
  console.log('🎯 Adaptive icons: 15% padding (logo is 70% of icon size)');
  console.log('🚀 You can now rebuild your app to see the new icons with padding.');
}

generateIconsWithPadding().catch(err => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
});
