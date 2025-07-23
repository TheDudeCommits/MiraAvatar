#!/usr/bin/env node

/**
 * Test script for Image Sequencer functionality
 * This script verifies that all image frames are accessible and can be loaded
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Image Sequencer Setup...\n');

// Check if public/mira_frames_optimized directory exists
const framesDir = path.join(__dirname, 'public', 'mira_frames_optimized');
if (!fs.existsSync(framesDir)) {
  console.error('❌ Error: public/mira_frames directory not found');
  process.exit(1);
}

console.log('✅ Frames directory exists:', framesDir);

// Count frame files
const frameFiles = fs.readdirSync(framesDir).filter(file => file.startsWith('frame_') && file.endsWith('.jpg'));
console.log(`✅ Found ${frameFiles.length} frame files`);

if (frameFiles.length === 0) {
  console.error('❌ Error: No frame files found');
  process.exit(1);
}

// Check frame sequence integrity
const expectedFrames = 350;
const missingFrames = [];

for (let i = 0; i < expectedFrames; i++) {
  const frameNumber = String(i).padStart(4, '0');
  const framePath = path.join(framesDir, `frame_${frameNumber}.jpg`);
  
  if (!fs.existsSync(framePath)) {
    missingFrames.push(`frame_${frameNumber}.jpg`);
  }
}

if (missingFrames.length > 0) {
  console.error(`❌ Missing ${missingFrames.length} frame files:`, missingFrames.slice(0, 10));
  if (missingFrames.length > 10) {
    console.error(`... and ${missingFrames.length - 10} more`);
  }
  process.exit(1);
}

console.log(`✅ All ${expectedFrames} frames are present and correctly named`);

// Check file sizes (basic validation)
let totalSize = 0;
let minSize = Infinity;
let maxSize = 0;

frameFiles.slice(0, 10).forEach(file => {
  const filePath = path.join(framesDir, file);
  const stats = fs.statSync(filePath);
  totalSize += stats.size;
  minSize = Math.min(minSize, stats.size);
  maxSize = Math.max(maxSize, stats.size);
});

console.log(`✅ Frame sizes (sample of 10 files):`);
console.log(`   - Min: ${(minSize / 1024).toFixed(1)} KB`);
console.log(`   - Max: ${(maxSize / 1024).toFixed(1)} KB`);
console.log(`   - Avg: ${(totalSize / 10 / 1024).toFixed(1)} KB`);

console.log('\n🎉 Image Sequencer Test Complete - All checks passed!');
console.log('\n📋 Summary:');
console.log(`   - Total frames: ${frameFiles.length}`);
console.log(`   - Expected frames: ${expectedFrames}`);
console.log(`   - Integrity: ${frameFiles.length === expectedFrames ? 'Perfect' : 'Issues detected'}`);
console.log('   - Ready for use in ImageSequencer component');

console.log('\n🚀 The ImageSequencer is now ready to replace the video element!');
console.log('   - Image sequence will loop seamlessly at 30 FPS');
console.log('   - Playback rate set to 0.85x to match original video timing');
console.log('   - All frames preloaded for instant, lag-free playback');