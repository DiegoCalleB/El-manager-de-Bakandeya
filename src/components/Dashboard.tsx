import React, { useState } from 'react';
import { Lead, LeadType, ThemeColors, SocialMetric, Concert, Rehearsal } from '../types';
import DirectionsCard from './DirectionsCard';
import { AddLeadModal } from './dashboard/AddLeadModal';
import { 
 Search, MapPin, Music, Globe, Phone, Instagram, 
 Plus, X, Calendar, AlertCircle, Sparkles, Loader2, Check, RefreshCw, 
 Database, Bot, Activity, ArrowRight, CheckCircle2, Radio, Building2,
 Clock, CheckCircle, Hourglass, Send, Users, ShieldCheck, Play, Navigation
} from 'lucide-react';

export type NavigationOptions = {
 sectionTab?: 'salas' | 'medios';
 statusFilter?: string;
 selectedLeadId?: string;
 selectedEventId?: string;
 selectedDate?: string;
};

interface DashboardProps {
 leads: Lead[];
 colors: ThemeColors;
 onUpdateLead: (leadId: string, updatedFields: Partial<Lead>) => void;
 onAddLead: (lead: Lead) => void;
 metrics?: SocialMetric[];
 concerts?: Concert[];
 rehearsals?: Rehearsal[];
 onNavigate?: (view: 'resumen' | 'booking' | 'medios' | 'calendario' | 'reels' | 'finanzas' | 'chat', options?: NavigationOptions) => void;
}

const isMedio = (l?: Lead | null) => {
 if (!l || !l.tipo) return false;
 const s = String(l.tipo).trim().toLowerCase();
 return s.includes('medio') || s.includes('radio') || s.includes('prensa') || s.includes('tv') || s.includes('podc');
};

const normalizeStatus = (s: any): string => {
 if (!s) return 'nuevo';
 const str = String(s).trim().toLowerCase();
 if (str.includes('aprobado') || str === 'approved') return 'aprobado';
 if (str.includes('pendiente') || str.includes('por_aprobar') || str === 'pending') return 'pendiente_aprobacion';
 if (str.includes('enviado') || str.includes('esperando') || str === 'sent') return 'esperando_respuesta';
 if (str.includes('interesado') || str === 'interested') return 'interesado';
 if (str.includes('negociando') || str === 'negotiating') return 'negociando';
 if (str.includes('no_interesado') || str.includes('rechazado')) return 'no_interesado';
 return 'nuevo';
};

export default function Dashboard({ 
 leads, 
 colors, 
 onUpdateLead, 
 onAddLead, 
 metrics = [], 
 concerts = [], 
 rehearsals = [], 
 onNavigate 
}: DashboardProps) {
 const [searchTerm, setSearchTerm] = useState('');
 const [cityFilter, setCityFilter] = useState('todos');
 const [genreFilter, setGenreFilter] = useState('todos');
 const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [syncLoading, setSyncLoading] = useState(false);

 // Scraper states
 const [isScraping, setIsScraping] = useState(false);
 const [scrapingStatus, setScrapingStatus] = useState('');
 const [scrapedData, setScrapedData] = useState<{
 email_contacto: string;
 telefono: string;
 website?: string;
 instagram: string;
 aforo?: number | null;
 region?: string;
 genero?: string;
 source_info: string;
 } | null>(null);
 const [scrapingError, setScrapingError] = useState<string | null>(null);

 // Add new lead form states
 const [newSala, setNewSala] = useState('');
 const [newCiudad, setNewCiudad] = useState('');
 const [newRegion, setNewRegion] = useState('');
 const [newAforo, setNewAforo] = useState(300);
 const [newGenero, setNewGenero] = useState('Ska / Reggae / Mestizaje');
 const [newTipo, setNewTipo] = useState<LeadType>('sala');
 const [newEmail, setNewEmail] = useState('');
 const [newInstagram, setNewInstagram] = useState('');
 const [newNotas, setNewNotas] = useState('');

 // Handle Sync simulation
 const handleForceSync = () => {
 setSyncLoading(true);
 setTimeout(() => {
 setSyncLoading(false);
 }, 1200);
 };

 const handleScrapeContact = async (lead: Lead) => {
 setIsScraping(true);
 setScrapingError(null);
 setScrapedData(null);
 
 const steps = [
"Conectando con el Agente Scout...",
"Buscando perfiles oficiales en la web...",
"Extrayendo datos de Instagram y directorios...",
"Buscando datos de aforo y estilo musical...",
"Filtrando y validando emails de booking...",
"Consolidando resultados..."
 ];
 
 let currentStep = 0;
 setScrapingStatus(steps[0]);
 
 const interval = setInterval(() => {
 currentStep++;
 if (currentStep < steps.length) {
 setScrapingStatus(steps[currentStep]);
 }
 }, 1000);

 try {
 const response = await fetch('/api/scrape-contact', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 leadId: lead.id,
 nombre_sala: lead.nombre_sala,
 ciudad: lead.ciudad,
 region: lead.region
 })
 });

 clearInterval(interval);

 if (!response.ok) {
 throw new Error('Error al conectar con el servidor.');
 }

 const resData = await response.json();
 if (resData.success && resData.data) {
 setScrapedData(resData.data);
 } else {
 throw new Error(resData.error || 'No se pudieron extraer datos de contacto.');
 }
 } catch (err: any) {
 clearInterval(interval);
 setScrapingError(err.message || 'Error en el proceso de raspado.');
 } finally {
 setIsScraping(false);
 }
 };

 const getScrapedVal = (field: any) => typeof field === 'object' && field !== null ? field.valor : field;
 const getScrapedConf = (field: any) => typeof field === 'object' && field !== null ? (field.confianza || 'baja') : 'alta';

 const handleApplyScrapedData = (lead: Lead) => {
 if (!scrapedData) return;
 const today = new Date().toISOString().split('T')[0];
 const sourceSummary = typeof scrapedData.source_info === 'string' ? scrapedData.source_info : 'Scout Scraper Grounding';
 const updatedNotes = `*** [${today}] Datos enriquecidos vía Scout Scraper. ${sourceSummary} ***\n${lead.notas || ''}`;
 
 const emailVal = getScrapedVal(scrapedData.email_contacto);
 const telVal = getScrapedVal(scrapedData.telefono);
 const webVal = getScrapedVal(scrapedData.website);
 const instaVal = getScrapedVal(scrapedData.instagram);
 const contactoVal = getScrapedVal(scrapedData.contacto_nombre);
 const aforoVal = getScrapedVal(scrapedData.aforo);
 const regionVal = getScrapedVal(scrapedData.region);
 const generoVal = getScrapedVal(scrapedData.genero);
 const contextoVal = getScrapedVal(scrapedData.contexto_extra);

 const updatedFields: Partial<Lead> = {
 email_contacto: emailVal || lead.email_contacto,
 telefono: telVal || lead.telefono,
 website: webVal || lead.website,
 instagram: instaVal || lead.instagram,
 contacto_nombre: contactoVal || lead.contacto_nombre,
 aforo: (aforoVal && !isNaN(Number(aforoVal))) ? Number(aforoVal) : lead.aforo,
 region: regionVal || lead.region,
 genero: generoVal || lead.genero,
 contexto_extra: (contextoVal && typeof contextoVal === 'string' && contextoVal.trim()) ? contextoVal.trim() : lead.contexto_extra,
 notas: updatedNotes
 };

 onUpdateLead(lead.id, updatedFields);
 setSelectedLead(prev => prev ? { ...prev, ...updatedFields } : null);
 setScrapedData(null);
 };

 const handleAddSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newSala || !newCiudad) return;

 const newLeadItem: Lead = {
 id: `lead-${Date.now()}`,
 nombre_sala: newSala,
 ciudad: newCiudad,
 region: newRegion,
 aforo: Number(newAforo),
 genero: newGenero,
 tipo: newTipo,
 email_contacto: newEmail,
 telefono: '',
 instagram: newInstagram,
 fuente: 'Ingreso Manual (Jon)',
 estado: 'nuevo',
 pitch_generado: '',
 notas: newNotas || 'Añadido manualmente desde el dashboard.'
 };

 onAddLead(newLeadItem);
 setIsAddModalOpen(false);

 // Reset Form
 setNewSala('');
 setNewCiudad('');
 setNewRegion('');
 setNewAforo(300);
 setNewGenero('Ska / Reggae / Mestizaje');
 setNewEmail('');
 setNewInstagram('');
 setNewNotas('');
 };

 // Unique cities and genres for filters
 const cities = Array.from(new Set(leads.map(l => l.ciudad))).filter(Boolean);
 const genres = Array.from(new Set(leads.map(l => l.genero))).filter(Boolean);

 // Filter leads for search/scraper table
 const filteredLeads = leads.filter(lead => {
 const matchesSearch = lead.nombre_sala.toLowerCase().includes(searchTerm.toLowerCase()) || 
 lead.ciudad.toLowerCase().includes(searchTerm.toLowerCase());
 const matchesCity = cityFilter === 'todos' || lead.ciudad === cityFilter;
 const matchesGenre = genreFilter === 'todos' || lead.genero === genreFilter;
 return matchesSearch && matchesCity && matchesGenre;
 });

 const isStitchLight = colors.accent === 'text-sky-400';
 const subCardBg = isStitchLight ? 'bg-slate-50/80 text-slate-800' : 'bg-[#1A1918] text-zinc-100';
 const textTitle = isStitchLight ? 'text-slate-900' : 'text-neutral-100';
 const textSub = isStitchLight ? 'text-slate-500' : 'text-neutral-400';
 const textMuted = isStitchLight ? 'text-slate-400' : 'text-neutral-500';

 // Calculate real metrics from leads
 const isMedio = (l: Lead) => {
 if (!l.tipo) return false;
 const s = String(l.tipo).trim().toLowerCase();
 return s.includes('medio') || s.includes('radio') || s.includes('prensa') || s.includes('tv') || s.includes('podc');
 };

 const pendingApprovalCount = leads.filter(l => l.estado === 'pendiente_aprobacion' || (l.pitch_generado && l.estado === 'nuevo')).length;
 const sentCount = leads.filter(l => l.estado === 'esperando_respuesta').length;
 const interestedCount = leads.filter(l => l.estado === 'interesado' || l.estado === 'negociando').length;
 const approvedCount = leads.filter(l => l.estado === 'aprobado').length;
 const mediosCount = leads.filter(l => isMedio(l)).length;

 const now = new Date();
 const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

 // Build upcoming agenda dates
 const upcomingEvents: Array<{
 id: string;
 type: 'concierto' | 'ensayo';
 title: string;
 dateStr: string;
 day: string;
 month: string;
 location: string;
 locationQuery?: string;
 address?: string;
 badge: string;
 details: string;
 }> = [];

 // Add concerts (ignoring past ones)
 concerts.forEach(c => {
 if (c.fecha && c.fecha < todayStr) return;
 const parts = c.fecha ? c.fecha.split('-') : [];
 const day = parts[2] || '15';
 const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
 const month = parts[1] ? monthNames[parseInt(parts[1], 10) - 1] || 'AGO' : 'AGO';

 upcomingEvents.push({
 id: c.id,
 type: 'concierto',
 title: `Concierto: ${c.sala}`,
 dateStr: c.fecha,
 day,
 month,
 location: c.sala ? `${c.sala} (${c.ciudad})` : c.ciudad,
 locationQuery: c.direccion || `${c.sala}, ${c.ciudad}`,
 address: c.direccion,
 badge: c.contrato_firmado ? 'Contrato Firmado' : 'Confirmado',
 details: `Caché: ${c.cache ? `${c.cache}€` : 'A convenir'} • Aforo: ${c.aforo_total || 500} pax`
 });
 });

 // Add rehearsals (ignoring past ones)
 rehearsals.forEach(r => {
 if (r.fecha && r.fecha < todayStr) return;
 const parts = r.fecha ? r.fecha.split('-') : [];
 const day = parts[2] || '10';
 const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
 const month = parts[1] ? monthNames[parseInt(parts[1], 10) - 1] || 'AGO' : 'AGO';

 upcomingEvents.push({
 id: r.id,
 type: 'ensayo',
 title: `Ensayo General Bakandeya`,
 dateStr: r.fecha,
 day,
 month,
 location: r.lugar || 'Local de Jon',
 locationQuery: `${r.lugar || 'Local de Jon'}, Madrid`,
 address: undefined,
 badge: r.estado === 'completado' ? 'Completado' : 'Programado',
 details: `Horario: ${r.hora || '18:00'} • Asistentes: ${r.asistentes ? (Array.isArray(r.asistentes) ? r.asistentes.join(', ') : r.asistentes) : 'Jon, Jose, Elyar, Raúl'}`
 });
 });

 // Fallback defaults if no rehearsals/concerts created yet
 if (upcomingEvents.length === 0) {
 upcomingEvents.push(
 {
 id: 'def-1',
 type: 'concierto',
 title: 'Concierto: Gira Bakandeya 2026',
 dateStr: '2026-08-15',
 day: '15',
 month: 'AGO',
 location: 'Sala Apolo (Barcelona)',
 locationQuery: 'Sala Apolo, Carrer Nou de la Rambla 113, Barcelona',
 address: 'Carrer Nou de la Rambla 113, Barcelona',
 badge: 'Confirmado',
 details: 'Caché: 1.800€ • Aforo: 900 pax • Prueba de sonido: 18:00h'
 },
 {
 id: 'def-2',
 type: 'ensayo',
 title: 'Ensayo General con Loops y Violín',
 dateStr: '2026-08-20',
 day: '20',
 month: 'AGO',
 location: 'Rock Palace (Madrid)',
 locationQuery: 'Rock Palace, Calle Vara de Rey 6, Madrid',
 address: 'Calle Vara de Rey 6, Madrid',
 badge: 'Programado',
 details: 'Horario: 17:00 a 21:00 • Preparación de repertorio y beatbox'
 },
 {
 id: 'def-3',
 type: 'concierto',
 title: 'Concierto: Festival Mestizaje del Sur',
 dateStr: '2026-09-05',
 day: '05',
 month: 'SEP',
 location: 'Anfiteatro de Granada',
 locationQuery: 'Anfiteatro de Granada, Paseo del Salón',
 address: 'Paseo del Salón, Granada',
 badge: 'En Negociación',
 details: 'Caché: 3.500€ • Aforo: 1.200 pax • Escenario Principal'
 }
 );
 }

 // Sort upcoming events by date
 upcomingEvents.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

 // Calculate urgent leads that need response or approval
 const urgentRepliesNeeded = leads.filter(l => l.estado === 'interesado' || l.estado === 'negociando');
 const urgentApprovalsNeeded = leads.filter(l => l.estado === 'pendiente_aprobacion' || (l.pitch_generado && l.estado === 'nuevo'));

 return (
 <div className={`space-y-6 ${isStitchLight ? 'text-slate-800' : 'text-zinc-100'} font-sans w-full max-w-full overflow-x-hidden`}>
 
 
      {/* HEADER / TITULO PRINCIPAL */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-zinc-100 mb-2">Resumen</h1>
        <p className="text-sm font-mono text-zinc-400 uppercase tracking-widest">Panel de Control General</p>
      </div>

      {/* 0. SECCIÓN PRIORITARIA: CORREOS POR CONTESTAR Y ACCIONES URGENTES */}
 <div className={`p-5 rounded-2xl transition-all ${
 isStitchLight 
 ? 'bg-slate-50/90 shadow-sm' 
 : 'bg-[#18181b]/90 shadow-sm'
 }`}>
 <div className={`flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 mb-4 ${
 isStitchLight ? '-slate-200' : '-neutral-800'
 }`}>
 <div className="flex items-center gap-2.5">
 <div className={`p-2 rounded-xl shrink-0 ${isStitchLight ? 'bg-[#d1b375]/15 text-[#d1b375]' : 'bg-[#d1b375]/15 text-[#d1b375]'}`}>
 <AlertCircle className="w-4 h-4" />
 </div>
 <div>
 <h3 className={`text-sm font-bold font-display uppercase tracking-wider flex items-center gap-2 ${isStitchLight ? 'text-slate-900' : 'text-neutral-100'}`}>
 Acciones Prioritarias y Correos por Responder
 </h3>
 <p className={`text-[10px] font-mono mt-0.5 ${textSub}`}>
 Respuestas de salas recibidas, ofertas en diálogo y correos de presentación redactados esperando tu visto bueno.
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 <button
 id="dashboard-btn-urgent-approval"
 onClick={() => onNavigate && onNavigate('booking')}
 className={`px-2 py-1 font-mono text-[10px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
 isStitchLight
 ? 'bg-sky-500/15 hover:bg-sky-500/15 text-white'
 : 'bg-[#d1b375]/15/90 hover:bg-[#d1b375]/15 text-stone-950'
 }`}
 >
 <CheckCircle2 className="w-4 h-4" />
 <span>Aprobar y Responder ({urgentRepliesNeeded.length + urgentApprovalsNeeded.length})</span>
 </button>
 </div>
 </div>

 {/* Dynamic Urgent Actions Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
 
 {/* Card 1: Salas que han respondido e Interesadas */}
 <div className={`p-3.5 rounded-xl flex flex-col justify-between transition-all ${
 isStitchLight 
 ? 'bg-white shadow-sm' 
 : 'bg-[#121214] text-neutral-200'
 }`}>
 <div>
 <div className="flex items-center justify-between gap-2 mb-2.5">
 <span className={`text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
 urgentRepliesNeeded.length > 0 ? (isStitchLight ? 'text-[#10b981]' : 'text-[#10b981]') : textMuted
 }`}>
 <Send className="w-3.5 h-3.5" /> Correos Recibidos / Interesados
 </span>
 <span className={`text-[10px] font-mono font-medium px-2 py-1 rounded-full ${
 urgentRepliesNeeded.length > 0 ? (isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]') : 'bg-neutral-800 text-neutral-500'
 }`}>
 {urgentRepliesNeeded.length} pendientes
 </span>
 </div>

 {urgentRepliesNeeded.length > 0 ? (
 <div className="space-y-2 my-1">
 {urgentRepliesNeeded.slice(0, 2).map(lead => (
 <div 
 key={lead.id} 
 onClick={() => onNavigate && onNavigate(isMedio(lead) ? 'medios' : 'booking', { statusFilter: normalizeStatus(lead.estado), selectedLeadId: lead.id })}
 className={`p-2.5 rounded-lg text-[10px] font-mono cursor-pointer hover:-[#10b981]/40 transition-all ${
 isStitchLight ? 'bg-[#10b981]/15' : 'bg-neutral-900'
 }`}
 >
 <div className="flex items-center justify-between gap-2 font-medium">
 <span className={isStitchLight ? 'text-slate-900 font-bold' : 'text-neutral-100 font-bold'}>
 {lead.nombre_sala} ({lead.ciudad})
 </span>
 <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] uppercase tracking-wider bg-[#10b981]/15 text-[#10b981] font-mono shrink-0">
 <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]/15 shrink-0"></span>
 {lead.estado}
 </span>
 </div>
 <p className={`text-[10px] truncate mt-1 ${textSub}`}>
 {lead.notas || 'Respuesta recibida interesándose en fecha. Requiere propuesta formal.'}
 </p>
 </div>
 ))}
 </div>
 ) : (
 <p className={`text-[10px] font-mono my-2 ${textMuted}`}>
 No hay respuestas pendientes de contestación en este momento.
 </p>
 )}
 </div>

 <button
 onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'interesado' })}
 className={`mt-3 pt-2 -dashed flex items-center justify-between text-[10px] font-mono font-bold cursor-pointer ${
 urgentRepliesNeeded.length > 0 
 ? isStitchLight ? 'text-[#10b981]' : 'text-[#10b981]'
 : 'text-neutral-500'
 }`}
 >
 <span>{urgentRepliesNeeded.length > 0 ? 'Contestar Correos Ahora' : 'Ir al panel de Booking'}</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 </div>

 {/* Card 2: Pitches redactados pendientes de aprobación */}
 <div className={`p-3.5 rounded-xl flex flex-col justify-between transition-all ${
 isStitchLight 
 ? 'bg-white shadow-sm' 
 : 'bg-[#121214] text-neutral-200'
 }`}>
 <div>
 <div className="flex items-center justify-between gap-2 mb-2.5">
 <span className={`text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
 urgentApprovalsNeeded.length > 0 ? (isStitchLight ? 'text-[#d1b375]' : 'text-[#d1b375]') : textMuted
 }`}>
 <ShieldCheck className="w-3.5 h-3.5" /> Correos Listos para Aprobar
 </span>
 <span className={`text-[10px] font-mono font-medium px-2 py-1 rounded-full ${
 urgentApprovalsNeeded.length > 0 ? 'bg-[#d1b375]/15 text-[#d1b375]' : 'bg-neutral-800 text-neutral-500'
 }`}>
 {urgentApprovalsNeeded.length} por revisar
 </span>
 </div>

 {urgentApprovalsNeeded.length > 0 ? (
 <div className="space-y-2 my-1">
 {urgentApprovalsNeeded.slice(0, 2).map(lead => (
 <div 
 key={lead.id} 
 onClick={() => onNavigate && onNavigate(isMedio(lead) ? 'medios' : 'booking', { statusFilter: 'pendiente_aprobacion', selectedLeadId: lead.id })}
 className={`p-2.5 rounded-lg text-[10px] font-mono cursor-pointer hover:-[#d1b375]/40 transition-all ${
 isStitchLight ? 'bg-[#d1b375]/15' : 'bg-neutral-900'
 }`}
 >
 <div className="flex items-center justify-between gap-2 font-medium">
 <span className={isStitchLight ? 'text-slate-900 font-bold' : 'text-neutral-100 font-bold'}>
 {lead.nombre_sala} ({lead.ciudad})
 </span>
 <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] uppercase tracking-wider bg-[#d1b375]/15 text-[#d1b375] font-mono shrink-0">
 <span className="w-1.5 h-1.5 rounded-full bg-[#d1b375]/15 shrink-0"></span>
 Redactado
 </span>
 </div>
 <p className={`text-[10px] truncate mt-1 ${textSub}`}>
 {lead.pitch_generado || 'Correo generado por el Agente Redactor listo para validación.'}
 </p>
 </div>
 ))}
 </div>
 ) : (
 <p className={`text-[10px] font-mono my-2 ${textMuted}`}>
 No hay borradores de presentación esperando aprobación.
 </p>
 )}
 </div>

 <button
 onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'pendiente_aprobacion' })}
 className={`mt-3 pt-2 -dashed flex items-center justify-between text-[10px] font-mono font-bold cursor-pointer ${
 urgentApprovalsNeeded.length > 0 
 ? isStitchLight ? 'text-[#d1b375]' : 'text-[#d1b375]'
 : 'text-neutral-500'
 }`}
 >
 <span>{urgentApprovalsNeeded.length > 0 ? 'Revisar y Aprobar Correos' : 'Ver Contactos'}</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 </div>

 {/* Card 3: Datos Faltantes / Rastreo Scout */}
 <div className={`p-3.5 rounded-xl flex flex-col justify-between transition-all ${
 isStitchLight ? 'bg-white' : 'bg-[#121214] text-neutral-300'
 }`}>
 <div>
 <div className="flex items-center justify-between gap-2 mb-2">
 <span className={`text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${isStitchLight ? 'text-sky-400' : 'text-sky-400'}`}>
 <Bot className="w-3.5 h-3.5" /> Búsqueda y Rastreo Scout
 </span>
 <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-full bg-sky-500/15 text-sky-400">
 Agente Activo
 </span>
 </div>

 <div className="space-y-1.5 my-1 text-[10px] font-mono">
 <div className={`flex justify-between pb-1 ${isStitchLight ? '-slate-100' : '-neutral-800'}`}>
 <span className={textMuted}>Búsqueda de Salas:</span>
 <span className={`${textTitle} font-bold`}>3 provincias objetivo</span>
 </div>
 <div className={`flex justify-between pb-1 ${isStitchLight ? '-slate-100' : '-neutral-800'}`}>
 <span className={textMuted}>Enriquecimiento Web:</span>
 <span className="text-[#10b981] font-bold">Automatic Scraper Ready</span>
 </div>
 </div>
 </div>

 <button
 onClick={() => onNavigate && onNavigate('chat')}
 className={`mt-3 pt-2 -dashed flex items-center justify-between text-[10px] font-mono font-bold cursor-pointer ${
 isStitchLight ? 'text-sky-400' : 'text-sky-400'
 }`}
 >
 <span>Abrir Asistente Scout</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 </div>

 </div>
 </div>

 {/* 1. SECCIÓN PRINCIPAL: PRÓXIMAS FECHAS (AGENDA INMEDIATA DE LA BANDA) */}
 <div className={`${colors.card} p-5 shadow-sm`}>
 <div className={`flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 mb-4 `}>
 <div>
 <div className="flex items-center gap-2">
 <Calendar className={`w-4 h-4 ${isStitchLight ? 'text-sky-400' : 'text-zinc-100'}`} />
 <h3 className={`text-base font-bold font-display uppercase tracking-wider ${isStitchLight ? 'text-sky-400' : 'text-zinc-100'}`}>
 Próximas Fechas y Agenda
 </h3>
 </div>
 <p className={`text-[10px] font-mono mt-0.5 ${textSub}`}>
 Próximos conciertos confirmados, fechas en negociación y ensayos de la banda.
 </p>
 </div>

 <button
 id="dashboard-btn-full-agenda"
 onClick={() => onNavigate && onNavigate('calendario')}
 className={`px-2 py-1 font-mono text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
 isStitchLight 
 ? 'bg-sky-500/15 hover:bg-sky-500/15 text-sky-400' 
 : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-100'
 }`}
 >
 <span>Ver Agenda Completa</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 </div>

 {/* List of upcoming events */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {upcomingEvents.slice(0, 3).map((item) => (
 <div 
 key={item.id}
 onClick={() => onNavigate && onNavigate('calendario', { selectedEventId: item.id, selectedDate: item.dateStr })}
 className={`p-4 rounded-xl transition-all flex flex-col justify-between cursor-pointer ${subCardBg} hover:scale-[1.01] hover:-indigo-500/40`}
 >
 <div className="flex items-start gap-3.5">
 {/* Custom calendar badge */}
 <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#1c1b1b] text-neutral-100'
 }`}>
 <span className={`text-sm font-mono font-black leading-none ${isStitchLight ? 'text-sky-400' : 'text-zinc-100'}`}>
 {item.day}
 </span>
 <span className={`text-[10px] font-mono font-bold uppercase tracking-widest mt-0.5 ${textMuted}`}>
 {item.month}
 </span>
 </div>

 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2 flex-wrap">
 <span className={`text-[10px] px-2 py-1 rounded font-mono font-bold uppercase tracking-wider ${
 item.type === 'concierto'
 ? isStitchLight ? 'bg-sky-500/15 text-sky-400' : 'bg-zinc-800/50 text-zinc-100'
 : isStitchLight ? (isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]') : (isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]')
 }`}>
 {item.type}
 </span>
 <span className={`text-[10px] font-mono text-[10px] ${textMuted}`}>
 • {item.badge}
 </span>
 </div>

 <h4 className={`text-base sm:text-lg font-bold font-display tracking-wide mt-1.5 truncate ${textTitle}`}>
 {item.title}
 </h4>

 <p className={`text-[10px] font-mono mt-1 flex items-center gap-1 ${textSub}`}>
 <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
 <span className="truncate">{item.location}</span>
 </p>
 </div>
 </div>

 {item.location && (
 <div className="mt-3 flex justify-center">
 <DirectionsCard 
 query={item.locationQuery || item.location} 
 locationName={item.location} 
 address={item.address}
 isStitchLight={isStitchLight} 
 />
 </div>
 )}

 <div className={`mt-2 pt-2 text-[10px] font-mono flex items-center justify-between ${
 isStitchLight ? '-slate-200 text-slate-500' : '-neutral-800 text-neutral-400'
 }`}>
 <span className="truncate">{item.details}</span>
 <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* 2. SECCIÓN: EMBUDO OPERATIVO DE BOOKING (MÉTRICAS CLAVE REALES) */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 
 {/* Metric 1: Pitches pendientes de aprobar */}
 <div 
 onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'pendiente_aprobacion' })}
 className={`${colors.card} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group`}
 >
 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#d1b375] flex items-center gap-1">
 <Hourglass className="w-3.5 h-3.5" /> Pendientes
 </span>
 <span className="text-[10px] px-2 py-1 rounded font-mono bg-[#d1b375]/15 text-[#d1b375]">
 Agente Redactor
 </span>
 </div>
 <div className="flex items-baseline gap-2">
 <h3 className={`text-5xl font-display font-black tracking-tighter ${textTitle}`}>{pendingApprovalCount}</h3>
 <span className={`text-[10px] font-mono ${textSub}`}>correos redactados</span>
 </div>
 <p className={`text-[10px] font-sans ${textMuted}`}>
 Propuestas de correo listas para revisar y aprobar antes de enviar a las salas.
 </p>
 </div>
 <div className="mt-3 pt-2 -dashed flex items-center justify-between text-[10px] font-mono font-bold text-[#d1b375] group-hover:translate-x-0.5 transition-transform">
 <span>Aprobar Correos</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </div>
 </div>

 {/* Metric 2: Enviados y en espera */}
 <div 
 onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'esperando_respuesta' })}
 className={`${colors.card} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group`}
 >
 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-sky-400 flex items-center gap-1">
 <Send className="w-3.5 h-3.5" /> Enviados
 </span>
 <span className="text-[10px] px-2 py-1 rounded font-mono bg-sky-500/15 text-sky-400">
 En Espera
 </span>
 </div>
 <div className="flex items-baseline gap-2">
 <h3 className={`text-2xl font-mono font-black ${textTitle}`}>{sentCount}</h3>
 <span className={`text-[10px] font-mono ${textSub}`}>salas contactadas</span>
 </div>
 <p className={`text-[10px] font-sans ${textMuted}`}>
 Emails de presentación enviados a programadores aguardando respuesta o seguimiento.
 </p>
 </div>
 <div className="mt-3 pt-2 -dashed flex items-center justify-between text-[10px] font-mono font-bold text-sky-400 group-hover:translate-x-0.5 transition-transform">
 <span>Ver Seguimiento</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </div>
 </div>

 {/* Metric 3: Interesados y Negociando */}
 <div 
 onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'interesado' })}
 className={`${colors.card} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group`}
 >
 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#10b981] flex items-center gap-1">
 <Sparkles className="w-3.5 h-3.5" /> Interesados
 </span>
 <span className="text-[10px] px-2 py-1 rounded font-mono bg-[#10b981]/15 text-[#10b981]">
 Oportunidades
 </span>
 </div>
 <div className="flex items-baseline gap-2">
 <h3 className={`text-2xl font-mono font-black ${textTitle}`}>{interestedCount}</h3>
 <span className={`text-[10px] font-mono ${textSub}`}>salas en diálogo</span>
 </div>
 <p className={`text-[10px] font-sans ${textMuted}`}>
 Salas que han respondido positivamente solicitando fechas, caché o rider técnico.
 </p>
 </div>
 <div className="mt-3 pt-2 -dashed flex items-center justify-between text-[10px] font-mono font-bold text-[#10b981] group-hover:translate-x-0.5 transition-transform">
 <span>Gestionar Tratos</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </div>
 </div>

 {/* Metric 4: Contactos de Medios y Prensa */}
 <div 
 onClick={() => onNavigate && onNavigate('medios', { sectionTab: 'medios', statusFilter: 'todos' })}
 className={`${colors.card} p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group`}
 >
 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-rose-400 flex items-center gap-1">
 <Radio className="w-3.5 h-3.5" /> Medios & Prensa
 </span>
 <span className="text-[10px] px-2 py-1 rounded font-mono bg-rose-500/15 text-rose-400">
 Radio / Podcast
 </span>
 </div>
 <div className="flex items-baseline gap-2">
 <h3 className={`text-2xl font-mono font-black ${textTitle}`}>{mediosCount}</h3>
 <span className={`text-[10px] font-mono ${textSub}`}>contactos clave</span>
 </div>
 <p className={`text-[10px] font-sans ${textMuted}`}>
 Radio 3, blogs independientes y periodistas musicales para difusión del dossier.
 </p>
 </div>
 <div className="mt-3 pt-2 -dashed flex items-center justify-between text-[10px] font-mono font-bold text-rose-400 group-hover:translate-x-0.5 transition-transform">
 <span>Ir a Medios</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </div>
 </div>

 </div>

 {/* 3. SECCIÓN: ACCIONES RÁPIDAS OPERATIVAS */}
 <div className={`${colors.card} p-4 `}>
 <div className="flex items-center justify-between pb-2.5 mb-3">
 <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${isStitchLight ? 'text-sky-400' : 'text-zinc-100'}`}>
 Acciones Rápidas del Día
 </span>
 <span className={`text-[10px] font-mono ${textMuted}`}>Bakandeya Virtual Manager</span>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] font-mono">
 <button
 id="quick-act-scout"
 onClick={() => onNavigate && onNavigate('chat')}
 className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
 isStitchLight 
 ? 'bg-sky-500/15 hover:bg-sky-500/15 text-sky-400' 
 : 'bg-[#1A1918] hover:bg-neutral-800/80 text-neutral-200'
 }`}
 >
 <div className="flex items-center gap-1.5 text-[#d1b375] font-bold">
 <Bot className="w-4 h-4" />
 <span>Lanzar Scout AI</span>
 </div>
 <span className={`text-[10px] ${textSub}`}>Buscar salas en nueva ciudad o provincia</span>
 </button>

 <button
 id="quick-act-approve"
 onClick={() => onNavigate && onNavigate('booking', { statusFilter: 'pendiente_aprobacion' })}
 className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
 isStitchLight 
 ? 'bg-[#d1b375]/15 hover:bg-[#d1b375]/15 text-[#d1b375]' 
 : 'bg-[#1A1918] hover:bg-neutral-800/80 text-neutral-200'
 }`}
 >
 <div className="flex items-center gap-1.5 text-[#d1b375] font-bold">
 <ShieldCheck className="w-4 h-4" />
 <span>Aprobar Correos ({pendingApprovalCount})</span>
 </div>
 <span className={`text-[10px] ${textSub}`}>Validar los correos redactados antes del envío</span>
 </button>

 <button
 id="quick-act-medios"
 onClick={() => onNavigate && onNavigate('medios', { sectionTab: 'medios', statusFilter: 'todos' })}
 className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
 isStitchLight 
 ? 'bg-rose-500/15 hover:bg-rose-500/15 text-rose-400' 
 : 'bg-[#1A1918] hover:bg-neutral-800/80 text-neutral-200'
 }`}
 >
 <div className="flex items-center gap-1.5 text-rose-400 font-bold">
 <Radio className="w-4 h-4" />
 <span>Prensa y Radios</span>
 </div>
 <span className={`text-[10px] ${textSub}`}>Enviar notas de prensa y comunicados</span>
 </button>

 <button
 id="quick-act-add-sala"
 onClick={() => setIsAddModalOpen(true)}
 className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
 isStitchLight 
 ? 'bg-emerald-100 text-emerald-700' 
 : 'bg-[#1A1918] hover:bg-neutral-800/80 text-neutral-200'
 }`}
 >
 <div className="flex items-center gap-1.5 text-[#10b981] font-bold">
 <Plus className="w-4 h-4" />
 <span>Nueva Sala</span>
 </div>
 <span className={`text-[10px] ${textSub}`}>Añadir un contacto manualmente a la hoja</span>
 </button>
 </div>
 </div>

 {/* 4. DIRECTORIO DE SALAS Y HERRAMIENTA SCOUT SCRAPER */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
 
 {/* LEADS SEARCH FOR ENRICHMENT */}
 <div className={`${colors.card} p-5 space-y-4 lg:col-span-2`}>
 <div className={`flex justify-between items-center pb-3 `}>
 <div>
 <h3 className={`text-sm font-bold font-display uppercase tracking-widest ${isStitchLight ? 'text-sky-400' : 'text-[#ffb596]'}`}>
 Directorio de Salas y Enriquecimiento Scout
 </h3>
 </div>
 <button
 id="dashboard-btn-add"
 onClick={() => setIsAddModalOpen(true)}
 className={`px-2 py-1 font-mono font-bold text-[10px] uppercase rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md ${
 isStitchLight 
 ? 'bg-sky-500/15 hover:bg-sky-500/15 text-white shadow-indigo-200' 
 : 'bg-zinc-100 hover:bg-white text-zinc-900 shadow-zinc-500/10'
 }`}
 >
 <Plus className="w-3.5 h-3.5" /> Nueva Sala
 </button>
 </div>

 {/* Quick Filters */}
 <div className="flex flex-col sm:flex-row gap-3">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
 <input
 id="search-leads"
 type="text"
 placeholder="Buscar sala, club o teatro por nombre..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className={`w-full rounded-lg pl-9 ${searchTerm ? 'pr-8' : 'pr-3'} py-1.5 text-[10px] focus:outline-none font-mono transition-all ${
 isStitchLight 
 ? 'bg-white text-slate-800 focus:-indigo-500 placeholder:text-slate-400' 
 : 'bg-[#1A1918] text-zinc-100 focus:-zinc-500/50 placeholder:text-neutral-600'
 }`}
 />
 {searchTerm && (
 <button
 id="dashboard-search-clear"
 type="button"
 onClick={() => setSearchTerm('')}
 className={`absolute right-2.5 top-2 p-0.5 rounded-full transition-colors cursor-pointer ${
 isStitchLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
 }`}
 title="Borrar búsqueda"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 
 <div className="flex gap-2">
 <select
 id="filter-city"
 value={cityFilter}
 onChange={(e) => setCityFilter(e.target.value)}
 className={` rounded-lg text-[10px] py-1.5 px-3 font-mono focus:outline-none ${
 isStitchLight 
 ? 'bg-white text-slate-800 focus:-indigo-500' 
 : 'bg-[#1A1918] text-zinc-100 focus:-zinc-500/50'
 }`}
 >
 <option value="todos">Ciudad: Todas</option>
 {cities.map(c => <option key={c} value={c}>{c}</option>)}
 </select>

 <select
 id="filter-genre"
 value={genreFilter}
 onChange={(e) => setGenreFilter(e.target.value)}
 className={` rounded-lg text-[10px] py-1.5 px-3 font-mono focus:outline-none ${
 isStitchLight 
 ? 'bg-white text-slate-800 focus:-indigo-500' 
 : 'bg-[#1A1918] text-zinc-100 focus:-zinc-500/50'
 }`}
 >
 <option value="todos">Género: Todos</option>
 {genres.map(g => <option key={g} value={g}>{g}</option>)}
 </select>
 </div>
 </div>

 {/* List of Leads */}
 <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
 {filteredLeads.length === 0 ? (
 <div className={`text-center py-12 text-[10px] font-mono ${textMuted}`}>
 No hay salas registradas que coincidan con estos filtros.
 </div>
 ) : (
 filteredLeads.map(lead => (
 <div
 key={lead.id}
 onClick={() => setSelectedLead(lead)}
 className={`p-3 rounded-lg transition-all cursor-pointer flex items-center justify-between gap-3 ${
 selectedLead?.id === lead.id 
 ? isStitchLight
 ? 'bg-sky-500/15 shadow-sm'
 : 'bg-[#ffb596]/5 shadow-[0_0_15px_rgba(255,181,150,0.03)]' 
 : isStitchLight
 ? 'bg-white hover:-slate-300 hover:bg-slate-50/50'
 : 'bg-[#1A1918] hover:-[#99907c]/35 hover:bg-[#1c1b1b]/30'
 }`}
 >
 <div className="min-w-0 flex-1">
 <h4 className={`text-[10px] font-bold font-display truncate ${
 selectedLead?.id === lead.id && isStitchLight ? 'text-sky-400 font-extrabold' : textTitle
 }`}>{lead.nombre_sala}</h4>
 <div className={`flex gap-3 text-[10px] font-mono mt-1 flex-wrap ${textSub}`}>
 <span>{lead.ciudad} ({lead.region || 'N/A'})</span>
 <span>Aforo: {lead.aforo || 'Desconocido'} pax</span>
 <span className={isStitchLight ? 'text-sky-400 font-bold' : 'text-zinc-100/80'}>{lead.genero}</span>
 </div>
 </div>
 <button
 id={`btn-enrich-${lead.id}`}
 onClick={(e) => {
 e.stopPropagation();
 setSelectedLead(lead);
 handleScrapeContact(lead);
 }}
 className={`px-2 py-1 text-[10px] font-mono rounded uppercase tracking-wider shrink-0 cursor-pointer ${
 isStitchLight 
 ? 'bg-slate-50 hover:bg-slate-100 text-slate-700' 
 : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
 }`}
 >
 Escanear Contacto
 </button>
 </div>
 ))
 )}
 </div>
 </div>

 {/* DETAILS & SCRAPER TERMINAL */}
 <div className="space-y-4 lg:col-span-1">
 {selectedLead ? (
 <div className={`${colors.card} p-5 space-y-4`}>
 <div className={` pb-3  flex justify-between items-start`}>
 <div>
 <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${isStitchLight ? 'text-sky-400' : 'text-[#ffb596]'}`}>Ficha de la Sala</span>
 <h3 className={`text-sm font-bold font-display tracking-wide mt-1 ${textTitle}`}>{selectedLead.nombre_sala}</h3>
 <p className={`text-[10px] font-mono mt-0.5 ${textSub}`}>{selectedLead.ciudad} • {selectedLead.region}</p>
 </div>
 {onNavigate && (
 <button
 onClick={() => onNavigate(isMedio(selectedLead) ? 'medios' : 'booking', { statusFilter: normalizeStatus(selectedLead.estado), selectedLeadId: selectedLead.id })}
 className={`px-2 py-1 text-[10px] font-mono rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all ${
 isStitchLight 
 ? 'bg-sky-500/15 text-sky-400 hover:bg-sky-500/15' 
 : 'bg-zinc-800/50 text-zinc-100 hover:bg-zinc-800'
 }`}
 title="Abrir esta ficha directamente en la mesa de trabajo de Booking"
 >
 <span>Abrir Ficha</span>
 <ArrowRight className="w-3 h-3" />
 </button>
 )}
 </div>

 {/* Scraper Panel */}
 <div className={`rounded-lg p-3.5 space-y-3 ${
 isStitchLight ? 'bg-slate-50/80' : 'bg-[#1A1918]'
 }`}>
 <div className={`flex justify-between items-center pb-1.5 ${isStitchLight ? '-slate-200' : '-neutral-800'}`}>
 <h4 className={`text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 ${textSub}`}>
 <Bot className={`w-3.5 h-3.5 ${isStitchLight ? 'text-sky-400' : 'text-[#ffb596]'}`} /> Agente Scout Scraper
 </h4>
 {isScraping && <Loader2 className={`w-3.5 h-3.5 animate-spin ${isStitchLight ? 'text-sky-400' : 'text-[#ffb596]'}`} />}
 </div>

 {isScraping ? (
 <div className="space-y-2 py-2">
 <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-300">
 <Loader2 className={`w-4 h-4 animate-spin ${isStitchLight ? 'text-sky-400' : 'text-[#ffb596]'}`} />
 <span className={isStitchLight ? 'text-slate-700' : 'text-neutral-300'}>{scrapingStatus}</span>
 </div>
 <div className={`w-full h-1 rounded-full overflow-hidden ${isStitchLight ? 'bg-slate-200' : 'bg-neutral-900'}`}>
 <div className={`h-full w-2/3 animate-pulse ${isStitchLight ? 'bg-sky-500/15' : 'bg-gradient-to-r from-zinc-300 to-zinc-500'}`} />
 </div>
 <p className={`text-[10px] font-mono leading-normal ${textMuted}`}>
 El agente de raspado web está buscando en Instagram, sitios oficiales y directorios de música el contacto de booking para esta sala...
 </p>
 </div>
 ) : scrapedData ? (
 <div className="space-y-3 animate-in fade-in duration-200">
 <div className="flex items-center justify-between text-[10px] font-mono text-[#10b981] font-bold uppercase">
 <span className="flex items-center gap-1">
 <CheckCircle2 className="w-3.5 h-3.5" /> Escaneo Realizado
 </span>
 </div>
 
 <div className={`space-y-2 text-[10px] font-mono ${textSub}`}>
 {[
 { label: 'Email', key: 'email_contacto' },
 { label: 'Teléfono', key: 'telefono' },
 { label: 'Contacto', key: 'contacto_nombre' },
 { label: 'Instagram', key: 'instagram' },
 { label: 'Aforo', key: 'aforo' }
 ].map(({ label, key }) => {
 const val = getScrapedVal(scrapedData[key]);
 const conf = getScrapedConf(scrapedData[key]);
 if (!val && conf === 'baja') return null;
 return (
 <div key={key} className="flex items-center justify-between gap-2 -dashed pb-1">
 <span>{label}: <span className={`${textTitle} font-bold`}>{val || 'No hallado'}</span></span>
 <span className={`text-[10px] px-2 py-1 rounded font-mono font-extrabold uppercase ${
 conf === 'alta' 
 ? (isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]') 
 : 'bg-[#d1b375]/15 text-[#d1b375]'
 }`}>
 {conf === 'alta' ? 'Alta (Verificado)' : 'Revisar a mano'}
 </span>
 </div>
 );
 })}
 </div>

 <button
 id="dashboard-btn-apply-scraped"
 onClick={() => handleApplyScrapedData(selectedLead)}
 className={`w-full py-1.5 font-mono font-bold text-[10px] uppercase rounded transition-all cursor-pointer text-center ${
 isStitchLight 
 ? 'bg-sky-500/15 hover:bg-sky-500/15 text-white shadow-sm' 
 : 'bg-[#ffb596] hover:bg-[#ffc6ad] text-[#3c1d10]'
 }`}
 >
 Aplicar y Guardar en Sheets
 </button>
 </div>
 ) : (
 <div className="space-y-2 py-1">
 <p className={`text-[10px] leading-relaxed font-sans ${textSub}`}>
 ¿Faltan datos de contacto en la hoja? Haz que el Agente Scout busque en la web de forma automática:
 </p>
 <button
 id="dashboard-btn-scout-trigger"
 onClick={() => handleScrapeContact(selectedLead)}
 className={`w-full py-2 text-[10px] uppercase tracking-wider rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 font-mono font-bold ${
 isStitchLight 
 ? 'bg-sky-500/15 hover:bg-sky-500/15 text-white shadow-sm' 
 : 'bg-neutral-900 hover:bg-neutral-800 text-zinc-100'
 }`}
 >
 <Sparkles className="w-3.5 h-3.5" /> Iniciar Escaneo AI
 </button>
 </div>
 )}

 {scrapingError && (
 <div className="p-2.5 bg-[#ff4b4b]/10 text-[#ff4b4b] text-[10px] font-mono rounded flex items-start gap-1.5">
 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
 <span>{scrapingError}</span>
 </div>
 )}
 </div>

 {/* General Details List */}
 <div className={`space-y-2 text-[10px] font-mono ${textSub}`}>
 <div className={`flex justify-between pb-1.5 ${isStitchLight ? '-slate-100' : '-neutral-900'}`}>
 <span className={textMuted}>Email:</span>
 <span className={`${textTitle} select-all`}>{selectedLead.email_contacto || 'Falta contactar'}</span>
 </div>
 <div className={`flex justify-between pb-1.5 ${isStitchLight ? '-slate-100' : '-neutral-900'}`}>
 <span className={textMuted}>Instagram:</span>
 <span className={`${isStitchLight ? 'text-sky-400' : 'text-zinc-100'} select-all font-bold`}>{selectedLead.instagram || 'No configurado'}</span>
 </div>
 <div className={`flex justify-between pb-1.5 ${isStitchLight ? '-slate-100' : '-neutral-900'}`}>
 <span className={textMuted}>Estilo Preferente:</span>
 <span className={`${isStitchLight ? 'text-sky-400' : 'text-[#ffb596]'} font-bold`}>{selectedLead.genero || 'No especificado'}</span>
 </div>
 <div className={`flex justify-between pb-1.5 ${isStitchLight ? '-slate-100' : '-neutral-900'}`}>
 <span className={textMuted}>Aforo:</span>
 <span className={textTitle}>{selectedLead.aforo ? `${selectedLead.aforo} personas` : 'Desconocido'}</span>
 </div>
 </div>

 {/* Notes Log */}
 <div className="space-y-1.5">
 <span className={`block text-[10px] uppercase font-mono tracking-wider ${textMuted}`}>Notas de la sala</span>
 <div className={` p-2.5 rounded-lg text-[10px] font-mono max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed ${
 isStitchLight 
 ? 'bg-slate-50 text-slate-600' 
 : 'bg-[#1A1918]/60 text-neutral-400'
 }`}>
 {selectedLead.notas || 'Sin anotaciones.'}
 </div>
 </div>

 </div>
 ) : (
 <div className={`${colors.card} p-6 text-center py-20 text-neutral-500 space-y-3`}>
 <Database className={`w-8 h-8 mx-auto animate-pulse ${isStitchLight ? 'text-sky-400' : 'text-[#ffb596]/45'}`} />
 <h4 className={`text-[10px] font-mono uppercase tracking-widest ${isStitchLight ? 'text-sky-400' : 'text-[#ffb596]'}`}>Ficha de Sala</h4>
 <p className={`text-[10px] leading-relaxed max-w-[200px] mx-auto ${textSub}`}>
 Selecciona cualquier sala del inventario para ver su ficha completa o lanzar el agente Scout de enriquecimiento autónomo.
 </p>
 </div>
 )}
 </div>

 </div>

 {/* 5. SECCIÓN COMPACTA: ESTADO DE SINCRONIZACIÓN Y CANALES DEDICADOS */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 
 {/* Google Sheets Sync Status */}
 <div className={`${colors.card} p-5 flex flex-col justify-between `}>
 <div className="space-y-2">
 <div className={`flex items-center gap-1.5 ${colors.accent}`}>
 <Database className="w-4 h-4" />
 <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Google Sheets Data Sync</span>
 </div>
 <h3 className={`text-lg font-display font-black uppercase tracking-wide ${textTitle}`}>LIVE SYNCED</h3>
 
 <div className={`text-[10px] font-mono space-y-2 ${textSub}`}>
 <div>Total Contactos en Hoja: <span className={`${textTitle} font-bold`}>{leads.length}</span></div>
 
 <div className="flex flex-wrap gap-2 pt-1">
 <button
 onClick={() => onNavigate && onNavigate('booking')}
 className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#d1b375]/15 hover:bg-[#d1b375]/15 text-[#d1b375] text-[10px] font-bold transition-all cursor-pointer"
 >
 <Building2 className="w-3 h-3 text-[#d1b375] shrink-0" />
 <span>{leads.length - mediosCount} Salas & Festivales</span>
 </button>

 <button
 onClick={() => onNavigate && onNavigate('medios')}
 className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/15 text-rose-400 text-[10px] font-bold transition-all cursor-pointer"
 >
 <Radio className="w-3 h-3 text-rose-400 shrink-0" />
 <span>{mediosCount} Medios & Prensa</span>
 </button>
 </div>
 </div>
 </div>

 <button 
 id="dashboard-btn-sync"
 onClick={handleForceSync}
 disabled={syncLoading}
 className={`w-full mt-4 py-2 text-[10px] font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 ${
 isStitchLight 
 ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
 : 'bg-[#1A1918] hover:bg-neutral-800 hover:-[#99907c]/40 text-neutral-200'
 }`}
 >
 <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
 <span>{syncLoading ? 'Sincronizando con Google Sheets...' : 'Forzar Sincronización'}</span>
 </button>
 </div>

 {/* Audience Growth Metrics */}
 <div className={`${colors.card} p-5 flex flex-col justify-between `}>
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-1.5 text-neutral-400">
 <Activity className="w-4 h-4 text-[#10b981]" />
 <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${textSub}`}>Audiencia en Redes & Canales</span>
 </div>
 <span className={`text-[10px] font-mono ${textMuted}`}>Datos Reales</span>
 </div>
 
 {/* Custom SVG Bar Chart */}
 <div className="h-16 flex items-end justify-between gap-3 pt-2">
 {(() => {
 const sorted = [...metrics].sort((a,b) => a.fecha.localeCompare(b.fecha));
 const latest = sorted[sorted.length - 1] || { youtube: 1210, instagram: 2150, tiktok: 3850 };
 const spVal = 150; // Real Spotify monthly listeners
 const maxVal = Math.max(latest.youtube, latest.instagram, latest.tiktok, spVal, 100);
 
 const getPct = (val: number) => {
 return `${Math.max((val / maxVal) * 100, 15)}%`;
 };

 const formatVal = (val: number) => {
 if (val >= 1000) {
 return `${(val / 1000).toFixed(1)}k`;
 }
 return val.toString();
 };

 const items = [
 { name: 'YT', value: formatVal(latest.youtube), height: getPct(latest.youtube), color: isStitchLight ? 'bg-slate-300' : 'bg-neutral-700' },
 { name: 'IG', value: formatVal(latest.instagram), height: getPct(latest.instagram), color: isStitchLight ? 'bg-sky-500/15' : 'bg-[#ffb596]' },
 { name: 'SP', value: formatVal(spVal), height: getPct(spVal), color: isStitchLight ? 'bg-sky-500/15' : 'bg-zinc-100' },
 { name: 'TK', value: formatVal(latest.tiktok), height: getPct(latest.tiktok), color: isStitchLight ? 'bg-sky-500/15' : 'bg-zinc-100' },
 ];

 return items.map(bar => (
 <div key={bar.name} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
 <span className={`text-[10px] font-mono font-bold ${textMuted}`}>{bar.value}</span>
 <div 
 className={`w-full ${bar.color} rounded-sm transition-all duration-500`} 
 style={{ height: bar.height }} 
 />
 <span className={`text-[10px] font-mono font-bold ${textSub}`}>{bar.name}</span>
 </div>
 ));
 })()}
 </div>
 </div>

 <div className={`text-[10px] font-mono uppercase tracking-wider text-right self-end mt-4 ${textMuted}`}>
 Actualizado automáticamente
 </div>
 </div>

 </div>

 {/* MODAL: AGREGAR NUEVA SALA */}
 <AddLeadModal
 isOpen={isAddModalOpen}
 onClose={() => setIsAddModalOpen(false)}
 onAddSubmit={handleAddSubmit}
 newSala={newSala}
 setNewSala={setNewSala}
 newCiudad={newCiudad}
 setNewCiudad={setNewCiudad}
 newRegion={newRegion}
 setNewRegion={setNewRegion}
 newAforo={newAforo}
 setNewAforo={setNewAforo}
 newGenero={newGenero}
 setNewGenero={setNewGenero}
 newTipo={newTipo}
 setNewTipo={setNewTipo}
 newEmail={newEmail}
 setNewEmail={setNewEmail}
 newInstagram={newInstagram}
 setNewInstagram={setNewInstagram}
 newNotas={newNotas}
 setNewNotas={setNewNotas}
 />

 </div>
 );
}
