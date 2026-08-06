import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { resolveAudioUrl, parseGoogleDriveAudioUrl } from '../utils/audioStorage';

interface WaveformTrackProps {
  audioUrl: string;
  color?: string;
  masterDuration?: number;
  trackDuration?: number;
  currentTime?: number;
  onSeekTrack?: (timeSec: number) => void;
  onTrackLoaded?: (durationSec: number) => void;
}

// Fallback deterministic peak canvas for webm/opus blobs, CORS links, or offline tracks
const FallbackWaveformCanvas: React.FC<{ color: string; seedStr: string; progressPercent: number }> = ({ color, seedStr, progressPercent }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.offsetWidth || 300);
    const height = (canvas.height = canvas.offsetHeight || 48);

    ctx.clearRect(0, 0, width, height);

    let seed = 12345;
    for (let i = 0; i < seedStr.length; i++) {
      seed = (seed << 5) - seed + seedStr.charCodeAt(i);
      seed |= 0;
    }
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const barWidth = 2;
    const barGap = 1;
    const numBars = Math.max(10, Math.floor(width / (barWidth + barGap)));
    const centerY = height / 2;
    const progressX = (progressPercent / 100) * width;

    for (let i = 0; i < numBars; i++) {
      const posRatio = i / numBars;
      const envelope = Math.sin(posRatio * Math.PI) * 0.75 + 0.25;
      const randVal = 0.2 + pseudoRandom() * 0.8;
      const barHeight = Math.max(4, (height - 10) * randVal * envelope);

      const x = i * (barWidth + barGap);
      const y = centerY - barHeight / 2;

      ctx.fillStyle = x <= progressX ? color : color + '40';
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }, [color, seedStr, progressPercent]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full block pointer-events-none" 
    />
  );
};

const WaveformTrack = forwardRef<HTMLAudioElement, WaveformTrackProps>(({
  audioUrl,
  color = '#818cf8',
  masterDuration = 30,
  trackDuration,
  currentTime = 0,
  onSeekTrack,
  onTrackLoaded
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [localTrackDur, setLocalTrackDur] = useState<number>(0);

  // Callback ref to forward HTMLAudioElement cleanly to parent and internal ref
  const setAudioRef = (node: HTMLAudioElement | null) => {
    audioRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref && 'current' in ref) {
      (ref as React.MutableRefObject<HTMLAudioElement | null>).current = node;
    }
  };

  // Compute clean valid src for HTML <audio> element
  const validAudioSrc = (() => {
    if (resolvedUrl && !resolvedUrl.startsWith('indexeddb:')) {
      return resolvedUrl;
    }
    if (!audioUrl) return '';
    if (audioUrl.startsWith('indexeddb:')) return '';
    if (audioUrl.includes('drive.google.com')) {
      return parseGoogleDriveAudioUrl(audioUrl);
    }
    return audioUrl;
  })();

  // Helper time formatter & duration checks
  const isFiniteNum = (val: any): val is number => typeof val === 'number' && !isNaN(val) && isFinite(val) && val > 0;

  const formatSecs = (secs: number) => {
    if (!secs || isNaN(secs) || !isFinite(secs) || secs <= 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Effective durations for DAW grid alignment
  const validTrackDur = isFiniteNum(trackDuration) ? trackDuration : (isFiniteNum(localTrackDur) ? localTrackDur : 0);
  const validMasterDur = isFiniteNum(masterDuration) ? masterDuration : (validTrackDur > 0 ? validTrackDur : 30);
  const effTrackDur = validTrackDur > 0 ? validTrackDur : validMasterDur;
  const effMasterDur = validMasterDur;

  // Percentage of total DAW timeline that this track's audio block occupies
  const trackWidthPercent = Math.min(100, Math.max(1, (effTrackDur / effMasterDur) * 100));

  // Percentage position of the master playhead cursor across this track row
  const playheadPercent = Math.min(100, Math.max(0, (currentTime / effMasterDur) * 100));

  // 1. Resolve audioUrl if needed
  useEffect(() => {
    let active = true;
    setIsLoaded(false);
    setLoadError(false);

    if (!audioUrl) {
      setResolvedUrl('');
      return;
    }

    if (audioUrl.startsWith('indexeddb:') || audioUrl.includes('drive.google.com')) {
      resolveAudioUrl(audioUrl)
        .then((url) => {
          if (active) {
            setResolvedUrl(url || '');
          }
        })
        .catch((err) => {
          console.warn('Error resolving audio URL in WaveformTrack:', err);
          if (active) setResolvedUrl('');
        });
    } else {
      setResolvedUrl(audioUrl);
    }

    return () => {
      active = false;
    };
  }, [audioUrl]);

  // Reload audio element ONLY when validAudioSrc actually changes to a new URL
  useEffect(() => {
    if (audioRef.current && validAudioSrc) {
      const currentSrc = audioRef.current.src || '';
      // Only set src and call load if src differs and is not already assigned
      if (currentSrc !== validAudioSrc && !currentSrc.endsWith(validAudioSrc)) {
        audioRef.current.src = validAudioSrc;
        try {
          audioRef.current.load();
        } catch (e) {
          console.warn('Error loading audio src:', e);
        }
      }
    }
  }, [validAudioSrc]);

  // 2. Initialize WaveSurfer when validAudioSrc and containerRef are ready
  useEffect(() => {
    if (!containerRef.current || !audioRef.current || !validAudioSrc) return;

    let ws: WaveSurfer | null = null;
    let isCancelled = false;

    try {
      ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: color + '40', // slightly transparent for background
        progressColor: color,
        cursorColor: 'transparent', // Custom unified playhead rendered on top
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 48,
        normalize: true,
        interact: false, // Prevents individual track clicks from desynchronizing the track
        url: validAudioSrc, // Pass url explicitly so WaveSurfer decodes & draws waveform
      });

      wavesurfer.current = ws;

      const handleReady = () => {
        if (!isCancelled) {
          setIsLoaded(true);
          const dur = audioRef.current?.duration;
          if (dur && !isNaN(dur) && isFinite(dur) && dur > 0) {
            setLocalTrackDur(dur);
          }
        }
      };

      const handleError = (err: any) => {
        console.warn('WaveSurfer error loading track:', err);
        if (!isCancelled) {
          setLoadError(true);
          setIsLoaded(true); // Dismiss loading overlay
        }
      };

      ws.on('ready', handleReady);
      ws.on('decode', handleReady);
      ws.on('error', handleError);

      // Safeguard timeout: dismiss spinner after 4s if decode is slow or event missed
      const timer = setTimeout(() => {
        if (!isCancelled) {
          setIsLoaded(true);
        }
      }, 4000);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
        if (ws) {
          try {
            ws.destroy();
          } catch (e) {
            // ignore destroy errors
          }
        }
      };
    } catch (err) {
      console.error('Error creating WaveSurfer instance:', err);
      setLoadError(true);
      setIsLoaded(true);
    }
  }, [validAudioSrc, color]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeekTrack || effMasterDur <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeekTrack(ratio * effMasterDur);
  };

  return (
    <div 
      className="relative w-full h-12 bg-black/60 rounded-lg overflow-hidden border border-white/10 cursor-pointer select-none group transition-colors hover:border-indigo-500/40"
      onClick={handleContainerClick}
      title="Haz clic para mover el cabezal de reproducción (Seek Master)"
    >
      <audio 
        ref={setAudioRef} 
        src={validAudioSrc} 
        preload="auto" 
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          const dur = el.duration;
          if (dur === Infinity) {
            el.currentTime = 1e101;
            el.ontimeupdate = function () {
              this.ontimeupdate = null;
              this.currentTime = 0;
              if (isFinite(this.duration) && this.duration > 0) {
                setLocalTrackDur(this.duration);
                if (onTrackLoaded) onTrackLoaded(this.duration);
              }
            };
          } else if (dur && !isNaN(dur) && isFinite(dur) && dur > 0) {
            setLocalTrackDur(dur);
            if (onTrackLoaded) onTrackLoaded(dur);
          }
        }}
      />

      {/* DAW Grid Background Lines (Visual Metronome / Beat markers) */}
      <div className="absolute inset-0 pointer-events-none opacity-15 flex justify-between px-2 z-0">
        <div className="w-px h-full bg-white/40" />
        <div className="w-px h-full bg-white/20" />
        <div className="w-px h-full bg-white/40" />
        <div className="w-px h-full bg-white/20" />
        <div className="w-px h-full bg-white/40" />
      </div>

      {/* Waveform Container - Proportionally scaled to track audio duration vs master duration */}
      <div 
        className="h-full relative overflow-hidden bg-black/20 border-r border-white/20 z-10"
        style={{ width: `${trackWidthPercent}%` }}
      >
        {loadError ? (
          <FallbackWaveformCanvas 
            color={color} 
            seedStr={audioUrl || 'track-seed'} 
            progressPercent={(currentTime / effTrackDur) * 100} 
          />
        ) : (
          <div ref={containerRef} className="w-full h-full pointer-events-none" />
        )}
      </div>

      {/* Empty DAW Track Grid Region if track audio duration is shorter than master */}
      {trackWidthPercent < 98 && (
        <div 
          className="absolute top-0 bottom-0 right-0 bg-black/40 border-l border-dashed border-white/15 flex items-center justify-end px-3 pointer-events-none z-10"
          style={{ left: `${trackWidthPercent}%` }}
        >
          <span className="text-[9px] font-mono text-neutral-500 font-semibold uppercase tracking-wider">
            Fin de pista ({formatSecs(effTrackDur)})
          </span>
        </div>
      )}

      {/* Unified Synchronized Master Playhead Cursor Line */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] z-20 pointer-events-none"
        style={{ left: `${playheadPercent}%`, willChange: 'left' }}
      >
        <div className="w-2 h-2 -ml-[3px] -mt-[1px] bg-amber-400 rotate-45 shadow-md" />
      </div>

      {/* Loading Overlay */}
      {!isLoaded && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-neutral-400 font-mono animate-pulse bg-black/70 z-30">
          ⚡ Cargando onda de audio...
        </div>
      )}
    </div>
  );
});

export default WaveformTrack;
