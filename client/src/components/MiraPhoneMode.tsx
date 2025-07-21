import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, ArrowLeft } from 'lucide-react';

interface MiraPhoneModeProps {
  isRecording: boolean;
  isProcessing: boolean;
  isConnected: boolean;
  isMiraActive: boolean;
  currentTranscription: string;
  onToggleRecording: () => void;
  onBack: () => void;
}

export interface MiraPhoneModeRef {
  handleVoiceResponse: (audioUrl: string, transcript: string, onAudioEnd?: () => void) => Promise<void>;
}

// Use the correct video file from attached assets
const miraVideo = '/attached_assets/Mira CyberPunk BG Talking_1753109718925.mp4';

// Elegant starfield visualization with distant glowing stars
const DataCluster = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full">
        {/* Central nexus - smaller and more subtle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-emerald-400/60 rounded-full animate-pulse shadow-sm shadow-emerald-400/40" style={{ animationDuration: '3s' }}></div>
        
        {/* Enhanced moving star field */}
        {Array.from({ length: 50 }).map((_, i) => {
          const x = Math.random() * 100;
          const y = Math.random() * 100;
          const size = 1 + Math.random() * 2.5;
          const brightness = 0.4 + Math.random() * 0.6;
          const colors = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b'];
          const color = colors[i % 4];
          
          return (
            <div
              key={`star-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                opacity: brightness,
                left: `${x}%`,
                top: `${y}%`,
                animation: `floating-orb ${2 + Math.random() * 3}s infinite ease-in-out, pulse ${1.5 + Math.random() * 2}s infinite ease-in-out`,
                animationDelay: `${i * 0.1}s, ${i * 0.2}s`,
                filter: `drop-shadow(0 0 ${3 + size}px ${color})`,
                transform: `scale(${0.8 + Math.random() * 0.4})`
              }}
            />
          );
        })}
        
        {/* Dynamic connecting lines with movement */}
        <svg className="absolute inset-0 w-full h-full opacity-50">
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30) * Math.PI / 180;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const endX = centerX + Math.cos(angle) * (120 + Math.sin(i * 0.5) * 40);
            const endY = centerY + Math.sin(angle) * (120 + Math.cos(i * 0.7) * 40);
            
            return (
              <line
                key={`connection-${i}`}
                x1={centerX}
                y1={centerY}
                x2={endX}
                y2={endY}
                stroke="rgba(16, 185, 129, 0.25)"
                strokeWidth="0.8"
                style={{ 
                  animation: `pulse 3s infinite ease-in-out, floating-orb 4s infinite ease-in-out`,
                  animationDelay: `${i * 0.2}s, ${i * 0.3}s`,
                  strokeDasharray: '4,4',
                  strokeDashoffset: `${i * 2}`
                }}
              />
            );
          })}
        </svg>
        
        {/* Enhanced rotating rings with pulse */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`ring-${i}`}
            className="absolute border rounded-full"
            style={{
              width: `${180 + i * 80}px`,
              height: `${180 + i * 80}px`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              borderColor: i % 3 === 0 ? 'rgba(16, 185, 129, 0.2)' : i % 3 === 1 ? 'rgba(6, 182, 212, 0.15)' : 'rgba(139, 92, 246, 0.1)',
              animation: `spin ${20 + i * 10}s infinite linear, pulse ${4 + i}s infinite ease-in-out`,
              animationDirection: i % 2 === 0 ? 'normal, normal' : 'reverse, normal',
              animationDelay: `0s, ${i * 0.8}s`
            }}
          />
        ))}
        
        {/* Dynamic floating orbs with orbital movement */}
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i * 18) * Math.PI / 180;
          const radius = 60 + (i % 4) * 30;
          const x = 50 + Math.cos(angle) * (radius / 6);
          const y = 50 + Math.sin(angle) * (radius / 6);
          
          return (
            <div
              key={`orb-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
                backgroundColor: i % 4 === 0 ? '#10b981' : i % 4 === 1 ? '#06b6d4' : i % 4 === 2 ? '#8b5cf6' : '#f59e0b',
                opacity: 0.6 + Math.random() * 0.4,
                left: `${x}%`,
                top: `${y}%`,
                animation: `floating-orb ${3 + (i % 4)}s infinite ease-in-out, pulse ${2 + (i % 3)}s infinite ease-in-out`,
                animationDelay: `${i * 0.3}s, ${i * 0.4}s`,
                filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.7))',
                transform: `scale(${0.8 + (i % 3) * 0.3})`
              }}
            />
          );
        })}
        
        {/* Enhanced energy streams with movement */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 45) * Math.PI / 180;
          
          return (
            <div
              key={`stream-${i}`}
              className="absolute bg-gradient-to-r from-emerald-400/40 via-cyan-400/20 to-transparent"
              style={{
                width: `${60 + Math.sin(i) * 20}px`,
                height: '1px',
                top: '50%',
                left: '50%',
                transformOrigin: '0 0',
                transform: `rotate(${angle * 180 / Math.PI}deg)`,
                animation: `pulse 4s infinite ease-in-out, floating-orb 6s infinite ease-in-out`,
                animationDelay: `${i * 0.5}s, ${i * 0.7}s`,
                filter: 'blur(0.3px)'
              }}
            />
          );
        })}
        
        {/* Additional particle effects */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              width: '1px',
              height: '1px',
              backgroundColor: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#06b6d4' : '#8b5cf6',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `floating-orb ${2 + Math.random() * 4}s infinite ease-in-out, pulse ${1 + Math.random() * 2}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 2}s, ${Math.random() * 3}s`,
              opacity: 0.3 + Math.random() * 0.5,
              filter: 'drop-shadow(0 0 2px rgba(16, 185, 129, 0.8))'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export const MiraPhoneMode = forwardRef<MiraPhoneModeRef, MiraPhoneModeProps>(({ 
  isRecording, 
  isProcessing, 
  isConnected, 
  isMiraActive, 
  currentTranscription,
  onToggleRecording,
  onBack 
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isVideoPreloaded, setIsVideoPreloaded] = useState(false);

  // Preload video immediately on component mount and fix frozen frame
  useEffect(() => {
    const video = videoRef.current;
    if (video && !isVideoPreloaded) {
      console.log('🎬 Preloading Mira video and preventing frozen frame...');
      
      // Force preload and prepare video
      video.preload = 'auto';
      video.load();
      
      const handleCanPlayThrough = () => {
        console.log('✅ Video fully preloaded and ready for instant playback');
        setIsVideoPreloaded(true);
        setIsVideoReady(true);
        video.playbackRate = 0.85;
        
        // CRITICAL: Prevent frozen frame by briefly playing then pausing
        video.play().then(() => {
          // Let it play for one frame then pause to show proper first frame
          setTimeout(() => {
            video.pause();
            video.currentTime = 0;
            console.log('🎯 Video preloaded and first frame active (no frozen state)');
          }, 50);
        }).catch(e => {
          console.log('Video preload play attempt (expected):', e);
          // This is expected if autoplay is blocked, video will still be ready
        });
      };
      
      const handleLoadedData = () => {
        console.log('📹 Video data loaded');
        setIsVideoReady(true);
        video.playbackRate = 0.85;
      };
      
      // Use multiple events to ensure readiness
      video.addEventListener('canplaythrough', handleCanPlayThrough);
      video.addEventListener('loadeddata', handleLoadedData);
      
      return () => {
        video.removeEventListener('canplaythrough', handleCanPlayThrough);
        video.removeEventListener('loadeddata', handleLoadedData);
      };
    }
  }, [isVideoPreloaded]);

  // Handle voice response with perfect audio-video sync and no lag
  const handleVoiceResponse = useCallback(async (audioUrl: string, transcript: string, onAudioEnd?: () => void) => {
    try {
      console.log('🎵 Starting lag-free synchronized playback:', audioUrl);
      
      // Stop any current audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Create new audio with immediate readiness
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.preload = 'auto';
      audio.volume = 1.0;

      // Wait for both audio and video to be completely ready
      const audioReadyPromise = new Promise((resolve) => {
        if (audio.readyState >= 2) {
          resolve(true);
        } else {
          audio.addEventListener('canplay', () => resolve(true), { once: true });
        }
      });

      await audioReadyPromise;

      // Force video to play regardless of ready state - remove all conditionals
      if (videoRef.current) {
        console.log('🎬 Starting synchronized audio-video playback');
        
        // Reset video position and prepare for smooth start
        videoRef.current.currentTime = 0;
        videoRef.current.playbackRate = 0.85;
        
        // Start both immediately - video first, then audio
        try {
          await videoRef.current.play();
          await audio.play();
          console.log('✅ Synchronized playback started');
        } catch (error) {
          console.log('Playback error:', error);
          // Still try to play audio even if video fails
          audio.play().catch(e => console.log('Audio fallback:', e));
        }
      } else {
        console.log('⚡ Starting audio-only playback (no video element)');
        await audio.play();
      }

      // Handle audio end with fade-out effect
      audio.onended = () => {
        console.log('🏁 Audio ended, stopping video and triggering fast fade-out');
        if (videoRef.current) {
          videoRef.current.pause();
        }
        // Fast fade-out - 100ms delay as requested
        if (onAudioEnd) {
          setTimeout(() => {
            onAudioEnd();
          }, 100);
        }
      };

    } catch (error) {
      console.error('❌ Error with synchronized playback:', error);
      if (onAudioEnd) onAudioEnd();
    }
  }, [isVideoReady, isVideoPreloaded]);

  // Remove the old video control effect and replace with new sync logic
  useEffect(() => {
    // This effect is now handled by handleVoiceResponse for perfect sync
  }, []);

  // Expose handleVoiceResponse function for parent component
  useImperativeHandle(ref, () => ({
    handleVoiceResponse
  }), [handleVoiceResponse]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoEnd = () => {
      if (isMiraActive && isVideoReady) {
        console.log('Mira video ended, looping at 0.85x speed...');
        video.currentTime = 0;
        video.playbackRate = 0.85;
        video.play();
      }
    };

    video.addEventListener('ended', handleVideoEnd);
    return () => video.removeEventListener('ended', handleVideoEnd);
  }, [isMiraActive, isVideoReady]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col justify-center items-center">
      {/* Subtle back button */}
      <Button
        onClick={onBack}
        variant="ghost"
        size="sm"
        className="absolute top-4 left-4 z-30 opacity-30 hover:opacity-70 transition-opacity duration-200 text-emerald-300 hover:text-emerald-200"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>

      {/* Main content area - vertical layout */}
      <div className="relative w-full h-full flex flex-col justify-center items-center overflow-hidden">
        {/* Smooth transition between states */}
        <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${isMiraActive ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <DataCluster />
        </div>
        
        {/* Mira video with smooth fade-in and animated elements */}
        <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${isMiraActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105'} flex items-center justify-center`}>
          {/* Animated background elements surrounding the avatar */}
          {isMiraActive && (
            <>
              {/* Outer rotating energy rings - surrounding the avatar */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className="w-[500px] h-[500px] border border-emerald-400/15 rounded-full animate-spin" style={{ animationDuration: '25s' }}></div>
                <div className="absolute w-[600px] h-[600px] border border-cyan-400/10 rounded-full animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }}></div>
                <div className="absolute w-[700px] h-[700px] border border-emerald-300/8 rounded-full animate-spin" style={{ animationDuration: '35s' }}></div>
              </div>
              
              {/* Ambient energy field in background */}
              <div className="absolute inset-0 bg-gradient-radial from-emerald-400/5 via-transparent to-cyan-400/3 animate-pulse pointer-events-none z-0" style={{ animationDuration: '4s' }}></div>
              
              {/* Floating energy orbs surrounding avatar */}
              {[...Array(16)].map((_, i) => {
                const angle = (i * 22.5) * Math.PI / 180;
                const radius = 250 + (i % 3) * 50; // Keep orbs away from avatar center
                const centerX = 50;
                const centerY = 50;
                const x = centerX + Math.cos(angle) * (radius / 10);
                const y = centerY + Math.sin(angle) * (radius / 10);
                
                return (
                  <div
                    key={`energy-orb-${i}`}
                    className="absolute rounded-full pointer-events-none z-0"
                    style={{
                      width: `${3 + (i % 3) * 1}px`,
                      height: `${3 + (i % 3) * 1}px`,
                      backgroundColor: i % 4 === 0 ? '#10b981' : i % 4 === 1 ? '#06b6d4' : i % 4 === 2 ? '#8b5cf6' : '#f59e0b',
                      left: `${x}%`,
                      top: `${y}%`,
                      animation: `floating-orb ${4 + (i % 3)}s infinite ease-in-out`,
                      animationDelay: `${i * 0.2}s`,
                      filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
                    }}
                  />
                );
              })}
              
              {/* Hexagonal energy pattern */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={`hex-${i}`}
                    className="absolute w-32 h-32 border border-emerald-400/20 pointer-events-none"
                    style={{
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                      animation: `energy-pulse ${8 + i * 2}s infinite ease-in-out`,
                      animationDelay: `${i * 1.2}s`,
                      transform: `rotate(${i * 60}deg) scale(${0.8 + i * 0.1})`
                    }}
                  />
                ))}
              </div>
              
              {/* Energy streams */}
              {[...Array(4)].map((_, i) => (
                <div
                  key={`stream-${i}`}
                  className="absolute w-px h-24 bg-gradient-to-b from-emerald-400/60 via-cyan-400/40 to-transparent pointer-events-none"
                  style={{
                    left: `${25 + i * 16.67}%`,
                    top: `${20 + Math.sin(i) * 10}%`,
                    animation: `floating-orb ${4 + i}s infinite ease-in-out`,
                    animationDelay: `${i * 0.8}s`,
                    transform: `rotate(${i * 90}deg)`,
                    filter: 'blur(0.5px)'
                  }}
                />
              ))}
              
              {/* Dynamic corner accents */}
              <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-emerald-400/40 animate-pulse pointer-events-none"></div>
              <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-emerald-400/40 animate-pulse pointer-events-none" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-emerald-400/40 animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-emerald-400/40 animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }}></div>
              
              {/* Scanning lines effect */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" 
                     style={{ 
                       top: '25%',
                       animation: 'scan-line 4s infinite linear'
                     }}></div>
                <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" 
                     style={{ 
                       top: '75%',
                       animation: 'scan-line 6s infinite linear reverse',
                       animationDelay: '2s'
                     }}></div>
                <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" 
                     style={{ 
                       top: '50%',
                       animation: 'scan-line 8s infinite linear',
                       animationDelay: '4s'
                     }}></div>
              </div>
              
              {/* Digital artifacts */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={`artifact-${i}`}
                    className="absolute w-2 h-2 border border-emerald-400/40 pointer-events-none"
                    style={{
                      left: `${10 + i * 15}%`,
                      top: `${15 + (i % 2) * 60}%`,
                      animation: `energy-pulse ${5 + i}s infinite ease-in-out`,
                      animationDelay: `${i * 0.7}s`,
                      transform: `rotate(45deg) scale(${0.5 + (i % 3) * 0.3})`
                    }}
                  />
                ))}
              </div>
              
              {/* Neural network connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                <defs>
                  <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(16, 185, 129, 0.6)" />
                    <stop offset="50%" stopColor="rgba(6, 182, 212, 0.4)" />
                    <stop offset="100%" stopColor="rgba(139, 92, 246, 0.2)" />
                  </linearGradient>
                </defs>
                {[...Array(8)].map((_, i) => {
                  const startX = 20 + (i * 12);
                  const startY = 30 + Math.sin(i) * 20;
                  const endX = startX + 40 + Math.cos(i) * 30;
                  const endY = startY + 40 + Math.sin(i + 1) * 25;
                  
                  return (
                    <line
                      key={`connection-${i}`}
                      x1={`${startX}%`}
                      y1={`${startY}%`}
                      x2={`${endX}%`}
                      y2={`${endY}%`}
                      stroke="url(#connectionGradient)"
                      strokeWidth="1"
                      opacity="0.6"
                      style={{
                        animation: `floating-orb ${6 + i}s infinite ease-in-out`,
                        animationDelay: `${i * 0.5}s`
                      }}
                    />
                  );
                })}
              </svg>
            </>
          )}
          
          <video
            ref={videoRef}
            className="max-w-full max-h-full object-contain relative z-10"
            style={{ 
              backgroundColor: 'transparent'
            }}
            muted
            playsInline
            loop
            preload="auto"
            autoPlay={false}
            onPlay={() => {
              if (videoRef.current) {
                videoRef.current.playbackRate = 0.85;
                console.log('Video playing at 0.85x speed');
              }
            }}
            onLoadedData={() => {
              console.log('Mira video loaded successfully');
              if (!isVideoReady && videoRef.current) {
                setIsVideoReady(true);
                videoRef.current.playbackRate = 0.85;
                videoRef.current.currentTime = 0;
                console.log('Video data loaded and ready for instant playback');
              }
            }}
            onCanPlayThrough={() => {
              console.log('Mira video can play through without buffering');
              setIsVideoPreloaded(true);
              setIsVideoReady(true);
              if (videoRef.current) {
                // Ensure video is ready for instant playback
                videoRef.current.currentTime = 0;
                videoRef.current.playbackRate = 0.85;
              }
            }}
            onError={(e) => {
              console.error('Mira video error:', e);
              console.error('Video source:', miraVideo);
            }}
            onCanPlay={() => {
              console.log('Mira video can play');
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.playbackRate = 0.85;
              }
            }}
            onLoadStart={() => console.log('Mira video load started')}
          >
            <source src={miraVideo} type="video/mp4" />
          </video>
        </div>

        {/* Proportionate caption overlay when Mira is talking */}
        {isMiraActive && currentTranscription && (
          <div className="absolute bottom-24 left-4 right-4 z-10">
            <div className="bg-black/90 backdrop-blur-md rounded-2xl border border-emerald-400/40 shadow-lg shadow-emerald-400/20" 
                 style={{ 
                   padding: `${Math.max(16, Math.min(32, currentTranscription.length / 10))}px ${Math.max(20, Math.min(40, currentTranscription.length / 8))}px`
                 }}>
              <p className="text-white text-center titillium-web-regular leading-relaxed"
                 style={{ 
                   fontSize: `${Math.max(14, Math.min(24, 20 - currentTranscription.length / 50))}px`
                 }}>
                {currentTranscription}
              </p>
            </div>
          </div>
        )}

        {/* Simple microphone button - floating at bottom */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <Button
            onClick={onToggleRecording}
            disabled={isProcessing || !isConnected}
            className={`w-16 h-16 rounded-full border-2 transition-all duration-300 shadow-2xl ${
              isRecording 
                ? 'bg-red-500/80 border-red-300 scale-110 shadow-red-500/50' 
                : isProcessing
                ? 'bg-yellow-500/80 border-yellow-300 animate-pulse shadow-yellow-500/50'
                : 'bg-emerald-500/20 border-emerald-300 hover:bg-emerald-500/40 hover:scale-105 shadow-emerald-500/30'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            ) : isRecording ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-emerald-300" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});