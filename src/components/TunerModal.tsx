import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, VolumeX, Guitar, Zap, Radio, Check, RefreshCw } from 'lucide-react';
import { ThemeColors } from '../types';

interface TunerModalProps {
  isOpen: boolean;
  onClose: () => void;
  colors?: ThemeColors;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface PresetString {
  note: string;
  octave: number;
  freq: number;
  label: string; // e.g. "6ª - E2"
}

export interface TunerPreset {
  id: string;
  name: string;
  category: 'guitar' | 'bass';
  strings: PresetString[];
}

export const TunerPresets: TunerPreset[] = [
  {
    id: 'guitar_std',
    name: 'Guitarra Estándar (E A D G B E)',
    category: 'guitar',
    strings: [
      { note: 'E', octave: 2, freq: 82.41, label: '6ª cuerdas - E2 (Grave)' },
      { note: 'A', octave: 2, freq: 110.00, label: '5ª cuerda - A2' },
      { note: 'D', octave: 3, freq: 146.83, label: '4ª cuerda - D3' },
      { note: 'G', octave: 3, freq: 196.00, label: '3ª cuerda - G3' },
      { note: 'B', octave: 3, freq: 246.94, label: '2ª cuerda - B3' },
      { note: 'E', octave: 4, freq: 329.63, label: '1ª cuerda - E4 (Aguda)' },
    ]
  },
  {
    id: 'guitar_dropd',
    name: 'Guitarra Drop D (D A D G B E)',
    category: 'guitar',
    strings: [
      { note: 'D', octave: 2, freq: 73.42, label: '6ª cuerda - D2 (Drop D)' },
      { note: 'A', octave: 2, freq: 110.00, label: '5ª cuerda - A2' },
      { note: 'D', octave: 3, freq: 146.83, label: '4ª cuerda - D3' },
      { note: 'G', octave: 3, freq: 196.00, label: '3ª cuerda - G3' },
      { note: 'B', octave: 3, freq: 246.94, label: '2ª cuerda - B3' },
      { note: 'E', octave: 4, freq: 329.63, label: '1ª cuerda - E4' },
    ]
  },
  {
    id: 'bass_4',
    name: 'Bajo Eléctrico 4 Cuerdas (E A D G)',
    category: 'bass',
    strings: [
      { note: 'E', octave: 1, freq: 41.20, label: '4ª cuerda - E1 (Grave)' },
      { note: 'A', octave: 1, freq: 55.00, label: '3ª cuerda - A1' },
      { note: 'D', octave: 2, freq: 73.42, label: '2ª cuerda - D2' },
      { note: 'G', octave: 2, freq: 98.00, label: '1ª cuerda - G2 (Aguda)' },
    ]
  },
  {
    id: 'bass_5',
    name: 'Bajo Eléctrico 5 Cuerdas (B E A D G)',
    category: 'bass',
    strings: [
      { note: 'B', octave: 0, freq: 30.87, label: '5ª cuerda - B0 (Super Grave)' },
      { note: 'E', octave: 1, freq: 41.20, label: '4ª cuerda - E1' },
      { note: 'A', octave: 1, freq: 55.00, label: '3ª cuerda - A1' },
      { note: 'D', octave: 2, freq: 73.42, label: '2ª cuerda - D2' },
      { note: 'G', octave: 2, freq: 98.00, label: '1ª cuerda - G2' },
    ]
  },
  {
    id: 'guitar_7',
    name: 'Guitarra 7 Cuerdas (B E A D G B E)',
    category: 'guitar',
    strings: [
      { note: 'B', octave: 1, freq: 61.74, label: '7ª cuerda - B1' },
      { note: 'E', octave: 2, freq: 82.41, label: '6ª cuerda - E2' },
      { note: 'A', octave: 2, freq: 110.00, label: '5ª cuerda - A2' },
      { note: 'D', octave: 3, freq: 146.83, label: '4ª cuerda - D3' },
      { note: 'G', octave: 3, freq: 196.00, label: '3ª cuerda - G3' },
      { note: 'B', octave: 3, freq: 246.94, label: '2ª cuerda - B3' },
      { note: 'E', octave: 4, freq: 329.63, label: '1ª cuerda - E4' },
    ]
  }
];

// Helper to convert frequency to closest note
function getNoteFromFrequency(frequency: number) {
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2)) + 69;
  const roundedNoteNum = Math.round(noteNum);
  const cents = Math.round((noteNum - roundedNoteNum) * 100);
  const noteIndex = (roundedNoteNum % 12 + 12) % 12;
  const octave = Math.floor(roundedNoteNum / 12) - 1;
  const noteName = NOTE_NAMES[noteIndex];
  const exactFreq = 440 * Math.pow(2, (roundedNoteNum - 69) / 12);

  return {
    noteName,
    octave,
    cents,
    exactFreq,
    fullNote: `${noteName}${octave}`
  };
}

// Time-domain autocorrelation algorithm
function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.008) return -1; // Too quiet

  let r1 = 0, r2 = SIZE - 1, thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  }

  const slicedBuf = buf.slice(r1, r2);
  const bufLen = slicedBuf.length;

  const c = new Float32Array(bufLen);
  for (let i = 0; i < bufLen; i++) {
    for (let j = 0; j < bufLen - i; j++) {
      c[i] = c[i] + slicedBuf[j] * slicedBuf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < bufLen; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  let T0 = maxpos;

  if (T0 > 0 && T0 < bufLen - 1) {
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) {
      T0 = T0 - b / (2 * a);
    }
  }

  return sampleRate / T0;
}

export function TunerModal({ isOpen, onClose }: TunerModalProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('guitar_std');
  const [selectedStringIndex, setSelectedStringIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [pitch, setPitch] = useState<{
    freq: number;
    noteName: string;
    octave: number;
    cents: number;
    fullNote: string;
  } | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  // Reference tone playback
  const [playingToneFreq, setPlayingToneFreq] = useState<number | null>(null);

  // Audio Context & Stream refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const toneOscRef = useRef<OscillatorNode | null>(null);

  const currentPreset = TunerPresets.find(p => p.id === selectedPresetId) || TunerPresets[0];

  // Start Mic Listening
  const startTuner = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 4096; // Large window for low bass frequencies
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsListening(true);
      updatePitchLoop();
    } catch (err: any) {
      console.error("Microphone error:", err);
      setMicError("No se pudo acceder al micrófono. Por favor permite el acceso al audio.");
      setIsListening(false);
    }
  };

  // Stop Mic Listening
  const stopTuner = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setIsListening(false);
    setPitch(null);
  };

  // Continuous Pitch Update Loop
  const updatePitchLoop = () => {
    if (!analyserRef.current || !audioCtxRef.current) return;

    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);

    const detectedFreq = autoCorrelate(buffer, audioCtxRef.current.sampleRate);

    if (detectedFreq !== -1 && detectedFreq >= 25 && detectedFreq <= 1000) {
      const noteInfo = getNoteFromFrequency(detectedFreq);
      setPitch({
        freq: Math.round(detectedFreq * 10) / 10,
        noteName: noteInfo.noteName,
        octave: noteInfo.octave,
        cents: noteInfo.cents,
        fullNote: noteInfo.fullNote
      });
    }

    animFrameRef.current = requestAnimationFrame(updatePitchLoop);
  };

  // Reference Tone Generator (Play note sound for tuning by ear)
  const togglePlayReferenceTone = (freq: number) => {
    if (playingToneFreq === freq) {
      stopReferenceTone();
      return;
    }

    stopReferenceTone();

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Warm harmonic tone
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      toneOscRef.current = osc;
      setPlayingToneFreq(freq);
    } catch (err) {
      console.error("Reference tone error:", err);
    }
  };

  const stopReferenceTone = () => {
    if (toneOscRef.current) {
      try {
        toneOscRef.current.stop();
        toneOscRef.current.disconnect();
      } catch (e) {}
      toneOscRef.current = null;
    }
    setPlayingToneFreq(null);
  };

  // Stop everything when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopTuner();
      stopReferenceTone();
    }
  }, [isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopTuner();
      stopReferenceTone();
    };
  }, []);

  if (!isOpen) return null;

  // Calculate meter needle position (-50 cents to +50 cents -> 0% to 100%)
  const currentCents = pitch ? pitch.cents : 0;
  const needlePercent = Math.min(100, Math.max(0, ((currentCents + 50) / 100) * 100));
  const isTunedIn = pitch && Math.abs(pitch.cents) <= 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-zinc-900 via-neutral-950 to-black border border-emerald-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-emerald-500/10 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Guitar className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Afinador Pro Guitarra & Bajo
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Precision Autocorrelation
                </span>
              </h3>
              <p className="text-xs text-neutral-400">Detección cromática en tiempo real vía micrófono</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopTuner();
              stopReferenceTone();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Preset Selector Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              Instrumento y Afinación:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TunerPresets.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPresetId(p.id);
                    setSelectedStringIndex(null);
                  }}
                  className={`p-2.5 rounded-xl text-left border text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                    selectedPresetId === p.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-bold shadow-sm'
                      : 'bg-white/5 text-neutral-300 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  {selectedPresetId === p.id && (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Main Visual Tuner Display */}
          <div className="bg-black/80 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            
            {/* Tuning needle meter bar */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span className="text-amber-400 font-bold">-50 Cents (Grave)</span>
                <span className={`font-bold ${isTunedIn ? 'text-emerald-400 text-xs font-black animate-bounce' : 'text-emerald-300'}`}>
                  {isTunedIn ? '¡AFINADO PERFECTO!' : '0 Cents'}
                </span>
                <span className="text-rose-400 font-bold">+50 Cents (Agudo)</span>
              </div>

              {/* Meter track */}
              <div className="w-full bg-neutral-900 h-6 rounded-full border border-neutral-700 relative overflow-hidden flex items-center px-1">
                {/* Center target indicator */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-2 bg-emerald-500/40 z-0" />
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-emerald-400 z-10" />

                {/* Needle pointer */}
                <div 
                  className={`absolute top-0.5 bottom-0.5 w-3.5 rounded-full transition-all duration-100 z-20 shadow-md ${
                    isTunedIn 
                      ? 'bg-emerald-400 shadow-emerald-500/80 scale-110' 
                      : currentCents < -5 
                      ? 'bg-amber-400 shadow-amber-500/50' 
                      : 'bg-rose-400 shadow-rose-500/50'
                  }`}
                  style={{ left: `calc(${needlePercent}% - 7px)` }}
                />
              </div>
            </div>

            {/* Note & Frequency Big Readout */}
            <div className="my-5 flex flex-col items-center justify-center min-h-[90px]">
              {isListening && pitch ? (
                <div className="flex flex-col items-center animate-in zoom-in-95 duration-100">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-6xl font-black font-display tracking-tight ${
                      isTunedIn ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]' : 'text-white'
                    }`}>
                      {pitch.noteName}
                    </span>
                    <span className="text-2xl font-mono text-neutral-400 font-bold">
                      {pitch.octave}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 font-mono text-xs">
                    <span className="text-neutral-300 font-bold">
                      {pitch.freq} Hz
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-bold ${
                      isTunedIn 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                        : pitch.cents < 0 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {pitch.cents > 0 ? `+${pitch.cents}` : pitch.cents} Cents
                    </span>
                  </div>
                </div>
              ) : isListening ? (
                <div className="flex flex-col items-center gap-2 text-neutral-400 py-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                  <span className="text-xs font-mono">Escuchando instrumento... Toca una cuerda</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-500 py-2">
                  <MicOff className="w-8 h-8 opacity-40" />
                  <span className="text-xs font-mono text-neutral-400">Micrófono desactivado</span>
                </div>
              )}
            </div>

            {/* Mic Toggle Button */}
            <button
              onClick={isListening ? stopTuner : startTuner}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                isListening
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black shadow-lg shadow-emerald-500/20'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Pausar Micrófono
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Activar Micrófono Afinador
                </>
              )}
            </button>

            {micError && (
              <p className="text-[11px] font-mono text-rose-400 mt-2 text-center bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 w-full">
                {micError}
              </p>
            )}
          </div>

          {/* Interactive String Pitch Buttons & Reference Tones */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                Cuerdas Objetivo & Tonos de Referencia:
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">Toca un tono para oírlo</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentPreset.strings.map((str, idx) => {
                const isTonePlaying = playingToneFreq === str.freq;
                const isSelected = selectedStringIndex === idx;

                return (
                  <button
                    key={`${str.note}_${str.octave}_${idx}`}
                    onClick={() => {
                      setSelectedStringIndex(idx);
                      togglePlayReferenceTone(str.freq);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-mono flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isTonePlaying
                        ? 'bg-amber-500 text-zinc-950 font-black border-amber-400 shadow-md scale-105'
                        : isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-bold'
                        : 'bg-white/5 text-neutral-300 border-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="font-black text-sm">{str.note}{str.octave}</span>
                      {isTonePlaying && <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
                    </div>
                    <span className="text-[10px] text-neutral-400 opacity-90 truncate max-w-full">
                      {str.freq} Hz
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/10 bg-white/5 flex items-center justify-between text-[11px] text-neutral-400 shrink-0">
          <span>Soporta afinación de Guitarra eléctrica, acústica y Bajo eléctrico.</span>
          <button
            onClick={() => {
              stopTuner();
              stopReferenceTone();
              onClose();
            }}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs font-bold transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
