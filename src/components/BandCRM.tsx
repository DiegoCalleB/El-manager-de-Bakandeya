import React, { useState, useEffect, useRef } from 'react';
import { BandContact, BandRelationshipStatus, ThemeColors, Lead } from '../types';
import { api, getAuthHeaders } from '../services/api';
import BandMap from './BandMap';
import { BandPitchModal } from './bandCRM/BandPitchModal';
import { uploadFileToServer } from '../utils/audioStorage';
import { FavoriteButton } from './common/FavoriteButton';
import { VerifiedBadge } from './common/VerifiedBadge';
import { ReliabilityBadge } from './common/ReliabilityBadge';
import { isLeadVerificado } from '../utils/leadReliability';
import { 
 Users, Music, MapPin, Clock, Sparkles, Plus, Search, Filter, Edit3, Trash2, 
 Copy, Check, ExternalLink, Send, MessageCircle, RefreshCw, LayoutGrid, List, 
 Handshake, Repeat, Zap, Share2, X, Star, Radio, Phone, Mail, Globe, AlertCircle, Building2, Map, FileSpreadsheet,
 Loader2, Bot, Upload, Image as ImageIcon
} from 'lucide-react';

interface BandCRMProps {
 colors: ThemeColors;
 leads?: Lead[];
 onAddLead?: (lead: Lead) => void;
 onUpdateLead?: (id: string, updatedFields: Partial<Lead>) => void;
 currentBandId?: string;
}

// Seed initial realistic band data for Bakandeya's co-booking network
const INITIAL_BANDS: BandContact[] = [
 {
 id: 'band-1',
 nombre_banda: 'La Señora Tomasa',
 estilo_musical: 'Electro-Ska / Latin / Balkan',
 localizacion: 'Barcelona',
 estado_relacion: 'colegas_aliados',
 ultimo_contacto: '2026-07-28',
 contacto_nombre: 'Pau (Mánager / Guitarras)',
 email: 'booking@lasenoratomasa.com',
 telefono: '+34 654 321 098',
 instagram: '@lasenoratomasa',
 spotify_youtube: 'https://open.spotify.com/artist/lasenoratomasa',
 aforo_promedio: 800,
 notas_colaboracion: 'Colegas de festis. Dispuestos a compartir fecha en Sala Apolo (BCN) e invitar a Bakandeya, intercambio con Sala Caracol (Madrid).',
 ciudad_origen_swap: 'Barcelona'
 },
 {
 id: 'band-2',
 nombre_banda: 'Tarraco Ska Sound',
 estilo_musical: 'Traditional Ska / Roots Reggae',
 localizacion: 'Tarragona / Reus',
 estado_relacion: 'intercambio_propuesto',
 ultimo_contacto: '2026-07-22',
 contacto_nombre: 'Marc (Batería & Booking)',
 email: 'contact@tarracoska.cat',
 telefono: '+34 611 223 344',
 instagram: '@tarracoska',
 spotify_youtube: 'https://youtube.com/tarracoska_official',
 aforo_promedio: 300,
 notas_colaboracion: 'Propuesto concierto conjunto de doble cartel en Sala Zero (Tarragona) para Noviembre. Pendiente cerrar fecha exacta.',
 ciudad_origen_swap: 'Tarragona'
 },
 {
 id: 'band-3',
 nombre_banda: 'Balkan Paradise Orchestra',
 estilo_musical: 'Brass Balkan / World Music',
 localizacion: 'Barcelona',
 estado_relacion: 'concierto_agendado',
 ultimo_contacto: '2026-08-01',
 contacto_nombre: 'Alba (Trumpet / Co-direction)',
 email: 'info@balkanparadiseorchestra.com',
 telefono: '+34 677 889 900',
 instagram: '@balkanparadiseorchestra',
 spotify_youtube: 'https://open.spotify.com/artist/balkanparadise',
 aforo_promedio: 1200,
 notas_colaboracion: '¡Concierto agendado! Bakandeya abre su fecha especial en Sala Razzmatazz 2 el 14 de Noviembre de 2026.',
 ciudad_origen_swap: 'Barcelona'
 },
 {
 id: 'band-4',
 nombre_banda: 'Kumbia Queers',
 estilo_musical: 'Electro Cumbia / Tropical Punk',
 localizacion: 'Madrid / Buenos Aires',
 estado_relacion: 'colegas_aliados',
 ultimo_contacto: '2026-07-15',
 contacto_nombre: 'Inés (Bajo)',
 email: 'kumbiaqueers@gmail.com',
 telefono: '+34 600 112 233',
 instagram: '@kumbiaqueers',
 spotify_youtube: 'https://open.spotify.com/artist/kumbiaqueers',
 aforo_promedio: 500,
 notas_colaboracion: 'Buena sintonía. Posible gira conjunta de verano por festivales mestizos de Andalucía y Levante.',
 ciudad_origen_swap: 'Madrid'
 },
 {
 id: 'band-5',
 nombre_banda: 'Mafalda Ska',
 estilo_musical: 'Ska-Punk / Rock Combate',
 localizacion: 'Valencia',
 estado_relacion: 'pendiente_respuesta',
 ultimo_contacto: '2026-07-10',
 contacto_nombre: 'Vicent (Voz & Management)',
 email: 'mafaldagrup@gmail.com',
 telefono: '+34 633 445 566',
 instagram: '@mafaldagrup',
 spotify_youtube: 'https://spotify.com/artist/mafalda',
 aforo_promedio: 900,
 notas_colaboracion: 'Enviada propuesta de fecha compartida en Sala Repvblicca (Valencia). Esperando confirmación de calendario.',
 ciudad_origen_swap: 'Valencia'
 },
 {
 id: 'band-6',
 nombre_banda: 'Auxili',
 estilo_musical: 'Reggae / Dancehall / Ska',
 localizacion: 'Ontinyent / Valencia',
 estado_relacion: 'sin_contactar',
 ultimo_contacto: '2026-06-01',
 contacto_nombre: 'Miquel (Management)',
 email: 'auxili.reggae@gmail.com',
 telefono: '+34 622 334 455',
 instagram: '@auxilireggae',
 spotify_youtube: 'https://open.spotify.com/artist/auxili',
 aforo_promedio: 1000,
 notas_colaboracion: 'Contacto inicial recopilado por Scout. Muy afines por el uso de instrumentos de viento y energía en vivo.',
 ciudad_origen_swap: 'Valencia'
 },
 {
 id: 'band-7',
 nombre_banda: 'Tremenda Jauría',
 estilo_musical: 'Cumbia-Reggaeton / Electro-Punk',
 localizacion: 'Madrid',
 estado_relacion: 'colegas_aliados',
 ultimo_contacto: '2026-07-29',
 contacto_nombre: 'Saray (Productora)',
 email: 'tremendajauria@gmail.com',
 telefono: '+34 644 556 677',
 instagram: '@tremendajauria',
 spotify_youtube: 'https://spotify.com/artist/tremendajauria',
 aforo_promedio: 1100,
 notas_colaboracion: 'Aliados en Madrid. Posibilidad de compartir equipo de sonido / PA y backline para eventos autogestionados.',
 ciudad_origen_swap: 'Madrid'
 },
 {
 id: 'band-8',
 nombre_banda: 'Doctor Prats',
 estilo_musical: 'Fusion / Electro-Ska / Pop',
 localizacion: 'Terrassa / Barcelona',
 estado_relacion: 'intercambio_propuesto',
 ultimo_contacto: '2026-07-20',
 contacto_nombre: 'Guillem (Acordeón & Booking)',
 email: 'doctorprats@booking.cat',
 telefono: '+34 699 001 122',
 instagram: '@doctorprats',
 spotify_youtube: 'https://youtube.com/doctorprats',
 aforo_promedio: 1500,
 notas_colaboracion: 'Intercambio en negociación para compartir fecha en Fiestas Mayores y festival de primavera.',
 ciudad_origen_swap: 'Barcelona'
 }
];

export default function BandCRM({ colors, leads = [], onAddLead, onUpdateLead, currentBandId }: BandCRMProps) {
 // Local state for band contacts with persistence
 const [bands, setBands] = useState<BandContact[]>([]);
 const [isLoading, setIsLoading] = useState(true);

 const fetchBands = () => {
   const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token');
   fetch('/api/bands', {
     headers: {
       'Content-Type': 'application/json',
       ...(token ? { 'Authorization': `Bearer ${token}` } : {})
     }
   })
     .then(async res => {
       if (!res.ok) throw new Error(`HTTP error ${res.status}`);
       const contentType = res.headers.get("content-type");
       if (!contentType || !contentType.includes("application/json")) {
         throw new Error("Respuesta no es JSON válido");
       }
       return res.json();
     })
     .then(data => {
       if (data && data.bands) {
         setBands(data.bands);
       }
     })
     .catch(err => { if (err?.status !== 401) console.warn("Could not load bands:", err); })
     .finally(() => setIsLoading(false));
 };

 useEffect(() => {
   fetchBands();
 }, [currentBandId]);

 // Save changes to localStorage whenever bands state updates
 

 // Sync leads of type 'grupo' from the main leads list if new ones appear
 useEffect(() => {
 if (leads && leads.length > 0) {
 const groupLeads = leads.filter(l => {
 if (!l.tipo) return false;
 const norm = String(l.tipo).trim().toLowerCase();
 return norm === 'grupo' || norm.includes('grup') || norm.includes('banda') || norm.includes('artist');
 });

 if (groupLeads.length > 0) {
 setBands(prevBands => {
 const existingIds = new Set(prevBands.map(b => b.id));
 const existingNames = new Set(prevBands.map(b => b.nombre_banda.toLowerCase().trim()));
 
 const newFromLeads: BandContact[] = groupLeads
 .filter(l => !existingIds.has(l.id) && !existingNames.has(l.nombre_sala.toLowerCase().trim()))
 .map(l => ({
 id: l.id || `lead-band-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
 nombre_banda: l.nombre_sala,
 estilo_musical: l.genero || 'Ska / Fusion / Mestizaje',
 localizacion: l.ciudad || 'España',
 estado_relacion: mapLeadStatusToBandStatus(l.estado),
 ultimo_contacto: l.fecha_ultima_respuesta || l.fecha_envio || new Date().toISOString().split('T')[0],
 contacto_nombre: l.contacto_nombre || 'Contacto Principal',
 email: l.email_contacto || '',
 telefono: l.telefono || '',
 instagram: l.instagram || '',
 spotify_youtube: l.website || '',
 aforo_promedio: l.aforo || 300,
 notas_colaboracion: l.notas || l.pitch_generado || 'Importado desde Leads de Booking.',
 ciudad_origen_swap: l.ciudad || 'España'
 }));

 if (newFromLeads.length === 0) return prevBands;
 return [...prevBands, ...newFromLeads];
 });
 }
 }
 }, [leads]);

 // Helper mapping from LeadStatus to BandRelationshipStatus
 function mapLeadStatusToBandStatus(status?: string): BandRelationshipStatus {
 switch (status) {
 case 'aprobado': return 'intercambio_propuesto';
 case 'interesado':
 case 'negociando': return 'intercambio_propuesto';
 case 'esperando_respuesta': return 'pendiente_respuesta';
 default: return 'sin_contactar';
 }
 }

 // UI Filter & Search state
 const [subTab, setSubTab] = useState<'co_booking' | 'registered_bands'>('co_booking');
 const [registeredBands, setRegisteredBands] = useState<any[]>([]);
 const [isLoadingRegBands, setIsLoadingRegBands] = useState(false);

 const fetchRegisteredBands = () => {
   setIsLoadingRegBands(true);
   const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token');
   fetch('/api/registered-bands', {
     headers: {
       'Content-Type': 'application/json',
       ...(token ? { 'Authorization': `Bearer ${token}` } : {})
     }
   })
     .then(async res => {
       if (!res.ok) {
         throw new Error(`HTTP error ${res.status}`);
       }
       const contentType = res.headers.get("content-type");
       if (!contentType || !contentType.includes("application/json")) {
         throw new Error("Respuesta no es JSON válido");
       }
       return res.json();
     })
     .then(data => {
       if (data && data.registeredBands) {
         setRegisteredBands(data.registeredBands);
       }
     })
     .catch(err => { if (err?.status !== 401) console.warn("Could not load registered bands:", err); })
     .finally(() => setIsLoadingRegBands(false));
 };

 useEffect(() => {
   fetchRegisteredBands();
 }, [currentBandId]);

 const [searchTerm, setSearchTerm] = useState('');
 const [statusFilter, setStatusFilter] = useState<BandRelationshipStatus | 'todos'>('todos');
 const [styleFilter, setStyleFilter] = useState<string>('todos');
 const [locationFilter, setLocationFilter] = useState<string>('todos');
 const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map'>('map');

 // Modal State
 const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
 const [editingBand, setEditingBand] = useState<BandContact | null>(null);

 // Date Swap Generator Modal State
 const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
 const [selectedPitchBand, setSelectedPitchBand] = useState<BandContact | null>(null);
 const [proposedBakandeyaCity, setProposedBakandeyaCity] = useState<'Madrid' | 'Sevilla' | 'Ambas'>('Madrid');
 const [proposedMonth, setProposedMonth] = useState('Octubre / Noviembre 2026');
 const [proposedVenueBakandeya, setProposedVenueBakandeya] = useState('Sala Caracol / Gruta 77');
 const [copiedPitch, setCopiedPitch] = useState(false);

 // Form Fields State
 const [formName, setFormName] = useState('');
 const [formStyle, setFormStyle] = useState('Balkan Ska / Mestizaje');
 const [formLocation, setFormLocation] = useState('Madrid');
 const [formStatus, setFormStatus] = useState<BandRelationshipStatus>('sin_contactar');
 const [formLastContact, setFormLastContact] = useState(() => new Date().toISOString().split('T')[0]);
 const [formContactName, setFormContactName] = useState('');
 const [formEmail, setFormEmail] = useState('');
 const [formPhone, setFormPhone] = useState('');
 const [formInstagram, setFormInstagram] = useState('');
 const [formSpotifyYoutube, setFormSpotifyYoutube] = useState('');
 const [formAforo, setFormAforo] = useState<number>(300);
 const [formNotes, setFormNotes] = useState('');
 const [formIcon, setFormIcon] = useState('🎸');
 const [formImageUrl, setFormImageUrl] = useState('');
 const [isUploadingLogo, setIsUploadingLogo] = useState(false);

 const handleLogoUpload = async (file: File) => {
   try {
     setIsUploadingLogo(true);
     const url = await uploadFileToServer(file, { bandId: 'bakandeya', category: 'grupos' });
     if (url) {
       setFormImageUrl(url);
     }
   } catch (err) {
     console.error('Error uploading band image:', err);
     alert('Error al subir la imagen a Supabase');
   } finally {
     setIsUploadingLogo(false);
   }
 };

 // AI Band Lookup state
 const [isAiSearching, setIsAiSearching] = useState(false);
 const [aiProposal, setAiProposal] = useState<any | null>(null);
 const [aiError, setAiError] = useState<string | null>(null);

 const handleAiLookup = async () => {
 if (!formName.trim()) {
 alert('Por favor introduce el nombre de la banda primero para buscar con IA.');
 return;
 }
 setIsAiSearching(true);
 setAiError(null);
 setAiProposal(null);
 try {
 const res = await fetch('/api/bands/ai-lookup', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ nombre_banda: formName.trim(), localizacion: formLocation.trim() })
 });
 const data = await res.json();
 if (data.success && data.data) {
 setAiProposal(data.data);
 } else {
 setAiError(data.error || 'No se encontraron datos para esta banda.');
 }
 } catch (err: any) {
 console.error('Error en búsqueda de IA:', err);
 setAiError('Error al conectar con la IA para la búsqueda.');
 } finally {
 setIsAiSearching(false);
 }
 };

 const handleApplyAllAiData = () => {
 if (!aiProposal) return;
 if (aiProposal.estilo_musical) setFormStyle(aiProposal.estilo_musical);
 if (aiProposal.localizacion) setFormLocation(aiProposal.localizacion);
 if (aiProposal.contacto_nombre) setFormContactName(aiProposal.contacto_nombre);
 if (aiProposal.email) setFormEmail(aiProposal.email);
 if (aiProposal.telefono) setFormPhone(aiProposal.telefono);
 if (aiProposal.instagram) setFormInstagram(aiProposal.instagram);
 if (aiProposal.spotify_url || aiProposal.youtube_url) {
 setFormSpotifyYoutube(aiProposal.spotify_url || aiProposal.youtube_url);
 }
 if (aiProposal.icono) setFormIcon(aiProposal.icono);
 if (aiProposal.imagen_url) setFormImageUrl(aiProposal.imagen_url);
 if (aiProposal.biografia) {
 setFormNotes(prev => prev ? `${prev}\n\n[Bio IA]: ${aiProposal.biografia}` : aiProposal.biografia);
 }
 setAiProposal(null);
 };

 // Handle open modal for creation
 const handleOpenCreateModal = () => {
  setEditingBand(null);
  setFormName('');
  setFormStyle('Balkan Ska / Mestizaje');
  setFormLocation('Madrid');
  setFormStatus('sin_contactar');
  setFormLastContact(new Date().toISOString().split('T')[0]);
  setFormContactName('');
  setFormEmail('');
  setFormPhone('');
  setFormInstagram('');
  setFormSpotifyYoutube('');
  setFormAforo(300);
  setFormNotes('');
  setFormIcon('🎸');
  setFormImageUrl('');
  setAiProposal(null);
  setAiError(null);
  setIsAiSearching(false);
  setIsAddEditModalOpen(true);
 };

 // Handle open modal for editing
 const handleOpenEditModal = (band: BandContact) => {
  setEditingBand(band);
  setFormName(band.nombre_banda);
  setFormStyle(band.estilo_musical);
  setFormLocation(band.localizacion);
  setFormStatus(band.estado_relacion);
  setFormLastContact(band.ultimo_contacto);
  setFormContactName(band.contacto_nombre || '');
  setFormEmail(band.email || '');
  setFormPhone(band.telefono || '');
  setFormInstagram(band.instagram || '');
  setFormSpotifyYoutube(band.spotify_youtube || '');
  setFormAforo(band.aforo_promedio || 300);
  setFormNotes(band.notas_colaboracion || '');
  setFormIcon(band.icono || '🎸');
  setFormImageUrl(band.imagen_url || '');
  setAiProposal(null);
  setAiError(null);
  setIsAiSearching(false);
  setIsAddEditModalOpen(true);
 };

 // Handle Save (Create or Update)
 const handleSaveBand = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!formName.trim()) {
 alert('Por favor introduce el nombre de la banda.');
 return;
 }

 const token = localStorage.getItem('bakandeya_token');
 const headers = {
 'Content-Type': 'application/json',
 ...(token ? { 'Authorization': `Bearer ${token}` } : {})
 };

 if (editingBand) {
 // Update existing
 const updated: BandContact = {
 ...editingBand,
 nombre_banda: formName.trim(),
 estilo_musical: formStyle.trim(),
 localizacion: formLocation.trim(),
 estado_relacion: formStatus,
 ultimo_contacto: formLastContact,
 contacto_nombre: formContactName.trim(),
 email: formEmail.trim(),
 telefono: formPhone.trim(),
 instagram: formInstagram.trim(),
 spotify_youtube: formSpotifyYoutube.trim(),
 aforo_promedio: Number(formAforo) || 0,
 notas_colaboracion: formNotes.trim(),
 ciudad_origen_swap: formLocation.trim(),
 icono: formIcon,
 imagen_url: formImageUrl
 };

 setBands(prev => prev.map(b => b.id === editingBand.id ? updated : b));

 try {
 await fetch(`/api/bands/${editingBand.id}`, {
 method: 'PUT',
 headers,
 body: JSON.stringify(updated)
 });
 } catch (err) {
 console.error("Error updating band on server:", err);
 }

 // Also sync back to main leads list if onUpdateLead is provided
 if (onUpdateLead) {
 onUpdateLead(editingBand.id, {
 nombre_sala: updated.nombre_banda,
 genero: updated.estilo_musical,
 ciudad: updated.localizacion,
 contacto_nombre: updated.contacto_nombre,
 email_contacto: updated.email,
 telefono: updated.telefono,
 instagram: updated.instagram,
 notas: updated.notas_colaboracion,
 icono: updated.icono,
 imagen_url: updated.imagen_url
 });
 }
 } else {
 // Create new
 const newBand: BandContact = {
 id: `band-${Date.now()}`,
 nombre_banda: formName.trim(),
 estilo_musical: formStyle.trim(),
 localizacion: formLocation.trim(),
 estado_relacion: formStatus,
 ultimo_contacto: formLastContact || new Date().toISOString().split('T')[0],
 contacto_nombre: formContactName.trim(),
 email: formEmail.trim(),
 telefono: formPhone.trim(),
 instagram: formInstagram.trim(),
 spotify_youtube: formSpotifyYoutube.trim(),
 aforo_promedio: Number(formAforo) || 300,
 notas_colaboracion: formNotes.trim(),
 ciudad_origen_swap: formLocation.trim(),
 icono: formIcon,
 imagen_url: formImageUrl
 };

 setBands(prev => [newBand, ...prev]);

 try {
 await fetch('/api/bands', {
 method: 'POST',
 headers,
 body: JSON.stringify(newBand)
 });
 } catch (err) {
 console.error("Error creating band on server:", err);
 }

 // Sync to main leads list if onAddLead is provided
 if (onAddLead) {
 onAddLead({
 id: newBand.id,
 nombre_sala: newBand.nombre_banda,
 ciudad: newBand.localizacion,
 region: newBand.localizacion,
 aforo: newBand.aforo_promedio || 300,
 genero: newBand.estilo_musical,
 tipo: 'grupo',
 email_contacto: newBand.email || '',
 telefono: newBand.telefono || '',
 instagram: newBand.instagram || '',
 contacto_nombre: newBand.contacto_nombre || '',
 fuente: 'Red de Co-Booking Bandas',
 estado: 'pendiente_aprobacion',
 pitch_generado: `Propuesta Date Swap: Bakandeya x ${newBand.nombre_banda}`,
 notas: newBand.notas_colaboracion || '',
 icono: newBand.icono,
 imagen_url: newBand.imagen_url
 });
 }
 }

 setIsAddEditModalOpen(false);
 };

 // Handle Delete
 const handleDeleteBand = async (id: string, name: string) => {
 if (window.confirm(`¿Estás seguro de eliminar el contacto de la banda"${name}"?`)) {
 setBands(prev => prev.filter(b => b.id !== id));
 try {
 await fetch(`/api/bands/${id}`, { method: 'DELETE' });
 } catch (err) { console.error("Error deleting band", err); }
 }
 };

 // Toggle Favorite
 const handleUpdateBandFavorite = async (id: string, isFav: boolean) => {
 setBands(prev => prev.map(b => b.id === id ? { ...b, es_favorito: isFav } : b));
 try {
 await fetch(`/api/bands/${id}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ es_favorito: isFav })
 });
 } catch (err) { console.error("Error updating favorite status", err); }
 };

 // Quick Status update
 const handleQuickStatusChange = async (id: string, newStatus: BandRelationshipStatus) => {
 const today = new Date().toISOString().split('T')[0];
 const bandToUpdate = bands.find(b => b.id === id);
 if (!bandToUpdate) return;
 
 const updated = { ...bandToUpdate, estado_relacion: newStatus, ultimo_contacto: today };
 setBands(prev => prev.map(b => b.id === id ? updated : b));
 
 try {
 await fetch(`/api/bands/${id}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(updated)
 });
 } catch (err) { console.error("Error updating band status", err); }
 };

 // Filter logic
 const filteredBands = bands.filter(band => {
 // Search
 const searchLower = searchTerm.toLowerCase().trim();
 const matchesSearch = !searchLower || 
 band.nombre_banda.toLowerCase().includes(searchLower) ||
 band.estilo_musical.toLowerCase().includes(searchLower) ||
 band.localizacion.toLowerCase().includes(searchLower) ||
 (band.contacto_nombre && band.contacto_nombre.toLowerCase().includes(searchLower)) ||
 (band.email && band.email.toLowerCase().includes(searchLower));

 // Status filter
 const matchesStatus = statusFilter === 'todos' || band.estado_relacion === statusFilter;

 // Style filter
 const matchesStyle = styleFilter === 'todos' || 
 band.estilo_musical.toLowerCase().includes(styleFilter.toLowerCase());

 // Location filter
 const matchesLocation = locationFilter === 'todos' || 
 band.localizacion.toLowerCase().includes(locationFilter.toLowerCase());

 return matchesSearch && matchesStatus && matchesStyle && matchesLocation;
 });

 // Extract unique locations and styles for filter dropdowns
 const availableLocations = Array.from(new Set(bands.map(b => b.localizacion).filter(Boolean))).sort();
 const availableStyles = Array.from(new Set(bands.map(b => b.estilo_musical).filter(Boolean))).sort();

 // Metrics counts
 const totalBands = bands.length;
 const alliesCount = bands.filter(b => b.estado_relacion === 'colegas_aliados').length;
 const proposedSwapsCount = bands.filter(b => b.estado_relacion === 'intercambio_propuesto').length;
 const scheduledShowsCount = bands.filter(b => b.estado_relacion === 'concierto_agendado').length;

 // Render Status Badge
 const renderStatusBadge = (status: BandRelationshipStatus) => {
 switch (status) {
 case 'colegas_aliados':
 return (
 <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-[#10b981]/15 text-[#10b981]">
 <Handshake className="w-3 h-3 text-[#10b981] shrink-0" />
 <span>Colegas / Aliados</span>
 </span>
 );
 case 'concierto_agendado':
 return (
 <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-[#d1b375]/15 text-[#d1b375]">
 <Zap className="w-3 h-3 text-[#d1b375] shrink-0 animate-pulse" />
 <span>Concierto Agendado</span>
 </span>
 );
 case 'intercambio_propuesto':
 return (
 <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400">
 <Repeat className="w-3 h-3 text-sky-400 shrink-0" />
 <span>Intercambio Propuesto</span>
 </span>
 );
 case 'pendiente_respuesta':
 return (
 <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-fuchsia-500/15 text-fuchsia-300">
 <Clock className="w-3 h-3 text-fuchsia-300 shrink-0" />
 <span>Pendiente Respuesta</span>
 </span>
 );
 case 'no_disponible':
 return (
 <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400">
 <X className="w-3 h-3 text-rose-400 shrink-0" />
 <span>No Disponible</span>
 </span>
 );
 case 'sin_contactar':
 default:
 return (
 <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-800 text-neutral-400">
 <Radio className="w-3 h-3 text-neutral-400 shrink-0" />
 <span>Sin Contactar</span>
 </span>
 );
 }
 };

 // Generate Date Swap Pitch Text
 const generatePitchText = (band: BandContact) => {
 return `¡Buenas chavales de ${band.nombre_banda}! 🎸🔥

Os escribimos directamente desde Bakandeya (banda de Balkan-Ska, violín enérgico, loops analógicos y electrónica de Madrid/Sevilla).

Nos mola mucho vuestra propuesta en ${band.estilo_musical} y vemos que tenéis fuerte tirón en ${band.localizacion}. Queremos proponer un INTERCAMBIO DE FECHAS / CO-BOOKING (Date Swap) para la temporada de ${proposedMonth}:

1. Os invitamos a tocar con nosotros en ${proposedBakandeyaCity} (${proposedVenueBakandeya}), compartiendo escenario, cartel y taquilla al 50%.
2. Montamos la fecha de vuelta en ${band.localizacion} en vuestro local habitual para sumar ambos públicos locales y abaratar gastos de furgoneta y backline.

Podéis escuchar nuestros directos de alta intensidad aquí:
https://youtube.com/bakandeya_live

¿Cómo lo veis? ¿Hablamos por WhatsApp o hacemos una breve llamada esta semana para cuadrar fechas?

¡Un fuerte abrazo!
Bakandeya Agent Manager IA & Músicos`;
 };

 const isStitchLight = colors.name?.toLowerCase().includes('light') || colors.bg.includes('f8fafc') || colors.bg.includes('white') || colors.bg.includes('slate-50') || false;

 return (
 <div className="w-full space-y-6">
 
 {/* 1. HEADER HERO BANNER & METRICS BAR */}
 <div className={`p-5 sm:p-6 rounded-2xl transition-all ${colors.card}  space-y-5 shadow-lg`}>
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <span className="px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#f2ca50]/15 text-[#f2ca50] inline-flex items-center gap-1.5">
 <Users className="w-3 h-3" /> Red de Colaboración entre Bandas
 </span>
 <span className="text-[10px] font-mono text-neutral-400">• Co-Booking & Giras</span>
 </div>
 <h2 className="text-3xl font-bold font-display tracking-tight text-zinc-100 flex items-center gap-2.5">
              <span>Bandas amigas</span>
 <Sparkles className="w-5 h-5 text-[#f2ca50] shrink-0" />
 </h2>
 <p className="text-[10px] text-neutral-400 max-w-2xl font-sans leading-relaxed">
 Base de datos estratégica de contactos de otras bandas para coordinar <strong>intercambios de fechas (Date Swaps)</strong>, dobles carteles en salas grandes, compartir furgoneta y backline, y agilizar giras conjuntas.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-2.5 shrink-0">
 <button
 id="band-btn-[#date-swap-pitch]"
 onClick={() => {
 if (bands.length > 0) {
 setSelectedPitchBand(bands[0]);
 setIsPitchModalOpen(true);
 } else {
 alert('Añade primero una banda para generar un pitch de intercambio.');
 }
 }}
 className="px-2 py-1 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/15 hover:bg-sky-500/15 text-white transition-all cursor-pointer flex items-center gap-2 shadow-md active:scale-95"
 >
 <Repeat className="w-4 h-4 text-white shrink-0" />
 <span>Pitch de Date Swap</span>
 </button>

 <button
 id="band-btn-add-new"
 onClick={handleOpenCreateModal}
 className="px-2 py-1 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all cursor-pointer flex items-center gap-2 shadow-md active:scale-95"
 >
 <Plus className="w-4 h-4 text-[#3c2f00] shrink-0" />
 <span>+ Nueva Banda</span>
 </button>
 </div>
 </div>

 {/* Metric Cards Row */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
 {/* Total Bandas */}
 <div className="p-3.5 rounded-xl bg-neutral-900/60 flex items-center justify-between">
 <div className="space-y-0.5">
 <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">Total Bandas</span>
 <span className="text-2xl font-black font-mono text-white">{totalBands}</span>
 </div>
 <div className="p-2.5 rounded-xl bg-[#d1b375]/15 text-[#d1b375]">
 <Users className="w-5 h-5" />
 </div>
 </div>

 {/* Colegas / Aliados */}
 <div className="p-3.5 rounded-xl bg-neutral-900/60 flex items-center justify-between">
 <div className="space-y-0.5">
 <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">Aliados de Gira</span>
 <span className="text-2xl font-black font-mono text-[#10b981]">{alliesCount}</span>
 </div>
 <div className="p-2.5 rounded-xl bg-[#10b981]/15 text-[#10b981]">
 <Handshake className="w-5 h-5" />
 </div>
 </div>

 {/* Intercambios Propuestos */}
 <div className="p-3.5 rounded-xl bg-neutral-900/60 flex items-center justify-between">
 <div className="space-y-0.5">
 <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">Date Swaps Activos</span>
 <span className="text-2xl font-black font-mono text-sky-400">{proposedSwapsCount}</span>
 </div>
 <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-400">
 <Repeat className="w-5 h-5" />
 </div>
 </div>

 {/* Registered Bands Count */}
 <div className="p-3.5 rounded-xl bg-neutral-900/60 flex items-center justify-between">
 <div className="space-y-0.5">
 <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">Hoja: registro_bandas</span>
 <span className="text-2xl font-black font-mono text-emerald-400">{registeredBands.length}</span>
 </div>
 <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
 <Building2 className="w-5 h-5" />
 </div>
 </div>
 </div>

 {/* Sub-Tab Navigation Switcher */}
 <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-neutral-800/80">
 <button
 onClick={() => setSubTab('co_booking')}
 className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
 subTab === 'co_booking'
 ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
 : 'bg-neutral-900/60 text-neutral-400 hover:text-white hover:bg-neutral-800'
 }`}
 >
 <Users className="w-4 h-4" />
 <span>1. Red Co-Booking / Bandas Amigas (bandas)</span>
 <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 font-bold text-neutral-300">
 {bands.length}
 </span>
 </button>

 <button
 onClick={() => { setSubTab('registered_bands'); fetchRegisteredBands(); }}
 className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
 subTab === 'registered_bands'
 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
 : 'bg-neutral-900/60 text-neutral-400 hover:text-white hover:bg-neutral-800'
 }`}
 >
 <Building2 className="w-4 h-4 text-emerald-400" />
 <span>2. Registro de Nuevas Bandas (registro_bandas)</span>
 <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 font-bold text-emerald-300">
 {registeredBands.length}
 </span>
 </button>

 <a
 href="/api/export-excel"
 download="band_data.xlsx"
 className="ml-auto px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
 >
 <FileSpreadsheet className="w-4 h-4" />
 <span>Exportar Excel Completo (.xlsx)</span>
 </a>
 </div>
 </div>

 {/* TAB 2: REGISTERED BANDS VIEW (registro_bandas) */}
 {subTab === 'registered_bands' ? (
 <div className={`p-5 rounded-2xl ${colors.card} space-y-4 shadow-lg border border-neutral-800`}>
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h3 className="text-xl font-bold font-display text-white flex items-center gap-2">
 <Building2 className="w-5 h-5 text-emerald-400" />
 <span>Registro de Nuevas Bandas Clientes (registro_bandas)</span>
 </h3>
 <p className="text-xs text-neutral-400 font-mono mt-0.5">
 Pestaña oficial de Google Sheets <span className="text-emerald-400 font-bold">registro_bandas</span> con la columna <span className="text-amber-300 font-bold">band_id</span> situándose en la extrema derecha.
 </p>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <button
 onClick={fetchRegisteredBands}
 className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer border border-neutral-800"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRegBands ? 'animate-spin' : ''}`} />
 <span>Actualizar</span>
 </button>
 <a
 href="/api/export-excel"
 download="band_data.xlsx"
 className="p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-500/30"
 >
 <FileSpreadsheet className="w-3.5 h-3.5" />
 <span>Excel (.xlsx)</span>
 </a>
 </div>
 </div>

 <div className="overflow-x-auto rounded-xl border border-neutral-800">
 <table className="w-full text-left border-collapse text-xs font-mono">
 <thead>
 <tr className="bg-neutral-950 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
 <th className="p-3">ID Reg.</th>
 <th className="p-3">Nombre Banda</th>
 <th className="p-3">Email Contacto</th>
 <th className="p-3">Plan</th>
 <th className="p-3">Fecha Registro</th>
 <th className="p-3">Estado Cuenta</th>
 <th className="p-3">Notas</th>
 <th className="p-3 font-bold text-cyan-300 bg-cyan-500/10 border-l border-cyan-500/20">user_id</th>
 <th className="p-3 text-right text-amber-300 bg-amber-500/10 border-l border-amber-500/20 font-bold">band_id</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/40 text-neutral-200">
 {registeredBands.length === 0 ? (
 <tr>
 <td colSpan={9} className="p-8 text-center text-neutral-500 italic">
 {isLoadingRegBands ? 'Cargando bandas registradas de Google Sheets...' : 'No hay registros en la pestaña registro_bandas aún.'}
 </td>
 </tr>
 ) : (
 registeredBands.map((band: any, idx: number) => (
 <tr key={band.id || `reg-${idx}`} className="hover:bg-neutral-800/40 transition-colors">
 <td className="p-3 font-mono text-neutral-400">{band.id || `reg-${idx + 1}`}</td>
 <td className="p-3 font-bold text-white flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
 <span>{band.nombre_banda || band.nombreBanda || band.contacto_nombre}</span>
 </td>
 <td className="p-3 text-neutral-300">{band.email || '—'}</td>
 <td className="p-3">
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
 {band.plan || 'emergente'}
 </span>
 </td>
 <td className="p-3 text-neutral-400">
 {band.fecha_registro ? new Date(band.fecha_registro).toLocaleDateString() : '—'}
 </td>
 <td className="p-3">
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
 {band.estado_cuenta || 'activo'}
 </span>
 </td>
 <td className="p-3 text-neutral-400 max-w-xs truncate">{band.notas || '—'}</td>
 <td className="p-3 text-left font-bold text-cyan-300 bg-cyan-500/5 border-l border-cyan-500/20 font-mono">
 {band.user_id || '—'}
 </td>
 <td className="p-3 text-right font-bold text-amber-300 bg-amber-500/5 border-l border-amber-500/20 font-mono">
 {band.band_id || band.bandId || 'band-1'}
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 ) : (
 <>
 {/* 2. FILTER & SEARCH CONTROL BAR */}
 <div className={`p-4 rounded-xl ${colors.card}  space-y-3 shadow-md`}>
 <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
 
 {/* Search Bar */}
 <div className="relative flex-1 min-w-[220px]">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
 <input
 id="band-search-input"
 type="text"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 placeholder="Buscar por banda, estilo, ciudad o contacto..."
 className="w-full bg-neutral-900/90 text-white pl-9 pr-3 py-2 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50 transition-colors"
 />
 {searchTerm && (
 <button 
 onClick={() => setSearchTerm('')} 
 className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 {/* Filters Row */}
 <div className="flex flex-wrap items-center gap-2">
 
 {/* Status Filter Dropdown */}
 <select
 id="band-filter-status"
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value as BandRelationshipStatus | 'todos')}
 className="bg-neutral-900 text-neutral-200 px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50 cursor-pointer"
 >
 <option value="todos">🤝 Todos los Estados</option>
 <option value="colegas_aliados">🤝 Colegas / Aliados</option>
 <option value="concierto_agendado">⚡ Concierto Agendado</option>
 <option value="intercambio_propuesto">🔄 Intercambio Propuesto</option>
 <option value="pendiente_respuesta">⏳ Pendiente Respuesta</option>
 <option value="sin_contactar">📡 Sin Contactar</option>
 <option value="no_disponible">❌ No Disponible</option>
 </select>

 {/* Location Filter Dropdown */}
 <select
 id="band-filter-location"
 value={locationFilter}
 onChange={(e) => setLocationFilter(e.target.value)}
 className="bg-neutral-900 text-neutral-200 px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50 cursor-pointer max-w-[160px] truncate"
 >
 <option value="todos">📍 Todas las Ciudades</option>
 {availableLocations.map(loc => (
 <option key={loc} value={loc}>{loc}</option>
 ))}
 </select>

 {/* View Mode Toggle */}
 <div className="flex items-center p-1 bg-neutral-900 rounded-xl shrink-0">
 <button
 id="view-grid-btn"
 type="button"
 onClick={() => setViewMode('grid')}
 className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
 viewMode === 'grid' ? 'bg-[#f2ca50] text-[#3c2f00]' : 'text-neutral-400 hover:text-white'
 }`}
 title="Vista en Tarjetas"
 >
 <LayoutGrid className="w-4 h-4" />
 </button>
 <button
 id="view-table-btn"
 type="button"
 onClick={() => setViewMode('table')}
 className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
 viewMode === 'table' ? 'bg-[#f2ca50] text-[#3c2f00]' : 'text-neutral-400 hover:text-white'
 }`}
 title="Vista en Lista / Tabla"
 >
 <List className="w-4 h-4" />
 </button>
 <button
 id="view-map-btn"
 type="button"
 onClick={() => setViewMode('map')}
 className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
 viewMode === 'map' ? 'bg-[#f2ca50] text-[#3c2f00]' : 'text-neutral-400 hover:text-white'
 }`}
 title="Vista en Mapa Interactivo"
 >
 <Map className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* 3. BAND LIST CONTAINER */}
 {filteredBands.length === 0 ? (
 <div className={`p-12 rounded-2xl text-center space-y-3 ${colors.card} `}>
 <AlertCircle className="w-10 h-10 text-neutral-500 mx-auto" />
 <h3 className="text-sm font-mono font-bold text-neutral-300 uppercase tracking-wider">
 No se encontraron bandas
 </h3>
 <p className="text-[10px] text-neutral-500 max-w-md mx-auto font-sans">
 No hay bandas registradas que coincidan con los criterios de búsqueda o filtros seleccionados. Prorroga tu búsqueda o añade una nueva banda.
 </p>
 <button
 onClick={handleOpenCreateModal}
 className="mt-2 inline-flex items-center gap-2 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
 >
 <Plus className="w-4 h-4" />
 <span>Añadir Primera Banda</span>
 </button>
 </div>
 ) : viewMode === 'map' ? (
 <BandMap
 bands={filteredBands}
 onSelectBand={(band) => handleOpenEditModal(band)}
 isStitchLight={isStitchLight}
 />
 ) : viewMode === 'grid' ? (
 /* GRID CARDS VIEW */
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {filteredBands.map((band) => (
 <div
 key={band.id}
 className={`p-5 rounded-2xl transition-all hover:-amber-500/40 flex flex-col justify-between space-y-4 ${colors.card}  shadow-md group relative overflow-hidden`}
 >
 <div className="space-y-3">
 {/* Card Top: Band Name & Status */}
 <div className="flex items-start justify-between gap-2">
 <div className="space-y-1 min-w-0">
 <div className="flex items-center gap-1.5 min-w-0">
 <h3 className="text-base font-bold font-display tracking-wider uppercase text-white flex items-center gap-2 group-hover:text-[#f2ca50] transition-colors truncate min-w-0">
 {band.imagen_url ? (
 <img src={band.imagen_url} alt={band.nombre_banda} className="w-6 h-6 rounded-full object-cover border border-[#f2ca50]/50 shrink-0" />
 ) : (
 <span className="text-sm shrink-0">{band.icono || '🎸'}</span>
 )}
 <span className="truncate">{band.nombre_banda}</span>
 </h3>
 <VerifiedBadge isVerified={isLeadVerificado(band)} size="sm" />
 </div>
 
 <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-neutral-400">
 <span className="bg-neutral-800 px-2 py-1 rounded-md text-[#d1b375] flex items-center gap-1 shrink-0">
 <Music className="w-3 h-3 text-[#d1b375]" />
 <span className="truncate">{band.estilo_musical}</span>
 </span>

 <span className="bg-neutral-800/80 px-2 py-1 rounded-md text-neutral-300 flex items-center gap-1 shrink-0">
 <MapPin className="w-3 h-3 text-rose-400" />
 <span>{band.localizacion}</span>
 </span>

 <ReliabilityBadge item={band} size="sm" />
 </div>
 </div>

 {/* Actions Dropdown / Quick Status & Favorite */}
 <div className="shrink-0 flex items-center gap-1.5">
 <FavoriteButton 
 isFavorite={!!band.es_favorito}
 onToggle={(newVal) => handleUpdateBandFavorite(band.id, newVal)}
 size="sm"
 />
 {renderStatusBadge(band.estado_relacion)}
 </div>
 </div>

 {/* Contact & Audience Row */}
 <div className="p-3 rounded-xl bg-neutral-900/80 text-[10px] font-mono space-y-2">
 <div className="flex items-center justify-between text-neutral-300">
 <span className="text-[10px] text-neutral-400 uppercase">Contacto:</span>
 <span className="font-bold text-[#d1b375]">{band.contacto_nombre || 'Sin especificar'}</span>
 </div>

 {band.email && (
 <div className="flex items-center justify-between text-neutral-400 truncate">
 <span className="text-[10px] text-neutral-500 uppercase">Email:</span>
 <a href={`mailto:${band.email}`} className="text-sky-400 hover:underline truncate max-w-[180px]">
 {band.email}
 </a>
 </div>
 )}

 {band.telefono && (
 <div className="flex items-center justify-between text-neutral-400">
 <span className="text-[10px] text-neutral-500 uppercase">Teléfono:</span>
 <a href={`tel:${band.telefono}`} className="text-[#10b981] hover:underline">
 {band.telefono}
 </a>
 </div>
 )}

 <div className="flex items-center justify-between text-neutral-400 pt-1">
 <span className="text-[10px] text-neutral-500 uppercase">Aforo habitual:</span>
 <span className="font-bold text-neutral-200">{band.aforo_promedio ? `~${band.aforo_promedio} pers.` : 'No indicado'}</span>
 </div>
 </div>

 {/* Notes & Collaboration Ideas */}
 {band.notas_colaboracion && (
 <div className="p-2.5 rounded-xl bg-neutral-950/60 text-[10px] font-sans text-neutral-300 leading-relaxed italic">
 "{band.notas_colaboracion}"
 </div>
 )}
 </div>

 {/* Card Footer Actions */}
 <div className="pt-3 space-y-3">
 
 {/* Social Links & Last Contact */}
 <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
 <div className="flex items-center gap-2">
 {band.instagram && (
 <a 
 href={`https://instagram.com/${band.instagram.replace('@', '')}`}
 target="_blank" 
 rel="noreferrer"
 className="text-[#d1b375] hover:text-[#d1b375] flex items-center gap-1"
 title="Ver Instagram"
 >
 <Globe className="w-3 h-3" />
 <span>{band.instagram}</span>
 </a>
 )}
 </div>

 <span className="flex items-center gap-1 text-neutral-400">
 <Clock className="w-3 h-3 text-neutral-400" />
 <span>Últ. contacto: {band.ultimo_contacto || 'Reciente'}</span>
 </span>
 </div>

 {/* Action Buttons */}
 <div className="flex items-center gap-2">
 {/* Generate Pitch */}
 <button
 onClick={() => {
 setSelectedPitchBand(band);
 setIsPitchModalOpen(true);
 }}
 className="flex-1 py-1.5 px-2 bg-sky-500/15 hover:bg-sky-500/15 text-sky-400 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
 title="Generar Pitch de Date Swap"
 >
 <Repeat className="w-3.5 h-3.5 text-sky-400" />
 <span>Pitch Date Swap</span>
 </button>

 {/* Edit */}
 <button
 onClick={() => handleOpenEditModal(band)}
 className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors cursor-pointer"
 title="Editar Banda"
 >
 <Edit3 className="w-3.5 h-3.5" />
 </button>

 {/* Delete */}
 <button
 onClick={() => handleDeleteBand(band.id, band.nombre_banda)}
 className="p-1.5 bg-rose-500/15 hover:bg-rose-500/15 text-rose-400 rounded-lg transition-colors cursor-pointer"
 title="Eliminar Banda"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 /* TABLE LIST VIEW */
 <div className={` rounded-2xl overflow-hidden ${colors.card}  shadow-md overflow-x-auto`}>
 <table className="w-full text-left text-[10px] font-mono">
 <thead className="bg-neutral-900/90 text-neutral-400 uppercase tracking-wider text-[10px]">
 <tr>
 <th className="p-3.5">Banda / Artista</th>
 <th className="p-3.5">Estilo Musical</th>
 <th className="p-3.5">Localización</th>
 <th className="p-3.5">Estado Relación</th>
 <th className="p-3.5">Contacto</th>
 <th className="p-3.5">Aforo Habitual</th>
 <th className="p-3.5">Último Contacto</th>
 <th className="p-3.5 text-right">Acciones</th>
 </tr>
 </thead>
 <tbody className=" /60 text-neutral-300">
 {filteredBands.map((band) => (
 <tr key={band.id} className="hover:bg-neutral-900/50 transition-colors">
 <td className="p-3.5 font-bold text-white">
 <div className="flex items-center gap-2">
 {band.imagen_url ? (
 <img src={band.imagen_url} alt={band.nombre_banda} className="w-5 h-5 rounded-full object-cover border border-[#f2ca50]/50 shrink-0" />
 ) : (
 <span className="text-xs shrink-0">{band.icono || '🎸'}</span>
 )}
 <span>{band.nombre_banda}</span>
 </div>
 </td>
 <td className="p-3.5 text-[#d1b375]">{band.estilo_musical}</td>
 <td className="p-3.5">
 <span className="inline-flex items-center gap-1 text-neutral-300">
 <MapPin className="w-3 h-3 text-rose-400" />
 <span>{band.localizacion}</span>
 </span>
 </td>
 <td className="p-3.5">{renderStatusBadge(band.estado_relacion)}</td>
 <td className="p-3.5">
 <div className="space-y-0.5">
 <div className="text-[#d1b375] font-bold">{band.contacto_nombre || '-'}</div>
 <div className="text-[10px] text-neutral-400">{band.email || band.telefono || '-'}</div>
 </div>
 </td>
 <td className="p-3.5 font-mono">{band.aforo_promedio ? `${band.aforo_promedio} pers.` : '-'}</td>
 <td className="p-3.5 text-neutral-400">{band.ultimo_contacto}</td>
 <td className="p-3.5 text-right">
 <div className="flex items-center justify-end gap-1.5">
 <button
 onClick={() => {
 setSelectedPitchBand(band);
 setIsPitchModalOpen(true);
 }}
 className="px-2 py-1 bg-sky-500/15 hover:bg-sky-500/15 text-sky-400 rounded-lg text-[10px] transition-all cursor-pointer flex items-center gap-1"
 >
 <Repeat className="w-3 h-3 text-sky-400" />
 <span>Pitch</span>
 </button>

 <button
 onClick={() => handleOpenEditModal(band)}
 className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors cursor-pointer"
 title="Editar"
 >
 <Edit3 className="w-3.5 h-3.5" />
 </button>

 <button
 onClick={() => handleDeleteBand(band.id, band.nombre_banda)}
 className="p-1.5 bg-rose-500/15 hover:bg-rose-500/15 text-rose-400 rounded-lg transition-colors cursor-pointer"
 title="Eliminar"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </>
 )}

 {/* 4. MODAL: CREATE / EDIT BAND CONTACT */}
 {isAddEditModalOpen && (
 <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
 <div className={`w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#1c1b1b] text-neutral-100'
 }`}>
 <div className="flex items-center justify-between pb-3">
 <div className="flex items-center gap-2">
 <Music className="w-5 h-5 text-[#f2ca50]" />
 <h3 className="text-base font-bold font-display uppercase tracking-wider">
 {editingBand ? `Editar Banda: ${editingBand.nombre_banda}` : 'Añadir Nueva Banda al CRM'}
 </h3>
 </div>
 <button 
 onClick={() => setIsAddEditModalOpen(false)}
 className="p-1 hover:bg-neutral-800 rounded-lg transition-colors"
 >
 <X className="w-5 h-5 text-neutral-400" />
 </button>
 </div>

 <form onSubmit={handleSaveBand} className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 
 {/* Nombre de la Banda */}
 <div className="space-y-1 md:col-span-2">
 <div className="flex items-center justify-between">
 <label className="block text-[10px] font-mono uppercase text-neutral-400">Nombre de la Banda / Artista *</label>
 <button
 type="button"
 onClick={handleAiLookup}
 disabled={isAiSearching || !formName.trim()}
 className="flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl bg-[#f2ca50]/10 hover:bg-[#f2ca50]/20 text-[#f2ca50] border border-[#f2ca50]/30 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
 >
 {isAiSearching ? (
 <>
 <Loader2 className="w-3 h-3 animate-spin text-[#f2ca50]" />
 <span>Buscando en la Web...</span>
 </>
 ) : (
 <>
 <Sparkles className="w-3 h-3 text-[#f2ca50]" />
 <span>Buscar con IA (Autorellenar)</span>
 </>
 )}
 </button>
 </div>
 <input
 type="text"
 required
 value={formName}
 onChange={(e) => setFormName(e.target.value)}
 placeholder="Ej: Pardiez, La Señora Tomasa, Tarraco Ska..."
 className="w-full bg-neutral-900 text-white px-3 py-1.5 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#f2ca50]/50"
 />
 </div>

 {/* AI Proposal Overlay / Card */}
 {isAiSearching && (
 <div className="md:col-span-2 p-3 bg-neutral-900/90 border border-[#f2ca50]/30 rounded-xl flex items-center gap-3 text-xs text-[#f2ca50] font-mono animate-pulse">
 <Loader2 className="w-4 h-4 animate-spin text-[#f2ca50]" />
 <span>Buscando datos de "{formName}" con IA en la web...</span>
 </div>
 )}

 {aiError && (
 <div className="md:col-span-2 p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl flex items-center justify-between text-xs text-rose-300 font-mono">
 <span>⚠️ {aiError}</span>
 <button type="button" onClick={() => setAiError(null)} className="p-1 hover:bg-rose-900/50 rounded">
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 )}

 {aiProposal && (
 <div className="md:col-span-2 p-3.5 bg-zinc-900 border border-[#f2ca50]/40 rounded-xl space-y-3 text-xs font-mono shadow-xl">
 <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
 <div className="flex items-center gap-1.5 text-[#f2ca50] font-bold">
 <Sparkles className="w-4 h-4" />
 <span>Propuesta de la IA (Revisa antes de confirmar):</span>
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={handleApplyAllAiData}
 className="px-3 py-1 bg-[#f2ca50] text-[#3c2f00] font-bold rounded-lg text-[10px] hover:bg-[#e0b83e] transition-all cursor-pointer flex items-center gap-1 shadow"
 >
 <Check className="w-3.5 h-3.5" />
 <span>Aplicar Todo</span>
 </button>
 <button
 type="button"
 onClick={() => setAiProposal(null)}
 className="p-1 hover:bg-zinc-800 text-zinc-400 rounded-lg transition-colors cursor-pointer"
 title="Descartar propuesta"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-300">
 {aiProposal.estilo_musical && (
 <div className="flex items-center justify-between bg-zinc-950/70 p-2 rounded-lg border border-zinc-800">
 <div className="truncate pr-2"><span className="text-zinc-500 font-bold">Estilo:</span> {aiProposal.estilo_musical}</div>
 <button type="button" onClick={() => setFormStyle(aiProposal.estilo_musical)} className="text-[10px] font-bold text-[#f2ca50] hover:underline cursor-pointer shrink-0">Usar</button>
 </div>
 )}

 {aiProposal.localizacion && (
 <div className="flex items-center justify-between bg-zinc-950/70 p-2 rounded-lg border border-zinc-800">
 <div className="truncate pr-2"><span className="text-zinc-500 font-bold">Origen:</span> {aiProposal.localizacion}</div>
 <button type="button" onClick={() => setFormLocation(aiProposal.localizacion)} className="text-[10px] font-bold text-[#f2ca50] hover:underline cursor-pointer shrink-0">Usar</button>
 </div>
 )}

 {aiProposal.contacto_nombre && (
 <div className="flex items-center justify-between bg-zinc-950/70 p-2 rounded-lg border border-zinc-800">
 <div className="truncate pr-2"><span className="text-zinc-500 font-bold">Contacto:</span> {aiProposal.contacto_nombre}</div>
 <button type="button" onClick={() => setFormContactName(aiProposal.contacto_nombre)} className="text-[10px] font-bold text-[#f2ca50] hover:underline cursor-pointer shrink-0">Usar</button>
 </div>
 )}

 {aiProposal.email && (
 <div className="flex items-center justify-between bg-zinc-950/70 p-2 rounded-lg border border-zinc-800">
 <div className="truncate pr-2"><span className="text-zinc-500 font-bold">Email:</span> {aiProposal.email}</div>
 <button type="button" onClick={() => setFormEmail(aiProposal.email)} className="text-[10px] font-bold text-[#f2ca50] hover:underline cursor-pointer shrink-0">Usar</button>
 </div>
 )}

 {aiProposal.telefono && (
 <div className="flex items-center justify-between bg-zinc-950/70 p-2 rounded-lg border border-zinc-800">
 <div className="truncate pr-2"><span className="text-zinc-500 font-bold">Tel:</span> {aiProposal.telefono}</div>
 <button type="button" onClick={() => setFormPhone(aiProposal.telefono)} className="text-[10px] font-bold text-[#f2ca50] hover:underline cursor-pointer shrink-0">Usar</button>
 </div>
 )}

 {aiProposal.instagram && (
 <div className="flex items-center justify-between bg-zinc-950/70 p-2 rounded-lg border border-zinc-800">
 <div className="truncate pr-2"><span className="text-zinc-500 font-bold">Instagram:</span> {aiProposal.instagram}</div>
 <button type="button" onClick={() => setFormInstagram(aiProposal.instagram)} className="text-[10px] font-bold text-[#f2ca50] hover:underline cursor-pointer shrink-0">Usar</button>
 </div>
 )}

 {(aiProposal.spotify_url || aiProposal.youtube_url) && (
 <div className="flex items-center justify-between bg-zinc-950/70 p-2 rounded-lg border border-zinc-800 sm:col-span-2">
 <div className="truncate max-w-[80%]"><span className="text-zinc-500 font-bold">Música / Media:</span> {aiProposal.spotify_url || aiProposal.youtube_url}</div>
 <button type="button" onClick={() => setFormSpotifyYoutube(aiProposal.spotify_url || aiProposal.youtube_url)} className="text-[10px] font-bold text-[#f2ca50] hover:underline cursor-pointer shrink-0">Usar</button>
 </div>
 )}

 {aiProposal.biografia && (
 <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800 sm:col-span-2 space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-zinc-500 font-bold">Resumen / Bio:</span>
 <button type="button" onClick={() => setFormNotes(prev => prev ? `${prev}\n\n[Bio IA]: ${aiProposal.biografia}` : aiProposal.biografia)} className="text-[10px] font-bold text-[#f2ca50] hover:underline cursor-pointer shrink-0">Añadir a Notas</button>
 </div>
 <p className="text-[10px] text-zinc-300 italic leading-relaxed">{aiProposal.biografia}</p>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Icono o Imagen / Logo de la Banda */}
 <div className="space-y-2 sm:col-span-2 p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
 <label className="block text-[10px] font-mono uppercase text-[#f2ca50] font-bold">
 Icono o Logo / Foto de la Banda
 </label>

 <div className="flex flex-wrap items-center gap-3">
 {/* Preview current avatar */}
 <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
 {formImageUrl ? (
 <img src={formImageUrl} alt="Logo Banda" className="w-full h-full object-cover" />
 ) : (
 <span className="text-xl">{formIcon || '🎸'}</span>
 )}
 </div>

 {/* Emoji preset selection */}
 <div className="flex-1 space-y-1">
 <span className="text-[10px] text-neutral-400 block font-mono">Seleccionar icono emoji:</span>
 <div className="flex flex-wrap gap-1">
 {['🎸', '🎹', '🥁', '🎤', '🎷', '🎺', '🎧', '🪕', '🎻', '⚡', '🔥', '🌟', '🎶'].map(emoji => (
 <button
 key={emoji}
 type="button"
 onClick={() => { setFormIcon(emoji); }}
 className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
 formIcon === emoji && !formImageUrl
 ? 'bg-[#f2ca50]/20 border border-[#f2ca50] text-white scale-110'
 : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
 }`}
 >
 {emoji}
 </button>
 ))}
 </div>
 </div>

 {/* Upload file button */}
 <div className="shrink-0 space-y-1">
 <span className="text-[10px] text-neutral-400 block font-mono">O subir logo (Supabase):</span>
 <label className="cursor-pointer px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-[10px] font-mono text-zinc-200 flex items-center gap-1.5 transition-all active:scale-95">
 {isUploadingLogo ? (
 <Loader2 className="w-3.5 h-3.5 animate-spin text-[#f2ca50]" />
 ) : (
 <Upload className="w-3.5 h-3.5 text-[#f2ca50]" />
 )}
 <span>{isUploadingLogo ? 'Subiendo...' : 'Subir Imagen'}</span>
 <input
 type="file"
 accept="image/*"
 className="hidden"
 onChange={(e) => {
 const file = e.target.files?.[0];
 if (file) handleLogoUpload(file);
 }}
 />
 </label>
 {formImageUrl && (
 <button
 type="button"
 onClick={() => setFormImageUrl('')}
 className="text-[9px] text-rose-400 hover:underline block text-center"
 >
 Quitar imagen
 </button>
 )}
 </div>
 </div>
 </div>

 {/* Estilo Musical */}
 <div className="space-y-1">
 <label className="block text-[10px] font-mono uppercase text-neutral-400">Estilo Musical *</label>
 <input
 type="text"
 required
 value={formStyle}
 onChange={(e) => setFormStyle(e.target.value)}
 placeholder="Ej: Balkan Ska, Reggae, Punk, Mestizaje..."
 className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50"
 />
 </div>

 {/* Localización / Ciudad */}
 <div className="space-y-1">
 <label className="block text-[10px] font-mono uppercase text-neutral-400">Localización / Ciudad Principal *</label>
 <input
 type="text"
 required
 value={formLocation}
 onChange={(e) => setFormLocation(e.target.value)}
 placeholder="Ej: Barcelona, Madrid, Valencia, Sevilla..."
 className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50"
 />
 </div>

 {/* Estado de la Relación */}
 <div className="space-y-1">
 <label className="block text-[10px] font-mono uppercase text-neutral-400">Estado de la Relación</label>
 <select
 value={formStatus}
 onChange={(e) => setFormStatus(e.target.value as BandRelationshipStatus)}
 className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50 cursor-pointer"
 >
 <option value="sin_contactar">📡 Sin Contactar</option>
 <option value="intercambio_propuesto">🔄 Intercambio Propuesto (Date Swap)</option>
 <option value="concierto_agendado">⚡ Concierto Agendado</option>
 <option value="colegas_aliados">🤝 Colegas / Aliados de Gira</option>
 <option value="pendiente_respuesta">⏳ Pendiente Respuesta</option>
 <option value="no_disponible">❌ No Disponible</option>
 </select>
 </div>

 {/* Persona de Contacto */}
 <div className="space-y-1">
 <label className="block text-[10px] font-mono uppercase text-neutral-400">Persona de Contacto / Rol</label>
 <input
 type="text"
 value={formContactName}
 onChange={(e) => setFormContactName(e.target.value)}
 placeholder="Ej: Carlos (Mánager / Teclista)"
 className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50"
 />
 </div>

 {/* Último Contacto */}
 <div className="space-y-1">
 <label className="block text-[10px] font-mono uppercase text-neutral-400">Fecha de Último Contacto</label>
 <input
 type="date"
 value={formLastContact}
 onChange={(e) => setFormLastContact(e.target.value)}
 className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50"
 />
 </div>

 {/* Email */}
 <div className="space-y-1">
 <label className="block text-[10px] font-mono uppercase text-neutral-400">Email de Contacto / Booking</label>
 <input
 type="email"
 value={formEmail}
 onChange={(e) => setFormEmail(e.target.value)}
 placeholder="ejemplo@banda.com"
 className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50"
 />
 </div>

 {/* Teléfono */}
 <div className="space-y-1">
 <label className="block text-[10px] font-mono uppercase text-neutral-400">Teléfono / WhatsApp</label>
 <input
 type="text"
 value={formPhone}
 onChange={(e) => setFormPhone(e.target.value)}
 placeholder="+34 600 000 000"
 className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50"
 />
 </div>

 {/* Instagram */}
 <div className="space-y-1">
 <label className="block text-[10px] font-mono uppercase text-neutral-400">Instagram</label>
 <input
 type="text"
 value={formInstagram}
 onChange={(e) => setFormInstagram(e.target.value)}
 placeholder="@nombrebanda"
 className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50"
 />
 </div>

 {/* Aforo habitual */}
 <div className="space-y-1">
 <label className="block text-[10px] font-mono uppercase text-neutral-400">Aforo Promedio que Mueven</label>
 <input
 type="number"
 value={formAforo}
 onChange={(e) => setFormAforo(Number(e.target.value))}
 placeholder="300"
 className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50"
 />
 </div>
 </div>

 {/* Enlace Spotify / YouTube */}
 <div className="space-y-1">
 <label className="block text-[10px] font-mono uppercase text-neutral-400">Enlace Spotify / YouTube / Dossier</label>
 <input
 type="url"
 value={formSpotifyYoutube}
 onChange={(e) => setFormSpotifyYoutube(e.target.value)}
 placeholder="https://open.spotify.com/artist/..."
 className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50"
 />
 </div>

 {/* Notas de Colaboración */}
 <div className="space-y-1">
 <label className="block text-[10px] font-mono uppercase text-neutral-400">Notas de Colaboración / Salas propuestas / Intercambios</label>
 <textarea
 rows={3}
 value={formNotes}
 onChange={(e) => setFormNotes(e.target.value)}
 placeholder="Escribe notas relevantes para la colaboración (ej. Dispuestos a compartir fecha en Sala Apolo, proponen fecha en Noviembre)..."
 className="w-full bg-neutral-900 text-white p-3 rounded-xl text-[10px] font-sans leading-relaxed focus:outline-none focus:-[#f2ca50]/50"
 />
 </div>

 {/* Buttons */}
 <div className="flex items-center justify-end gap-3 pt-3">
 <button
 type="button"
 onClick={() => setIsAddEditModalOpen(false)}
 className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-[10px] rounded-xl transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
 >
 {editingBand ? 'Guardar Cambios' : 'Añadir Banda'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* 5. MODAL: DATE SWAP PITCH GENERATOR */}
 <BandPitchModal
 isOpen={isPitchModalOpen}
 onClose={() => setIsPitchModalOpen(false)}
 band={selectedPitchBand}
 isStitchLight={isStitchLight}
 proposedBakandeyaCity={proposedBakandeyaCity}
 setProposedBakandeyaCity={setProposedBakandeyaCity}
 proposedVenueBakandeya={proposedVenueBakandeya}
 setProposedVenueBakandeya={setProposedVenueBakandeya}
 proposedMonth={proposedMonth}
 setProposedMonth={setProposedMonth}
 generatePitchText={generatePitchText}
 />

 </div>
 );
}
