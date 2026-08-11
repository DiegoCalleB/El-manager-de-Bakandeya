import React, { useState } from 'react';
import { Disc3, Sparkles, Scissors, Play, Pause, Plus, Trash2, ArrowUp, ArrowDown, Download, Check, RefreshCw, Layers, Radio, Volume2, VolumeX, HelpCircle, FileText, ExternalLink, X, Combine, GitMerge, CheckSquare, Square, Wand2, Music2, FileCode, ListPlus, Sliders, ChevronDown, ChevronUp, RotateCcw, RotateCw, Clock, Zap, AlertTriangle, Upload, CheckCircle2, Undo2, Redo2 } from 'lucide-react';
import { Song, ThemeColors } from '../../types';
import { apiFetch } from '../../utils/api';

export interface TrackCutItem {
  index: number;
  title: string;
  start: number; // in seconds
  end: number;   // in seconds
  duration: number; // in seconds
  type: 'musica' | 'dialogo';
  speechTranscription?: string;
  lyricsWithChords?: string;
  tonalidad?: string;
  bpm?: number;
  audioUrl?: string;
}

interface LiveConcertToAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  bandName?: string;
  colors: ThemeColors;
  isStitchLight: boolean;
  onSaveAlbumToCatalog: (albumTitle: string, tracks: TrackCutItem[]) => void;
}

const formatSeconds = (totalSecs: number): string => {
  if (isNaN(totalSecs) || totalSecs < 0) return '00:00';
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = Math.floor(totalSecs % 60);

  const mStr = String(mins).padStart(2, '0');
  const sStr = String(secs).padStart(2, '0');

  if (hrs > 0) {
    return `${hrs}:${mStr}:${sStr}`;
  }
  return `${mStr}:${sStr}`;
};

const parseTimeToSeconds = (str: string): number => {
  if (!str) return 0;
  const parts = str.split(':').map((p) => parseFloat(p) || 0);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parseFloat(str) || 0;
};

export const LiveConcertToAlbumModal: React.FC<LiveConcertToAlbumModalProps> = ({
  isOpen,
  onClose,
  bandName = 'Nuestra Banda',
  colors,
  isStitchLight,
  onSaveAlbumToCatalog,
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [useAi, setUseAi] = useState(true);
  const [transcribeFirst, setTranscribeFirst] = useState(true);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [albumTitle, setAlbumTitle] = useState('');
  const [artistName, setArtistName] = useState(bandName);
  const [tracks, setTracks] = useState<TrackCutItem[]>([]);
  const [history, setHistory] = useState<TrackCutItem[][]>([]);
  const [redoStack, setRedoStack] = useState<TrackCutItem[][]>([]);
  const [analyzedSourcePath, setAnalyzedSourcePath] = useState('');

  // Push snapshot to history stack before mutating tracks
  const pushHistorySnapshot = () => {
    setHistory((prev) => [...prev, tracks]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [tracks, ...prev]);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setTracks(previous);
    setSelectedIndices([]);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setHistory((prev) => [...prev, tracks]);
    setRedoStack((prev) => prev.slice(1));
    setTracks(next);
    setSelectedIndices([]);
  };

  // Keyboard shortcut listener for Ctrl+Z (Undo) and Ctrl+Y / Ctrl+Shift+Z (Redo)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditingText = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          if (!isEditingText && redoStack.length > 0) {
            e.preventDefault();
            handleRedo();
          }
        } else {
          if (!isEditingText && history.length > 0) {
            e.preventDefault();
            handleUndo();
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        if (!isEditingText && redoStack.length > 0) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, redoStack, tracks]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [generatedResult, setGeneratedResult] = useState<{
    albumId: string;
    deliverablePath: string;
    tracks: TrackCutItem[];
  } | null>(null);

  const [playingTrackUrl, setPlayingTrackUrl] = useState<string | null>(null);
  const [loadingSnippetIndex, setLoadingSnippetIndex] = useState<number | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isClassifying, setIsClassifying] = useState(false);
  const [youtubeBlocked, setYoutubeBlocked] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [isLinkingLocalFile, setIsLinkingLocalFile] = useState(false);

  // Helper for binary streaming upload via FormData & Chunks (handles 1GB+ files cleanly without 413 limits)
  const uploadFileBinary = async (
    file: File,
    folder = 'conciertos_fuente',
    onProgress?: (msg: string) => void
  ): Promise<string> => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks fit easily inside Cloud Run / proxy limits

    if (file.size <= 10 * 1024 * 1024) {
      if (onProgress) onProgress('Subiendo archivo...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(`Falló la subida (${uploadRes.status}): ${errorText.substring(0, 100)}`);
      }

      const uploadData = await uploadRes.json();
      return uploadData.filePath || uploadData.url || '';
    }

    // Chunked upload for files > 10MB
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const chunkBlob = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunkBlob, `${file.name}.part${i}`);
      formData.append('uploadId', uploadId);
      formData.append('chunkIndex', String(i));
      formData.append('totalChunks', String(totalChunks));
      formData.append('filename', file.name);
      formData.append('folder', folder);

      const percent = Math.round(((i + 1) / totalChunks) * 100);
      const mbUploaded = (end / (1024 * 1024)).toFixed(0);
      const mbTotal = (file.size / (1024 * 1024)).toFixed(0);
      if (onProgress) {
        onProgress(`Subiendo archivo en partes: ${percent}% (${mbUploaded}MB / ${mbTotal}MB)...`);
      }

      const res = await fetch('/api/upload/chunk', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error subiendo la parte ${i + 1}/${totalChunks} (${res.status}): ${errorText.substring(0, 100)}`);
      }

      const data = await res.json();
      if (data.completed) {
        return data.filePath || data.url || '';
      }
    }

    throw new Error('No se completó la subida del archivo.');
  };

  // Quick attach local MP3/MP4 media file for audio listening & Gemini audio transcription
  const handleAttachLocalAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLinkingLocalFile(true);
    setErrorMessage(null);
    try {
      const sourceFilePath = await uploadFileBinary(file, 'conciertos_fuente', (msg) => {
        setAnalysisStatus(msg);
      });
      setAnalyzedSourcePath(sourceFilePath);
      setAudioAvailable(true);
      setYoutubeBlocked(false);
    } catch (err: any) {
      console.error('Error linking local audio file:', err);
      alert(err.message || 'Error al vincular el archivo de audio local.');
    } finally {
      setIsLinkingLocalFile(false);
    }
  };

  // Audio Fragment Scrubber Player State
  const [activeSnippet, setActiveSnippet] = useState<{
    trackIndex: number;
    title: string;
    audioUrl: string;
    start: number;
    end: number;
  } | null>(null);

  const [snippetCurrentTime, setSnippetCurrentTime] = useState(0);
  const [snippetDuration, setSnippetDuration] = useState(0);
  const [snippetIsPlaying, setSnippetIsPlaying] = useState(false);
  const [snippetSpeed, setSnippetSpeed] = useState(1);
  const snippetAudioRef = React.useRef<HTMLAudioElement | null>(null);

  const [transcribingIndex, setTranscribingIndex] = useState<number | null>(null);
  const [transcribingChordsIndex, setTranscribingChordsIndex] = useState<number | null>(null);
  const [expandedChordsIndex, setExpandedChordsIndex] = useState<number | null>(null);
  const [expandAllChords, setExpandAllChords] = useState(true);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);
  const [isTranscribingAll, setIsTranscribingAll] = useState(false);
  const [transcribeAllProgress, setTranscribeAllProgress] = useState<{
    current: number;
    total: number;
    title: string;
  } | null>(null);

  if (!isOpen) return null;

  // Step 1: Run Analysis
  const handleAnalyzeConcert = async () => {
    if (!youtubeUrl && !uploadedFile) {
      setErrorMessage('Por favor, introduce una URL de YouTube o selecciona un archivo de vídeo/audio local.');
      return;
    }

    setErrorMessage(null);
    setIsAnalyzing(true);
    setAnalysisStatus('Extrayendo metadatos y analizando silenciogramas con yt-dlp / FFmpeg...');
    setGeneratedResult(null);

    try {
      let sourceFilePath = '';

      // If user uploaded local file, upload to temp folder first using FormData chunk streaming
      if (uploadedFile) {
        setAnalysisStatus('Subiendo archivo local al servidor...');
        sourceFilePath = await uploadFileBinary(uploadedFile, 'conciertos_fuente', (msg) => {
          setAnalysisStatus(msg);
        });
        setAnalyzedSourcePath(sourceFilePath);
      }

      setAnalysisStatus(
        useAi
          ? transcribeFirst
            ? 'Transcribiendo y analizando el audio completo con Gemini IA para alinear cortes y letras...'
            : 'Enviando a Gemini 1.5 Flash para análisis multimodal acústico y estructuración...'
          : 'Parseando capítulos, descripciones y ejecutando detección de silencios en FFmpeg...'
      );

      const response = await fetch('/api/concert-to-album/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: youtubeUrl.trim(),
          sourceFilePath,
          useAi,
          transcribeFirst,
          bandName: artistName || bandName,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error al analizar el concierto.');
      }

      const data = await response.json();
      setAlbumTitle(data.albumTitle || `Directo - ${artistName}`);
      setArtistName(data.artist || artistName);
      setTracks(data.tracks || []);
      if (typeof data.youtubeBlocked !== 'undefined') setYoutubeBlocked(Boolean(data.youtubeBlocked));
      if (typeof data.audioAvailable !== 'undefined') setAudioAvailable(Boolean(data.audioAvailable));
    } catch (err: any) {
      console.error('Error analyzing concert:', err);
      setErrorMessage(err.message || 'Error durante el análisis del concierto.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2: Slice & Generate Album
  const handleProcessAndSlice = async () => {
    if (!tracks || tracks.length === 0) {
      setErrorMessage('No hay pistas configuradas para trocear.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setProcessingStatus('Troceando archivos de audio con FFmpeg de alto rendimiento (Stream Copy)...');

    try {
      const response = await fetch('/api/concert-to-album/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: youtubeUrl.trim(),
          sourceFilePath: analyzedSourcePath,
          tracks,
          albumTitle: albumTitle || 'Directo en Vivo',
          artist: artistName || bandName,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error al trocear el concierto.');
      }

      const data = await response.json();
      setGeneratedResult({
        albumId: data.albumId,
        deliverablePath: data.deliverablePath,
        tracks: data.tracks,
      });
      setTracks(data.tracks);
    } catch (err: any) {
      console.error('Error slicing concert:', err);
      setErrorMessage(err.message || 'Error al procesar el troceado del disco.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Track modification helpers
  const handleUpdateTrack = (index: number, key: keyof TrackCutItem, value: any) => {
    pushHistorySnapshot();
    setTracks((prev) =>
      prev.map((t) => {
        if (t.index === index) {
          const updated = { ...t, [key]: value };
          if (key === 'start' || key === 'end') {
            updated.duration = Math.max(0, updated.end - updated.start);
          }
          return updated;
        }
        return t;
      })
    );
  };

  const handleAddCutTrack = (afterIndex: number) => {
    pushHistorySnapshot();
    setTracks((prev) => {
      const currentTrack = prev.find((t) => t.index === afterIndex);
      const start = currentTrack ? currentTrack.end : 0;
      const end = start + 180;
      const newTrack: TrackCutItem = {
        index: prev.length + 1,
        title: `Nueva Pista ${prev.length + 1}`,
        start,
        end,
        duration: 180,
        type: 'musica',
      };
      const updated = [...prev, newTrack];
      return updated.map((t, i) => ({ ...t, index: i + 1 }));
    });
  };

  const handleDeleteTrack = (index: number) => {
    pushHistorySnapshot();
    setTracks((prev) => {
      const filtered = prev.filter((t) => t.index !== index);
      return filtered.map((t, i) => ({ ...t, index: i + 1 }));
    });
  };

  const handleMoveTrack = (index: number, direction: 'up' | 'down') => {
    pushHistorySnapshot();
    setTracks((prev) => {
      const idx = prev.findIndex((t) => t.index === index);
      if (idx < 0) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;

      const newArr = [...prev];
      const temp = newArr[idx];
      newArr[idx] = newArr[targetIdx];
      newArr[targetIdx] = temp;

      return newArr.map((t, i) => ({ ...t, index: i + 1 }));
    });
  };

  // Audio scrubber helper methods
  const handleSeekSnippet = (timeSecs: number) => {
    setSnippetCurrentTime(timeSecs);
    if (snippetAudioRef.current) {
      snippetAudioRef.current.currentTime = timeSecs;
    }
  };

  const handleSkipSnippet = (deltaSecs: number) => {
    if (!snippetAudioRef.current) return;
    const maxDur = snippetAudioRef.current.duration || 1000;
    const newTime = Math.max(0, Math.min(maxDur, snippetAudioRef.current.currentTime + deltaSecs));
    snippetAudioRef.current.currentTime = newTime;
    setSnippetCurrentTime(newTime);
  };

  const handleChangeSnippetSpeed = (speed: number) => {
    setSnippetSpeed(speed);
    if (snippetAudioRef.current) {
      snippetAudioRef.current.playbackRate = speed;
    }
  };

  const handleSetStartFromCurrentSnippet = (trackIndex: number) => {
    if (!activeSnippet) return;
    const currentAbs = Math.max(0, Math.round((activeSnippet.start + snippetCurrentTime) * 10) / 10);
    handleUpdateTrack(trackIndex, 'start', currentAbs);
  };

  const handleSetEndFromCurrentSnippet = (trackIndex: number) => {
    if (!activeSnippet) return;
    const currentAbs = Math.max(0, Math.round((activeSnippet.start + snippetCurrentTime) * 10) / 10);
    handleUpdateTrack(trackIndex, 'end', currentAbs);
  };

  // Preview snippet playback (Generates or plays audio for a single cut item)
  const handlePlaySnippetPreview = async (track: TrackCutItem) => {
    if (activeSnippet && activeSnippet.trackIndex === track.index) {
      if (snippetAudioRef.current) {
        if (snippetIsPlaying) {
          snippetAudioRef.current.pause();
        } else {
          snippetAudioRef.current.play();
        }
      }
      return;
    }

    if (track.audioUrl) {
      setActiveSnippet({
        trackIndex: track.index,
        title: track.title,
        audioUrl: track.audioUrl,
        start: track.start,
        end: track.end,
      });
      setSnippetCurrentTime(0);
      setSnippetIsPlaying(true);
      return;
    }

    setLoadingSnippetIndex(track.index);
    try {
      const response = await fetch('/api/concert-to-album/preview-snippet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: youtubeUrl.trim(),
          sourceFilePath: analyzedSourcePath,
          start: track.start,
          end: track.end,
          trackIndex: track.index,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error al obtener previsualización del trozo.');
      }

      const data = await response.json();
      if (data.audioUrl) {
        handleUpdateTrack(track.index, 'audioUrl', data.audioUrl);
        setActiveSnippet({
          trackIndex: track.index,
          title: track.title,
          audioUrl: data.audioUrl,
          start: track.start,
          end: track.end,
        });
        setSnippetCurrentTime(0);
        setSnippetIsPlaying(true);
      }
    } catch (err: any) {
      console.error('Error generating snippet preview:', err);
      alert(err.message || 'No se pudo generar la previsualización del trozo.');
    } finally {
      setLoadingSnippetIndex(null);
    }
  };

  // Auto-classify songs vs dialogue automatically
  const handleAutoClassifyTracks = async () => {
    if (!tracks || tracks.length === 0) return;
    setIsClassifying(true);
    try {
      const response = await fetch('/api/concert-to-album/classify-tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracks,
          bandName: artistName || bandName,
          albumTitle: albumTitle || 'Directo en Vivo',
          useAi,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error al auto-clasificar.');
      }

      const data = await response.json();
      if (data.tracks) {
        setTracks(data.tracks);
      }
    } catch (err: any) {
      console.error('Error auto-classifying tracks:', err);
      alert(err.message || 'No se pudo completar la auto-clasificación.');
    } finally {
      setIsClassifying(false);
    }
  };

  // Selection for multi-track fusion
  const handleToggleSelectTrack = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Merge track with next track
  const handleMergeWithNext = (trackIndex: number) => {
    const idx = tracks.findIndex((t) => t.index === trackIndex);
    if (idx < 0 || idx >= tracks.length - 1) return;

    pushHistorySnapshot();

    const trackA = tracks[idx];
    const trackB = tracks[idx + 1];

    const minStart = Math.min(trackA.start, trackB.start);
    const maxEnd = Math.max(trackA.end, trackB.end);
    const mergedTitle = `${trackA.title} + ${trackB.title}`;
    const mergedSpeech = [trackA.speechTranscription, trackB.speechTranscription].filter(Boolean).join('\n');

    const mergedTrack: TrackCutItem = {
      index: trackA.index,
      title: mergedTitle,
      start: minStart,
      end: maxEnd,
      duration: maxEnd - minStart,
      type: trackA.type === 'musica' || trackB.type === 'musica' ? 'musica' : 'dialogo',
      speechTranscription: mergedSpeech,
    };

    const newArr = [...tracks];
    newArr.splice(idx, 2, mergedTrack);
    const reindexed = newArr.map((t, i) => ({ ...t, index: i + 1 }));
    setTracks(reindexed);
    setSelectedIndices([]);
  };

  // Merge all checked tracks
  const handleMergeSelectedTracks = () => {
    if (selectedIndices.length < 2) return;
    const sortedIdxs = [...selectedIndices].sort((a, b) => a - b);
    const targetTracks = tracks.filter((t) => sortedIdxs.includes(t.index));
    if (targetTracks.length < 2) return;

    pushHistorySnapshot();

    const minStart = Math.min(...targetTracks.map((t) => t.start));
    const maxEnd = Math.max(...targetTracks.map((t) => t.end));
    const mergedTitle = targetTracks.map((t) => t.title).join(' + ');
    const mergedSpeech = targetTracks.map((t) => t.speechTranscription).filter(Boolean).join('\n');
    const hasMusic = targetTracks.some((t) => t.type === 'musica');

    const mergedTrack: TrackCutItem = {
      index: sortedIdxs[0],
      title: mergedTitle,
      start: minStart,
      end: maxEnd,
      duration: maxEnd - minStart,
      type: hasMusic ? 'musica' : 'dialogo',
      speechTranscription: mergedSpeech,
    };

    const remaining = tracks.filter((t) => !sortedIdxs.includes(t.index));
    const updatedList = [...remaining, mergedTrack].sort((a, b) => a.start - b.start);
    const reindexed = updatedList.map((t, i) => ({ ...t, index: i + 1 }));

    setTracks(reindexed);
    setSelectedIndices([]);
  };

  // Split track into 2 parts at custom position, current snippet player time, or midpoint
  const handleSplitTrack = (trackIndex: number, customSplitSecs?: number) => {
    pushHistorySnapshot();
    setTracks((prev) => {
      const idx = prev.findIndex((t) => t.index === trackIndex);
      if (idx < 0) return prev;

      const orig = prev[idx];
      let splitPoint = customSplitSecs;

      if (splitPoint === undefined) {
        if (activeSnippet && activeSnippet.trackIndex === trackIndex && snippetCurrentTime > 0) {
          splitPoint = Math.round((activeSnippet.start + snippetCurrentTime) * 10) / 10;
        } else {
          splitPoint = Math.round((orig.start + (orig.end - orig.start) / 2) * 10) / 10;
        }
      }

      if (splitPoint <= orig.start + 0.5 || splitPoint >= orig.end - 0.5) {
        alert(`Punto de corte inválido (${formatSeconds(splitPoint)}). Debe estar dentro del intervalo del tramo (${formatSeconds(orig.start)} - ${formatSeconds(orig.end)}).`);
        return prev;
      }

      const part1: TrackCutItem = {
        ...orig,
        title: orig.title.includes('(Parte') ? orig.title : `${orig.title} (Parte 1)`,
        end: splitPoint,
        duration: Math.max(1, splitPoint - orig.start),
        audioUrl: undefined,
      };

      const part2: TrackCutItem = {
        ...orig,
        title: orig.title.includes('(Parte') ? `${orig.title} b` : `${orig.title} (Parte 2)`,
        start: splitPoint,
        end: orig.end,
        duration: Math.max(1, orig.end - splitPoint),
        audioUrl: undefined,
      };

      const newArr = [...prev];
      newArr.splice(idx, 1, part1, part2);
      return newArr.map((t, i) => ({ ...t, index: i + 1 }));
    });

    if (activeSnippet && activeSnippet.trackIndex === trackIndex) {
      setActiveSnippet(null);
    }
  };

  // Transcribe spoken speech / interlude with Gemini AI
  const handleTranscribeSpeech = async (track: TrackCutItem) => {
    setTranscribingIndex(track.index);
    try {
      const response = await fetch('/api/concert-to-album/transcribe-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackTitle: track.title,
          url: youtubeUrl.trim(),
          sourceFilePath: analyzedSourcePath,
          start: track.start,
          end: track.end,
          trackIndex: track.index,
          audioUrl: track.audioUrl,
          promptContext: `Interludio o presentación del artista (${artistName || bandName}) en el concierto`,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error al transcribir discurso.');
      }

      const data = await response.json();
      if (data.transcription) {
        handleUpdateTrack(track.index, 'speechTranscription', data.transcription);
      }
    } catch (err: any) {
      console.error('Error transcribing speech:', err);
      alert(err.message || 'No se pudo generar la transcripción del discurso.');
    } finally {
      setTranscribingIndex(null);
    }
  };

  // Transcribe song lyrics and chords sheet with AI
  const handleTranscribeSongChordsAndLyrics = async (track: TrackCutItem) => {
    setTranscribingChordsIndex(track.index);
    try {
      const response = await fetch('/api/concert-to-album/transcribe-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: track.title,
          artist: artistName || bandName,
          duration: track.duration,
          speechTranscription: track.speechTranscription,
          audioUrl: track.audioUrl,
          url: youtubeUrl.trim(),
          sourceFilePath: analyzedSourcePath,
          start: track.start,
          end: track.end,
          trackIndex: track.index,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error al transcribir letra y acordes.');
      }

      const data = await response.json();
      if (data.lyricsWithChords) {
        handleUpdateTrack(track.index, 'lyricsWithChords', data.lyricsWithChords);
        if (data.tonalidad) handleUpdateTrack(track.index, 'tonalidad', data.tonalidad);
        if (data.bpm) handleUpdateTrack(track.index, 'bpm', data.bpm);
        setExpandedChordsIndex(track.index);
      }
    } catch (err: any) {
      console.error('Error transcribing song chords:', err);
      alert(err.message || 'No se pudo generar la transcripción de acordes.');
    } finally {
      setTranscribingChordsIndex(null);
    }
  };

  // Transcribe all or selected concert tracks automatically with Gemini AI
  const handleTranscribeAllConcert = async () => {
    const targetTracks = selectedIndices.length > 0
      ? tracks.filter((t) => selectedIndices.includes(t.index))
      : tracks;

    if (!targetTracks || targetTracks.length === 0) {
      alert('No hay pistas en el tracklist para transcribir.');
      return;
    }

    pushHistorySnapshot();
    setIsTranscribingAll(true);

    for (let i = 0; i < targetTracks.length; i++) {
      const track = targetTracks[i];
      setTranscribeAllProgress({
        current: i + 1,
        total: targetTracks.length,
        title: track.title,
      });

      try {
        if (track.type === 'dialogo') {
          // Transcribe speech/interlude
          setTranscribingIndex(track.index);
          const response = await fetch('/api/concert-to-album/transcribe-speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trackTitle: track.title,
              url: youtubeUrl.trim(),
              sourceFilePath: analyzedSourcePath,
              start: track.start,
              end: track.end,
              trackIndex: track.index,
              audioUrl: track.audioUrl,
              promptContext: `Interludio o presentación del artista (${artistName || bandName}) en el concierto`,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.transcription) {
              handleUpdateTrack(track.index, 'speechTranscription', data.transcription);
            }
          }
          setTranscribingIndex(null);
        } else {
          // Transcribe song lyrics and chords
          setTranscribingChordsIndex(track.index);
          const response = await fetch('/api/concert-to-album/transcribe-song', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: track.title,
              artist: artistName || bandName,
              duration: track.duration,
              speechTranscription: track.speechTranscription,
              audioUrl: track.audioUrl,
              url: youtubeUrl.trim(),
              sourceFilePath: analyzedSourcePath,
              start: track.start,
              end: track.end,
              trackIndex: track.index,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.lyricsWithChords) handleUpdateTrack(track.index, 'lyricsWithChords', data.lyricsWithChords);
            if (data.tonalidad) handleUpdateTrack(track.index, 'tonalidad', data.tonalidad);
            if (data.bpm) handleUpdateTrack(track.index, 'bpm', data.bpm);
          }
          setTranscribingChordsIndex(null);
        }
      } catch (err: any) {
        console.error(`Error al transcribir pista ${track.index} (${track.title}):`, err);
      }
    }

    setIsTranscribingAll(false);
    setTranscribeAllProgress(null);
  };

  // Create Setlist from Concert
  const handleCreateSetlistFromConcert = () => {
    const trackListToUse = generatedResult ? generatedResult.tracks : tracks;
    if (!trackListToUse || trackListToUse.length === 0) return;

    const setlistTitle = `Directo: ${albumTitle || 'Concierto en Vivo'}`;
    const setlistItems = trackListToUse.map((t) => ({
      id: `item_${Date.now()}_${t.index}`,
      tipoItem: t.type === 'musica' ? 'cancion' : 'chapa',
      tituloCustom: t.title,
      notas: t.speechTranscription || (t.type === 'musica' ? `Tonalidad: ${t.tonalidad || 'Mim'} | BPM: ${t.bpm || 120}` : ''),
      duracionEstimadaMin: Math.max(1, Math.round(t.duration / 60)),
    }));

    const newSetlist = {
      id: `setlist_${Date.now()}`,
      nombre: setlistTitle,
      fecha: new Date().toISOString().split('T')[0],
      lugar: 'Concierto Grabado en Directo',
      items: setlistItems,
      version: 1,
    };

    try {
      const stored = localStorage.getItem('app_setlists');
      const setlists = stored ? JSON.parse(stored) : [];
      const updated = [newSetlist, ...setlists];
      localStorage.setItem('app_setlists', JSON.stringify(updated));
      alert(`¡Setlist "${setlistTitle}" creado con éxito en tu Gestor de Repertorio/Setlists!`);
    } catch (err) {
      console.warn('Error saving setlist to localStorage:', err);
      alert('Error al guardar el setlist.');
    }
  };

  const handleSaveToCatalog = () => {
    if (!generatedResult) return;
    onSaveAlbumToCatalog(albumTitle || 'Directo en Vivo', generatedResult.tracks);
    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className={`relative w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border ${
          isStitchLight
            ? 'bg-white text-slate-900 border-slate-200'
            : 'bg-slate-900 text-slate-100 border-slate-800'
        } max-h-[92vh] flex flex-col`}
      >
        {/* Modal Header */}
        <div
          className={`p-6 border-b flex items-start justify-between ${
            isStitchLight ? 'bg-amber-500/10 border-slate-200' : 'bg-amber-500/10 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
              <Disc3 className="w-7 h-7 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight">Live Concert to Album Generator</h2>
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-500 rounded-full border border-amber-500/30">
                  v2.0 Híbrido
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Módulo para transformar conciertos en directo en un Disco completo, separando canciones y presentaciones.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isStitchLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
              <span>⚠️ {errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="font-bold text-xs hover:underline">
                Descartar
              </button>
            </div>
          )}

          {/* Step 1: Input & Parameters */}
          <div
            className={`p-5 rounded-xl border space-y-4 ${
              isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
                <Radio className="w-4 h-4" /> 1. Ingesta del Concierto (YouTube o Archivo Local)
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">yt-dlp</span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">FFmpeg</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Enlace de YouTube del Concierto Completo
                </label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isStitchLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-900 border-slate-700 text-slate-100'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  O Subir Archivo de Vídeo/Audio Local
                </label>
                <input
                  type="file"
                  accept="video/*,audio/*"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  className={`w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-600 ${
                    isStitchLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                  }`}
                />
              </div>
            </div>

            {/* AI Toggle Option */}
            <div className="pt-2 border-t border-slate-800/60 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAi}
                    onChange={(e) => setUseAi(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Usar Gemini 1.5 Flash para Análisis Acústico y Transcripción
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Desactivado = MODO ALGORÍTMICO LOCAL (Zero Cost). Activado = Enriquecimiento IA para nombres y speeches.
                    </p>
                  </div>
                </label>

                <button
                  onClick={handleAnalyzeConcert}
                  disabled={isAnalyzing || (!youtubeUrl && !uploadedFile)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 font-bold text-sm text-white shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shrink-0"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Analizando...
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4" /> 🔍 Analizar Concierto & Detectar Pistas
                    </>
                  )}
                </button>
              </div>

              {useAi && (
                <div className="pl-7 pt-1.5 border-l-2 border-emerald-500/40 ml-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={transcribeFirst}
                      onChange={(e) => setTranscribeFirst(e.target.checked)}
                      className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500 bg-slate-900 border-slate-700 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> 🎤 Transcribir audio completo ANTES de trocear (Ajuste fino de cortes por habla/letra)
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        <strong>¿Por qué trocea mejor?</strong> Al transcribir primero el concierto completo, Gemini identifica exactamente dónde termina el cantante de hablar al público y dónde empieza cada letra de canción, ajustando los timestamps de corte para no dejar frases ni acordes cortados.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {isAnalyzing && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 animate-pulse flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{analysisStatus}</span>
              </div>
            )}
          </div>

          {/* Step 2: Tracks Editor Table */}
          {tracks.length > 0 && (
            <div className="space-y-4">
              {/* Local File / YouTube Audio Availability Status Banner */}
              {(!audioAvailable || youtubeBlocked) && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-200">
                        YouTube requiere verificación anti-bot en el servidor
                      </p>
                      <p className="text-amber-300/80 mt-0.5">
                        Se han extraído los títulos y timestamps. Para <strong>escuchar las muestras de audio</strong> y <strong>transcribir discursos/acordes reales con Gemini</strong>, adjunta tu archivo de audio/vídeo local (MP3, WAV o MP4).
                      </p>
                    </div>
                  </div>
                  <label className="shrink-0 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-all text-xs shadow-md">
                    <Upload className="w-4 h-4" />
                    <span>{isLinkingLocalFile ? 'Subiendo audio...' : '📁 Adjuntar Audio/Vídeo Local'}</span>
                    <input
                      type="file"
                      accept="audio/*,video/*"
                      onChange={handleAttachLocalAudioFile}
                      disabled={isLinkingLocalFile}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {audioAvailable && analyzedSourcePath && (
                <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Audio maestro vinculado: <strong>{analyzedSourcePath.split('/').pop()}</strong>. Muestras de audio y transcriptor listo.</span>
                  </span>
                  <label className="text-[11px] font-bold text-emerald-400 hover:underline cursor-pointer ml-2 shrink-0">
                    <span>Cambiar archivo</span>
                    <input
                      type="file"
                      accept="audio/*,video/*"
                      onChange={handleAttachLocalAudioFile}
                      disabled={isLinkingLocalFile}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-500" />
                    2. Tracklist Detectado ({tracks.length} Pistas)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Escucha cada trozo, ajusta títulos y momentos de corte, y clasifica o fusiona canciones y habla.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Undo & Redo Controls */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={handleUndo}
                      disabled={history.length === 0}
                      className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all ${
                        history.length > 0
                          ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 cursor-pointer'
                          : 'text-slate-600 cursor-not-allowed opacity-50'
                      }`}
                      title="Deshacer última acción (Ctrl+Z)"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Deshacer</span>
                      {history.length > 0 && (
                        <span className="text-[10px] bg-amber-500/30 text-amber-200 px-1 rounded font-mono">
                          {history.length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={handleRedo}
                      disabled={redoStack.length === 0}
                      className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all ${
                        redoStack.length > 0
                          ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 cursor-pointer'
                          : 'text-slate-600 cursor-not-allowed opacity-50'
                      }`}
                      title="Rehacer acción cancelada (Ctrl+Y / Ctrl+Shift+Z)"
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                      <span>Rehacer</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mr-2">
                    <label className="text-xs font-semibold text-slate-400">Título Disco:</label>
                    <input
                      type="text"
                      value={albumTitle}
                      onChange={(e) => setAlbumTitle(e.target.value)}
                      className={`px-2.5 py-1 text-xs font-bold rounded border ${
                        isStitchLight
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-slate-950 border-slate-700 text-slate-100'
                      }`}
                    />
                  </div>

                  <button
                    onClick={handleAutoClassifyTracks}
                    disabled={isClassifying || isTranscribingAll}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-600/30 text-purple-200 border border-purple-500/40 hover:bg-purple-600/50 flex items-center gap-1.5 transition-all"
                    title="Identificar automáticamente si cada trozo es una canción o un discurso"
                  >
                    <Wand2 className={`w-3.5 h-3.5 text-purple-400 ${isClassifying ? 'animate-spin' : ''}`} />
                    {isClassifying ? 'Clasificando...' : '⚡ Auto-Clasificar (Música/Diálogo)'}
                  </button>

                  <button
                    onClick={handleTranscribeAllConcert}
                    disabled={isTranscribingAll || tracks.length === 0}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-600/50 flex items-center gap-1.5 transition-all disabled:opacity-50"
                    title="Transcribir automáticamente todo el concierto (letras, acordes y speeches) usando Gemini IA"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-emerald-400 ${isTranscribingAll ? 'animate-spin' : ''}`} />
                    {isTranscribingAll
                      ? `Transcribiendo (${transcribeAllProgress?.current}/${transcribeAllProgress?.total})...`
                      : selectedIndices.length > 0
                      ? `🎤 Transcribir Seleccionadas (${selectedIndices.length})`
                      : '🎤 Transcribir Todo el Concierto'}
                  </button>

                  <button
                    onClick={() => setExpandAllChords(!expandAllChords)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600/30 text-amber-200 border border-amber-500/40 hover:bg-amber-600/50 flex items-center gap-1.5 transition-all"
                    title="Mostrar u ocultar los editores de cifrado y letras de todas las canciones"
                  >
                    <Music2 className="w-3.5 h-3.5 text-amber-400" />
                    {expandAllChords ? '🙈 Plegar Cifrados' : '📖 Desplegar Todos los Cifrados'}
                  </button>

                  {selectedIndices.length >= 2 && (
                    <button
                      onClick={handleMergeSelectedTracks}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md flex items-center gap-1.5 animate-bounce"
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      Fusionar Seleccionadas ({selectedIndices.length})
                    </button>
                  )}

                  <button
                    onClick={() => handleAddCutTrack(tracks.length)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Añadir Corte
                  </button>
                </div>
              </div>

              {/* Banner suggestion for Pista 1 if it's currently set as song */}
              {tracks.length > 0 && tracks[0].type === 'musica' && (
                <div className="p-3 bg-purple-950/40 border border-purple-500/40 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-purple-200 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>
                      <strong>💡 ¿La Pista 1 es la presentación/speech de la banda?</strong> Si incluye palabras de saludo o presentación (incluso con música de fondo o ráfagas), conviértela a Speech:
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      handleUpdateTrack(1, 'type', 'dialogo');
                      if (tracks[0].title.startsWith('Pista 1') || tracks[0].title.startsWith('Tema 1')) {
                        handleUpdateTrack(1, 'title', 'Presentación e Intro del Concierto');
                      }
                    }}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs shrink-0 shadow transition-all flex items-center gap-1"
                  >
                    🗣️ Convertir Pista 1 a Speech / Presentación
                  </button>
                </div>
              )}

              {/* Interactive Visual Concert Timeline */}
              {tracks.length > 0 && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 font-bold text-amber-400">
                      <Sliders className="w-3.5 h-3.5" /> Línea del Tiempo del Concierto
                    </span>
                    <span>Duración estimada: {formatSeconds(Math.max(...tracks.map((t) => t.end), 0))}</span>
                  </div>
                  <div className="h-6 w-full bg-slate-900 rounded-lg overflow-hidden flex border border-slate-800 p-0.5 gap-0.5">
                    {(() => {
                      const totalSecs = Math.max(...tracks.map((t) => t.end), 1);
                      return tracks.map((tr) => {
                        const pct = Math.max(1, (tr.duration / totalSecs) * 100);
                        const isSong = tr.type === 'musica';
                        const isExpanded = expandedChordsIndex === tr.index;
                        return (
                          <div
                            key={tr.index}
                            style={{ width: `${pct}%` }}
                            onClick={() => tr.type === 'musica' && setExpandedChordsIndex(isExpanded ? null : tr.index)}
                            className={`h-full rounded relative group cursor-pointer transition-all flex items-center justify-center text-[10px] font-mono font-bold truncate px-1 ${
                              isSong ? 'bg-amber-500/80 hover:bg-amber-400 text-slate-950' : 'bg-purple-600/80 hover:bg-purple-500 text-white'
                            }`}
                            title={`#${tr.index} ${tr.title} (${formatSeconds(tr.duration)})`}
                          >
                            <span className="truncate">{tr.index}. {tr.title}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Bulk Transcription Active Progress Banner */}
              {isTranscribingAll && transcribeAllProgress && (
                <div className="bg-emerald-950/70 border border-emerald-500/50 p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-200 animate-pulse shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-emerald-400 animate-spin shrink-0" />
                    <div>
                      <div className="font-extrabold text-emerald-100 flex items-center gap-1.5">
                        <span>Transcribiendo concierto completo con IA</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                          {transcribeAllProgress.current} / {transcribeAllProgress.total}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-300/80 truncate max-w-md">
                        Pista actual: <span className="font-semibold text-white">"{transcribeAllProgress.title}"</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full sm:w-48 bg-slate-900 h-2.5 rounded-full overflow-hidden border border-emerald-500/30">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-300 h-full transition-all duration-300"
                      style={{ width: `${(transcribeAllProgress.current / transcribeAllProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Tracks List */}
              <div className="space-y-2">
                {tracks.map((track, idx) => {
                  const isSelected = selectedIndices.includes(track.index);
                  const isLoadingPreview = loadingSnippetIndex === track.index;
                  const isPlayingThis = playingTrackUrl === track.audioUrl && !!track.audioUrl;

                  return (
                    <div
                      key={track.index}
                      className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/50'
                          : track.type === 'musica'
                          ? isStitchLight
                            ? 'bg-amber-500/5 border-amber-200 hover:border-amber-300'
                            : 'bg-amber-950/20 border-amber-500/20 hover:border-amber-500/40'
                          : isStitchLight
                          ? 'bg-purple-500/5 border-purple-200 hover:border-purple-300'
                          : 'bg-purple-950/20 border-purple-500/20 hover:border-purple-500/40'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Checkbox, Index & Type */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectTrack(track.index)}
                            className="text-slate-400 hover:text-amber-400 p-0.5"
                            title="Seleccionar para fusionar varias pistas"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-amber-500" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600" />
                            )}
                          </button>

                          <span className="w-6 text-center font-mono font-bold text-xs text-slate-400">
                            #{String(track.index).padStart(2, '0')}
                          </span>

                          <select
                            value={track.type}
                            onChange={(e) => handleUpdateTrack(track.index, 'type', e.target.value)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              track.type === 'musica'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                                : 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30'
                            }`}
                            title="Haz clic para cambiar entre Canción y Speech/Presentación"
                          >
                            <option value="musica">🎵 Canción Completa</option>
                            <option value="dialogo">🗣️ Speech / Presentación (con o sin música)</option>
                          </select>
                        </div>

                        {/* Title input */}
                        <div className="flex-1">
                          <input
                            type="text"
                            value={track.title}
                            onChange={(e) => handleUpdateTrack(track.index, 'title', e.target.value)}
                            className={`w-full px-3 py-1.5 text-xs font-semibold rounded border ${
                              isStitchLight
                                ? 'bg-white border-slate-300 text-slate-900'
                                : 'bg-slate-900 border-slate-700 text-slate-100'
                            }`}
                            placeholder="Nombre del Tema o Presentación..."
                          />
                        </div>

                        {/* Timestamps */}
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="text-slate-400">Inicio:</span>
                          <input
                            type="text"
                            value={formatSeconds(track.start)}
                            onChange={(e) => handleUpdateTrack(track.index, 'start', parseTimeToSeconds(e.target.value))}
                            className="w-16 px-1.5 py-1 text-center bg-slate-900 border border-slate-700 rounded text-amber-400 text-xs font-bold"
                          />
                          <span className="text-slate-400">Fin:</span>
                          <input
                            type="text"
                            value={formatSeconds(track.end)}
                            onChange={(e) => handleUpdateTrack(track.index, 'end', parseTimeToSeconds(e.target.value))}
                            className="w-16 px-1.5 py-1 text-center bg-slate-900 border border-slate-700 rounded text-amber-400 text-xs font-bold"
                          />
                          <span className="text-slate-500">({formatSeconds(track.duration)})</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          {/* Play snippet preview button */}
                          <button
                            onClick={() => handlePlaySnippetPreview(track)}
                            disabled={isLoadingPreview}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                              isPlayingThis
                                ? 'bg-amber-500 text-slate-950 animate-pulse'
                                : 'bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-700'
                            }`}
                            title="Reproducir este trozo para escucharlo y clasificarlo"
                          >
                            {isLoadingPreview ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span className="hidden sm:inline">Generando...</span>
                              </>
                            ) : isPlayingThis ? (
                              <>
                                <Pause className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Pausar</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Escuchar</span>
                              </>
                            )}
                          </button>

                          {/* Split track in two button */}
                          <button
                            onClick={() => handleSplitTrack(track.index)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 flex items-center gap-1 text-xs font-bold"
                            title="Dividir este tramo en 2 partes (por el segundo actual de reproducción o por la mitad)"
                          >
                            <Scissors className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline text-[10px]">Dividir</span>
                          </button>

                          {/* Merge with next button */}
                          {idx < tracks.length - 1 && (
                            <button
                              onClick={() => handleMergeWithNext(track.index)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700"
                              title={`Fusionar este trozo con el siguiente (#${track.index + 1})`}
                            >
                              <Combine className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleMoveTrack(track.index, 'up')}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400"
                            title="Mover arriba"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveTrack(track.index, 'down')}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400"
                            title="Mover abajo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrack(track.index)}
                            className="p-1 rounded hover:bg-red-500/20 text-red-400"
                            title="Eliminar corte"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Song Chords & Lyrics Control Row */}
                      {track.type === 'musica' && (
                        <div className="pl-9 pt-1.5 space-y-2 border-t border-slate-800/60 mt-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-400 font-semibold text-[11px]">Ton:</span>
                              <input
                                type="text"
                                value={track.tonalidad || 'Mim'}
                                onChange={(e) => handleUpdateTrack(track.index, 'tonalidad', e.target.value)}
                                className="w-14 px-2 py-0.5 text-center bg-slate-950 border border-slate-700 rounded text-amber-400 font-bold text-xs"
                                placeholder="Mim"
                              />
                              <span className="text-slate-400 font-semibold text-[11px]">BPM:</span>
                              <input
                                type="number"
                                value={track.bpm || 120}
                                onChange={(e) => handleUpdateTrack(track.index, 'bpm', parseInt(e.target.value) || 120)}
                                className="w-14 px-2 py-0.5 text-center bg-slate-950 border border-slate-700 rounded text-amber-400 font-bold text-xs"
                                placeholder="120"
                              />
                              {track.lyricsWithChords ? (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Cifrado & Letra Listos
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                  Sin cifrado aún
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleTranscribeSongChordsAndLyrics(track)}
                                disabled={transcribingChordsIndex === track.index}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/40 flex items-center gap-1.5 transition-all"
                                title="Generar o actualizar automáticamente letra transcrita con cifrado de acordes con Gemini AI"
                              >
                                <Sparkles className={`w-3 h-3 text-amber-400 ${transcribingChordsIndex === track.index ? 'animate-spin' : ''}`} />
                                {transcribingChordsIndex === track.index ? 'Transcribiendo...' : '✨ Re-Transcribir Letra y Acordes'}
                              </button>

                              <button
                                onClick={() => setExpandedChordsIndex(expandedChordsIndex === track.index ? null : track.index)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
                              >
                                <Music2 className="w-3 h-3 text-amber-400" />
                                {expandedChordsIndex === track.index || expandAllChords ? 'Ocultar Cifrado' : '🎼 Ver/Editar Cifrado'}
                                {expandedChordsIndex === track.index || expandAllChords ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>

                          {/* Collapsed Preview snippet of chords/lyrics if populated */}
                          {!expandAllChords && expandedChordsIndex !== track.index && track.lyricsWithChords && (
                            <div
                              onClick={() => setExpandedChordsIndex(track.index)}
                              className="p-2.5 bg-slate-950/90 rounded-xl border border-amber-500/30 font-mono text-[11px] text-amber-200/90 cursor-pointer hover:border-amber-500/60 transition-all flex items-center justify-between gap-2 shadow-sm"
                            >
                              <div className="truncate italic flex items-center gap-2">
                                <Music2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="font-bold text-amber-300 not-italic">Cifrado:</span>
                                <span className="truncate">"{track.lyricsWithChords.split('\n').filter(Boolean).slice(0, 2).join(' / ')}"</span>
                              </div>
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md font-sans font-bold shrink-0 flex items-center gap-1">
                                Ver completo ➔
                              </span>
                            </div>
                          )}

                          {/* Expanded Chord Sheet Textarea Editor */}
                          {(expandAllChords || expandedChordsIndex === track.index) && (
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 animate-fade-in shadow-inner">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                                <span className="flex items-center gap-1.5 text-amber-400">
                                  <Music2 className="w-3.5 h-3.5" /> Editor de Cifrado y Letra (Formato LaCuerda / Ultimate Guitar)
                                </span>
                                <span className="text-[10px] text-slate-500">Usa [Acorde] antes de la palabra o líneas superiores de acordes</span>
                              </div>
                              <textarea
                                value={track.lyricsWithChords || ''}
                                onChange={(e) => handleUpdateTrack(track.index, 'lyricsWithChords', e.target.value)}
                                placeholder="[Intro]&#10;[Mim] [Do] [Sol] [Re]&#10;&#10;[Verso 1]&#10;[Mim]En la noche del concierto [Do]cantamos juntos..."
                                rows={8}
                                className="w-full p-3 font-mono text-xs rounded-lg bg-slate-900 border border-slate-700 text-amber-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 leading-relaxed"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Speech Transcription row */}
                      {track.type === 'dialogo' && (
                        <div className="pl-9 pt-2 space-y-1.5 border-t border-purple-500/20 mt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                              🗣️ Transcripción del Speech / Intro:
                            </span>
                            <button
                              onClick={() => handleTranscribeSpeech(track)}
                              disabled={transcribingIndex === track.index}
                              className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-purple-600/30 text-purple-300 border border-purple-500/40 hover:bg-purple-600/50 flex items-center gap-1 transition-all"
                            >
                              <Sparkles className="w-3 h-3 text-purple-400" />
                              {transcribingIndex === track.index ? 'Transcribiendo...' : 'Re-Transcribir Speech'}
                            </button>
                          </div>
                          <textarea
                            value={track.speechTranscription || ''}
                            onChange={(e) => handleUpdateTrack(track.index, 'speechTranscription', e.target.value)}
                            placeholder="[Intro musical / Palabras del artista al público]..."
                            rows={2}
                            className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-purple-500/30 text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-500 leading-relaxed font-sans"
                          />
                        </div>
                      )}

                      {/* Interactive Audio Fragment Scrubber Player - Positioned directly underneath the active track */}
                      {activeSnippet && activeSnippet.trackIndex === track.index && (
                        <div className="mt-3 p-3.5 bg-slate-950 border-2 border-amber-500/60 rounded-xl space-y-3 shadow-xl animate-fade-in ring-2 ring-amber-500/20">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                                <Volume2 className="w-4 h-4 animate-pulse" />
                              </div>
                              <div>
                                <span className="text-xs font-black text-amber-400 block">
                                  Reproductor de Tramo: #{activeSnippet.trackIndex} "{track.title}"
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Línea de tiempo: {formatSeconds(activeSnippet.start)} ➔ {formatSeconds(activeSnippet.end)}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Set start/end markers from current position */}
                              <button
                                onClick={() => handleSetStartFromCurrentSnippet(activeSnippet.trackIndex)}
                                className="px-2.5 py-1 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/40 transition-all flex items-center gap-1"
                                title="Fijar el punto de inicio de este corte en el segundo actual de reproducción"
                              >
                                📍 Ajustar Inicio ({formatSeconds(activeSnippet.start + snippetCurrentTime)})
                              </button>

                              <button
                                onClick={() => handleSetEndFromCurrentSnippet(activeSnippet.trackIndex)}
                                className="px-2.5 py-1 text-[10px] font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/40 transition-all flex items-center gap-1"
                                title="Fijar el punto final de este corte en el segundo actual de reproducción"
                              >
                                📍 Ajustar Fin ({formatSeconds(activeSnippet.start + snippetCurrentTime)})
                              </button>

                              <button
                                onClick={() => {
                                  const currentAbs = Math.max(0, Math.round((activeSnippet.start + snippetCurrentTime) * 10) / 10);
                                  handleSplitTrack(activeSnippet.trackIndex, currentAbs);
                                }}
                                className="px-2.5 py-1 text-[10px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/40 transition-all flex items-center gap-1 shadow-sm"
                                title="Dividir este tramo en 2 partes exactamente en el segundo actual de reproducción"
                              >
                                <Scissors className="w-3 h-3 text-rose-400" />
                                <span>✂️ Dividir en 2 Aquí ({formatSeconds(activeSnippet.start + snippetCurrentTime)})</span>
                              </button>

                              <button
                                onClick={() => setActiveSnippet(null)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                                title="Cerrar reproductor"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Audio element controller */}
                          <audio
                            ref={snippetAudioRef}
                            src={activeSnippet.audioUrl}
                            autoPlay
                            onTimeUpdate={(e) => setSnippetCurrentTime(e.currentTarget.currentTime)}
                            onLoadedMetadata={(e) => setSnippetDuration(e.currentTarget.duration)}
                            onPlay={() => setSnippetIsPlaying(true)}
                            onPause={() => setSnippetIsPlaying(false)}
                            onEnded={() => setSnippetIsPlaying(false)}
                          />

                          {/* Range Slider Scrubber */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300">
                              <span>{formatSeconds(snippetCurrentTime)}</span>
                              <span className="text-[10px] text-slate-400 font-sans">Desplaza la barra para navegar por el tramo</span>
                              <span>{formatSeconds(snippetDuration)}</span>
                            </div>

                            <input
                              type="range"
                              min={0}
                              max={snippetDuration || 100}
                              step={0.1}
                              value={snippetCurrentTime}
                              onChange={(e) => handleSeekSnippet(parseFloat(e.target.value))}
                              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
                            />
                          </div>

                          {/* Player Controls Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSkipSnippet(-5)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1"
                                title="Retroceder 5 segundos"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> -5s
                              </button>

                              <button
                                onClick={() => {
                                  if (snippetAudioRef.current) {
                                    if (snippetIsPlaying) snippetAudioRef.current.pause();
                                    else snippetAudioRef.current.play();
                                  }
                                }}
                                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                              >
                                {snippetIsPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {snippetIsPlaying ? 'Pausar' : 'Reproducir'}
                              </button>

                              <button
                                onClick={() => handleSkipSnippet(5)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1"
                                title="Adelantar 5 segundos"
                              >
                                <RotateCw className="w-3.5 h-3.5" /> +5s
                              </button>
                            </div>

                            {/* Playback speed selector */}
                            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
                              <span className="text-slate-500 font-sans px-1 text-[10px]">Velocidad:</span>
                              {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                                <button
                                  key={spd}
                                  onClick={() => handleChangeSnippetSpeed(spd)}
                                  className={`px-1.5 py-0.5 rounded font-bold ${
                                    snippetSpeed === spd ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {spd}x
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Button: Trocear y Generar Disco */}
              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleProcessAndSlice}
                  disabled={isProcessing}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 font-extrabold text-white text-sm shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> {processingStatus}
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4" /> ✂️ Trocear Concierto & Crear Disco (.mp3)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Generated Result & Save to Catalog */}
          {generatedResult && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-emerald-400">¡Disco Generado con Éxito!</h3>
                    <p className="text-xs text-slate-300">
                      Archivos cortados y manifiesto web interactivo listos.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={generatedResult.deliverablePath}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" /> Abrir Repertorio Web
                  </a>

                  <a
                    href={generatedResult.deliverablePath.replace('/index.html', '/repertoire.cue')}
                    download="repertoire.cue"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
                    title="Descargar mapa de índices para DAWs (Reaper, Cubase, Ableton, Logic)"
                  >
                    <FileCode className="w-3.5 h-3.5 text-purple-400" /> CUE Sheet (.cue)
                  </a>

                  <button
                    onClick={handleCreateSetlistFromConcert}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-purple-600/30 text-purple-200 border border-purple-500/40 hover:bg-purple-600/50 flex items-center gap-1.5 transition-all"
                  >
                    <ListPlus className="w-3.5 h-3.5 text-purple-400" /> Crear Setlist
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
                <p className="text-xs text-slate-400">
                  ¿Deseas agregar formalmente este nuevo Álbum con todos sus temas a la Discografía de la Banda?
                </p>

                <button
                  onClick={handleSaveToCatalog}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 font-extrabold text-slate-950 text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  <Disc3 className="w-4 h-4" /> 💾 Guardar como Álbum en la Discografía
                </button>
              </div>

              {savedSuccessMsg && (
                <div className="p-3 bg-emerald-500/20 text-emerald-300 text-xs rounded-lg font-bold border border-emerald-500/30 text-center animate-fade-in">
                  ¡Álbum e individualidades guardadas correctamente en la Discografía de la Banda!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
