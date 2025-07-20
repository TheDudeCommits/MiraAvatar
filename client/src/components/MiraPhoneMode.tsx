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

    if (isMiraActive) {
      const playVideo = async () => {
        try {
          video.currentTime = 0;
          video.playbackRate = 0.85;
          await video.play();
        } catch (error) {
          console.error('Error playing Mira video:', error);
        }
      };
      playVideo();
    } else {
      video.pause();
    }

    const handleVideoEnd = () => {
      if (isMiraActive) {
        video.currentTime = 0;
        video.playbackRate = 0.85;
        video.play();
      }
    };

    video.addEventListener('ended', handleVideoEnd);
    return () => video.removeEventListener('ended', handleVideoEnd);
  }, [isMiraActive]);

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
        
        {/* Mira video with smooth fade-in */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isMiraActive ? 'opacity-100' : 'opacity-0'} flex items-center justify-center`}>
          <video
            ref={videoRef}
            className="max-w-full max-h-full object-contain"
            style={{ backgroundColor: 'transparent' }}
            muted
            playsInline
            onLoadedData={() => {
              setIsVideoReady(true);
              if (videoRef.current) {
                videoRef.current.playbackRate = 0.85;
              }
            }}
            onError={(e) => console.error('Mira video error:', e)}
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