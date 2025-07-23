// Preload critical frames immediately on page load
(function() {
  'use strict';
  
  console.log('🚀 Starting critical frame preloader...');
  
  // Preload first 10 frames immediately
  const criticalFrames = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  criticalFrames.forEach(frameIndex => {
    const img = new Image();
    const frameNumber = String(frameIndex).padStart(4, '0');
    img.src = `/mira_frames_optimized/frame_${frameNumber}.jpg`;
    
    img.onload = () => {
      console.log(`✅ Critical frame ${frameNumber} preloaded`);
    };
    
    img.onerror = (e) => {
      console.error(`❌ Failed to preload critical frame ${frameNumber}:`, e);
    };
  });
  
  console.log('🎯 Critical frame preloader initiated');
})();