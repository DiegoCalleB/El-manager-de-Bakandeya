import React, { useState, useEffect, useRef } from 'react';
import { Song, ThemeColors } from '../types';
import { 
  Play, Pause, SkipBack, SkipForward, Repeat, Volume2, VolumeX, 
  ExternalLink, Disc, Sliders, X, Flame, Music, Sparkles, FileText, ChevronUp, ChevronDown
} from 'lucide-react';
import { parseGoogleDriveAudioUrl, isGoogleDriveUrl, resolveAudioUrl } from '../utils/audioStorage';

interface SpotifyPlayerBarProps {
  song: Song | null;
  songs: Song[];
  colors: ThemeColors;
  onSelectSong: (song: Song, autoPlay?: boolean) => void;
  onOpenStudio: (song: Song) => void;
  onUpdateSong?: (song: Song) => void;
  onClosePlayer: () => void;
  autoPlay?: boolean;
  playSignal?: number;
  onIsPlayingChange?: (isPlaying: boolean) => void;
}

export default function SpotifyPlayerBar({
  song,
  songs,
  colors,
  onSelectSong,
  onOpenStudio,
  onUpdateSong,
  onClosePlayer,
  autoPlay = false,
  playSignal = 0,
  onIsPlayingChange
}: SpotifyPlayerBarProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isMinimized, setIsMinimized] = useState(false);

  // Audio HTML element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Audio Synth fallback for songs without custom audio file
  const synthIntervalRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [activeAudioUrl, setActiveAudioUrl] = useState<string>('');

  // Extract and resolve active audio URL asynchronously (supporting IndexedDB & Drive)
  useEffect(() => {
    let isMounted = true;
    if (!song) {
      setActiveAudioUrl('');
      return;
    }

    const rawUrl = song.audioPrincipalUrl || (song.audioIdeas && song.audioIdeas[0]?.audioUrl) || '';

    if (!rawUrl) {
      setActiveAudioUrl('');
      return;
    }

    resolveAudioUrl(rawUrl).then((resolved) => {
      if (isMounted) {
        setActiveAudioUrl(resolved);
      }
    }).catch(err => {
      console.warn('Error resolving audio URL:', err);
      if (isMounted) setActiveAudioUrl('');
    });

    return () => {
      isMounted = false;
    };
  }, [song]);

  // Sync isPlaying state to parent if callback provided
  useEffect(() => {
    onIsPlayingChange?.(isPlaying);
  }, [isPlaying, onIsPlayingChange]);

  const lastHandledSignalRef = useRef<number>(0);
  const lastSongIdRef = useRef<string | null>(null);

  // When song, activeAudioUrl, autoPlay, or playSignal changes
  useEffect(() => {
    if (!song) {
      setIsPlaying(false);
      lastSongIdRef.current = null;
      return;
    }

    const isNewSong = lastSongIdRef.current !== song.id;
    lastSongIdRef.current = song.id;

    const hasNewPlaySignal = !!(playSignal && playSignal !== lastHandledSignalRef.current);
    if (playSignal) {
      lastHandledSignalRef.current = playSignal;
    }

    const shouldPlayNow = autoPlay || hasNewPlaySignal;

    setCurrentTime(0);
    const estDuration = song.duracionSegundos || 210;
    setDuration(estDuration);

    if (activeAudioUrl) {
      if (audioRef.current) {
        audioRef.current.src = activeAudioUrl;
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.volume = isMuted ? 0 : volume;

        if (shouldPlayNow) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(err => {
            console.warn('Playback deferred or blocked:', err);
            setIsPlaying(false);
          });
        } else if (isNewSong) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsPlaying(false);
        } else if (!autoPlay && !hasNewPlaySignal) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }
    } else {
      if (shouldPlayNow) {
        setIsPlaying(true);
      } else if (isNewSong) {
        setIsPlaying(false);
      }
    }
  }, [song, activeAudioUrl, autoPlay, playSignal]);

  // Playback rate effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Volume effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Loop effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  // Synthetic practice beat generator when no audio URL exists
  useEffect(() => {
    if (isPlaying && !activeAudioUrl && song) {
      const bpm = song.bpm || 120;
      const intervalMs = (60 / bpm) * 1000;

      synthIntervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + (60 / bpm);
          if (next >= (song.duracionSegundos || 210)) {
            if (isLooping) return 0;
            setIsPlaying(false);
            return 0;
          }
          return next;
        });

        // Simple subtle click synth sound for practice
        try {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
          }
          const osc = audioCtxRef.current.createOscillator();
          const gain = audioCtxRef.current.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, audioCtxRef.current.currentTime);
          gain.gain.setValueAtTime(0.05, audioCtxRef.current.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.08);
          osc.connect(gain);
          gain.connect(audioCtxRef.current.destination);
          osc.start();
          osc.stop(audioCtxRef.current.currentTime + 0.08);
        } catch {
          // ignore web audio context limits
        }
      }, intervalMs);
    } else {
      if (synthIntervalRef.current) {
        clearInterval(synthIntervalRef.current);
      }
    }

    return () => {
      if (synthIntervalRef.current) {
        clearInterval(synthIntervalRef.current);
      }
    };
  }, [isPlaying, activeAudioUrl, song, isLooping]);

  if (!song) return null;

  const currentIdx = songs.findIndex(s => s.id === song.id);

  const handlePrev = () => {
    if (currentIdx > 0) {
      onSelectSong(songs[currentIdx - 1]);
    } else {
      onSelectSong(songs[songs.length - 1]);
    }
  };

  const handleNext = () => {
    if (currentIdx >= 0 && currentIdx < songs.length - 1) {
      onSelectSong(songs[currentIdx + 1]);
    } else {
      onSelectSong(songs[0]);
    }
  };

  const togglePlayPause = () => {
    if (activeAudioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    if (audioRef.current && activeAudioUrl) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatSecs = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isDrive = isGoogleDriveUrl(song.audioPrincipalUrl || '');

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 shadow-2xl ${
      isMinimized ? 'translate-y-[calc(100%-2.5rem)]' : 'translate-y-0'
    }`}>
      {/* Hidden HTML Audio Element */}
      {activeAudioUrl && (
        <audio
          ref={audioRef}
          src={activeAudioUrl}
          preload="auto"
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current && audioRef.current.duration) {
              setDuration(audioRef.current.duration);
            }
          }}
          onEnded={() => {
            if (isLooping) {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
              }
            } else {
              handleNext();
            }
          }}
        />
      )}

      <div className="bg-[#121212]/98 backdrop-blur-2xl border-t border-[#282828] text-white px-4 py-3 max-w-full shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Left: Song Info */}
          <div className="flex items-center justify-between w-full md:w-1/4 min-w-0">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0 w-14 h-14 rounded-lg bg-[#282828] shadow-md overflow-hidden group border border-white/5">
                {song.portadaUrl ? (
                  <img src={song.portadaUrl} alt={song.titulo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1db954]/30 via-zinc-800 to-black flex items-center justify-center">
                    <Disc className={`w-7 h-7 ${isPlaying ? 'animate-spin-slow text-[#1db954]' : 'text-zinc-400'}`} />
                  </div>
                )}
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                    <span className="w-1 h-4 bg-[#1db954] rounded-full animate-pulse" />
                    <span className="w-1 h-6 bg-[#1ed760] rounded-full animate-pulse delay-75" />
                    <span className="w-1 h-3 bg-[#1db954] rounded-full animate-pulse delay-150" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white hover:underline cursor-pointer truncate">{song.titulo}</h4>
                  {onUpdateSong && (
                    <button
                      type="button"
                      onClick={() => onUpdateSong({ ...song, favoritoGeneral: !song.favoritoGeneral })}
                      className="text-zinc-400 hover:text-[#1db954] transition cursor-pointer p-0.5"
                      title={song.favoritoGeneral ? "Guardado en Favoritos" : "Guardar en Favoritos"}
                    >
                      <Sparkles className={`w-4 h-4 ${song.favoritoGeneral ? 'text-[#1db954] fill-[#1db954]' : ''}`} />
                    </button>
                  )}
                  {isDrive && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                      Drive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#b3b3b3] font-mono mt-0.5 truncate">
                  <span className="text-white font-medium">Bakandeya</span>
                  <span>•</span>
                  <span className="text-[#1db954] font-semibold">{song.tonalidad || 'Am'}</span>
                  <span>•</span>
                  <span>{song.bpm} BPM</span>
                </div>
              </div>
            </div>

            {/* Minimize / Hide button for mobile */}
            <div className="flex items-center gap-1 md:hidden">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-zinc-400 hover:text-white"
                title={isMinimized ? "Expandir Reproductor" : "Minimizar"}
              >
                {isMinimized ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Center: Playback Controls & Timeline Scrubber */}
          <div className="flex flex-col items-center gap-1.5 w-full md:w-2/4">
            
            {/* Control Buttons */}
            <div className="flex items-center gap-4">
              {/* Loop Practice Toggle */}
              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  isLooping 
                    ? 'text-[#1db954] bg-[#1db954]/10' 
                    : 'text-[#b3b3b3] hover:text-white'
                }`}
                title={isLooping ? "Repetir tema activado" : "Activar Bucle"}
              >
                <Repeat className="w-4 h-4" />
              </button>

              {/* Prev Song */}
              <button
                onClick={handlePrev}
                className="p-1 text-[#b3b3b3] hover:text-white transition-all cursor-pointer active:scale-90"
                title="Canción Anterior"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              {/* Play / Pause - Authentic Spotify Green Circle */}
              <button
                onClick={togglePlayPause}
                className="w-10 h-10 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold flex items-center justify-center shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95"
                title={isPlaying ? "Pausar" : "Reproducir Canción"}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              {/* Next Song */}
              <button
                onClick={handleNext}
                className="p-1 text-[#b3b3b3] hover:text-white transition-all cursor-pointer active:scale-90"
                title="Siguiente Canción"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              {/* Speed multiplier selector */}
              <select
                value={playbackRate}
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                className="bg-[#282828] text-[#1db954] text-[10px] font-mono rounded px-1.5 py-1 cursor-pointer hover:bg-zinc-700 focus:outline-none border border-white/5"
                title="Velocidad de Reproducción"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1.0}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
              </select>
            </div>

            {/* Timeline Slider */}
            <div className="w-full flex items-center gap-2 text-[11px] font-mono text-[#b3b3b3]">
              <span className="w-9 text-right shrink-0">{formatSecs(currentTime)}</span>
              
              <div className="relative flex-1 flex items-center">
                <input
                  type="range"
                  min={0}
                  max={duration || 210}
                  step={0.5}
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#4d4d4d] rounded-lg appearance-none cursor-pointer accent-[#1db954] hover:accent-[#1ed760] focus:outline-none"
                />
              </div>

              <span className="w-9 text-left shrink-0">{formatSecs(duration)}</span>
            </div>
          </div>

          {/* Right: Actions & Volume */}
          <div className="flex items-center justify-end gap-2.5 w-full md:w-1/4">
            
            {/* Chords link if available */}
            {song.enlaceAcordes && (
              <a
                href={song.enlaceAcordes}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-[#282828] hover:bg-[#3e3e3e] text-[#b3b3b3] hover:text-white text-xs font-mono flex items-center gap-1 transition-all cursor-pointer"
                title="Ver Acordes / Partitura"
              >
                <FileText className="w-3.5 h-3.5 text-[#1db954]" />
                <span className="hidden lg:inline text-[11px]">Acordes</span>
              </a>
            )}

            {/* Studio / Arreglos Button */}
            <button
              onClick={() => onOpenStudio(song)}
              className="px-3 py-1.5 rounded-full bg-[#1db954]/15 hover:bg-[#1db954]/25 text-[#1ed760] border border-[#1db954]/30 font-bold text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Abrir Estudio de Arreglos e Ideas"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="text-[11px]">Estudio</span>
            </button>

            {/* Volume */}
            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-[#282828]">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-[#b3b3b3] hover:text-white p-1"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="w-16 h-1 bg-[#4d4d4d] rounded-lg appearance-none cursor-pointer accent-[#1db954]"
              />
            </div>

            {/* Close Player */}
            <button
              onClick={onClosePlayer}
              className="p-1.5 text-zinc-500 hover:text-white transition-all ml-1"
              title="Cerrar Reproductor"
            >
              <X className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}
