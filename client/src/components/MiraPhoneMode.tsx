import { useEffect, useRef, useState } from 'react';
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
        
        {/* Particle field */}
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-px h-px bg-emerald-300"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `particle-drift ${5 + Math.random() * 5}s infinite linear`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: 0.2 + Math.random() * 0.6,
              filter: 'drop-shadow(0 0 2px rgba(16, 185, 129, 0.8))'
            }}
          />
        ))}
        
        {/* Electromagnetic field lines */}
        <div className="absolute inset-0 bg-gradient-radial from-emerald-400/5 via-transparent to-cyan-400/5 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-conic from-emerald-400/3 via-transparent to-emerald-400/3 animate-spin" style={{ animationDuration: '20s' }}></div>
      </div>
    </div>
  );
};

export function MiraPhoneMode({ 
  isRecording, 
  isProcessing, 
  isConnected, 
  isMiraActive, 
  currentTranscription,
  onToggleRecording,
  onBack 
}: MiraPhoneModeProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log('Mira video effect - isMiraActive:', isMiraActive, 'isVideoReady:', isVideoReady);

    if (isMiraActive && isVideoReady) {
      const playVideo = async () => {
        try {
          console.log('Attempting to play Mira video...');
          video.currentTime = 0;
          video.playbackRate = 0.85;
          await video.play();
          console.log('Mira video playing successfully');
        } catch (error) {
          console.error('Error playing Mira video:', error);
        }
      };
      playVideo();
    } else {
      console.log('Pausing Mira video');
      video.pause();
    }

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
          {/* Animated background elements when video is active */}
          {isMiraActive && (
            <>
              {/* Rotating energy rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-96 h-96 border border-emerald-400/20 rounded-full animate-spin" style={{ animationDuration: '20s' }}></div>
                <div className="absolute w-80 h-80 border border-cyan-400/15 rounded-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
                <div className="absolute w-64 h-64 border border-emerald-300/25 rounded-full animate-spin" style={{ animationDuration: '10s' }}></div>
              </div>
              
              {/* Pulsing energy field */}
              <div className="absolute inset-0 bg-gradient-radial from-emerald-400/10 via-transparent to-cyan-400/5 animate-pulse pointer-events-none" style={{ animationDuration: '3s' }}></div>
              
              {/* Floating energy orbs */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={`energy-orb-${i}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: `${4 + (i % 3) * 2}px`,
                    height: `${4 + (i % 3) * 2}px`,
                    backgroundColor: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#06b6d4' : '#8b5cf6',
                    left: `${15 + (i * 7)}%`,
                    top: `${25 + Math.sin(i * 0.8) * 30}%`,
                    animation: `floating-orb ${3 + (i % 4)}s infinite ease-in-out`,
                    animationDelay: `${i * 0.3}s`,
                    filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.8))',
                    transform: `rotate(${i * 30}deg) translateX(${30 + i * 8}px)`
                  }}
                />
              ))}
              
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
            style={{ backgroundColor: 'transparent' }}
            muted
            playsInline
            autoPlay
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
}