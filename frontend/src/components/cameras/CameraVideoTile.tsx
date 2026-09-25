import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Camera } from '../../types/camera';
import { Maximize, Loader2, AlertTriangle, Play, Pause, VideoOff } from 'lucide-react';
import { format } from 'date-fns';
import { camerasApi } from '../../api/cameras';

interface CameraVideoTileProps {
  camera: Camera;
}

export const CameraVideoTile: React.FC<CameraVideoTileProps> = ({ camera }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'PLAYING' | 'ERROR'>('IDLE');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  
  const hlsRef = useRef<Hls | null>(null);

  // Lazy loading via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 } // Trigger when 10% visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Fetch playback URL when visible
  useEffect(() => {
    let active = true;

    if (isVisible && !playbackUrl && status === 'IDLE' && camera.is_enabled) {
      setStatus('LOADING');
      
      camerasApi.getPlayback(camera.camera_id)
        .then(res => {
          if (active) {
            setPlaybackUrl(res.playback_url);
          }
        })
        .catch(err => {
          if (active) {
            setStatus('ERROR');
            setErrorMsg(err.response?.data?.detail || 'Failed to get playback token');
          }
        });
    }

    return () => { active = false; };
  }, [isVisible, camera.camera_id, camera.is_enabled, playbackUrl, status]);

  // HLS playback logic
  useEffect(() => {
    if (!isVisible || !playbackUrl || !videoRef.current) {
      // Cleanup if hidden
      if (!isVisible && hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
        setStatus('IDLE');
        setPlaybackUrl(null); // Force re-fetch token when visible again
      }
      return;
    }

    const video = videoRef.current;
    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        enableWorker: true
      });
      hlsRef.current = hls;

      hls.loadSource(playbackUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.error("Autoplay prevented", e));
        setStatus('PLAYING');
        setIsPlaying(true);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("fatal network error encountered, try to recover");
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("fatal media error encountered, try to recover");
              hls?.recoverMediaError();
              break;
            default:
              // Cannot recover
              hls?.destroy();
              setStatus('ERROR');
              setErrorMsg('Fatal stream error');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      video.src = playbackUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.error("Autoplay prevented", e));
        setStatus('PLAYING');
        setIsPlaying(true);
      });
      video.addEventListener('error', () => {
        setStatus('ERROR');
        setErrorMsg('Native playback error');
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
    };
  }, [playbackUrl, isVisible]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch (e) {
      console.error("Fullscreen API error", e);
    }
  };
  
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Timestamp overlay update
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    if (status === 'PLAYING') {
      const interval = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <div 
      ref={containerRef} 
      className="relative bg-black rounded-lg overflow-hidden border border-gray-800 shadow flex flex-col aspect-video group"
    >
      {/* Header Overlay */}
      <div className="absolute top-0 inset-x-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-3 flex justify-between items-start pointer-events-none transition-opacity opacity-100 group-hover:opacity-100">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm tracking-wide shadow-black drop-shadow-md">
              {camera.camera_id}
            </span>
            <span className={`w-2 h-2 rounded-full ${
              !camera.is_enabled ? 'bg-gray-500' :
              status === 'PLAYING' ? 'bg-red-500 animate-pulse' : 
              status === 'ERROR' ? 'bg-yellow-500' : 'bg-gray-400'
            }`} />
          </div>
          <div className="text-xs text-gray-300 drop-shadow-md truncate max-w-[200px]">
            {camera.name}
          </div>
        </div>
        
        <div className="flex gap-2 pointer-events-auto">
          {camera.is_enabled && (
             <button 
              onClick={toggleFullscreen}
              className="p-1.5 bg-black/40 hover:bg-black/60 rounded text-white backdrop-blur-sm transition-colors"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Video Element */}
      <video
        ref={videoRef}
        className={`w-full h-full object-contain ${status === 'PLAYING' ? 'opacity-100' : 'opacity-0'}`}
        muted
        playsInline
      />

      {/* Overlays */}
      {!camera.is_enabled ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-gray-400">
          <VideoOff className="w-10 h-10 mb-2 opacity-50" />
          <span className="text-sm font-medium">Camera Disabled</span>
        </div>
      ) : status === 'LOADING' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
          <span className="text-xs font-mono">Loading Stream...</span>
        </div>
      ) : status === 'ERROR' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-gray-300 px-4 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mb-2 opacity-80" />
          <span className="text-sm font-medium text-white mb-1">Playback Error</span>
          <span className="text-xs text-gray-400">{errorMsg}</span>
        </div>
      ) : null}

      {/* Footer Overlay */}
      {status === 'PLAYING' && (
        <div className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-3 flex justify-between items-end transition-opacity opacity-0 group-hover:opacity-100">
          <button 
            onClick={togglePlay}
            className="p-1.5 bg-black/40 hover:bg-black/60 rounded text-white backdrop-blur-sm transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <div className="text-xs font-mono text-white drop-shadow-md">
            {format(now, 'yyyy-MM-dd HH:mm:ss')}
          </div>
        </div>
      )}
    </div>
  );
};
