import { SongStudioCubaseHelpModal } from "./song_studio/SongStudioCubaseHelpModal";
import { SongStudioDeleteConfirmModal } from "./song_studio/SongStudioDeleteConfirmModal";
import { SongStudioAiGeneratorModal } from "./song_studio/SongStudioAiGeneratorModal";
import { getLowLatencyAudioStream, createCleanAudioRecordingPipeline, cleanAudioBlobOffline, trimAudioBlobLatency, autoDetectAudioLatencyOffset } from "../utils/audioLatency";
import React, { useState, useRef, useEffect } from 'react';
import { Song, SongAudioIdea, AudioTrack, AudioComment, ThemeColors } from '../types';
import { uploadFileToServer, resolveAudioUrl } from '../utils/audioStorage';
import { generateAccompanimentAudioBlob } from '../utils/accompanimentSynth';
import WaveformTrack from './WaveformTrack';
import { SongChordsViewerModal } from './SongChordsViewerModal';
import { 
  X, Play, Pause, Mic, Upload, Volume2, VolumeX, MessageSquare, 
  ThumbsUp, Plus, Music, User, Sparkles, Trash2, Send, Disc,
  Layers, Sliders, Edit2, Check, Radio, Wand2, RefreshCw, FileText, Keyboard,
  Square, Repeat, Flag, RotateCcw, Headphones, ShieldCheck, Filter
} from 'lucide-react';



interface SongStudioModalProps {
  song: Song;
  colors: ThemeColors;
  isStitchLight?: boolean;
  onClose: () => void;
  onUpdateSong: (updatedSong: Song) => void;
  currentUsername?: string;
}

const SECCIONES_TEMA: { key: SongAudioIdea['seccion']; label: string; icon: string; color: string }[] = [
  { key: 'general', label: 'Idea General / Demo', icon: '🎵', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  { key: 'intro', label: 'Intro', icon: '🚀', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { key: 'verso', label: 'Verso / Estrofa', icon: '📝', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { key: 'estribillo', label: 'Estribillo / Chorus', icon: '🔥', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { key: 'puente', label: 'Puente / Bridge', icon: '🌉', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { key: 'solo', label: 'Solo / Arreglo', icon: '🎸', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  { key: 'outro', label: 'Outro / Final', icon: '🏁', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' }
];

// Helper to standardise tracks array from idea
export function getIdeaTracks(idea: SongAudioIdea): AudioTrack[] {
  if (idea.pistas && idea.pistas.length > 0) {
    return idea.pistas;
  }
  // Fallback single track
  return [{
    id: `${idea.id}-track-1`,
    nombre: idea.titulo || 'Pista Principal',
    audioUrl: idea.audioUrl,
    autor: idea.subidoPor,
    instrumento: idea.instrumento,
    fecha: idea.fecha,
    volumen: 1,
    muted: false
  }];
}

export default function SongStudioModal({
  song,
  colors,
  isStitchLight = false,
  onClose,
  onUpdateSong,
  currentUsername = 'Diego'
}: SongStudioModalProps) {
  const songRef = useRef<Song>(song);
  useEffect(() => {
    songRef.current = song;
  }, [song]);

  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('todas');
  const [showChordsModal, setShowChordsModal] = useState<boolean>(false);
  const [showCubaseHelp, setShowCubaseHelp] = useState<boolean>(false);
  const [playingIdeaId, setPlayingIdeaId] = useState<string | null>(null);
  const [currentTimeMap, setCurrentTimeMap] = useState<Record<string, number>>({});
  const [durationMap, setDurationMap] = useState<Record<string, number>>({});
  const [loopConfigMap, setLoopConfigMap] = useState<Record<string, { enabled: boolean; start: number; end: number }>>({});
  
  // Audio upload / new idea form state
  const [showAddIdea, setShowAddIdea] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaSection, setIdeaSection] = useState<SongAudioIdea['seccion']>('general');
  const [ideaNotes, setIdeaNotes] = useState('');
  const [ideaUploader, setIdeaUploader] = useState(currentUsername);
  const [ideaInstrument, setIdeaInstrument] = useState('');
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [driveAudioUrl, setDriveAudioUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Recording main audio for new idea
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const recordingPromiseRef = useRef<Promise<string> | null>(null);

  // --- MULTITRACK (OVERDUB) STATE ---
  const [addingTrackIdeaId, setAddingTrackIdeaId] = useState<string | null>(null);
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackInstrument, setNewTrackInstrument] = useState('');
  const [selectedTrackFile, setSelectedTrackFile] = useState<File | null>(null);
  const [isRecordingTrack, setIsRecordingTrack] = useState(false);
  const [recordingTrackIdeaId, setRecordingTrackIdeaId] = useState<string | null>(null);
  const [recordingTrackTime, setRecordingTrackTime] = useState(0);
  const trackMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const trackAudioChunksRef = useRef<Blob[]>([]);
  const trackRecordingTimerRef = useRef<any>(null);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editingTrackName, setEditingTrackName] = useState('');

  // DSP Noise Reduction & Anti-Bleed Studio Settings
  const [useCleanDSPFilter, setUseCleanDSPFilter] = useState<boolean>(true);
  const [useEchoCancellation, setUseEchoCancellation] = useState<boolean>(true);
  const [useNoiseSuppression, setUseNoiseSuppression] = useState<boolean>(true);
  const [autoLatencyTrimMs, setAutoLatencyTrimMs] = useState<number>(110);
  const [cleaningTrackId, setCleaningTrackId] = useState<string | null>(null);
  const cleanPipelineRef = useRef<any>(null);

  // Resolved audio URLs for HTML audio elements (resolves indexeddb: and drive URLs)
  const [resolvedAudioUrls, setResolvedAudioUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    const resolveAllTracks = async () => {
      const allTracks: AudioTrack[] = [];
      (song.audioIdeas || []).forEach(idea => {
        const trs = getIdeaTracks(idea);
        allTracks.push(...trs);
      });

      const urlMap: Record<string, string> = {};
      for (const tr of allTracks) {
        if (tr.audioUrl) {
          if (tr.audioUrl.startsWith('indexeddb:') || tr.audioUrl.includes('drive.google.com')) {
            const res = await resolveAudioUrl(tr.audioUrl);
            if (res) urlMap[tr.id] = res;
          } else {
            urlMap[tr.id] = tr.audioUrl;
          }
        }
      }

      if (isMounted) {
        setResolvedAudioUrls(urlMap);
      }
    };

    resolveAllTracks();
    return () => { isMounted = false; };
  }, [song]);

  // --- ACCOMPANIMENT GENERATOR STATE ---
  const [showGenModalForIdea, setShowGenModalForIdea] = useState<SongAudioIdea | null>(null);
  const [genBpm, setGenBpm] = useState<number>(song.bpm || 120);
  const [genKey, setGenKey] = useState<string>(song.tonalidad || 'Do');
  const [genDuration, setGenDuration] = useState<number>(30);
  const [includeDrums, setIncludeDrums] = useState<boolean>(true);
  const [includeBass, setIncludeBass] = useState<boolean>(true);
  const [drumStyle, setDrumStyle] = useState<'rock' | 'pop' | 'funk' | 'reggae'>('rock');
  const [isGeneratingAccompaniment, setIsGeneratingAccompaniment] = useState<boolean>(false);

  // --- NEW IDEA AI BASE GENERATION STATE ---
  const [genAiOnNewIdea, setGenAiOnNewIdea] = useState<boolean>(false);
  const [newIdeaBpm, setNewIdeaBpm] = useState<number>(song.bpm || 120);
  const [newIdeaKey, setNewIdeaKey] = useState<string>(song.tonalidad || 'Do');
  const [newIdeaStyle, setNewIdeaStyle] = useState<'rock' | 'pop' | 'funk' | 'reggae'>('rock');
  const [newIdeaIncludeDrums, setNewIdeaIncludeDrums] = useState<boolean>(true);
  const [newIdeaIncludeBass, setNewIdeaIncludeBass] = useState<boolean>(true);

  // --- SONG ORIGINAL BASE TRACK STATE ---
  const [useSongBaseTrack, setUseSongBaseTrack] = useState<boolean>(false);
  const [selectedSongBaseUrl, setSelectedSongBaseUrl] = useState<string>(
    song.audioPrincipalUrl || (song.audioIdeas && song.audioIdeas[0]?.audioUrl) || ''
  );

  useEffect(() => {
    if (song.audioPrincipalUrl) {
      setSelectedSongBaseUrl(song.audioPrincipalUrl);
    } else if (song.audioIdeas && song.audioIdeas.length > 0 && song.audioIdeas[0]?.audioUrl) {
      setSelectedSongBaseUrl(song.audioIdeas[0].audioUrl);
    }
  }, [song]);

  // --- CONFIRMATION MODAL STATE FOR DELETIONS ---
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const handleGenerateAccompaniment = async () => {
    if (!showGenModalForIdea) return;
    try {
      setIsGeneratingAccompaniment(true);

      const wavBlob = await generateAccompanimentAudioBlob({
        bpm: genBpm,
        durationSecs: genDuration,
        keyName: genKey,
        includeDrums,
        includeBass,
        drumPattern: drumStyle
      });

      const fileName = `sugerencia-${drumStyle}-${genKey}-${Date.now()}.wav`;
      const file = new File([wavBlob], fileName, { type: 'audio/wav' });

      const serverUrl = await uploadFileToServer(file);

      let trackLabel = 'Ref IA: Batería y Bajo';
      if (includeDrums && includeBass) trackLabel = `🥁🎸 Ref AI (${drumStyle.toUpperCase()} - ${genKey})`;
      else if (includeDrums) trackLabel = `🥁 Ref AI: Batería (${drumStyle.toUpperCase()})`;
      else if (includeBass) trackLabel = `🎸 Ref AI: Bajo Tónica (${genKey})`;

      saveNewTrackToIdea(
        showGenModalForIdea, 
        serverUrl, 
        trackLabel, 
        includeDrums && includeBass ? 'Batería + Bajo (AI)' : includeDrums ? 'Batería (AI)' : 'Bajo (AI)'
      );

      setShowGenModalForIdea(null);
      alert(`¡Acompañamiento sintetizado con éxito! Se ha agregado al mezclador multipista como "${trackLabel}". Sincronizado a ${genBpm} BPM.`);
    } catch (err) {
      console.error("Error al generar acompañamiento:", err);
      alert("Error al sintetizar el acompañamiento de referencia.");
    } finally {
      setIsGeneratingAccompaniment(false);
    }
  };

  // Comment input state
  const [commentTextMap, setCommentTextMap] = useState<Record<string, string>>({});
  const [commentTimeTagMap, setCommentTimeTagMap] = useState<Record<string, number | null>>({});

  // Audio elements refs map for multitrack: trackAudioRefs.current[trackId]
  const trackAudioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  
  // High-precision WebAudio & Synchronization Master Engine Refs
  const studioAudioCtxRef = useRef<AudioContext | null>(null);
  const syncAnimationFrameRef = useRef<number | null>(null);
  const playingIdeaIdRef = useRef<string | null>(null);

  const ideasList = song.audioIdeas || [];

  const filteredIdeas = activeSectionFilter === 'todas' 
    ? ideasList 
    : ideasList.filter(i => i.seccion === activeSectionFilter);

  // Safe helper to extract finite audio duration in seconds
  const getSafeTrackDuration = (el: HTMLAudioElement | null | undefined): number => {
    if (!el) return 0;
    const dur = el.duration;
    if (dur && !isNaN(dur) && isFinite(dur) && dur > 0) return dur;
    return 0;
  };

  const getValidIdeaDuration = (ideaId: string): number => {
    const raw = durationMap[ideaId];
    if (raw && !isNaN(raw) && isFinite(raw) && raw > 0) {
      return raw;
    }
    return 30;
  };

  // Format seconds to M:SS
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Cue Loop Helper Functions
  const toggleIdeaLoop = (idea: SongAudioIdea) => {
    const maxDur = getValidIdeaDuration(idea.id);
    setLoopConfigMap(prev => {
      const current = prev[idea.id] || { enabled: false, start: 0, end: maxDur };
      return {
        ...prev,
        [idea.id]: { ...current, enabled: !current.enabled }
      };
    });
  };

  const setIdeaCueIn = (idea: SongAudioIdea) => {
    const curTime = currentTimeMap[idea.id] || 0;
    const maxDur = getValidIdeaDuration(idea.id);
    setLoopConfigMap(prev => {
      const current = prev[idea.id] || { enabled: true, start: 0, end: maxDur };
      const newEnd = current.end > curTime ? current.end : maxDur;
      return {
        ...prev,
        [idea.id]: { enabled: true, start: curTime, end: newEnd }
      };
    });
  };

  const setIdeaCueOut = (idea: SongAudioIdea) => {
    const curTime = currentTimeMap[idea.id] || 0;
    const maxDur = getValidIdeaDuration(idea.id);
    setLoopConfigMap(prev => {
      const current = prev[idea.id] || { enabled: true, start: 0, end: maxDur };
      const newStart = current.start < curTime ? current.start : 0;
      return {
        ...prev,
        [idea.id]: { enabled: true, start: newStart, end: curTime }
      };
    });
  };

  const resetIdeaLoopBounds = (idea: SongAudioIdea) => {
    const maxDur = getValidIdeaDuration(idea.id);
    setLoopConfigMap(prev => ({
      ...prev,
      [idea.id]: { enabled: true, start: 0, end: maxDur }
    }));
  };

  // High-Precision Master Sync Loop (16ms / requestAnimationFrame)
  // Keeps all multitrack audio elements aligned within < 10ms with pitch-safe micro-adjustments
  // Handles variable track durations cleanly by padding shorter tracks
  const runMasterSyncLoop = (idea: SongAudioIdea) => {
    if (syncAnimationFrameRef.current) {
      cancelAnimationFrame(syncAnimationFrameRef.current);
      syncAnimationFrameRef.current = null;
    }

    const tracks = getIdeaTracks(idea);
    if (tracks.length === 0) return;

    const hasSolo = tracks.some((t: any) => t.solo);

    // 1. Determine maximum idea duration across all loaded audio tracks
    let maxIdeaDuration = 0;
    tracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      const dur = getSafeTrackDuration(el);
      if (dur > maxIdeaDuration) {
        maxIdeaDuration = dur;
      }
    });
    if (maxIdeaDuration === 0 || !isFinite(maxIdeaDuration)) {
      maxIdeaDuration = getValidIdeaDuration(idea.id);
    }

    // 2. Select master clock track element (longest active non-muted track)
    let masterTrack = tracks[0];
    let longestDur = 0;
    tracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      const dur = getSafeTrackDuration(el);
      if (dur >= longestDur && !tr.muted) {
        longestDur = dur;
        masterTrack = tr;
      }
    });

    let masterEl = trackAudioRefs.current[masterTrack.id];
    if (!masterEl) {
      for (const tr of tracks) {
        if (trackAudioRefs.current[tr.id]) {
          masterEl = trackAudioRefs.current[tr.id];
          break;
        }
      }
    }

    let lastReportedTime = -1;

    const tick = () => {
      if (playingIdeaIdRef.current !== idea.id) {
        return;
      }

      // Read fresh track definitions and solo status from songRef
      const currentSong = songRef.current || song;
      const currentIdea = (currentSong.audioIdeas || []).find(i => i.id === idea.id) || idea;
      const activeTracks = getIdeaTracks(currentIdea);
      const activeHasSolo = activeTracks.some(t => t.solo);

      // Re-evaluate masterEl dynamically to prioritize actively playing, unmuted audio elements
      let currentMasterEl: HTMLAudioElement | null = null;

      // 1st Priority: Active playing audio element that is unmuted
      for (const tr of activeTracks) {
        const isMuted = tr.muted || (activeHasSolo && !tr.solo);
        const el = trackAudioRefs.current[tr.id];
        if (el && !el.paused && !isMuted && el.currentTime >= 0) {
          currentMasterEl = el;
          break;
        }
      }

      // 2nd Priority: Any active playing audio element
      if (!currentMasterEl) {
        for (const tr of activeTracks) {
          const el = trackAudioRefs.current[tr.id];
          if (el && !el.paused && el.currentTime >= 0) {
            currentMasterEl = el;
            break;
          }
        }
      }

      // 3rd Priority: Fallback to initial master element or any available track element
      if (!currentMasterEl) {
        currentMasterEl = masterEl || trackAudioRefs.current[masterTrack.id] || null;
        if (!currentMasterEl) {
          for (const tr of activeTracks) {
            if (trackAudioRefs.current[tr.id]) {
              currentMasterEl = trackAudioRefs.current[tr.id];
              break;
            }
          }
        }
      }

      const masterTime = currentMasterEl ? currentMasterEl.currentTime : (currentTimeMap[idea.id] || 0);

      // Loop / Cue Bounds
      const loopCfg = loopConfigMap[idea.id];
      const isLoopEnabled = !!loopCfg?.enabled;
      const loopStart = loopCfg?.start || 0;
      const loopEnd = (loopCfg?.end && isFinite(loopCfg.end) && loopCfg.end > loopStart) ? loopCfg.end : maxIdeaDuration;

      // A. Loop Cue Detection: Check if loop end point hit
      if (isLoopEnabled && masterTime >= loopEnd - 0.05) {
        handleSeekIdea(idea, loopStart);
        syncAnimationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      // B. Align and enforce playback on all active tracks
      activeTracks.forEach(tr => {
        const slaveEl = trackAudioRefs.current[tr.id];
        if (!slaveEl) return;

        const slaveDur = getSafeTrackDuration(slaveEl);
        const isMuted = tr.muted || (activeHasSolo && !tr.solo);
        // Muted tracks play at volume 0 so they remain synchronized in background without freezing
        slaveEl.volume = isMuted ? 0 : (tr.volumen ?? 1);

        const trackOffsetSec = (tr.desfaseMs || 0) / 1000;
        const targetSlaveTime = masterTime - trackOffsetSec;

        // If master has not reached track offset yet, keep slave paused at 0
        if (targetSlaveTime < 0) {
          if (!slaveEl.paused) slaveEl.pause();
          try { slaveEl.currentTime = 0; } catch {}
          return;
        }

        // If track has ended its length, keep it quietly paused at end
        if (slaveDur > 0 && targetSlaveTime >= slaveDur - 0.05) {
          if (!slaveEl.paused) slaveEl.pause();
          return;
        }

        // Ensure slave element is playing if in active audio range
        if (slaveEl.paused && (slaveDur === 0 || targetSlaveTime < slaveDur - 0.05)) {
          slaveEl.play().catch(() => {});
        }

        // Pitch-safe micro drift adjustment relative to masterEl with per-track latency offset
        if (currentMasterEl && slaveEl !== currentMasterEl) {
          const diff = slaveEl.currentTime - targetSlaveTime;
          const absDiff = Math.abs(diff);
          if (absDiff > 0.04) {
            // Hard seek if drift exceeds 40ms to keep tracks sample-aligned without flam/lag
            try { slaveEl.currentTime = Math.max(0, targetSlaveTime); } catch {}
            slaveEl.playbackRate = 1.0;
          } else if (absDiff > 0.008) {
            // Dynamic rate adjustment (corrects 5ms to 40ms drift in <100ms)
            const speedAdj = Math.max(-0.20, Math.min(0.20, -diff * 5.0));
            slaveEl.playbackRate = 1.0 + speedAdj;
          } else {
            slaveEl.playbackRate = 1.0;
          }
        }
      });

      // Update progress & duration maps smoothly without flooding React re-renders
      if (Math.abs(masterTime - lastReportedTime) >= 0.01 || lastReportedTime < 0) {
        lastReportedTime = masterTime;
        setCurrentTimeMap(prev => ({ ...prev, [idea.id]: masterTime }));
      }

      if (maxIdeaDuration > 0 && isFinite(maxIdeaDuration)) {
        setDurationMap(prev => ({ ...prev, [idea.id]: maxIdeaDuration }));
      }

      // Check if finished (if loop is disabled)
      if (!isLoopEnabled && maxIdeaDuration > 0 && currentMasterEl && (currentMasterEl.ended || masterTime >= maxIdeaDuration - 0.05)) {
        handleStopIdea(idea);
        return;
      }

      syncAnimationFrameRef.current = requestAnimationFrame(tick);
    };

    syncAnimationFrameRef.current = requestAnimationFrame(tick);
  };

  // Master Transport: Pause (holds position)
  const handlePauseIdea = (idea: SongAudioIdea) => {
    if (syncAnimationFrameRef.current) {
      cancelAnimationFrame(syncAnimationFrameRef.current);
      syncAnimationFrameRef.current = null;
    }
    const tracks = getIdeaTracks(idea);
    tracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        el.pause();
        el.playbackRate = 1.0;
      }
    });
    playingIdeaIdRef.current = null;
    setPlayingIdeaId(null);
  };

  // Master Transport: Stop (resets position to start / loop start)
  const handleStopIdea = (idea: SongAudioIdea) => {
    if (syncAnimationFrameRef.current) {
      cancelAnimationFrame(syncAnimationFrameRef.current);
      syncAnimationFrameRef.current = null;
    }
    const tracks = getIdeaTracks(idea);
    const loopCfg = loopConfigMap[idea.id];
    const startPos = (loopCfg && loopCfg.enabled && loopCfg.start > 0) ? loopCfg.start : 0;

    tracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        el.pause();
        const targetTrackTime = Math.max(0, startPos - ((tr.desfaseMs || 0) / 1000));
        try { el.currentTime = targetTrackTime; } catch {}
        el.playbackRate = 1.0;
      }
    });

    setCurrentTimeMap(prev => ({ ...prev, [idea.id]: startPos }));
    playingIdeaIdRef.current = null;
    setPlayingIdeaId(null);
  };

  // Master Transport: Play (starts/resumes from current position)
  const handlePlayIdea = (idea: SongAudioIdea) => {
    // Unlock and resume AudioContext non-blockingly for low-latency playback
    try {
      if (!studioAudioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) studioAudioCtxRef.current = new AudioCtx();
      }
      if (studioAudioCtxRef.current && studioAudioCtxRef.current.state === 'suspended') {
        studioAudioCtxRef.current.resume().catch((e) => console.warn("AudioContext resume warning:", e));
      }
    } catch (e) {
      console.warn("AudioContext resume warning:", e);
    }

    // Pause all audio from other ideas
    (Object.values(trackAudioRefs.current) as (HTMLAudioElement | null)[]).forEach(el => {
      if (el) el.pause();
    });

    const tracks = getIdeaTracks(idea);
    if (tracks.length === 0) return;

    const hasSoloTrack = tracks.some(t => t.solo);
    let startPos = currentTimeMap[idea.id] || 0;

    let maxDur = 0;
    tracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      const dur = getSafeTrackDuration(el);
      if (dur > maxDur) maxDur = dur;
    });
    if (maxDur === 0) maxDur = getValidIdeaDuration(idea.id);

    // Auto rewind if at or beyond end
    if (maxDur > 0 && startPos >= maxDur - 0.2) {
      startPos = 0;
      setCurrentTimeMap(prev => ({ ...prev, [idea.id]: 0 }));
    }

    // Set playing state IMMEDIATELY so UI reflects playback and loop runs
    playingIdeaIdRef.current = idea.id;
    setPlayingIdeaId(idea.id);

    // 1. Pre-synchronize initial timestamps & volumes across all tracks with precise per-track latency offsets
    tracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        const trackDur = getSafeTrackDuration(el);
        const trackOffsetSec = (tr.desfaseMs || 0) / 1000;
        const targetTrackTime = Math.max(0, startPos - trackOffsetSec);

        if (trackDur > 0 && startPos >= trackDur) {
          try { el.currentTime = trackDur; } catch {}
          el.pause();
        } else {
          // Avoid triggering unnecessary asynchronous browser seek if element is already at target time
          if (Math.abs((el.currentTime || 0) - targetTrackTime) > 0.03) {
            try { el.currentTime = targetTrackTime; } catch {}
          }
          el.playbackRate = 1.0;
          const isMuted = tr.muted || (hasSoloTrack && !tr.solo);
          el.volume = isMuted ? 0 : (tr.volumen ?? 1);
        }
      }
    });

    // 2. Fire play calls synchronously for active tracks in the click callstack
    tracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        const resolvedUrl = resolvedAudioUrls[tr.id];
        if (resolvedUrl && (!el.src || el.src === '' || el.src.endsWith('undefined'))) {
          el.src = resolvedUrl;
        }
        if (el.readyState === 0 && el.src) {
          try { el.load(); } catch {}
        }
        const trackDur = getSafeTrackDuration(el);
        if (trackDur === 0 || startPos < trackDur) {
          const playPromise = el.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.warn(`Track ${tr.id} play deferred:`, err);
              const onCanPlay = () => {
                if (playingIdeaIdRef.current === idea.id) {
                  el.play().catch(() => {});
                }
                el.removeEventListener('canplay', onCanPlay);
              };
              el.addEventListener('canplay', onCanPlay);
            });
          }
        }
      }
    });

    // 3. Launch Master Sync Engine
    runMasterSyncLoop(idea);
  };

  // Toggle Play / Pause
  const togglePlayIdea = async (idea: SongAudioIdea) => {
    if (playingIdeaId === idea.id) {
      handlePauseIdea(idea);
    } else {
      await handlePlayIdea(idea);
    }
  };

  // Seek master progress for an idea
  const handleSeekIdea = (idea: SongAudioIdea, newTime: number) => {
    const tracks = getIdeaTracks(idea);
    const targetTime = Math.max(0, newTime);

    tracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        const dur = getSafeTrackDuration(el);
        if (dur > 0 && targetTime >= dur) {
          el.currentTime = dur;
          if (!el.paused) el.pause();
        } else {
          el.currentTime = targetTime;
          el.playbackRate = 1.0;
          if (playingIdeaIdRef.current === idea.id && el.paused && !tr.muted) {
            el.play().catch(() => {});
          }
        }
      }
    });
    setCurrentTimeMap(prev => ({ ...prev, [idea.id]: targetTime }));

    if (playingIdeaIdRef.current === idea.id) {
      runMasterSyncLoop(idea);
    }
  };

  // Jump to timestamp from comment
  const jumpToTime = (idea: SongAudioIdea, timestampSegs: number) => {
    handleSeekIdea(idea, timestampSegs);
    if (playingIdeaId !== idea.id) {
      handlePlayIdea(idea);
    }
  };

  // Cleanup sync loop on unmount or idea change
  useEffect(() => {
    return () => {
      if (syncAnimationFrameRef.current) {
        cancelAnimationFrame(syncAnimationFrameRef.current);
      }
    };
  }, []);

  // Cubase Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keypresses if typing in input, textarea, select or contenteditable
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toUpperCase();
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || (activeEl as HTMLElement).isContentEditable) {
          return;
        }
      }

      const activeIdea = (song.audioIdeas || []).find(i => i.id === playingIdeaIdRef.current) || (song.audioIdeas || [])[0];

      // If currently recording an overdub track, pressing R, Space, or Stop keys finishes recording
      if (isRecordingTrack) {
        if (['Space', 'Numpad0', 'Digit0', 'KeyR', 'NumpadMultiply', 'KeyP', 'Escape', 'Home', 'NumpadEnter'].includes(e.code) || e.key === 'Home') {
          e.preventDefault();
          stopRecordingTrackOverdub();
          return;
        }
      }

      // [Espacio]: Alternar Reproducir / Pausar Transport
      if (e.code === 'Space') {
        e.preventDefault();
        if (activeIdea) {
          togglePlayIdea(activeIdea);
        }
      }
      // [Numpad0 / Digit0 / Home / Escape / Enter]: Detener e ir a inicio (Stop & Rewind)
      else if (e.code === 'Numpad0' || e.code === 'Digit0' || e.key === 'Home' || e.code === 'NumpadEnter') {
        e.preventDefault();
        if (activeIdea) {
          handleStopIdea(activeIdea);
        }
      }
      // [KeyP]: Pausar en posición actual
      else if (e.code === 'KeyP') {
        e.preventDefault();
        if (activeIdea) {
          handlePauseIdea(activeIdea);
        }
      }
      // [KeyL / Slash]: Alternar Bucle (Loop)
      else if (e.code === 'KeyL' || e.code === 'Slash') {
        e.preventDefault();
        if (activeIdea) {
          toggleIdeaLoop(activeIdea);
        }
      }
      // [KeyI]: Fijar Cue In / Loop Start en la posición actual
      else if (e.code === 'KeyI') {
        e.preventDefault();
        if (activeIdea) {
          setIdeaCueIn(activeIdea);
        }
      }
      // [KeyO]: Fijar Cue Out / Loop End en la posición actual
      else if (e.code === 'KeyO') {
        e.preventDefault();
        if (activeIdea) {
          setIdeaCueOut(activeIdea);
        }
      }
      // [KeyR / NumpadMultiply]: Iniciar grabación overdub
      else if (e.code === 'KeyR' || e.code === 'NumpadMultiply') {
        e.preventDefault();
        if (activeIdea) {
          startRecordingTrackOverdub(activeIdea);
        } else {
          setShowAddIdea(true);
        }
      }
      // [KeyN]: Abrir/Cerrar formulario de Nueva Idea
      else if (e.code === 'KeyN') {
        e.preventDefault();
        setShowAddIdea(prev => !prev);
      }
      // [Flecha Izquierda]: Retroceder 5s (o 15s con Shift)
      else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (activeIdea) {
          const cur = currentTimeMap[activeIdea.id] || 0;
          const delta = e.shiftKey ? 15 : 5;
          handleSeekIdea(activeIdea, Math.max(0, cur - delta));
        }
      }
      // [Flecha Derecha]: Avanzar 5s (o 15s con Shift)
      else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (activeIdea) {
          const cur = currentTimeMap[activeIdea.id] || 0;
          const maxDur = durationMap[activeIdea.id] || 300;
          const delta = e.shiftKey ? 15 : 5;
          handleSeekIdea(activeIdea, Math.min(maxDur, cur + delta));
        }
      }
      // [KeyM]: Alternar Silencio (Mute) en la idea activa
      else if (e.code === 'KeyM') {
        e.preventDefault();
        if (activeIdea) {
          const tracks = getIdeaTracks(activeIdea);
          if (tracks.length > 0) {
            tracks.forEach(tr => handleToggleMuteTrack(activeIdea, tr.id));
          }
        }
      }
      // [KeyS]: Alternar Solo en la primera pista
      else if (e.code === 'KeyS') {
        e.preventDefault();
        if (activeIdea) {
          const tracks = getIdeaTracks(activeIdea);
          if (tracks.length > 0) {
            handleToggleSoloTrack(activeIdea, tracks[0].id);
          }
        }
      }
      // [KeyK or ?]: Abrir / Cerrar guía de atajos Cubase
      else if (e.code === 'KeyK' || e.key === '?') {
        e.preventDefault();
        setShowCubaseHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [song, currentTimeMap, durationMap, loopConfigMap]);

  // Handle Track Volume Change
  const handleTrackVolumeChange = (idea: SongAudioIdea, trackId: string, newVol: number) => {
    const tracks = getIdeaTracks(idea);
    const updatedTracks = tracks.map(tr => tr.id === trackId ? { ...tr, volumen: newVol } : tr);
    const hasSolo = updatedTracks.some(t => t.solo);

    updatedTracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        const isTrackAudible = (hasSolo ? !!tr.solo : true) && !tr.muted;
        el.volume = isTrackAudible ? (tr.volumen ?? 1) : 0;
      }
    });

    const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { ...i, pistas: updatedTracks } : i);
    const updatedSong = { ...song, audioIdeas: updatedIdeas };
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Track Latency Desfase Change (Nudge in ms)
  const handleTrackDesfaseChange = (idea: SongAudioIdea, trackId: string, newDesfaseMs: number) => {
    const tracks = getIdeaTracks(idea);
    const updatedTracks = tracks.map(tr => tr.id === trackId ? { ...tr, desfaseMs: newDesfaseMs } : tr);
    
    // Immediately adjust active element currentTime if currently playing
    const el = trackAudioRefs.current[trackId];
    if (el) {
      const masterTime = currentTimeMap[idea.id] || 0;
      const targetTime = Math.max(0, masterTime - (newDesfaseMs / 1000));
      try { el.currentTime = targetTime; } catch {}
    }

    const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { ...i, pistas: updatedTracks } : i);
    const updatedSong = { ...song, audioIdeas: updatedIdeas };
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Track Mute Toggle
  const handleToggleMuteTrack = (idea: SongAudioIdea, trackId: string) => {
    const tracks = getIdeaTracks(idea);
    const updatedTracks = tracks.map(tr => tr.id === trackId ? { ...tr, muted: !tr.muted } : tr);
    const hasSolo = updatedTracks.some(t => t.solo);

    updatedTracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        const isTrackAudible = (hasSolo ? !!tr.solo : true) && !tr.muted;
        el.volume = isTrackAudible ? (tr.volumen ?? 1) : 0;
      }
    });

    const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { ...i, pistas: updatedTracks } : i);
    const updatedSong = { ...song, audioIdeas: updatedIdeas };
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Track Solo Toggle
  const handleToggleSoloTrack = (idea: SongAudioIdea, trackId: string) => {
    const tracks = getIdeaTracks(idea);
    const updatedTracks = tracks.map(tr => tr.id === trackId ? { ...tr, solo: !tr.solo } : tr);
    const hasSolo = updatedTracks.some(t => t.solo);

    updatedTracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        const isTrackAudible = (hasSolo ? !!tr.solo : true) && !tr.muted;
        el.volume = isTrackAudible ? (tr.volumen ?? 1) : 0;
      }
    });

    const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { ...i, pistas: updatedTracks } : i);
    const updatedSong = { ...song, audioIdeas: updatedIdeas };
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Rename track
  const handleSaveTrackName = (idea: SongAudioIdea, trackId: string, newName: string) => {
    if (!newName.trim()) return;
    const tracks = getIdeaTracks(idea);
    const updatedTracks = tracks.map(tr => tr.id === trackId ? { ...tr, nombre: newName.trim() } : tr);
    const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { ...i, pistas: updatedTracks } : i);
    onUpdateSong({ ...song, audioIdeas: updatedIdeas });
    setEditingTrackId(null);
  };

  // Delete track from idea (shows custom confirmation modal)
  const handleDeleteTrack = (idea: SongAudioIdea, trackId: string) => {
    const tracks = getIdeaTracks(idea);
    const track = tracks.find(t => t.id === trackId);

    if (tracks.length <= 1) {
      setConfirmDeleteModal({
        title: 'Eliminar Idea Completa',
        description: `Esta pista es la única de la idea "${idea.titulo}". ¿Deseas eliminar la idea completa del tema?`,
        onConfirm: () => {
          handleDeleteIdea(undefined, idea.id, true);
        }
      });
      return;
    }

    setConfirmDeleteModal({
      title: 'Eliminar Pista de Audio',
      description: `¿Deseas eliminar la pista "${track?.nombre || 'Pista'}" de la mezcla de "${idea.titulo}"?`,
      onConfirm: () => {
        const el = trackAudioRefs.current[trackId];
        if (el) el.pause();

        const updatedTracks = tracks.filter(tr => tr.id !== trackId);
        const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { 
          ...i, 
          pistas: updatedTracks,
          audioUrl: updatedTracks[0]?.audioUrl || i.audioUrl
        } : i);
        onUpdateSong({ ...song, audioIdeas: updatedIdeas });
      }
    });
  };

  // --- OVERDUB / ADDING NEW TRACK TO IDEA ---
  const startRecordingTrackOverdub = async (idea: SongAudioIdea) => {
    try {
      // Resume studio audio context if suspended
      try {
        if (!studioAudioCtxRef.current) {
          const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtxClass) studioAudioCtxRef.current = new AudioCtxClass();
        }
        if (studioAudioCtxRef.current && studioAudioCtxRef.current.state === 'suspended') {
          await studioAudioCtxRef.current.resume();
        }
      } catch (e) {
        console.warn("AudioContext resume during overdub:", e);
      }

      // 1. Request microphone permission with hardware Echo Cancellation & Noise Suppression options
      const rawStream = await getLowLatencyAudioStream({
        echoCancellation: useEchoCancellation,
        noiseSuppression: useNoiseSuppression,
        autoGainControl: false,
      });

      let streamToRecord = rawStream;
      if (useCleanDSPFilter) {
        const pipeline = createCleanAudioRecordingPipeline(rawStream, studioAudioCtxRef.current);
        cleanPipelineRef.current = pipeline;
        streamToRecord = pipeline.cleanStream;
      }

      const mediaRecorder = new MediaRecorder(streamToRecord);
      trackMediaRecorderRef.current = mediaRecorder;
      trackAudioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) trackAudioChunksRef.current.push(e.data);
      };

      const tracks = getIdeaTracks(idea);
      const hasSolo = tracks.some((t: any) => t.solo);
      const activeBackingTracks = tracks.filter(t => !t.muted && (!hasSolo || (t as any).solo));

      // 2. Pre-align backing tracks at position 0
      setCurrentTimeMap(prev => ({ ...prev, [idea.id]: 0 }));
      tracks.forEach(tr => {
        const el = trackAudioRefs.current[tr.id];
        if (el) {
          el.currentTime = 0;
          el.playbackRate = 1.0;
          const isMuted = tr.muted || (hasSolo && !(tr as any).solo);
          el.volume = isMuted ? 0 : (tr.volumen ?? 1);
        }
      });

      // 3. Play backing track audio FIRST so sound is emitted before mic recording captures performance
      const playPromises = activeBackingTracks.map(tr => {
        const el = trackAudioRefs.current[tr.id];
        if (el) {
          el.currentTime = 0;
          return el.play().catch(e => console.error("Backing track playback error:", e));
        }
        return Promise.resolve();
      });

      await Promise.all(playPromises);

      // 4. Start MediaRecorder immediately after backing tracks begin playback
      mediaRecorder.start(20);
      setIsRecordingTrack(true);
      setRecordingTrackIdeaId(idea.id);
      setRecordingTrackTime(0);

      if (trackRecordingTimerRef.current) {
        clearInterval(trackRecordingTimerRef.current);
      }
      trackRecordingTimerRef.current = setInterval(() => {
        setRecordingTrackTime(prev => prev + 1);
      }, 1000);

      // Launch master sync loop during overdub session
      playingIdeaIdRef.current = idea.id;
      setPlayingIdeaId(idea.id);
      runMasterSyncLoop(idea);

      mediaRecorder.onstop = async () => {
        if (syncAnimationFrameRef.current) {
          cancelAnimationFrame(syncAnimationFrameRef.current);
          syncAnimationFrameRef.current = null;
        }
        playingIdeaIdRef.current = null;
        setPlayingIdeaId(null);
        setIsRecordingTrack(false);
        setRecordingTrackIdeaId(null);

        if (trackRecordingTimerRef.current) {
          clearInterval(trackRecordingTimerRef.current);
        }

        // Stop all backing track audio elements
        tracks.forEach(tr => {
          const el = trackAudioRefs.current[tr.id];
          if (el) {
            el.pause();
            el.playbackRate = 1.0;
          }
        });

        // Cleanup stream & DSP pipeline
        if (cleanPipelineRef.current) {
          cleanPipelineRef.current.cleanup();
          cleanPipelineRef.current = null;
        }
        rawStream.getTracks().forEach(track => track.stop());

        const rawAudioBlob = new Blob(trackAudioChunksRef.current, { type: 'audio/webm' });

        try {
          setIsUploading(true);
          let finalBlob = rawAudioBlob;

          // Auto DSP/AI correlation latency detection against master backing track
          let detectedOffsetMs = 0;
          const refTrack = tracks[0] || (idea.audioUrl ? { audioUrl: idea.audioUrl } : null);
          if (refTrack && refTrack.audioUrl) {
            try {
              const masterResolvedUrl = await resolveAudioUrl(refTrack.audioUrl);
              detectedOffsetMs = await autoDetectAudioLatencyOffset(masterResolvedUrl, rawAudioBlob);
            } catch (e) {
              console.warn("Auto latency detection during overdub:", e);
            }
          }

          // Calculate total latency lag to physically trim from recording start
          const isMobileDevice = /iPad|iPhone|iPod|Android/i.test(navigator.userAgent);
          const defaultHardwareLagMs = isMobileDevice ? 240 : 120;
          const totalLagToTrimMs = autoLatencyTrimMs > 0
            ? Math.max(autoLatencyTrimMs, detectedOffsetMs > 0 ? detectedOffsetMs : defaultHardwareLagMs)
            : (detectedOffsetMs > 0 ? detectedOffsetMs : 0);

          if (totalLagToTrimMs > 0) {
            finalBlob = await trimAudioBlobLatency(rawAudioBlob, totalLagToTrimMs);
          }
          if (useCleanDSPFilter) {
            finalBlob = await cleanAudioBlobOffline(finalBlob);
          }
          const file = new File([finalBlob], `track-${Date.now()}.wav`, { type: 'audio/wav' });
          const serverUrl = await uploadFileToServer(file);
          const trackName = newTrackName.trim() || `Pista ${tracks.length + 1}`;
          const instrument = newTrackInstrument.trim() || undefined;
          saveNewTrackToIdea(idea, serverUrl, trackName, instrument, 0);
        } catch (err) {
          console.error("Error uploading track recording:", err);
          alert("Error al guardar la nueva pista en el disco del servidor.");
        } finally {
          setIsUploading(false);
        }
      };
    } catch (err) {
      setIsRecordingTrack(false);
      setRecordingTrackIdeaId(null);
      if (trackRecordingTimerRef.current) {
        clearInterval(trackRecordingTimerRef.current);
      }
      alert("No se pudo acceder al micrófono para grabar la pista.");
      console.error(err);
    }
  };

  const stopRecordingTrackOverdub = () => {
    if (trackMediaRecorderRef.current && trackMediaRecorderRef.current.state !== 'inactive') {
      trackMediaRecorderRef.current.stop();
    }
    setIsRecordingTrack(false);
    setRecordingTrackIdeaId(null);
    if (trackRecordingTimerRef.current) {
      clearInterval(trackRecordingTimerRef.current);
    }
  };

  const handleAutoSyncTrackLatency = async (idea: SongAudioIdea, track: AudioTrack) => {
    try {
      setCleaningTrackId(track.id);
      const tracks = getIdeaTracks(idea);
      const masterTrack = tracks.find(t => t.id !== track.id) || tracks[0];
      if (!masterTrack || masterTrack.id === track.id) {
        alert("Necesitas tener al menos otra pista de referencia en la mezcla para calcular la sincronización por IA.");
        return;
      }
      const masterUrl = await resolveAudioUrl(masterTrack.audioUrl);
      const trackUrl = await resolveAudioUrl(track.audioUrl);
      const res = await fetch(trackUrl);
      if (!res.ok) throw new Error("No se pudo obtener el audio de la pista.");
      const trackBlob = await res.blob();

      const calculatedLagMs = await autoDetectAudioLatencyOffset(masterUrl, trackBlob);
      handleTrackDesfaseChange(idea, track.id, calculatedLagMs);
      alert(`⚡ ¡Sincronizado! Se detectó un desfase de +${calculatedLagMs}ms y se ajustó la pista.`);
    } catch (err) {
      console.error("Auto sync error:", err);
      alert("No se pudo calcular automáticamente la latencia. Puedes ajustarla manualmente.");
    } finally {
      setCleaningTrackId(null);
    }
  };

  const handleCleanTrackAudio = async (idea: SongAudioIdea, track: AudioTrack) => {
    try {
      setCleaningTrackId(track.id);
      const trackUrl = await resolveAudioUrl(track.audioUrl);
      const res = await fetch(trackUrl);
      if (!res.ok) throw new Error("No se pudo obtener el audio de la pista.");
      const rawBlob = await res.blob();
      const cleanedBlob = await cleanAudioBlobOffline(rawBlob);
      const cleanedFile = new File([cleanedBlob], `clean-${track.nombre || 'pista'}-${Date.now()}.wav`, { type: 'audio/wav' });
      const serverUrl = await uploadFileToServer(cleanedFile);

      const tracks = getIdeaTracks(idea);
      const updatedTracks = tracks.map(t => t.id === track.id ? { ...t, audioUrl: serverUrl } : t);
      const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { ...i, pistas: updatedTracks } : i);
      onUpdateSong({ ...song, audioIdeas: updatedIdeas });
    } catch (err) {
      console.error("Error cleaning track audio:", err);
      alert("No se pudo filtrar el ruido de la pista.");
    } finally {
      setCleaningTrackId(null);
    }
  };

  const handleUploadTrackFile = async (idea: SongAudioIdea, file: File) => {
    try {
      setIsUploading(true);
      const serverUrl = await uploadFileToServer(file);
      const fileNameClean = file.name ? file.name.replace(/\.[^/.]+$/, "") : "";
      const existingTracks = getIdeaTracks(idea);
      const trackName = newTrackName.trim() || fileNameClean || `Pista ${existingTracks.length + 1}`;
      const instrument = newTrackInstrument.trim() || undefined;
      saveNewTrackToIdea(idea, serverUrl, trackName, instrument);
    } catch (err) {
      alert("Error al procesar el archivo de audio de la pista.");
      console.error("Track upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const saveNewTrackToIdea = (idea: SongAudioIdea, audioUrl: string, customTrackName?: string, customInstrument?: string, initialDesfaseMs?: number) => {
    const existingTracks = getIdeaTracks(idea);
    const trackName = customTrackName || newTrackName.trim() || `Pista ${existingTracks.length + 1}`;
    const instrument = customInstrument || newTrackInstrument.trim() || undefined;

    const newTrack: AudioTrack = {
      id: `track-${Date.now()}`,
      nombre: trackName,
      audioUrl,
      autor: currentUsername,
      instrumento: instrument,
      fecha: new Date().toISOString().split('T')[0],
      volumen: 1,
      muted: false,
      desfaseMs: initialDesfaseMs ?? 0
    };

    const updatedTracks = [...existingTracks, newTrack];
    const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { ...i, pistas: updatedTracks } : i);

    onUpdateSong({ ...song, audioIdeas: updatedIdeas });

    // Reset overdub form
    setAddingTrackIdeaId(null);
    setNewTrackName('');
    setNewTrackInstrument('');
    setSelectedTrackFile(null);
  };

  // --- CREATE NEW MAIN IDEA FORM ---
  const startRecording = async () => {
    try {
      const rawStream = await getLowLatencyAudioStream({
        echoCancellation: useEchoCancellation,
        noiseSuppression: useNoiseSuppression,
        autoGainControl: false,
      });

      let streamToRecord = rawStream;
      let cleanPipeline: any = null;
      if (useCleanDSPFilter) {
        cleanPipeline = createCleanAudioRecordingPipeline(rawStream, studioAudioCtxRef.current);
        streamToRecord = cleanPipeline.cleanStream;
      }

      const mediaRecorder = new MediaRecorder(streamToRecord);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      let resolveFn: (url: string) => void = () => {};
      let rejectFn: (err: any) => void = () => {};
      recordingPromiseRef.current = new Promise<string>((resolve, reject) => {
        resolveFn = resolve;
        rejectFn = reject;
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        if (cleanPipeline) cleanPipeline.cleanup();
        rawStream.getTracks().forEach(track => track.stop());

        const rawBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          setIsUploading(true);
          let finalBlob = rawBlob;
          if (useCleanDSPFilter) {
            finalBlob = await cleanAudioBlobOffline(rawBlob);
          }
          const file = new File([finalBlob], `recording-${Date.now()}.wav`, { type: 'audio/wav' });
          const url = await uploadFileToServer(file);
          setRecordedAudioUrl(url);
          resolveFn(url);
        } catch (err) {
          console.error("Error uploading mic recording:", err);
          rejectFn(err);
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorder.start(50);
      setIsRecording(true);
      setRecordingTime(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert("No se pudo acceder al micrófono.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const handleSaveIdea = async () => {
    try {
      setIsUploading(true);

      // 1. If currently recording with mic, stop and await the upload automatically
      if (isRecording) {
        stopRecording();
      }

      let primaryAudioUrl = recordedAudioUrl || '';

      // If recording promise is pending or just completed, await it
      if (!primaryAudioUrl && recordingPromiseRef.current) {
        try {
          primaryAudioUrl = await recordingPromiseRef.current;
        } catch (e) {
          console.warn("Error awaiting recording URL:", e);
        }
      }

      // 2. Check selected audio file, drive URL, or song base track if no mic recording
      if (!primaryAudioUrl) {
        if (useSongBaseTrack && selectedSongBaseUrl) {
          primaryAudioUrl = selectedSongBaseUrl;
        } else if (driveAudioUrl.trim()) {
          primaryAudioUrl = driveAudioUrl.trim();
        } else if (selectedAudioFile) {
          primaryAudioUrl = await uploadFileToServer(selectedAudioFile);
        }
      }

      // 3. Prepare secondary track if song base track is toggled alongside user's recording/file
      let secondaryBaseTrack: { url: string; label: string; instrument: string } | undefined = undefined;
      if (useSongBaseTrack && selectedSongBaseUrl && primaryAudioUrl !== selectedSongBaseUrl) {
        secondaryBaseTrack = {
          url: selectedSongBaseUrl,
          label: `🎵 Base: Tema Original (${song.titulo})`,
          instrument: 'Tema Base'
        };
      }

      // Auto-generate title if user left title blank
      const sectionInfo = SECCIONES_TEMA.find(s => s.key === ideaSection);
      const sectionLabel = sectionInfo?.label || ideaSection;
      const autoTitle = selectedAudioFile 
        ? selectedAudioFile.name.replace(/\.[^/.]+$/, "") 
        : (useSongBaseTrack && primaryAudioUrl === selectedSongBaseUrl)
          ? `Idea sobre ${song.titulo} (${sectionLabel})`
          : `Idea ${sectionLabel} - ${new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit' })} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      const finalTitle = ideaTitle.trim() || autoTitle;

      // 4. AI Backing track generation if selected
      if (genAiOnNewIdea) {
        const aiWavBlob = await generateAccompanimentAudioBlob({
          bpm: newIdeaBpm,
          durationSecs: 30,
          keyName: newIdeaKey,
          includeDrums: newIdeaIncludeDrums,
          includeBass: newIdeaIncludeBass,
          drumPattern: newIdeaStyle
        });
        const aiFile = new File([aiWavBlob], `base-ia-${newIdeaStyle}-${Date.now()}.wav`, { type: 'audio/wav' });
        const aiServerUrl = await uploadFileToServer(aiFile);

        let aiTrackLabel = 'Ref IA: Batería y Bajo';
        if (newIdeaIncludeDrums && newIdeaIncludeBass) aiTrackLabel = `🥁🎸 Ref AI (${newIdeaStyle.toUpperCase()} - ${newIdeaKey})`;
        else if (newIdeaIncludeDrums) aiTrackLabel = `🥁 Ref AI: Batería (${newIdeaStyle.toUpperCase()})`;
        else if (newIdeaIncludeBass) aiTrackLabel = `🎸 Ref AI: Bajo Tónica (${newIdeaKey})`;

        if (primaryAudioUrl) {
          createNewIdea(primaryAudioUrl, {
            url: aiServerUrl,
            label: aiTrackLabel,
            instrument: newIdeaIncludeDrums && newIdeaIncludeBass ? 'Batería + Bajo (AI)' : newIdeaIncludeDrums ? 'Batería (AI)' : 'Bajo (AI)'
          }, finalTitle, secondaryBaseTrack);
        } else {
          createNewIdea(aiServerUrl, undefined, finalTitle, secondaryBaseTrack);
        }
        return;
      }

      if (!primaryAudioUrl) {
        alert("Debes seleccionar un archivo de audio, cargar el Tema Original, grabar con el micrófono, pegar un enlace de Drive o activar la generación de Base IA para la primera pista de la idea.");
        return;
      }

      createNewIdea(primaryAudioUrl, undefined, finalTitle, secondaryBaseTrack);
    } catch (err) {
      console.error("Error al guardar la idea de audio:", err);
      alert("Error al guardar la idea de audio.");
    } finally {
      setIsUploading(false);
    }
  };

  const createNewIdea = (
    audioDataUrl: string, 
    secondaryAiTrack?: { url: string; label: string; instrument: string },
    customTitle?: string,
    secondaryBaseTrack?: { url: string; label: string; instrument: string }
  ) => {
    const finalTitle = customTitle || ideaTitle.trim() || `Idea (${ideaSection.toUpperCase()}) ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const isPrimaryBaseTrack = useSongBaseTrack && audioDataUrl === selectedSongBaseUrl;

    const tracks: AudioTrack[] = [
      {
        id: `track-${Date.now()}-1`,
        nombre: isPrimaryBaseTrack
          ? `🎵 Base: ${song.titulo} (Tema Original)`
          : secondaryAiTrack || secondaryBaseTrack
            ? 'Pista 1 (Grabación/Idea)' 
            : 'Pista 1 (Base)',
        audioUrl: audioDataUrl,
        autor: isPrimaryBaseTrack ? 'Tema Original' : (ideaUploader || currentUsername),
        instrumento: isPrimaryBaseTrack ? 'Tema Base' : (ideaInstrument.trim() || undefined),
        fecha: new Date().toISOString().split('T')[0],
        volumen: 1,
        muted: false
      }
    ];

    if (secondaryBaseTrack) {
      tracks.push({
        id: `track-${Date.now()}-base`,
        nombre: secondaryBaseTrack.label,
        audioUrl: secondaryBaseTrack.url,
        autor: 'Tema Original',
        instrumento: secondaryBaseTrack.instrument,
        fecha: new Date().toISOString().split('T')[0],
        volumen: 0.9,
        muted: false
      });
    }

    if (secondaryAiTrack) {
      tracks.push({
        id: `track-${Date.now()}-ai`,
        nombre: secondaryAiTrack.label,
        audioUrl: secondaryAiTrack.url,
        autor: 'IA Synthesizer',
        instrumento: secondaryAiTrack.instrument,
        fecha: new Date().toISOString().split('T')[0],
        volumen: 0.85,
        muted: false
      });
    }

    const newIdea: SongAudioIdea = {
      id: `idea-${Date.now()}`,
      titulo: finalTitle,
      seccion: ideaSection,
      audioUrl: audioDataUrl,
      pistas: tracks,
      subidoPor: ideaUploader || currentUsername,
      instrumento: ideaInstrument.trim() || undefined,
      fecha: new Date().toISOString().split('T')[0],
      notas: ideaNotes.trim() || undefined,
      votos: [currentUsername],
      comentarios: []
    };

    const updatedIdeas = [newIdea, ...(song.audioIdeas || [])];
    onUpdateSong({
      ...song,
      audioIdeas: updatedIdeas,
      audioPrincipalUrl: song.audioPrincipalUrl || audioDataUrl
    });

    // Reset form & promise
    recordingPromiseRef.current = null;
    setIdeaTitle('');
    setIdeaNotes('');
    setSelectedAudioFile(null);
    setRecordedAudioUrl(null);
    setDriveAudioUrl('');
    setGenAiOnNewIdea(false);
    setShowAddIdea(false);
  };

  // Toggle upvote / like
  const handleToggleVote = (ideaId: string) => {
    const updatedIdeas = (song.audioIdeas || []).map(idea => {
      if (idea.id === ideaId) {
        const currentVotos = idea.votos || [];
        const hasVoted = currentVotos.includes(currentUsername);
        const newVotos = hasVoted 
          ? currentVotos.filter(u => u !== currentUsername)
          : [...currentVotos, currentUsername];
        return { ...idea, votos: newVotos };
      }
      return idea;
    });

    onUpdateSong({ ...song, audioIdeas: updatedIdeas });
  };

  // Add Comment
  const handleAddComment = (idea: SongAudioIdea) => {
    const text = commentTextMap[idea.id];
    if (!text || !text.trim()) return;

    const timeTag = commentTimeTagMap[idea.id] !== undefined ? commentTimeTagMap[idea.id] : undefined;

    const newComment: AudioComment = {
      id: `comment-${Date.now()}`,
      autor: currentUsername,
      timestampSegundos: timeTag ?? Math.floor(currentTimeMap[idea.id] || 0),
      texto: text.trim(),
      fecha: 'Ahora'
    };

    const updatedIdeas = (song.audioIdeas || []).map(i => {
      if (i.id === idea.id) {
        return {
          ...i,
          comentarios: [...(i.comentarios || []), newComment]
        };
      }
      return i;
    });

    onUpdateSong({ ...song, audioIdeas: updatedIdeas });

    setCommentTextMap(prev => ({ ...prev, [idea.id]: '' }));
    setCommentTimeTagMap(prev => ({ ...prev, [idea.id]: null }));
  };

  // Delete whole idea
  const handleDeleteIdea = (e?: React.MouseEvent, ideaId?: string, skipModal = false) => {
    if (e) e.stopPropagation();
    if (!ideaId) return;

    const executeDelete = () => {
      // Pause any playing audio
      if (playingIdeaId === ideaId) {
        const activeIdea = ideasList.find(i => i.id === ideaId);
        if (activeIdea) {
          getIdeaTracks(activeIdea).forEach(tr => {
            const el = trackAudioRefs.current[tr.id];
            if (el) el.pause();
          });
        }
        setPlayingIdeaId(null);
      }

      const updatedIdeas = (song.audioIdeas || []).filter(i => i.id !== ideaId);

      // If the main song audio was this idea's audio, update or clear it
      const deletedIdea = (song.audioIdeas || []).find(i => i.id === ideaId);
      let newAudioPrincipalUrl = song.audioPrincipalUrl;
      if (deletedIdea && song.audioPrincipalUrl === deletedIdea.audioUrl) {
        newAudioPrincipalUrl = updatedIdeas[0]?.audioUrl || '';
      }

      onUpdateSong({ 
        ...song, 
        audioIdeas: updatedIdeas,
        audioPrincipalUrl: newAudioPrincipalUrl 
      });
    };

    if (skipModal) {
      executeDelete();
      return;
    }

    const idea = (song.audioIdeas || []).find(i => i.id === ideaId);
    setConfirmDeleteModal({
      title: 'Eliminar Idea de Audio',
      description: `¿Estás seguro de que deseas eliminar la idea "${idea?.titulo || 'sin título'}"? Se borrarán todas las pistas y comentarios asociados.`,
      onConfirm: executeDelete
    });
  };

  // Delete comment from idea
  const handleDeleteComment = (idea: SongAudioIdea, commentId: string) => {
    setConfirmDeleteModal({
      title: 'Eliminar Comentario',
      description: '¿Deseas eliminar este comentario?',
      onConfirm: () => {
        const updatedComments = (idea.comentarios || []).filter(c => c.id !== commentId);
        const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { ...i, comentarios: updatedComments } : i);
        onUpdateSong({ ...song, audioIdeas: updatedIdeas });
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col ${
        isStitchLight ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-[#0f0f15] border-zinc-800 text-zinc-100'
      }`}>
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Disc className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-white">{song.titulo}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-semibold">
                  {song.estadoTema || 'componiendo'}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateSong({ ...song, favoritoGeneral: !song.favoritoGeneral })}
                  className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    song.favoritoGeneral
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-white/5 text-neutral-400 border-white/10 hover:text-amber-300 hover:border-amber-500/30'
                  }`}
                  title="Marcar como tema favorito para incluir por defecto en repertorios"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${song.favoritoGeneral ? 'text-amber-400 fill-amber-400' : ''}`} />
                  <span>{song.favoritoGeneral ? '★ Favorito' : '+ Favorito'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowChordsModal(true)}
                  className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 shadow-sm"
                  title="Abrir visor de acordes y ficha para músicos sustitutos"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Acordes & Ficha</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCubaseHelp(true)}
                  className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 shadow-sm"
                  title="Ver atajos de teclado tipo Cubase DAW (Espacio, 0, R, M, S, ←, →)"
                >
                  <Keyboard className="w-3.5 h-3.5 text-purple-400" />
                  <span>Atajos Cubase</span>
                </button>
              </div>
              <p className="text-xs text-neutral-400 font-mono flex items-center gap-3 mt-0.5">
                <span>⏱️ {song.duracion}</span>
                <span>🎵 {song.tonalidad}</span>
                <span>⚡ {song.bpm} BPM</span>
                {song.afinacion && <span>🎸 {song.afinacion}</span>}
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Main Song Demo Header */}
          <div className="p-4 rounded-xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-zinc-900/60 shadow-lg relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
                  <Music className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    Studio & Banco de Ideas Multipista
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/40">
                      Multipista Demo
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Sube ideas por secciones o graba pistas superpuestas (guitarra, voz, bajo) para armar arreglos juntos.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {selectedSongBaseUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setUseSongBaseTrack(true);
                      setShowAddIdea(true);
                      setIdeaTitle(`Tocar sobre Tema Original: ${song.titulo}`);
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/30 to-orange-500/30 hover:from-amber-500/40 hover:to-orange-500/40 text-amber-200 border border-amber-500/40 font-mono text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                    title="Crear una idea cargando automáticamente el tema original como pista base"
                  >
                    <Disc className="w-4 h-4 text-amber-400 animate-spin-slow" />
                    <span>🎵 Cargar Tema Original como Base</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowAddIdea(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Crear Nueva Idea / Arreglo
                </button>
              </div>
            </div>
          </div>

          {/* Quick Cubase Shortcuts Status Bar */}
          <div className="px-3 py-2 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs font-mono text-purple-200 flex items-center justify-between flex-wrap gap-2 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 font-bold text-purple-300">
                <Keyboard className="w-4 h-4 text-purple-400" /> Atajos Cubase:
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-purple-500/40 text-white font-sans text-[11px] font-bold shadow-inner">Espacio</kbd> Play/Pause
              </span>
              <span className="text-purple-500">|</span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-purple-500/40 text-white font-sans text-[11px] font-bold shadow-inner">0 / Home</kbd> Ir a 0:00
              </span>
              <span className="text-purple-500">|</span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-purple-500/40 text-rose-300 font-sans text-[11px] font-bold shadow-inner">R</kbd> Grabar Pista
              </span>
              <span className="text-purple-500">|</span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-purple-500/40 text-white font-sans text-[11px] font-bold shadow-inner">← / →</kbd> Jump ±5s
              </span>
              <span className="text-purple-500">|</span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-purple-500/40 text-amber-300 font-sans text-[11px] font-bold shadow-inner">M / S</kbd> Mute / Solo
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCubaseHelp(true)}
              className="text-[11px] font-bold text-purple-300 hover:text-white underline cursor-pointer ml-auto"
            >
              Guía Completa (K / ?)
            </button>
          </div>

          {/* Add New Audio Idea Form */}
          {showAddIdea && (
            <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-4 animate-in slide-in-from-top-4 duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-emerald-300 font-mono uppercase tracking-wider flex items-center gap-2">
                  <Mic className="w-4 h-4" /> Aportar Idea o Arreglo de Audio
                </h4>
                <button type="button" onClick={() => setShowAddIdea(false)} className="text-neutral-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-neutral-400 block mb-1">Título de la Idea / Arreglo *</label>
                  <input
                    type="text"
                    value={ideaTitle}
                    onChange={(e) => setIdeaTitle(e.target.value)}
                    placeholder="Ej: Riff Estribillo / Arreglo Vientos / Base Acústica"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-neutral-400 block mb-1">Sección del Tema *</label>
                  <select
                    value={ideaSection}
                    onChange={(e) => setIdeaSection(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-neutral-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {SECCIONES_TEMA.map(sec => (
                      <option key={sec.key} value={sec.key} className="bg-zinc-900 text-white">
                        {sec.icon} {sec.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-neutral-400 block mb-1">Aportado por (Tu Nombre)</label>
                  <input
                    type="text"
                    value={ideaUploader}
                    onChange={(e) => setIdeaUploader(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-neutral-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-neutral-400 block mb-1">Instrumento / Rol (Opcional)</label>
                  <input
                    type="text"
                    value={ideaInstrument}
                    onChange={(e) => setIdeaInstrument(e.target.value)}
                    placeholder="Ej: Guitarra, Trompeta, Batería, Voz"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-neutral-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Source Selector */}
              <div className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-3">
                <span className="text-xs font-mono font-bold text-neutral-300 block">Fuente de Audio Principal / Base Rítmica:</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {/* Option 1: Tema Base Original */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !useSongBaseTrack;
                      setUseSongBaseTrack(next);
                      if (next && !selectedSongBaseUrl) {
                        setSelectedSongBaseUrl(song.audioPrincipalUrl || (song.audioIdeas && song.audioIdeas[0]?.audioUrl) || '');
                      }
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-left ${
                      useSongBaseTrack 
                        ? 'border-amber-500 bg-amber-950/50 text-amber-200 shadow-lg ring-1 ring-amber-500/60' 
                        : 'border-amber-500/30 hover:border-amber-400 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40'
                    }`}
                  >
                    <Disc className={`w-5 h-5 text-amber-400 ${useSongBaseTrack ? 'animate-spin-slow' : ''}`} />
                    <span className="text-xs font-bold text-center">Tema Original</span>
                    <span className="text-[10px] text-amber-300/80 text-center font-mono">
                      {useSongBaseTrack ? '✓ Base Cargada' : `Usar "${song.titulo}"`}
                    </span>
                  </button>

                  {/* Option 2: File Upload */}
                  <label className="p-3 rounded-xl border border-dashed border-neutral-700 hover:border-emerald-500 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all">
                    <Upload className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-semibold text-white text-center">
                      {selectedAudioFile ? selectedAudioFile.name : 'Subir Archivo'}
                    </span>
                    <span className="text-[10px] text-neutral-400">MP3, WAV, M4A</span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedAudioFile(e.target.files[0]);
                          setRecordedAudioUrl(null);
                          setDriveAudioUrl('');
                        }
                      }}
                    />
                  </label>

                  {/* Mic Recording */}
                  <div className="p-3 rounded-xl border border-neutral-700 bg-white/5 flex flex-col items-center justify-center gap-2">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Mic className="w-3.5 h-3.5 animate-pulse" /> Grabar Micrófono
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer animate-ping"
                      >
                        ⏹️ Detener ({formatTime(recordingTime)})
                      </button>
                    )}

                    {recordedAudioUrl && (
                      <span className="text-[9px] text-emerald-400 font-mono font-bold text-center">
                        ✓ Grabación Lista
                      </span>
                    )}
                  </div>

                  {/* Drive Link */}
                  <div className="p-3 rounded-xl border border-neutral-700 bg-white/5 flex flex-col justify-center gap-1">
                    <span className="text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1">
                      <Music className="w-3 h-3 text-amber-400" /> Enlace Google Drive:
                    </span>
                    <input
                      type="text"
                      value={driveAudioUrl}
                      onChange={(e) => {
                        setDriveAudioUrl(e.target.value);
                        setSelectedAudioFile(null);
                        setRecordedAudioUrl(null);
                      }}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-2 py-1 rounded-lg bg-black/50 border border-neutral-700 text-[10px] text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  {/* AI Base Generator Card */}
                  <button
                    type="button"
                    onClick={() => setGenAiOnNewIdea(!genAiOnNewIdea)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-left ${
                      genAiOnNewIdea 
                        ? 'border-purple-500 bg-purple-900/40 text-purple-200 shadow-lg' 
                        : 'border-purple-500/40 hover:border-purple-400 bg-purple-950/20 text-purple-300 hover:bg-purple-950/40'
                    }`}
                  >
                    <Wand2 className="w-5 h-5 text-purple-400 animate-bounce" />
                    <span className="text-xs font-bold text-center">Base IA (Batería + Bajo)</span>
                    <span className="text-[10px] text-purple-300/80 text-center font-mono">
                      {genAiOnNewIdea ? '✓ Activado' : 'Generar Sintética'}
                    </span>
                  </button>
                </div>

                {/* ORIGINAL SONG BASE TRACK BANNER & SELECTOR */}
                {useSongBaseTrack && (
                  <div className="mt-3 p-3.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/50 via-orange-950/30 to-black/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-amber-200 animate-in fade-in duration-150 shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                        <Disc className="w-5 h-5 animate-spin-slow" />
                      </div>
                      <div>
                        <span className="font-bold text-white block text-sm">
                          Pista Base Creada sobre: "{song.titulo}"
                        </span>
                        <span className="text-[10px] text-amber-300/80 block mt-0.5 font-sans">
                          {selectedAudioFile || recordedAudioUrl || driveAudioUrl
                            ? '⚡ Se cargará el tema original como Pista Base de fondo para sonar sincronizado junto a tu idea/grabación.'
                            : '⚡ Se cargará la pista original en la idea para que puedas usar el botón "+ Pista" o "Grabar encima (Mic)" e improvisar sobre el tema.'}
                        </span>
                      </div>
                    </div>

                    {((song.audioIdeas && song.audioIdeas.length > 0) || song.audioPrincipalUrl) && (
                      <div className="flex items-center gap-2 shrink-0 bg-black/60 p-2 rounded-xl border border-amber-500/30 w-full sm:w-auto">
                        <span className="text-[10px] text-amber-400 font-bold">Seleccionar Maqueta:</span>
                        <select
                          value={selectedSongBaseUrl}
                          onChange={(e) => setSelectedSongBaseUrl(e.target.value)}
                          className="px-2 py-1 rounded-lg bg-zinc-900 border border-amber-500/50 text-[11px] text-amber-200 font-mono focus:outline-none focus:border-amber-400 flex-1 min-w-0"
                        >
                          {song.audioPrincipalUrl && (
                            <option value={song.audioPrincipalUrl}>🎵 Tema Original ({song.titulo})</option>
                          )}
                          {song.audioIdeas?.map((idItem) => (
                            <option key={idItem.id} value={idItem.audioUrl}>
                              💡 Idea: {idItem.titulo} ({idItem.seccion})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* AI ACCOMPANIMENT GENERATION CONTROLS ON NEW IDEA */}
                {genAiOnNewIdea && (
                  <div className="mt-3 pt-3 border-t border-purple-500/30 bg-purple-950/30 p-3.5 rounded-xl border border-purple-500/40 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        Ajustes de la Base IA (Batería + Bajo)
                      </span>
                      <span className="text-[10px] font-mono text-purple-400/80 bg-purple-900/50 px-2 py-0.5 rounded border border-purple-500/30">
                        {selectedAudioFile || recordedAudioUrl || driveAudioUrl ? 'Se añadirá como Pista 2' : 'Será la Pista Principal'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 block mb-0.5">Estilo Rítmico</label>
                        <select
                          value={newIdeaStyle}
                          onChange={(e) => setNewIdeaStyle(e.target.value as any)}
                          className="w-full px-2 py-1 rounded-lg bg-black border border-purple-500/50 text-xs text-white font-mono"
                        >
                          <option value="rock">Rock / Pop Standard</option>
                          <option value="pop">Pop / Disco 4-on-floor</option>
                          <option value="funk">Funk Syncopated</option>
                          <option value="reggae">Reggae One-Drop</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 block mb-0.5">Tempo (BPM)</label>
                        <input
                          type="number"
                          value={newIdeaBpm}
                          onChange={(e) => setNewIdeaBpm(parseInt(e.target.value) || 120)}
                          className="w-full px-2 py-1 rounded-lg bg-black border border-purple-500/50 text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 block mb-0.5">Tonalidad Base</label>
                        <input
                          type="text"
                          value={newIdeaKey}
                          onChange={(e) => setNewIdeaKey(e.target.value)}
                          className="w-full px-2 py-1 rounded-lg bg-black border border-purple-500/50 text-xs text-white font-mono"
                          placeholder="Do, Re, Mi..."
                        />
                      </div>

                      <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-neutral-300 pt-1 border-t border-purple-500/20">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newIdeaIncludeDrums}
                              onChange={(e) => setNewIdeaIncludeDrums(e.target.checked)}
                              className="accent-purple-500"
                            />
                            <span>🥁 Batería Synth</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newIdeaIncludeBass}
                              onChange={(e) => setNewIdeaIncludeBass(e.target.checked)}
                              className="accent-purple-500"
                            />
                            <span>🎸 Bajo Tónica</span>
                          </label>
                        </div>

                        <span className="text-[10px] text-purple-300/80 italic">
                          ⚡ Se sintetizará un bucle rítmico automático al guardar la idea.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-mono text-neutral-400 block mb-1">Notas o explicación para el grupo</label>
                <textarea
                  value={ideaNotes}
                  onChange={(e) => setIdeaNotes(e.target.value)}
                  placeholder="Explica qué has grabado o la propuesta..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Status Indicator of Primary Audio Track */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-neutral-300">
                <span className="font-bold flex items-center gap-1.5 text-indigo-300">
                  <Disc className="w-4 h-4 text-indigo-400" /> Pista 1 de la Idea:
                </span>
                <div>
                  {selectedAudioFile ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Archivo: {selectedAudioFile.name}
                    </span>
                  ) : isRecording ? (
                    <span className="text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                      <Mic className="w-4 h-4" /> Grabando micro ({Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')})...
                    </span>
                  ) : recordedAudioUrl ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Grabación de micrófono lista ({recordingTime}s)
                    </span>
                  ) : driveAudioUrl.trim() ? (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Google Drive vinculado
                    </span>
                  ) : useSongBaseTrack && selectedSongBaseUrl ? (
                    <span className="text-amber-300 font-bold flex items-center gap-1">
                      <Disc className="w-4 h-4 text-amber-400 animate-spin-slow" /> Base: Tema Original ({song.titulo})
                    </span>
                  ) : genAiOnNewIdea ? (
                    <span className="text-purple-300 font-bold flex items-center gap-1">
                      <Sparkles className="w-4 h-4" /> Base IA ({newIdeaStyle.toUpperCase()} - {newIdeaKey})
                    </span>
                  ) : (
                    <span className="text-amber-400/90 italic text-[11px]">
                      ⚠️ Selecciona un archivo, carga el Tema Original, graba con el micro o activa Base IA
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddIdea(false)}
                  className="px-3 py-2 rounded-xl text-xs text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveIdea}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs uppercase tracking-wider"
                >
                  {isUploading ? 'Guardando en Servidor...' : 'Guardar Idea'}
                </button>
              </div>
            </div>
          )}

          {/* Section Filter Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                Filtrar por Sección:
              </span>
              <span className="text-xs font-mono text-emerald-400">
                {ideasList.length} {ideasList.length === 1 ? 'idea' : 'ideas'} en catálogo
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveSectionFilter('todas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeSectionFilter === 'todas'
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                🔍 Todas ({ideasList.length})
              </button>

              {SECCIONES_TEMA.map(sec => {
                const count = ideasList.filter(i => i.seccion === sec.key).length;
                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => setActiveSectionFilter(sec.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      activeSectionFilter === sec.key
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{sec.icon}</span>
                    <span>{sec.label}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ideas Audio Feed */}
          {filteredIdeas.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-neutral-600 mx-auto" />
              <p className="text-sm text-neutral-400 font-mono">
                {activeSectionFilter === 'todas'
                  ? 'Aún no hay ideas de audio subidas para este tema.'
                  : `No hay propuestas grabadas para la sección "${activeSectionFilter}".`}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (activeSectionFilter !== 'todas') setIdeaSection(activeSectionFilter as any);
                  setShowAddIdea(true);
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-bold transition-all cursor-pointer"
              >
                + Grabar / Subir la primera idea
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredIdeas.map((idea) => {
                const isPlaying = playingIdeaId === idea.id;
                const currentTime = currentTimeMap[idea.id] || 0;
                const rawDuration = durationMap[idea.id];
                const duration = (rawDuration && !isNaN(rawDuration) && isFinite(rawDuration) && rawDuration > 0) ? rawDuration : 0;
                const sectionInfo = SECCIONES_TEMA.find(s => s.key === idea.seccion) || SECCIONES_TEMA[0];
                const votes = idea.votos || [];
                const hasVoted = votes.includes(currentUsername);
                const tracks = getIdeaTracks(idea);
                const isAddingTrack = addingTrackIdeaId === idea.id;

                return (
                  <div
                    key={idea.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-4 ${
                      isPlaying 
                        ? 'bg-indigo-950/30 border-indigo-500/50 shadow-2xl ring-1 ring-indigo-500/30' 
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Idea Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${sectionInfo.color}`}>
                          {sectionInfo.icon} {sectionInfo.label}
                        </span>
                        <h4 className="text-base font-bold text-white">{idea.titulo}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                          {tracks.length} {tracks.length === 1 ? 'pista' : 'pistas (Mezcla)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{idea.subidoPor} {idea.instrumento ? `(${idea.instrumento})` : ''}</span>
                        <span>• {idea.fecha}</span>

                        {/* Delete Idea Button */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteIdea(e, idea.id)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer ml-2"
                          title="Eliminar esta idea completa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {idea.notas && (
                      <p className="text-xs text-neutral-300 italic bg-black/20 p-2.5 rounded-xl border border-white/5">
                        "{idea.notas}"
                      </p>
                    )}

                    {/* MASTER MULTITRACK CONTROLS & TIMELINE */}
                    <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-3 shadow-inner">
                      {/* Transport Controls Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Transport Buttons: Play, Pause, Stop, Loop, Cues */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Play Button */}
                          <button
                            type="button"
                            onClick={() => togglePlayIdea(idea)}
                            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-mono text-xs font-bold transition-all cursor-pointer shadow-lg active:scale-95 ${
                              isPlaying
                                ? 'bg-emerald-500 text-zinc-950 ring-2 ring-emerald-400'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                            title="Play / Pausa (Espacio)"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            <span>{isPlaying ? 'Reproduciendo...' : 'Play'}</span>
                          </button>

                          {/* Pause Button */}
                          <button
                            type="button"
                            onClick={() => handlePauseIdea(idea)}
                            disabled={!isPlaying}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 text-amber-300 border border-amber-500/30 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Pausar en posición actual (P / Espacio)"
                          >
                            <Pause className="w-4 h-4 fill-current" />
                            <span>Pausa</span>
                          </button>

                          {/* Stop Button */}
                          <button
                            type="button"
                            onClick={() => handleStopIdea(idea)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Detener e ir a inicio / Cue A (0 / Home / Stop)"
                          >
                            <Square className="w-4 h-4 fill-current" />
                            <span>Stop</span>
                          </button>

                          {/* Loop Button */}
                          {(() => {
                            const loopCfg = loopConfigMap[idea.id];
                            const isLoopEnabled = !!loopCfg?.enabled;
                            const loopStart = loopCfg?.start || 0;
                            const loopEnd = (loopCfg?.end && loopCfg.end > loopStart) ? loopCfg.end : duration;

                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => toggleIdeaLoop(idea)}
                                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                                    isLoopEnabled
                                      ? 'bg-purple-600 text-white border-purple-400 shadow-md ring-1 ring-purple-400/50'
                                      : 'bg-white/5 hover:bg-white/10 text-neutral-400 border-white/10'
                                  }`}
                                  title="Alternar Modo Bucle entre Cues (Atajo L)"
                                >
                                  <Repeat className="w-4 h-4" />
                                  <span>Bucle {isLoopEnabled ? 'ON' : 'OFF'}</span>
                                </button>

                                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-[11px] font-mono">
                                  <span className="text-neutral-400 px-1 font-semibold">Cues:</span>
                                  <button
                                    type="button"
                                    onClick={() => setIdeaCueIn(idea)}
                                    className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/30 font-bold flex items-center gap-1 cursor-pointer"
                                    title="Fijar Cue In (Inicio Bucle A) en la posición actual (Atajo I)"
                                  >
                                    <Flag className="w-3 h-3 text-indigo-400" />
                                    <span>In [{formatTime(loopStart)}]</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setIdeaCueOut(idea)}
                                    className="px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-1 cursor-pointer"
                                    title="Fijar Cue Out (Fin Bucle B) en la posición actual (Atajo O)"
                                  >
                                    <Flag className="w-3 h-3 text-purple-400" />
                                    <span>Out [{formatTime(loopEnd)}]</span>
                                  </button>

                                  {(loopStart > 0 || (loopEnd > 0 && loopEnd < duration)) && (
                                    <button
                                      type="button"
                                      onClick={() => resetIdeaLoopBounds(idea)}
                                      className="p-1 rounded text-neutral-400 hover:text-white cursor-pointer"
                                      title="Restablecer bucle a la duración total"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        {/* AI Accompaniment & Overdub Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                          {selectedSongBaseUrl && !tracks.some(t => t.audioUrl === selectedSongBaseUrl) && (
                            <button
                              type="button"
                              onClick={() => {
                                saveNewTrackToIdea(
                                  idea,
                                  selectedSongBaseUrl,
                                  `🎵 Base: ${song.titulo} (Original)`,
                                  'Tema Base'
                                );
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-105"
                              title={`Cargar la pista base original del tema "${song.titulo}" en esta mezcla`}
                            >
                              <Disc className="w-4 h-4 text-amber-400 animate-spin-slow" />
                              <span>+ Base Tema</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setShowGenModalForIdea(idea);
                              setGenBpm(song.bpm || 120);
                              setGenKey(song.tonalidad || 'Do');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/40 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-105"
                            title="Sintetizar sugerencia de batería y/o bajo de referencia orientativa"
                          >
                            <Wand2 className="w-4 h-4 text-purple-400" />
                            <span>⚡ Base Batería/Bajo (AI)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (addingTrackIdeaId === idea.id) {
                                setAddingTrackIdeaId(null);
                              } else {
                                setAddingTrackIdeaId(idea.id);
                                setNewTrackName(`Pista ${tracks.length + 1}`);
                                setNewTrackInstrument('');
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-500/40 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-105"
                            title="Grabar o subir otra pista encima de esta idea"
                          >
                            <Layers className="w-4 h-4 text-sky-400" />
                            <span>+ Pista</span>
                          </button>
                        </div>
                      </div>

                      {/* Timeline status bar */}
                      <div className="flex items-center justify-between text-xs font-mono text-neutral-400 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">
                            {isPlaying ? '▶ Reproduciendo Mezcla' : 'Transport Detenido'}
                          </span>
                          {tracks.length > 1 && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold" title="Pistas de diferente longitud se rellenan y sincronizan automáticamente">
                              ⚡ Sync Auto-Padding
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-emerald-400 font-bold">{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
                          {loopConfigMap[idea.id]?.enabled && (
                            <span className="text-purple-300 ml-2">
                              (Bucle: {formatTime(loopConfigMap[idea.id]?.start || 0)} ➔ {formatTime(loopConfigMap[idea.id]?.end || duration)})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Timeline Slider with Visual Cue Range Highlight */}
                      {(() => {
                        const loopCfg = loopConfigMap[idea.id];
                        const isLoopEnabled = !!loopCfg?.enabled;
                        const lStart = loopCfg?.start || 0;
                        const lEnd = (loopCfg?.end && loopCfg.end > lStart) ? loopCfg.end : (duration || 30);
                        const dur = duration || 30;

                        return (
                          <div className="relative w-full pt-1 pb-1">
                            {/* Visual Cue Loop Region */}
                            {dur > 0 && isLoopEnabled && (
                              <div
                                className="absolute top-1 bottom-1 bg-purple-500/25 border-x-2 border-purple-400/80 rounded pointer-events-none z-0"
                                style={{
                                  left: `${Math.min(100, Math.max(0, (lStart / dur) * 100))}%`,
                                  width: `${Math.min(100, Math.max(1, ((lEnd - lStart) / dur) * 100))}%`
                                }}
                              >
                                <span className="absolute -top-3 left-0 text-[8px] font-mono text-purple-200 font-bold bg-purple-950 px-1 rounded border border-purple-500/50">
                                  Cue A
                                </span>
                                <span className="absolute -top-3 right-0 text-[8px] font-mono text-purple-200 font-bold bg-purple-950 px-1 rounded border border-purple-500/50">
                                  Cue B
                                </span>
                              </div>
                            )}

                            <input
                              type="range"
                              min={0}
                              max={dur}
                              step={0.05}
                              value={currentTime}
                              onChange={(e) => handleSeekIdea(idea, parseFloat(e.target.value))}
                              className="w-full accent-indigo-500 h-2 bg-neutral-800 rounded-lg cursor-pointer relative z-10 opacity-90 hover:opacity-100"
                            />
                          </div>
                        );
                      })()}
                    </div>

                    {/* MINI DAW TRACK LIST MIXER */}
                    <div className="space-y-2 bg-black/30 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 uppercase tracking-wider border-b border-white/10 pb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Mezclador de Pistas ({tracks.length})
                        </span>
                        <span>Volumen & Mute</span>
                      </div>

                      <div className="space-y-2">
                        {tracks.map((tr, idx) => {
                          const isMuted = tr.muted;
                          const isSolo = (tr as any).solo;
                          const vol = tr.volumen ?? 1;
                          const isEditing = editingTrackId === tr.id;

                          return (
                            <div 
                              key={tr.id}
                              className={`p-2.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                                isMuted 
                                  ? 'bg-black/40 border-neutral-800 opacity-60' 
                                  : isSolo 
                                    ? 'bg-amber-950/20 border-amber-500/40' 
                                    : 'bg-white/5 border-white/10'
                              }`}
                            >
                              <div className="w-full sm:w-56 shrink-0 flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-white/5 pb-2 sm:pb-0 sm:pr-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-5 h-5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>

                                  {isEditing ? (
                                    <div className="flex items-center gap-1 min-w-0 flex-1">
                                      <input
                                        type="text"
                                        value={editingTrackName}
                                        onChange={(e) => setEditingTrackName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveTrackName(idea, tr.id, editingTrackName)}
                                        className="w-full px-2 py-0.5 rounded bg-black border border-indigo-500 text-xs text-white font-bold min-w-0"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveTrackName(idea, tr.id, editingTrackName)}
                                        className="p-1 text-emerald-400 hover:text-emerald-300 shrink-0"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 min-w-0 flex-1">
                                      <span className="text-xs font-bold text-white truncate font-mono">{tr.nombre}</span>
                                      {tr.instrumento && (
                                        <span className="text-[10px] text-neutral-400 font-mono bg-white/5 px-1 py-0.5 rounded truncate max-w-[60px]">
                                          {tr.instrumento}
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingTrackId(tr.id);
                                          setEditingTrackName(tr.nombre);
                                        }}
                                        className="text-neutral-500 hover:text-neutral-300 shrink-0 ml-auto"
                                        title="Editar nombre de pista"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 justify-between">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleMuteTrack(idea, tr.id)}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition-all border ${
                                        isMuted 
                                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                                          : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
                                      }`}
                                      title="Mute"
                                    >
                                      M
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSoloTrack(idea, tr.id)}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition-all border ${
                                        isSolo 
                                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                                          : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
                                      }`}
                                      title="Solo"
                                    >
                                      S
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCleanTrackAudio(idea, tr)}
                                      disabled={cleaningTrackId === tr.id}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition-all border ${
                                        cleaningTrackId === tr.id
                                          ? 'bg-amber-500/30 text-amber-300 border-amber-500/50 animate-pulse'
                                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                      }`}
                                      title="Limpiar ruido de fondo y zumbidos de esta pista con Filtro Studio DSP (High-Pass 80Hz + Notch)"
                                    >
                                      {cleaningTrackId === tr.id ? '🧹 Clean...' : '🧹 Limpiar'}
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1 flex-1">
                                    {vol === 0 || isMuted ? (
                                      <VolumeX className="w-3 h-3 text-rose-400 shrink-0" />
                                    ) : (
                                      <Volume2 className="w-3 h-3 text-indigo-400 shrink-0" />
                                    )}
                                    <input
                                      type="range"
                                      min={0}
                                      max={1}
                                      step={0.05}
                                      value={isMuted ? 0 : vol}
                                      onChange={(e) => handleTrackVolumeChange(idea, tr.id, parseFloat(e.target.value))}
                                      className="w-full min-w-0 accent-indigo-500 h-1 bg-neutral-800 rounded cursor-pointer"
                                      title={`Volumen: ${Math.round(vol * 100)}%`}
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTrack(idea, tr.id)}
                                    className="text-neutral-500 hover:text-rose-400 p-0.5 shrink-0"
                                    title="Borrar pista"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Micro Latency / Desfase Nudge Control */}
                                <div className="flex flex-col gap-1 mt-1.5 pt-1.5 border-t border-white/5 text-[9px] font-mono text-neutral-400">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="shrink-0 text-amber-400 font-bold flex items-center gap-0.5" title="Ajuste fino de latencia en milisegundos (-adelantar/+atrasar)">
                                      ⏱️ Desfase:
                                    </span>
                                    <div className="flex items-center gap-0.5">
                                      <button
                                        type="button"
                                        onClick={() => handleAutoSyncTrackLatency(idea, tr)}
                                        className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-black border border-amber-500/40 cursor-pointer transition-colors flex items-center gap-0.5 shadow-xs"
                                        title="Sincronizar automáticamente por IA/DSP comparando las ondas de sonido de la mezcla"
                                      >
                                        ⚡ Auto IA
                                      </button>
                                      <span className={`px-1.5 py-0.5 rounded font-bold font-mono text-[9px] min-w-[42px] text-center ${
                                        (tr.desfaseMs || 0) !== 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-black/40 text-neutral-400'
                                      }`}>
                                        {tr.desfaseMs && tr.desfaseMs > 0 ? `+${tr.desfaseMs}ms` : `${tr.desfaseMs || 0}ms`}
                                      </span>
                                      {(tr.desfaseMs || 0) !== 0 && (
                                        <button
                                          type="button"
                                          onClick={() => handleTrackDesfaseChange(idea, tr.id, 0)}
                                          className="px-1 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[8px] cursor-pointer ml-0.5"
                                          title="Resetear desfase a 0ms"
                                        >
                                          Reset
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Quick Micro Adjust & Mobile Presets */}
                                  <div className="flex items-center gap-0.5 justify-end flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => handleTrackDesfaseChange(idea, tr.id, (tr.desfaseMs || 0) - 100)}
                                      className="px-1 py-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300 font-bold cursor-pointer"
                                      title="-100ms"
                                    >
                                      -100
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleTrackDesfaseChange(idea, tr.id, (tr.desfaseMs || 0) - 25)}
                                      className="px-1 py-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300 font-bold cursor-pointer"
                                      title="-25ms"
                                    >
                                      -25
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleTrackDesfaseChange(idea, tr.id, (tr.desfaseMs || 0) + 25)}
                                      className="px-1 py-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300 font-bold cursor-pointer"
                                      title="+25ms"
                                    >
                                      +25
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleTrackDesfaseChange(idea, tr.id, (tr.desfaseMs || 0) + 100)}
                                      className="px-1 py-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300 font-bold cursor-pointer"
                                      title="+100ms"
                                    >
                                      +100
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleTrackDesfaseChange(idea, tr.id, 240)}
                                      className="px-1 py-0.5 rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 font-bold cursor-pointer"
                                      title="Preset Móvil Android/Chrome (+240ms)"
                                    >
                                      📱 240
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleTrackDesfaseChange(idea, tr.id, 320)}
                                      className="px-1 py-0.5 rounded bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 font-bold cursor-pointer"
                                      title="Preset iPhone/Safari (+320ms)"
                                    >
                                      📱 320
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Right Panel: Waveform */}
                              <div className="flex-1 min-w-0 flex items-center justify-center p-1 relative min-h-[48px] bg-black/20 rounded">
                                <WaveformTrack 
                                  ref={(el) => (trackAudioRefs.current[tr.id] = el as HTMLAudioElement)}
                                  audioUrl={resolvedAudioUrls[tr.id] || tr.audioUrl}
                                  color={isSolo ? '#f59e0b' : (isMuted ? '#52525b' : '#818cf8')}
                                  masterDuration={duration || 30}
                                  trackDuration={trackAudioRefs.current[tr.id]?.duration || durationMap[tr.id]}
                                  currentTime={currentTime}
                                  onSeekTrack={(seekSec) => handleSeekIdea(idea, seekSec)}
                                  onTrackLoaded={(dur) => {
                                    if (dur > 0 && isFinite(dur)) {
                                      setDurationMap(prev => {
                                        const cur = prev[idea.id] || 0;
                                        if (dur > cur) return { ...prev, [idea.id]: dur };
                                        return prev;
                                      });
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}

                        {/* CUBASE LIVE RECORDING TRACK ROW */}
                        {isRecordingTrack && recordingTrackIdeaId === idea.id && (
                          <div className="p-3 rounded-xl border-2 border-red-500 bg-red-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl shadow-red-950/60 ring-2 ring-red-500/50">
                            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                              <span className="w-6 h-6 rounded bg-red-600 text-white font-mono text-xs font-black flex items-center justify-center shrink-0 shadow">
                                {tracks.length + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-white font-mono">
                                    {newTrackName.trim() || `Pista ${tracks.length + 1}`}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow">
                                    <span className="w-2 h-2 rounded-full bg-white animate-ping" /> GRABANDO...
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-red-300 block mt-0.5">
                                  Microactivo grabando en directo sobre la mezcla
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                              {/* Live Audio Meter Animation */}
                              <div className="flex items-end gap-1 h-6 px-3 bg-black/80 rounded-lg border border-red-500/50 shadow-inner">
                                <span className="w-1 bg-red-500 h-3 animate-bounce rounded-full" style={{ animationDelay: '0ms' }} />
                                <span className="w-1 bg-amber-400 h-5 animate-bounce rounded-full" style={{ animationDelay: '150ms' }} />
                                <span className="w-1 bg-red-500 h-2 animate-bounce rounded-full" style={{ animationDelay: '300ms' }} />
                                <span className="w-1 bg-emerald-400 h-4 animate-bounce rounded-full" style={{ animationDelay: '75ms' }} />
                                <span className="w-1 bg-red-500 h-6 animate-bounce rounded-full" style={{ animationDelay: '220ms' }} />
                              </div>

                              <div className="text-sm font-mono font-black text-red-400 bg-black/80 px-3 py-1 rounded-lg border border-red-500/50 shadow">
                                {formatTime(recordingTrackTime)}
                              </div>

                              <button
                                type="button"
                                onClick={stopRecordingTrackOverdub}
                                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer transition-all active:scale-95 shrink-0"
                                title="Detener y guardar pista en la idea (Atajo Espacio / R / Stop)"
                              >
                                <Square className="w-3.5 h-3.5 fill-current" />
                                <span>Detener & Guardar</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* OVERDUB ADD TRACK DRAWER */}
                    {isAddingTrack && (
                      <div className="p-4 rounded-xl border border-sky-500/40 bg-sky-950/20 space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-sky-300 flex items-center gap-1.5">
                            <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
                            Añadir Nueva Pista (Overdub / Superponer Audio)
                          </span>
                          <button type="button" onClick={() => setAddingTrackIdeaId(null)} className="text-neutral-400 hover:text-white">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="p-3 rounded-lg bg-black/60 border border-sky-500/30 space-y-2">
                          <div className="flex items-center gap-2 text-amber-300 text-[11px] font-semibold">
                            <Headphones className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>💡 RECOMENDACIÓN MULTIPISTA ESTUDIO:</span>
                          </div>
                          <p className="text-[10px] text-neutral-300 leading-relaxed font-sans">
                            Para evitar que el sonido de las pistas anteriores se cuele por el micrófono (acople de altavoces), <strong className="text-white">utiliza auriculares para escuchar la mezcla</strong> mientras grabas la nueva pista.
                          </p>

                          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[10px] font-mono text-sky-300 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Filtros Anti-Ruido Studio:
                            </span>

                            <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono">
                              <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 hover:text-white">
                                <input
                                  type="checkbox"
                                  checked={useCleanDSPFilter}
                                  onChange={(e) => setUseCleanDSPFilter(e.target.checked)}
                                  className="rounded accent-sky-500"
                                />
                                <span>Filtro DSP Anti-Zumbido (High-Pass 80Hz + Notch)</span>
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 hover:text-white">
                                <input
                                  type="checkbox"
                                  checked={useEchoCancellation}
                                  onChange={(e) => setUseEchoCancellation(e.target.checked)}
                                  className="rounded accent-sky-500"
                                />
                                <span>Cancelación de Eco</span>
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer text-amber-300 hover:text-amber-200 font-bold" title="Recorta automáticamente el buffer de arranque del micrófono (~110ms) para que la pista grabada quede perfectamente a tiempo con la base">
                                <input
                                  type="checkbox"
                                  checked={autoLatencyTrimMs > 0}
                                  onChange={(e) => setAutoLatencyTrimMs(e.target.checked ? 110 : 0)}
                                  className="rounded accent-amber-500"
                                />
                                <span>⚡ Compensar Latencia Hardware (-110ms)</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-mono text-neutral-400 block mb-0.5">Nombre de la Pista *</label>
                            <input
                              type="text"
                              value={newTrackName}
                              onChange={(e) => setNewTrackName(e.target.value)}
                              placeholder="Ej: Voz Segunda / Solo Guitarra / Batería"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-neutral-700 text-xs text-white focus:outline-none focus:border-sky-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-neutral-400 block mb-0.5">Instrumento (Opcional)</label>
                            <input
                              type="text"
                              value={newTrackInstrument}
                              onChange={(e) => setNewTrackInstrument(e.target.value)}
                              placeholder="Ej: Voz, Guitarra, Bajo, Teclado"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-neutral-700 text-xs text-white focus:outline-none focus:border-sky-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          {/* Option 1: Live Mic Recording while backing tracks play */}
                          <div className="p-3 rounded-xl border border-sky-500/30 bg-black/40 flex flex-col items-center justify-center gap-2">
                            {!isRecordingTrack ? (
                              <button
                                type="button"
                                onClick={() => startRecordingTrackOverdub(idea)}
                                className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
                              >
                                <Mic className="w-4 h-4 animate-pulse" /> Grabar encima (Mic)
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={stopRecordingTrackOverdub}
                                className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg"
                              >
                                <Square className="w-4 h-4 fill-current" />
                                <span>Detener ({formatTime(recordingTrackTime)})</span>
                              </button>
                            )}
                          </div>

                          {/* Option 2: Upload audio file */}
                          <label className={`p-3 rounded-xl border border-dashed border-neutral-700 hover:border-sky-400 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            <Upload className={`w-5 h-5 text-sky-400 ${isUploading ? 'animate-bounce' : ''}`} />
                            <span className="text-xs font-semibold text-white">
                              {isUploading ? "Subiendo pista..." : "Subir Archivo de Pista"}
                            </span>
                            <span className="text-[9px] text-neutral-400">MP3, WAV, M4A, WEBM, OGG</span>
                            <input
                              type="file"
                              accept="audio/*"
                              disabled={isUploading}
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  e.target.value = '';
                                  handleUploadTrackFile(idea, file);
                                }
                              }}
                            />
                          </label>

                          {/* Option 3: Load Original Song Track as Backing Track */}
                          {selectedSongBaseUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                saveNewTrackToIdea(
                                  idea,
                                  selectedSongBaseUrl,
                                  `🎵 Base: ${song.titulo} (Original)`,
                                  'Tema Base'
                                );
                                setAddingTrackIdeaId(null);
                              }}
                              className="p-3 rounded-xl border border-amber-500/40 bg-amber-950/30 hover:bg-amber-950/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-amber-200 shadow-md active:scale-95"
                              title={`Importar la pista base del tema "${song.titulo}" directamente a esta mezcla multipista`}
                            >
                              <Disc className="w-5 h-5 text-amber-400 animate-spin-slow" />
                              <span className="text-xs font-bold text-center">Base Tema Original</span>
                              <span className="text-[9px] text-amber-300/80 font-mono text-center">Usar "{song.titulo}"</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Upvote & Main Audio buttons */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => handleToggleVote(idea.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          hasVoted 
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' 
                            : 'bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-current' : ''}`} />
                        <span>Me gusta ({votes.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSong({
                            ...song,
                            audioPrincipalUrl: idea.audioUrl
                          });
                          alert(`"${idea.titulo}" establecida como Maqueta Principal del tema.`);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          song.audioPrincipalUrl === idea.audioUrl
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-white/5 border border-white/10 text-neutral-400 hover:text-amber-300 hover:bg-white/10'
                        }`}
                        title="Establecer esta idea como la Maqueta Principal del tema"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{song.audioPrincipalUrl === idea.audioUrl ? 'Maqueta Principal' : 'Hacer Maqueta Principal'}</span>
                      </button>
                    </div>

                    {/* Feedback & Comments Thread */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                        Comentarios & Críticas del Grupo ({(idea.comentarios || []).length})
                      </span>

                      {/* Comment items list */}
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {(idea.comentarios || []).map((comm) => (
                          <div key={comm.id} className="p-2 rounded-xl bg-black/30 border border-white/5 text-xs flex items-start justify-between gap-2 group">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-indigo-300 font-mono">{comm.autor}:</span>
                                {comm.timestampSegundos !== undefined && comm.timestampSegundos > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => jumpToTime(idea, comm.timestampSegundos!)}
                                    className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold hover:bg-amber-500/30 cursor-pointer"
                                  >
                                    ⏱️ {formatTime(comm.timestampSegundos)}
                                  </button>
                                )}
                              </div>
                              <p className="text-neutral-200 mt-0.5">{comm.texto}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[9px] font-mono text-neutral-500">{comm.fecha}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(idea, comm.id)}
                                className="text-neutral-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                                title="Borrar comentario"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add comment input */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setCommentTimeTagMap(prev => ({ ...prev, [idea.id]: Math.floor(currentTime) }))}
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-amber-400 font-bold whitespace-nowrap cursor-pointer"
                          title="Añadir timestamp actual"
                        >
                          ⏱️ @ {formatTime(currentTime)}
                        </button>

                        <input
                          type="text"
                          value={commentTextMap[idea.id] || ''}
                          onChange={(e) => setCommentTextMap(prev => ({ ...prev, [idea.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(idea)}
                          placeholder="Escribe tu crítica o sugerencia..."
                          className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                        />

                        <button
                          type="button"
                          onClick={() => handleAddComment(idea)}
                          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-between items-center text-xs text-neutral-400 font-mono">
          <span>💡 Sube ideas de audio o superpone pistas (Overdub) para construir arreglos en grupo.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
          >
            Cerrar Studio
          </button>
        </div>

      </div>

      <SongStudioAiGeneratorModal
        showGenModalForIdea={showGenModalForIdea}
        onClose={() => setShowGenModalForIdea(null)}
        genBpm={genBpm}
        setGenBpm={setGenBpm}
        genKey={genKey}
        setGenKey={setGenKey}
        includeDrums={includeDrums}
        setIncludeDrums={setIncludeDrums}
        includeBass={includeBass}
        setIncludeBass={setIncludeBass}
        drumStyle={drumStyle}
        setDrumStyle={setDrumStyle}
        genDuration={genDuration}
        setGenDuration={setGenDuration}
        isGeneratingAccompaniment={isGeneratingAccompaniment}
        handleGenerateAccompaniment={handleGenerateAccompaniment}
      />

      {/* CHORDS & SUBSTITUTE GUIDE VIEWER OVERLAY */}
      {showChordsModal && (
        <SongChordsViewerModal
          song={song}
          onClose={() => setShowChordsModal(false)}
          onUpdateSong={onUpdateSong}
        />
      )}

      {/* CUBASE KEYBOARD SHORTCUTS CHEAT SHEET MODAL */}
      {showCubaseHelp && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12111d] border border-purple-500/40 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 text-zinc-100 relative">
            <button
              type="button"
              onClick={() => setShowCubaseHelp(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-purple-500/20 pb-4">
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Keyboard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Atajos de Teclado Tipo Cubase DAW
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-500/40">
                    Modo Studio
                  </span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Controla la reproducción y grabación multipista directamente con tu teclado en tiempo real.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Play / Pausa</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-purple-500/40 text-purple-300 font-bold shadow">
                  Espacio
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Pausar Mantenida</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-amber-500/40 text-amber-300 font-bold shadow">
                  P
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Detener e ir a Inicio (Stop)</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-rose-500/40 text-rose-300 font-bold shadow">
                  0 / Stop / Home
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Alternar Bucle (Loop ON/OFF)</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-purple-500/40 text-purple-300 font-bold shadow">
                  L / /
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Fijar Cue In (Inicio Bucle)</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-indigo-500/40 text-indigo-300 font-bold shadow">
                  I
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Fijar Cue Out (Fin Bucle)</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-purple-500/40 text-purple-300 font-bold shadow">
                  O
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Grabar Pista Overdub</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-rose-500/40 text-rose-300 font-bold shadow">
                  R / Numpad *
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Nueva Idea / Proyecto</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-emerald-500/40 text-emerald-300 font-bold shadow">
                  N
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Retroceder 5s / 15s</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-purple-500/40 text-purple-300 font-bold shadow">
                  ←  /  Shift + ←
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Avanzar 5s / 15s</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-purple-500/40 text-purple-300 font-bold shadow">
                  →  /  Shift + →
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Alternar Silencio (Mute)</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-amber-500/40 text-amber-300 font-bold shadow">
                  M
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Alternar Solo</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-amber-500/40 text-amber-300 font-bold shadow">
                  S
                </kbd>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-white/10">
              <span className="text-[11px] text-neutral-500 font-mono">
                💡 Presiona <kbd className="px-1 py-0.5 rounded bg-black/50 border border-white/20 text-neutral-300">K</kbd> o <kbd className="px-1 py-0.5 rounded bg-black/50 border border-white/20 text-neutral-300">?</kbd> en cualquier momento para abrir este menú.
              </span>
              <button
                type="button"
                onClick={() => setShowCubaseHelp(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all cursor-pointer shadow-lg"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL DIALOG */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{confirmDeleteModal.title}</h3>
                <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">{confirmDeleteModal.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setConfirmDeleteModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = confirmDeleteModal.onConfirm;
                  setConfirmDeleteModal(null);
                  action();
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer shadow-lg shadow-rose-950/50"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
