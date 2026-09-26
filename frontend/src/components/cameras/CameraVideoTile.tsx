import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { Camera } from '../../types/camera';
import { Maximize, Loader2, AlertTriangle, Play, Pause, VideoOff, WifiOff } from 'lucide-react';
import { format } from 'date-fns';
import { camerasApi } from '../../api/cameras';

interface CameraVideoTileProps {
  camera: Camera;
}

type TileStatus = 'IDLE' | 'LOADING' | 'PLAYING' | 'UNAVAILABLE' | 'DISABLED';

// Hard-fail timeout: if playback hasn't started within this many ms, give up.
const PLAYBACK_START_TIMEOUT_MS = 8000;

export const CameraVideoTile: React.FC<CameraVideoTileProps> = ({ camera }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRef = useRef(false);
  const effectActiveRef = useRef(false);

  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<TileStatus>('IDLE');
  const [errorMsg, setErrorMsg] = useState('Stream unavailable or camera offline');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  // ─── helpers ──────────────────────────────────────────────────────────────

  const clearStartTimeout = useCallback(() => {
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
  }, []);

  const destroyHls = useCallback(() => {
    clearStartTimeout();
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, [clearStartTimeout]);

  const markUnavailable = useCallback((msg = 'Stream unavailable or camera offline') => {
    destroyHls();
    setErrorMsg(msg);
    setStatus('UNAVAILABLE');
  }, [destroyHls]);

  // ─── IntersectionObserver (lazy load) ─────────────────────────────────────

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => setIsVisible(e.isIntersecting)),
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // ─── Reset on camera_id change ────────────────────────────────────────────

  useEffect(() => {
    destroyHls();
    isFetchingRef.current = false;
    setPlaybackUrl(null);
    setIsPlaying(false);
    setErrorMsg('Stream unavailable or camera offline');
    if (!camera.is_enabled) {
      setStatus('DISABLED');
    } else {
      setStatus('IDLE');
    }
  }, [camera.camera_id, camera.is_enabled, destroyHls]);

  // ─── Fetch playback URL when tile becomes visible ─────────────────────────

  useEffect(() => {
    effectActiveRef.current = true;

    if (
      isVisible &&
      camera.is_enabled &&
      camera.status !== 'OFFLINE' &&
      !playbackUrl &&
      !isFetchingRef.current &&
      status === 'IDLE'
    ) {
      isFetchingRef.current = true;
      setStatus('LOADING');

      camerasApi.getPlayback(camera.camera_id)
        .then(res => {
          if (!effectActiveRef.current) return;
          if (res.playback_url) {
            setPlaybackUrl(res.playback_url);
          } else {
            markUnavailable();
          }
        })
        .catch(() => {
          if (!effectActiveRef.current) return;
          markUnavailable();
        })
        .finally(() => {
          isFetchingRef.current = false;
        });
    }

    // Cameras that are disabled or offline skip straight to UNAVAILABLE/DISABLED
    if (!camera.is_enabled && status === 'IDLE') {
      setStatus('DISABLED');
    }

    if (camera.is_enabled && camera.status === 'OFFLINE' && status === 'IDLE') {
      markUnavailable('Camera is currently offline');
    }

    return () => {
      effectActiveRef.current = false;
    };
  }, [isVisible, camera.camera_id, camera.is_enabled, camera.status, playbackUrl, status, markUnavailable]);

  // ─── HLS initialisation ───────────────────────────────────────────────────

  useEffect(() => {
    // If tile scrolled out of view, pause and reset
    if (!isVisible) {
      destroyHls();
      if (status === 'PLAYING') {
        setStatus('IDLE');
        setPlaybackUrl(null);
        isFetchingRef.current = false;
      }
      return;
    }

    if (!playbackUrl || !videoRef.current) return;
    if (status === 'PLAYING' || status === 'UNAVAILABLE' || status === 'DISABLED') return;

    const video = videoRef.current;

    // Arm hard timeout
    clearStartTimeout();
    startTimeoutRef.current = setTimeout(() => {
      markUnavailable();
    }, PLAYBACK_START_TIMEOUT_MS);

    const onPlayingOrCanplay = () => {
      clearStartTimeout();
      setStatus('PLAYING');
      setIsPlaying(true);
    };

    video.addEventListener('playing', onPlayingOrCanplay);
    video.addEventListener('canplay', onPlayingOrCanplay);

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        enableWorker: true,
        manifestLoadingMaxRetry: 0,       // No manifest retries — fail fast
        levelLoadingMaxRetry: 1,
        fragLoadingMaxRetry: 2,
      });
      hlsRef.current = hls;

      hls.loadSource(playbackUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        clearStartTimeout();
        video.play().catch(() => {/* autoplay policy — fine */});
        setStatus('PLAYING');
        setIsPlaying(true);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;

        // Any fatal manifest-level error → fail immediately
        if (
          data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
          data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT ||
          data.details === Hls.ErrorDetails.MANIFEST_PARSE_ERROR ||
          data.details === Hls.ErrorDetails.MANIFEST_INCOMPATIBLE_CODECS_ERROR ||
          data.details === Hls.ErrorDetails.LEVEL_LOAD_ERROR ||
          data.details === Hls.ErrorDetails.LEVEL_LOAD_TIMEOUT
        ) {
          markUnavailable();
          return;
        }

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            markUnavailable();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            markUnavailable();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = playbackUrl;
      video.addEventListener('loadedmetadata', () => {
        clearStartTimeout();
        video.play().catch(() => {});
        setStatus('PLAYING');
        setIsPlaying(true);
      });
      video.addEventListener('error', () => {
        markUnavailable();
      });
    } else {
      markUnavailable('HLS playback not supported in this browser');
    }

    return () => {
      video.removeEventListener('playing', onPlayingOrCanplay);
      video.removeEventListener('canplay', onPlayingOrCanplay);
      clearStartTimeout();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackUrl, isVisible]);

  // ─── Timestamp clock ──────────────────────────────────────────────────────

  useEffect(() => {
    if (status !== 'PLAYING') return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [status]);

  // ─── Controls ─────────────────────────────────────────────────────────────

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await containerRef.current.requestFullscreen();
    } catch { /* ignore */ }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play(); setIsPlaying(true); }
    else { videoRef.current.pause(); setIsPlaying(false); }
  };

  // ─── Status indicator colour ───────────────────────────────────────────────

  const dotColor =
    status === 'PLAYING'     ? 'bg-red-500 animate-pulse' :
    status === 'UNAVAILABLE' ? 'bg-yellow-500' :
    status === 'DISABLED'    ? 'bg-gray-400' :
    status === 'LOADING'     ? 'bg-blue-400 animate-pulse' :
    'bg-green-400';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden border border-green-200 shadow flex flex-col aspect-video group"
    >
      {/* Header */}
      <div className="absolute top-0 inset-x-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-3 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="text-green-100 font-bold text-sm tracking-wide drop-shadow-md">
              {camera.camera_id}
            </span>
            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          </div>
          <div className="text-xs text-green-200 drop-shadow-md truncate max-w-[200px] mt-0.5">
            {camera.name}
          </div>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          {status === 'PLAYING' && (
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

      {/* Video */}
      <video
        ref={videoRef}
        className={`w-full h-full object-contain ${status === 'PLAYING' ? 'opacity-100' : 'opacity-0'}`}
        muted
        playsInline
      />

      {/* State Overlays */}
      {status === 'DISABLED' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-gray-400">
          <VideoOff className="w-10 h-10 mb-2 opacity-50" />
          <span className="text-sm font-medium">Camera Disabled</span>
        </div>
      )}

      {status === 'LOADING' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-green-400">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <span className="text-xs font-mono">Connecting...</span>
        </div>
      )}

      {status === 'UNAVAILABLE' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-gray-300 px-4 text-center">
          <WifiOff className="w-8 h-8 text-yellow-500 mb-2 opacity-80" />
          <span className="text-sm font-semibold text-white mb-1">Playback Unavailable</span>
          <span className="text-xs text-gray-400">{errorMsg}</span>
        </div>
      )}

      {/* IDLE: dark placeholder while waiting for visibility */}
      {status === 'IDLE' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/60">
          <div className="w-2 h-2 rounded-full bg-gray-600" />
        </div>
      )}

      {/* Footer (only when PLAYING) */}
      {status === 'PLAYING' && (
        <div className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-3 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={togglePlay}
            className="p-1.5 bg-black/40 hover:bg-black/60 rounded text-white backdrop-blur-sm transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <div className="text-xs font-mono text-green-200 drop-shadow-md">
            {format(now, 'yyyy-MM-dd HH:mm:ss')}
          </div>
        </div>
      )}
    </div>
  );
};
