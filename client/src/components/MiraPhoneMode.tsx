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
  handleVoiceResponse: (audioUrl: string, transcript: string) => Promise<void>;
}

// Use newest video file with no background
const miraVideo = '/mira-avatar-newest.mp4';

// Mesmerizing data visualization with thin lines
const DataCluster = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full">
        {/* Central nexus */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/80"></div>
        
        {/* Complex web network with thin lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))' }}>
          {/* Radial spokes */}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i * 22.5) * Math.PI / 180;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const endX = centerX + Math.cos(angle) * 200;
            const endY = centerY + Math.sin(angle) * 200;
            
            return (
              <line
                key={`spoke-${i}`}
                x1={centerX}
                y1={centerY}
                x2={endX}
                y2={endY}
                stroke="rgba(16, 185, 129, 0.3)"
                strokeWidth="0.5"
                className="animate-pulse"
                style={{ 
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${2 + (i % 4)}s`
                }}
              />
            );
          })}
          
          {/* Concentric geometric patterns */}
          {Array.from({ length: 8 }).map((_, ring) => {
            const radius = 40 + ring * 25;
            const points = 6 + ring * 2;
            
            return Array.from({ length: points }).map((_, point) => {
              const angle1 = (point * (360 / points)) * Math.PI / 180;
              const angle2 = ((point + 1) * (360 / points)) * Math.PI / 180;
              const centerX = window.innerWidth / 2;
              const centerY = window.innerHeight / 2;
              const x1 = centerX + Math.cos(angle1) * radius;
              const y1 = centerY + Math.sin(angle1) * radius;
              const x2 = centerX + Math.cos(angle2) * radius;
              const y2 = centerY + Math.sin(angle2) * radius;
              
              return (
                <line
                  key={`ring-${ring}-${point}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(16, 185, 129, 0.25)"
                  strokeWidth="0.5"
                  className="animate-pulse"
                  style={{ 
                    animationDelay: `${ring * 0.2 + point * 0.05}s`,
                    animationDuration: `${3 + ring * 0.3}s`
                  }}
                />
              );
            });
          })}
          
          {/* Cross-connecting web */}
          {Array.from({ length: 40 }).map((_, i) => {
            const angle1 = (i * 9) * Math.PI / 180;
            const angle2 = ((i + 5) * 9) * Math.PI / 180;
            const radius1 = 60 + (i % 4) * 30;
            const radius2 = 80 + (i % 3) * 40;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const x1 = centerX + Math.cos(angle1) * radius1;
            const y1 = centerY + Math.sin(angle1) * radius1;
            const x2 = centerX + Math.cos(angle2) * radius2;
            const y2 = centerY + Math.sin(angle2) * radius2;
            
            return (
              <line
                key={`web-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(16, 185, 129, 0.15)"
                strokeWidth="0.5"
                className="animate-pulse"
                style={{ 
                  animationDelay: `${i * 0.05}s`,
                  animationDuration: `${2 + (i % 5)}s`
                }}
              />
            );
          })}
          
          {/* Spiral patterns */}
          {Array.from({ length: 3 }).map((_, spiral) => {
            const points = 60;
            return Array.from({ length: points - 1 }).map((_, i) => {
              const t1 = (i / points) * 4 * Math.PI;
              const t2 = ((i + 1) / points) * 4 * Math.PI;
              const radius1 = 20 + t1 * 8 + spiral * 15;
              const radius2 = 20 + t2 * 8 + spiral * 15;
              const centerX = window.innerWidth / 2;
              const centerY = window.innerHeight / 2;
              const x1 = centerX + Math.cos(t1 + spiral * 2) * radius1;
              const y1 = centerY + Math.sin(t1 + spiral * 2) * radius1;
              const x2 = centerX + Math.cos(t2 + spiral * 2) * radius2;
              const y2 = centerY + Math.sin(t2 + spiral * 2) * radius2;
              
              return (
                <line
                  key={`spiral-${spiral}-${i}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(6, 214, 160, 0.2)"
                  strokeWidth="0.5"
                  className="animate-pulse"
                  style={{ 
                    animationDelay: `${spiral * 0.5 + i * 0.02}s`,
                    animationDuration: `${4 + spiral}s`
                  }}
                />
              );
            });
          })}
        </svg>
        
        {/* Flowing data streams */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 45) * Math.PI / 180;
          return (
            <div
              key={`stream-${i}`}
              className="absolute w-px h-32 bg-gradient-to-t from-transparent via-emerald-400 to-transparent"
              style={{
                left: '50%',
                top: '50%',
                transformOrigin: 'bottom center',
                transform: `rotate(${i * 45}deg) translateY(-100px)`,
                animation: `stream-flow ${2 + i * 0.3}s infinite ease-in-out`,
                animationDelay: `${i * 0.2}s`
              }}
            />
          );
        })}
        
        {/* Enhanced particle field with multiple layers */}
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${1 + (i % 4)}px`,
              height: `${1 + (i % 4)}px`,
              backgroundColor: i % 4 === 0 ? '#10b981' : i % 4 === 1 ? '#06b6d4' : i % 4 === 2 ? '#8b5cf6' : '#f59e0b',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `particle-drift ${4 + Math.random() * 6}s infinite linear`,
              animationDelay: `${Math.random() * 4}s`,
              opacity: 0.3 + Math.random() * 0.7,
              filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.8))',
              transform: `scale(${0.5 + Math.random() * 1.5})`
            }}
          />
        ))}
        
        {/* Rotating geometric elements */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`rotating-geo-${i}`}
              className="absolute border border-emerald-400/30"
              style={{
                width: `${60 + i * 20}px`,
                height: `${60 + i * 20}px`,
                borderRadius: i % 2 === 0 ? '50%' : '0%',
                animation: `energy-pulse ${8 + i * 2}s infinite ease-in-out`,
                animationDelay: `${i * 0.5}s`,
                transform: `rotate(${i * 72}deg)`,
                clipPath: i % 3 === 0 ? 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' : 'none'
              }}
            />
          ))}
        </div>
        
        {/* Energy waves */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`energy-wave-${i}`}
            className="absolute inset-0 border-2 border-emerald-400/20 rounded-full pointer-events-none"
            style={{
              animation: `energy-wave ${3 + i * 0.5}s infinite ease-out`,
              animationDelay: `${i * 0.4}s`,
              transform: 'scale(0)'
            }}
          />
        ))}
        
        {/* Floating data nodes */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`data-node-${i}`}
            className="absolute w-3 h-3 border-2 border-cyan-400/60 rounded-full pointer-events-none"
            style={{
              left: `${20 + (i * 6)}%`,
              top: `${30 + Math.sin(i * 0.5) * 40}%`,
              animation: `floating-orb ${4 + (i % 3)}s infinite ease-in-out`,
              animationDelay: `${i * 0.3}s`,
              backgroundColor: i % 3 === 0 ? 'rgba(16, 185, 129, 0.3)' : i % 3 === 1 ? 'rgba(6, 182, 212, 0.3)' : 'rgba(139, 92, 246, 0.3)',
              filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))',
              transform: `rotate(${i * 30}deg) translateX(${40 + i * 5}px)`
            }}
          />
        ))}
        
        {/* Electromagnetic field lines with enhanced effects */}
        <div className="absolute inset-0 bg-gradient-radial from-emerald-400/8 via-transparent to-cyan-400/8 animate-pulse" style={{ animationDuration: '2s' }}></div>
        <div className="absolute inset-0 bg-gradient-conic from-emerald-400/5 via-transparent to-emerald-400/5 animate-spin" style={{ animationDuration: '15s' }}></div>
        <div className="absolute inset-0 bg-gradient-conic from-cyan-400/4 via-transparent to-purple-400/4 animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }}></div>
        
        {/* Neural pathways */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }}>
          <defs>
            <linearGradient id="pathwayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.8)" />
              <stop offset="50%" stopColor="rgba(6, 182, 212, 0.6)" />
              <stop offset="100%" stopColor="rgba(139, 92, 246, 0.4)" />
            </linearGradient>
          </defs>
          {Array.from({ length: 15 }).map((_, i) => {
            const startX = 10 + (i * 6);
            const startY = 20 + Math.sin(i * 0.3) * 30;
            const midX = startX + 30 + Math.cos(i * 0.5) * 20;
            const midY = startY + 20 + Math.sin(i * 0.7) * 25;
            const endX = midX + 25 + Math.cos(i * 0.9) * 15;
            const endY = midY + 30 + Math.sin(i * 1.1) * 20;
            
            return (
              <path
                key={`pathway-${i}`}
                d={`M ${startX}% ${startY}% Q ${midX}% ${midY}% ${endX}% ${endY}%`}
                stroke="url(#pathwayGradient)"
                strokeWidth="1.5"
                fill="none"
                opacity="0.7"
                style={{
                  animation: `floating-orb ${5 + i * 0.3}s infinite ease-in-out`,
                  animationDelay: `${i * 0.2}s`,
                  strokeDasharray: '5,5',
                  strokeDashoffset: `${i * 2}`
                }}
              />
            );
          })}
        </svg>
        
        {/* Orbital elements */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {Array.from({ length: 4 }).map((_, orbit) => (
            <div key={`orbit-${orbit}`} className="absolute">
              {Array.from({ length: 3 + orbit }).map((_, satellite) => (
                <div
                  key={`satellite-${orbit}-${satellite}`}
                  className="absolute w-2 h-2 bg-emerald-400/60 rounded-full"
                  style={{
                    animation: `energy-pulse ${6 + orbit}s infinite ease-in-out`,
                    animationDelay: `${satellite * (2 / (3 + orbit))}s`,
                    transform: `rotate(${satellite * (360 / (3 + orbit))}deg) translateX(${80 + orbit * 30}px) scale(${1 + orbit * 0.2})`,
                    filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.8))'
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* Data pulse rings */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`pulse-ring-${i}`}
            className="absolute border border-cyan-400/25 rounded-full pointer-events-none"
            style={{
              width: `${40 + i * 15}px`,
              height: `${40 + i * 15}px`,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              animation: `energy-wave ${2 + i * 0.3}s infinite ease-out`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
        
        {/* Dynamic trajectory lines */}
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i * 36) * Math.PI / 180;
          return (
            <div
              key={`trajectory-${i}`}
              className="absolute w-px h-20 bg-gradient-to-t from-transparent via-purple-400/50 to-transparent pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                transformOrigin: 'bottom center',
                transform: `rotate(${i * 36}deg) translateY(-60px)`,
                animation: `stream-flow ${3 + i * 0.2}s infinite ease-in-out`,
                animationDelay: `${i * 0.15}s`,
                filter: 'blur(0.5px)'
              }}
            />
          );
        })}
        
        {/* Morphing geometric patterns */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {Array.from({ length: 3 }).map((_, layer) => (
            <div
              key={`morph-layer-${layer}`}
              className="absolute border border-emerald-400/20 pointer-events-none"
              style={{
                width: `${100 + layer * 40}px`,
                height: `${100 + layer * 40}px`,
                borderRadius: '50%',
                animation: `energy-pulse ${10 + layer * 3}s infinite ease-in-out`,
                animationDelay: `${layer * 1}s`,
                transform: `rotate(${layer * 120}deg)`,
                clipPath: layer % 2 === 0 
                  ? 'polygon(50% 0%, 0% 100%, 100% 100%)' 
                  : 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
              }}
            />
          ))}
        </div>
        
        {/* Data flow indicators */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`flow-indicator-${i}`}
            className="absolute flex items-center justify-center pointer-events-none"
            style={{
              left: `${30 + i * 8}%`,
              top: `${25 + Math.sin(i) * 20}%`,
              animation: `floating-orb ${4 + i * 0.5}s infinite ease-in-out`,
              animationDelay: `${i * 0.4}s`
            }}
          >
            <div className="w-1 h-1 bg-cyan-400/80 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
            <div className="w-1 h-1 bg-emerald-400/60 rounded-full animate-pulse ml-1" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-1 bg-purple-400/40 rounded-full animate-pulse ml-1" style={{ animationDelay: '0.4s' }}></div>
          </div>
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

  // Handle voice response with perfect audio-video sync
  const handleVoiceResponse = useCallback(async (audioUrl: string, transcript: string) => {
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
        console.log('Audio ended, fading out video');
        if (videoRef.current) {
          videoRef.current.pause();
        }
        // Trigger fade-out by setting isMiraActive to false in parent
        setTimeout(() => {
          // This will cause the parent to set isMiraActive to false
          // and trigger the fade transition back to data cluster
        }, 500);
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