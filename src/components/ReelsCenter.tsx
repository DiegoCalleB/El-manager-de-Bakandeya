import React, { useState, useEffect } from 'react';
import { ThemeColors, SocialPost, SocialMetric } from '../types';
import { apiFetch } from '../utils/api';
import { 
 Sparkles, Play, Flame, Heart, MessageCircle, Share2, Music, 
 Upload, Layers, CheckCircle2, RotateCcw, AlertCircle, RefreshCw,
 Video, Calendar, Clock, Trash2, Film, Check, ExternalLink, Gauge, ChevronRight, ChevronLeft,
 Plus, TrendingUp, LineChart, Instagram, Youtube, Edit, Table,
 Volume2, VolumeX, Maximize2, X
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface ReelsCenterProps {
 colors: ThemeColors;
 posts: SocialPost[];
 onAddPost: (post: SocialPost) => Promise<void>;
 onUpdatePost: (id: string, updatedFields: Partial<SocialPost>) => Promise<void>;
 metrics?: SocialMetric[];
 onAddMetric?: (metric: SocialMetric) => Promise<void>;
 onUpdateMetric?: (id: string, updatedFields: Partial<SocialMetric>) => Promise<void>;
 onDeleteMetric?: (id: string) => Promise<void>;
}

import { 
  ReelCard, 
  HighlightClip, 
  OptimalTime, 
  getYouTubeId, 
  getStartTimeInSeconds 
} from '../utils/reelsUtils';
import { ReelsMetricsView } from './reels/ReelsMetricsView';

export type { ReelCard, HighlightClip, OptimalTime };

function parseRangeTimes(rangeStr?: string) {
 if (!rangeStr) return { start: 0, end: 0, duration: 0 };
 const parts = rangeStr.split('-');
 const startStr = parts[0]?.trim() || '';
 const endStr = parts[1]?.trim() || '';
 
 const parseTime = (timeStr: string) => {
 const timeParts = timeStr.split(':');
 if (timeParts.length === 3) {
 const hrs = parseInt(timeParts[0], 10) || 0;
 const mins = parseInt(timeParts[1], 10) || 0;
 const secs = parseInt(timeParts[2], 10) || 0;
 return hrs * 3600 + mins * 60 + secs;
 } else if (timeParts.length === 2) {
 const mins = parseInt(timeParts[0], 10) || 0;
 const secs = parseInt(timeParts[1], 10) || 0;
 return mins * 60 + secs;
 } else if (timeParts.length === 1) {
 return parseInt(timeParts[0], 10) || 0;
 }
 return 0;
 };

 const start = parseTime(startStr);
 const end = parseTime(endStr);
 const duration = Math.max(0, end - start);
 return { start, end, duration };
}

function formatTime(seconds: number): string {
 const mins = Math.floor(seconds / 60);
 const secs = seconds % 60;
 return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function ReelsCenter({ 
 colors, 
 posts = [], 
 onAddPost, 
 onUpdatePost,
 metrics = [],
 onAddMetric,
 onUpdateMetric,
 onDeleteMetric
}: ReelsCenterProps) {
 // Tabs: 'pipeline' (existing Kanban + Writer) vs 'analyzer' (new AI Video Highlight Extractor) vs 'metrics'
 const [activeTab, setActiveTab] = useState<'pipeline' | 'analyzer' | 'metrics'>('pipeline');

 // Sync state
 const [isSyncingReels, setIsSyncingReels] = useState(false);
 const [syncSuccessMessage, setSyncSuccessMessage] = useState('');
 const [syncErrorMessage, setSyncErrorMessage] = useState('');

 const handleSyncReels = async () => {
 setIsSyncingReels(true);
 setSyncSuccessMessage('');
 setSyncErrorMessage('');
 try {
 const res = await fetch('/api/posts/sync', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' }
 });
 const data = await res.json();
 if (res.ok && data.success) {
 setSyncSuccessMessage(data.message || 'Publicaciones y Reels sincronizados con éxito en Google Sheets.');
 // clear after 6 seconds
 setTimeout(() => setSyncSuccessMessage(''), 6000);
 } else {
 setSyncErrorMessage(data.error || 'Error al intentar sincronizar los Reels.');
 }
 } catch (error) {
 console.error('Error synchronizing reels:', error);
 setSyncErrorMessage('Error de conexión con el servidor de Google Sheets.');
 } finally {
 setIsSyncingReels(false);
 }
 };

 const [selectedPostInPhone, setSelectedPostInPhone] = useState<SocialPost | null>(null);
 const [reelIdea, setReelIdea] = useState('');
 const [generatedCopy, setGeneratedCopy] = useState('');
 const [isGenerating, setIsGenerating] = useState(false);
 const [uploadProgress, setUploadProgress] = useState<number | null>(null);

 // New AI Analyzer States
 const [inputType, setInputType] = useState<'file' | 'youtube'>('file');
 const [youtubeUrl, setYoutubeUrl] = useState('');
 const [dragActive, setDragActive] = useState(false);
 const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
 const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
 const [isPreviewMuted, setIsPreviewMuted] = useState(true);
 const [isExpandedPreview, setIsExpandedPreview] = useState(false);
 const [videoTopic, setVideoTopic] = useState('');
 const [videoDuration, setVideoDuration] = useState(30);
 const [isAnalyzing, setIsAnalyzing] = useState(false);
 const [loadingStep, setLoadingStep] = useState(0);
 const [analysisError, setAnalysisError] = useState<string | null>(null);
 
 // Results from Backend
 const [highlights, setHighlights] = useState<HighlightClip[]>([]);
 const [optimalTime, setOptimalTime] = useState<OptimalTime | null>(null);
 const [selectedHighlightIndex, setSelectedHighlightIndex] = useState<number>(0);
 const [simulatedTime, setSimulatedTime] = useState<number>(0);
 const [ytLoopCount, setYtLoopCount] = useState<number>(0);
 const [draggingBoundary, setDraggingBoundary] = useState<'start' | 'end' | null>(null);

 // Real physical video cutting and subtitle states
 const [renderedClipUrl, setRenderedClipUrl] = useState<string | null>(null);
 const [renderedSubUrl, setRenderedSubUrl] = useState<string | null>(null);
 const [subtitleCues, setSubtitleCues] = useState<Array<{ text: string; start: number; end: number }>>([]);
 const [wordOffsets, setWordOffsets] = useState<Array<{ word: string; start: number; end: number }>>([]);
 const [isWhisperTranscribed, setIsWhisperTranscribed] = useState(false);
 const [currentSubtitleText, setCurrentSubtitleText] = useState<string>('');
 const [isCuttingVideo, setIsCuttingVideo] = useState(false);
 const [cuttingProgressText, setCuttingProgressText] = useState('');
 const [cuttingError, setCuttingError] = useState<string | null>(null);
 const [sinTranscripcionReal, setSinTranscripcionReal] = useState<boolean>(false);

 // Clip Re-analysis states
 const [clipUserNote, setClipUserNote] = useState<string>('');
 const [isReanalyzingClip, setIsReanalyzingClip] = useState<boolean>(false);
 const [reanalyzeSuccessMsg, setReanalyzeSuccessMsg] = useState<string | null>(null);

 const handleReanalyzeClip = async () => {
 const activeClip = highlights[selectedHighlightIndex];
 if (!activeClip) return;

 setIsReanalyzingClip(true);
 setReanalyzeSuccessMsg(null);

 const { start, duration } = parseRangeTimes(activeClip.range);

 try {
 const response = await apiFetch('/api/reanalyze-clip', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 youtubeUrl,
 fileName: selectedFile?.name,
 videoTitle: videoTopic || selectedFile?.name,
 start,
 duration,
 userNotes: clipUserNote,
 currentTitle: activeClip.title
 })
 });

 const data = await response.json();
 if (data.success && data.analysis) {
 const { title, reason, recommendedCopy, hashtags, energyLevel, confidence } = data.analysis;

 setHighlights(prev => prev.map((clip, idx) => {
 if (idx === selectedHighlightIndex) {
 return {
 ...clip,
 title: title || clip.title,
 reason: reason || clip.reason,
 recommendedCopy: recommendedCopy || clip.recommendedCopy,
 hashtags: hashtags || clip.hashtags,
 energyLevel: energyLevel || clip.energyLevel,
 confidence: confidence || clip.confidence
 };
 }
 return clip;
 }));

 if (recommendedCopy) {
 setEditedCopy(recommendedCopy);
 }

 setReanalyzeSuccessMsg("¡Análisis del fragmento refinado con éxito!");
 setTimeout(() => setReanalyzeSuccessMsg(null), 4000);
 } else {
 alert(data.error ||"No se pudo reanalizar el fragmento.");
 }
 } catch (err) {
 console.error("Error reanalyzing clip:", err);
 alert("Hubo un problema al conectar con el servidor para el reanálisis.");
 } finally {
 setIsReanalyzingClip(false);
 }
 };

 const handleCutPhysicalVideo = async () => {
 const activeClip = highlights[selectedHighlightIndex];
 if (!activeClip || !youtubeUrl) return;

 setIsCuttingVideo(true);
 setCuttingError(null);
 setCuttingProgressText("Conectando con el servidor...");
 setWordOffsets([]);
 setIsWhisperTranscribed(false);
 setSinTranscripcionReal(false);

 const { start, duration } = parseRangeTimes(activeClip.range);
 const clipId = `reel-${selectedHighlightIndex}-${Date.now()}`;

 // Cycle through real steps to give perfect feedback
 const progressSteps = [
"Iniciando descarga del stream de YouTube...",
"Extrayendo flujo de audio y vídeo de alta calidad...",
"Estabilizando búfer y preparando ffmpeg...",
"Recortando fragmento con precisión de milisegundos...",
"Aplicando filtro de encuadre vertical (9:16)...",
"Analizando audio e indexando subtítulos de YouTube...",
"Sincronizando offsets de palabras...",
"Codificando vídeo y empaquetando en MP4...",
"Finalizando renderizado físico..."
 ];

 let currentStep = 0;
 const interval = setInterval(() => {
 if (currentStep < progressSteps.length - 1) {
 currentStep++;
 setCuttingProgressText(progressSteps[currentStep]);
 }
 }, 2500);

 try {
 const res = await apiFetch("/api/cut-video-clip", {
 method:"POST",
 headers: {"Content-Type":"application/json" },
 body: JSON.stringify({
 youtubeUrl,
 start,
 duration,
 clipId,
 cropVertical: true
 })
 });

 clearInterval(interval);
 if (!res.ok) throw new Error("El servidor devolvió un error al realizar el recorte.");
 
 const data = await res.json();
 if (data.success && data.videoBase64) {
 // Revoke previous Blob URLs if existing to free memory
 if (renderedClipUrl && renderedClipUrl.startsWith('blob:')) {
 URL.revokeObjectURL(renderedClipUrl);
 }
 if (renderedSubUrl && renderedSubUrl.startsWith('blob:')) {
 URL.revokeObjectURL(renderedSubUrl);
 }

 // Convert base64 Data URL to Blob -> ObjectURL
 const parts = data.videoBase64.split(',');
 const mimeString = parts[0].split(':')[1].split(';')[0];
 const byteString = atob(parts[1]);
 const ab = new ArrayBuffer(byteString.length);
 const ia = new Uint8Array(ab);
 for (let i = 0; i < byteString.length; i++) {
 ia[i] = byteString.charCodeAt(i);
 }
 const videoBlob = new Blob([ab], { type: mimeString });
 const newClipUrl = URL.createObjectURL(videoBlob);
 setRenderedClipUrl(newClipUrl);

 // Handle VTT Subtitles as Object URL
 if (data.vttContent) {
 const vttBlob = new Blob([data.vttContent], { type: 'text/vtt' });
 const newSubUrl = URL.createObjectURL(vttBlob);
 setRenderedSubUrl(newSubUrl);
 } else {
 setRenderedSubUrl(null);
 }

 setSubtitleCues(data.subtitles || []);
 setWordOffsets(data.words || []);
 setSinTranscripcionReal(Boolean(data.sinTranscripcionReal));
 setIsWhisperTranscribed(false);
 setCuttingProgressText("¡Reel físico en memoria renderizado con éxito!");
 } else {
 throw new Error(data.error ||"Error al codificar el clip de vídeo.");
 }
 } catch (err: any) {
 clearInterval(interval);
 setCuttingError(err.message ||"Error al renderizar el clip.");
 } finally {
 setIsCuttingVideo(false);
 }
 };

 // Global drag handler for timeline dragging
 useEffect(() => {
 if (!draggingBoundary) return;

 const handleGlobalMouseMove = (e: MouseEvent) => {
 const container = document.getElementById('interactive-timeline-container');
 if (!container) return;

 const rect = container.getBoundingClientRect();
 const clickX = e.clientX - rect.left;
 const clickPct = Math.max(0, Math.min(1, clickX / rect.width));
 
 const currentClip = highlights[selectedHighlightIndex];
 if (!currentClip) return;
 const { start, end } = parseRangeTimes(currentClip.range);
 const totalDuration = Math.max(120, end + 30);
 const targetSeconds = Math.round(clickPct * totalDuration);

 let newStart = start;
 let newEnd = end;

 if (draggingBoundary === 'start') {
 newStart = Math.min(targetSeconds, end - 1);
 } else if (draggingBoundary === 'end') {
 newEnd = Math.max(targetSeconds, start + 1);
 }

 const formatSecsToMMSS = (totalSecs: number) => {
 const mins = Math.floor(totalSecs / 60);
 const secs = totalSecs % 60;
 return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
 };

 const newRange = `${formatSecsToMMSS(newStart)}-${formatSecsToMMSS(newEnd)}`;
 setHighlights(prev => prev.map((clip, idx) => 
 idx === selectedHighlightIndex ? { ...clip, range: newRange } : clip
 ));
 };

 const handleGlobalMouseUp = () => {
 setDraggingBoundary(null);
 setSimulatedTime(0);
 setYtLoopCount(c => c + 1);
 };

 window.addEventListener('mousemove', handleGlobalMouseMove);
 window.addEventListener('mouseup', handleGlobalMouseUp);

 const handleGlobalTouchMove = (e: TouchEvent) => {
 const container = document.getElementById('interactive-timeline-container');
 if (!container) return;

 const rect = container.getBoundingClientRect();
 const touch = e.touches[0];
 if (!touch) return;
 const clickX = touch.clientX - rect.left;
 const clickPct = Math.max(0, Math.min(1, clickX / rect.width));
 
 const currentClip = highlights[selectedHighlightIndex];
 if (!currentClip) return;
 const { start, end } = parseRangeTimes(currentClip.range);
 const totalDuration = Math.max(120, end + 30);
 const targetSeconds = Math.round(clickPct * totalDuration);

 let newStart = start;
 let newEnd = end;

 if (draggingBoundary === 'start') {
 newStart = Math.min(targetSeconds, end - 1);
 } else if (draggingBoundary === 'end') {
 newEnd = Math.max(targetSeconds, start + 1);
 }

 const formatSecsToMMSS = (totalSecs: number) => {
 const mins = Math.floor(totalSecs / 60);
 const secs = totalSecs % 60;
 return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
 };

 const newRange = `${formatSecsToMMSS(newStart)}-${formatSecsToMMSS(newEnd)}`;
 setHighlights(prev => prev.map((clip, idx) => 
 idx === selectedHighlightIndex ? { ...clip, range: newRange } : clip
 ));
 };

 const handleGlobalTouchEnd = () => {
 setDraggingBoundary(null);
 setSimulatedTime(0);
 setYtLoopCount(c => c + 1);
 };

 window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
 window.addEventListener('touchend', handleGlobalTouchEnd);

 return () => {
 window.removeEventListener('mousemove', handleGlobalMouseMove);
 window.removeEventListener('mouseup', handleGlobalMouseUp);
 window.removeEventListener('touchmove', handleGlobalTouchMove);
 window.removeEventListener('touchend', handleGlobalTouchEnd);
 };
 }, [draggingBoundary, highlights, selectedHighlightIndex]);

 // Simulated playback time for highlight looping
 useEffect(() => {
 let interval: any = null;
 const currentClip = highlights[selectedHighlightIndex];
 if (currentClip && activeTab === 'analyzer') {
 const { duration } = parseRangeTimes(currentClip.range);
 setSimulatedTime(0);
 setYtLoopCount(0);
 if (duration > 0) {
 interval = setInterval(() => {
 setSimulatedTime((prev) => {
 if (prev >= duration - 1) {
 setYtLoopCount(c => c + 1);
 return 0; // loop back to 0
 }
 return prev + 1;
 });
 }, 1000);
 }
 } else {
 setSimulatedTime(0);
 }
 return () => {
 if (interval) clearInterval(interval);
 };
 }, [selectedHighlightIndex, highlights, activeTab]);

 // Close expanded preview modal when Escape is pressed
 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === 'Escape' && isExpandedPreview) {
 setIsExpandedPreview(false);
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [isExpandedPreview]);
 
 // Form values for Scheduling
 const [editedCopy, setEditedCopy] = useState('');
 const [selectedPlatform, setSelectedPlatform] = useState<'Instagram' | 'TikTok' | 'YouTube' | 'Facebook'>('Instagram');
 const [scheduledDate, setScheduledDate] = useState('2026-07-16');
 const [scheduledTime, setScheduledTime] = useState('20:30');
 const [isScheduling, setIsScheduling] = useState(false);
 const [schedulingSuccess, setSchedulingSuccess] = useState(false);
 const [copySuccess, setCopySuccess] = useState(false);

 // Metrics Form States
 const [metricDate, setMetricDate] = useState(new Date().toISOString().split('T')[0]);
 const [metricInsta, setMetricInsta] = useState('');
 const [metricTiktok, setMetricTiktok] = useState('');
 const [metricYoutube, setMetricYoutube] = useState('');
 const [metricNotes, setMetricNotes] = useState('');
 const [editingMetricId, setEditingMetricId] = useState<string | null>(null);
 const [isSavingMetric, setIsSavingMetric] = useState(false);
 const [metricSuccess, setMetricSuccess] = useState('');
 const [isSyncingMetrics, setIsSyncingMetrics] = useState(false);
 const [isScanningMetrics, setIsScanningMetrics] = useState(false);
 const [realVideos, setRealVideos] = useState<any[]>([
 {
 title:"El Violín del Diablo (Ska-Reggae Live)",
 views: 5240,
 date:"2025-11-12",
 link:"https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 },
 {
 title:"Bakandeya - Ensayo en Trinchera Málaga",
 views: 3120,
 date:"2026-02-18",
 link:"https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 },
 {
 title:"Gira Bakandeya 2026 - Promo Oficial",
 views: 1850,
 date:"2026-04-05",
 link:"https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 },
 {
 title:"Roots Reggae Session Live in Madrid",
 views: 1420,
 date:"2026-05-20",
 link:"https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 }
 ]);

 const handleSaveMetric = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!metricInsta || !metricTiktok || !metricYoutube) {
 alert("Por favor rellena todos los campos de seguidores.");
 return;
 }

 setIsSavingMetric(true);
 setMetricSuccess('');

 try {
 if (editingMetricId) {
 if (onUpdateMetric) {
 await onUpdateMetric(editingMetricId, {
 fecha: metricDate,
 instagram: parseInt(metricInsta),
 tiktok: parseInt(metricTiktok),
 youtube: parseInt(metricYoutube),
 notas: metricNotes
 });
 setMetricSuccess('✓ Registro actualizado correctamente.');
 }
 } else {
 if (onAddMetric) {
 const newId = `metric-${Date.now()}`;
 await onAddMetric({
 id: newId,
 fecha: metricDate,
 instagram: parseInt(metricInsta),
 tiktok: parseInt(metricTiktok),
 youtube: parseInt(metricYoutube),
 notas: metricNotes
 });
 setMetricSuccess('✓ Nuevo checkpoint registrado correctamente.');
 }
 }

 // Reset form
 setMetricDate(new Date().toISOString().split('T')[0]);
 setMetricInsta('');
 setMetricTiktok('');
 setMetricYoutube('');
 setMetricNotes('');
 setEditingMetricId(null);
 setTimeout(() => setMetricSuccess(''), 4000);
 } catch (error) {
 console.error("Error saving metric:", error);
 } finally {
 setIsSavingMetric(false);
 }
 };

 const handleEditMetricClick = (m: SocialMetric) => {
 setEditingMetricId(m.id);
 setMetricDate(m.fecha);
 setMetricInsta(String(m.instagram));
 setMetricTiktok(String(m.tiktok));
 setMetricYoutube(String(m.youtube));
 setMetricNotes(m.notas);
 };

 const handleCancelEditMetric = () => {
 setEditingMetricId(null);
 setMetricDate(new Date().toISOString().split('T')[0]);
 setMetricInsta('');
 setMetricTiktok('');
 setMetricYoutube('');
 setMetricNotes('');
 };

 const handleSyncMetricsTab = async () => {
 setIsSyncingMetrics(true);
 setMetricSuccess('');
 try {
 const res = await fetch('/api/metrics/sync', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' }
 });
 const data = await res.json();
 if (res.ok && data.success) {
 setMetricSuccess('✓ Sincronizado con Google Sheets con éxito.');
 setTimeout(() => setMetricSuccess(''), 4000);
 } else {
 alert(data.error || 'Error al sincronizar seguidores.');
 }
 } catch (err) {
 console.error(err);
 alert('Error de conexión.');
 } finally {
 setIsSyncingMetrics(false);
 }
 };

 const handleScanRealMetrics = async () => {
 setIsScanningMetrics(true);
 setMetricSuccess('');
 try {
 const res = await fetch('/api/metrics/real', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' }
 });
 const resData = await res.json();
 if (res.ok && resData.success) {
 const { data } = resData;
 setMetricInsta(data.instagramFollowers.toString());
 setMetricTiktok(data.tiktokFollowers.toString());
 setMetricYoutube(data.youtubeSubscribers.toString());
 setMetricNotes(`Sincronización automática de redes reales. Spotify Oyentes: ${data.spotifyListeners || 150}`);
 if (data.videos && data.videos.length > 0) {
 setRealVideos(data.videos);
 }
 setMetricSuccess(`✓ Lectura en directo realizada desde perfiles oficiales (IG: ${data.instagramFollowers}, TK: ${data.tiktokFollowers}, YT: ${data.youtubeSubscribers}).`);
 setTimeout(() => setMetricSuccess(''), 6000);
 } else {
 alert(resData.error || 'Error al escanear datos reales.');
 }
 } catch (err) {
 console.error(err);
 alert('Error de conexión al escanear redes reales.');
 } finally {
 setIsScanningMetrics(false);
 }
 };

 const getLoadingSteps = () => {
 const firstStep = inputType === 'youtube'
 ?"Obteniendo flujo de audio y vídeo de YouTube..."
 :"Subiendo metraje bruto al búfer temporal seguro...";
 return [
 firstStep,
"Analizando espectro acústico en busca de picos de violín y percusión (+12dB)...",
"Mapeando transiciones rítmicas de compases (BPM 145 balkan a 85 reggae)...",
"Calculando curvas de retención con el modelo de engagement para España...",
"Generando copys identitarios de la banda y hashtags con Gemini..."
 ];
 };

 // Drag & Drop helper
 const handleFileDrop = (e: React.DragEvent) => {
 e.preventDefault();
 setDragActive(false);
 if (e.dataTransfer.files && e.dataTransfer.files[0]) {
 const file = e.dataTransfer.files[0];
 setSelectedFile({
 name: file.name,
 size: file.size
 });
 try {
 const url = URL.createObjectURL(file);
 setLocalVideoUrl(url);
 } catch (err) {
 console.error("Error creating Object URL for video:", err);
 }
 // Try to auto-extract context from file name
 const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ").replace(/-/g, " ");
 setVideoTopic(cleanName);
 }
 };

 const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 const file = e.target.files[0];
 setSelectedFile({
 name: file.name,
 size: file.size
 });
 try {
 const url = URL.createObjectURL(file);
 setLocalVideoUrl(url);
 } catch (err) {
 console.error("Error creating Object URL for video:", err);
 }
 const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ").replace(/-/g, " ");
 setVideoTopic(cleanName);
 }
 };

 // Trigger Highlight Extraction via backend API
 const handleAnalyzeVideo = async () => {
 if (inputType === 'file' && !selectedFile) return;
 if (inputType === 'youtube' && !youtubeUrl) return;

 // Reset physical clip and subtitle state for the new video
 setRenderedClipUrl(null);
 setRenderedSubUrl(null);
 setSubtitleCues([]);
 setWordOffsets([]);
 setIsWhisperTranscribed(false);
 setCurrentSubtitleText('');
 setCuttingError(null);

 setIsAnalyzing(true);
 setAnalysisError(null);
 setLoadingStep(0);

 const steps = getLoadingSteps();

 // Simulate stepping for user feedback
 const stepInterval = setInterval(() => {
 setLoadingStep(prev => {
 if (prev < steps.length - 1) return prev + 1;
 return prev;
 });
 }, 1500);

 try {
 const targetYtUrl = inputType === 'youtube' ? youtubeUrl : (youtubeUrl || undefined);
 const res = await apiFetch('/api/analyze-video-highlights', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 fileName: inputType === 'file' ? selectedFile?.name : undefined,
 youtubeUrl: targetYtUrl,
 videoDuration: videoDuration,
 videoTopic: videoTopic || (targetYtUrl ?"Vídeo de YouTube de Bakandeya" :"Ensayo o directo de la banda con violín y percusión reciclada")
 })
 });

 clearInterval(stepInterval);

 const data = await res.json().catch(() => null);

 if (!res.ok || !data?.success) {
 throw new Error(data?.error || data?.message || 'Error al procesar el vídeo en el servidor. Revisa tu sesión o inténtalo de nuevo.');
 }

 setHighlights(data.highlights || []);
 setOptimalTime(data.optimalTime || null);
 setSelectedHighlightIndex(0);
 
 // Initialize editing form fields
 if (data.highlights && data.highlights.length > 0) {
 setEditedCopy(data.highlights[0].recommendedCopy || data.highlights[0].copy || '');
 }
 if (data.optimalTime) {
 setScheduledDate(data.optimalTime.date || '2026-07-30');
 setScheduledTime(data.optimalTime.time || '20:30');
 }
 } catch (err: any) {
 clearInterval(stepInterval);
 setAnalysisError(err.message || 'Error de conexión con la IA.');
 } finally {
 setIsAnalyzing(false);
 }
 };

 // Submit and Schedule Post
 const handleSchedulePost = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!editedCopy.trim()) return;

 setIsScheduling(true);
 setSchedulingSuccess(false);

 try {
 const newPost: SocialPost = {
 id: `post-${Date.now()}`,
 fecha: `${scheduledDate} ${scheduledTime}`,
 plataforma: selectedPlatform,
 contenido: editedCopy,
 estado: 'aprobado',
 responsable: 'Jon'
 };

 await onAddPost(newPost);
 setSchedulingSuccess(true);
 
 // Auto-clear success state after a few seconds
 setTimeout(() => {
 setSchedulingSuccess(false);
 }, 5000);

 } catch (err) {
 console.error("Error al programar publicación:", err);
 alert("Hubo un error al guardar la publicación en el servidor local.");
 } finally {
 setIsScheduling(false);
 }
 };

 // Change active highlight in lighttable
 const handleSelectHighlight = (index: number) => {
 setSelectedHighlightIndex(index);
 // Reset physical cutting states when switching segments
 setRenderedClipUrl(null);
 setRenderedSubUrl(null);
 setSubtitleCues([]);
 setWordOffsets([]);
 setIsWhisperTranscribed(false);
 setCurrentSubtitleText('');
 setCuttingError(null);
 setClipUserNote('');
 setReanalyzeSuccessMsg(null);
 
 const clip = highlights[index];
 if (clip) {
 setEditedCopy(clip.recommendedCopy || '');
 }
 };

 // Copy text to clipboard helper
 const handleCopyToClipboard = (text: string) => {
 if (!text) return;
 navigator.clipboard.writeText(text).then(() => {
 setCopySuccess(true);
 setTimeout(() => setCopySuccess(false), 2000);
 }).catch((err) => {
 console.error("Error copying to clipboard:", err);
 });
 };

 // Crop edit adjustments (Extending or trimming from left or right)
 const handleAdjustCrop = (direction: 'start_minus' | 'start_plus' | 'end_minus' | 'end_plus') => {
 const currentClip = highlights[selectedHighlightIndex];
 if (!currentClip) return;

 const { start, end } = parseRangeTimes(currentClip.range);
 let newStart = start;
 let newEnd = end;

 if (direction === 'start_minus') {
 newStart = Math.max(0, start - 1);
 } else if (direction === 'start_plus') {
 newStart = Math.min(end - 1, start + 1);
 } else if (direction === 'end_minus') {
 newEnd = Math.max(start + 1, end - 1);
 } else if (direction === 'end_plus') {
 newEnd = end + 1;
 }

 const formatSecsToMMSS = (totalSecs: number) => {
 const mins = Math.floor(totalSecs / 60);
 const secs = totalSecs % 60;
 return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
 };

 const newRange = `${formatSecsToMMSS(newStart)}-${formatSecsToMMSS(newEnd)}`;

 // Update state
 setHighlights(prev => prev.map((clip, index) => 
 index === selectedHighlightIndex ? { ...clip, range: newRange } : clip
 ));
 setSimulatedTime(0); // reset playback timer to restart from new crop
 setYtLoopCount(c => c + 1); // trigger iframe refresh
 };

 // Move existing pipeline reels
 const moveReel = (id: string, newStage: 'draft' | 'edit' | 'ready') => {
 onUpdatePost(id, { estado: newStage === 'ready' ? 'publicado' : newStage === 'edit' ? 'aprobado' : 'borrador' });
 };

 const handleGenerateCopy = async (style: 'hype' | 'chill') => {
 setIsGenerating(true);
 try {
 const response = await apiFetch('/api/write-reels-copy', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ idea: reelIdea, style })
 });
 const data = await response.json();
 if (data.success && data.text) {
 setGeneratedCopy(data.text);
 } else {
 alert('Hubo un problema al generar el texto. Mostrando plantilla de respaldo.');
 }
 } catch (err) {
 console.error(err);
 if (style === 'hype') {
 setGeneratedCopy(`⚡️ ¡FUEGO EN EL ESCENARIO! 🔥\n\nLa locomotora balkan de Bakandeya no tiene freno: ${reelIdea}. ¡Prepárate para sudar la camiseta! 🎺🎸\n\n#bakandeya #balkanska #mestizaje #livemusic`);
 } else {
 setGeneratedCopy(`🌊 Respirando hondo, dejando fluir el ritmo... 🍀\n\nConectando ideas en el local: ${reelIdea}. Buenas energías para el camino. Paz y roots. 🕊️✨\n\n#bakandeya #reggae #rootsreggae #mestizaje`);
 }
 } finally {
 setIsGenerating(false);
 }
 };

 const handleSimulateUpload = () => {
 setUploadProgress(0);
 const interval = setInterval(() => {
 setUploadProgress(prev => {
 if (prev === null) return null;
 if (prev >= 100) {
 clearInterval(interval);
 setTimeout(() => setUploadProgress(null), 1500);
 return 100;
 }
 return prev + 10;
 });
 }, 200);
 };

 // Select dynamic display text for phone screen mock
 const phoneText = selectedPostInPhone
 ? selectedPostInPhone.contenido
 : (activeTab === 'analyzer' && highlights.length > 0
 ? editedCopy
 : generatedCopy);

 const phoneTitle = selectedPostInPhone
 ? `${selectedPostInPhone.plataforma} · ${selectedPostInPhone.responsable}`
 : (activeTab === 'analyzer' && highlights.length > 0
 ? (highlights[selectedHighlightIndex]?.title || 'Reel de Bakandeya')
 : 'Bakandeya Reels');

 const phoneDuration = selectedPostInPhone
 ? selectedPostInPhone.fecha
 : (activeTab === 'analyzer' && highlights.length > 0
 ? (highlights[selectedHighlightIndex]?.range || '0:30')
 : '0:30');

 const isStitchLight = colors.accent === 'text-indigo-600';
 const textTitle = isStitchLight ? 'text-slate-900' : 'text-neutral-100';
 const textSub = isStitchLight ? 'text-slate-500' : 'text-neutral-400';
 const textMuted = isStitchLight ? 'text-slate-400' : 'text-neutral-500';

 return (
 <div className={`space-y-6 ${isStitchLight ? 'text-slate-800' : 'text-[#e5e2e1]'} font-sans w-full max-w-full overflow-x-hidden`}>
 
 {/* Header con Sincronización en Excel */}
 <div className={`flex justify-between items-start md:items-center pb-4 mb-2 gap-4 ${isStitchLight ? '-slate-100' : '-[#99907c]/15'}`}>
       {/* HEADER / TITULO PRINCIPAL */}
      <div className="mb-2">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-zinc-100 mb-2">Medios</h1>
        <p className="text-sm font-mono text-zinc-400 uppercase tracking-widest">Analítica Social y Prensa</p>
      </div>
 <div className="flex gap-2.5 items-center flex-wrap">
 <button
 id="sync-reels-excel-btn"
 onClick={handleSyncReels}
 disabled={isSyncingReels}
 className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
 isSyncingReels
 ? 'bg-neutral-800 text-neutral-500 -neutral-700 animate-pulse'
 : isStitchLight
 ? 'bg-indigo-600 hover:bg-indigo-700 text-white -indigo-600 shadow-sm shadow-indigo-100'
 : 'bg-[#f2ca50]/10 hover:bg-[#f2ca50]/20 text-[#f2ca50] -[#f2ca50]/30 shadow-md'
 }`}
 title="Sincronizar todas las publicaciones de redes sociales en Google Sheets (Excel)"
 >
 <RefreshCw className={`w-3 h-3 ${isSyncingReels ? 'animate-spin' : ''}`} />
 {isSyncingReels ? 'Sincronizando...' : 'Actualizar en Excel'}
 </button>
 
 <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
 isStitchLight ? 'bg-indigo-50 -indigo-200 text-indigo-600' : 'bg-[#b8d6b8]/10 -[#b8d6b8]/20 text-[#b8d6b8]'
 }`}>
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" /> Auto-sync
 </span>
 </div>
 </div>

 {/* Notificaciones de Sincronización */}
 {syncSuccessMessage && (
 <div className={`p-2 px-3 rounded-lg text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 ${
 isStitchLight 
 ? 'bg-emerald-50 -emerald-200 text-emerald-800' 
 : 'bg-emerald-500/10 -emerald-500/20 text-emerald-400'
 }`}>
 <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
 <span className="flex-1 font-mono text-[10px]">{syncSuccessMessage}</span>
 <button onClick={() => setSyncSuccessMessage('')} className="text-[10px] hover:opacity-80 font-bold px-1 font-mono">×</button>
 </div>
 )}
 {syncErrorMessage && (
 <div className={`p-2 px-3 rounded-lg text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 ${
 isStitchLight 
 ? 'bg-rose-50 -rose-200 text-rose-800' 
 : 'bg-rose-500/10 -rose-500/20 text-rose-400'
 }`}>
 <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
 <span className="flex-1 font-mono text-[10px]">{syncErrorMessage}</span>
 <button onClick={() => setSyncErrorMessage('')} className="text-[10px] hover:opacity-80 font-bold px-1 font-mono">×</button>
 </div>
 )}

 {/* Dynamic Segment Tab Selector */}
 <div className={`flex pb-4 mb-2 flex-wrap gap-3 ${isStitchLight ? '-slate-100' : '-[#99907c]/15'}`}>
 <button
 id="tab-btn-pipeline"
 onClick={() => setActiveTab('pipeline')}
 className={`px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all duration-300 rounded-xl cursor-pointer ${
 activeTab === 'pipeline'
 ? isStitchLight
 ? 'bg-indigo-600 text-white font-black shadow-md'
 : 'bg-[#f2ca50] text-[#3c2f00] font-black shadow-md shadow-[#f2ca50]/10'
 : isStitchLight
 ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 -slate-200 bg-white'
 : 'text-neutral-400 hover:text-white hover:bg-[#1c1b1b]/50 -neutral-900'
 }`}
 >
 Pipeline & Redactor de Copy
 </button>
 <button
 id="tab-btn-analyzer"
 onClick={() => setActiveTab('analyzer')}
 className={`px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all duration-300 rounded-xl flex items-center gap-1.5 cursor-pointer ${
 activeTab === 'analyzer'
 ? isStitchLight
 ? 'bg-indigo-600 text-white font-black shadow-md'
 : 'bg-[#f2ca50] text-[#3c2f00] font-black shadow-md shadow-[#f2ca50]/10'
 : isStitchLight
 ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 -slate-200 bg-white'
 : 'text-neutral-400 hover:text-white hover:bg-[#1c1b1b]/50 -neutral-900'
 }`}
 >
 <Sparkles className="w-3.5 h-3.5" /> Analizador de Vídeos AI
 </button>
 <button
 id="tab-btn-metrics"
 onClick={() => setActiveTab('metrics')}
 className={`px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all duration-300 rounded-xl flex items-center gap-1.5 cursor-pointer ${
 activeTab === 'metrics'
 ? isStitchLight
 ? 'bg-indigo-600 text-white font-black shadow-md'
 : 'bg-[#f2ca50] text-[#3c2f00] font-black shadow-md shadow-[#f2ca50]/10'
 : isStitchLight
 ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 -slate-200 bg-white'
 : 'text-neutral-400 hover:text-white hover:bg-[#1c1b1b]/50 -neutral-900'
 }`}
 >
 <TrendingUp className="w-3.5 h-3.5" /> Seguidores e Impacto
 </button>
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
 
 {/* LEFT COLUMN: ACTIVE WORKSPACE TAB (8 columns) */}
 <div className="xl:col-span-8 space-y-6 flex flex-col justify-between min-w-0">
 
 {activeTab === 'pipeline' ? (
 /* TAB 1: KANBAN PIPELINE AND COPY GENERATOR */
 <div className="space-y-6">
 {/* 1. Pipeline Kanban */}
 <div className={`${colors.card} p-5 space-y-4`}>
 <div className={` pb-3 ${isStitchLight ? '-slate-100' : '-[#99907c]/15'}`}>
 <h3 className={`text-sm font-bold font-display uppercase tracking-widest ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>Pipeline de Reels y Contenido</h3>
 <p className={`text-[10px] font-mono mt-1 ${textSub}`}>
 Visualiza los vídeos grabados por la banda en la carretera y arrástralos / muévelos de etapa para coordinar la publicación.
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {/* Borradores */}
 <div className={`space-y-3 rounded-lg p-3 ${isStitchLight ? 'bg-slate-50 -slate-200' : 'bg-[#131313]/60 -neutral-900'}`}>
 <span className={`text-[10px] font-mono uppercase tracking-wider font-bold block pb-1.5 ${
 isStitchLight ? 'text-indigo-600 -slate-200/80' : 'text-[#ffb596] -neutral-800'
 }`}>Borradores ({posts.filter(r => r.estado === 'borrador').length})</span>
 <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
 {posts.filter(r => r.estado === 'borrador').map(post => (
 <div 
 key={post.id} 
 onClick={() => setSelectedPostInPhone(post)}
 className={` rounded-md p-2.5 cursor-pointer transition-all space-y-1.5 ${
 isStitchLight ? 'bg-white' : 'bg-[#1c1b1b]'
 } ${
 selectedPostInPhone?.id === post.id
 ? isStitchLight ? '-indigo-600 shadow-sm' : '-[#f2ca50]'
 : isStitchLight ? '-slate-200 hover:-indigo-300' : '-neutral-800 hover:-[#99907c]/30'
 }`}
 >
 <div className="flex justify-between items-start gap-1">
 <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
 post.plataforma === 'Instagram' ? 'bg-[#ffb596]/10 text-[#ffb596]' :
 post.plataforma === 'TikTok' ? 'bg-[#f2ca50]/10 text-[#f2ca50]' :
 'bg-neutral-800 text-neutral-300'
 }`}>
 {post.plataforma}
 </span>
 <span className="text-[8px] font-mono text-neutral-400">{post.responsable}</span>
 </div>
 <p className={`text-[11px] font-medium leading-snug font-sans line-clamp-3 ${textTitle}`}>
 {post.contenido}
 </p>
 <div className={`flex justify-between items-center pt-1 ${isStitchLight ? '-slate-100' : '-neutral-900'}`}>
 <span className="text-[8px] font-mono text-neutral-500">{post.fecha}</span>
 <button 
 id={`btn-move-aprobado-${post.id}`}
 onClick={(e) => { e.stopPropagation(); onUpdatePost(post.id, { estado: 'aprobado' }); }}
 className={`text-[8px] font-mono hover:underline cursor-pointer bg-transparent -none p-0 ${isStitchLight ? 'text-indigo-600 font-bold' : 'text-[#f2ca50]'}`}
 >
 Aprobar →
 </button>
 </div>
 </div>
 ))}
 {posts.filter(r => r.estado === 'borrador').length === 0 && (
 <p className="text-[9px] font-mono text-neutral-500 text-center py-4">No hay borradores</p>
 )}
 </div>
 </div>

 {/* En Edición / Aprobados */}
 <div className={`space-y-3 rounded-lg p-3 ${isStitchLight ? 'bg-slate-50 -slate-200' : 'bg-[#131313]/60 -neutral-900'}`}>
 <span className={`text-[10px] font-mono uppercase tracking-wider font-bold block pb-1.5 ${
 isStitchLight ? 'text-indigo-600 -slate-200/80' : 'text-[#f2ca50] -neutral-800'
 }`}>En Edición / Aprobados ({posts.filter(r => r.estado === 'aprobado').length})</span>
 <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
 {posts.filter(r => r.estado === 'aprobado').map(post => (
 <div 
 key={post.id} 
 onClick={() => setSelectedPostInPhone(post)}
 className={` rounded-md p-2.5 cursor-pointer transition-all space-y-1.5 ${
 isStitchLight ? 'bg-white' : 'bg-[#1c1b1b]'
 } ${
 selectedPostInPhone?.id === post.id
 ? isStitchLight ? '-indigo-600 shadow-sm' : '-[#f2ca50]'
 : isStitchLight ? '-slate-200 hover:-indigo-300' : '-neutral-800 hover:-[#f2ca50]/40'
 }`}
 >
 <div className="flex justify-between items-start gap-1">
 <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
 post.plataforma === 'Instagram' ? 'bg-[#ffb596]/10 text-[#ffb596]' :
 post.plataforma === 'TikTok' ? 'bg-[#f2ca50]/10 text-[#f2ca50]' :
 'bg-neutral-800 text-neutral-300'
 }`}>
 {post.plataforma}
 </span>
 <span className="text-[8px] font-mono text-neutral-400">{post.responsable}</span>
 </div>
 <p className={`text-[11px] font-medium leading-snug font-sans line-clamp-3 ${textTitle}`}>
 {post.contenido}
 </p>
 <div className={`flex justify-between items-center pt-1 ${isStitchLight ? '-slate-100' : '-neutral-900'}`}>
 <button 
 id={`btn-move-borrador-${post.id}`}
 onClick={(e) => { e.stopPropagation(); onUpdatePost(post.id, { estado: 'borrador' }); }}
 className="text-[8px] font-mono text-neutral-500 hover:underline cursor-pointer bg-transparent -none p-0"
 >
 ← Borrador
 </button>
 <button 
 id={`btn-move-publicado-${post.id}`}
 onClick={(e) => { e.stopPropagation(); onUpdatePost(post.id, { estado: 'publicado' }); }}
 className="text-[8px] font-mono text-emerald-500 hover:underline cursor-pointer font-bold bg-transparent -none p-0"
 >
 Publicar →
 </button>
 </div>
 </div>
 ))}
 {posts.filter(r => r.estado === 'aprobado').length === 0 && (
 <p className="text-[9px] font-mono text-neutral-500 text-center py-4">No hay reels en edición</p>
 )}
 </div>
 </div>

 {/* Listos / Publicados */}
 <div className={`space-y-3 rounded-lg p-3 ${isStitchLight ? 'bg-slate-50 -slate-200' : 'bg-[#131313]/60 -neutral-900'}`}>
 <span className={`text-[10px] font-mono uppercase tracking-wider text-emerald-500 font-bold block pb-1.5 ${
 isStitchLight ? '-slate-200/80' : '-neutral-800'
 }`}>Listos / Publicados ({posts.filter(r => r.estado === 'publicado').length})</span>
 <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
 {posts.filter(r => r.estado === 'publicado').map(post => (
 <div 
 key={post.id} 
 onClick={() => setSelectedPostInPhone(post)}
 className={` rounded-md p-2.5 cursor-pointer transition-all space-y-1.5 ${
 isStitchLight ? 'bg-white' : 'bg-[#1c1b1b]'
 } ${
 selectedPostInPhone?.id === post.id
 ? '-emerald-500'
 : isStitchLight ? '-slate-200 hover:-emerald-300' : '-neutral-800 hover:-emerald-500/30'
 }`}
 >
 <div className="flex justify-between items-start gap-1">
 <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
 post.plataforma === 'Instagram' ? 'bg-[#ffb596]/10 text-[#ffb596]' :
 post.plataforma === 'TikTok' ? 'bg-[#f2ca50]/10 text-[#f2ca50]' :
 'bg-neutral-800 text-neutral-300'
 }`}>
 {post.plataforma}
 </span>
 <span className="text-[8px] font-mono text-neutral-400">{post.responsable}</span>
 </div>
 <p className={`text-[11px] font-medium leading-snug font-sans line-clamp-3 ${textTitle}`}>
 {post.contenido}
 </p>
 <div className={`flex justify-between items-center pt-1 ${isStitchLight ? '-slate-100' : '-neutral-900'}`}>
 <button 
 id={`btn-move-aprobado-back-${post.id}`}
 onClick={(e) => { e.stopPropagation(); onUpdatePost(post.id, { estado: 'aprobado' }); }}
 className="text-[8px] font-mono text-neutral-500 hover:underline cursor-pointer bg-transparent -none p-0"
 >
 ← Re-editar
 </button>
 <span className="text-[8px] font-mono text-emerald-500 flex items-center gap-0.5 font-bold uppercase tracking-wider">
 <CheckCircle2 className="w-2.5 h-2.5" /> Publicado
 </span>
 </div>
 </div>
 ))}
 {posts.filter(r => r.estado === 'publicado').length === 0 && (
 <p className="text-[9px] font-mono text-neutral-500 text-center py-4">No hay publicaciones completadas</p>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* 2. Structured Soul AI Writer */}
 <div className={`${colors.card} p-5 space-y-4`}>
 <div className={` pb-3 ${isStitchLight ? '-slate-100' : '-[#99907c]/15'}`}>
 <h3 className={`text-sm font-bold font-display uppercase tracking-widest flex items-center gap-1.5 ${isStitchLight ? 'text-indigo-600' : 'text-[#ffb596]'}`}>
 <Sparkles className="w-4 h-4" /> AI Reels Writer (Redacción Estructurada)
 </h3>
 <p className={`text-[10px] font-mono mt-1 ${textSub}`}>
 Escribe la idea general del Reels. Elige una de las dos vibras sonoras identitarias de la banda para generar una copia adaptada mediante Gemini.
 </p>
 </div>

 <div className="space-y-4">
 <div className="space-y-1.5">
 <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">Idea de Contenido o Anécdota</label>
 <textarea
 id="reels-idea-input"
 rows={3}
 value={reelIdea}
 onChange={(e) => setReelIdea(e.target.value)}
 placeholder="Ej: R-violin tocando el violín a toda velocidad o elyar ensayando con el hang pan en el camerino..."
 className={`w-full rounded-lg p-3 text-xs focus:outline-none font-sans leading-relaxed ${
 isStitchLight
 ? 'bg-white -slate-200 text-slate-800 focus:-indigo-500'
 : 'bg-[#131313] -[#99907c]/20 text-[#e5e2e1] focus:outline-none focus:-[#f2ca50]/50'
 }`}
 />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
 <div className="lg:col-span-4 space-y-2.5">
 <span className="block text-[9px] uppercase font-mono text-neutral-500">Seleccionar Tonalidad AI</span>
 <button
 id="btn-reels-hype"
 onClick={() => handleGenerateCopy('hype')}
 disabled={isGenerating}
 className={`w-full py-3 font-mono font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 ${
 isStitchLight
 ? 'bg-indigo-600 text-white hover:bg-indigo-700'
 : 'bg-gradient-to-r from-[#f2ca50] to-[#ffb596] text-[#3c2f00]'
 }`}
 >
 <Flame className="w-4 h-4" /> Balkan Hype 🎺🔥
 </button>
 <button
 id="btn-reels-chill"
 onClick={() => handleGenerateCopy('chill')}
 disabled={isGenerating}
 className={`w-full py-3 font-mono font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 ${
 isStitchLight
 ? 'bg-white -emerald-200 hover:-emerald-400 text-emerald-600'
 : 'bg-[#131313] -emerald-500/30 hover:-emerald-500/50 text-emerald-400'
 }`}
 >
 <Music className="w-4 h-4" /> Reggae Chill 🌿🕊️
 </button>

 {isGenerating && (
 <div className="text-[10px] font-mono text-neutral-400 text-center animate-pulse flex items-center justify-center gap-1.5 mt-2">
 <RefreshCw className="w-3.5 h-3.5 animate-spin" />
 <span>Consultando a Gemini...</span>
 </div>
 )}
 </div>

 <div className="lg:col-span-8 space-y-1.5">
 <span className="block text-[9px] uppercase font-mono text-neutral-500">Publicación Generada (Listo para copiar)</span>
 <textarea
 id="reels-generated-output"
 rows={6}
 value={generatedCopy}
 onChange={(e) => setGeneratedCopy(e.target.value)}
 className={`w-full rounded-lg p-3 text-xs font-mono leading-relaxed focus:outline-none ${
 isStitchLight
 ? 'bg-white -slate-200 text-slate-800 focus:-indigo-500'
 : 'bg-[#131313] -[#99907c]/15 text-neutral-200 focus:-[#f2ca50]/30'
 }`}
 />
 </div>
 </div>
 </div>
 </div>
 </div>
 ) : activeTab === 'analyzer' ? (
 /* TAB 2: BRAND NEW AI VIDEO HIGHLIGHT EXTRACTOR */
 <div className="space-y-6">
 
 {/* 1. Drag & Drop & Upload Area */}
 <div className={`${colors.card} p-5 space-y-4`}>
 <div className={` pb-3 ${isStitchLight ? '-slate-100' : '-[#99907c]/15'}`}>
 <h3 className={`text-sm font-bold font-display uppercase tracking-widest flex items-center gap-1.5 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>
 <Video className={`w-4 h-4 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`} /> Extraer Highlights de Vídeos de Ensayos / Directos
 </h3>
 <p className={`text-[10px] font-mono mt-1 ${textSub}`}>
 Sube tu metraje bruto en formato vídeo o pega un enlace de YouTube. Nuestro modelo buscará ganchos acústicos, transiciones y saltos rítmicos para recortar los mejores 15-60s.
 </p>
 </div>

 {/* Selector de Origen de Vídeo */}
 <div className="flex gap-1.5 p-1 rounded-xl w-fit" style={{ borderColor: isStitchLight ? '#e2e8f0' : '#2d2d2d' }}>
 <button
 type="button"
 onClick={() => { setInputType('file'); setAnalysisError(null); }}
 className={`px-3.5 py-1.5 text-[10px] font-mono rounded-lg transition-all cursor-pointer ${
 inputType === 'file'
 ? isStitchLight ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow-sm'
 : isStitchLight ? 'text-slate-500 hover:text-slate-800' : 'text-neutral-400 hover:text-white'
 }`}
 >
 📂 Archivo de Vídeo
 </button>
 <button
 type="button"
 onClick={() => { setInputType('youtube'); setAnalysisError(null); }}
 className={`px-3.5 py-1.5 text-[10px] font-mono rounded-lg transition-all cursor-pointer ${
 inputType === 'youtube'
 ? isStitchLight ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow-sm'
 : isStitchLight ? 'text-slate-500 hover:text-slate-800' : 'text-neutral-400 hover:text-white'
 }`}
 >
 📺 Enlace de YouTube
 </button>
 </div>

 {/* Drag & Drop or YouTube Link Input */}
 {inputType === 'file' ? (
 <div
 id="video-dropzone"
 onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
 onDragLeave={() => setDragActive(false)}
 onDrop={handleFileDrop}
 onClick={() => document.getElementById('video-file-input')?.click()}
 className={` -dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
 dragActive
 ? isStitchLight ? '-indigo-600 bg-indigo-50/50 scale-[1.01]' : '-[#f2ca50] bg-[#f2ca50]/5 scale-[1.01]'
 : selectedFile
 ? '-emerald-500/40 bg-emerald-500/[0.02]'
 : isStitchLight ? '-slate-200 hover:-indigo-400 bg-slate-50' : '-[#99907c]/25 hover:-[#f2ca50]/40 bg-[#131313]/50'
 }`}
 >
 <input
 id="video-file-input"
 type="file"
 accept="video/*"
 className="hidden"
 onChange={handleFileSelect}
 />
 {selectedFile ? (
 <div className="space-y-3">
 <div className="w-12 h-12 rounded-full bg-emerald-500/10 -emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
 <CheckCircle2 className="w-6 h-6" />
 </div>
 <div>
 <p className={`text-xs font-bold ${isStitchLight ? 'text-slate-800' : 'text-neutral-100'}`}>{selectedFile.name}</p>
 <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
 </div>
 <button
 id="btn-clear-file"
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setSelectedFile(null);
 if (localVideoUrl) {
 try { URL.revokeObjectURL(localVideoUrl); } catch (err) {}
 setLocalVideoUrl(null);
 }
 setHighlights([]);
 setOptimalTime(null);
 }}
 className="text-[10px] font-mono text-rose-500 hover:underline hover:text-rose-600 bg-transparent -none p-0 cursor-pointer"
 >
 Eliminar archivo y elegir otro
 </button>
 </div>
 ) : (
 <div className="space-y-3">
 <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
 isStitchLight ? 'bg-indigo-50 -indigo-100 text-indigo-600' : 'bg-[#f2ca50]/10 -[#f2ca50]/20 text-[#f2ca50]'
 }`}>
 <Upload className="w-5 h-5" />
 </div>
 <div>
 <p className={`text-xs font-bold ${isStitchLight ? 'text-slate-700' : 'text-neutral-200'}`}>Suelta tu vídeo aquí o haz clic para buscar</p>
 <p className="text-[10px] text-neutral-500 font-mono mt-1">Soporta .mp4, .mov, .m4v (Vídeo bruto de conciertos o ensayos, máx 100MB)</p>
 </div>
 </div>
 )}
 </div>
 ) : (
 <div className={` rounded-2xl p-8 transition-all ${
 isStitchLight ? '-slate-200 bg-slate-50' : '-[#99907c]/25 bg-[#131313]/50'
 }`}>
 <div className="space-y-4 max-w-xl mx-auto text-center">
 <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
 isStitchLight ? 'bg-indigo-50 -indigo-100 text-indigo-600' : 'bg-[#f2ca50]/10 -[#f2ca50]/20 text-[#f2ca50]'
 }`}>
 <Youtube className="w-5 h-5" />
 </div>
 <div>
 <p className={`text-xs font-bold ${isStitchLight ? 'text-slate-700' : 'text-neutral-200'}`}>Introduce la URL del vídeo de YouTube</p>
 <p className="text-[10px] text-neutral-500 font-mono mt-1">Extrae highlights de cualquier vídeo público de YouTube, Shorts o directo</p>
 </div>
 <div className="relative">
 <input
 id="youtube-url-input"
 type="url"
 value={youtubeUrl}
 onChange={(e) => {
 setYoutubeUrl(e.target.value);
 if (e.target.value && !videoTopic) {
 setVideoTopic("Vídeo de YouTube de Bakandeya");
 }
 }}
 placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
 className={`w-full rounded-xl pl-3 pr-10 py-2.5 text-xs focus:outline-none font-mono ${
 isStitchLight
 ? 'bg-white -slate-200 text-slate-800 focus:-indigo-500'
 : 'bg-[#131313] -neutral-800 text-neutral-200 focus:-[#f2ca50]/50'
 }`}
 />
 {youtubeUrl && (
 <button
 type="button"
 onClick={() => {
 setYoutubeUrl('');
 setHighlights([]);
 setOptimalTime(null);
 }}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs font-mono bg-transparent -none cursor-pointer"
 >
 ×
 </button>
 )}
 </div>
 </div>
 </div>
 )}

 {/* Configurations */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1">
 <label className="block text-[9px] font-mono uppercase text-neutral-400">Contexto / Anécdota de apoyo (IA)</label>
 <input
 id="video-topic-input"
 type="text"
 value={videoTopic}
 onChange={(e) => setVideoTopic(e.target.value)}
 placeholder="Ej: Solo de violín rápido o improvisación de loops con percusión..."
 className={`w-full rounded-lg px-3 py-2 text-xs focus:outline-none font-sans ${
 isStitchLight
 ? 'bg-white -slate-200 text-slate-800 focus:-indigo-500'
 : 'bg-[#131313] -neutral-800 text-neutral-200 focus:-[#f2ca50]/50'
 }`}
 />
 </div>
 <div className="space-y-1">
 <label className="block text-[9px] font-mono uppercase text-neutral-400">Límite de Duración Deseado</label>
 <select
 id="video-duration-select"
 value={videoDuration}
 onChange={(e) => setVideoDuration(Number(e.target.value))}
 className={`w-full rounded-lg px-3 py-2 text-xs focus:outline-none ${
 isStitchLight
 ? 'bg-white -slate-200 text-slate-800 focus:-indigo-500'
 : 'bg-[#131313] -neutral-800 text-neutral-300 focus:-[#f2ca50]/50'
 }`}
 >
 <option value={15}>15 segundos (Ideal para Reels cortos / Stories)</option>
 <option value={30}>30 segundos (Súper dinámico / Recomendado)</option>
 <option value={60}>60 segundos (Explicativo completo de bases)</option>
 </select>
 </div>
 </div>

 {/* Analysis Button */}
 <div className="pt-2">
 <button
 id="btn-analyze-video"
 onClick={handleAnalyzeVideo}
 disabled={(inputType === 'file' ? !selectedFile : !youtubeUrl) || isAnalyzing}
 className={`w-full py-3.5 rounded-xl font-mono text-xs font-bold tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2 transition-all ${
 (inputType === 'file' ? selectedFile : youtubeUrl) 
 ? isStitchLight
 ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
 : 'bg-gradient-to-r from-[#f2ca50] to-[#ffb596] text-[#3c2f00] shadow-lg shadow-[#f2ca50]/10 hover:scale-[1.01]' 
 : 'bg-neutral-800 text-neutral-500 cursor-not-allowed -neutral-900'
 }`}
 >
 {isAnalyzing ? (
 <>
 <RefreshCw className={`w-4 h-4 animate-spin ${isStitchLight ? 'text-white' : 'text-[#3c2f00]'}`} />
 <span>PROCESANDO METRAJE...</span>
 </>
 ) : (
 <>
 <Sparkles className={`w-4 h-4 ${isStitchLight ? 'text-white' : 'text-[#3c2f00]'}`} />
 <span>ANALIZAR HIGHLIGHTS CON IA</span>
 </>
 )}
 </button>
 </div>

 {/* Loading indicator with detailed analytical logs */}
 {isAnalyzing && (
 <div className={`p-4 rounded-xl space-y-3 animate-pulse ${isStitchLight ? 'bg-slate-100 -slate-200' : 'bg-neutral-950/80 -neutral-900'}`}>
 <div className="flex justify-between items-center text-[10px] font-mono">
 <span className={`font-bold ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>Estado del análisis:</span>
 <span className="text-neutral-400">Paso {loadingStep + 1} de {getLoadingSteps().length}</span>
 </div>
 <p className={`text-[11px] font-mono leading-normal ${isStitchLight ? 'text-slate-700' : 'text-neutral-300'}`}>
 ⚡️ <span className={isStitchLight ? 'text-indigo-500' : 'text-[#ffb596]'}>{getLoadingSteps()[loadingStep]}</span>
 </p>
 <div className={`w-full h-1.5 rounded-full overflow-hidden ${isStitchLight ? 'bg-slate-200 -slate-300' : 'bg-[#131313] -neutral-900'}`}>
 <div 
 className={`h-full transition-all duration-500 ${isStitchLight ? 'bg-indigo-600' : 'bg-gradient-to-r from-[#f2ca50] to-[#ffb596]'}`} 
 style={{ width: `${((loadingStep + 1) / getLoadingSteps().length) * 100}%` }}
 />
 </div>
 </div>
 )}

 {analysisError && (
 <div className="p-3 bg-rose-500/10 -rose-500/20 rounded-lg text-rose-400 text-xs flex gap-2 items-center">
 <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
 <span>{analysisError}</span>
 </div>
 )}
 </div>

 {/* 2. Lighttable (Mesa de Luz con los Clips Detectados) */}
 {highlights.length > 0 && (
 <div className={`${colors.card} p-5 space-y-4`}>
 <div className={` pb-2 ${isStitchLight ? '-slate-100' : '-[#99907c]/15'}`}>
 <h3 className={`text-sm font-bold font-display uppercase tracking-widest flex items-center gap-2 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>
 <Layers className="w-4 h-4" /> Mesa de Luz de Clips Sugeridos (Highlights)
 </h3>
 <p className={`text-[10px] font-mono mt-1 ${textSub}`}>
 Hemos localizado {highlights.length} momentos de alto potencial. Haz clic en un clip para seleccionarlo, previsualizarlo y ajustar su programación.
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {highlights.map((clip, index) => {
 const isSelected = selectedHighlightIndex === index;
 return (
 <div
 id={`clip-card-${index}`}
 key={clip.id || index}
 onClick={() => handleSelectHighlight(index)}
 className={` rounded-xl p-3.5 cursor-pointer transition-all space-y-3 relative group overflow-hidden ${
 isSelected 
 ? isStitchLight
 ? '-indigo-600 bg-indigo-50/20 shadow-md'
 : '-[#f2ca50] bg-[#f2ca50]/5 shadow-lg shadow-[#f2ca50]/5' 
 : isStitchLight
 ? '-slate-200 bg-white hover:-indigo-300 hover:bg-slate-50/50'
 : '-neutral-800/80 bg-[#131313]/60 hover:-neutral-700 hover:bg-[#131313]/90'
 }`}
 >
 {/* Simulated miniature video thumbnail track design */}
 <div className={`w-full h-20 rounded-lg relative flex flex-col justify-between p-2 overflow-hidden ${
 isStitchLight ? 'bg-slate-50 -slate-200' : 'bg-neutral-950 -neutral-900'
 }`}>
 {/* Waveforms illustration background */}
 <div className="absolute inset-x-0 bottom-0 h-8 flex items-end gap-[2px] opacity-25 px-1">
 {[35, 45, 60, 20, 80, 50, 95, 30, 45, 75, 25, 40, 60, 80, 25, 50, 70, 90, 40, 20, 45, 80, 60].map((h, i) => (
 <div key={i} className={`flex-1 ${isStitchLight ? 'bg-indigo-600' : 'bg-[#f2ca50]'}`} style={{ height: `${isSelected ? h : h * 0.7}%` }} />
 ))}
 </div>
 <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded self-start z-10 ${
 isStitchLight ? 'bg-indigo-600 text-white' : 'bg-[#f2ca50] text-[#3c2f00]'
 }`}>
 {clip.range}
 </span>
 <div className="absolute inset-0 flex items-center justify-center z-0 opacity-80 group-hover:scale-105 transition-transform">
 <div className="w-8 h-8 rounded-full bg-black/40 -white/20 flex items-center justify-center text-[#f2ca50]">
 <Play className="w-3.5 h-3.5 fill-[#f2ca50] ml-0.5" />
 </div>
 </div>
 <span className="text-[8px] font-mono text-neutral-500 self-end z-10 bg-black/60 px-1 rounded truncate w-full">
 CLIP-{index + 1}.mp4
 </span>
 </div>

 <div className="space-y-1.5">
 <h4 className={`text-[11px] font-bold font-sans line-clamp-1 flex items-center gap-1 transition-colors ${
 isStitchLight ? 'text-slate-800 group-hover:text-indigo-600' : 'text-neutral-100 group-hover:text-[#f2ca50]'
 }`}>
 {clip.title}
 </h4>
 <p className={`text-[10px] font-sans leading-normal line-clamp-2 ${textSub}`}>
 {clip.description}
 </p>
 </div>

 {/* Virality score meter */}
 <div className={`space-y-1 pt-1.5 ${isStitchLight ? '-slate-100' : '-neutral-900'}`}>
 <div className="flex justify-between items-center text-[9px] font-mono text-neutral-400">
 <span className="flex items-center gap-1">
 <Flame className={`w-3 h-3 ${isStitchLight ? 'text-indigo-600' : 'text-[#ffb596]'}`} /> Virality Score:
 </span>
 <span className={`font-bold ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>{clip.virality}%</span>
 </div>
 <div className={`w-full h-1 rounded-full overflow-hidden ${isStitchLight ? 'bg-slate-100' : 'bg-neutral-950'}`}>
 <div 
 className={`h-full ${isStitchLight ? 'bg-indigo-600' : 'bg-[#f2ca50]'}`} 
 style={{ width: `${clip.virality}%` }}
 />
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* 3. Editor & Scheduler Form for Selected Highlight */}
 {highlights.length > 0 && (
 <div className={`${colors.card} p-5 space-y-4`}>
 <div className={` pb-2 ${isStitchLight ? '-slate-100' : '-[#99907c]/15'}`}>
 <h3 className={`text-sm font-bold font-display uppercase tracking-widest flex items-center gap-2 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>
 <Calendar className="w-4 h-4" /> Personalizar Publicación y Programar en Calendario
 </h3>
 <p className={`text-[10px] font-mono mt-1 ${textSub}`}>
 Edita el pie de foto (copy) propuesto por la IA y confirma la fecha recomendada de publicación para el feed de la banda.
 </p>
 </div>

 <form onSubmit={handleSchedulePost} className="space-y-4">
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
 
 {/* Left Block: Configs & copy */}
 <div className="lg:col-span-8 space-y-4">
 
 {/* Selected Clip summary header */}
 <div className={`p-3 rounded-xl flex justify-between items-center gap-3 ${
 isStitchLight ? 'bg-slate-50 -slate-200' : 'bg-neutral-950 -neutral-900'
 }`}>
 <div className="space-y-0.5 flex-1">
 <span className="text-[9px] font-mono text-neutral-400 uppercase">TÍTULO DEL CORTE (EDITABLE):</span>
 <input
 type="text"
 value={highlights[selectedHighlightIndex]?.title || ''}
 onChange={(e) => {
 const val = e.target.value;
 setHighlights(prev => prev.map((clip, idx) => 
 idx === selectedHighlightIndex ? { ...clip, title: val } : clip
 ));
 }}
 className={`w-full bg-transparent text-xs font-bold font-sans -dashed -neutral-700/60 focus:-[#f2ca50] focus:outline-none py-0.5 ${textTitle}`}
 placeholder="Escribe un título para este corte..."
 />
 </div>
 <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded shrink-0 ${
 isStitchLight 
 ? 'bg-indigo-50 -indigo-100 text-indigo-600' 
 : 'bg-[#f2ca50]/10 -[#f2ca50]/20 text-[#f2ca50]'
 }`}>
 {highlights[selectedHighlightIndex]?.range}
 </span>
 </div>

 {/* AI Re-analyzer & User Notes Panel */}
 <div className={`p-3.5 rounded-2xl space-y-3 ${
 isStitchLight ? 'bg-indigo-50/40 -indigo-100' : 'bg-neutral-900/90 -[#f2ca50]/20'
 }`}>
 <div className="flex justify-between items-center flex-wrap gap-2">
 <div className="flex items-center gap-2">
 <Sparkles className={`w-4 h-4 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`} />
 <span className={`text-xs font-mono font-bold uppercase tracking-wider ${textTitle}`}>
 Reanalizar y Refinar Fragmento con IA
 </span>
 </div>
 <button
 type="button"
 onClick={handleReanalyzeClip}
 disabled={isReanalyzingClip}
 className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 ${
 isReanalyzingClip
 ? 'bg-neutral-800 text-neutral-400 cursor-not-allowed animate-pulse'
 : isStitchLight
 ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
 : 'bg-[#f2ca50] hover:bg-[#e0b83f] text-neutral-950'
 }`}
 >
 <Sparkles className={`w-3.5 h-3.5 ${isReanalyzingClip ? 'animate-spin' : ''}`} />
 {isReanalyzingClip ? 'Reanalizando...' : 'Reanalizar Corte con IA'}
 </button>
 </div>

 <div className="space-y-1">
 <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400">
 Notas u Observaciones del Fragmento (Opcional - ej:"En este tramo toca el bajo Jon","Sólo instrumental","Presentación de la banda")
 </label>
 <input
 type="text"
 value={clipUserNote}
 onChange={(e) => setClipUserNote(e.target.value)}
 placeholder="Ej: En este tramo del 0:15 al 0:45 sólo toca el bajo Jon y la batería, no hay violín..."
 className={`w-full rounded-xl px-3 py-2 text-xs font-sans focus:outline-none ${
 isStitchLight
 ? 'bg-white -slate-200 text-slate-800 focus:-indigo-500'
 : 'bg-[#131313] -neutral-800 text-neutral-200 focus:-[#f2ca50]/50'
 }`}
 />
 </div>

 {reanalyzeSuccessMsg && (
 <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 p-2 rounded-lg -emerald-500/20">
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
 <span>{reanalyzeSuccessMsg}</span>
 </div>
 )}

 {highlights[selectedHighlightIndex]?.reason && (
 <div className={`p-2.5 rounded-xl text-[11px] font-sans leading-relaxed ${
 isStitchLight ? 'bg-white/80 -indigo-100 text-slate-600' : 'bg-black/40 -neutral-800 text-neutral-300'
 }`}>
 <span className="font-mono text-[9px] uppercase font-bold text-neutral-400 block mb-0.5">Diagnóstico IA del Fragmento:</span>
 <p>{highlights[selectedHighlightIndex]?.reason}</p>
 </div>
 )}
 </div>

 {/* Copy editor textarea */}
 <div className="space-y-1.5">
 <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">Pie de Foto (Copy Recomendado para Redes)</label>
 <textarea
 id="highlight-copy-editor"
 rows={5}
 value={editedCopy}
 onChange={(e) => setEditedCopy(e.target.value)}
 className={`w-full rounded-xl p-3 text-xs font-sans leading-relaxed focus:outline-none ${
 isStitchLight 
 ? 'bg-white -slate-200 text-slate-800 focus:-indigo-500' 
 : 'bg-[#131313] -neutral-800 text-neutral-200 focus:-[#f2ca50]/50'
 }`}
 />
 </div>

 {/* Recommendation Tips */}
 {optimalTime && (
 <div className={`p-3 rounded-xl flex gap-3 items-start text-[11px] leading-relaxed ${
 isStitchLight 
 ? 'bg-indigo-50/30 -indigo-100 text-slate-700' 
 : 'bg-[#f2ca50]/5 -[#f2ca50]/15 text-neutral-300'
 }`}>
 <Clock className={`w-4.5 h-4.5 mt-0.5 shrink-0 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`} />
 <div className="space-y-0.5">
 <span className={`font-mono text-[9px] uppercase font-bold tracking-wider ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>¿Por qué este horario?</span>
 <p className={`font-sans ${isStitchLight ? 'text-slate-600' : 'text-neutral-400'}`}>{optimalTime.reason}</p>
 </div>
 </div>
 )}
 </div>

 {/* Right Block: Platform, Date/Time & Submit */}
 <div className="lg:col-span-4 space-y-4">
 
 {/* Platform Selector */}
 <div className="space-y-1.5">
 <span className="block text-[10px] uppercase font-mono text-neutral-400">Plataforma Objetivo</span>
 <div className="grid grid-cols-2 gap-2">
 {[
 { id: 'Instagram', name: 'Instagram Reels' },
 { id: 'TikTok', name: 'TikTok Video' },
 { id: 'YouTube', name: 'YouTube Shorts' },
 { id: 'Facebook', name: 'Facebook' }
 ].map((plat) => (
 <button
 type="button"
 key={plat.id}
 onClick={() => setSelectedPlatform(plat.id as any)}
 className={`py-2 px-2 rounded-lg text-[10px] font-mono text-center transition-all cursor-pointer ${
 selectedPlatform === plat.id
 ? isStitchLight
 ? 'bg-indigo-600 -indigo-600 text-white font-black'
 : 'bg-[#f2ca50] -[#f2ca50] text-[#3c2f00] font-black'
 : isStitchLight
 ? '-slate-200 hover:-indigo-200 bg-white text-slate-500'
 : '-neutral-800 hover:-neutral-700 bg-[#131313]/60 text-neutral-400'
 }`}
 >
 {plat.name}
 </button>
 ))}
 </div>
 </div>

 {/* Interactive Scheduler Inputs */}
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1">
 <span className="block text-[10px] uppercase font-mono text-neutral-400">Fecha de envío</span>
 <input
 type="date"
 value={scheduledDate}
 onChange={(e) => setScheduledDate(e.target.value)}
 className={`w-full rounded-lg p-2.5 text-xs font-mono focus:outline-none ${
 isStitchLight 
 ? 'bg-white -slate-200 text-slate-800 focus:-indigo-500' 
 : 'bg-[#131313] -neutral-800 focus:-[#f2ca50]/50'
 }`}
 />
 </div>
 <div className="space-y-1">
 <span className="block text-[10px] uppercase font-mono text-neutral-400">Hora sugerida</span>
 <input
 type="time"
 value={scheduledTime}
 onChange={(e) => setScheduledTime(e.target.value)}
 className={`w-full rounded-lg p-2.5 text-xs font-mono focus:outline-none ${
 isStitchLight 
 ? 'bg-white -slate-200 text-slate-800 focus:-indigo-500' 
 : 'bg-[#131313] -neutral-800 focus:-[#f2ca50]/50'
 }`}
 />
 </div>
 </div>

 {/* Submit Button */}
 <div className="pt-2">
 <button
 type="submit"
 disabled={isScheduling}
 className={`w-full py-3.5 rounded-xl font-mono text-xs font-bold tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2 transition-all ${
 isScheduling
 ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
 : isStitchLight
 ? 'bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md'
 : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-black shadow-lg shadow-[#f2ca50]/15'
 }`}
 >
 {isScheduling ? (
 <>
 <RefreshCw className="w-3.5 h-3.5 animate-spin" />
 <span>PROGRAMANDO...</span>
 </>
 ) : (
 <>
 <CheckCircle2 className="w-4 h-4" />
 <span>APROBAR Y PROGRAMAR</span>
 </>
 )}
 </button>
 </div>

 {schedulingSuccess && (
 <div className="p-2.5 bg-emerald-500/10 -emerald-500/20 rounded-lg text-emerald-400 text-xs text-center font-mono animate-bounce mt-2 flex items-center justify-center gap-1.5">
 <Check className="w-3.5 h-3.5 text-emerald-400" />
 <span>¡Reel programado con éxito!</span>
 </div>
 )}
 </div>
 </div>
 </form>
 </div>
 )}

 {/* 4. Calendario de Publicaciones de la Banda List */}
 <div className={`${colors.card} p-5 space-y-4`}>
 <div className={` pb-2 flex justify-between items-center ${isStitchLight ? '-slate-100' : '-[#99907c]/15'}`}>
 <div>
 <h3 className={`text-sm font-bold font-display uppercase tracking-widest flex items-center gap-1.5 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>
 <Calendar className="w-4 h-4" /> Calendario de Publicaciones de la Banda ({posts.length})
 </h3>
 <p className={`text-[10px] font-mono mt-1 ${textSub}`}>
 Aquí puedes ver la parrilla de contenidos aprobada y programada en la base de datos de Bakandeya.
 </p>
 </div>
 <span className={`text-[8px] font-mono px-2 py-0.5 rounded uppercase ${
 isStitchLight ? '-slate-200 text-slate-400 bg-slate-50' : '-neutral-800 text-neutral-500'
 }`}>
 Live Database
 </span>
 </div>

 {posts.length === 0 ? (
 <div className="py-8 text-center text-xs text-neutral-500 font-mono">
 No hay publicaciones programadas todavía. ¡Sube un vídeo arriba y genera un clip para empezar!
 </div>
 ) : (
 <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
 {[...posts].reverse().map((post) => (
 <div 
 key={post.id} 
 className={` rounded-xl p-3 flex flex-col md:flex-row justify-between gap-3 items-stretch transition-all ${
 isStitchLight 
 ? 'bg-slate-50/50 -slate-200 hover:-indigo-300' 
 : 'bg-[#131313]/60 -neutral-900 hover:-neutral-800'
 }`}
 >
 <div className="space-y-2 flex-1">
 <div className="flex items-center gap-2 flex-wrap">
 <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
 post.plataforma === 'Instagram' ? 'bg-[#ffb596]/10 text-[#ffb596]' :
 post.plataforma === 'TikTok' ? 'bg-[#f2ca50]/10 text-[#f2ca50]' :
 'bg-neutral-800 text-neutral-300'
 }`}>
 {post.plataforma}
 </span>
 <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
 <Clock className="w-3.5 h-3.5 text-neutral-500" /> {post.fecha}
 </span>
 <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] font-bold uppercase tracking-wider">
 {post.estado}
 </span>
 </div>
 <p className={`text-xs line-clamp-3 leading-relaxed font-sans font-medium ${isStitchLight ? 'text-slate-800' : 'text-neutral-200'}`}>
 {post.contenido}
 </p>
 </div>
 
 <div className={`flex md:flex-col justify-end items-end gap-2 md: md: pt-2.5 md:pt-0 md:pl-4 shrink-0 ${
 isStitchLight ? '-slate-200' : '-neutral-900'
 }`}>
 <span className="text-[8px] font-mono text-neutral-500">Responsable: {post.responsable || 'Diego'}</span>
 <button
 id={`delete-post-${post.id}`}
 onClick={async () => {
 if (confirm('¿Seguro que deseas eliminar esta publicación del calendario de Bakandeya?')) {
 await onUpdatePost(post.id, { estado: 'borrador' }); // or we can handle direct deletion or mock update
 alert('Publicación desactivada/movida a borrador.');
 }
 }}
 className="p-1 text-neutral-600 hover:text-rose-500 transition-colors bg-transparent -none cursor-pointer"
 title="Eliminar del Calendario"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 </div>
 ) : (
 /* TAB 3: SEGUIDORES E IMPACTO PANEL */
 <ReelsMetricsView
 colors={colors}
 isStitchLight={isStitchLight}
 metrics={metrics}
 onAddMetric={onAddMetric}
 onUpdateMetric={onUpdateMetric}
 onDeleteMetric={onDeleteMetric}
 />
 )}


 </div>

 {/* RIGHT COLUMN: HIGH-FIDELITY PHONE PREVIEW MOCKUP (4 columns) */}
 <div className={`xl:col-span-4 rounded-xl p-5 flex flex-col justify-between select-none ${colors.card}`}>
 
 <div className="space-y-3">
 <div className={` pb-2 ${isStitchLight ? '-slate-100' : '-[#99907c]/15'}`}>
 <h3 className={`text-xs font-mono uppercase tracking-widest ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>Vista Previa en Redes</h3>
 <p className="text-[9px] text-neutral-500 font-mono mt-0.5">Visualiza cómo se verá la copia y el contenido en directo</p>
 </div>

 {/* Smart Phone Shell Frame */}
 <div className={`mx-auto w-[240px] h-[450px] rounded-[30px] -[6px] relative overflow-hidden flex flex-col justify-between ${
 isStitchLight ? '-slate-300 bg-white shadow-xl' : '-neutral-800 bg-[#06060a] shadow-[0_12px_40px_rgba(0,0,0,0.8)]'
 }`}>
 
 {/* Speaker & camera notch mockup */}
 <div className={`absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full z-20 flex items-center justify-center ${
 isStitchLight ? 'bg-slate-200' : 'bg-neutral-800'
 }`}>
 <span className={`w-2 h-2 rounded-full ${isStitchLight ? 'bg-slate-300' : 'bg-neutral-900'}`} />
 </div>

 {activeTab === 'metrics' ? (
 /* High fidelity Mobile Analytics Preview */
 <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 pt-10 pb-4">
 <div className="flex justify-between items-center z-10">
 <span className={`text-[9px] font-mono tracking-wider font-bold ${
 isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'
 }`}>
 KPIs AUDIENCIA
 </span>
 <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] font-bold">
 ACTIVO
 </span>
 </div>

 <div className="flex-1 flex flex-col justify-center items-center py-4 space-y-5 text-center">
 <div className="space-y-1">
 <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest block">Audiencia Social</span>
 <span className="text-3xl font-black font-display tracking-tight text-white block">
 {(() => {
 const sorted = [...metrics].sort((a,b) => a.fecha.localeCompare(b.fecha));
 const latest = sorted[sorted.length - 1];
 const total = latest ? latest.instagram + latest.tiktok + latest.youtube : 0;
 return total.toLocaleString();
 })()}
 </span>
 <span className="text-[8px] font-mono text-emerald-400 block font-bold flex items-center justify-center gap-0.5">
 <TrendingUp className="w-3 h-3 inline" /> +
 {(() => {
 const sorted = [...metrics].sort((a,b) => a.fecha.localeCompare(b.fecha));
 const latest = sorted[sorted.length - 1];
 const oldest = sorted[0];
 if (latest && oldest) {
 const diff = (latest.instagram + latest.tiktok + latest.youtube) - (oldest.instagram + oldest.tiktok + oldest.youtube);
 return diff.toLocaleString();
 }
 return"0";
 })()} desde inicio
 </span>
 </div>

 {/* Breakdown List */}
 <div className="w-full space-y-2 px-1">
 {/* Instagram */}
 <div className="flex items-center justify-between p-2 bg-neutral-900/60 rounded-xl -neutral-800">
 <div className="flex items-center gap-2">
 <span className="w-6 h-6 rounded-lg bg-pink-500/10 flex items-center justify-center">
 <Instagram className="w-3.5 h-3.5 text-pink-500" />
 </span>
 <span className="text-[9px] font-mono text-neutral-300 font-bold">Instagram</span>
 </div>
 <span className="text-[10px] font-mono text-white font-bold">
 {(() => {
 const sorted = [...metrics].sort((a,b) => a.fecha.localeCompare(b.fecha));
 const latest = sorted[sorted.length - 1];
 return latest ? latest.instagram.toLocaleString() : '0';
 })()}
 </span>
 </div>

 {/* TikTok */}
 <div className="flex items-center justify-between p-2 bg-neutral-900/60 rounded-xl -neutral-800">
 <div className="flex items-center gap-2">
 <span className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center">
 <Video className="w-3.5 h-3.5 text-cyan-400" />
 </span>
 <span className="text-[9px] font-mono text-neutral-300 font-bold">TikTok</span>
 </div>
 <span className="text-[10px] font-mono text-white font-bold">
 {(() => {
 const sorted = [...metrics].sort((a,b) => a.fecha.localeCompare(b.fecha));
 const latest = sorted[sorted.length - 1];
 return latest ? latest.tiktok.toLocaleString() : '0';
 })()}
 </span>
 </div>

 {/* YouTube */}
 <div className="flex items-center justify-between p-2 bg-neutral-900/60 rounded-xl -neutral-800">
 <div className="flex items-center gap-2">
 <span className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center">
 <Youtube className="w-3.5 h-3.5 text-red-500" />
 </span>
 <span className="text-[9px] font-mono text-neutral-300 font-bold">YouTube</span>
 </div>
 <span className="text-[10px] font-mono text-white font-bold">
 {(() => {
 const sorted = [...metrics].sort((a,b) => a.fecha.localeCompare(b.fecha));
 const latest = sorted[sorted.length - 1];
 return latest ? latest.youtube.toLocaleString() : '0';
 })()}
 </span>
 </div>
 </div>
 </div>

 <div className="z-10 text-center space-y-1">
 <span className="text-[8px] font-mono text-neutral-500 block">Sincronizado con</span>
 <span className={`text-[8px] font-mono font-bold tracking-widest uppercase block ${
 isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'
 }`}>
 Google Sheets Live
 </span>
 </div>
 </div>
 ) : (
 /* Dynamic Video Mockup Content with Analog Synth pattern as background */
 <div className="absolute inset-0 z-10 flex flex-col justify-between p-3 pt-8 pb-3 relative">
 
 {/* Background Decorative Pattern representing video overlay */}
 <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none z-0" />
 
 {/* Real Media Player Background or Fallback Wave Illustration */}
 {activeTab === 'analyzer' && inputType === 'youtube' && getYouTubeId(youtubeUrl) && !isExpandedPreview ? (
 (() => {
 const { start, end } = parseRangeTimes(phoneDuration);
 if (renderedClipUrl) {
 return (
 <div className="absolute inset-0 z-[-1] overflow-hidden bg-black">
 <video
 key={`mini-rendered-${renderedClipUrl}-${isPreviewMuted ? 'muted' : 'unmuted'}`}
 src={renderedClipUrl}
 autoPlay
 muted={isPreviewMuted}
 loop
 playsInline
 className="absolute w-full h-full object-cover opacity-90"
 onTimeUpdate={(e) => {
 const video = e.currentTarget;
 const cur = video.currentTime;
 if (subtitleCues && subtitleCues.length > 0) {
 const activeCue = subtitleCues.find(cue => cur >= cue.start && cur <= cue.end);
 setCurrentSubtitleText(activeCue ? activeCue.text : '');
 }
 }}
 >
 {renderedSubUrl && (
 <track
 src={renderedSubUrl}
 kind="subtitles"
 srcLang="es"
 label="Español"
 default
 />
 )}
 </video>

 {/* Kinetic Reels Subtitles Overlay */}
 {currentSubtitleText && (
 <div className="absolute bottom-20 left-3 right-3 z-40 bg-black/80 px-2 py-1.5 rounded-xl -[#f2ca50]/40 text-center backdrop-blur-sm shadow-xl">
 <span className="text-[10px] font-sans font-black tracking-wide text-[#f2ca50] uppercase leading-tight">
 ✨ {currentSubtitleText} ✨
 </span>
 </div>
 )}
 </div>
 );
 }

 return (
 <div className="absolute inset-0 z-[-1] overflow-hidden bg-black">
 <iframe
 key={`${getYouTubeId(youtubeUrl)}-${start}-${end}-${isPreviewMuted ? 'muted' : 'unmuted'}-${ytLoopCount}`}
 src={`https://www.youtube.com/embed/${getYouTubeId(youtubeUrl)}?start=${start}&end=${end}&autoplay=1&mute=${isPreviewMuted ? 1 : 0}&controls=0&modestbranding=1&loop=1&playlist=${getYouTubeId(youtubeUrl)}&showinfo=0&rel=0&iv_load_policy=3`}
 className="absolute w-[280%] h-full left-1/2 -translate-x-1/2 object-cover pointer-events-none opacity-80"
 allow="autoplay; encrypted-media"
 title="Highlight Clip Video Player"
 style={{ border: 0 }}
 />
 </div>
 );
 })()
 ) : activeTab === 'analyzer' && inputType === 'file' && localVideoUrl && !isExpandedPreview ? (
 <div className="absolute inset-0 z-[-1] overflow-hidden bg-black">
 <video
 key={`${localVideoUrl}-${isPreviewMuted ? 'muted' : 'unmuted'}`}
 src={localVideoUrl}
 autoPlay
 muted={isPreviewMuted}
 loop
 playsInline
 className="absolute w-full h-full object-cover opacity-80"
 onTimeUpdate={(e) => {
 const video = e.currentTarget;
 const { start, end } = parseRangeTimes(phoneDuration);
 if (end > start) {
 if (video.currentTime < start) {
 video.currentTime = start;
 }
 if (video.currentTime >= end) {
 video.currentTime = start;
 video.play().catch(() => {});
 }
 }
 }}
 onLoadedMetadata={(e) => {
 const video = e.currentTarget;
 const { start } = parseRangeTimes(phoneDuration);
 video.currentTime = start;
 }}
 />
 </div>
 ) : (
 /* Vintage Audio Wave / Synth Illustration behind */
 <div className="absolute inset-0 bg-cover bg-center opacity-35 z-[-1] flex flex-col items-center justify-center p-4">
 <div className={`w-full h-full -dashed rounded-xl flex flex-col items-center justify-center gap-3 ${
 isStitchLight ? '-indigo-100' : '-neutral-700/30'
 }`}>
 <div className="flex gap-4">
 <div className={`w-10 h-10 rounded-full -dashed flex items-center justify-center text-[8px] font-mono ${
 isStitchLight ? '-indigo-300 text-indigo-400' : '-[#f2ca50]/50 text-[#f2ca50]/70'
 }`}>VOL</div>
 <div className={`w-10 h-10 rounded-full -dashed flex items-center justify-center text-[8px] font-mono ${
 isStitchLight ? '-emerald-300 text-emerald-400' : '-[#ffb596]/50 text-[#ffb596]/70'
 }`}>SKA</div>
 </div>
 <span className={`text-[9px] font-mono uppercase tracking-widest text-center animate-pulse ${
 isStitchLight ? 'text-indigo-400' : 'text-neutral-400'
 }`}>
 {activeTab === 'analyzer' && highlights.length > 0 ? '[ HIGHLIGHT CLIP ACTIVE ]' : '[ Balkan Analog Synth ]'}
 </span>
 {phoneDuration && (
 <span className={`text-[10px] font-mono py-0.5 px-2 rounded-full font-bold ${
 isStitchLight ? 'bg-indigo-50 -indigo-100 text-indigo-600' : 'bg-[#f2ca50]/10 -[#f2ca50]/20 text-[#f2ca50]'
 }`}>
 {phoneDuration}
 </span>
 )}
 </div>
 </div>
 )}

 {/* Top Status Header */}
 <div className="flex justify-between items-center z-10">
 <span className={`text-[9px] font-mono tracking-wider font-bold ${
 isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'
 }`}>
 {activeTab === 'analyzer' ? 'AI ANALYZER REEL' : 'REELS PREVIEW'}
 </span>
 <div className="flex gap-1">
 <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
 <span className="text-[8px] font-mono text-red-400 font-bold">LIVE REC</span>
 </div>
 </div>

 {/* Floating Action Badges Column */}
 {activeTab === 'analyzer' && ((inputType === 'youtube' && getYouTubeId(youtubeUrl)) || (inputType === 'file' && localVideoUrl)) && (
 <div className="absolute top-12 right-3 z-30 flex flex-col gap-2">
 {/* Sound Toggle */}
 <button
 id="btn-toggle-sound"
 type="button"
 onClick={() => setIsPreviewMuted(!isPreviewMuted)}
 className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/60 -white/20 text-white hover:bg-black/85 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-lg select-none"
 >
 {isPreviewMuted ? (
 <>
 <VolumeX className="w-3 h-3 text-red-400 animate-pulse" />
 <span className="text-[7.5px] font-mono font-extrabold tracking-wider uppercase text-red-200">SIN SONIDO</span>
 </>
 ) : (
 <>
 <Volume2 className="w-3 h-3 text-emerald-400 animate-bounce" />
 <span className="text-[7.5px] font-mono font-extrabold tracking-wider uppercase text-emerald-200">CON SONIDO</span>
 </>
 )}
 </button>

 {/* Maximize Toggle */}
 <button
 id="btn-maximize-preview"
 type="button"
 onClick={() => setIsExpandedPreview(true)}
 className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/60 -white/20 text-white hover:bg-black/85 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-lg select-none"
 >
 <Maximize2 className="w-3 h-3 text-sky-400" />
 <span className="text-[7.5px] font-mono font-extrabold tracking-wider uppercase text-sky-200">VER GRANDE</span>
 </button>
 </div>
 )}

 {/* Play Button Overlay (hidden when playing a real video to keep the clip clean) */}
 {!(activeTab === 'analyzer' && (
 (inputType === 'youtube' && getYouTubeId(youtubeUrl)) ||
 (inputType === 'file' && localVideoUrl)
 )) && (
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
 <div className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center text-[#f2ca50] shadow-lg animate-pulse ${
 isStitchLight ? 'bg-white/40 -slate-200' : 'bg-white/10 -white/20'
 }`}>
 <Play className={`w-6 h-6 ml-0.5 ${isStitchLight ? 'fill-indigo-600 text-indigo-600' : 'fill-[#f2ca50] text-[#f2ca50]'}`} />
 </div>
 </div>
 )}

 {/* Right Side Social Action Widgets */}
 <div className="self-end flex flex-col gap-4 items-center z-10 mr-1">
 <div className="flex flex-col items-center gap-1 cursor-pointer">
 <div className="w-8 h-8 rounded-full bg-black/40 -white/10 flex items-center justify-center text-white hover:text-red-500">
 <Heart className="w-4 h-4 fill-white/10" />
 </div>
 <span className="text-[8px] font-mono text-white font-bold">2,108</span>
 </div>
 <div className="flex flex-col items-center gap-1 cursor-pointer">
 <div className="w-8 h-8 rounded-full bg-black/40 -white/10 flex items-center justify-center text-white">
 <MessageCircle className="w-4 h-4" />
 </div>
 <span className="text-[8px] font-mono text-white font-bold">48</span>
 </div>
 <div className="flex flex-col items-center gap-1 cursor-pointer">
 <div className="w-8 h-8 rounded-full bg-black/40 -white/10 flex items-center justify-center text-white">
 <Share2 className="w-4 h-4" />
 </div>
 <span className="text-[8px] font-mono text-white font-bold">186</span>
 </div>
 </div>

 {/* Bottom Video Metadata Overlays */}
 <div className="z-10 space-y-2 mt-auto">
 <div className="flex items-center gap-1.5">
 <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-mono font-bold ${
 isStitchLight ? 'bg-indigo-50 -indigo-200 text-indigo-600' : 'bg-[#f2ca50]/20 -[#f2ca50] text-[#f2ca50]'
 }`}>B</span>
 <div>
 <span className="text-[9px] font-bold text-white block">@bakandeya_reggae</span>
 <span className={`text-[7px] font-mono block ${isStitchLight ? 'text-indigo-200' : 'text-[#ffb596]'}`}>Banda Balkan-Ska Mestizo</span>
 </div>
 </div>

 {phoneTitle && (
 <h4 className="text-[10px] text-neutral-100 font-bold line-clamp-1">
 🎬 {phoneTitle}
 </h4>
 )}

 {/* Generated caption summary inside the reel overlay */}
 <p className="text-[9px] text-neutral-200 line-clamp-3 leading-normal font-sans">
 {phoneText}
 </p>

 {/* Slim, elegant progress timeline of the highlight clip */}
 {activeTab === 'analyzer' && highlights[selectedHighlightIndex] && (() => {
 const { start, end, duration } = parseRangeTimes(highlights[selectedHighlightIndex]?.range);
 if (duration > 0) {
 const pct = (simulatedTime / duration) * 100;
 return (
 <div className={`p-1.5 rounded-xl space-y-1 ${
 isStitchLight ? 'bg-white/90 -indigo-200/40 text-neutral-800' : 'bg-black/75 -white/10 text-neutral-200'
 }`}>
 <div className="flex justify-between items-center text-[7.5px] font-mono font-bold">
 <span className={isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}>⏱️ REC CORTE</span>
 <span className="font-mono">{formatTime(start + simulatedTime)} / {formatTime(end)}</span>
 </div>
 <div className="relative w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
 <div 
 className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-linear ${
 isStitchLight ? 'bg-indigo-600' : 'bg-gradient-to-r from-amber-500 to-[#f2ca50]'
 }`}
 style={{ width: `${pct}%` }}
 />
 </div>
 <div className="flex justify-between text-[6.5px] font-mono text-neutral-400">
 <span>Inicia: {formatTime(start)}</span>
 <span className="font-bold">Duración: {duration}s</span>
 <span>Termina: {formatTime(end)}</span>
 </div>
 </div>
 );
 }
 return null;
 })()}

 {/* Track label scrolling simulation */}
 <div className={`flex items-center gap-1 text-[8px] font-mono py-1 px-1.5 rounded-full max-w-[140px] truncate ${
 isStitchLight ? 'text-indigo-400 bg-white/10 -indigo-200/20' : 'text-[#f2ca50] bg-black/40 -neutral-800/50'
 }`}>
 <Music className="w-2.5 h-2.5 shrink-0" />
 <span className="animate-marquee whitespace-nowrap">Bakandeya - Balkan Brass Intro 2026</span>
 </div>
 </div>

 </div>
 )}
 </div>
 </div>

 {/* Simulated Upload Status Queue */}
 <div className={`space-y-2 pt-4 mt-4 ${isStitchLight ? '-slate-100' : '-[#99907c]/15'}`}>
 <div className="flex justify-between items-center">
 <span className="text-[9px] font-mono text-neutral-400">Canal de Emisión</span>
 <button
 id="btn-reels-upload"
 onClick={handleSimulateUpload}
 disabled={uploadProgress !== null}
 className={`text-[9px] font-mono hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40 bg-transparent -none ${
 isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'
 }`}
 >
 <Upload className="w-3 h-3" /> Subir Directo
 </button>
 </div>

 {uploadProgress !== null ? (
 <div className="space-y-1">
 <div className="flex justify-between items-center text-[8px] font-mono text-neutral-400">
 <span>Transmitiendo a APIs de Redes Sociales...</span>
 <span>{uploadProgress}%</span>
 </div>
 <div className={`w-full h-1.5 rounded-full overflow-hidden ${isStitchLight ? 'bg-slate-200 -slate-300' : 'bg-neutral-950 -neutral-900'}`}>
 <div 
 className={`h-full transition-all duration-200 ${isStitchLight ? 'bg-indigo-600' : 'bg-[#f2ca50]'}`} 
 style={{ width: `${uploadProgress}%` }}
 />
 </div>
 </div>
 ) : (
 <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500 justify-end">
 <CheckCircle2 className="w-3.5 h-3.5 text-neutral-600" />
 <span>Todo sincronizado</span>
 </div>
 )}
 </div>

 </div>

 </div>

 {/* 🎬 MODO CINE / PREVISUALIZADOR EXPANDIDO */}
 {isExpandedPreview && (
 <div 
 id="theater-mode-modal"
 onClick={() => setIsExpandedPreview(false)}
 className="fixed inset-0 z-[200] bg-neutral-950/98 backdrop-blur-md flex flex-col items-center justify-start lg:justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fade-in"
 >
 <div className="absolute inset-0 bg-gradient-to-tr from-[#ffb596]/5 via-transparent to-[#f2ca50]/5 pointer-events-none" />
 
 {/* Floating Close/Minimise button in the top right corner of the screen */}
 <button
 id="btn-close-theater-floating"
 onClick={(e) => {
 e.stopPropagation();
 setIsExpandedPreview(false);
 }}
 className="fixed top-4 right-4 z-[250] p-3 rounded-full bg-neutral-900/90 hover:bg-neutral-800 -neutral-700 text-neutral-300 hover:text-white transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center backdrop-blur-sm"
 title="Cerrar modo cine (ESC o Click fuera)"
 >
 <X className="w-6 h-6" />
 </button>

 <div 
 onClick={(e) => e.stopPropagation()}
 className="relative w-full max-w-6xl bg-neutral-900 -neutral-800 rounded-3xl shadow-2xl flex flex-col lg:flex-row h-auto lg:h-[90vh] lg:max-h-[90vh] overflow-visible lg:overflow-hidden"
 >
 
 {/* Left Column: Huge 9:16 vertical smartphone screen mockup */}
 <div className="w-full lg:w-[460px] bg-neutral-950/80 p-6 flex flex-col items-center justify-center lg: lg: -neutral-800 relative select-none shrink-0">
 <div className="absolute top-4 left-6 flex items-center gap-2">
 <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
 <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider">MODO CINE ACTIVO</span>
 </div>

 {/* Close Button for mobile, positioned in the top-right of the Left Column */}
 <button
 id="btn-close-theater-mobile"
 onClick={() => setIsExpandedPreview(false)}
 className="absolute top-3 right-4 z-50 p-2.5 rounded-full bg-neutral-800/80 hover:bg-neutral-800 -neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer lg:hidden"
 title="Cerrar modo cine"
 >
 <X className="w-5 h-5" />
 </button>

 {/* Physical phone mock wrapper */}
 <div className="relative w-full max-w-[320px] aspect-[9/16] rounded-[36px] overflow-hidden -neutral-700/80 bg-black shadow-inner shadow-black flex flex-col justify-between p-4 pt-10 pb-5">
 
 {/* Speaker Notch */}
 <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full bg-neutral-900 -neutral-800/50 z-20 flex items-center justify-center">
 <div className="w-8 h-1 rounded-full bg-neutral-700" />
 </div>

 {/* Video / Player */}
 {inputType === 'youtube' && getYouTubeId(youtubeUrl) ? (
 (() => {
 const { start, end } = parseRangeTimes(phoneDuration);
 if (renderedClipUrl) {
 return (
 <div className="absolute inset-0 z-0 overflow-hidden bg-black">
 <video
 key={`expanded-rendered-${renderedClipUrl}-${isPreviewMuted ? 'muted' : 'unmuted'}`}
 src={renderedClipUrl}
 autoPlay
 muted={isPreviewMuted}
 loop
 controls
 playsInline
 className="absolute w-full h-full object-cover"
 onTimeUpdate={(e) => {
 const video = e.currentTarget;
 const cur = video.currentTime;
 if (subtitleCues && subtitleCues.length > 0) {
 const activeCue = subtitleCues.find(cue => cur >= cue.start && cur <= cue.end);
 setCurrentSubtitleText(activeCue ? activeCue.text : '');
 }
 }}
 >
 {renderedSubUrl && (
 <track
 src={renderedSubUrl}
 kind="subtitles"
 srcLang="es"
 label="Español"
 default
 />
 )}
 </video>

 {/* Subtitles Overlay inside Cinema Phone */}
 {currentSubtitleText && (
 <div className="absolute bottom-20 left-3 right-3 z-40 bg-black/80 px-2 py-1.5 rounded-xl -[#f2ca50]/40 text-center backdrop-blur-sm shadow-xl">
 <span className="text-[10px] font-sans font-black tracking-wide text-[#f2ca50] uppercase leading-tight">
 ✨ {currentSubtitleText} ✨
 </span>
 </div>
 )}
 </div>
 );
 }

 return (
 <div className="absolute inset-0 z-0 overflow-hidden bg-black">
 <iframe
 key={`expanded-yt-${getYouTubeId(youtubeUrl)}-${start}-${end}-${isPreviewMuted ? 'muted' : 'unmuted'}-${ytLoopCount}`}
 src={`https://www.youtube.com/embed/${getYouTubeId(youtubeUrl)}?start=${start}&end=${end}&autoplay=1&mute=${isPreviewMuted ? 1 : 0}&controls=1&modestbranding=1&loop=1&playlist=${getYouTubeId(youtubeUrl)}&showinfo=0&rel=0&iv_load_policy=3`}
 className="absolute w-[280%] h-full left-1/2 -translate-x-1/2 object-cover"
 allow="autoplay; encrypted-media; picture-in-picture"
 title="Expanded Highlight Video Player"
 style={{ border: 0 }}
 />
 </div>
 );
 })()
 ) : inputType === 'file' && localVideoUrl ? (
 <div className="absolute inset-0 z-0 overflow-hidden bg-black">
 <video
 key={`expanded-file-${localVideoUrl}-${isPreviewMuted ? 'muted' : 'unmuted'}`}
 src={localVideoUrl}
 autoPlay
 muted={isPreviewMuted}
 loop
 controls
 playsInline
 className="absolute w-full h-full object-cover"
 onTimeUpdate={(e) => {
 const video = e.currentTarget;
 const { start, end } = parseRangeTimes(phoneDuration);
 if (end > start) {
 if (video.currentTime < start) {
 video.currentTime = start;
 }
 if (video.currentTime >= end) {
 video.currentTime = start;
 video.play().catch(() => {});
 }
 }
 }}
 onLoadedMetadata={(e) => {
 const video = e.currentTarget;
 const { start } = parseRangeTimes(phoneDuration);
 video.currentTime = start;
 }}
 />
 </div>
 ) : (
 <div className="absolute inset-0 z-0 bg-neutral-900 flex flex-col items-center justify-center p-4">
 <AlertCircle className="w-8 h-8 text-neutral-600 mb-2" />
 <span className="text-xs font-mono text-neutral-500">No hay vídeo cargado</span>
 </div>
 )}

 {/* Dark Gradient Overlay */}
 <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85 pointer-events-none z-10" />

 {/* Video Info Overlays inside the phone */}
 <div className="z-10 flex justify-between items-center">
 <span className="text-[8px] font-mono text-[#f2ca50] font-extrabold tracking-widest bg-black/40 py-1 px-2 rounded-full -white/5 uppercase">
 Clip #{selectedHighlightIndex + 1}
 </span>
 <div className="flex gap-1 items-center bg-black/40 py-1 px-2 rounded-full -white/5">
 <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
 <span className="text-[8px] font-mono text-red-400 font-bold">1080P HD</span>
 </div>
 </div>

 <div className="z-10 space-y-2 mt-auto text-left">
 <div className="flex items-center gap-1.5">
 <span className="w-5 h-5 rounded-full -[#f2ca50] bg-[#f2ca50]/20 flex items-center justify-center text-[8px] font-mono font-bold text-[#f2ca50]">B</span>
 <div>
 <span className="text-[9px] font-bold text-white block">@bakandeya_reggae</span>
 <span className="text-[7px] font-mono text-neutral-400 block">Banda Balkan-Ska Mestizo</span>
 </div>
 </div>

 {highlights[selectedHighlightIndex] && (
 <h4 className="text-[10px] text-neutral-100 font-bold line-clamp-1">
 🎬 {highlights[selectedHighlightIndex]?.title}
 </h4>
 )}

 <p className="text-[9px] text-neutral-200 line-clamp-3 leading-normal font-sans">
 {editedCopy || (highlights[selectedHighlightIndex]?.recommendedCopy || '')}
 </p>

 {/* Slim, elegant progress timeline of the highlight clip inside expanded modal */}
 {highlights[selectedHighlightIndex] && (() => {
 const { start, end, duration } = parseRangeTimes(highlights[selectedHighlightIndex]?.range);
 if (duration > 0) {
 const pct = (simulatedTime / duration) * 100;
 return (
 <div className="p-1.5 rounded-xl -white/10 bg-black/75 text-neutral-200 space-y-1">
 <div className="flex justify-between items-center text-[7.5px] font-mono font-bold">
 <span className="text-[#f2ca50]">⏱️ REC CORTE</span>
 <span className="font-mono">{formatTime(start + simulatedTime)} / {formatTime(end)}</span>
 </div>
 <div className="relative w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
 <div 
 className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-linear bg-gradient-to-r from-amber-500 to-[#f2ca50]"
 style={{ width: `${pct}%` }}
 />
 </div>
 <div className="flex justify-between text-[6.5px] font-mono text-neutral-400">
 <span>Inicia: {formatTime(start)}</span>
 <span className="font-bold text-[#ffb596]">Duración: {duration}s</span>
 <span>Termina: {formatTime(end)}</span>
 </div>
 </div>
 );
 }
 return null;
 })()}

 <div className="flex items-center gap-1 text-[8px] font-mono bg-black/60 text-[#f2ca50] -neutral-800/50 py-1 px-2 rounded-full max-w-[150px] truncate">
 <Music className="w-2.5 h-2.5 shrink-0" />
 <span>Bakandeya - Ensayo Original 2026</span>
 </div>
 </div>

 </div>

 {/* Sound Toggle under the phone */}
 <div className="mt-4 flex items-center gap-2">
 <button
 id="expanded-mute-btn"
 onClick={() => setIsPreviewMuted(!isPreviewMuted)}
 className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 -neutral-800 text-neutral-300 hover:text-white hover:-neutral-700 hover:bg-neutral-850 active:scale-95 transition-all cursor-pointer shadow-lg select-none text-xs font-mono font-bold"
 >
 {isPreviewMuted ? (
 <>
 <VolumeX className="w-4 h-4 text-red-400 animate-pulse" />
 <span>Activar Audio</span>
 </>
 ) : (
 <>
 <Volume2 className="w-4 h-4 text-emerald-400" />
 <span>Silenciar Audio</span>
 </>
 )}
 </button>
 </div>
 </div>

 {/* Right Column: Information, Copy Editor & Scheduler */}
 <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-visible lg:overflow-y-auto bg-neutral-900 text-left">
 
 <div className="space-y-6">
 {/* Header */}
 <div className="flex justify-between items-start">
 <div>
 <div className="flex items-center gap-2 mb-1.5">
 <span className="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-[#f2ca50]/15 text-[#f2ca50] -[#f2ca50]/30 tracking-wider">
 Highlight de Alto Impacto
 </span>
 <span className="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-sky-500/15 text-sky-400 -sky-500/20 tracking-wider">
 {highlights[selectedHighlightIndex]?.range || 'N/D'}
 </span>
 </div>
 <h2 className="text-xl md:text-2xl font-bold text-white font-sans tracking-tight">
 {highlights[selectedHighlightIndex]?.title || 'Clip sin título'}
 </h2>
 </div>
 
 {/* Close Button */}
 <button
 id="btn-close-theater"
 onClick={() => setIsExpandedPreview(false)}
 className="p-2 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 -neutral-700/50 text-neutral-400 hover:text-white transition-all cursor-pointer"
 title="Cerrar modo cine"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Virality Card & Reason */}
 <div className="p-4 rounded-2xl bg-neutral-950/50 -neutral-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div className="space-y-1">
 <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">Por qué este momento es viral</span>
 <p className="text-xs text-neutral-300 leading-relaxed max-w-xl">
 {highlights[selectedHighlightIndex]?.description || 'La IA está analizando los ganchos emocionales de este intervalo.'}
 </p>
 </div>
 
 {/* Viral Progress Gauge */}
 <div className="flex items-center gap-3 shrink-0 bg-neutral-900 p-3 rounded-xl -neutral-800">
 <div className="relative w-12 h-12 flex items-center justify-center">
 <svg className="w-full h-full transform -rotate-90">
 <circle
 cx="24"
 cy="24"
 r="20"
 stroke="currentColor"
 strokeWidth="3.5"
 className="text-neutral-800"
 fill="transparent"
 />
 <circle
 cx="24"
 cy="24"
 r="20"
 stroke="currentColor"
 strokeWidth="3.5"
 className="text-amber-500"
 fill="transparent"
 strokeDasharray={`${2 * Math.PI * 20}`}
 strokeDashoffset={`${2 * Math.PI * 20 * (1 - (highlights[selectedHighlightIndex]?.virality || 90) / 100)}`}
 />
 </svg>
 <span className="absolute text-[11px] font-mono font-extrabold text-white">
 {highlights[selectedHighlightIndex]?.virality || 95}%
 </span>
 </div>
 <div className="text-left">
 <div className="flex items-center gap-1">
 <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
 <span className="text-xs font-bold text-white">Viralidad</span>
 </div>
 <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest block font-bold">POTENCIAL MÁXIMO</span>
 </div>
 </div>
 </div>

 {/* ⏱️ PRECISION TRIM TIMELINE & ALIGNMENT ANALYZER */}
 {highlights[selectedHighlightIndex] && (() => {
 const { start, end, duration } = parseRangeTimes(highlights[selectedHighlightIndex]?.range);
 if (duration > 0) {
 const totalDuration = Math.max(120, end + 30);
 const startPct = (start / totalDuration) * 100;
 const endPct = (end / totalDuration) * 100;
 const activeWidth = endPct - startPct;
 const playheadPct = ((start + simulatedTime) / totalDuration) * 100;

 const updateCropTimes = (newStart: number, newEnd: number) => {
 const finalStart = Math.max(0, newStart);
 const finalEnd = Math.max(finalStart + 1, newEnd);
 
 const formatSecsToMMSS = (totalSecs: number) => {
 const mins = Math.floor(totalSecs / 60);
 const secs = totalSecs % 60;
 return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
 };

 const newRange = `${formatSecsToMMSS(finalStart)}-${formatSecsToMMSS(finalEnd)}`;
 
 setHighlights(prev => prev.map((clip, index) => 
 index === selectedHighlightIndex ? { ...clip, range: newRange } : clip
 ));
 setSimulatedTime(0);
 setYtLoopCount(c => c + 1);
 };

 const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
 const rect = e.currentTarget.getBoundingClientRect();
 const clickX = e.clientX - rect.left;
 const clickPct = clickX / rect.width;
 const targetSeconds = Math.round(clickPct * totalDuration);

 const distToStart = Math.abs(targetSeconds - start);
 const distToEnd = Math.abs(targetSeconds - end);

 let newStart = start;
 let newEnd = end;

 if (targetSeconds < start) {
 // Clicked left of start -> extend start to left
 newStart = targetSeconds;
 } else if (targetSeconds > end) {
 // Clicked right of end -> extend end to right
 newEnd = targetSeconds;
 } else {
 // Clicked inside -> adjust closer boundary
 if (distToStart < distToEnd) {
 newStart = Math.min(targetSeconds, end - 1);
 } else {
 newEnd = Math.max(targetSeconds, start + 1);
 }
 }
 updateCropTimes(newStart, newEnd);
 };

 return (
 <div className="p-5 rounded-2xl bg-neutral-950/60 -neutral-800/85 space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Clock className="w-4 h-4 text-[#f2ca50]" />
 <span className="text-xs font-mono font-extrabold uppercase text-neutral-300 tracking-wider">
 Línea de Tiempo Interactiva
 </span>
 </div>
 <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#f2ca50]/10 text-[#f2ca50] -[#f2ca50]/20 animate-pulse">
 REPRODUCIENDO CROP
 </span>
 </div>

 {/* Clickable interactive timeline slider track */}
 <div className="space-y-1.5">
 <div className="text-[10px] text-neutral-400 font-mono flex justify-between px-1">
 <span>00:00</span>
 <span className="text-[9px] text-[#f2ca50]/80 font-bold flex items-center gap-1">
 <span>🎛️ Arrastra los bordes</span>
 <span className="text-neutral-500">•</span>
 <span>Haz click para posicionar</span>
 </span>
 <span>{formatTime(totalDuration)}</span>
 </div>

 <div 
 id="interactive-timeline-container"
 onClick={handleTimelineClick}
 className="relative w-full h-10 bg-neutral-900 rounded-xl overflow-hidden -neutral-800 flex items-center cursor-pointer group hover:-neutral-700 transition-colors touch-none"
 title="Haz click para ajustar el inicio o fin del recorte aquí"
 >
 {/* Visual highlight segment on the timeline */}
 <div 
 className="absolute top-1 bottom-1 bg-amber-500/20 -amber-500 rounded-md flex items-center justify-between px-2 shadow-[0_0_15px_rgba(245,158,11,0.15)] group-hover:bg-amber-500/25 transition-all touch-none"
 style={{ left: `${startPct}%`, width: `${activeWidth}%` }}
 >
 {/* Left Grab Handle (Start) */}
 <div 
 className="absolute left-0 top-0 bottom-0 w-3 -ml-1.5 flex items-center justify-center cursor-ew-resize group/lhandle z-30 touch-none"
 onMouseDown={(e) => {
 e.stopPropagation();
 setDraggingBoundary('start');
 }}
 onTouchStart={(e) => {
 e.stopPropagation();
 setDraggingBoundary('start');
 }}
 title="Arrastrar para ajustar el inicio (Izquierda)"
 >
 <div className="w-1.5 h-6 bg-amber-400 group-hover/lhandle:bg-white rounded-full -neutral-950 transition-all shadow-md group-hover/lhandle:scale-y-110" />
 </div>

 <span className="text-[8px] font-mono text-amber-300 font-extrabold tracking-tight select-none pointer-events-none pl-1">START</span>
 <span className="text-[8px] font-mono text-amber-200 select-none hidden sm:inline pointer-events-none">Recorte ({duration}s)</span>
 <span className="text-[8px] font-mono text-amber-300 font-extrabold tracking-tight select-none pointer-events-none pr-1">END</span>

 {/* Right Grab Handle (End) */}
 <div 
 className="absolute right-0 top-0 bottom-0 w-3 -mr-1.5 flex items-center justify-center cursor-ew-resize group/rhandle z-30 touch-none"
 onMouseDown={(e) => {
 e.stopPropagation();
 setDraggingBoundary('end');
 }}
 onTouchStart={(e) => {
 e.stopPropagation();
 setDraggingBoundary('end');
 }}
 title="Arrastrar para ajustar el fin (Derecha)"
 >
 <div className="w-1.5 h-6 bg-amber-400 group-hover/rhandle:bg-white rounded-full -neutral-950 transition-all shadow-md group-hover/rhandle:scale-y-110" />
 </div>
 </div>

 {/* Live Playhead Indicator inside the crop segment */}
 <div 
 className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)] z-20 transition-all duration-1000 ease-linear pointer-events-none"
 style={{ left: `${playheadPct}%` }}
 >
 <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-red-500" />
 <div className="absolute top-1/2 -translate-y-1/2 left-2 bg-neutral-950 -neutral-800 rounded px-1.5 py-0.5 text-[8.5px] font-mono text-white whitespace-nowrap shadow-xl">
 {formatTime(start + simulatedTime)}
 </div>
 </div>

 {/* Background track ticks */}
 <div className="absolute inset-0 flex justify-between px-3 pointer-events-none opacity-5">
 {[...Array(20)].map((_, i) => (
 <div key={i} className="h-full w-[1px] bg-white" />
 ))}
 </div>
 </div>

 <div className="flex justify-between text-[10px] font-mono text-neutral-400 px-1">
 <span>⏱️ Inicio: <strong className="text-white font-bold">{formatTime(start)}</strong> ({start}s)</span>
 <span className="text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full font-bold">
 Duración: {duration} segundos
 </span>
 <span>⏱️ Fin: <strong className="text-white font-bold">{formatTime(end)}</strong> ({end}s)</span>
 </div>
 </div>

 {/* Controles Interactivos de Edición de Crop */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 -neutral-850">
 {/* Ajustar Inicio (Izquierda) */}
 <div className="space-y-1.5 text-left">
 <div className="flex justify-between items-center">
 <span className="text-[10.5px] font-mono text-neutral-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
 <span>⬅️ Ajustar Inicio (Izquierda)</span>
 </span>
 <span className="text-[10px] font-mono text-white font-bold bg-neutral-900 px-2 py-0.5 rounded -neutral-800">
 {formatTime(start)}
 </span>
 </div>
 <div className="flex gap-2">
 <button
 id="btn-crop-start-minus"
 type="button"
 onClick={() => handleAdjustCrop('start_minus')}
 className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 -neutral-800 hover:-neutral-700 hover:bg-neutral-850 active:scale-95 transition-all text-xs font-mono font-bold text-neutral-300 flex items-center justify-center gap-1 cursor-pointer"
 title="Mover inicio 1 segundo atrás (extender por la izquierda)"
 >
 <ChevronLeft className="w-4 h-4 text-emerald-400 shrink-0" />
 <span>-1s (Extender)</span>
 </button>
 <button
 id="btn-crop-start-plus"
 type="button"
 disabled={start >= end - 1}
 onClick={() => handleAdjustCrop('start_plus')}
 className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 -neutral-800 hover:-neutral-700 hover:bg-neutral-850 active:scale-95 transition-all text-xs font-mono font-bold text-neutral-300 flex items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
 title="Mover inicio 1 segundo adelante (recortar por la izquierda)"
 >
 <span>+1s (Recortar)</span>
 <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
 </button>
 </div>
 </div>

 {/* Ajustar Fin (Derecha) */}
 <div className="space-y-1.5 text-left">
 <div className="flex justify-between items-center">
 <span className="text-[10.5px] font-mono text-neutral-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
 <span>➡️ Ajustar Fin (Derecha)</span>
 </span>
 <span className="text-[10px] font-mono text-white font-bold bg-neutral-900 px-2 py-0.5 rounded -neutral-800">
 {formatTime(end)}
 </span>
 </div>
 <div className="flex gap-2">
 <button
 id="btn-crop-end-minus"
 type="button"
 disabled={end <= start + 1}
 onClick={() => handleAdjustCrop('end_minus')}
 className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 -neutral-800 hover:-neutral-700 hover:bg-neutral-850 active:scale-95 transition-all text-xs font-mono font-bold text-neutral-300 flex items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
 title="Mover fin 1 segundo atrás (recortar por la derecha)"
 >
 <ChevronLeft className="w-4 h-4 text-amber-500 shrink-0" />
 <span>-1s (Recortar)</span>
 </button>
 <button
 id="btn-crop-end-plus"
 type="button"
 onClick={() => handleAdjustCrop('end_plus')}
 className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 -neutral-800 hover:-neutral-700 hover:bg-neutral-850 active:scale-95 transition-all text-xs font-mono font-bold text-neutral-300 flex items-center justify-center gap-1 cursor-pointer"
 title="Mover fin 1 segundo adelante (extender por la derecha)"
 >
 <span>+1s (Extender)</span>
 <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
 </button>
 </div>
 </div>
 </div>

 {/* Extra informational feedback with nice indicators */}
 <div className="bg-neutral-900/50 p-3 rounded-xl -neutral-850 text-[11px] text-neutral-400 leading-relaxed font-sans space-y-1">
 <p>
 🚀 <strong>¿Por qué dura exactamente esto?</strong> Los primeros segundos de un video son vitales para retener al espectador. Este recorte fue calculado por el algoritmo de IA basándose en los picos de intensidad acústica y velocidad de habla de la banda, asegurando una retención óptima.
 </p>
 </div>
 </div>
 );
 }
 return null;
 })()}

 {/* ✂️ REAL PHYSICAL CUTTING & AUTOMATIC SUBTITLING SYSTEM */}
 {highlights[selectedHighlightIndex] && youtubeUrl && (
 <div className="p-5 rounded-2xl bg-neutral-950/60 -neutral-800/85 space-y-4">
 <div className="flex items-center gap-2">
 <Film className="w-4 h-4 text-emerald-400 shrink-0" />
 <span className="text-xs font-mono font-extrabold uppercase text-neutral-300 tracking-wider">
 Generador de Reel Físico y Subtítulos
 </span>
 </div>

 <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
 Corta físicamente el fragmento del vídeo de YouTube a formato vertical 9:16 para Reels/TikTok y genera la pista de subtítulos sincronizada con la voz.
 </p>

 {/* Rendering State indicators */}
 {isCuttingVideo ? (
 <div className="bg-neutral-900/80 p-4 rounded-xl -neutral-800 space-y-3 animate-pulse">
 <div className="flex items-center gap-3">
 <RefreshCw className="w-5 h-5 text-[#f2ca50] animate-spin" />
 <span className="text-xs font-mono font-extrabold text-neutral-200">
 RENDERIZANDO ARCHIVOS REALES...
 </span>
 </div>
 <p className="text-[11px] text-[#f2ca50] font-mono pl-8">
 ⚡ {cuttingProgressText}
 </p>
 <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
 <div className="h-full bg-gradient-to-r from-[#f2ca50] to-emerald-500 animate-pulse" style={{ width: '75%' }}></div>
 </div>
 </div>
 ) : renderedClipUrl ? (
 <div className="bg-emerald-950/20 p-4 rounded-xl -emerald-800/40 space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
 <span className="text-xs font-mono font-extrabold text-emerald-200 uppercase tracking-wider">
 ¡Reel Renderizado con Éxito!
 </span>
 </div>
 <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-[#10b981]/15 text-[#10b981] font-extrabold -emerald-500/30">
 LISTO (9:16)
 </span>
 </div>
 
 <p className="text-[11px] text-neutral-300">
 El vídeo recortado se ha procesado en memoria. Ahora se está reproduciendo en el simulador móvil de la izquierda.
 </p>

 {sinTranscripcionReal && (
 <div className="p-2 rounded-lg bg-amber-500/10 -amber-500/20 text-[10px] text-amber-300 font-mono flex items-center gap-2">
 <span>ℹ️ No hay subtítulos / transcripción real disponible en YouTube para este vídeo.</span>
 </div>
 )}

 <div className="flex flex-col sm:flex-row gap-2 pt-1">
 <a 
 href={renderedClipUrl} 
 download="bakandeya_reel.mp4"
 rel="noreferrer noopener"
 className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-900 -neutral-800 hover:-neutral-700 text-[11px] font-mono font-bold text-[#f2ca50] flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
 >
 <ExternalLink className="w-3.5 h-3.5" />
 <span>Descargar Clip MP4</span>
 </a>
 
 <button
 type="button"
 onClick={handleCutPhysicalVideo}
 className="flex-1 px-3 py-1.5 rounded-lg bg-[#f2ca50]/10 -[#f2ca50]/20 hover:bg-[#f2ca50]/20 text-[11px] font-mono font-bold text-[#f2ca50] flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
 >
 <RotateCcw className="w-3.5 h-3.5" />
 <span>Volver a Renderizar</span>
 </button>
 </div>
 </div>
 ) : (
 <div className="space-y-3">
 {cuttingError && (
 <div className="bg-red-950/20 p-3 rounded-xl -red-800/40 text-[10.5px] text-red-400 font-mono flex items-start gap-2">
 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
 <div className="space-y-1">
 <span className="font-bold">ERROR DE RENDERIZADO:</span>
 <p className="leading-relaxed">{cuttingError}</p>
 </div>
 </div>
 )}

 <button
 type="button"
 onClick={handleCutPhysicalVideo}
 className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-[#f2ca50] to-yellow-400 hover:brightness-105 active:scale-[0.99] font-sans font-black uppercase text-xs text-neutral-950 tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/10 transition-all duration-200"
 >
 <Sparkles className="w-4 h-4 text-neutral-950 fill-neutral-950" />
 <span>✂️ Renderizar Reel Físico + Auto-Subtítulos (9:16)</span>
 </button>
 </div>
 )}

 {/* Subtitles timing preview list */}
 {subtitleCues.length > 0 && (
 <div className="bg-neutral-900/40 p-4 rounded-xl -neutral-850 space-y-2.5">
 <div className="flex justify-between items-center -neutral-800/50 pb-1.5">
 <span className="text-[9.5px] font-mono font-extrabold uppercase text-neutral-400 tracking-wider">
 Pista de Subtítulos Generada ({subtitleCues.length} líneas)
 </span>
 <span className="text-[8px] font-mono text-emerald-400 font-bold">● AUTO-SYNCED</span>
 </div>
 <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 text-[10px] scrollbar-thin scrollbar-thumb-neutral-800">
 {subtitleCues.map((cue, idx) => (
 <div key={idx} className="flex gap-2 items-start py-0.5 -neutral-900/30 last:">
 <span className="text-[8.5px] font-mono text-[#f2ca50] font-bold bg-neutral-900 px-1.5 py-0.5 rounded shrink-0">
 {cue.start.toFixed(1)}s
 </span>
 <p className="text-neutral-300 font-sans italic leading-tight">
 "{cue.text}"
 </p>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Word-level exact offsets preview */}
 {wordOffsets.length > 0 && (
 <div className="bg-neutral-900/40 p-4 rounded-xl -neutral-850 space-y-2.5 mt-3">
 <div className="flex justify-between items-center -neutral-800/50 pb-1.5">
 <span className="text-[9.5px] font-mono font-extrabold uppercase text-neutral-400 tracking-wider flex items-center gap-1">
 <span>⚡ Offsets de Palabras Sincronizados ({wordOffsets.length})</span>
 </span>
 <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-[#10b981]/15 text-[#10b981] font-bold -emerald-500/20">
 SINCRO LOCAL
 </span>
 </div>

 <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 text-[9.5px] scrollbar-thin scrollbar-thumb-neutral-800">
 {wordOffsets.map((w, idx) => (
 <div 
 key={idx} 
 className="px-2 py-1 rounded bg-neutral-900 -neutral-800/80 flex items-center gap-1 hover:-neutral-700 hover:bg-neutral-850 transition-colors"
 title={`Exact times: ${w.start.toFixed(2)}s to ${w.end.toFixed(2)}s`}
 >
 <span className="text-neutral-200 font-sans font-medium">"{w.word}"</span>
 <span className="text-[8px] font-mono text-[#f2ca50]">
 {w.start.toFixed(2)}s
 </span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}

 {/* Copy Editor Area */}
 <div className="space-y-2">
 <div className="flex justify-between items-center">
 <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
 <span>📝 Copy de Publicación Generado</span>
 </label>
 
 <button
 id="btn-copy-text"
 type="button"
 onClick={() => handleCopyToClipboard(editedCopy || '')}
 className="text-xs font-mono text-[#f2ca50] hover:underline flex items-center gap-1 cursor-pointer bg-transparent -none py-1 px-2 rounded-lg hover:bg-neutral-800"
 >
 {copySuccess ? (
 <>
 <Check className="w-3.5 h-3.5 text-emerald-400" />
 <span className="text-emerald-400 font-bold">¡Copiado!</span>
 </>
 ) : (
 <>
 <Share2 className="w-3.5 h-3.5" />
 <span>Copiar al portapapeles</span>
 </>
 )}
 </button>
 </div>
 
 <textarea
 id="txt-expanded-copy"
 value={editedCopy}
 onChange={(e) => setEditedCopy(e.target.value)}
 rows={7}
 placeholder="Escribe el copy para tus redes sociales..."
 className="w-full text-xs font-sans bg-neutral-950 -neutral-800 rounded-xl p-4 text-neutral-200 focus:outline-none focus:-neutral-700 leading-relaxed font-normal shadow-inner"
 />
 <p className="text-[9.5px] font-mono text-neutral-500">
 * Puedes editar este texto libremente antes de programarlo. Se actualizará en tiempo real en la pantalla del simulador de la izquierda.
 </p>
 </div>

 {/* Scheduling controls inside Modal */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-neutral-950/30 -neutral-800/50">
 <div>
 <label className="block text-[9px] font-mono uppercase text-neutral-500 mb-1 font-bold">Plataforma</label>
 <select
 id="modal-platform-select"
 value={selectedPlatform}
 onChange={(e) => setSelectedPlatform(e.target.value as any)}
 className="w-full text-xs font-mono bg-neutral-900 -neutral-800 rounded-lg p-2 text-white focus:outline-none cursor-pointer"
 >
 <option value="Instagram">Instagram Reel</option>
 <option value="TikTok">TikTok Video</option>
 <option value="YouTube">YouTube Shorts</option>
 </select>
 </div>

 <div>
 <label className="block text-[9px] font-mono uppercase text-neutral-500 mb-1 font-bold">Fecha de Publicación</label>
 <input
 id="modal-date-input"
 type="date"
 value={scheduledDate}
 onChange={(e) => setScheduledDate(e.target.value)}
 className="w-full text-xs font-mono bg-neutral-900 -neutral-800 rounded-lg p-2 text-white focus:outline-none cursor-pointer"
 />
 </div>

 <div>
 <label className="block text-[9px] font-mono uppercase text-neutral-500 mb-1 font-bold">Hora Óptima Sugerida</label>
 <input
 id="modal-time-input"
 type="time"
 value={scheduledTime}
 onChange={(e) => setScheduledTime(e.target.value)}
 className="w-full text-xs font-mono bg-neutral-900 -neutral-800 rounded-lg p-2 text-white focus:outline-none cursor-pointer"
 />
 </div>
 </div>

 {optimalTime && (
 <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 px-1">
 <Check className="w-3.5 h-3.5 shrink-0 animate-bounce" />
 <span><strong>Sugerencia de la IA:</strong> Programar el {optimalTime.day} {optimalTime.date} a las {optimalTime.time} ({optimalTime.reason})</span>
 </p>
 )}

 </div>

 {/* Success / Error states and main schedule action */}
 <div className="mt-6 pt-4 -neutral-850 flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="text-left">
 {schedulingSuccess ? (
 <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-mono">
 <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
 <span>¡Clip guardado e insertado en tu agenda de redes!</span>
 </div>
 ) : (
 <span className="text-[10px] font-mono text-neutral-500">Sincronizado con Google Calendar & Sheets</span>
 )}
 </div>

 <div className="flex gap-3 w-full sm:w-auto">
 <button
 id="btn-modal-cancel"
 type="button"
 onClick={() => setIsExpandedPreview(false)}
 className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl -neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-mono font-bold transition-all cursor-pointer"
 >
 Salir de Modo Cine
 </button>

 <button
 id="btn-modal-submit-schedule"
 type="button"
 onClick={(e) => {
 handleSchedulePost(e);
 }}
 disabled={isScheduling || !editedCopy.trim()}
 className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#f2ca50] text-black hover:bg-[#ffc634] active:scale-95 transition-all cursor-pointer text-xs font-mono font-bold disabled:opacity-40"
 >
 {isScheduling ? 'Guardando...' : 'Aprobar y Programar Post'}
 </button>
 </div>
 </div>

 </div>

 </div>
 </div>
 )}

 </div>
 );
}
