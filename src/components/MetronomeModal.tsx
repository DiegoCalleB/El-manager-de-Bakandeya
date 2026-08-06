import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Disc, Zap, Volume2, VolumeX, Music, Clock } from 'lucide-react';
import { Song, ThemeColors } from '../types';

interface MetronomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs?: Song[];
  colors?: ThemeColors;
  initialBpm?: number;
}

export function MetronomeModal({
  isOpen,
  onClose,
  songs = [],
  colors,
  initialBpm = 120
}: MetronomeModalProps) {
  const [bpm, setBpm] = useState<number>(initialBpm);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timeSignature, setTimeSignature] = useState<number>(4); // Beats per bar: 4 = 4/4, 3 = 3/4, 6 = 6/8, 2 = 2/4
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedSongId, setSelectedSongId] = useState<string>('');

  // Tap tempo state
  const tapTimesRef = useRef<number[]>([]);

  // Web Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerWorkerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const currentBeatRef = useRef<number>(0);

  // Update initial BPM when prop changes
  useEffect(() => {
    if (initialBpm && initialBpm > 0) {
      setBpm(initialBpm);
    }
  }, [initialBpm]);

  // Handle selected song BPM sync
  const handleSelectSong = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    setSelectedSongId(sId);
    const found = songs.find(s => s.id === sId);
    if (found && found.bpm && found.bpm > 0) {
      setBpm(found.bpm);
    }
  };

  // Tap Tempo calculation
  const handleTapTempo = () => {
    const now = performance.now();
    const tapTimes = tapTimesRef.current;

    // Reset if last tap was more than 2 seconds ago
    if (tapTimes.length > 0 && now - tapTimes[tapTimes.length - 1] > 2000) {
      tapTimesRef.current = [];
    }

    tapTimesRef.current.push(now);

    if (tapTimesRef.current.length > 1) {
      // Calculate intervals
      const intervals = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);

      if (calculatedBpm >= 30 && calculatedBpm <= 280) {
        setBpm(calculatedBpm);
      }
    }

    // Keep max 6 taps
    if (tapTimesRef.current.length > 6) {
      tapTimesRef.current.shift();
    }
  };

  // Play click audio oscillator
  const scheduleClick = (beatNumber: number, time: number) => {
    if (!audioCtxRef.current || isMuted) return;

    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();

    // High pitch for beat 1 (accent), lower pitch for other beats
    if (beatNumber === 0) {
      osc.frequency.value = 1200; // Accent pitch (Hz)
      gain.gain.value = volume;
    } else {
      osc.frequency.value = 800;  // Normal click pitch (Hz)
      gain.gain.value = volume * 0.6;
    }

    osc.type = 'sine';

    // Fast exponential decay for clean click sound
    gain.gain.setValueAtTime(gain.gain.value, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  };

  // Scheduler loop
  const scheduler = () => {
    if (!audioCtxRef.current) return;

    const lookahead = 0.1; // 100ms lookahead
    const scheduleAheadTime = 0.1;

    while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
      scheduleClick(currentBeatRef.current, nextNoteTimeRef.current);

      // Advance beat
      const currentBeatVal = currentBeatRef.current;
      setTimeout(() => {
        setCurrentBeat(currentBeatVal);
      }, (nextNoteTimeRef.current - audioCtxRef.current!.currentTime) * 1000);

      const secondsPerBeat = 60.0 / bpm;
      nextNoteTimeRef.current += secondsPerBeat;

      currentBeatRef.current = (currentBeatRef.current + 1) % timeSignature;
    }
  };

  // Toggle metronome play/stop
  const togglePlay = () => {
    if (!isPlaying) {
      // Start audio context
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      currentBeatRef.current = 0;
      nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;

      // Start interval timer
      timerWorkerRef.current = window.setInterval(scheduler, 25);
      setIsPlaying(true);
    } else {
      if (timerWorkerRef.current) {
        clearInterval(timerWorkerRef.current);
        timerWorkerRef.current = null;
      }
      setIsPlaying(false);
      setCurrentBeat(0);
    }
  };

  // Stop metronome on modal close
  useEffect(() => {
    if (!isOpen && isPlaying) {
      if (timerWorkerRef.current) {
        clearInterval(timerWorkerRef.current);
        timerWorkerRef.current = null;
      }
      setIsPlaying(false);
      setCurrentBeat(0);
    }
  }, [isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerWorkerRef.current) {
        clearInterval(timerWorkerRef.current);
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-zinc-900 to-black border border-amber-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-amber-500/10">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                Metrónomo Pro
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  WebAudio API
                </span>
              </h3>
              <p className="text-xs text-neutral-400">Click de alta precisión para ensayos y estudio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Song Selector Sync */}
          {songs.length > 0 && (
            <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                Sincronizar BPM desde Repertorio:
              </label>
              <select
                value={selectedSongId}
                onChange={handleSelectSong}
                className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="">-- Seleccionar Canción --</option>
                {songs.map(song => (
                  <option key={song.id} value={song.id}>
                    {song.titulo} {song.bpm ? `(${song.bpm} BPM)` : '(Sin BPM definido)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Large BPM Display & Quick Adjustment */}
          <div className="flex flex-col items-center justify-center bg-black/50 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Tempo Actual
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setBpm(b => Math.max(30, b - 5))}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 font-bold text-lg text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                title="-5 BPM"
              >
                -5
              </button>
              <button
                onClick={() => setBpm(b => Math.max(30, b - 1))}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 font-bold text-sm text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                title="-1 BPM"
              >
                -1
              </button>

              <div className="flex flex-col items-center">
                <span className="text-5xl font-black font-mono tracking-tight text-white drop-shadow-md">
                  {bpm}
                </span>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                  Pulsaciones por Minuto
                </span>
              </div>

              <button
                onClick={() => setBpm(b => Math.min(280, b + 1))}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 font-bold text-sm text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                title="+1 BPM"
              >
                +1
              </button>
              <button
                onClick={() => setBpm(b => Math.min(280, b + 5))}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 font-bold text-lg text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                title="+5 BPM"
              >
                +5
              </button>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="30"
              max="260"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full mt-5 accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Animated Beat Visualizer Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-semibold flex items-center gap-1">
                Compás ({timeSignature}/4):
              </span>
              <span className="font-mono text-amber-300 font-bold">
                Golpe {isPlaying ? currentBeat + 1 : '-'} / {timeSignature}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: timeSignature }).map((_, idx) => {
                const isActive = isPlaying && currentBeat === idx;
                const isAccent = idx === 0;

                return (
                  <div
                    key={idx}
                    className={`h-12 rounded-xl flex items-center justify-center font-mono font-bold text-sm transition-all duration-75 border ${
                      isActive
                        ? isAccent
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/50 scale-105'
                          : 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-lg shadow-emerald-500/50 scale-105'
                        : 'bg-white/5 text-neutral-500 border-white/5'
                    }`}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Signature Pickers & Tap Tempo */}
          <div className="grid grid-cols-2 gap-3">
            {/* Compás selector */}
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
              <label className="text-[11px] font-semibold text-neutral-400 block mb-1.5">
                Métrica:
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[4, 3, 2].map((sig) => (
                  <button
                    key={sig}
                    onClick={() => setTimeSignature(sig)}
                    className={`py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      timeSignature === sig
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-black/40 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    {sig}/4
                  </button>
                ))}
              </div>
            </div>

            {/* Tap Tempo Button */}
            <button
              onClick={handleTapTempo}
              className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 rounded-xl p-2.5 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 group"
            >
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider group-hover:scale-105 transition-transform">
                👆 TAP TEMPO
              </span>
              <span className="text-[10px] text-neutral-400">Toca el ritmo 4 veces</span>
            </button>
          </div>

          {/* Quick BPM Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-neutral-400 block">
              Presets Rápidos:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: 'Balada (75)', val: 75 },
                { label: 'Pop/Mid (105)', val: 105 },
                { label: 'Ska/Disco (124)', val: 124 },
                { label: 'Rock (140)', val: 140 },
                { label: 'Punk (165)', val: 165 },
              ].map(p => (
                <button
                  key={p.val}
                  onClick={() => setBpm(p.val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                    bpm === p.val
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                      : 'bg-white/5 border-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Play/Pause Action */}
          <div className="pt-2">
            <button
              onClick={togglePlay}
              className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer active:scale-98 ${
                isPlaying
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/25'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  DETENER METRÓNOMO
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  INICIAR METRÓNOMO ({bpm} BPM)
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
