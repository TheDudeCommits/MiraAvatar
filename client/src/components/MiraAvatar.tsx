import { useEffect, useRef, useState } from 'react';
// Video file removed for deployment size constraints
// Using placeholder for now - external video hosting recommended
const miraVideo = 'https://placeholder-video-url.mp4';

interface MiraAvatarProps {
  isPlaying: boolean;
  audioElement?: HTMLAudioElement | null;
}

export const MiraAvatar: React.FC<MiraAvatarProps> = ({ isPlaying, audioElement }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showAvatar, setShowAvatar] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Handle video visibility and playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      setShowAvatar(true);
      
      // Start video playback when audio starts
      const playVideo = async () => {
        try {
          video.currentTime = 0; // Reset to beginning
          video.playbackRate = 0.85; // Set to 0.85x speed
          await video.play();
        } catch (error) {
          console.error('Error playing Mira video:', error);
        }
      };

      if (isVideoReady) {
        playVideo();
      }
    } else {
      // Fade out and pause video when audio stops
      const fadeOut = () => {
        video.pause();
        setTimeout(() => setShowAvatar(false), 300); // Wait for fade transition
      };
      
      fadeOut();
    }
  }, [isPlaying, isVideoReady]);

  // Handle video looping based on audio duration
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !audioElement || !isPlaying) return;

    const handleAudioEnd = () => {
      video.pause();
      setShowAvatar(false);
    };

    const handleVideoEnd = () => {
      // If audio is still playing, loop the video
      if (audioElement && !audioElement.paused && !audioElement.ended) {
        video.currentTime = 0;
        video.playbackRate = 0.85; // Maintain 0.85x speed on loop
        video.play();
      }
    };

    audioElement.addEventListener('ended', handleAudioEnd);
    video.addEventListener('ended', handleVideoEnd);

    return () => {
      audioElement.removeEventListener('ended', handleAudioEnd);
      video.removeEventListener('ended', handleVideoEnd);
    };
  }, [audioElement, isPlaying]);

  return (
    <div className={`fixed bottom-24 right-12 z-50 transition-all duration-500 ${
      showAvatar ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
    }`} style={{ backgroundColor: 'transparent' }}>
      <div className="relative" style={{ backgroundColor: 'transparent' }}>
        {/* Mira Avatar Video - Larger responsive sizing */}
        <video
          ref={videoRef}
          className="rounded-3xl shadow-2xl border-3 border-emerald-400/40"
          style={{
            width: 'auto',
            height: 'clamp(360px, 40vh, 480px)',
            backgroundColor: 'transparent',
            maxWidth: 'clamp(280px, 30vw, 380px)',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 16px rgba(16, 185, 129, 0.24))'
          }}
          muted
          playsInline
          onLoadedData={() => {
            setIsVideoReady(true);
            // Set playback rate immediately when video loads
            if (videoRef.current) {
              videoRef.current.playbackRate = 0.85;
            }
          }}
          onError={(e) => console.error('Mira video error:', e)}
        >
          <source src={miraVideo} type="video/mp4" />
        </video>
        
        {/* Enhanced glow effect when active - reduced by 20% */}
        {showAvatar && (
          <div className="absolute inset-0 rounded-3xl bg-emerald-400/20 blur-lg animate-pulse" style={{ backgroundColor: 'rgba(16, 185, 129, 0.20)' }}></div>
        )}
        
        {/* Enhanced name label - adjusted for larger frame */}
        {showAvatar && (
          <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2">
            <div className="bg-black/90 backdrop-blur-md rounded-xl px-5 py-2 border-2 border-emerald-400/32 shadow-lg">
              <span className="text-emerald-300 text-base titillium-web-bold tracking-wider">MIRA</span>
            </div>
          </div>
        )}
        
        {/* Additional ambient glow for better presence - reduced by 20% */}
        {showAvatar && (
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-400/8 to-cyan-400/8 blur-2xl scale-110 animate-pulse"></div>
        )}
      </div>
    </div>
  );
};