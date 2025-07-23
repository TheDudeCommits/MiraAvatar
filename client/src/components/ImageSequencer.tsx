import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

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
  const [preloadedImages, setPreloadedImages] = useState<HTMLImageElement[]>([]);
  const [playbackRate, setPlaybackRate] = useState(0.85); // Match video playback rate
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const totalFrames = 350; // 0 to 349

  // Preload images
  useEffect(() => {
    const loadImages = async () => {
      try {
        const images: HTMLImageElement[] = [];
        let loadedCount = 0;
        
        for (let i = 0; i < totalFrames; i++) {
          const img = new Image();
          const frameNumber = String(i).padStart(4, '0');
          img.src = `/mira_frames/frame_${frameNumber}.png`;
          
          img.onload = () => {
            loadedCount++;
            if (loadedCount === totalFrames) {
              setIsLoaded(true);
              onLoadedData?.();
              onCanPlay?.();
              onCanPlayThrough?.();
              console.log('✅ All image frames preloaded and ready for instant playback');
            }
          };
          
          img.onerror = (e) => {
            console.error(`Failed to load frame ${frameNumber}:`, e);
            onError?.(new Error(`Failed to load frame ${frameNumber}`));
          };
          
          images.push(img);
        }
        
        setPreloadedImages(images);
      } catch (error) {
        console.error('Error loading image sequence:', error);
        onError?.(error as Error);
      }
    };

    loadImages();
  }, [totalFrames, onLoadedData, onCanPlay, onCanPlayThrough, onError]);

  // Animation control
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

  if (!isLoaded || preloadedImages.length === 0) {
    return (
      <div className={className} style={style}>
        <div className="flex items-center justify-center h-full text-emerald-400">
          Loading frames...
        </div>
      </div>
    );
  }

  const currentImage = preloadedImages[currentFrame];

  return (
    <img
      src={currentImage?.src}
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