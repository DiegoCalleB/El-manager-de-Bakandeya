import { getLowLatencyAudioStream } from "../utils/audioLatency";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ThemeColors, Song, Setlist, SetlistItem, Concert, Rehearsal } from '../types';
import { 
 Disc3, Music, Plus, Settings, Search, X, Edit3, Trash2, ArrowUp, ArrowDown, Copy, 
 Download, Clock, Mic, FileText, Check, Layers, ExternalLink, Printer, 
 Sparkles, Sliders, CheckCircle2, ChevronRight, HelpCircle, Eye, Headphones,
 Play, Pause, Volume2, Upload, Zap, MessageSquare, Radio, Flag,
 SkipBack, SkipForward, Repeat, Square, VolumeX, Disc, MicOff, Heart, Camera, Image, Star,
 ChevronUp, ChevronDown, ListPlus
} from 'lucide-react';
import SongStudioModal from './SongStudioModal';
import { SongChordsViewerModal } from './SongChordsViewerModal';
import { ShareModal } from './ShareModal';
import { formatSongShareText, formatSetlistShareText } from '../utils/shareUtils';
import { ConfirmDeleteModal } from './repertorio/ConfirmDeleteModal';
import { ConfirmDeleteAlbumModal, ConfirmDeleteAlbumData } from './repertorio/ConfirmDeleteAlbumModal';
import { AssignSongsToAlbumModal } from './repertorio/AssignSongsToAlbumModal';
import { AssignSetlistModal } from './repertorio/AssignSetlistModal';
import { SongModal } from './repertorio/SongModal';
import { SetlistModal } from './repertorio/SetlistModal';
import { PdfExportModal } from './repertorio/PdfExportModal';
import { FavoritosGeneralesView } from './repertorio/FavoritosGeneralesView';
import { DiscografiaView } from './repertorio/DiscografiaView';
import { EscenarioView } from './repertorio/EscenarioView';
import { AlbumCover } from "./AlbumCover";
import SpotifyPlayerBar from './SpotifyPlayerBar';
import { 
 uploadFileToServer, parseGoogleDriveAudioUrl, isGoogleDriveUrl, 
 saveSongsToLocalStorageSafely, saveSetlistsToLocalStorageSafely, resolveAudioUrl 
} from '../utils/audioStorage';

interface RepertorioSetlistsProps {
 colors: ThemeColors;
 concerts: Concert[];
 rehearsals: Rehearsal[];
 bandName?: string;
 onUpdateConcert?: (id: string, fields: Partial<Concert>) => void;
 onUpdateRehearsal?: (id: string, fields: Partial<Rehearsal>) => void;
}

export function formatSecondsToMmSs(secs: number): string {
  if (!secs || isNaN(secs) || secs < 0) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const SHOW_ITEM_TYPES: Record<string, { label: string; icon: string; bg: string; text: string; border: string }> = {
  bloque_header: { label: 'Encabezado de Bloque / Sección', icon: '⚡', bg: 'bg-[#d1b375]/20', text: 'text-[#d1b375]', border: 'border-[#f2ca50]/50' },
  presentacion: { label: 'Presentación Banda / Saludo', icon: '🎤', bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
  intro_tema: { label: 'Intro / Historia del Tema', icon: '🗣️', bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  beatbox: { label: 'Performance Beatbox / Ritmo', icon: '🥁', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  solo_performance: { label: 'Solo de Instrumento / Jam', icon: '🎸', bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  cambio_instrumento: { label: 'Cambio Instrumento / Afinación', icon: '🔧', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  chapa: { label: 'Chapa / Discurso con el Público', icon: '💬', bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  descanso: { label: 'Pausa / Intermedio / Agua', icon: '⏸️', bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700' },
  bis: { label: 'BIS / Parón Pre-Bis', icon: '💣', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
  otro: { label: 'Otro Evento del Show', icon: '📌', bg: 'bg-neutral-800', text: 'text-neutral-300', border: 'border-neutral-700' }
};

const DEFAULT_SONGS: Song[] = [
 {
 id: 'song-cm-1',
 titulo: 'Intro (Live Casa México)',
 duracion: '1:30',
 duracionSegundos: 90,
 tonalidad: 'Am',
 bpm: 120,
 afinacion: 'E Standard',
 albumDisco: 'Directo Casa México',
 estadoTema: 'listo',
 esVersionCovers: false,
 notasInternas: 'Intro del directo en Casa México'
 },
 {
 id: 'song-cm-2',
 titulo: 'Tema1 (Live Casa México)',
 duracion: '3:45',
 duracionSegundos: 225,
 tonalidad: 'Em',
 bpm: 125,
 afinacion: 'E Standard',
 albumDisco: 'Directo Casa México',
 estadoTema: 'listo',
 esVersionCovers: false
 },
 {
 id: 'song-cm-3',
 titulo: 'Reggae Rock Style',
 duracion: '4:10',
 duracionSegundos: 250,
 tonalidad: 'Dm',
 bpm: 110,
 afinacion: 'E Standard',
 albumDisco: 'Directo Casa México',
 estadoTema: 'listo',
 esVersionCovers: false
 },
 {
 id: 'song-cm-4',
 titulo: 'Ska',
 duracion: '3:20',
 duracionSegundos: 200,
 tonalidad: 'Am',
 bpm: 145,
 afinacion: 'E Standard',
 albumDisco: 'Directo Casa México',
 estadoTema: 'listo',
 esVersionCovers: false
 },
 {
 id: 'song-cm-5',
 titulo: 'Llorona',
 duracion: '4:30',
 duracionSegundos: 270,
 tonalidad: 'Am',
 bpm: 100,
 afinacion: 'E Standard',
 albumDisco: 'Directo Casa México',
 estadoTema: 'listo',
 esVersionCovers: false
 },
 {
 id: 'song-1',
 titulo: 'Brisa y Cacharros',
 duracion: '3:30',
 duracionSegundos: 210,
 tonalidad: 'Am',
 bpm: 124,
 afinacion: 'E Standard',
 albumDisco: 'Álbum Debut (2025)',
 estadoTema: 'listo',
 esVersionCovers: false,
 enlaceAcordes: 'https://drive.google.com',
 notasInternas: 'Intro con sección de vientos y solo de trompeta. Gran fuerza en estribillos.'
 },
 {
 id: 'song-2',
 titulo: 'Fuego en la Sala',
 duracion: '4:12',
 duracionSegundos: 252,
 tonalidad: 'Em',
 bpm: 138,
 afinacion: 'E Standard',
 albumDisco: 'Álbum Debut (2025)',
 estadoTema: 'listo',
 esVersionCovers: false,
 notasInternas: 'Subida progresiva al final. Tema estelar de cierre en festival.'
 },
 {
 id: 'song-3',
 titulo: 'Noches de Garaje',
 duracion: '3:45',
 duracionSegundos: 225,
 tonalidad: 'Dm',
 bpm: 115,
 afinacion: 'Drop D',
 albumDisco: 'EP Cacharros & Ritmo',
 estadoTema: 'listo',
 esVersionCovers: false,
 notasInternas: 'Afinación especial en guitarra antes de empezar.'
 },
 {
 id: 'song-4',
 titulo: 'Ska del Norte',
 duracion: '3:15',
 duracionSegundos: 195,
 tonalidad: 'A Major',
 bpm: 152,
 afinacion: 'E Standard',
 albumDisco: 'Single 2026',
 estadoTema: 'listo',
 esVersionCovers: false,
 notasInternas: 'Ritmo acelerado ska. Ideal para subir la energía a mitad del concierto.'
 },
 {
 id: 'song-5',
 titulo: 'Canto a la Sombra',
 duracion: '5:10',
 duracionSegundos: 310,
 tonalidad: 'Bm',
 bpm: 96,
 afinacion: 'E Standard',
 albumDisco: 'Álbum Debut (2025)',
 estadoTema: 'listo',
 esVersionCovers: false,
 notasInternas: 'Balada rock progresiva con solo de violín de Raúl en la sección central.'
 },
 {
 id: 'song-6',
 titulo: 'Gira Sin Fin',
 duracion: '4:05',
 duracionSegundos: 245,
 tonalidad: 'G Major',
 bpm: 128,
 afinacion: 'E Standard',
 albumDisco: 'Álbum Debut (2025)',
 estadoTema: 'listo',
 esVersionCovers: false
 },
 {
 id: 'song-7',
 titulo: 'Mánager Fantasma',
 duracion: '3:50',
 duracionSegundos: 230,
 tonalidad: 'Cm',
 bpm: 120,
 afinacion: 'E Standard',
 albumDisco: 'Inéditas / En Proceso',
 estadoTema: 'ensayando',
 esVersionCovers: false,
 notasInternas: 'Sátira sobre los bots y mánagers virtuales. Ensayando para el próximo EP.'
 },
 {
 id: 'song-8',
 titulo: 'Maldita Dulzura (Cover)',
 duracion: '3:40',
 duracionSegundos: 220,
 tonalidad: 'C Major',
 bpm: 110,
 afinacion: 'E Standard',
 albumDisco: 'Covers & Versiones',
 estadoTema: 'listo',
 esVersionCovers: true,
 notasInternas: 'Versión acelerada adaptada a vientos y ritmo ska-rock.'
 }
];

const DEFAULT_SETLISTS: Setlist[] = [
 {
 id: 'setlist-1',
 nombre: 'Festival Directo Caña 45 min',
 descripcion: 'Estructura ágil en 3 bloques (Calentamiento, Nudo y Desenlace) con beatbox y presentación',
 tipoFormato: 'festival',
 duracionTotalEstimadaMinutos: 45,
 fechaCreacion: '2026-03-01',
 fechaUltimaEdicion: '2026-08-01',
 items: [
 { id: 'i-b1', tipoItem: 'bloque_header', tituloCustom: '🔥 Bloque 1: Calentamiento & Arranque' },
 { id: 'i-1', songId: 'song-1', tipoItem: 'cancion', notaTema: 'Arrancar directo sin intro' },
 { id: 'i-2', songId: 'song-2', tipoItem: 'cancion', notaTema: 'Empalmar batería con final de Brisa' },
 { id: 'i-bbx', tipoItem: 'beatbox', tituloCustom: 'Performance Beatbox Filgue & Intro Vocal', duracionEstimadaMinutos: 2, duracionEstimadaSegundos: 120, notaTema: 'Luz cenital sobre Filgue. Batería marca el pulso.' },
 
 { id: 'i-b2', tipoItem: 'bloque_header', tituloCustom: '⚡ Bloque 2: Nudo & Clímax' },
 { id: 'i-3', songId: 'song-4', tipoItem: 'cancion', notaTema: 'Subidón ska' },
 { id: 'i-4', tipoItem: 'presentacion', tituloCustom: 'Presentación Banda & Agradecimientos', duracionEstimadaMinutos: 2, duracionEstimadaSegundos: 120, notaTema: 'Jon habla al público y presenta a los vientos' },
 { id: 'i-5', songId: 'song-3', tipoItem: 'cancion', notaTema: 'Cambio de guitarra a Drop D' },
 
 { id: 'i-b3', tipoItem: 'bloque_header', tituloCustom: '💣 Bloque 3: Desenlace & BIS Final' },
 { id: 'i-6', songId: 'song-6', tipoItem: 'cancion', notaTema: 'Estribillo con coros del público' },
 { id: 'i-7', tipoItem: 'bis', tituloCustom: 'BIS / Cierre de Festival', duracionEstimadaMinutos: 1, duracionEstimadaSegundos: 60, notaTema: 'Salida rápida de escenario y vuelta para bis' },
 { id: 'i-8', songId: 'song-5', tipoItem: 'cancion', notaTema: 'Solo final de violín extendido' }
 ]
 },
 {
 id: 'setlist-2',
 nombre: 'Concierto Sala Larga 75 min',
 descripcion: 'Setlist completo con bloque acústico, solos e intros explicativas',
 tipoFormato: 'sala_larga',
 duracionTotalEstimadaMinutos: 75,
 fechaCreacion: '2026-04-10',
 fechaUltimaEdicion: '2026-07-20',
 items: [
 { id: 'i-20', tipoItem: 'bloque_header', tituloCustom: '🔥 Bloque 1: Bienvenida & Potencia' },
 { id: 'i-21', songId: 'song-1', tipoItem: 'cancion' },
 { id: 'i-22', songId: 'song-6', tipoItem: 'cancion' },
 { id: 'i-intro', tipoItem: 'intro_tema', tituloCustom: 'Historia / Intro a Noches de Garaje', duracionEstimadaMinutos: 1, duracionEstimadaSegundos: 60, notaTema: 'Diego explica el origen de la canción' },
 { id: 'i-23', songId: 'song-3', tipoItem: 'cancion' },
 
 { id: 'i-23b', tipoItem: 'bloque_header', tituloCustom: '🎸 Bloque 2: Acústico & Covers' },
 { id: 'i-24', songId: 'song-8', tipoItem: 'cancion', notaTema: 'Cover festivo' },
 { id: 'i-25', tipoItem: 'chapa', tituloCustom: 'Chapa Merch & Agradecimientos a la Sala', duracionEstimadaMinutos: 3, duracionEstimadaSegundos: 180 },
 { id: 'i-26', songId: 'song-7', tipoItem: 'cancion', notaTema: 'Tema nuevo en prueba' },
 
 { id: 'i-26b', tipoItem: 'bloque_header', tituloCustom: '⚡ Bloque 3: Desenlace & Traca' },
 { id: 'i-27', songId: 'song-5', tipoItem: 'cancion' },
 { id: 'i-28', songId: 'song-4', tipoItem: 'cancion' },
 { id: 'i-29', songId: 'song-2', tipoItem: 'cancion' }
 ]
 }
];

export default function RepertorioSetlists({
 colors,
 concerts,
 rehearsals,
 bandName,
 onUpdateConcert,
 onUpdateRehearsal
}: RepertorioSetlistsProps) {
 const isStitchLight = colors.name?.toLowerCase().includes('light') || colors.bg.includes('f8fafc') || colors.bg.includes('white') || colors.bg.includes('slate-50') || false;
 const bName = bandName || 'Tu Banda';

 // Navigation tab inside module
  const [showPdfPreview, setShowPdfPreview] = useState(false);
 const [activeTab, setActiveTab] = useState<'catalogo' | 'setlists' | 'escenario' | 'configuracion' | 'discografia'>('setlists');

 // Songs Repertoire State
 const [songs, setSongs] = useState<Song[]>(() => {
 const token = localStorage.getItem('bakandeya_token');
 try {
 const saved = localStorage.getItem('bakandeya_songs_catalog');
 if (saved) return JSON.parse(saved);
 return token ? [] : DEFAULT_SONGS;
 } catch {
 return token ? [] : DEFAULT_SONGS;
 }
 });

 // Setlists State
 const [setlists, setSetlists] = useState<Setlist[]>(() => {
 const token = localStorage.getItem('bakandeya_token');
 try {
 const saved = localStorage.getItem('bakandeya_setlists_data');
 if (saved) return JSON.parse(saved);
 return token ? [] : DEFAULT_SETLISTS;
 } catch {
 return token ? [] : DEFAULT_SETLISTS;
 }
 });

 // Selected Active Setlist ID
 const [activeSetlistId, setActiveSetlistId] = useState<string>(() => {
 return setlists[0]?.id || '';
 });

 const activeSetlist = useMemo(() => setlists.find(s => s.id === activeSetlistId) || setlists[0] || null, [setlists, activeSetlistId]);

 const [shareModalData, setShareModalData] = useState<{
   isOpen: boolean;
   title: string;
   subtitle?: string;
   text: string;
   itemType: 'song' | 'setlist';
 }>({
   isOpen: false,
   title: '',
   text: '',
   itemType: 'setlist'
 });

 const handleShareSetlist = (setlist: Setlist) => {
   const songsMap: Record<string, Song> = Object.fromEntries(songs.map(s => [s.id, s]));
   setShareModalData({
     isOpen: true,
     title: setlist.nombre,
     subtitle: `Repertorio (${setlist.items.length} elementos) para WhatsApp`,
     text: formatSetlistShareText(setlist, songsMap, bName),
     itemType: 'setlist'
   });
 };

 const handleShareSong = (song: Song) => {
   setShareModalData({
     isOpen: true,
     title: song.titulo,
     subtitle: 'Compartir canción por WhatsApp',
     text: formatSongShareText(song, { includeChords: true, includeGuide: true }),
     itemType: 'song'
   });
 };

 // Filter States for Catalog
  const [groupByAlbum, setGroupByAlbum] = useState(false);
 const [catalogSearch, setCatalogSearch] = useState('');
 const [catalogAlbumFilter, setCatalogAlbumFilter] = useState<string>('todos');
 const [catalogStatusFilter, setCatalogStatusFilter] = useState<string>('todos');

 // Song Modal State
 const [showSongModal, setShowSongModal] = useState(false);
 const [editingSong, setEditingSong] = useState<Song | null>(null);

 // Studio Ideas Modal State
 const [activeStudioSong, setActiveStudioSong] = useState<Song | null>(null);

 // Chords Viewer Modal State
 const [activeChordsSong, setActiveChordsSong] = useState<Song | null>(null);

 // Spotify Music Player State
 const [activePlayerSong, setActivePlayerSong] = useState<Song | null>(null);
 const [playerAutoPlay, setPlayerAutoPlay] = useState<boolean>(false);
 const [playSignal, setPlaySignal] = useState<number>(0);
 const [isPlayerPlaying, setIsPlayerPlaying] = useState<boolean>(false);

 const handleSelectPlayerSong = (song: Song | null, autoPlay = false) => {
   if (!song) {
     setActivePlayerSong(null);
     setPlayerAutoPlay(false);
     setIsPlayerPlaying(false);
     return;
   }

   if (activePlayerSong?.id === song.id) {
     if (autoPlay) {
       if (isPlayerPlaying) {
         setPlayerAutoPlay(false);
         setIsPlayerPlaying(false);
       } else {
         setPlayerAutoPlay(true);
         setPlaySignal(Date.now());
       }
     } else {
       setPlayerAutoPlay(false);
     }
   } else {
     setActivePlayerSong(song);
     setPlayerAutoPlay(autoPlay);
     if (autoPlay) {
       setPlaySignal(Date.now());
     }
   }
 };

 // Deletion Confirmation Modal State
 const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
 title: string;
 description: string;
 onConfirm: () => void;
 } | null>(null);

 const [deleteAlbumData, setDeleteAlbumData] = useState<ConfirmDeleteAlbumData | null>(null);
 const [assignSongsModalData, setAssignSongsModalData] = useState<{ isOpen: boolean; albumName: string } | null>(null);
 const [setlistModalData, setSetlistModalData] = useState<{ isOpen: boolean; setlistToEdit: Setlist | null } | null>(null);
 const [defaultAlbumForNewSong, setDefaultAlbumForNewSong] = useState<string>('');

 const sortedSongsByAlbumAndOrder = useMemo(() => {
   return [...songs].sort((a, b) => {
     const albumA = a.albumDisco || a.album || 'Z_SinDisco';
     const albumB = b.albumDisco || b.album || 'Z_SinDisco';
     if (albumA !== albumB) {
       return albumA.localeCompare(albumB);
     }
     const orderA = typeof a.ordenAlbum === 'number' ? a.ordenAlbum : 999;
     const orderB = typeof b.ordenAlbum === 'number' ? b.ordenAlbum : 999;
     if (orderA !== orderB) {
       return orderA - orderB;
     }
     return a.titulo.localeCompare(b.titulo);
   });
 }, [songs]);

 const handleUpdateSongFromChords = (updatedSong: Song) => {
 const updatedList = songs.map(s => s.id === updatedSong.id ? updatedSong : s);
 setSongs(updatedList);
 saveSongsToLocalStorageSafely(updatedList);
 setActiveChordsSong(updatedSong);
 if (activeStudioSong?.id === updatedSong.id) {
 setActiveStudioSong(updatedSong);
 }
 if (activePlayerSong?.id === updatedSong.id) {
 setActivePlayerSong(updatedSong);
 }
 };

 const handleUpdateSongFromStudio = (updatedSong: Song) => {
 const updatedList = songs.map(s => s.id === updatedSong.id ? updatedSong : s);
 setSongs(updatedList);
 saveSongsToLocalStorageSafely(updatedList);
 setActiveStudioSong(updatedSong);
 if (activePlayerSong?.id === updatedSong.id) {
 setActivePlayerSong(updatedSong);
 }
 fetch("/api/songs/" + updatedSong.id, {
 method: "PUT",
 headers: getHeaders(),
 body: JSON.stringify(updatedSong)
 }).catch(err => console.error("Error updating song on server:", err));
 };

 // Setlist Assign Modal State
 const [assigningSetlist, setAssigningSetlist] = useState<Setlist | null>(null);
 const [selectedConcertToAssign, setSelectedConcertToAssign] = useState<string>('');

 // Show Event / Interludio Modal State & Mic Recorder
 const [showShowItemModal, setShowShowItemModal] = useState(false);
 const [editingShowItem, setEditingShowItem] = useState<SetlistItem | null>(null);
 const [showItemAudioUrl, setShowItemAudioUrl] = useState<string>('');
 const [isRecordingShowItem, setIsRecordingShowItem] = useState<boolean>(false);
 const [recordingShowItemSecs, setRecordingShowItemSecs] = useState<number>(0);
 const showItemMediaRecorderRef = useRef<MediaRecorder | null>(null);
 const showItemChunksRef = useRef<Blob[]>([]);
 const showItemTimerRef = useRef<any>(null);

 // Stage Mode Concert Player State (Modo Escenario)
 const [stagePlayingIndex, setStagePlayingIndex] = useState<number | null>(null);
 const [stageIsPlaying, setStageIsPlaying] = useState<boolean>(false);
 const [stageAutoplayNext, setStageAutoplayNext] = useState<boolean>(true);
 const [stageCurrentTime, setStageCurrentTime] = useState<number>(0);
 const [stageItemDuration, setStageItemDuration] = useState<number>(210);
 const [stageResolvedUrl, setStageResolvedUrl] = useState<string>('');
 const stageAudioRef = useRef<HTMLAudioElement | null>(null);
 const stageSynthIntervalRef = useRef<any>(null);
 const stageAudioCtxRef = useRef<AudioContext | null>(null);

 const toggleFavoriteSong = (songId: string) => {
 setSongs(prevSongs => {
 const target = prevSongs.find(s => s.id === songId);
 const updated = prevSongs.map(s => s.id === songId ? { ...s, favoritoGeneral: !s.favoritoGeneral } : s);
 saveSongsToLocalStorageSafely(updated);
 if (target) {
 const updatedSong = { ...target, favoritoGeneral: !target.favoritoGeneral };
 fetch("/api/songs/" + songId, {
 method: "PUT",
 headers: getHeaders(),
 body: JSON.stringify(updatedSong)
 }).catch(err => console.error("Error updating favorite on server:", err));
 }
 return updated;
 });
 };

 // Save changes to localStorage and Backend API
 const getHeaders = () => {
 const token = localStorage.getItem('bakandeya_token');
 return {
 'Content-Type': 'application/json',
 ...(token ? { 'Authorization': `Bearer ${token}` } : {})
 };
 };

 useEffect(() => {
 const fetchRepertorio = async () => {
 try {
 const [resSongs, resSetlists] = await Promise.all([
 fetch('/api/songs', { headers: getHeaders() }),
 fetch('/api/setlists', { headers: getHeaders() })
 ]);

 if (resSongs.ok) {
 const dataS = await resSongs.json();
 if (dataS.songs && Array.isArray(dataS.songs)) {
 setSongs(dataS.songs);
 }
 }

 if (resSetlists.ok) {
 const dataSt = await resSetlists.json();
 if (dataSt.setlists && Array.isArray(dataSt.setlists)) {
 setSetlists(dataSt.setlists);
 }
 }
 } catch (err) {
 console.warn('Unable to load repertorio from server API, using cached state:', err);
 }
 };

 fetchRepertorio();
 }, []);

 useEffect(() => {
 saveSongsToLocalStorageSafely(songs);
 }, [songs]);

 useEffect(() => {
 saveSetlistsToLocalStorageSafely(setlists);
 }, [setlists]);

 // Effect when active playing index changes in Stage Mode (Modo Escenario)
 useEffect(() => {
 if (stagePlayingIndex === null || !activeSetlist || !activeSetlist.items[stagePlayingIndex]) {
 setStageResolvedUrl('');
 setStageCurrentTime(0);
 return;
 }

 const item = activeSetlist.items[stagePlayingIndex];
 setStageCurrentTime(0);

 let rawUrl = '';
 let durationSec = 180;

 if (item.tipoItem === 'cancion' && item.songId) {
 const song = songs.find(s => s.id === item.songId);
 if (song) {
 rawUrl = song.audioPrincipalUrl || (song.audioIdeas && song.audioIdeas[0]?.audioUrl) || (song as any).audioUrl || '';
 durationSec = song.duracionSegundos || parseMmSsToSeconds(song.duracion) || 210;
 }
 } else {
 rawUrl = item.audioUrl || '';
 durationSec = item.duracionEstimadaSegundos ?? ((item.duracionEstimadaMinutos || 2) * 60);
 }

 setStageItemDuration(durationSec > 0 ? durationSec : 120);

 if (rawUrl) {
 resolveAudioUrl(rawUrl).then(resolved => {
 setStageResolvedUrl(resolved);
 if (stageAudioRef.current) {
 stageAudioRef.current.src = resolved;
 if (stageIsPlaying) {
 stageAudioRef.current.play().catch(console.warn);
 }
 }
 }).catch(() => setStageResolvedUrl(''));
 } else {
 setStageResolvedUrl('');
 }
 }, [stagePlayingIndex, activeSetlist, songs]);

 // Synthetic timer when no real audio file exists in Stage Mode
 useEffect(() => {
 if (stageIsPlaying && !stageResolvedUrl && stagePlayingIndex !== null && activeSetlist) {
 stageSynthIntervalRef.current = setInterval(() => {
 setStageCurrentTime(prev => {
 const next = prev + 1;
 if (next >= stageItemDuration) {
 // Current track / speech finished -> Auto move to next item if autoplay enabled
 if (stageAutoplayNext && stagePlayingIndex < activeSetlist.items.length - 1) {
 setStagePlayingIndex(stagePlayingIndex + 1);
 } else {
 setStageIsPlaying(false);
 setStagePlayingIndex(null);
 }
 return 0;
 }
 return next;
 });

 // Subtle beat tone for simulation
 try {
 if (!stageAudioCtxRef.current) {
 stageAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
 }
 if (stageAudioCtxRef.current.state === 'suspended') {
 stageAudioCtxRef.current.resume();
 }
 const osc = stageAudioCtxRef.current.createOscillator();
 const gain = stageAudioCtxRef.current.createGain();
 osc.type = 'triangle';
 osc.frequency.setValueAtTime(520, stageAudioCtxRef.current.currentTime);
 gain.gain.setValueAtTime(0.02, stageAudioCtxRef.current.currentTime);
 gain.gain.exponentialRampToValueAtTime(0.001, stageAudioCtxRef.current.currentTime + 0.06);
 osc.connect(gain);
 gain.connect(stageAudioCtxRef.current.destination);
 osc.start();
 osc.stop(stageAudioCtxRef.current.currentTime + 0.06);
 } catch {}
 }, 1000);
 } else {
 if (stageSynthIntervalRef.current) clearInterval(stageSynthIntervalRef.current);
 }

 return () => {
 if (stageSynthIntervalRef.current) clearInterval(stageSynthIntervalRef.current);
 };
 }, [stageIsPlaying, stageResolvedUrl, stagePlayingIndex, stageItemDuration, stageAutoplayNext, activeSetlist]);

 // Handlers for Stage Mode Concert Player Controls
 const toggleStagePlayPause = () => {
 if (!activeSetlist || activeSetlist.items.length === 0) return;

 if (stagePlayingIndex === null) {
 setStagePlayingIndex(0);
 setStageIsPlaying(true);
 return;
 }

 if (stageResolvedUrl && stageAudioRef.current) {
 if (stageIsPlaying) {
 stageAudioRef.current.pause();
 setStageIsPlaying(false);
 } else {
 stageAudioRef.current.play().then(() => setStageIsPlaying(true)).catch(console.error);
 }
 } else {
 setStageIsPlaying(!stageIsPlaying);
 }
 };

 const handleStageNext = () => {
 if (!activeSetlist) return;
 if (stagePlayingIndex === null) {
 setStagePlayingIndex(0);
 setStageIsPlaying(true);
 } else if (stagePlayingIndex < activeSetlist.items.length - 1) {
 setStagePlayingIndex(stagePlayingIndex + 1);
 setStageIsPlaying(true);
 }
 };

 const handleStagePrev = () => {
 if (!activeSetlist) return;
 if (stagePlayingIndex === null) {
 setStagePlayingIndex(0);
 setStageIsPlaying(true);
 } else if (stagePlayingIndex > 0) {
 setStagePlayingIndex(stagePlayingIndex - 1);
 setStageIsPlaying(true);
 }
 };

 const handleStageSeek = (newTime: number) => {
 setStageCurrentTime(newTime);
 if (stageAudioRef.current && stageResolvedUrl) {
 stageAudioRef.current.currentTime = newTime;
 }
 };

 const handleStageAudioEnded = () => {
 if (stageAutoplayNext && activeSetlist && stagePlayingIndex !== null && stagePlayingIndex < activeSetlist.items.length - 1) {
 setStagePlayingIndex(stagePlayingIndex + 1);
 } else {
 setStageIsPlaying(false);
 setStagePlayingIndex(null);
 }
 };

 // Microphone recording for Show Items (Presentaciones/Chapas)
 const handleStartRecordingShowItem = async () => {
 try {
 const stream = await getLowLatencyAudioStream();
 const mediaRecorder = new MediaRecorder(stream);
 showItemMediaRecorderRef.current = mediaRecorder;
 showItemChunksRef.current = [];

 mediaRecorder.ondataavailable = (e) => {
 if (e.data.size > 0) {
 showItemChunksRef.current.push(e.data);
 }
 };

 mediaRecorder.onstop = async () => {
 const audioBlob = new Blob(showItemChunksRef.current, { type: 'audio/webm' });
 const file = new File([audioBlob], `recording-show-${Date.now()}.webm`, { type: 'audio/webm' });
 try {
 const serverUrl = await uploadFileToServer(file);
 setShowItemAudioUrl(serverUrl);
 } catch (err) {
 console.error('Error uploading show item recording to server disk:', err);
 }
 stream.getTracks().forEach(track => track.stop());
 };

 mediaRecorder.start(100);
 setIsRecordingShowItem(true);
 setRecordingShowItemSecs(0);

 showItemTimerRef.current = setInterval(() => {
 setRecordingShowItemSecs(s => s + 1);
 }, 1000);
 } catch (err) {
 console.error('Microphone access error:', err);
 alert('No se pudo acceder al micrófono. Por favor, aprueba los permisos de audio en tu navegador.');
 }
 };

 const handleStopRecordingShowItem = () => {
 if (showItemMediaRecorderRef.current && isRecordingShowItem) {
 showItemMediaRecorderRef.current.stop();
 setIsRecordingShowItem(false);
 if (showItemTimerRef.current) {
 clearInterval(showItemTimerRef.current);
 }
 }
 };

 const handleShowItemAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 try {
 const base64 = await uploadFileToServer(file);
 setShowItemAudioUrl(base64);

 const audioObj = new Audio(base64);
 audioObj.onloadedmetadata = () => {
 if (audioObj.duration && !isNaN(audioObj.duration)) {
 setRecordingShowItemSecs(Math.round(audioObj.duration));
 }
 };
 } catch (err) {
 console.error('Error uploading audio file for show item:', err);
 }
 };

 const syncSetlistToBackend = (updatedSetlist: Setlist) => {
 fetch(`/api/setlists/${updatedSetlist.id}`, {
 method: 'PUT',
 headers: getHeaders(),
 body: JSON.stringify(updatedSetlist)
 }).catch(err => console.error('Error updating setlist on server:', err));
 };



 // Unique album list for filter dropdown
 const albumsList = useMemo(() => {
 if (!Array.isArray(songs)) return ['todos', 'Singles / Sin Disco'];
 const safe = songs.filter((s): s is Song => Boolean(s && typeof s === 'object' && s.id));
 const list = safe
 .map((s) => s.albumDisco || s.album)
 .filter((a): a is string => Boolean(a && typeof a === 'string'));
 const albumSet = new Set(list);
 if (safe.some((s) => !s.albumDisco && !s.album) || albumSet.size === 0) {
 albumSet.add('Singles / Sin Disco');
 }
 return ['todos', ...Array.from(albumSet)];
 }, [songs]);

 // Filtered catalog songs
 const filteredSongs = useMemo(() => {
 return songs.filter(s => {
 const matchSearch = catalogSearch === '' || 
 s.titulo.toLowerCase().includes(catalogSearch.toLowerCase()) ||
 (s.tonalidad && s.tonalidad.toLowerCase().includes(catalogSearch.toLowerCase())) ||
 (s.notasInternas && s.notasInternas.toLowerCase().includes(catalogSearch.toLowerCase()));

 const matchAlbum = catalogAlbumFilter === 'todos' || s.albumDisco === catalogAlbumFilter;
 const matchStatus = catalogStatusFilter === 'todos' || s.estadoTema === catalogStatusFilter;

 return matchSearch && matchAlbum && matchStatus;
 });
 }, [songs, catalogSearch, catalogAlbumFilter, catalogStatusFilter]);

 // Helper to parse"mm:ss" to seconds
 const parseMmSsToSeconds = (timeStr: string): number => {
 if (!timeStr) return 0;
 const parts = timeStr.trim().split(':');
 if (parts.length === 2) {
 const min = parseInt(parts[0], 10) || 0;
 const sec = parseInt(parts[1], 10) || 0;
 return min * 60 + sec;
 }
 const minOnly = parseInt(timeStr, 10) || 0;
 return minOnly * 60;
 };

 // Helper to format seconds to"X min Y s"
 const formatSecondsToMinutes = (totalSec: number): string => {
 const m = Math.floor(totalSec / 60);
 const s = totalSec % 60;
 if (s === 0) return `${m} min`;
 return `${m}m ${s}s`;
 };

 const formatItemDuration = (item: SetlistItem): string => {
 if (item.duracionEstimadaSegundos) {
 const m = Math.floor(item.duracionEstimadaSegundos / 60);
 const s = item.duracionEstimadaSegundos % 60;
 return s > 0 ? `${m}m ${s}s` : `${m} min`;
 }
 if (item.duracionEstimadaMinutos) {
 return `${item.duracionEstimadaMinutos} min`;
 }
 return '0 min';
 };

 // Calculate active setlist metrics
 const activeSetlistMetrics = useMemo(() => {
 if (!activeSetlist) return { totalSeconds: 0, formattedTime: '0 min', songCount: 0, eventCount: 0, blockCount: 0, avgBpm: 0 };
 let totalSec = 0;
 let songCount = 0;
 let eventCount = 0;
 let blockCount = 0;
 let bpmSum = 0;
 let bpmCount = 0;

 activeSetlist.items.forEach(item => {
 if (item.tipoItem === 'cancion' && item.songId) {
 const songObj = songs.find(s => s.id === item.songId);
 if (songObj) {
 totalSec += songObj.duracionSegundos || parseMmSsToSeconds(songObj.duracion);
 songCount++;
 if (songObj.bpm) {
 bpmSum += songObj.bpm;
 bpmCount++;
 }
 }
 } else if (item.tipoItem === 'bloque_header') {
 blockCount++;
 } else {
 eventCount++;
 const itemSec = item.duracionEstimadaSegundos ?? ((item.duracionEstimadaMinutos || 0) * 60);
 totalSec += itemSec;
 }
 });

 return {
 totalSeconds: totalSec,
 formattedTime: formatSecondsToMinutes(totalSec),
 songCount,
 eventCount,
 blockCount,
 avgBpm: bpmCount > 0 ? Math.round(bpmSum / bpmCount) : 0
 };
 }, [activeSetlist, songs]);

 // Handle Add/Edit Song Form Submit
 const handleSaveSong = async (e: React.FormEvent<HTMLFormElement>) => {
 e.preventDefault();
 const formData = new FormData(e.currentTarget);
 const titulo = formData.get('titulo') as string;
 const duracion = (formData.get('duracion') as string) || '3:30';
 const tonalidad = (formData.get('tonalidad') as string) || 'Am';
 const bpm = parseInt(formData.get('bpm') as string, 10) || 120;
 const afinacion = formData.get('afinacion') as string;
 const albumDisco = formData.get('albumDisco') as string;
 const estadoTema = (formData.get('estadoTema') as any) || 'listo';
 const esVersionCovers = formData.get('esVersionCovers') === 'on';
 const enlaceAcordes = formData.get('enlaceAcordes') as string;
 const notasInternas = formData.get('notasInternas') as string;
 let audioPrincipalUrl = (formData.get('audioPrincipalUrl') as string) || editingSong?.audioPrincipalUrl || '';
 let portadaUrl = (formData.get('portadaUrl') as string) || editingSong?.portadaUrl || '';

 const audioFile = formData.get('audioFile') as File;
 if (audioFile && audioFile.size > 0) {
   try {
     audioPrincipalUrl = await uploadFileToServer(audioFile);
   } catch (err) {
     console.error('Error reading uploaded audio file:', err);
   }
 }

 const portadaFile = formData.get('portadaFile') as File;
 if (portadaFile && portadaFile.size > 0) {
   try {
     portadaUrl = await uploadFileToServer(portadaFile);
   } catch (err) {
     console.error('Error reading uploaded portada file:', err);
   }
 }

 const duracionSegundos = parseMmSsToSeconds(duracion);

 if (editingSong) {
 const updatedSong: Song = {
 ...editingSong,
 titulo,
 duracion,
 duracionSegundos,
 tonalidad,
 bpm,
 afinacion,
 albumDisco,
 estadoTema,
 esVersionCovers,
 enlaceAcordes,
 notasInternas,
 audioPrincipalUrl,
 portadaUrl
 };
 setSongs(prev => {
   const next = prev.map(s => s.id === editingSong.id ? updatedSong : s);
   saveSongsToLocalStorageSafely(next);
   return next;
 });
 if (activePlayerSong?.id === editingSong.id) {
   setActivePlayerSong(updatedSong);
 }
 fetch(`/api/songs/${editingSong.id}`, {
 method: 'PUT',
 headers: getHeaders(),
 body: JSON.stringify(updatedSong)
 }).catch(err => console.error('Error updating song on server:', err));
 } else {
 const newSong: Song = {
 id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
 titulo,
 duracion,
 duracionSegundos,
 tonalidad,
 bpm,
 afinacion,
 albumDisco,
 estadoTema,
 esVersionCovers,
 enlaceAcordes,
 notasInternas,
 audioPrincipalUrl,
 portadaUrl
 };
 setSongs(prev => {
   const next = [newSong, ...prev];
   saveSongsToLocalStorageSafely(next);
   return next;
 });
 fetch('/api/songs', {
 method: 'POST',
 headers: getHeaders(),
 body: JSON.stringify(newSong)
 }).catch(err => console.error('Error creating song on server:', err));
 }

 setShowSongModal(false);
 setEditingSong(null);
 };

 const handleDeleteSong = (songId: string) => {
 const song = songs.find(s => s.id === songId);
 setConfirmDeleteModal({
 title: 'Eliminar Canción',
 description: `¿Seguro que deseas eliminar "${song?.titulo || 'esta canción'}" del catálogo del grupo?`,
 onConfirm: () => {
 setSongs(prev => prev.filter(s => s.id !== songId));
 setSetlists(prev => prev.map(st => ({
 ...st,
 items: st.items.filter(it => it.songId !== songId)
 })));

 fetch(`/api/songs/${songId}`, {
 method: 'DELETE',
 headers: getHeaders()
 }).catch(err => console.error('Error deleting song on server:', err));
 }
 });
 };

 const handleToggleFavorite = (songId: string) => {
   const updated = songs.map(s => {
     if (s.id === songId) {
       const isFav = !s.favoritoGeneral;
       const updatedSong = { ...s, favoritoGeneral: isFav };
       fetch(`/api/songs/${s.id}`, {
         method: 'PUT',
         headers: getHeaders(),
         body: JSON.stringify(updatedSong)
       }).catch(err => console.error('Error toggling favorite on server:', err));
       return updatedSong;
     }
     return s;
   });
   setSongs(updated);
   saveSongsToLocalStorageSafely(updated);
 };

 const handleUnassignAlbumSongs = (albumName: string) => {
   const updatedSongs = songs.map(s => {
     if ((s.albumDisco || 'Singles / Sin Disco') === albumName || s.albumDisco === albumName) {
       return { ...s, albumDisco: '' };
     }
     return s;
   });
   setSongs(updatedSongs);
   saveSongsToLocalStorageSafely(updatedSongs);

   updatedSongs
     .filter(s => (s.albumDisco || 'Singles / Sin Disco') === albumName || s.albumDisco === albumName)
     .forEach(s => {
       fetch(`/api/songs/${s.id}`, {
         method: 'PUT',
         headers: getHeaders(),
         body: JSON.stringify(s)
       }).catch(err => console.error('Error updating song album on server:', err));
     });
 };

 const handleDeleteAlbumAndSongs = (albumName: string) => {
   const songsToDelete = songs.filter(s => (s.albumDisco || 'Singles / Sin Disco') === albumName || s.albumDisco === albumName);
   const idsToDelete = new Set(songsToDelete.map(s => s.id));

   const updatedSongs = songs.filter(s => !idsToDelete.has(s.id));
   setSongs(updatedSongs);
   saveSongsToLocalStorageSafely(updatedSongs);

   setSetlists(prev => prev.map(st => ({
     ...st,
     items: st.items.filter(it => !idsToDelete.has(it.songId))
   })));

   songsToDelete.forEach(s => {
     fetch(`/api/songs/${s.id}`, {
       method: 'DELETE',
       headers: getHeaders()
     }).catch(err => console.error('Error deleting song on server:', err));
   });
 };

 const handleSaveAlbumSongs = (albumName: string, selectedSongIds: string[]) => {
   const selectedSet = new Set(selectedSongIds);
   const updatedSongs = songs.map(s => {
     const isCurrentlyInAlbum = (s.albumDisco || 'Singles / Sin Disco') === albumName || s.albumDisco === albumName;
     if (selectedSet.has(s.id)) {
       return { ...s, albumDisco: albumName };
     } else if (isCurrentlyInAlbum) {
       return { ...s, albumDisco: '' };
     }
     return s;
   });

   setSongs(updatedSongs);
   saveSongsToLocalStorageSafely(updatedSongs);

   updatedSongs.forEach(s => {
     fetch(`/api/songs/${s.id}`, {
       method: 'PUT',
       headers: getHeaders(),
       body: JSON.stringify(s)
     }).catch(err => console.error('Error updating song album on server:', err));
   });
 };

 const handleReorderAlbumTrack = (albumName: string, songId: string, direction: 'up' | 'down') => {
   const albumSongs = songs
     .filter(s => (s.albumDisco || 'Singles / Sin Disco') === albumName)
     .sort((a, b) => (a.ordenAlbum ?? 0) - (b.ordenAlbum ?? 0));

   const index = albumSongs.findIndex(s => s.id === songId);
   if (index === -1) return;

   const targetIndex = direction === 'up' ? index - 1 : index + 1;
   if (targetIndex < 0 || targetIndex >= albumSongs.length) return;

   const newAlbumSongs = [...albumSongs];
   const temp = newAlbumSongs[index];
   newAlbumSongs[index] = newAlbumSongs[targetIndex];
   newAlbumSongs[targetIndex] = temp;

   const orderMap = new Map<string, number>();
   newAlbumSongs.forEach((song, idx) => {
     orderMap.set(song.id, idx + 1);
   });

   const updatedSongs = songs.map(s => {
     if (orderMap.has(s.id)) {
       return { ...s, ordenAlbum: orderMap.get(s.id) };
     }
     return s;
   });

   setSongs(updatedSongs);
   saveSongsToLocalStorageSafely(updatedSongs);

   newAlbumSongs.forEach(s => {
     const updated = { ...s, ordenAlbum: orderMap.get(s.id) };
     fetch(`/api/songs/${s.id}`, {
       method: 'PUT',
       headers: getHeaders(),
       body: JSON.stringify(updated)
     }).catch(err => console.error('Error updating song order on server:', err));
   });
 };

 // Setlist Operations
 const handleCreateSetlist = () => {
   setSetlistModalData({ isOpen: true, setlistToEdit: null });
 };

 const handleSaveSetlistModal = (setlistData: {
   id?: string;
   nombre: string;
   descripcion: string;
   tipoFormato: 'festival' | 'sala_larga' | 'acustico';
 }) => {
   if (setlistData.id) {
     setSetlists((prev) =>
       prev.map((s) =>
         s.id === setlistData.id
           ? {
               ...s,
               nombre: setlistData.nombre,
               descripcion: setlistData.descripcion,
               tipoFormato: setlistData.tipoFormato,
               fechaUltimaEdicion: new Date().toISOString().split('T')[0],
             }
           : s
       )
     );
     const existing = setlists.find((s) => s.id === setlistData.id);
     if (existing) {
       const payload = {
         ...existing,
         nombre: setlistData.nombre,
         descripcion: setlistData.descripcion,
         tipoFormato: setlistData.tipoFormato,
       };
       fetch(`/api/setlists/${setlistData.id}`, {
         method: 'PUT',
         headers: getHeaders(),
         body: JSON.stringify(payload),
       }).catch((err) => console.error('Error updating setlist:', err));
     }
   } else {
     const newSetlist: Setlist = {
       id: `setlist-${Date.now()}`,
       nombre: setlistData.nombre,
       descripcion: setlistData.descripcion || 'Nuevo repertorio para directo',
       tipoFormato: setlistData.tipoFormato || 'festival',
       duracionTotalEstimadaMinutos: 45,
       fechaCreacion: new Date().toISOString().split('T')[0],
       fechaUltimaEdicion: new Date().toISOString().split('T')[0],
       items: [],
     };
     setSetlists((prev) => [newSetlist, ...prev]);
     setActiveSetlistId(newSetlist.id);

     fetch('/api/setlists', {
       method: 'POST',
       headers: getHeaders(),
       body: JSON.stringify(newSetlist),
     }).catch((err) => console.error('Error creating setlist on server:', err));
   }
 };

 const handleOldSetlist = () => {
 const name = prompt('Nombre para el nuevo repertorio:', 'Festival Verano 2026');
 if (!name || !name.trim()) return;

 const newSetlist: Setlist = {
 id: `setlist-${Date.now()}`,
 nombre: name.trim(),
 descripcion: 'Nuevo repertorio para directo',
 tipoFormato: 'festival',
 duracionTotalEstimadaMinutos: 45,
 fechaCreacion: new Date().toISOString().split('T')[0],
 fechaUltimaEdicion: new Date().toISOString().split('T')[0],
 items: songs.filter(s => s.favoritoGeneral).map((s, idx) => ({
 id: `it-${Date.now()}-${idx}`,
 songId: s.id,
 tipoItem: 'cancion'
 }))
 };

 setSetlists(prev => [newSetlist, ...prev]);
 setActiveSetlistId(newSetlist.id);

 fetch('/api/setlists', {
 method: 'POST',
 headers: getHeaders(),
 body: JSON.stringify(newSetlist)
 }).catch(err => console.error('Error creating setlist on server:', err));
 };

 const handleDuplicateSetlist = (st: Setlist) => {
 const duplicated: Setlist = {
 ...st,
 id: `setlist-${Date.now()}`,
 nombre: `${st.nombre} (Copia)`,
 fechaCreacion: new Date().toISOString().split('T')[0],
 fechaUltimaEdicion: new Date().toISOString().split('T')[0],
 items: st.items.map(it => ({ ...it, id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` }))
 };
 setSetlists(prev => [duplicated, ...prev]);
 setActiveSetlistId(duplicated.id);

 fetch('/api/setlists', {
 method: 'POST',
 headers: getHeaders(),
 body: JSON.stringify(duplicated)
 }).catch(err => console.error('Error duplicating setlist on server:', err));
 };

 const handleDeleteSetlist = (stId: string) => {
 if (setlists.length <= 1) {
 alert('Debes mantener al menos un repertorio guardado.');
 return;
 }
 const st = setlists.find(s => s.id === stId);
 setConfirmDeleteModal({
 title: 'Eliminar Repertorio',
 description: `¿Seguro que deseas eliminar el repertorio "${st?.nombre || 'este repertorio'}"?`,
 onConfirm: () => {
 const remaining = setlists.filter(s => s.id !== stId);
 setSetlists(remaining);
 if (activeSetlistId === stId) {
 setActiveSetlistId(remaining[0].id);
 }

 fetch(`/api/setlists/${stId}`, {
 method: 'DELETE',
 headers: getHeaders()
 }).catch(err => console.error('Error deleting setlist on server:', err));
 }
 });
 };

 // Setlist Item Manipulation
 const handleAddItemToSetlist = (
  songId?: string, 
  tipoItem: SetlistItem['tipoItem'] = 'cancion',
  tituloCustom?: string,
  duracionEstimadaMinutos?: number,
  duracionEstimadaSegundos?: number,
  notaTema?: string
 ) => {
  if (!activeSetlist) return;

  let newItem: SetlistItem = {
   id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
   tipoItem,
   songId,
   tituloCustom,
   duracionEstimadaMinutos,
   duracionEstimadaSegundos,
   notaTema
  };

  if (!tituloCustom) {
   if (tipoItem === 'bloque_header') {
    newItem.tituloCustom = '⚡ Nuevo Bloque / Sección del Show';
   } else if (tipoItem === 'presentacion') {
    newItem.tituloCustom = 'Presentación Banda & Saludo';
    newItem.duracionEstimadaMinutos = 2;
    newItem.duracionEstimadaSegundos = 120;
   } else if (tipoItem === 'beatbox') {
    newItem.tituloCustom = 'Performance Beatbox Filgue';
    newItem.duracionEstimadaMinutos = 2;
    newItem.duracionEstimadaSegundos = 120;
   } else if (tipoItem === 'intro_tema') {
    newItem.tituloCustom = 'Intro / Historia del Tema';
    newItem.duracionEstimadaMinutos = 1;
    newItem.duracionEstimadaSegundos = 60;
   } else if (tipoItem === 'solo_performance') {
    newItem.tituloCustom = 'Solo Instrumental / Jam';
    newItem.duracionEstimadaMinutos = 2;
    newItem.duracionEstimadaSegundos = 120;
   } else if (tipoItem === 'cambio_instrumento') {
    newItem.tituloCustom = 'Cambio Instrumento & Afinación';
    newItem.duracionEstimadaMinutos = 1;
    newItem.duracionEstimadaSegundos = 60;
   } else if (tipoItem === 'chapa') {
    newItem.tituloCustom = 'Chapa / Discurso con Público';
    newItem.duracionEstimadaMinutos = 2;
    newItem.duracionEstimadaSegundos = 120;
   } else if (tipoItem === 'descanso') {
    newItem.tituloCustom = 'Pausa / Intermedio / Agua';
    newItem.duracionEstimadaMinutos = 2;
    newItem.duracionEstimadaSegundos = 120;
   } else if (tipoItem === 'bis') {
    newItem.tituloCustom = '💣 BIS / PARTE FINAL DEL SHOW';
    newItem.duracionEstimadaMinutos = 1;
    newItem.duracionEstimadaSegundos = 60;
   }
  }

  const updatedSetlist: Setlist = {
   ...activeSetlist,
   fechaUltimaEdicion: new Date().toISOString().split('T')[0],
   items: [...activeSetlist.items, newItem]
  };

  setSetlists(prev => prev.map(st => st.id === activeSetlist.id ? updatedSetlist : st));
  syncSetlistToBackend(updatedSetlist);
 };

 const handleSaveShowItem = (itemData: Partial<SetlistItem>) => {
  if (!activeSetlist) return;

  let updatedItems: SetlistItem[];

  if (editingShowItem) {
   updatedItems = activeSetlist.items.map(it => 
    it.id === editingShowItem.id ? { ...it, ...itemData, audioUrl: showItemAudioUrl } : it
   );
  } else {
   const newItem: SetlistItem = {
    id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    tipoItem: itemData.tipoItem || 'chapa',
    tituloCustom: itemData.tituloCustom || 'Evento del Show',
    duracionEstimadaMinutos: itemData.duracionEstimadaMinutos || 2,
    duracionEstimadaSegundos: itemData.duracionEstimadaSegundos || 120,
    notaTema: itemData.notaTema || '',
  audioUrl: showItemAudioUrl
   };
   updatedItems = [...activeSetlist.items, newItem];
  }

  const updatedSetlist: Setlist = {
   ...activeSetlist,
   fechaUltimaEdicion: new Date().toISOString().split('T')[0],
   items: updatedItems
  };

  setSetlists(prev => {
   const next = prev.map(st => st.id === activeSetlist.id ? updatedSetlist : st);
   saveSetlistsToLocalStorageSafely(next);
   return next;
  });
  syncSetlistToBackend(updatedSetlist);
  setShowShowItemModal(false);
  setEditingShowItem(null);
  setShowItemAudioUrl('');
 };

 const handleMoveSetlistItem = (index: number, direction: 'up' | 'down') => {
 if (!activeSetlist) return;
 const targetIndex = direction === 'up' ? index - 1 : index + 1;
 if (targetIndex < 0 || targetIndex >= activeSetlist.items.length) return;

 const newItems = [...activeSetlist.items];
 const temp = newItems[index];
 newItems[index] = newItems[targetIndex];
 newItems[targetIndex] = temp;

 const updatedSetlist: Setlist = {
 ...activeSetlist,
 fechaUltimaEdicion: new Date().toISOString().split('T')[0],
 items: newItems
 };

 setSetlists(prev => prev.map(st => st.id === activeSetlist.id ? updatedSetlist : st));
 syncSetlistToBackend(updatedSetlist);
 };

 const handleRemoveSetlistItem = (itemId: string) => {
 if (!activeSetlist) return;
 const updatedSetlist: Setlist = {
 ...activeSetlist,
 fechaUltimaEdicion: new Date().toISOString().split('T')[0],
 items: activeSetlist.items.filter(it => it.id !== itemId)
 };

 setSetlists(prev => prev.map(st => st.id === activeSetlist.id ? updatedSetlist : st));
 syncSetlistToBackend(updatedSetlist);
 };

 const handleUpdateItemNote = (itemId: string, note: string) => {
 if (!activeSetlist) return;
 const updatedSetlist: Setlist = {
 ...activeSetlist,
 items: activeSetlist.items.map(it => it.id === itemId ? { ...it, notaTema: note } : it)
 };

 setSetlists(prev => prev.map(st => st.id === activeSetlist.id ? updatedSetlist : st));
 syncSetlistToBackend(updatedSetlist);
 };

 // Assign setlist to concert or rehearsal
 const handleAssignSetlistToConcert = () => {
 if (!assigningSetlist || !selectedConcertToAssign) return;
 
 // Check if it's a concert or rehearsal
 const concertMatch = concerts.find(c => c.id === selectedConcertToAssign);
 if (concertMatch && onUpdateConcert) {
 onUpdateConcert(concertMatch.id, { setlistId: assigningSetlist.id });
 alert(`Repertorio"${assigningSetlist.nombre}" asignado con éxito al concierto en ${concertMatch.sala} (${concertMatch.ciudad}).`);
 } else {
 const rehMatch = rehearsals.find(r => r.id === selectedConcertToAssign);
 if (rehMatch && onUpdateRehearsal) {
 onUpdateRehearsal(rehMatch.id, { setlistId: assigningSetlist.id });
 alert(`Repertorio"${assigningSetlist.nombre}" asignado con éxito al ensayo de ${rehMatch.fecha}.`);
 }
 }
 setAssigningSetlist(null);
 };

 // Print Stage Setlist
 const handlePrintStageSetlist = () => {
 if (!activeSetlist) return;
 const printWindow = window.open('', '_blank');
 if (!printWindow) return;

 printWindow.document.write(`
 <!DOCTYPE html>
 <html>
 <head>
 <title>SETLIST BAKANDEYA - ${activeSetlist.nombre}</title>
 <style>
 body { 
 font-family: system-ui, -apple-system, sans-serif; 
 margin: 20px; 
 background: #000; 
 color: #fff; 
 }
 .header { 
 -bottom: 4px solid #f2ca50; 
 padding-bottom: 15px; 
 margin-bottom: 25px; 
 display: flex; 
 justify-content: space-between; 
 align-items: center; 
 }
 h1 { font-size: 32px; text-transform: uppercase; margin: 0; color: #f2ca50; letter-spacing: 2px; }
 .meta { font-size: 16px; font-family: monospace; color: #aaa; }
 .set-table { width: 100%; -collapse: collapse; }
 .set-table th { 
 text-align: left; 
 padding: 10px; 
 -bottom: 2px solid #444; 
 font-size: 14px; 
 text-transform: uppercase; 
 color: #888; 
 }
 .set-table td { 
 padding: 14px 10px; 
 border-bottom: 1px solid #222; 
 font-size: 22px; 
 font-weight: bold; 
 }
 .num { color: #f2ca50; width: 40px; font-family: monospace; }
 .key-badge { 
 display: inline-block; 
 background: #222; 
 color: #10b981; 
 padding: 4px 10px; 
 border-radius: 6px; 
 font-size: 18px; 
 font-family: monospace; 
 }
 .bpm { color: #888; font-size: 16px; font-family: monospace; }
 .chapa { color: #f59e0b; font-style: italic; font-size: 18px; }
 .bis { color: #ec4899; text-transform: uppercase; font-size: 20px; text-align: center; }
 .note { display: block; font-size: 13px; color: #aaa; font-weight: normal; margin-top: 4px; font-style: italic; }
 .footer { margin-top: 30px; font-size: 12px; font-family: monospace; color: #666; text-align: center; }
 </style>
 </head>
 <body>
 <div class="header">
 <div>
 <h1>BAKANDEYA — SETLIST</h1>
 <div class="meta">${activeSetlist.nombre} (${activeSetlistMetrics.formattedTime} • ${activeSetlistMetrics.songCount} Temas)</div>
 </div>
 <div style="font-size:20px; font-weight:bold; color:#10b981; font-family:monospace;">
 AVG BPM: ${activeSetlistMetrics.avgBpm}
 </div>
 </div>

 <table class="set-table">
 <thead>
 <tr>
 <th style="width:40px;">#</th>
 <th>TÍTULO DEL TEMA</th>
 <th style="width:100px;">TONO</th>
 <th style="width:80px;">BPM</th>
 <th style="width:80px;">TIEMPO</th>
 </tr>
 </thead>
 <tbody>
 ${activeSetlist.items.map((it, idx) => {
 if (it.tipoItem === 'cancion' && it.songId) {
 const s = songs.find(x => x.id === it.songId);
 if (!s) return '';
 return `
 <tr>
 <td class="num">${idx + 1}</td>
 <td>
 ${s.titulo}
 ${it.notaTema ? `<span class="note">⚠️ ${it.notaTema}</span>` : ''}
 </td>
 <td><span class="key-badge">${s.tonalidad}</span></td>
 <td class="bpm">${s.bpm}</td>
 <td style="font-family:monospace; font-size:16px; color:#aaa;">${s.duracion}</td>
 </tr>
 `;
 } else if (it.tipoItem === 'bloque_header') {
 return `
 <tr style="background:#1e1e1e; border-top: 3px solid #f2ca50; border-bottom: 2px solid #f2ca50;">
 <td colspan="5" style="color:#f2ca50; font-size:20px; font-weight:900; letter-spacing:1px; text-transform:uppercase; padding: 12px 10px;">
 ⚡ ${it.tituloCustom || 'BLOQUE DEL SHOW'}
 </td>
 </tr>
 `;
 } else {
 const typeInfo = SHOW_ITEM_TYPES[it.tipoItem] || { label: 'Evento', icon: '📌' };
 const durText = formatItemDuration(it);
 return `
 <tr style="background:#121212; border-left: 4px solid #38bdf8;">
 <td class="num" style="color:#38bdf8;">•</td>
 <td colspan="3" style="color:#e0f2fe; font-size:18px; font-weight:bold;">
 <span style="background:rgba(56,189,248,0.2); color:#38bdf8; padding:2px 8px; border-radius:4px; font-size:13px; font-family:monospace; margin-right:8px;">
 ${typeInfo.icon} ${typeInfo.label.toUpperCase()}
 </span>
 ${it.tituloCustom || 'Evento del Show'}
 ${it.notaTema ? `<span class="note" style="color:#94a3b8;">📋 CUE: ${it.notaTema}</span>` : ''}
 </td>
 <td style="font-family:monospace; font-size:16px; color:#f2ca50; text-align:right;">${durText}</td>
 </tr>
 `;
 }
 }).join('')}
 </tbody>
 </table>

 <div class="footer">
 Hoja de Escenario Impresa • Bakandeya Repertoire Manager
 </div>

 <script>
 window.onload = function() { window.print(); }
 </script>
 </body>
 </html>
 `);
 printWindow.document.close();
 };

 return (
 <div className="space-y-5">
 {/* MODULE HEADER BAR */}
 <div className={`p-4 sm:p-5 rounded-2xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 ${colors.card} `}>
       {/* HEADER / TITULO PRINCIPAL */}
      <div className="mb-4 xl:mb-0 shrink-0">
        <h1 className={`text-4xl md:text-5xl font-display font-bold tracking-tight mb-2 ${isStitchLight ? 'text-slate-900' : 'text-zinc-100'}`}>Repertorio</h1>
        <p className={`text-sm font-mono uppercase tracking-widest ${isStitchLight ? 'text-slate-500' : 'text-zinc-400'}`}>Gestión de Setlists y Documentos</p>
      </div>

 {/* NAVIGATION SUBTABS */}
 <div className="flex items-center gap-2 p-1 bg-[#121212] border border-white/5 rounded-full w-full xl:w-auto overflow-x-auto shadow-lg">
 <button
 id="tab-setlists"
 onClick={() => setActiveTab('setlists')}
 className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
 activeTab === 'setlists'
 ? 'bg-[#1db954] text-black shadow-md'
 : 'bg-[#282828] text-zinc-300 hover:text-white hover:bg-[#3e3e3e]'
 }`}
 >
 <Layers className="w-4 h-4" />
 <span>Setlists & Directos ({setlists.length})</span>
 </button>

 <button
 id="tab-catalogo"
 onClick={() => setActiveTab('catalogo')}
 className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
 activeTab === 'catalogo'
 ? 'bg-[#1db954] text-black shadow-md'
 : 'bg-[#282828] text-zinc-300 hover:text-white hover:bg-[#3e3e3e]'
 }`}
 >
 <Music className="w-4 h-4" />
 <span>Catálogo ({songs.length})</span>
 </button>

 <button
 id="tab-discografia"
 onClick={() => setActiveTab('discografia')}
 className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
 activeTab === 'discografia'
 ? 'bg-[#1db954] text-black shadow-md'
 : 'bg-[#282828] text-zinc-300 hover:text-white hover:bg-[#3e3e3e]'
 }`}
 >
 <Disc3 className="w-4 h-4" />
 <span>Discografía ({albumsList.filter(a => a !== "todos").length})</span>
 </button>

 <button
 id="tab-escenario"
 onClick={() => setActiveTab('escenario')}
 className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
 activeTab === 'escenario'
 ? 'bg-[#1db954] text-black shadow-md'
 : 'bg-[#282828] text-zinc-300 hover:text-white hover:bg-[#3e3e3e]'
 }`}
 >
 <Eye className="w-4 h-4" />
 <span>Modo Escenario ({activeSetlist ? activeSetlist.items.length : 0})</span>
 </button>

 <button
 id="tab-configuracion"
 onClick={() => setActiveTab('configuracion')}
 className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
 activeTab === 'configuracion'
 ? 'bg-[#1db954] text-black shadow-md'
 : 'bg-[#282828] text-zinc-300 hover:text-white hover:bg-[#3e3e3e]'
 }`}
 >
 <Settings className="w-4 h-4" />
 <span>Configuración</span>
 </button>
 </div>
</div>

 {/* VIEW 1: SETLISTS & REPERTORIOS DE DIRECTO */}
 {activeTab === 'setlists' && (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
 {/* SIDEBAR: LIST OF SAVED SETLISTS */}
 <div className={`lg:col-span-4 p-4 rounded-2xl space-y-4 ${colors.card} `}>
 <div className="flex justify-between items-center">
 <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
 <Layers className="w-4 h-4 text-[#d1b375]/80" />
 <span>Repertorios Guardados</span>
 </h3>
 <button
 id="btn-create-setlist"
 onClick={handleCreateSetlist}
 className={`px-2 py-1 rounded-lg text-[10px] font-mono font-medium flex items-center gap-1 cursor-pointer transition-all ${
 isStitchLight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
 }`}
 title="Crear un nuevo setlist"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Nuevo</span>
 </button>
 </div>

 <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
 {setlists.map(st => {
 const isSelected = st.id === activeSetlistId;
 const songItemsCount = st.items.filter(i => i.tipoItem === 'cancion').length;
 
 return (
 <div
 key={st.id}
 onClick={() => setActiveSetlistId(st.id)}
 className={`p-3 rounded-xl transition-all cursor-pointer ${
 isSelected 
 ? isStitchLight 
 ? 'bg-sky-500/15 ring-1 ring-indigo-500/30' 
 : 'bg-[#d1b375]/15 ring-1 ring-[#f2ca50]/30'
 : isStitchLight
 ? 'bg-white hover:border-slate-300'
 : 'bg-[#131313] hover:border-neutral-700'
 }`}
 >
 <div className="flex justify-between items-start gap-2">
 <h4 className={`text-[10px] font-mono font-bold ${isSelected ? (isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]') : colors.text}`}>
 {st.nombre}
 </h4>
 <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded font-bold shrink-0 ${
 st.tipoFormato === 'festival' 
 ? 'bg-[#d1b375]/15 text-[#d1b375]'
 : st.tipoFormato === 'sala_larga'
 ? 'bg-sky-500/15 text-sky-400'
 : (isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]')
 }`}>
 {st.tipoFormato}
 </span>
 </div>

 <p className="text-[10px] text-neutral-400 line-clamp-1 mt-1 font-sans">
 {st.descripcion || 'Sin descripción'}
 </p>

 <div className="flex items-center justify-between mt-2 pt-2 text-[10px] font-mono text-neutral-400">
 <span className="flex items-center gap-1">
 <Music className="w-3 h-3 text-[#d1b375]" />
 <span>{songItemsCount} temas</span>
 </span>

 <div className="flex items-center gap-1.5">
 <button
 onClick={(e) => { e.stopPropagation(); handleDuplicateSetlist(st); }}
 className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
 title="Duplicar Setlist"
 >
 <Copy className="w-3 h-3" />
 </button>
 <button
 onClick={(e) => { e.stopPropagation(); handleDeleteSetlist(st.id); }}
 className="p-1 text-neutral-400 hover:text-rose-400 rounded hover:bg-neutral-800"
 title="Eliminar Setlist"
 >
 <Trash2 className="w-3 h-3" />
 </button>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* MAIN EDITOR FOR ACTIVE SETLIST */}
 <div className={`lg:col-span-8 p-4 sm:p-5 rounded-2xl space-y-4 ${colors.card} `}>
 {activeSetlist ? (
 <>
 {/* ACTIVE SETLIST HEADER & CONTROLS */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3">
 <div>
 <div className="flex items-center gap-2">
 <input
 type="text"
 value={activeSetlist.nombre}
 onChange={(e) => {
 const val = e.target.value;
 setSetlists(prev => prev.map(s => s.id === activeSetlist.id ? { ...s, nombre: val } : s));
 }}
 className={`text-sm sm:text-base font-bold font-mono border-dashed focus:border-amber-400 bg-transparent focus:outline-none ${colors.text}`}
 />
 <button
 type="button"
 onClick={() => setSetlistModalData({ isOpen: true, setlistToEdit: activeSetlist })}
 className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
 title="Editar detalles del repertorio"
 >
 <Edit3 className="w-3.5 h-3.5" />
 </button>
 </div>
 <p className="text-[10px] text-neutral-400 mt-1">
 {activeSetlist.descripcion || 'Haz clic para personalizar las canciones de esta lista'}
 </p>
 </div>

 <div className="flex items-center gap-2 flex-wrap">
 <button
 onClick={() => handleShareSetlist(activeSetlist)}
 className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
 title="Compartir repertorio completo por WhatsApp"
 >
 <MessageSquare className="w-3.5 h-3.5 fill-white/20" />
 <span>Compartir Repertorio</span>
 </button>

 <button
 onClick={() => setAssigningSetlist(activeSetlist)}
 className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
 isStitchLight 
 ? 'bg-[#10b981]/15 text-[#10b981] hover:bg-[#10b981]/15'
 : 'bg-[#10b981]/15 text-[#10b981] hover:bg-[#10b981]/15'
 }`}
 title="Asignar a un concierto del calendario"
 >
 <CheckCircle2 className="w-3.5 h-3.5" />
 <span>Asignar a Bolo/Ensayo</span>
 </button>

 <button
 onClick={() => setShowPdfPreview(true)}
 className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
 isStitchLight 
 ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
 : 'bg-neutral-900 text-[#d1b375] hover:bg-neutral-800'
 }`}
 title="Exportar hoja de escenario"
 >
 <Printer className="w-3.5 h-3.5" />
 <span>Imprimir / PDF</span>
 </button>
 </div>
 </div>

 {/* LIVE METRICS BAR */}
 <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 rounded-xl bg-black/30">
 <div>
 <span className="text-[10px] font-mono text-neutral-400 uppercase block">Canciones</span>
 <span className="text-sm font-bold font-mono text-white">{activeSetlistMetrics.songCount} temas</span>
 </div>
 <div>
 <span className="text-[10px] font-mono text-neutral-400 uppercase block">Eventos Show</span>
 <span className="text-sm font-bold font-mono text-sky-400">{activeSetlistMetrics.eventCount} interludios</span>
 </div>
 <div>
 <span className="text-[10px] font-mono text-neutral-400 uppercase block">Bloques</span>
 <span className="text-sm font-bold font-mono text-[#f2ca50]">{activeSetlistMetrics.blockCount} secciones</span>
 </div>
 <div>
 <span className="text-[10px] font-mono text-neutral-400 uppercase block">Duración Total</span>
 <span className="text-sm font-bold font-mono text-[#d1b375]">{activeSetlistMetrics.formattedTime}</span>
 </div>
 <div>
 <span className="text-[10px] font-mono text-neutral-400 uppercase block">BPM Promedio</span>
 <span className="text-sm font-bold font-mono text-[#10b981]">{activeSetlistMetrics.avgBpm} BPM</span>
 </div>
 </div>

 {/* ADD ITEMS ACTION BAR */}
 <div className="space-y-2 pt-1">
 <div className="flex items-center gap-2 overflow-x-auto pb-1">
 <span className="text-[10px] font-mono text-neutral-400 uppercase whitespace-nowrap font-bold">Añadir al Repertorio:</span>
 
 {/* Select song from catalog */}
 <select
 onChange={(e) => {
 if (e.target.value) {
 handleAddItemToSetlist(e.target.value, 'cancion');
 e.target.value = '';
 }
 }}
 className={`text-[10px] font-mono py-1.5 px-3 rounded-lg focus:outline-none cursor-pointer border border-neutral-800 font-bold ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-neutral-900 text-[#d1b375]'
 }`}
 >
 <option value="">+ Seleccionar Tema de Discografía...</option>
 {sortedSongsByAlbumAndOrder.map((s, idx) => {
   const albumLabel = s.albumDisco || s.album || 'Single';
   return (
     <option key={`${s.id}-${idx}`} value={s.id}>
       [{albumLabel}] {s.titulo} ({s.tonalidad ? `${s.tonalidad} • ` : ''}{s.duracion || '0:00'})
     </option>
   );
 })}
 </select>

 <button
 onClick={() => handleAddItemToSetlist(undefined, 'bloque_header', '⚡ Bloque Nuevo')}
 className="px-2.5 py-1.5 text-[10px] font-mono rounded-lg bg-[#d1b375]/20 text-[#d1b375] border border-[#f2ca50]/40 hover:bg-[#d1b375]/30 whitespace-nowrap cursor-pointer font-bold flex items-center gap-1"
 >
 <span>⚡</span>
 <span>+ Encabezado de Bloque</span>
 </button>

 <button
 onClick={() => { setEditingShowItem(null); setShowShowItemModal(true); }}
 className="px-2.5 py-1.5 text-[10px] font-mono rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 whitespace-nowrap cursor-pointer font-bold flex items-center gap-1"
 >
 <Zap className="w-3 h-3 text-sky-400" />
 <span>+ Personalizar Evento...</span>
 </button>
 </div>

 {/* QUICK SHOW PRESET CHIPS */}
 <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono">
 <span className="text-neutral-500 text-[9px] uppercase whitespace-nowrap">Accesos Rápidos:</span>
 <button
 onClick={() => handleAddItemToSetlist(undefined, 'presentacion')}
 className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 whitespace-nowrap cursor-pointer"
 >
 🎤 Presentación Banda (2m)
 </button>
 <button
 onClick={() => handleAddItemToSetlist(undefined, 'beatbox')}
 className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 whitespace-nowrap cursor-pointer"
 >
 🥁 Beatbox Filgue (2m)
 </button>
 <button
 onClick={() => handleAddItemToSetlist(undefined, 'intro_tema')}
 className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 whitespace-nowrap cursor-pointer"
 >
 🗣️ Intro a Tema (1m)
 </button>
 <button
 onClick={() => handleAddItemToSetlist(undefined, 'cambio_instrumento')}
 className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 whitespace-nowrap cursor-pointer"
 >
 🔧 Cambio Guitarra (1m)
 </button>
 <button
 onClick={() => handleAddItemToSetlist(undefined, 'chapa')}
 className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 whitespace-nowrap cursor-pointer"
 >
 💬 Chapa / Público (2m)
 </button>
 <button
 onClick={() => handleAddItemToSetlist(undefined, 'bis')}
 className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 whitespace-nowrap cursor-pointer"
 >
 💣 BIS Final (1m)
 </button>
 </div>
 </div>

 {/* ITEMS LIST */}
 <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
 {activeSetlist.items.length === 0 ? (
 <div className="text-center py-10 border-dashed rounded-xl text-neutral-500 text-[10px] font-mono">
 No hay canciones en este repertorio. Usa el menú de arriba para añadir temas.
 </div>
 ) : (
 activeSetlist.items.map((it, index) => {
 if (it.tipoItem === 'cancion' && it.songId) {
 const song = songs.find(s => s.id === it.songId);
 if (!song) return null;

 return (
 <div
 key={it.id}
 className={`p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
 isStitchLight ? 'bg-white' : 'bg-neutral-900/80'
 }`}
 >
 <div className="flex items-center gap-3 min-w-0">
 <span className="w-6 text-center font-mono font-bold text-[10px] text-[#d1b375] shrink-0">
 {index + 1}
 </span>

 <div className="min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <span className={`text-[10px] font-bold font-mono ${colors.text}`}>
 {song.titulo}
 </span>
 <span className="text-[10px] font-mono px-2 py-1 rounded bg-[#10b981]/15 text-[#10b981]">
 {song.tonalidad}
 </span>
 <span className="text-[10px] font-mono text-neutral-400">
 {song.bpm} BPM
 </span>
 <span className="text-[10px] font-mono text-[#d1b375]">
 {song.duracion}
 </span>
 </div>

 <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-neutral-500">
 {song.cantantePrincipal && <span>Cantante: {song.cantantePrincipal}</span>}
 {song.afinacion && <span>• {song.afinacion}</span>}
 </div>

 {/* Custom Note Input for Setlist */}
 <input
 type="text"
 placeholder="Nota para este bolo (ej. Cambio a acústica / empalmar solo)..."
 value={it.notaTema || ''}
 onChange={(e) => handleUpdateItemNote(it.id, e.target.value)}
 className={`mt-1.5 w-full text-[10px] font-mono px-2 py-1 rounded ${
 isStitchLight 
 ? 'bg-slate-50 text-slate-700 placeholder:text-slate-400' 
 : 'bg-black/40 text-neutral-300 placeholder:text-neutral-600'
 }`}
 />
 </div>
 </div>

 {/* CONTROLS */}
 <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
 <button
 onClick={() => handleMoveSetlistItem(index, 'up')}
 disabled={index === 0}
 className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 rounded hover:bg-neutral-800 cursor-pointer"
 title="Mover arriba"
 >
 <ArrowUp className="w-3.5 h-3.5" />
 </button>

 <button
 onClick={() => handleMoveSetlistItem(index, 'down')}
 disabled={index === activeSetlist.items.length - 1}
 className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 rounded hover:bg-neutral-800 cursor-pointer"
 title="Mover abajo"
 >
 <ArrowDown className="w-3.5 h-3.5" />
 </button>

 <button
 onClick={() => handleRemoveSetlistItem(it.id)}
 className="p-1 text-neutral-400 hover:text-rose-400 rounded hover:bg-neutral-800 cursor-pointer ml-1"
 title="Quitar del setlist"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 );
 } else if (it.tipoItem === 'bloque_header') {
 return (
 <div
 key={it.id}
 className="p-3 rounded-2xl bg-gradient-to-r from-[#d1b375]/30 via-neutral-900 to-black border border-[#f2ca50]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md my-1"
 >
 <div className="flex items-center gap-3 min-w-0 flex-1">
 <span className="p-1.5 bg-[#f2ca50]/20 text-[#f2ca50] rounded-xl text-base shrink-0">⚡</span>
 <div className="min-w-0 flex-1">
 <input
 type="text"
 value={it.tituloCustom || ''}
 placeholder="Ej: 🔥 BLOQUE 1: CALENTAMIENTO"
 onChange={(e) => {
 const val = e.target.value;
 setSetlists(prev => prev.map(s => s.id === activeSetlist.id ? {
 ...s,
 items: s.items.map(x => x.id === it.id ? { ...x, tituloCustom: val } : x)
 } : s));
 }}
 className="bg-transparent text-sm font-extrabold font-mono text-[#f2ca50] border-b border-dashed border-[#f2ca50]/40 focus:outline-none w-full uppercase tracking-wider"
 />
 <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">Sección / Bloque del Concierto</span>
 </div>
 </div>

 <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
 <button
 onClick={() => { setEditingShowItem(it); setShowShowItemModal(true); }}
 className="p-1.5 text-[#f2ca50] hover:bg-[#f2ca50]/20 rounded-lg cursor-pointer text-xs font-mono"
 title="Editar Bloque"
 >
 <Edit3 className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => handleMoveSetlistItem(index, 'up')}
 disabled={index === 0}
 className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-neutral-800 cursor-pointer"
 title="Mover arriba"
 >
 <ArrowUp className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => handleMoveSetlistItem(index, 'down')}
 disabled={index === activeSetlist.items.length - 1}
 className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-neutral-800 cursor-pointer"
 title="Mover abajo"
 >
 <ArrowDown className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => handleRemoveSetlistItem(it.id)}
 className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800 cursor-pointer"
 title="Eliminar Bloque"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 );
 } else {
 const typeConfig = SHOW_ITEM_TYPES[it.tipoItem] || SHOW_ITEM_TYPES.otro;
 const durationText = formatItemDuration(it);

 return (
 <div
 key={it.id}
 className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${typeConfig.bg} ${typeConfig.border}`}
 >
 <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
 <span className="text-xl shrink-0 leading-none pt-0.5 sm:pt-0">{typeConfig.icon}</span>
 
 <div className="min-w-0 flex-1 space-y-1">
 <div className="flex items-center gap-2 flex-wrap">
 <span className={`text-[10px] font-mono uppercase font-extrabold px-2 py-0.5 rounded-md border ${typeConfig.text} ${typeConfig.border}`}>
 {typeConfig.label}
 </span>
 <span className="text-[10px] font-mono text-[#f2ca50] font-bold">
 ⏱️ {durationText}
 </span>
 </div>

 <input
 type="text"
 value={it.tituloCustom || ''}
 placeholder="Título / Descripción del evento..."
 onChange={(e) => {
 const val = e.target.value;
 setSetlists(prev => prev.map(s => s.id === activeSetlist.id ? {
 ...s,
 items: s.items.map(x => x.id === it.id ? { ...x, tituloCustom: val } : x)
 } : s));
 }}
 className="bg-transparent border-b border-dashed border-white/20 text-xs font-bold font-mono text-white focus:outline-none w-full"
 />

 <input
 type="text"
 placeholder="Notas / Cues de luces, sonido o frases para el público..."
 value={it.notaTema || ''}
 onChange={(e) => handleUpdateItemNote(it.id, e.target.value)}
 className="w-full text-[10px] font-mono px-2 py-1 rounded bg-black/40 text-neutral-300 placeholder:text-neutral-500 border border-white/10"
 />
 </div>
 </div>

 <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
 <button
 onClick={() => { setEditingShowItem(it); setShowShowItemModal(true); }}
 className="p-1.5 text-sky-400 hover:bg-sky-500/20 rounded-lg cursor-pointer text-xs font-mono"
 title="Editar detalles del evento"
 >
 <Edit3 className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => handleMoveSetlistItem(index, 'up')}
 disabled={index === 0}
 className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-neutral-800 cursor-pointer"
 title="Mover arriba"
 >
 <ArrowUp className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => handleMoveSetlistItem(index, 'down')}
 disabled={index === activeSetlist.items.length - 1}
 className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-neutral-800 cursor-pointer"
 title="Mover abajo"
 >
 <ArrowDown className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => handleRemoveSetlistItem(it.id)}
 className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800 cursor-pointer"
 title="Quitar del setlist"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 );
 }
 })
 )}
 </div>
 </>
 ) : (
 <div className="text-center py-20 text-neutral-500 font-mono text-[10px]">
 Selecciona o crea un repertorio a la izquierda para empezar.
 </div>
 )}
 </div>
 </div>
 )}

 {/* VIEW 2: DISCOGRAFÍA & CATÁLOGO GENERAL DE TEMAS */}
 {activeTab === 'catalogo' && (
 <div className="space-y-5">
 {/* SPOTIFY PLAYLIST HERO BANNER */}
 <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#1b3e24] via-[#142318] to-[#121212] p-6 sm:p-8 border border-white/10 shadow-2xl">
   <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6">
     <div className="relative shrink-0 w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-[#181818] shadow-2xl overflow-hidden border border-white/10 flex items-center justify-center group">
       <AlbumCover
         title={`Repertorio ${bName}`}
         artist={bName}
         coverUrl={filteredSongs[0]?.portadaUrl}
         size={176}
         onPlay={() => {
           const first = filteredSongs[0];
           if (first) {
             handleSelectPlayerSong(first, true);
           }
         }}
         isPlaying={!!(activePlayerSong && isPlayerPlaying && filteredSongs.some(s => s.id === activePlayerSong.id))}
       />
       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
         <Sparkles className="w-8 h-8 text-[#1db954] animate-pulse" />
       </div>
     </div>

     <div className="flex-1 text-center md:text-left space-y-2">
       <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-mono font-extrabold uppercase tracking-widest text-[#1db954]">
         <Disc3 className="w-4 h-4 animate-spin-slow" />
         <span>Lista de Reproducción • Catálogo Completo</span>
       </div>
       <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
         Repertorio & Directos {bName}
       </h1>
       <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl font-mono leading-relaxed">
         Catálogo oficial de canciones para ensayos, giras y festivales. Gestiona audios, tonalidades, BPMs, partituras y estado de arreglos.
       </p>
       <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-mono text-zinc-400 pt-1">
         <span className="text-white font-bold">{bName}</span>
         <span>•</span>
         <span className="text-[#1db954] font-bold">{songs.length} temas cargados</span>
         <span>•</span>
         <span>{Math.round(songs.reduce((acc, s) => acc + (s.duracionSegundos || 210), 0) / 60)} min aprox.</span>
         <span>•</span>
         <span className="text-amber-400 font-semibold">{songs.filter(s => s.favoritoGeneral).length} Favoritos</span>
       </div>
     </div>
   </div>

   {/* HERO CONTROLS BAR */}
   <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/10 mt-6">
     <div className="flex items-center gap-4">
       <button
         onClick={() => {
           if (filteredSongs.length > 0) {
             const first = filteredSongs[0];
             handleSelectPlayerSong(first, true);
           }
         }}
         className="w-14 h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 text-black font-bold flex items-center justify-center shadow-2xl transition-all cursor-pointer active:scale-95"
         title="Reproducir Catálogo"
       >
         {activePlayerSong && isPlayerPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
       </button>

       <button
         onClick={() => setCatalogStatusFilter(catalogStatusFilter === 'favoritos' ? 'todos' : 'favoritos')}
         className={`px-4 py-2 rounded-full text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer border ${
           catalogStatusFilter === 'favoritos'
             ? 'bg-[#1db954]/20 text-[#1ed760] border-[#1db954]/40 shadow-md'
             : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white'
         }`}
       >
         <Sparkles className="w-4 h-4 text-[#1db954]" />
         <span>{catalogStatusFilter === 'favoritos' ? 'Mostrando solo Favoritos' : 'Filtrar Favoritos'}</span>
       </button>
     </div>

     <button
       id="btn-add-song"
       onClick={() => { setEditingSong(null); setShowSongModal(true); }}
       className="px-4 py-2 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-xs font-mono flex items-center gap-2 cursor-pointer shadow-lg transition-all hover:scale-105 active:scale-95"
     >
       <Plus className="w-4 h-4" />
       <span>Añadir Nuevo Tema</span>
     </button>
   </div>
 </div>

 {/* CATALOG FILTERS BAR */}
 <div className={`p-4 rounded-2xl flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center ${colors.card} `}>
 <div className="relative flex-1">
 <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
 <input
 id="search-songs"
 type="text"
 placeholder="Buscar temas por título, tonalidad, voz principal o notas..."
 value={catalogSearch}
 onChange={(e) => setCatalogSearch(e.target.value)}
 className={`w-full rounded-lg pl-9 ${catalogSearch ? 'pr-8' : 'pr-3'} py-1.5 text-[10px] focus:outline-none font-mono transition-all ${
 isStitchLight 
 ? 'bg-white text-slate-800 focus:border-indigo-500 placeholder:text-slate-400' 
 : 'bg-[#131313] text-[#e5e2e1] focus:border-[#f2ca50]/50 placeholder:text-neutral-600'
 }`}
 />
 {catalogSearch && (
 <button
 id="search-songs-clear"
 type="button"
 onClick={() => setCatalogSearch('')}
 className={`absolute right-2.5 top-2 p-0.5 rounded-full transition-colors cursor-pointer ${
 isStitchLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
 }`}
 title="Borrar búsqueda"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <div className="flex gap-2 flex-wrap sm:flex-nowrap">
 {/* Album dropdown */}
 <select
 value={catalogAlbumFilter}
 onChange={(e) => setCatalogAlbumFilter(e.target.value)}
 className={`text-[10px] font-mono py-1.5 px-3 rounded-lg focus:outline-none cursor-pointer ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#131313] text-neutral-200'
 }`}
 >
 <option value="todos">Todos los Discos / EPs</option>
 {albumsList.filter(a => a !== 'todos').map(alb => (
 <option key={alb} value={alb}>{alb}</option>
 ))}
 </select>

 {/* Status dropdown */}
 <select
 value={catalogStatusFilter}
 onChange={(e) => setCatalogStatusFilter(e.target.value)}
 className={`text-[10px] font-mono py-1.5 px-3 rounded-lg focus:outline-none cursor-pointer ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#131313] text-neutral-200'
 }`}
 >
 <option value="todos">Todos los estados</option>
 <option value="listo">Listo para Directo</option>
 <option value="ensayando">Ensayando</option>
 <option value="componiendo">Componiendo</option>
 <option value="descartado">Descartado</option>
            </select>
            <button
              onClick={() => setGroupByAlbum(!groupByAlbum)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${groupByAlbum ? (isStitchLight ? 'bg-indigo-100 text-indigo-700' : 'bg-[#f2ca50]/20 text-[#f2ca50]' ) : (isStitchLight ? 'bg-slate-50 text-slate-500' : 'bg-neutral-800 text-neutral-400')}`}
            >
              Agrupar por Álbum
            </button>

  <button
  id="btn-add-song"
  onClick={() => { setEditingSong(null); setShowSongModal(true); }}
  className="px-4 py-2 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-xs font-mono flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-lg transition-all hover:scale-105"
  >
  <Plus className="w-4 h-4" />
  <span>Añadir Tema</span>
  </button>
  </div>
  </div>

  {/* SPOTIFY TRACKLIST TABLE */}
  <div className="rounded-2xl overflow-hidden bg-[#121212] border border-zinc-800/80 shadow-2xl">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left border-collapse">
 <thead>
 <tr className="border-b border-zinc-800/80 text-[11px] font-mono uppercase tracking-wider text-zinc-400 bg-black/40">
 <th className="py-3 px-4 w-12 text-center">#</th>
 <th className="py-3 px-4">TÍTULO Y TEMA</th>
 <th className="py-3 px-4">ÁLBUM / ESTADO</th>
 <th className="py-3 px-4">TONALIDAD / BPM</th>
 <th className="py-3 px-4">DURACIÓN</th>
 <th className="py-3 px-4 text-right">ACCIONES</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-800/60 text-xs font-mono">
 {filteredSongs.length === 0 ? (
 <tr>
 <td colSpan={6} className="text-center py-12 text-zinc-500 font-mono text-xs">
 No se encontraron canciones con los filtros seleccionados.
 </td>
 </tr>
 ) : (
 filteredSongs.map((s, idx) => {
 const isPlayingCurrent = activePlayerSong?.id === s.id;
 const isDrive = isGoogleDriveUrl(s.audioPrincipalUrl || '');

 return (
 <tr
 key={`${s.id}-${idx}`}
 className={`group transition-all duration-150 cursor-pointer ${
   isPlayingCurrent 
     ? 'bg-[#1db954]/10 text-white' 
     : 'hover:bg-zinc-900/80 text-zinc-300'
 }`}
 >
 {/* Column 1: Track Number / Play Button */}
 <td className="py-3.5 px-4 text-center font-bold text-zinc-500">
 <button
 type="button"
 onClick={() => handleSelectPlayerSong(s, true)}
 className="w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer mx-auto group-hover:bg-[#1db954] group-hover:text-black"
 title={isPlayingCurrent && isPlayerPlaying ? "Pausar" : "Reproducir canción"}
 >
 {isPlayingCurrent ? (
 <div className="flex items-center gap-0.5">
 <span className="w-1 h-3 bg-[#1db954] rounded-full animate-pulse" />
 <span className="w-1 h-4 bg-[#1ed760] rounded-full animate-pulse delay-75" />
 <span className="w-1 h-2 bg-[#1db954] rounded-full animate-pulse delay-150" />
 </div>
 ) : (
 <>
 <span className="group-hover:hidden text-xs text-zinc-500 font-bold">{idx + 1}</span>
 <Play className="w-3.5 h-3.5 fill-current hidden group-hover:block ml-0.5 text-black" />
 </>
 )}
 </button>
 </td>

 {/* Column 2: Title & Details */}
 <td className="py-3.5 px-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden shrink-0 shadow-sm border border-white/5 flex items-center justify-center">
 {s.portadaUrl ? (
 <img src={s.portadaUrl} alt={s.titulo} className="w-full h-full object-cover" />
 ) : (
 <Music className={`w-5 h-5 ${isPlayingCurrent ? 'text-[#1db954]' : 'text-zinc-500'}`} />
 )}
 </div>

 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <span className={`font-bold text-sm ${isPlayingCurrent ? 'text-[#1db954]' : 'text-white group-hover:text-[#1db954] transition'}`}>
 {s.titulo}
 </span>

 <button
 type="button"
 onClick={(e) => {
   e.stopPropagation();
   handleUpdateSongFromStudio({ ...s, favoritoGeneral: !s.favoritoGeneral });
 }}
 className={`p-1 rounded-md transition-all cursor-pointer ${
   s.favoritoGeneral 
     ? 'text-[#1db954]' 
     : 'text-zinc-600 hover:text-[#1db954]'
 }`}
 title={s.favoritoGeneral ? "Tema Favorito para Repertorio" : "Marcar como Favorito"}
 >
 <Sparkles className={`w-3.5 h-3.5 ${s.favoritoGeneral ? 'fill-[#1db954]' : ''}`} />
 </button>

 {s.audioPrincipalUrl ? (
 <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
   <Volume2 className="w-3 h-3 text-emerald-400" />
   {isDrive ? 'Drive' : 'Audio OK'}
 </span>
 ) : (s.audioIdeas || []).length > 0 ? (
 <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
   {s.audioIdeas?.length} Ideas
 </span>
 ) : (
 <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">
   Demo Ensayo
 </span>
 )}
 </div>

 {s.notasInternas && (
 <p className="text-[11px] text-zinc-500 line-clamp-1 italic mt-0.5 font-sans">
 {s.notasInternas}
 </p>
 )}
 </div>
 </div>
 </td>

 {/* Column 3: Album & Status */}
 <td className="py-3.5 px-4 text-zinc-400">
 <div className="font-semibold text-zinc-300">{s.albumDisco || 'Sin Disco'}</div>
 <span className={`inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
 s.estadoTema === 'listo'
 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
 : s.estadoTema === 'ensayando'
 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
 : 'bg-zinc-800 text-zinc-500'
 }`}>
 {s.estadoTema === 'listo' ? 'Listo Directo' : s.estadoTema === 'ensayando' ? 'Ensayando' : s.estadoTema || 'componiendo'}
 </span>
 </td>

 {/* Column 4: Key & BPM */}
 <td className="py-3.5 px-4 text-zinc-300 font-mono">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded bg-[#1db954]/20 text-[#1ed760] font-bold text-xs border border-[#1db954]/30">
 {s.tonalidad || 'Am'}
 </span>
 <span className="text-zinc-400 text-xs">{s.bpm} BPM</span>
 </div>
 <div className="text-[10px] text-zinc-500 mt-0.5">{s.afinacion || 'E Standard'}</div>
 </td>

 {/* Column 5: Duration */}
 <td className="py-3.5 px-4 text-zinc-300 font-bold font-mono">
 {s.duracion}
 </td>

 {/* Column 6: Actions */}
 <td className="py-3.5 px-4 text-right">
 <div className="flex items-center justify-end gap-1.5">
 <button
 type="button"
 onClick={() => setActiveStudioSong(s)}
 className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
 title="Abrir Studio de Audios & Ideas"
 >
 <Headphones className="w-3.5 h-3.5 text-indigo-400" />
 <span>Studio</span>
 {(s.audioIdeas || []).length > 0 && (
 <span className="px-1.5 py-0.5 bg-indigo-500/40 text-white rounded-full text-[9px]">
 {(s.audioIdeas || []).length}
 </span>
 )}
 </button>

 <button
 type="button"
 onClick={() => setActiveChordsSong(s)}
 className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
 title="Ver Acordes y Ficha para Músicos Sustitutos"
 >
 <FileText className="w-3.5 h-3.5 text-amber-400" />
 <span>Acordes</span>
 </button>

 {s.enlaceAcordes && (
 <a
 href={s.enlaceAcordes}
 target="_blank"
 rel="noreferrer"
 className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
 title="Abrir Google Drive / Enlace Externo de Partitura"
 >
 <ExternalLink className="w-3.5 h-3.5" />
 </a>
 )}

 <button
 type="button"
 onClick={() => handleShareSong(s)}
 className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded-lg hover:bg-emerald-500/20 transition cursor-pointer"
 title="Compartir esta canción y ficha por WhatsApp"
 >
 <MessageSquare className="w-3.5 h-3.5 fill-emerald-400/20" />
 </button>

 <button
 type="button"
 onClick={() => { setEditingSong(s); setShowSongModal(true); }}
 className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
 title="Editar Canción"
 >
 <Edit3 className="w-3.5 h-3.5" />
 </button>

 <button
 type="button"
 onClick={() => handleDeleteSong(s.id)}
 className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition"
 title="Eliminar Canción"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {/* VIEW 2B: DISCOGRAFÍA SPOTIFY ALBUMS GRID */}
 {activeTab === 'discografia' && (
   <DiscografiaView
     songs={songs}
     albumsList={albumsList}
     colors={colors}
     isStitchLight={isStitchLight}
     setSongs={setSongs}
     toggleFavoriteSong={handleToggleFavorite}
     activePlayerSong={activePlayerSong}
     isPlayerPlaying={isPlayerPlaying}
     onSelectSong={(song, autoPlay) => handleSelectPlayerSong(song, autoPlay)}
     onRequestDeleteAlbum={(albumName, songCount) => setDeleteAlbumData({ albumName, songCount })}
     onEditAlbum={(albumName) => setAssignSongsModalData({ isOpen: true, albumName })}
     onCreateAlbum={() => setAssignSongsModalData({ isOpen: true, albumName: '' })}
   />
 )}

 {/* VIEW 3: MODO ESCENARIO (HIGH CONTRAST LIVE VIEW) */}
 {activeTab === 'escenario' && (
 <EscenarioView
 activeSetlist={activeSetlist}
 setlists={setlists}
 activeSetlistId={activeSetlistId}
 setActiveSetlistId={setActiveSetlistId}
 songs={songs}
 setShowPdfPreview={setShowPdfPreview}
 stageAudioRef={stageAudioRef}
 stagePlayingIndex={stagePlayingIndex}
 setStagePlayingIndex={setStagePlayingIndex}
 stageIsPlaying={stageIsPlaying}
 setStageIsPlaying={setStageIsPlaying}
 stageCurrentTime={stageCurrentTime}
 setStageCurrentTime={setStageCurrentTime}
 stageItemDuration={stageItemDuration}
 stageResolvedUrl={stageResolvedUrl}
 stageAutoplayNext={stageAutoplayNext}
 setStageAutoplayNext={setStageAutoplayNext}
 handleStageAudioEnded={handleStageAudioEnded}
 handleStageSeek={handleStageSeek}
 handleStagePrev={handleStagePrev}
 handleStageNext={handleStageNext}
 toggleStagePlayPause={toggleStagePlayPause}
 toggleFavoriteSong={handleToggleFavorite}
 setEditingShowItem={setEditingShowItem}
 setShowItemAudioUrl={setShowItemAudioUrl}
 setShowShowItemModal={setShowShowItemModal}
 formatItemDuration={formatItemDuration}
 />
 )}

 {/* MODAL: ADD / EDIT SONG */}
 <SongModal
   isOpen={showSongModal}
   editingSong={editingSong}
   defaultAlbumForNewSong={defaultAlbumForNewSong}
   albumsList={albumsList}
   colors={colors}
   isStitchLight={isStitchLight}
   onClose={() => setShowSongModal(false)}
   onSave={handleSaveSong}
 />
 {false && showSongModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
 <div className={`w-full max-w-lg p-5 rounded-2xl shadow-2xl my-auto max-h-[90vh] flex flex-col overflow-hidden border border-neutral-800 ${colors.card}`}>
 <div className="flex justify-between items-center pb-3">
 <h3 className={`text-sm font-bold font-mono uppercase ${colors.text}`}>
 {editingSong ? 'Editar Canción' : 'Añadir Nueva Canción al Catálogo'}
 </h3>
 <button onClick={() => setShowSongModal(false)} className="text-neutral-400 hover:text-white">
 <X className="w-4 h-4" />
 </button>
 </div>

 <form onSubmit={handleSaveSong} className="space-y-3 text-[10px] font-mono flex flex-col flex-1 overflow-hidden">
 <div className="space-y-3 overflow-y-auto pr-1 flex-1 pb-2">
 <div>
 <label className="block text-neutral-400 mb-1">Título de la Canción *</label>
 <input
 name="titulo"
 type="text"
 required
 defaultValue={editingSong?.titulo || ''}
 className={`w-full p-2.5 rounded-lg focus:outline-none border border-neutral-800 ${
 isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 placeholder="ej. Brisa y Cacharros"
 />
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
 <div>
 <label className="block text-neutral-400 mb-1">Tonalidad *</label>
 <input
 name="tonalidad"
 type="text"
 required
 defaultValue={editingSong?.tonalidad || 'Am'}
 className={`w-full p-2.5 rounded-lg focus:outline-none border border-neutral-800 ${
 isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 placeholder="ej. Am / G"
 />
 </div>

 <div>
 <label className="block text-neutral-400 mb-1">BPM</label>
 <input
 name="bpm"
 type="number"
 defaultValue={editingSong?.bpm || 120}
 className={`w-full p-2.5 rounded-lg focus:outline-none border border-neutral-800 ${
 isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 />
 </div>

 <div>
 <label className="block text-neutral-400 mb-1">Duración (mm:ss)</label>
 <input
 name="duracion"
 type="text"
 defaultValue={editingSong?.duracion || '3:30'}
 className={`w-full p-2.5 rounded-lg focus:outline-none border border-neutral-800 ${
 isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 placeholder="3:30"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-neutral-400 mb-1">Álbum / EP / Disco</label>
 <input
 name="albumDisco"
 type="text"
 defaultValue={editingSong?.albumDisco || 'Álbum Debut (2025)'}
 className={`w-full p-2.5 rounded-lg focus:outline-none border border-neutral-800 ${
 isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 />
 </div>

 <div>
 <label className="block text-neutral-400 mb-1">Afinación</label>
 <input
 name="afinacion"
 type="text"
 defaultValue={editingSong?.afinacion || 'E Standard'}
 className={`w-full p-2.5 rounded-lg focus:outline-none border border-neutral-800 ${
 isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 />
 </div>
 </div>

 <div>
 <label className="block text-neutral-400 mb-1">Estado del Tema</label>
 <select
 name="estadoTema"
 defaultValue={editingSong?.estadoTema || 'listo'}
 className={`w-full p-2.5 rounded-lg focus:outline-none border border-neutral-800 ${
 isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 >
 <option value="listo">Listo para Directo</option>
 <option value="ensayando">Ensayando</option>
 <option value="componiendo">Componiendo</option>
 <option value="descartado">Descartado</option>
          </select>
 </div>

 <div>
 <label className="block text-neutral-400 mb-1">Enlace a Partitura / Acordes (Google Drive / Ultimate Guitar)</label>
 <input
 name="enlaceAcordes"
 type="url"
 defaultValue={editingSong?.enlaceAcordes || ''}
 className={`w-full p-2.5 rounded-lg focus:outline-none border border-neutral-800 ${
 isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 placeholder="https://drive.google.com/..."
 />
 </div>

 {/* Audio Principal Definitivo Upload & Drive Link */}
 <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
   <label className="block text-amber-300 font-bold mb-1 flex items-center gap-1.5">
     <Volume2 className="w-3.5 h-3.5" />
     Audio Principal / Maqueta Definitiva del Tema
   </label>

   <div>
     <span className="text-[9px] text-neutral-400 block mb-1">Opción A: Pegar Enlace Compartido de Google Drive o URL de Audio:</span>
     <input
       name="audioPrincipalUrl"
       type="text"
       defaultValue={editingSong?.audioPrincipalUrl || ''}
       className={`w-full p-2.5 rounded-lg focus:outline-none text-xs font-mono border border-neutral-800 ${
         isStitchLight ? 'bg-white text-slate-800' : 'bg-neutral-900 text-white'
       }`}
       placeholder="ej. https://drive.google.com/file/d/1ABC.../view"
     />
   </div>

   <div>
     <span className="text-[9px] text-neutral-400 block mb-1">Opción B: Subir Archivo de Audio (MP3, WAV, M4A, OGG):</span>
     <input
       name="audioFile"
       type="file"
       accept="audio/*"
       className="w-full text-[10px] text-neutral-300 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-amber-500 file:text-zinc-950 hover:file:bg-amber-400 cursor-pointer"
     />
   </div>
 </div>

 <div>
	{/* Portada / Imagen de la Canción o Álbum */}
	<div className="p-3 rounded-xl border border-[#1db954]/30 bg-[#1db954]/5 space-y-2">
		<label className="block text-[#1ed760] font-bold mb-1 flex items-center gap-1.5 text-xs">
			<Camera className="w-4 h-4" />
			Portada / Imagen de la Canción o Álbum
		</label>

		<div>
			<span className="text-[9px] text-neutral-400 block mb-1">Opción A: Pegar URL de la portada (JPG, PNG, WebP):</span>
			<input
				name="portadaUrl"
				type="url"
				defaultValue={editingSong?.portadaUrl || ''}
				className={`w-full p-2.5 rounded-lg focus:outline-none text-xs font-mono border border-neutral-800 ${
					isStitchLight ? 'bg-white text-slate-800' : 'bg-neutral-900 text-white'
				}`}
				placeholder="https://.../portada.jpg"
			/>
		</div>

		<div>
			<span className="text-[9px] text-neutral-400 block mb-1">Opción B: Subir Imagen desde el Móvil o Galería:</span>
			<input
				name="portadaFile"
				type="file"
				accept="image/*"
				className="w-full text-[10px] text-neutral-300 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#1db954] file:text-black hover:file:bg-[#1ed760] cursor-pointer"
			/>
		</div>
	</div>

 <label className="block text-neutral-400 mb-1">Notas Internas & Estructura</label>
 <textarea
 name="notasInternas"
 rows={2}
 defaultValue={editingSong?.notasInternas || ''}
 className={`w-full p-2.5 rounded-lg focus:outline-none border border-neutral-800 ${
 isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 placeholder="ej. Intro solo con viento, estribillo fuerte..."
 />
 </div>
 </div>

 <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2 shrink-0 bg-transparent">
 <button
 type="button"
 onClick={() => setShowSongModal(false)}
 className="px-3 py-2 rounded-xl text-xs text-neutral-300 hover:bg-neutral-800 transition-colors font-semibold cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className={`px-4 py-2 rounded-xl text-xs font-bold transition-transform active:scale-95 cursor-pointer shadow-lg ${
 isStitchLight ? 'bg-sky-500 text-white' : 'bg-[#f2ca50] hover:bg-[#e0b840] text-zinc-950'
 }`}
 >
 Guardar Canción
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

  {/* MODAL: ASSIGN SETLIST TO CONCERT OR REHEARSAL */}
  <AssignSetlistModal
    assigningSetlist={assigningSetlist}
    colors={colors}
    isStitchLight={isStitchLight}
    concerts={concerts}
    rehearsals={rehearsals}
    selectedConcertToAssign={selectedConcertToAssign}
    onSelectEvent={(id) => setSelectedConcertToAssign(id)}
    onClose={() => setAssigningSetlist(null)}
    onSave={handleAssignSetlistToConcert}
  />

  {/* MODAL: ADD OR EDIT NON-SONG SHOW ITEM OR BLOCK */}
  {showShowItemModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
  <div className={`w-full max-w-lg p-6 rounded-2xl space-y-4 shadow-2xl ${colors.card} border border-sky-500/30`}>
  <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
  <div className="flex items-center gap-2">
  <span className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">⚡</span>
  <div>
  <h3 className={`text-sm font-extrabold font-mono uppercase ${colors.text}`}>
  {editingShowItem ? 'Editar Interludio / Evento del Show' : 'Nuevo Interludio / Bloque del Show'}
  </h3>
  <p className="text-[10px] text-neutral-400 font-sans">
  Organiza momentos del directo (beatbox, presentaciones, bloque de temas, pausas).
  </p>
  </div>
  </div>
  <button 
  onClick={() => { setShowShowItemModal(false); setEditingShowItem(null); }} 
  className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 cursor-pointer"
  >
  <X className="w-5 h-5" />
  </button>
  </div>

  <form onSubmit={(e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const formData = new FormData(form);
  const tipo = formData.get('tipoItem') as SetlistItem['tipoItem'];
  const titulo = formData.get('tituloCustom') as string;
  const min = parseInt(formData.get('minutos') as string, 10) || 0;
  const seg = parseInt(formData.get('segundos') as string, 10) || 0;
  const totalSeg = min * 60 + seg;
  const notas = formData.get('notaTema') as string;

  handleSaveShowItem({
  tipoItem: tipo,
  tituloCustom: titulo,
  duracionEstimadaMinutos: Math.ceil(totalSeg / 60),
  duracionEstimadaSegundos: totalSeg,
  notaTema: notas
  });
  }} className="space-y-4 text-xs font-mono">

  <div>
  <label className="block text-neutral-300 font-bold mb-1">Categoría del Evento *</label>
  <select
  name="tipoItem"
  defaultValue={editingShowItem?.tipoItem || 'presentacion'}
  className={`w-full p-2.5 rounded-xl border border-neutral-800 focus:outline-none cursor-pointer ${
  isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
  }`}
  onChange={(e) => {
  const val = e.target.value as keyof typeof SHOW_ITEM_TYPES;
  const titleInput = (e.target.form?.elements.namedItem('tituloCustom') as HTMLInputElement);
  if (titleInput && (!titleInput.value || Object.values(SHOW_ITEM_TYPES).some(t => t.label === titleInput.value))) {
  if (SHOW_ITEM_TYPES[val]) {
  titleInput.value = SHOW_ITEM_TYPES[val].label;
  }
  }
  }}
  >
  {Object.entries(SHOW_ITEM_TYPES).map(([key, config]) => (
  <option key={key} value={key}>
  {config.icon} {config.label}
  </option>
  ))}
  </select>
  </div>

  <div>
  <label className="block text-neutral-300 font-bold mb-1">Título / Nombre en la Hoja de Escenario *</label>
  <input
  name="tituloCustom"
  type="text"
  required
  defaultValue={editingShowItem?.tituloCustom || 'Presentación de la Banda'}
  placeholder="Ej: Solo Beatbox Filgue, Presentación Larra, Intro Acústica..."
  className={`w-full p-2.5 rounded-xl border border-neutral-800 focus:outline-none ${
  isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
  }`}
  />
  </div>

  <div className="p-3 bg-black/40 rounded-xl border border-neutral-800 space-y-2">
  <label className="block text-amber-400 font-bold text-[11px] flex items-center gap-1.5">
  <Clock className="w-3.5 h-3.5" />
  Tiempo Asignado al Evento (Minutos y Segundos) *
  </label>
  <div className="grid grid-cols-2 gap-3">
  <div>
  <span className="text-[10px] text-neutral-400 block mb-1">Minutos:</span>
  <input
  name="minutos"
  type="number"
  min="0"
  max="60"
  defaultValue={editingShowItem?.duracionEstimadaSegundos ? Math.floor(editingShowItem.duracionEstimadaSegundos / 60) : (editingShowItem?.duracionEstimadaMinutos || 2)}
  className={`w-full p-2 rounded-lg border border-neutral-800 text-center font-bold text-sm ${
  isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
  }`}
  />
  </div>
  <div>
  <span className="text-[10px] text-neutral-400 block mb-1">Segundos:</span>
  <input
  name="segundos"
  type="number"
  min="0"
  max="59"
  defaultValue={editingShowItem?.duracionEstimadaSegundos ? (editingShowItem.duracionEstimadaSegundos % 60) : 0}
  className={`w-full p-2 rounded-lg border border-neutral-800 text-center font-bold text-sm ${
  isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
  }`}
  />
  </div>
  </div>
  <p className="text-[9px] text-neutral-400 italic">
  Este tiempo se suma automáticamente a la duración total del concierto.
  </p>
  </div>

  <div>
  <label className="block text-neutral-300 font-bold mb-1">Notas / Cues para la Banda / Sonido (Opcional)</label>
  <textarea
  name="notaTema"
  rows={2}
  defaultValue={editingShowItem?.notaTema || ''}
  placeholder="Ej: Foco rojo a Filgue, aviso de merchandising en mesa, cambio a guitarra en Drop D..."
  className={`w-full p-2.5 rounded-xl border border-neutral-800 focus:outline-none ${
  isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
  }`}
  />
  </div>

  <div className="p-3 bg-black/40 rounded-xl border border-sky-500/30 space-y-3">
  <div className="flex items-center justify-between">
    <label className="block text-sky-400 font-bold text-[11px] flex items-center gap-1.5">
      <Mic className="w-3.5 h-3.5" />
      Audio de la Presentación / Chapa / Ensayo
    </label>
    {showItemAudioUrl && (
      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
        <Check className="w-3 h-3" /> Audio Guardado
      </span>
    )}
  </div>

  <div className="flex flex-wrap items-center gap-2">
    {isRecordingShowItem ? (
      <button
        type="button"
        onClick={handleStopRecordingShowItem}
        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 animate-pulse cursor-pointer shadow-lg"
      >
        <Square className="w-3.5 h-3.5 fill-current" />
        <span>Detener Grabación ({recordingShowItemSecs}s)</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={handleStartRecordingShowItem}
        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
      >
        <Mic className="w-3.5 h-3.5" />
        <span>{showItemAudioUrl ? 'Regrabar Voz' : 'Grabar Voz'}</span>
      </button>
    )}

    <label className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-neutral-700">
      <Upload className="w-3.5 h-3.5 text-sky-400" />
      <span>Subir MP3 / WAV</span>
      <input
        type="file"
        accept="audio/*"
        onChange={handleShowItemAudioFileUpload}
        className="hidden"
      />
    </label>

    {showItemAudioUrl && (
      <button
        type="button"
        onClick={() => {
          setShowItemAudioUrl('');
          setRecordingShowItemSecs(0);
        }}
        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 cursor-pointer"
        title="Eliminar Audio"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )}
  </div>

  {showItemAudioUrl && (
    <div className="pt-1">
      <audio src={showItemAudioUrl} controls className="w-full h-8 accent-sky-500" />
    </div>
  )}

  <p className="text-[9px] text-neutral-400 italic">
    Graba o sube la charla o performance para medir la duración exacta e incluirla en el reproductor del concierto.
  </p>
  </div>

  <div className="pt-2 flex justify-end gap-2">
  <button
  type="button"
  onClick={() => { setShowShowItemModal(false); setEditingShowItem(null); }}
  className="px-3 py-2 rounded-xl text-neutral-400 hover:bg-neutral-800 text-xs font-mono cursor-pointer"
  >
  Cancelar
  </button>
  <button
  type="submit"
  className="px-4 py-2 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-400 shadow-lg text-xs font-mono cursor-pointer flex items-center gap-1.5"
  >
  <span>Guardar en Setlist</span>
  </button>
  </div>
  </form>
  </div>
  </div>
  )}


      {/* PDF Preview Modal */}
      <PdfExportModal
        isOpen={showPdfPreview}
        activeSetlist={activeSetlist}
        activeSetlistMetrics={activeSetlistMetrics}
        songs={songs}
        isStitchLight={isStitchLight}
        onClose={() => setShowPdfPreview(false)}
      />

 {activeStudioSong && (
 <SongStudioModal
 song={activeStudioSong}
 colors={colors}
 isStitchLight={isStitchLight}
 onClose={() => setActiveStudioSong(null)}
 onUpdateSong={handleUpdateSongFromStudio}
 />
 )}

 {/* Persistent Spotify Music Player Bottom Bar */}
 {activePlayerSong && (
 <SpotifyPlayerBar
 song={activePlayerSong}
 songs={songs}
 colors={colors}
 onSelectSong={(newSong, autoPlay) => handleSelectPlayerSong(newSong, autoPlay)}
 onOpenStudio={(songToOpen) => setActiveStudioSong(songToOpen)}
 onUpdateSong={handleUpdateSongFromStudio}
 onClosePlayer={() => handleSelectPlayerSong(null)}
 autoPlay={playerAutoPlay}
 playSignal={playSignal}
 onIsPlayingChange={setIsPlayerPlaying}
 />
 )}

{activeTab === 'configuracion' && (
  <FavoritosGeneralesView
    songs={songs}
    colors={colors}
    isStitchLight={isStitchLight}
    onUpdateSong={handleUpdateSongFromStudio}
  />
)}
{assignSongsModalData && assignSongsModalData.isOpen && (
  <AssignSongsToAlbumModal
    isOpen={assignSongsModalData.isOpen}
    albumName={assignSongsModalData.albumName}
    songs={songs}
    colors={colors}
    isStitchLight={isStitchLight}
    onClose={() => setAssignSongsModalData(null)}
    onSaveAlbumSongs={handleSaveAlbumSongs}
  />
)}

{setlistModalData && setlistModalData.isOpen && (
  <SetlistModal
    isOpen={setlistModalData.isOpen}
    setlistToEdit={setlistModalData.setlistToEdit}
    colors={colors}
    isStitchLight={isStitchLight}
    onClose={() => setSetlistModalData(null)}
    onSave={handleSaveSetlistModal}
  />
)}
  {/* CHORDS AND SUBSTITUTE GUIDE VIEWER MODAL */}
  {activeChordsSong && (
    <SongChordsViewerModal
      song={activeChordsSong}
      onClose={() => setActiveChordsSong(null)}
      onUpdateSong={handleUpdateSongFromChords}
    />
  )}

  {/* CONFIRM DELETE MODAL DIALOG */}
  <ConfirmDeleteModal
    data={confirmDeleteModal}
    onClose={() => setConfirmDeleteModal(null)}
  />

  {/* CONFIRM DELETE ALBUM MODAL DIALOG */}
  <ConfirmDeleteAlbumModal
    data={deleteAlbumData}
    onClose={() => setDeleteAlbumData(null)}
    onUnassignSongs={handleUnassignAlbumSongs}
    onDeleteAlbumAndSongs={handleDeleteAlbumAndSongs}
  />

  {/* SHARE MODAL */}
  <ShareModal
    isOpen={shareModalData.isOpen}
    onClose={() => setShareModalData(prev => ({ ...prev, isOpen: false }))}
    title={shareModalData.title}
    subtitle={shareModalData.subtitle}
    initialText={shareModalData.text}
    itemType={shareModalData.itemType}
  />
</div>
 );
}
