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

// Use newest video file with no background
const miraVideo = '/mira-avatar-newest.mp4';

// Elegant starfield visualization with distant glowing stars
const DataCluster = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full">
        {/* Central nexus - smaller and more subtle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-emerald-400/60 rounded-full animate-pulse shadow-sm shadow-emerald-400/40" style={{ animationDuration: '3s' }}></div>
        
        {/* Distant star field */}
        {Array.from({ length: 40 }).map((_, i) => {
          const x = Math.random() * 100;
          const y = Math.random() * 100;
          const size = 1 + Math.random() * 2;
          const brightness = 0.3 + Math.random() * 0.4;
          const colors = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b'];
          const color = colors[i % 4];
          
          return (
            <div
              key={`star-${i}`}
              className="absolute rounded-full animate-pulse"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                opacity: brightness,
                left: `${x}%`,
                top: `${y}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${4 + Math.random() * 4}s`,
                filter: `drop-shadow(0 0 ${2 + size}px ${color})`
              }}
            />
          );
        })}
        
        {/* Simple connecting lines - fewer and thinner */}
        <svg className="absolute inset-0 w-full h-full opacity-40">
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45) * Math.PI / 180;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const endX = centerX + Math.cos(angle) * 150;
            const endY = centerY + Math.sin(angle) * 150;
            
            return (
              <line
                key={`connection-${i}`}
                x1={centerX}
                y1={centerY}
                x2={endX}
                y2={endY}
                stroke="rgba(16, 185, 129, 0.15)"
                strokeWidth="0.5"
                className="animate-pulse"
                style={{ 
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: '6s'
                }}
              />
            );
          })}
        </svg>
        
        {/* Slow rotating rings - smaller and more subtle */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={`ring-${i}`}
            className="absolute border border-emerald-400/10 rounded-full animate-spin"
            style={{
              width: `${200 + i * 100}px`,
              height: `${200 + i * 100}px`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animationDuration: `${60 + i * 30}s`,
              animationDirection: i % 2 === 0 ? 'normal' : 'reverse'
            }}
          />
        ))}
        
        {/* Gentle floating orbs - fewer and softer */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30) * Math.PI / 180;
          const radius = 80 + (i % 3) * 40;
          const x = 50 + Math.cos(angle) * (radius / 8);
          const y = 50 + Math.sin(angle) * (radius / 8);
          
          return (
            <div
              key={`orb-${i}`}
              className="absolute rounded-full animate-pulse"
              style={{
                width: '2px',
                height: '2px',
                backgroundColor: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#06b6d4' : '#8b5cf6',
                opacity: 0.4,
                left: `${x}%`,
                top: `${y}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: '8s',
                filter: 'drop-shadow(0 0 3px rgba(16, 185, 129, 0.5))'
              }}
            />
          );
        })}
        
        {/* Soft energy streams - slower and more subtle */}
        {Array.from({ length: 4 }).map((_, i) => {
          const angle = (i * 90) * Math.PI / 180;
          
          return (
            <div
              key={`stream-${i}`}
              className="absolute bg-gradient-to-r from-emerald-400/20 via-cyan-400/10 to-transparent"
              style={{
                width: '80px',
                height: '0.5px',
                top: '50%',
                left: '50%',
                transformOrigin: '0 0',
                transform: `rotate(${angle * 180 / Math.PI}deg)`,
                animation: `pulse 8s infinite ease-in-out`,
                animationDelay: `${i * 1}s`
              }}
            />
          );
        })}
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

  // Handle voice response with perfect audio-video sync
  const handleVoiceResponse = useCallback(async (audioUrl: string, transcript: string, onAudioEnd?: () => void) => {
    try {
      console.log('Starting synchronized audio-video playback:', audioUrl);
      
      // Stop any current audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Create new audio and wait for it to load
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Wait for audio to be ready
      await new Promise((resolve, reject) => {
        audio.onloadeddata = resolve;
        audio.onerror = reject;
      });

      // Start both video and audio simultaneously for perfect sync
      if (videoRef.current && isVideoReady) {
        videoRef.current.currentTime = 0;
        videoRef.current.playbackRate = 0.85;
        
        // Start both at exactly the same time
        await Promise.all([
          audio.play(),
          videoRef.current.play()
        ]);
        
        console.log('Audio and video synchronized and playing');
      } else {
        // Just play audio if video isn't ready
        await audio.play();
      }

      // Handle audio end with fade-out effect
      audio.onended = () => {
        console.log('Audio ended, stopping video and triggering fade-out');
        if (videoRef.current) {
          videoRef.current.pause();
        }
        // Call the callback to trigger fade-out in parent
        if (onAudioEnd) {
          onAudioEnd();
        }
      };

    } catch (error) {
      console.error('Error with synchronized playback:', error);
    }
  }, [isVideoReady]);

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
        console.log('Mira video ended, looping...');
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
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isMiraActive ? 'opacity-0' : 'opacity-100'}`}>
          <DataCluster />
        </div>
        
        {/* Mira video with smooth fade-in and animated elements */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isMiraActive ? 'opacity-100' : 'opacity-0'} flex items-center justify-center`}>
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
            onLoadedData={() => {
              console.log('Mira video loaded successfully');
              setIsVideoReady(true);
              if (videoRef.current) {
                videoRef.current.playbackRate = 0.85;
              }
            }}
            onError={(e) => {
              console.error('Mira video error:', e);
              console.error('Video source:', miraVideo);
            }}
            onCanPlay={() => console.log('Mira video can play')}
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