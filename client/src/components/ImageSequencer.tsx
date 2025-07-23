import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';

interface ImageSequencerProps {
  isPlaying: boolean;
  frameRate?: number; // frames per second
  loop?: boolean;
  onLoadedData?: () => void;
  onCanPlay?: () => void;
  onCanPlayThrough?: () => void;
  onError?: (error: Error) => void;
  onPlay?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface ImageSequencerRef {
  play: () => void;
  pause: () => void;
  currentFrame: number;
  totalFrames: number;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
}

const ImageSequencer = forwardRef<ImageSequencerRef, ImageSequencerProps>(({
  isPlaying,
  frameRate = 30,
  loop = true,
  onLoadedData,
  onCanPlay,
  onCanPlayThrough,
  onError,
  onPlay,
  className,
  style
}, ref) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [frameCache, setFrameCache] = useState<Map<number, HTMLImageElement>>(new Map());
  const [playbackRate, setPlaybackRate] = useState(0.85);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const totalFrames = 350; // 0 to 349
  const bufferSize = 30; // Increased buffer for instant playback
  const [preloadedFrames, setPreloadedFrames] = useState<Set<number>>(new Set());

  // Optimized frame loading - only load current frame and buffer
  const loadFrame = useCallback((frameIndex: number): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (frameCache.has(frameIndex)) {
        resolve(frameCache.get(frameIndex)!);
        return;
      }

      const img = new Image();
      const frameNumber = String(frameIndex).padStart(4, '0');
      img.src = `/mira_frames_optimized/frame_${frameNumber}.jpg`;
      
      img.onload = () => {
        setFrameCache(prev => new Map(prev).set(frameIndex, img));
        setPreloadedFrames(prev => new Set(prev).add(frameIndex));
        resolve(img);
      };
      
      img.onerror = (e) => {
        console.error(`Failed to load frame ${frameNumber}:`, e);
        reject(new Error(`Failed to load frame ${frameNumber}`));
      };
    });
  }, [frameCache]);

  // Preload buffer frames around current position
  const preloadBuffer = useCallback(async (centerFrame: number) => {
    const framesToLoad: number[] = [];
    
    // Load current frame and next buffer frames
    for (let i = 0; i < bufferSize; i++) {
      const frameIndex = (centerFrame + i) % totalFrames;
      if (!frameCache.has(frameIndex)) {
        framesToLoad.push(frameIndex);
      }
    }

    // Load all frames simultaneously for instant loading
    await Promise.allSettled(framesToLoad.map(frameIndex => loadFrame(frameIndex)));
  }, [frameCache, bufferSize, totalFrames, loadFrame]);

  // Aggressive preloading strategy for instant playback
  useEffect(() => {
    const initializeSequencer = async () => {
      try {
        console.log('🚀 Starting aggressive preload strategy...');
        
        // Load first 30 frames immediately for instant start (optimized balance)
        const initialFrames = Array.from({length: 30}, (_, i) => i);
        await Promise.allSettled(initialFrames.map(frameIndex => loadFrame(frameIndex)));
        
        console.log('✅ First 30 frames preloaded');
        setIsLoaded(true);
        onLoadedData?.();
        onCanPlay?.();
        onCanPlayThrough?.();
        
        // Continue loading remaining frames in background with smart chunking
        const remainingFrames = Array.from({length: totalFrames - 30}, (_, i) => i + 30);
        
        // Load in chunks of 20 frames with small delays for non-blocking
        const chunkSize = 20;
        let chunkIndex = 0;
        
        const loadChunk = () => {
          if (chunkIndex < remainingFrames.length) {
            const chunk = remainingFrames.slice(chunkIndex, chunkIndex + chunkSize);
            Promise.allSettled(chunk.map(frameIndex => loadFrame(frameIndex)))
              .then(() => {
                chunkIndex += chunkSize;
                setTimeout(loadChunk, 100); // Small delay between chunks
              });
          } else {
            console.log('🎯 All 350 frames fully preloaded');
          }
        };
        
        setTimeout(loadChunk, 500); // Start background loading after initial frames
        
      } catch (error) {
        console.error('Error initializing image sequencer:', error);
        if (onError) {
          const errorEvent = error instanceof Event ? error : new ErrorEvent('error');
          onError(errorEvent);
        }
      }
    };
    
    initializeSequencer();
  }, [loadFrame, onLoadedData, onCanPlay, onCanPlayThrough, onError, totalFrames]);

  // Smart buffer management - preload ahead of current frame
  useEffect(() => {
    if (isLoaded) {
      // Preload buffer around current frame in background
      const bufferTimeout = setTimeout(() => {
        preloadBuffer(currentFrame);
      }, 100); // Small delay to avoid blocking main thread

      return () => clearTimeout(bufferTimeout);
    }
  }, [currentFrame, isLoaded, preloadBuffer]);

  // Animation control with optimized frame loading
  useEffect(() => {
    if (isPlaying && isLoaded) {
      const actualFrameRate = frameRate * playbackRate;
      const interval = 1000 / actualFrameRate;
      
      intervalRef.current = setInterval(() => {
        setCurrentFrame(prev => {
          const nextFrame = prev + 1;
          if (nextFrame >= totalFrames) {
            return loop ? 0 : prev;
          }
          return nextFrame;
        });
      }, interval);

      onPlay?.();
      console.log(`Image sequencer playing at ${playbackRate}x speed`);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, isLoaded, frameRate, playbackRate, loop, totalFrames, onPlay]);

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    play: () => setCurrentFrame(0),
    pause: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    },
    currentFrame,
    totalFrames,
    playbackRate,
    setPlaybackRate: (rate: number) => {
      setPlaybackRate(rate);
      console.log(`Image sequencer playback rate set to ${rate}x`);
    }
  }), [currentFrame, totalFrames, playbackRate]);

  // Get current frame image from cache
  const currentImage = frameCache.get(currentFrame);
  
  if (!isLoaded) {
    return (
      <div className={className} style={style}>
        <div className="flex items-center justify-center h-full text-emerald-400">
          Loading...
        </div>
      </div>
    );
  }

  // If current frame not in cache, show loading or previous frame
  if (!currentImage) {
    const frameNumber = String(currentFrame).padStart(4, '0');
    return (
      <img
        src={`/mira_frames_optimized/frame_${frameNumber}.jpg`}
        alt={`Mira frame ${currentFrame}`}
        className={className}
        style={style}
        onLoad={() => {
          if (currentFrame === 0) {
            console.log('📹 Image sequence data loaded');
          }
        }}
        onError={() => {
          console.warn(`Frame ${frameNumber} not cached, loading on demand`);
        }}
      />
    );
  }

  return (
    <img
      src={currentImage.src}
      alt={`Mira frame ${currentFrame}`}
      className={className}
      style={style}
      onLoad={() => {
        if (currentFrame === 0) {
          console.log('📹 Image sequence data loaded');
        }
      }}
    />
  );
});

ImageSequencer.displayName = 'ImageSequencer';

export default ImageSequencer;