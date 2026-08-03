import React, { useState, useEffect, useMemo } from 'react';
import { ThemeColors, Song, Setlist, SetlistItem, Concert, Rehearsal } from '../types';
import { 
 Disc3, Music, Plus, Search, X, Edit3, Trash2, ArrowUp, ArrowDown, Copy, 
 Download, Clock, Mic, FileText, Check, Layers, ExternalLink, Printer, 
 Sparkles, Sliders, CheckCircle2, ChevronRight, HelpCircle, Eye
} from 'lucide-react';

interface RepertorioSetlistsProps {
 colors: ThemeColors;
 concerts: Concert[];
 rehearsals: Rehearsal[];
 onUpdateConcert?: (id: string, fields: Partial<Concert>) => void;
 onUpdateRehearsal?: (id: string, fields: Partial<Rehearsal>) => void;
}

const DEFAULT_SONGS: Song[] = [
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
 descripcion: 'Repertorio de máxima energía para festivales y horarios reducidos',
 tipoFormato: 'festival',
 duracionTotalEstimadaMinutos: 45,
 fechaCreacion: '2026-03-01',
 fechaUltimaEdicion: '2026-08-01',
 items: [
 { id: 'i-1', songId: 'song-1', tipoItem: 'cancion', notaTema: 'Arrancar directo sin intro' },
 { id: 'i-2', songId: 'song-2', tipoItem: 'cancion', notaTema: 'Empalmar batería con final de Brisa' },
 { id: 'i-3', songId: 'song-4', tipoItem: 'cancion', notaTema: 'Subidón ska' },
 { id: 'i-4', tipoItem: 'chapa', tituloCustom: 'Chapa / Presentación Banda & Agradecimientos', duracionEstimadaMinutos: 2, notaTema: 'Jon / Jose habla al público' },
 { id: 'i-5', songId: 'song-3', tipoItem: 'cancion', notaTema: 'Cambio de guitarra a Drop D' },
 { id: 'i-6', songId: 'song-6', tipoItem: 'cancion', notaTema: 'Estribillo con coros del público' },
 { id: 'i-7', tipoItem: 'bis', tituloCustom: 'BIS / CIERRE DE FESTIVAL', duracionEstimadaMinutos: 1 },
 { id: 'i-8', songId: 'song-5', tipoItem: 'cancion', notaTema: 'Solo final de violín extendido' }
 ]
 },
 {
 id: 'setlist-2',
 nombre: 'Concierto Sala Larga 75 min',
 descripcion: 'Setlist completo con temas del disco, covers y bloque acústico',
 tipoFormato: 'sala_larga',
 duracionTotalEstimadaMinutos: 75,
 fechaCreacion: '2026-04-10',
 fechaUltimaEdicion: '2026-07-20',
 items: [
 { id: 'i-21', songId: 'song-1', tipoItem: 'cancion' },
 { id: 'i-22', songId: 'song-6', tipoItem: 'cancion' },
 { id: 'i-23', songId: 'song-3', tipoItem: 'cancion' },
 { id: 'i-24', songId: 'song-8', tipoItem: 'cancion', notaTema: 'Cover festivo' },
 { id: 'i-25', tipoItem: 'chapa', tituloCustom: 'Chapa Merch & Agradecimiento a Sala', duracionEstimadaMinutos: 3 },
 { id: 'i-26', songId: 'song-7', tipoItem: 'cancion', notaTema: 'Tema nuevo en prueba' },
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
 onUpdateConcert,
 onUpdateRehearsal
}: RepertorioSetlistsProps) {
 const isStitchLight = colors.name === 'stitch_light';

 // Navigation tab inside module
 const [activeTab, setActiveTab] = useState<'catalogo' | 'setlists' | 'escenario'>('setlists');

 // Songs Repertoire State
 const [songs, setSongs] = useState<Song[]>(() => {
 try {
 const saved = localStorage.getItem('bakandeya_songs_catalog');
 return saved ? JSON.parse(saved) : DEFAULT_SONGS;
 } catch {
 return DEFAULT_SONGS;
 }
 });

 // Setlists State
 const [setlists, setSetlists] = useState<Setlist[]>(() => {
 try {
 const saved = localStorage.getItem('bakandeya_setlists_data');
 return saved ? JSON.parse(saved) : DEFAULT_SETLISTS;
 } catch {
 return DEFAULT_SETLISTS;
 }
 });

 // Selected Active Setlist ID
 const [activeSetlistId, setActiveSetlistId] = useState<string>(() => {
 return setlists[0]?.id || '';
 });

 // Filter States for Catalog
 const [catalogSearch, setCatalogSearch] = useState('');
 const [catalogAlbumFilter, setCatalogAlbumFilter] = useState<string>('todos');
 const [catalogStatusFilter, setCatalogStatusFilter] = useState<string>('todos');

 // Song Modal State
 const [showSongModal, setShowSongModal] = useState(false);
 const [editingSong, setEditingSong] = useState<Song | null>(null);

 // Setlist Assign Modal State
 const [assigningSetlist, setAssigningSetlist] = useState<Setlist | null>(null);
 const [selectedConcertToAssign, setSelectedConcertToAssign] = useState<string>('');

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
 if (dataS.songs && Array.isArray(dataS.songs) && dataS.songs.length > 0) {
 setSongs(dataS.songs);
 }
 }

 if (resSetlists.ok) {
 const dataSt = await resSetlists.json();
 if (dataSt.setlists && Array.isArray(dataSt.setlists) && dataSt.setlists.length > 0) {
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
 try {
 localStorage.setItem('bakandeya_songs_catalog', JSON.stringify(songs));
 } catch (e) {
 console.error('Error saving songs catalog:', e);
 }
 }, [songs]);

 useEffect(() => {
 try {
 localStorage.setItem('bakandeya_setlists_data', JSON.stringify(setlists));
 } catch (e) {
 console.error('Error saving setlists:', e);
 }
 }, [setlists]);

 const syncSetlistToBackend = (updatedSetlist: Setlist) => {
 fetch(`/api/setlists/${updatedSetlist.id}`, {
 method: 'PUT',
 headers: getHeaders(),
 body: JSON.stringify(updatedSetlist)
 }).catch(err => console.error('Error updating setlist on server:', err));
 };

 const activeSetlist = useMemo(() => {
 return setlists.find(s => s.id === activeSetlistId) || setlists[0] || null;
 }, [setlists, activeSetlistId]);

 // Unique album list for filter dropdown
 const albumsList = useMemo(() => {
 const list = songs.map(s => s.albumDisco).filter(Boolean) as string[];
 return ['todos', ...new Set(list)];
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

 // Calculate active setlist metrics
 const activeSetlistMetrics = useMemo(() => {
 if (!activeSetlist) return { totalSeconds: 0, formattedTime: '0 min', songCount: 0, avgBpm: 0 };
 let totalSec = 0;
 let songCount = 0;
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
 } else if (item.duracionEstimadaMinutos) {
 totalSec += item.duracionEstimadaMinutos * 60;
 }
 });

 return {
 totalSeconds: totalSec,
 formattedTime: formatSecondsToMinutes(totalSec),
 songCount,
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
 notasInternas
 };
 setSongs(prev => prev.map(s => s.id === editingSong.id ? updatedSong : s));
 fetch(`/api/songs/${editingSong.id}`, {
 method: 'PUT',
 headers: getHeaders(),
 body: JSON.stringify(updatedSong)
 }).catch(err => console.error('Error updating song on server:', err));
 } else {
 const newSong: Song = {
 id: `song-${Date.now()}`,
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
 notasInternas
 };
 setSongs(prev => [newSong, ...prev]);
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
 if (confirm('¿Seguro que deseas eliminar esta canción del catálogo del grupo?')) {
 setSongs(prev => prev.filter(s => s.id !== songId));
 // Remove from setlists
 setSetlists(prev => prev.map(st => ({
 ...st,
 items: st.items.filter(it => it.songId !== songId)
 })));

 fetch(`/api/songs/${songId}`, {
 method: 'DELETE',
 headers: getHeaders()
 }).catch(err => console.error('Error deleting song on server:', err));
 }
 };

 // Setlist Operations
 const handleCreateSetlist = () => {
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
 items: songs.slice(0, 5).map((s, idx) => ({
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
 if (confirm('¿Eliminar este repertorio guardado?')) {
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
 };

 // Setlist Item Manipulation
 const handleAddItemToSetlist = (songId?: string, tipoItem: 'cancion' | 'chapa' | 'descanso' | 'bis' = 'cancion') => {
 if (!activeSetlist) return;

 let newItem: SetlistItem = {
 id: `it-${Date.now()}`,
 tipoItem,
 songId
 };

 if (tipoItem === 'chapa') {
 newItem.tituloCustom = 'Presentación / Chapa al Público';
 newItem.duracionEstimadaMinutos = 2;
 } else if (tipoItem === 'descanso') {
 newItem.tituloCustom = 'Pausa / Afinación de Instrumentos';
 newItem.duracionEstimadaMinutos = 1;
 } else if (tipoItem === 'bis') {
 newItem.tituloCustom = '=== BIS / PARTE FINAL ===';
 }

 const updatedSetlist: Setlist = {
 ...activeSetlist,
 fechaUltimaEdicion: new Date().toISOString().split('T')[0],
 items: [...activeSetlist.items, newItem]
 };

 setSetlists(prev => prev.map(st => st.id === activeSetlist.id ? updatedSetlist : st));
 syncSetlistToBackend(updatedSetlist);
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
 -bottom: 1px solid #222; 
 font-size: 22px; 
 font-weight: bold; 
 }
 .num { color: #f2ca50; width: 40px; font-family: monospace; }
 .key-badge { 
 display: inline-block; 
 background: #222; 
 color: #10b981; 
 padding: 4px 10px; 
 -radius: 6px; 
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
 } else {
 return `
 <tr style="background:#111;">
 <td class="num" style="color:#666;">-</td>
 <td colspan="4" class="${it.tipoItem === 'chapa' ? 'chapa' : 'bis'}">
 📢 ${it.tituloCustom || 'Pausa / Intervención'}
 ${it.notaTema ? `<span class="note">${it.notaTema}</span>` : ''}
 </td>
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
 <div className={`p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${colors.card} `}>
       {/* HEADER / TITULO PRINCIPAL */}
      <div className="mb-2">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-zinc-100 mb-2">Repertorio</h1>
        <p className="text-sm font-mono text-zinc-400 uppercase tracking-widest">Gestión de Setlists y Documentos</p>
      </div>

 {/* NAVIGATION SUBTABS */}
 <div className="flex gap-1.5 p-1 bg-black/40 rounded-xl w-full md:w-auto overflow-x-auto">
 <button
 id="tab-setlists"
 onClick={() => setActiveTab('setlists')}
 className={`flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
 activeTab === 'setlists'
 ? isStitchLight ? 'bg-slate-900 text-white shadow-sm font-semibold' : 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
 : 'text-neutral-400 hover:text-white'
 }`}
 >
 <Layers className="w-3.5 h-3.5" />
 <span>Setlists & Directos ({setlists.length})</span>
 </button>

 <button
 id="tab-catalogo"
 onClick={() => setActiveTab('catalogo')}
 className={`flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
 activeTab === 'catalogo'
 ? isStitchLight ? 'bg-slate-900 text-white shadow-sm font-semibold' : 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
 : 'text-neutral-400 hover:text-white'
 }`}
 >
 <Music className="w-3.5 h-3.5" />
 <span>Discografía & Temas ({songs.length})</span>
 </button>

 <button
 id="tab-escenario"
 onClick={() => setActiveTab('escenario')}
 className={`flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
 activeTab === 'escenario'
 ? isStitchLight ? 'bg-slate-900 text-white shadow-sm font-semibold' : 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
 : 'text-neutral-400 hover:text-white'
 }`}
 >
 <Eye className="w-3.5 h-3.5" />
 <span>Modo Escenario</span>
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
 ? 'bg-white hover:-slate-300'
 : 'bg-[#131313] hover:-neutral-700'
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
 className={`text-sm sm:text-base font-bold font-mono -dashed focus:-amber-400 bg-transparent focus:outline-none ${colors.text}`}
 />
 </div>
 <p className="text-[10px] text-neutral-400 mt-1">
 {activeSetlist.descripcion || 'Haz clic para personalizar las canciones de esta lista'}
 </p>
 </div>

 <div className="flex items-center gap-2 flex-wrap">
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
 onClick={handlePrintStageSetlist}
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
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-black/30">
 <div>
 <span className="text-[10px] font-mono text-neutral-400 uppercase block">Temas Totales</span>
 <span className="text-sm font-bold font-mono text-white">{activeSetlistMetrics.songCount} canciones</span>
 </div>
 <div>
 <span className="text-[10px] font-mono text-neutral-400 uppercase block">Duración Estimada</span>
 <span className="text-sm font-bold font-mono text-[#d1b375]">{activeSetlistMetrics.formattedTime}</span>
 </div>
 <div>
 <span className="text-[10px] font-mono text-neutral-400 uppercase block">BPM Promedio</span>
 <span className="text-sm font-bold font-mono text-[#10b981]">{activeSetlistMetrics.avgBpm} BPM</span>
 </div>
 <div>
 <span className="text-[10px] font-mono text-neutral-400 uppercase block">Última Edición</span>
 <span className="text-[10px] font-mono text-neutral-300">{activeSetlist.fechaUltimaEdicion}</span>
 </div>
 </div>

 {/* ADD ITEMS ACTION BAR */}
 <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
 <span className="text-[10px] font-mono text-neutral-400 uppercase whitespace-nowrap">Añadir al Repertorio:</span>
 
 {/* Select song from catalog */}
 <select
 onChange={(e) => {
 if (e.target.value) {
 handleAddItemToSetlist(e.target.value, 'cancion');
 e.target.value = '';
 }
 }}
 className={`text-[10px] font-mono py-1 px-2.5 rounded-lg focus:outline-none cursor-pointer ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-neutral-900 text-[#d1b375]'
 }`}
 >
 <option value="">+ Seleccionar Tema de Discografía...</option>
 {songs.map(s => (
 <option key={s.id} value={s.id}>
 {s.titulo} ({s.tonalidad} • {s.duracion})
 </option>
 ))}
 </select>

 <button
 onClick={() => handleAddItemToSetlist(undefined, 'chapa')}
 className="px-2 py-1 text-[10px] font-mono rounded-lg bg-[#d1b375]/15 text-[#d1b375] hover:bg-[#d1b375]/15 whitespace-nowrap cursor-pointer"
 >
 + Intervención / Chapa
 </button>

 <button
 onClick={() => handleAddItemToSetlist(undefined, 'descanso')}
 className="px-2 py-1 text-[10px] font-mono rounded-lg bg-neutral-900 text-neutral-300 hover:bg-neutral-800 whitespace-nowrap cursor-pointer"
 >
 + Pausa / Afinación
 </button>

 <button
 onClick={() => handleAddItemToSetlist(undefined, 'bis')}
 className="px-2 py-1 text-[10px] font-mono rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/15 whitespace-nowrap cursor-pointer"
 >
 + Bloque BIS
 </button>
 </div>

 {/* ITEMS LIST */}
 <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
 {activeSetlist.items.length === 0 ? (
 <div className="text-center py-10 -dashed rounded-xl text-neutral-500 text-[10px] font-mono">
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
 } else {
 return (
 <div
 key={it.id}
 className={`p-2.5 rounded-xl flex items-center justify-between gap-3 ${
 it.tipoItem === 'chapa'
 ? 'bg-[#d1b375]/15 text-[#d1b375]'
 : it.tipoItem === 'bis'
 ? 'bg-rose-500/15 text-rose-400'
 : 'bg-neutral-900 text-neutral-400'
 }`}
 >
 <div className="flex items-center gap-2 min-w-0 font-mono text-[10px] font-bold">
 <span>📢</span>
 <input
 type="text"
 value={it.tituloCustom || ''}
 onChange={(e) => {
 const val = e.target.value;
 setSetlists(prev => prev.map(s => s.id === activeSetlist.id ? {
 ...s,
 items: s.items.map(x => x.id === it.id ? { ...x, tituloCustom: val } : x)
 } : s));
 }}
 className="bg-transparent -dashed focus:outline-none w-full max-w-sm"
 />
 </div>

 <div className="flex items-center gap-1 shrink-0">
 <button
 onClick={() => handleMoveSetlistItem(index, 'up')}
 disabled={index === 0}
 className="p-1 hover:text-white disabled:opacity-30"
 >
 <ArrowUp className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => handleMoveSetlistItem(index, 'down')}
 disabled={index === activeSetlist.items.length - 1}
 className="p-1 hover:text-white disabled:opacity-30"
 >
 <ArrowDown className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => handleRemoveSetlistItem(it.id)}
 className="p-1 hover:text-rose-400"
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
 <div className="space-y-4">
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
 ? 'bg-white text-slate-800 focus:-indigo-500 placeholder:text-slate-400' 
 : 'bg-[#131313] text-[#e5e2e1] focus:-[#f2ca50]/50 placeholder:text-neutral-600'
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
 id="btn-add-song"
 onClick={() => { setEditingSong(null); setShowSongModal(true); }}
 className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
 isStitchLight ? 'bg-sky-500/15 text-white hover:bg-sky-500/15' : 'bg-[#f2ca50] text-black hover:bg-[#d1b375]/15 font-extrabold'
 }`}
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Añadir Tema</span>
 </button>
 </div>
 </div>

 {/* SONGS GRID / TABLE */}
 <div className={`rounded-2xl overflow-hidden ${colors.card} `}>
 <div className="overflow-x-auto">
 <table className="w-full text-left -collapse">
 <thead>
 <tr className={` text-[10px] font-mono uppercase tracking-wider ${
 isStitchLight ? 'bg-slate-100 text-slate-500' : 'bg-neutral-900/90 text-neutral-400'
 }`}>
 <th className="p-3 pl-4">Canción / Álbum</th>
 <th className="p-3">Tonalidad</th>
 <th className="p-3">BPM</th>
 <th className="p-3">Duración</th>
 <th className="p-3">Afinación</th>
 <th className="p-3">Estado</th>
 <th className="p-3 text-right pr-4">Acciones</th>
 </tr>
 </thead>
 <tbody className=" /60 text-[10px] font-mono">
 {filteredSongs.length === 0 ? (
 <tr>
 <td colSpan={7} className="text-center py-12 text-neutral-500 font-mono text-[10px]">
 No se encontraron canciones con los filtros seleccionados.
 </td>
 </tr>
 ) : (
 filteredSongs.map(s => (
 <tr key={s.id} className="hover:bg-neutral-800/30 transition-colors">
 <td className="p-3 pl-4">
 <div className="font-bold text-sm text-[#d1b375]">{s.titulo}</div>
 <div className="text-[10px] text-neutral-400 font-sans mt-0.5">
 {s.albumDisco || 'Sin Disco Asignado'} {s.esVersionCovers && <span className="text-pink-400 font-mono ml-1">(Cover)</span>}
 </div>
 {s.notasInternas && (
 <div className="text-[10px] text-neutral-500 line-clamp-1 italic mt-0.5">
 {s.notasInternas}
 </div>
 )}
 </td>

 <td className="p-3">
 <span className="px-2 py-1 rounded bg-[#10b981]/15 text-[#10b981] font-bold">
 {s.tonalidad}
 </span>
 </td>

 <td className="p-3 text-neutral-300">
 {s.bpm} BPM
 </td>

 <td className="p-3 text-[#d1b375] font-bold">
 {s.duracion}
 </td>

 <td className="p-3 text-neutral-300 font-mono text-[10px]">
 {s.afinacion || 'E Standard'}
 </td>

 <td className="p-3">
 <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${
 s.estadoTema === 'listo'
 ? (isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]')
 : s.estadoTema === 'ensayando'
 ? 'bg-[#d1b375]/15 text-[#d1b375]'
 : 'bg-neutral-800 text-neutral-400'
 }`}>
 {s.estadoTema === 'listo' ? 'Listo Directo' : s.estadoTema === 'ensayando' ? 'Ensayando' : s.estadoTema}
 </span>
 </td>

 <td className="p-3 text-right pr-4">
 <div className="flex items-center justify-end gap-1.5">
 {s.enlaceAcordes && (
 <a
 href={s.enlaceAcordes}
 target="_blank"
 rel="noreferrer"
 className="p-1 text-neutral-400 hover:text-[#d1b375] rounded hover:bg-neutral-800"
 title="Ver Acordes / Partitura"
 >
 <ExternalLink className="w-3.5 h-3.5" />
 </a>
 )}
 <button
 onClick={() => { setEditingSong(s); setShowSongModal(true); }}
 className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 cursor-pointer"
 title="Editar Canción"
 >
 <Edit3 className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => handleDeleteSong(s.id)}
 className="p-1 text-neutral-400 hover:text-rose-400 rounded hover:bg-neutral-800 cursor-pointer"
 title="Eliminar Canción"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {/* VIEW 3: MODO ESCENARIO (HIGH CONTRAST LIVE VIEW) */}
 {activeTab === 'escenario' && (
 <div className="p-4 sm:p-6 rounded-2xl bg-black space-y-6 text-white shadow-2xl">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
 <div>
 <span className="text-[10px] font-mono font-bold text-[#d1b375] uppercase tracking-widest block">
 🔴 Vista de Alto Contraste para Escenario
 </span>
 <h2 className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
 {activeSetlist ? activeSetlist.nombre : 'Sin Setlist Seleccionado'}
 </h2>
 </div>

 <div className="flex items-center gap-2">
 <select
 value={activeSetlistId}
 onChange={(e) => setActiveSetlistId(e.target.value)}
 className="bg-neutral-900 text-[#d1b375] text-[10px] font-mono py-2 px-3 rounded-xl focus:outline-none"
 >
 {setlists.map(s => (
 <option key={s.id} value={s.id}>{s.nombre}</option>
 ))}
 </select>

 <button
 onClick={handlePrintStageSetlist}
 className="px-2 py-1 bg-[#f2ca50] text-black font-mono font-extrabold text-[10px] rounded-xl hover:bg-[#d1b375]/15 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
 >
 <Printer className="w-4 h-4" />
 <span>Imprimir / Exportar</span>
 </button>
 </div>
 </div>

 {activeSetlist ? (
 <div className="space-y-3">
 <div className="grid grid-cols-12 text-[10px] font-mono font-bold text-neutral-400 uppercase pb-2">
 <div className="col-span-1">#</div>
 <div className="col-span-6">TÍTULO DEL TEMA</div>
 <div className="col-span-2 text-center">TONO</div>
 <div className="col-span-1 text-center">BPM</div>
 <div className="col-span-2 text-right">TIEMPO</div>
 </div>

 {activeSetlist.items.map((it, idx) => {
 if (it.tipoItem === 'cancion' && it.songId) {
 const s = songs.find(x => x.id === it.songId);
 if (!s) return null;

 return (
 <div
 key={it.id}
 className="grid grid-cols-12 items-center py-3 hover:bg-neutral-900/50 rounded-lg px-2"
 >
 <div className="col-span-1 font-mono text-lg font-bold text-[#f2ca50]">
 {idx + 1}
 </div>

 <div className="col-span-6">
 <div className="text-lg sm:text-xl font-bold font-mono text-white">
 {s.titulo}
 </div>
 {it.notaTema && (
 <div className="text-[10px] font-mono text-[#d1b375] mt-0.5">
 ⚠️ {it.notaTema}
 </div>
 )}
 </div>

 <div className="col-span-2 text-center">
 <span className="px-2 py-1 bg-[#10b981]/15 text-[#10b981] rounded-lg text-base font-mono font-extrabold">
 {s.tonalidad}
 </span>
 </div>

 <div className="col-span-1 text-center font-mono text-sm text-neutral-400">
 {s.bpm}
 </div>

 <div className="col-span-2 text-right font-mono text-base text-[#d1b375] font-bold">
 {s.duracion}
 </div>
 </div>
 );
 } else {
 return (
 <div
 key={it.id}
 className="py-3 px-4 bg-[#d1b375]/15 rounded-xl font-mono text-[#d1b375] font-bold text-sm flex items-center justify-between"
 >
 <span>📢 {it.tituloCustom || 'Pausa / Intervención'}</span>
 {it.notaTema && <span className="text-[10px] text-neutral-400 font-normal">{it.notaTema}</span>}
 </div>
 );
 }
 })}
 </div>
 ) : null}
 </div>
 )}

 {/* MODAL: ADD / EDIT SONG */}
 {showSongModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
 <div className={`w-full max-w-lg p-5 rounded-2xl space-y-4 shadow-2xl ${colors.card} `}>
 <div className="flex justify-between items-center pb-3">
 <h3 className={`text-sm font-bold font-mono uppercase ${colors.text}`}>
 {editingSong ? 'Editar Canción' : 'Añadir Nueva Canción al Catálogo'}
 </h3>
 <button onClick={() => setShowSongModal(false)} className="text-neutral-400 hover:text-white">
 <X className="w-4 h-4" />
 </button>
 </div>

 <form onSubmit={handleSaveSong} className="space-y-3 text-[10px] font-mono">
 <div>
 <label className="block text-neutral-400 mb-1">Título de la Canción *</label>
 <input
 name="titulo"
 type="text"
 required
 defaultValue={editingSong?.titulo || ''}
 className={`w-full p-2 rounded-lg focus:outline-none ${
 isStitchLight ? 'bg-white' : 'bg-neutral-900 text-white'
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
 className={`w-full p-2 rounded-lg focus:outline-none ${
 isStitchLight ? 'bg-white' : 'bg-neutral-900 text-white'
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
 className={`w-full p-2 rounded-lg focus:outline-none ${
 isStitchLight ? 'bg-white' : 'bg-neutral-900 text-white'
 }`}
 />
 </div>

 <div>
 <label className="block text-neutral-400 mb-1">Duración (mm:ss)</label>
 <input
 name="duracion"
 type="text"
 defaultValue={editingSong?.duracion || '3:30'}
 className={`w-full p-2 rounded-lg focus:outline-none ${
 isStitchLight ? 'bg-white' : 'bg-neutral-900 text-white'
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
 className={`w-full p-2 rounded-lg focus:outline-none ${
 isStitchLight ? 'bg-white' : 'bg-neutral-900 text-white'
 }`}
 />
 </div>

 <div>
 <label className="block text-neutral-400 mb-1">Afinación</label>
 <input
 name="afinacion"
 type="text"
 defaultValue={editingSong?.afinacion || 'E Standard'}
 className={`w-full p-2 rounded-lg focus:outline-none ${
 isStitchLight ? 'bg-white' : 'bg-neutral-900 text-white'
 }`}
 />
 </div>
 </div>

 <div>
 <label className="block text-neutral-400 mb-1">Estado del Tema</label>
 <select
 name="estadoTema"
 defaultValue={editingSong?.estadoTema || 'listo'}
 className={`w-full p-2 rounded-lg focus:outline-none ${
 isStitchLight ? 'bg-white' : 'bg-neutral-900 text-white'
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
 className={`w-full p-2 rounded-lg focus:outline-none ${
 isStitchLight ? 'bg-white' : 'bg-neutral-900 text-white'
 }`}
 placeholder="https://drive.google.com/..."
 />
 </div>

 <div>
 <label className="block text-neutral-400 mb-1">Notas Internas & Estructura</label>
 <textarea
 name="notasInternas"
 rows={2}
 defaultValue={editingSong?.notasInternas || ''}
 className={`w-full p-2 rounded-lg focus:outline-none ${
 isStitchLight ? 'bg-white' : 'bg-neutral-900 text-white'
 }`}
 placeholder="ej. Intro solo con viento, estribillo fuerte..."
 />
 </div>

 <div className="pt-2 flex justify-end gap-2">
 <button
 type="button"
 onClick={() => setShowSongModal(false)}
 className="px-2 py-1 rounded-lg text-neutral-300 hover:bg-neutral-800"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className={`px-2 py-1 rounded-lg font-bold ${
 isStitchLight ? 'bg-sky-500/15 text-white' : 'bg-[#f2ca50] text-black'
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
 {assigningSetlist && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
 <div className={`w-full max-w-md p-5 rounded-2xl space-y-4 shadow-2xl ${colors.card} `}>
 <div className="flex justify-between items-center pb-3">
 <h3 className={`text-sm font-bold font-mono uppercase ${colors.text}`}>
 Asignar Repertorio a Concierto / Ensayo
 </h3>
 <button onClick={() => setAssigningSetlist(null)} className="text-neutral-400 hover:text-white">
 <X className="w-4 h-4" />
 </button>
 </div>

 <p className="text-[10px] text-neutral-300 font-sans">
 Selecciona el concierto o ensayo al que deseas vincular el repertorio <strong className="text-[#d1b375] font-mono">"{assigningSetlist.nombre}"</strong>:
 </p>

 <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-[10px] font-mono">
 <div className="text-[10px] text-[#d1b375] uppercase font-bold pt-1">Próximos Conciertos:</div>
 {concerts.length === 0 ? (
 <div className="text-neutral-500 italic text-[10px]">No hay conciertos programados</div>
 ) : (
 concerts.map(c => (
 <label
 key={c.id}
 className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer ${
 selectedConcertToAssign === c.id
 ? '-amber-400 bg-[#d1b375]/15'
 : '-neutral-800 bg-neutral-900/60'
 }`}
 >
 <div className="flex items-center gap-2">
 <input
 type="radio"
 name="event_assign"
 value={c.id}
 checked={selectedConcertToAssign === c.id}
 onChange={() => setSelectedConcertToAssign(c.id)}
 />
 <div>
 <div className="font-bold text-white">{c.sala} ({c.ciudad})</div>
 <div className="text-[10px] text-neutral-400">{c.fecha}</div>
 </div>
 </div>
 </label>
 ))
 )}

 <div className="text-[10px] text-[#10b981] uppercase font-bold pt-3">Próximos Ensayos:</div>
 {rehearsals.length === 0 ? (
 <div className="text-neutral-500 italic text-[10px]">No hay ensayos programados</div>
 ) : (
 rehearsals.map(r => (
 <label
 key={r.id}
 className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer ${
 selectedConcertToAssign === r.id
 ? '-emerald-400 bg-[#10b981]/15'
 : '-neutral-800 bg-neutral-900/60'
 }`}
 >
 <div className="flex items-center gap-2">
 <input
 type="radio"
 name="event_assign"
 value={r.id}
 checked={selectedConcertToAssign === r.id}
 onChange={() => setSelectedConcertToAssign(r.id)}
 />
 <div>
 <div className="font-bold text-white">Ensayo en {r.lugar}</div>
 <div className="text-[10px] text-neutral-400">{r.fecha} a las {r.hora}</div>
 </div>
 </div>
 </label>
 ))
 )}
 </div>

 <div className="pt-3 flex justify-end gap-2">
 <button
 onClick={() => setAssigningSetlist(null)}
 className="px-2 py-1 rounded-lg text-neutral-300 text-[10px] font-mono"
 >
 Cancelar
 </button>
 <button
 onClick={handleAssignSetlistToConcert}
 disabled={!selectedConcertToAssign}
 className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold disabled:opacity-40 ${
 isStitchLight ? 'bg-sky-500/15 text-white' : 'bg-[#f2ca50] text-black'
 }`}
 >
 Guardar Asignación
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
