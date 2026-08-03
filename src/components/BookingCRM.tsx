import React, { useState, useEffect, useMemo } from 'react';
import { Lead, LeadStatus, LeadType, ThemeColors } from '../types';
import { apiFetch } from '../utils/api';
import { 
 Search, ShieldCheck, Mail, Clock, Check, X, RefreshCw, 
 MapPin, Users, Bot, MessageSquare, Edit3, Settings, Sparkles, Send, LogOut, Loader2, Building, Radio, Building2, Tent, Landmark, Disc3, Briefcase,
 PlusCircle, Newspaper, Tv, Headphones, Globe, FileText, Plus, SlidersHorizontal, Map as MapIcon, List,
 Share2, Repeat, Truck, Handshake, Music, Zap
} from 'lucide-react';
import { initAuth, googleSignIn, logout, fetchGmailThreadsForEmail } from '../utils/gmail';
import { VenueMap } from './VenueMap';

export type TemplateCategory = 'salas' | 'festivales' | 'discotecas' | 'medios' | 'grupos' | 'managements';

interface BookingCRMProps {
 leads: Lead[];
 colors: ThemeColors;
 onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
 onAddLead?: (lead: Lead) => void;
 initialSection?: 'salas' | 'medios' | 'grupos';
 initialStatusFilter?: LeadStatus | 'todos';
 initialSelectedLeadId?: string;
}

// Helper to normalize status strings from Excel or UI
export const normalizeStatus = (s: any): LeadStatus => {
 if (!s) return 'nuevo';
 const str = String(s).trim().toLowerCase();
 if (str === 'nuevo' || str.includes('contactar') || str === 'new' || str === 'por_contactar') return 'nuevo';
 if (str === 'pendiente_aprobacion' || str.includes('aprobar') || str === 'pendiente' || str === 'por_aprobar') return 'pendiente_aprobacion';
 if (str === 'aprobado' || str.includes('listo') || str === 'aprobados') return 'aprobado';
 if (str === 'esperando_respuesta' || str.includes('enviado') || str.includes('esperando') || str === 'enviados') return 'esperando_respuesta';
 if (str.includes('interesado') && !str.includes('no')) return 'interesado';
 if (str.includes('negociando')) return 'negociando';
 if (str.includes('no') || str === 'no_interesado' || str.includes('rechazado')) return 'no_interesado';
 return 'nuevo';
};

// Helper to normalize lead types
export const normalizeType = (t: any): LeadType => {
 if (!t) return 'sala';
 const s = String(t).trim().toLowerCase();
 if (s.includes('festiv') || s === 'festival') return 'festival';
 if (s.includes('ayunt') || s.includes('fiesta') || s.includes('municip') || s === 'ayuntamiento') return 'ayuntamiento';
 if (s.includes('disco') || s.includes('club') || s.includes('nightclub') || s === 'discoteca') return 'discoteca';
 if (s.includes('grup') || s.includes('artist') || s.includes('banda') || s === 'grupo') return 'grupo';
 if (s.includes('product') || s.includes('agencia') || s.includes('manag') || s === 'productora') return 'productora';
 if (s.includes('medio') || s.includes('radio') || s.includes('prensa') || s.includes('tv') || s.includes('podc') || s === 'medio') return 'medio';
 return 'sala';
};

// Known Spanish venues address database for intelligent address enrichment
export const VENUE_ADDRESS_DATABASE: Record<string, string> = {
 'sala trinchera': 'Calle Parauta, 25, 29006 Málaga',
 'trinchera': 'Calle Parauta, 25, 29006 Málaga',
 'sala apolo': 'Carrer de Nou de la Rambla, 113, 08004 Barcelona',
 'apolo': 'Carrer de Nou de la Rambla, 113, 08004 Barcelona',
 'ochoymedio club': 'Calle de Barceló, 11, 28004 Madrid',
 'ochoymedio': 'Calle de Barceló, 11, 28004 Madrid',
 'sala el tren': 'Carretera de Málaga, 136, 18015 Granada',
 'el tren': 'Carretera de Málaga, 136, 18015 Granada',
 'sala razzmatazz': 'Carrer dels Almogàvers, 122, 08018 Barcelona',
 'razzmatazz': 'Carrer dels Almogàvers, 122, 08018 Barcelona',
 'kafe antzokia': 'San Vicente Kalea, 2, 48001 Bilbo, Bizkaia',
 'sala capitol': 'Rúa de Concepción Arenal, 5, 15702 Santiago de Compostela',
 'sala rem': 'Calle Puerta Nueva, 33, 30001 Murcia',
 'sala custom': 'Calle Metalurgia, 25, 41007 Sevilla',
 'sala villanos': 'Calle Bernardino Obregón, 18, 28012 Madrid',
 'sala hebe': 'Calle Tomás Esteban, 28, 28018 Madrid',
 'sala caracol': 'Calle Bernardino Obregón, 18, 28012 Madrid',
 'industrial copera': 'Calle Desmond Tutu, 18151 La Zulka, Granada',
 'garaje beat club': 'Avenida Miguel de Cervantes, 45, 30009 Murcia',
 'dabadaba': 'Mundaiz Kalea, 8, 20012 Donostia, Gipuzkoa',
 'sala moon': 'Carrer de San Vicente Mártir, 200, 46007 València',
 'paris 15': 'Calle Calle La Orotava, 27, 29006 Málaga',
 'joy eslava': 'Calle Arenal, 11, 28013 Madrid',
 'moby dick club': 'Avenida de Brasil, 5, 28020 Madrid',
 'viña rock': 'Recinto Ferial, 02600 Villarrobledo, Albacete',
 'cabo de plata': 'Playa de la Hierbabuena, 11160 Barbate, Cádiz'
};

export function autoDetectVenueAddress(nombreSala: string, ciudad: string): string {
 if (!nombreSala) return '';
 const cleanName = nombreSala.toLowerCase().trim();
 for (const [key, addr] of Object.entries(VENUE_ADDRESS_DATABASE)) {
 if (cleanName.includes(key) || key.includes(cleanName)) {
 return addr;
 }
 }
 return '';
}

export default function BookingCRM({ 
 leads, 
 colors, 
 onUpdateLead, 
 onAddLead, 
 initialSection = 'salas',
 initialStatusFilter = 'todos',
 initialSelectedLeadId
}: BookingCRMProps) {
 const [sectionTab, setSectionTab] = useState<'salas' | 'medios' | 'grupos'>(initialSection || 'salas');
 const [searchTerm, setSearchTerm] = useState('');
 const [statusFilter, setStatusFilter] = useState<LeadStatus | 'todos'>(initialStatusFilter);

 useEffect(() => {
 if (initialSection) {
 setSectionTab(initialSection);
 }
 }, [initialSection]);

 useEffect(() => {
 if (initialStatusFilter !== undefined) {
 setStatusFilter(initialStatusFilter);
 }
 }, [initialStatusFilter]);

 useEffect(() => {
 if (initialSelectedLeadId) {
 const found = leads.find(l => l.id === initialSelectedLeadId);
 if (found) {
 setSelectedLead(found);
 setTimeout(() => {
 if (interventionPanelRef.current) {
 interventionPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
 }
 }, 150);
 }
 }
 }, [initialSelectedLeadId, leads]);

 const [typeFilter, setTypeFilter] = useState<LeadType | 'todos'>('todos');
 const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
 const [selectedCityFilter, setSelectedCityFilter] = useState<string>('');
 
 // Custom City Chips state (persisted per band/user session)
 const [customCityChips, setCustomCityChips] = useState<string[]>(() => {
 try {
 const saved = localStorage.getItem('bakandeya_custom_cities');
 return saved ? JSON.parse(saved) : [];
 } catch {
 return [];
 }
 });
 const [isAddingCityChip, setIsAddingCityChip] = useState(false);
 const [newCityInput, setNewCityInput] = useState('');

 // Dynamically extract top cities present in active leads
 const activeLeadsForSection = useMemo(() => {
 return leads.filter(l => sectionTab === 'medios' ? normalizeType(l.tipo) === 'medio' : normalizeType(l.tipo) !== 'medio');
 }, [leads, sectionTab]);

 const cityCounts = useMemo(() => {
 const counts: Record<string, number> = {};
 activeLeadsForSection.forEach(l => {
 const cityRaw = (l.ciudad || '').trim();
 if (cityRaw) {
 const mainCity = cityRaw.split(/[\(\-\/]/)[0].trim();
 if (mainCity) {
 counts[mainCity] = (counts[mainCity] || 0) + 1;
 }
 }
 });
 return counts;
 }, [activeLeadsForSection]);

 const topDynamicCities = useMemo(() => {
 return Object.entries(cityCounts)
 .sort((a, b) => Number(b[1]) - Number(a[1]))
 .slice(0, 7)
 .map(([cityName]) => cityName);
 }, [cityCounts]);

 const displayCityChips = useMemo(() => {
 const list = [...new Set([...customCityChips, ...topDynamicCities])];
 return list;
 }, [topDynamicCities, customCityChips]);

 const handleAddCustomCity = (e?: React.FormEvent) => {
 if (e) e.preventDefault();
 if (!newCityInput.trim()) return;
 const formatted = newCityInput.trim();
 if (!customCityChips.includes(formatted)) {
 const updated = [...customCityChips, formatted];
 setCustomCityChips(updated);
 try { localStorage.setItem('bakandeya_custom_cities', JSON.stringify(updated)); } catch {}
 }
 setSelectedCityFilter(formatted);
 setNewCityInput('');
 setIsAddingCityChip(false);
 };

 const handleRemoveCustomCity = (cityToRemove: string, e: React.MouseEvent) => {
 e.stopPropagation();
 const updated = customCityChips.filter(c => c !== cityToRemove);
 setCustomCityChips(updated);
 try { localStorage.setItem('bakandeya_custom_cities', JSON.stringify(updated)); } catch {}
 if (selectedCityFilter === cityToRemove) {
 setSelectedCityFilter('');
 }
 };

 const interventionPanelRef = React.useRef<HTMLDivElement>(null);
 const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

 // Automatically detect & save address when a lead is selected
 useEffect(() => {
 if (selectedLead && !selectedLead.direccion && selectedLead.nombre_sala) {
 const detected = autoDetectVenueAddress(selectedLead.nombre_sala, selectedLead.ciudad || '');
 if (detected) {
 onUpdateLead(selectedLead.id, { direccion: detected });
 setSelectedLead(prev => prev ? { ...prev, direccion: detected } : null);
 }
 }
 }, [selectedLead?.id, selectedLead?.nombre_sala, selectedLead?.direccion]);
 const [isEditingPitch, setIsEditingPitch] = useState(false);
 const [editedPitch, setEditedPitch] = useState('');
 const [rejectionNotes, setRejectionNotes] = useState('');
 const [isRejecting, setIsRejecting] = useState(false);

 // Editable Lead Info state
 const [isEditingLeadInfo, setIsEditingLeadInfo] = useState(false);
 const [editedLeadInfo, setEditedLeadInfo] = useState<Partial<Lead>>({});

 // New Lead / Medio Modal
 const [isAddingLeadModalOpen, setIsAddingLeadModalOpen] = useState(false);
 const [newLeadData, setNewLeadData] = useState({
 nombre_sala: '',
 ciudad: '',
 region: 'Nacional',
 aforo: 0,
 tipo: 'medio' as LeadType,
 email_contacto: '',
 telefono: '',
 website: '',
 genero: 'Radio',
 notas: '',
 pitch_generado: ''
 });

 // Modal AI Scout Scraping state
 const [isModalScraping, setIsModalScraping] = useState(false);
 const [modalScrapeStatus, setModalScrapeStatus] = useState('');
 const [modalScrapeError, setModalScrapeError] = useState('');
 const [modalScrapeSuccessMsg, setModalScrapeSuccessMsg] = useState('');

 // Selected Lead AI Scout Scraping state
 const [isScrapingLead, setIsScrapingLead] = useState(false);
 const [scrapingLeadStatus, setScrapingLeadStatus] = useState('');
 const [scrapedDataForLead, setScrapedDataForLead] = useState<any | null>(null);
 const [scrapingLeadError, setScrapingLeadError] = useState<string | null>(null);

 // Gmail integration states
 const [gmailUser, setGmailUser] = useState<any>(null);
 const [gmailToken, setGmailToken] = useState<string | null>(null);
 const [isSyncingGmail, setIsSyncingGmail] = useState(false);
 const [gmailStatusMsg, setGmailStatusMsg] = useState('');

 // Email thread and manual dispatch states
 const [activeTab, setActiveTab] = useState<'info' | 'emails'>('info');
 const [manualEmailBody, setManualEmailBody] = useState('');
 const [manualEmailSubject, setManualEmailSubject] = useState('');
 const [manualEmailSender, setManualEmailSender] = useState('Bakandeya Agent Manager IA');
 const [manualEmailStatus, setManualEmailStatus] = useState('');

 // Advanced Simulation States
 const [isSimulatingAvanzado, setIsSimulatingAvanzado] = useState(false);
 const [simulationRole, setSimulationRole] = useState<'sala' | 'banda'>('sala');
 const [simulationScenario, setSimulationScenario] = useState('taquilla');
 const [simulationCustomInstruction, setSimulationCustomInstruction] = useState('');
 const [simulationSenderName, setSimulationSenderName] = useState('Programación');
 const [simulationSubject, setSimulationSubject] = useState('');
 const [simulationMessage, setSimulationMessage] = useState('');
 const [isGeneratingSimulation, setIsGeneratingSimulation] = useState(false);
 const [simulationGenerated, setSimulationGenerated] = useState(false);

 const PREDEFINED_SCENARIOS = {
 sala: [
 { key: 'taquilla', label: 'Interés y reparto de taquilla (70/30 o similar)', defaultInstruction: 'La sala muestra gran interés por el directo. Propone una fecha de viernes o sábado de noviembre, un reparto de taquilla del 70/30 a favor de la banda, y entradas a 12€.' },
 { key: 'rider', label: 'Exigencias de Rider Técnico y horarios', defaultInstruction: 'La sala está interesada pero exige revisar detalladamente el rider de violín, percusión y sintetizadores analógicos, y pregunta por la hora de montaje de Bakandeya.' },
 { key: 'lleno', label: 'Rechazo amable por calendario lleno', defaultInstruction: 'La sala felicita a la banda por su dossier pero explica que tiene el calendario de otoño cerrado. Ofrece dejar el contacto para la gira de primavera.' },
 { key: 'contrato', label: 'Aceptación final y petición de datos fiscales', defaultInstruction: 'La sala confirma la fecha sugerida en el pitch, acepta las condiciones de la banda y solicita los datos fiscales (CIF, dirección, representante) para redactar el contrato oficial.' },
 { key: 'custom', label: 'Instrucción libre personalizada...', defaultInstruction: '' }
 ],
 banda: [
 { key: 'contrapropuesta', label: 'Contrapropuesta de fecha (Fin de semana) y co-organización', defaultInstruction: 'Bakandeya Agent Manager IA responde sugiriendo cambiar un concierto propuesto en miércoles a un viernes o sábado de noviembre, y sugiere compartir cartel con una banda local para asegurar aforo.' },
 { key: 'aceptacion_rider', label: 'Aceptación de condiciones y especificación de sintetizadores', defaultInstruction: 'Diego (guitarra) responde aceptando el reparto de taquilla propuesto y especifica que los sintetizadores analógicos van listos en dos líneas estéreo balanceadas.' },
 { key: 'cache_minimo', label: 'Solicitud de caché o mínimo garantizado para cubrir furgoneta', defaultInstruction: 'Filgue (bajo) responde explicando de forma amigable que al viajar desde Madrid/Sevilla necesitan un mínimo garantizado de 300€ para cubrir gastos de gasolina y viaje.' },
 { key: 'custom', label: 'Instrucción libre personalizada...', defaultInstruction: '' }
 ]
 };

 const handleRoleChange = (role: 'sala' | 'banda') => {
 setSimulationRole(role);
 setSimulationGenerated(false);
 setSimulationMessage('');
 
 if (role === 'sala') {
 setSimulationSenderName(selectedLead ? `Programador de ${selectedLead.nombre_sala}` : 'Programación');
 setSimulationScenario('taquilla');
 setSimulationSubject(selectedLead?.hilo_emails && selectedLead.hilo_emails.length > 0
 ? `RE: ${selectedLead.hilo_emails[selectedLead.hilo_emails.length - 1].asunto}`
 : 'Re: Propuesta de concierto - Bakandeya');
 setSimulationCustomInstruction('La sala muestra gran interés por el directo. Propone una fecha de viernes o sábado de noviembre, un reparto de taquilla del 70/30 a favor de la banda, y entradas a 12€.');
 } else {
 setSimulationSenderName('Bakandeya Agent Manager IA');
 setSimulationScenario('contrapropuesta');
 setSimulationSubject(selectedLead?.hilo_emails && selectedLead.hilo_emails.length > 0
 ? `RE: ${selectedLead.hilo_emails[selectedLead.hilo_emails.length - 1].asunto}`
 : 'Re: Propuesta de concierto - Bakandeya');
 setSimulationCustomInstruction('Bakandeya Agent Manager IA responde sugiriendo cambiar un concierto propuesto en miércoles a un viernes o sábado de noviembre, y sugiere compartir cartel con una banda local para asegurar aforo.');
 }
 };

 const handleScenarioChange = (scenarioKey: string) => {
 setSimulationScenario(scenarioKey);
 setSimulationGenerated(false);
 setSimulationMessage('');
 
 const scenarios = simulationRole === 'sala' ? PREDEFINED_SCENARIOS.sala : PREDEFINED_SCENARIOS.banda;
 const found = scenarios.find(s => s.key === scenarioKey);
 if (found) {
 setSimulationCustomInstruction(found.defaultInstruction);
 }
 };

 const handleOpenAdvancedSimulation = () => {
 if (!selectedLead) return;
 setIsSimulatingAvanzado(true);
 setSimulationGenerated(false);
 setSimulationMessage('');
 
 setSimulationRole('sala');
 setSimulationScenario('taquilla');
 setSimulationSenderName(`Programador de ${selectedLead.nombre_sala}`);
 setSimulationSubject(selectedLead.hilo_emails && selectedLead.hilo_emails.length > 0
 ? `RE: ${selectedLead.hilo_emails[selectedLead.hilo_emails.length - 1].asunto}`
 : 'Re: Propuesta de concierto - Bakandeya');
 setSimulationCustomInstruction('La sala muestra gran interés por el directo. Propone una fecha de viernes o sábado de noviembre, un reparto de taquilla del 70/30 a favor de la banda, y entradas a 12€.');
 };

 const handleGenerateSimulationEmail = async () => {
 if (!selectedLead) return;
 setIsGeneratingSimulation(true);
 try {
 const res = await apiFetch('/api/generate-simulated-email', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 leadId: selectedLead.id,
 role: simulationRole,
 scenario: simulationScenario,
 customInstruction: simulationCustomInstruction,
 senderName: simulationSenderName
 })
 });
 if (res.ok) {
 const data = await res.json();
 setSimulationMessage(data.message);
 setSimulationGenerated(true);
 } else {
 alert('Error al generar la simulación.');
 }
 } catch (err) {
 console.error(err);
 alert('Error de conexión al generar la simulación.');
 } finally {
 setIsGeneratingSimulation(false);
 }
 };

 const handleCommitSimulation = () => {
 if (!selectedLead || !simulationMessage) return;

 const now = new Date();
 const fechaStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

 const newMsg = {
 id: `em-sim-${Date.now()}`,
 fecha: fechaStr,
 remitente: simulationRole,
 remitente_nombre: simulationSenderName,
 asunto: simulationSubject || 'Re: Propuesta de concierto - Bakandeya',
 mensaje: simulationMessage
 };

 const currentHilo = selectedLead.hilo_emails || [];
 const nuevoHilo = [...currentHilo, newMsg];
 
 let nuevoEstado = selectedLead.estado;
 if (simulationRole === 'sala') {
 const lowerMsg = simulationMessage.toLowerCase();
 if (lowerMsg.includes('cerrado') || lowerMsg.includes('lo siento') || lowerMsg.includes('lleno')) {
 // No cambia de estado a negociando si es un rechazo claro
 } else {
 nuevoEstado = 'negociando';
 }
 } else {
 if (selectedLead.estado === 'nuevo' || selectedLead.estado === 'pendiente_aprobacion' || selectedLead.estado === 'aprobado') {
 nuevoEstado = 'esperando_respuesta';
 }
 }

 const today = new Date().toISOString().split('T')[0];
 const roleLabel = simulationRole === 'sala' ? 'sala' : 'banda';
 const nuevaNota = `*** [${today}] Correo de simulación de ${roleLabel} (${simulationSenderName}) ***\n` + (selectedLead.notas || '');

 onUpdateLead(selectedLead.id, {
 hilo_emails: nuevoHilo,
 estado: nuevoEstado,
 notas: nuevaNota,
 fecha_ultima_respuesta: today
 });

 setSelectedLead(prev => prev ? {
 ...prev,
 hilo_emails: nuevoHilo,
 estado: nuevoEstado,
 notas: nuevaNota,
 fecha_ultima_respuesta: today
 } : null);

 setIsSimulatingAvanzado(false);
 setManualEmailStatus(`¡Simulación completada! Correo de ${simulationRole === 'sala' ? 'sala' : 'banda'} registrado y sincronizado.`);
 setTimeout(() => {
 setManualEmailStatus('');
 }, 5000);
 };

 // Initialize Auth listeners
 React.useEffect(() => {
 const unsubscribe = initAuth(
 (user, token) => {
 setGmailUser(user);
 setGmailToken(token);
 },
 () => {
 setGmailUser(null);
 setGmailToken(null);
 }
 );
 return () => unsubscribe();
 }, []);

 const handleGmailLogin = async () => {
 try {
 setGmailStatusMsg('Conectando con Google...');
 const result = await googleSignIn();
 if (result) {
 setGmailUser(result.user);
 setGmailToken(result.accessToken);
 setGmailStatusMsg('Google conectado correctamente.');
 setTimeout(() => setGmailStatusMsg(''), 3000);
 }
 } catch (err: any) {
 console.error('Error logging in with Google:', err);
 const isIframeEnv = window.self !== window.top;
 if (
 err?.code === 'auth/popup-closed-by-user' || 
 err?.message?.includes('popup-closed-by-user') || 
 err?.message?.includes('closed-by-user') ||
 isIframeEnv
 ) {
 setGmailStatusMsg(
 '⚠️ Restricción de Iframe: El navegador bloqueó o cerró el popup de Google. ' +
 'Para poder conectar tu cuenta, haz clic en el botón"Abrir en pestaña nueva" ' +
 'que ves abajo o en la barra de AI Studio.'
 );
 } else {
 setGmailStatusMsg('No se pudo conectar: ' + (err.message || String(err)));
 }
 }
 };

 const handleGmailLogout = async () => {
 await logout();
 setGmailUser(null);
 setGmailToken(null);
 setGmailStatusMsg('Conexión de Google cerrada.');
 setTimeout(() => setGmailStatusMsg(''), 3000);
 };

 const handleSyncGmailForLead = async () => {
 if (!selectedLead || !gmailToken) return;
 setIsSyncingGmail(true);
 setGmailStatusMsg('Buscando correos de este contacto en tu Gmail...');
 try {
 const email = selectedLead.email_contacto;
 if (!email) {
 throw new Error('Este contacto no tiene dirección de email registrada.');
 }
 
 const fetchedMsgs = await fetchGmailThreadsForEmail(email, gmailToken);
 
 if (fetchedMsgs.length === 0) {
 setGmailStatusMsg('No se encontraron correos de este contacto en Gmail.');
 setIsSyncingGmail(false);
 setTimeout(() => setGmailStatusMsg(''), 4000);
 return;
 }

 // Merge fetched messages with existing ones
 const currentHilo = selectedLead.hilo_emails || [];
 const mergedHilo = [...currentHilo];
 
 let addedCount = 0;
 for (const newMsg of fetchedMsgs) {
 if (!mergedHilo.some(m => m.id === newMsg.id || (m.fecha === newMsg.fecha && m.mensaje === newMsg.mensaje))) {
 mergedHilo.push(newMsg);
 addedCount++;
 }
 }

 // Sort by date ascending
 mergedHilo.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

 // Update lead
 onUpdateLead(selectedLead.id, {
 hilo_emails: mergedHilo
 });

 setSelectedLead(prev => prev ? {
 ...prev,
 hilo_emails: mergedHilo
 } : null);

 setGmailStatusMsg(`¡Sincronización completada! Se añadieron ${addedCount} correos nuevos de Gmail.`);
 setTimeout(() => setGmailStatusMsg(''), 5000);
 } catch (err: any) {
 console.error('Error during Gmail sync:', err);
 setGmailStatusMsg('Error al sincronizar con Gmail: ' + (err.message || String(err)));
 } finally {
 setIsSyncingGmail(false);
 }
 };

 // Bulk enrich addresses for all venues & festivals
 const [isEnrichingAddresses, setIsEnrichingAddresses] = useState(false);
 const [enrichStatusMsg, setEnrichStatusMsg] = useState('');

 const handleEnrichAddresses = async () => {
 setIsEnrichingAddresses(true);
 setEnrichStatusMsg('Buscando y autocompletando direcciones exactas para salas y festivales...');
 try {
 const res = await apiFetch('/api/leads/enrich-addresses', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' }
 });
 if (res.ok) {
 const data = await res.json();
 if (data.enrichedCount > 0) {
 setEnrichStatusMsg(`¡Éxito! Se han completado y guardado en Google Sheets ${data.enrichedCount} direcciones de salas/festivales.`);
 if (Array.isArray(data.leads)) {
 data.leads.forEach((updatedLead: Lead) => {
 if (updatedLead.direccion) {
 onUpdateLead(updatedLead.id, { direccion: updatedLead.direccion });
 }
 });
 }
 } else {
 setEnrichStatusMsg(`Todas las salas y festivales ya tienen su dirección informada (${data.totalLeads} total).`);
 }
 } else {
 setEnrichStatusMsg('Fallo al autocompletar las direcciones en el servidor.');
 }
 } catch (err) {
 console.error(err);
 setEnrichStatusMsg('Error de conexión al autocompletar direcciones.');
 } finally {
 setIsEnrichingAddresses(false);
 setTimeout(() => {
 setEnrichStatusMsg('');
 }, 7000);
 }
 };

 // Template states for Salas
 const [subjectTemplateSala, setSubjectTemplateSala] = useState('Propuesta de concierto: Bakandeya (Ska / Reggae / Mestizaje)');
 const [bodyTemplateSala, setBodyTemplateSala] = useState(`Hola equipo de booking de {{nombre_sala}},

Somos Bakandeya, banda que fusiona balkan-ska, roots reggae, violín salvaje, percusión reciclada y electrónica analógica. Hemos visto su programación en {{ciudad}} y creemos que nuestra propuesta encaja perfecto para su público.

Disponemos de fechas abiertas para nuestra gira 2026. Les invitamos a ver nuestros directos de alta energía: https://youtube.com/bakandeya_live

Un saludo,
Bakandeya Agent Manager IA`);
 const [aiGuidelinesSala, setAiGuidelinesSala] = useState('Escribe siempre en un tono enérgico, cercano pero muy respetuoso con los programadores de salas. Enfatiza que disponemos de un potente show con violín enérgico, loops en directo y percusión reciclada, y que aseguramos llenar el aforo gracias a nuestra campaña de promo local.');

 // Template states for Festivales
 const [subjectTemplateFestival, setSubjectTemplateFestival] = useState('Propuesta de Cartel / Booking Festival: Bakandeya (Balkan Ska & Electronic Live)');
 const [bodyTemplateFestival, setBodyTemplateFestival] = useState(`Hola equipo de producción y booking de {{nombre_sala}},

Escribimos de parte de Bakandeya para presentar la propuesta de nuestro show directo para la próxima edición de {{nombre_sala}} en {{ciudad}}.

Nuestra propuesta combina la fiesta explosiva del balkan-ska con violín virtuosístico, percusión y sintetizadores analógicos en tiempo real, ideal para escenarios principales de tarde/noche. Hemos formado parte de eventos de gran formato destacando por la conexión total con el público.

Podéis ver nuestro dossier y directo aquí: https://youtube.com/bakandeya_live

Quedamos a vuestra disposición para enviar rider técnico y caché de contratación.

Un saludo atento,
Bakandeya Agent Manager IA`);
 const [aiGuidelinesFestival, setAiGuidelinesFestival] = useState('Tono muy profesional, conciso y enfocado a directores artísticos y jefes de producción de festivales. Destaca la capacidad de mantener el ritmo alto en un escenario de festival, la brevedad del cambio de línea técnico y el valor diferencial del violín solista con electrónica.');

 // Template states for Discotecas / Clubs
 const [subjectTemplateDiscoteca, setSubjectTemplateDiscoteca] = useState('Propuesta Live Show / Session Nocturna: Bakandeya (Electro-Balkan Live Set)');
 const [bodyTemplateDiscoteca, setBodyTemplateDiscoteca] = useState(`Hola equipo de programación de {{nombre_sala}},

Os contactamos desde Bakandeya para proponer una noche diferente en {{ciudad}}: un Live Performance & Clubbing Set de alta intensidad que fusiona ritmos electro-balkan, violín distorsionado en directo, loops analógicos y percusión.

Nuestro formato está diseñado para horarios nocturnos en club/discoteca, manteniendo la pista encendida con bpm progresivos sin perder la energía orgánica de la música en vivo.

Vídeo promocional y sesión en directo: https://youtube.com/bakandeya_live

¿Tenéis fechas libres para incorporar un set en vivo en vuestra programación nocturna?

Saludos cordiales,
Bakandeya Agent Manager IA`);
 const [aiGuidelinesDiscoteca, setAiGuidelinesDiscoteca] = useState('Tono moderno, enfocado a clubes y discotecas de noche. Resalta que no somos un grupo acústico tradicional, sino un Live Set electrónico con violín e impulsos bailables ideales para horario de clubbing o sesiones de madrugada.');

 // Template states for Medios de Comunicación & Prensa
 const [subjectTemplateMedio, setSubjectTemplateMedio] = useState('[Nota de Prensa / Dossier] Bakandeya presenta su nuevo videoclip y gira 2026');
 const [bodyTemplateMedio, setBodyTemplateMedio] = useState(`Hola equipo de redacción de {{nombre_sala}},

Nos ponemos en contacto desde Bakandeya, proyecto independiente de fusión balkan-ska, roots reggae, violín enérgico y electrónica analógica.

Les remitimos nuestro último comunicado de prensa y dossier promocional con motivo del lanzamiento de nuestro nuevo videoclip y la gira de conciertos 2026. Nos encantaría enviarles el tema en calidad broadcast para sonar en su programa/radio, o ponernos a su disposición para entrevistas, acústicos en directo o reseñas.

Dossier y videoclip oficial: https://youtube.com/bakandeya_live
Material en alta resolución (fotos, bio y audio): {{website}}

Muchas gracias por su apoyo a la difusión de la música independiente,
Bakandeya Agent Manager IA`);
 const [aiGuidelinesMedio, setAiGuidelinesMedio] = useState('Tono periodístico, profesional y directo para medios de comunicación (Radio 3, podcasts, prensa escrita, blogs). Dirígete al redactor, locutor o equipo de redacción de prensa. Destaca la nota de prensa, la fusión sonora única (violín, loops y electrónica) y la disponibilidad para entrevistas, acústicos en estudio o reseñas. IMPORTANTE: No pidas fechas de conciertos ni taquillas, ya que se trata de un medio de difusión y prensa.');

 // Template states for Grupos & Bandas (Co-Booking)
 const [subjectTemplateGrupo, setSubjectTemplateGrupo] = useState('Propuesta de concierto compartido e intercambio de fechas: Bakandeya x {{nombre_sala}}');
 const [bodyTemplateGrupo, setBodyTemplateGrupo] = useState(`¡Buenas chavales de {{nombre_sala}}!

Os escribimos desde Bakandeya, banda de balkan-ska, violín enérgico y electrónica de Madrid/Sevilla. Nos mola mucho vuestro proyecto y creemos que nuestros estilos conectan genial en directo.

Queremos proponer un INTERCAMBIO DE FECHAS / CO-BOOKING para esta temporada:
1. Os invitamos a tocar con nosotros en nuestra ciudad (Madrid/Sevilla) compartiendo escenario y taquilla.
2. Vosotros nos invitáis a tocar en {{ciudad}} en vuestro espacio habitual.

Así aseguramos llenar las dos salas sumando ambos públicos y compartimos gastos de viaje y backline.

Podéis escuchar lo que hacemos aquí: https://youtube.com/bakandeya_live

¿Cómo lo veis? ¿Hablamos por WhatsApp o hacemos llamada esta semana?

¡Un abrazo!
Bakandeya Agent Manager IA`);
 const [aiGuidelinesGrupo, setAiGuidelinesGrupo] = useState('Tono de músico a músico: cercano, colega, directo y colaborativo. Propón claramente la estrategia de ganar-ganar (date swap), compartir público local, compartir backline y abaratar gastos de furgoneta.');

 // Template states for Managements & Agencias
 const [subjectTemplateManagement, setSubjectTemplateManagement] = useState('Propuesta de colaboración / Roster: Bakandeya (Balkan-Ska Electro-Live)');
 const [bodyTemplateManagement, setBodyTemplateManagement] = useState(`Estimado equipo de {{nombre_sala}},

Nos dirigimos a vuestra agencia para presentar la propuesta artística de Bakandeya con vista a posibles colaboraciones, coproducciones o inclusión en vuestro catálogo de booking para giras y festivales 2026.

Bakandeya es un proyecto consolidado que fusiona balkan-ska, reggae, violín solista y sintetizadores analógicos. Destacamos por una logística ágil (cuarteto compacto sin sección de vientos), alta rentabilidad en venta de entradas y un directo arrollador probado en salas y festivales.

Dossier corporativo y resumen en vídeo: https://youtube.com/bakandeya_live

Estaríamos encantados de agendar una breve reunión telefónica para valorar posibles sinergias.

Atentamente,
Bakandeya Agent Manager IA`);
 const [aiGuidelinesManagement, setAiGuidelinesManagement] = useState('Tono ejecutivo-musical profesional para mánagers, agencias y agentes de booking. Destaca la profesionalidad técnica, el atractivo comercial, la sencillez logística del cuarteto y los datos positivos de aforo.');

 // Selected template category in Editor
 const [templateTab, setTemplateTab] = useState<TemplateCategory>('salas');
 const [testPromptResult, setTestPromptResult] = useState('');
 const [isTestingPrompt, setIsTestingPrompt] = useState(false);

 // Helper to retrieve current active template fields by category
 const getActiveTemplateData = () => {
 switch (templateTab) {
 case 'salas':
 return {
 subject: subjectTemplateSala,
 body: bodyTemplateSala,
 guidelines: aiGuidelinesSala,
 setSubject: setSubjectTemplateSala,
 setBody: setBodyTemplateSala,
 setGuidelines: setAiGuidelinesSala,
 title: '🏛️ Editando Plantilla para Salas y Teatros',
 desc: 'Propuestas directas de fechas, aforo, taquilla/caché e invitaciones a programadores de salas.'
 };
 case 'festivales':
 return {
 subject: subjectTemplateFestival,
 body: bodyTemplateFestival,
 guidelines: aiGuidelinesFestival,
 setSubject: setSubjectTemplateFestival,
 setBody: setBodyTemplateFestival,
 setGuidelines: setAiGuidelinesFestival,
 title: '🎪 Editando Plantilla para Festivales de Música',
 desc: 'Presentación de dossier, rider técnico compacto y propuesta para escenarios principales de festival.'
 };
 case 'discotecas':
 return {
 subject: subjectTemplateDiscoteca,
 body: bodyTemplateDiscoteca,
 guidelines: aiGuidelinesDiscoteca,
 setSubject: setSubjectTemplateDiscoteca,
 setBody: setBodyTemplateDiscoteca,
 setGuidelines: setAiGuidelinesDiscoteca,
 title: '🪩 Editando Plantilla para Discotecas y Clubbing',
 desc: 'Live Performance & Clubbing set para horarios nocturnos y sesiones de madrugada.'
 };
 case 'medios':
 return {
 subject: subjectTemplateMedio,
 body: bodyTemplateMedio,
 guidelines: aiGuidelinesMedio,
 setSubject: setSubjectTemplateMedio,
 setBody: setBodyTemplateMedio,
 setGuidelines: setAiGuidelinesMedio,
 title: '📻 Editando Plantilla para Medios de Comunicación, Radio y Prensa',
 desc: 'Nota de prensa, material de difusión, bio/fotos y propuesta para sonar en antena o entrevistas.'
 };
 case 'grupos':
 return {
 subject: subjectTemplateGrupo,
 body: bodyTemplateGrupo,
 guidelines: aiGuidelinesGrupo,
 setSubject: setSubjectTemplateGrupo,
 setBody: setBodyTemplateGrupo,
 setGuidelines: setAiGuidelinesGrupo,
 title: '🎸 Editando Plantilla para Grupos y Bandas (Co-Booking)',
 desc: 'Intercambio de fechas (Date Swap), doble cartel en sala grande y compartir furgoneta/backline.'
 };
 case 'managements':
 return {
 subject: subjectTemplateManagement,
 body: bodyTemplateManagement,
 guidelines: aiGuidelinesManagement,
 setSubject: setSubjectTemplateManagement,
 setBody: setBodyTemplateManagement,
 setGuidelines: setAiGuidelinesManagement,
 title: '💼 Editando Plantilla para Agencias de Booking y Management',
 desc: 'Propuestas corporativas para coproducción, representación de gira e inclusión en catálogo.'
 };
 }
 };

 const isMedioOIndustria = (t: any) => {
 const norm = normalizeType(t);
 return norm === 'medio' || norm === 'productora';
 };

 const isStitchLight = colors.accent === 'text-sky-400';

 const getTypeBadgeClass = (typeVal: any) => {
 const norm = normalizeType(typeVal);
 switch (norm) {
 case 'sala': return isStitchLight ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-500/15 text-sky-400';
 case 'festival': return isStitchLight ? 'bg-fuchsia-50 text-fuchsia-700' : 'bg-fuchsia-500/10 text-fuchsia-400';
 case 'discoteca': return isStitchLight ? 'bg-purple-50 text-purple-700' : 'bg-purple-500/10 text-purple-400';
 case 'ayuntamiento': return isStitchLight ? 'bg-[#d1b375]/15 text-[#d1b375]' : 'bg-[#d1b375]/15/30 text-[#d1b375]/80';
 case 'grupo': return isStitchLight ? (isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]') : 'bg-[#10b981]/15/30 text-[#10b981]/80';
 case 'productora': return isStitchLight ? 'bg-cyan-50 text-cyan-700' : 'bg-cyan-500/10 text-cyan-400';
 case 'medio': return isStitchLight ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-500/15 text-rose-400';
 default: return isStitchLight ? 'bg-slate-50 text-slate-700' : 'bg-neutral-800 text-neutral-300';
 }
 };

 const getTypeLabel = (typeVal: any) => {
 const norm = normalizeType(typeVal);
 switch (norm) {
 case 'sala': return '🏛️ Sala / Teatro';
 case 'festival': return '🎪 Festival';
 case 'discoteca': return '🪩 Discoteca / Clubbing';
 case 'ayuntamiento': return '🎆 Ayuntamiento / Fiestas';
 case 'grupo': return '🎸 Grupo / Banda Co-Booking';
 case 'productora': return '💼 Management / Agencia';
 case 'medio': return '📻 Medio (Radio / Prensa)';
 default: return '🏛️ Sala / Teatro';
 }
 };

 // Filter leads by active section tab ('salas' vs 'medios' vs 'grupos')
 const sectionLeads = leads.filter(lead => {
 const norm = normalizeType(lead.tipo);
 if (sectionTab === 'medios') return norm === 'medio';
 if (sectionTab === 'grupos') return norm === 'grupo';
 return norm !== 'medio' && norm !== 'grupo';
 });

 const filteredLeads = sectionLeads.filter(lead => {
 const matchesSearch = lead.nombre_sala.toLowerCase().includes(searchTerm.toLowerCase()) || 
 lead.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
 lead.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
 (lead.email_contacto && lead.email_contacto.toLowerCase().includes(searchTerm.toLowerCase()));
 const normSt = normalizeStatus(lead.estado);
 const matchesStatus = statusFilter === 'todos' || 
 normSt === statusFilter || 
 (statusFilter === 'pendiente_aprobacion' && normSt === 'nuevo' && !!lead.pitch_generado);
 const matchesType = typeFilter === 'todos' || normalizeType(lead.tipo) === typeFilter;
 const matchesCity = !selectedCityFilter || 
 lead.ciudad.toLowerCase().includes(selectedCityFilter.toLowerCase()) || 
 lead.region.toLowerCase().includes(selectedCityFilter.toLowerCase());
 return matchesSearch && matchesStatus && matchesType && matchesCity;
 });

 const handleModalScrape = async () => {
 if (!newLeadData.nombre_sala.trim()) {
 alert('Por favor, escribe al menos el nombre de la sala o medio para que el Agente Scout pueda buscar en Google.');
 return;
 }

 setIsModalScraping(true);
 setModalScrapeStatus('Iniciando Agente Scout IA con Google Search Grounding...');
 setModalScrapeError('');
 setModalScrapeSuccessMsg('');

 const steps = [
"Buscando sitio oficial y directorio de salas...",
"Extrayendo emails de programación y prensa...",
"Obteniendo teléfono y datos de ubicación...",
"Consolidando ficha encontrada..."
 ];

 let stepIdx = 0;
 const interval = setInterval(() => {
 stepIdx++;
 if (stepIdx < steps.length) {
 setModalScrapeStatus(steps[stepIdx]);
 }
 }, 1200);

 try {
 const res = await apiFetch('/api/scrape-contact', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 nombre_sala: newLeadData.nombre_sala,
 ciudad: newLeadData.ciudad,
 region: newLeadData.region
 })
 });

 clearInterval(interval);

 if (res.ok) {
 const resData = await res.json();
 if (resData.success && resData.data) {
 const getVal = (f: any) => typeof f === 'object' && f !== null ? f.valor : (f || '');
 const emailVal = getVal(resData.data.email_contacto);
 const telVal = getVal(resData.data.telefono);
 const webVal = getVal(resData.data.website);
 const instaVal = getVal(resData.data.instagram);
 const contactoVal = getVal(resData.data.contacto_nombre);
 const aforoVal = getVal(resData.data.aforo);
 const regionVal = getVal(resData.data.region);
 const generoVal = getVal(resData.data.genero);

 setNewLeadData(prev => ({
 ...prev,
 email_contacto: emailVal || prev.email_contacto,
 telefono: telVal || prev.telefono,
 website: webVal || prev.website,
 region: regionVal || prev.region,
 aforo: (aforoVal && !isNaN(Number(aforoVal))) ? Number(aforoVal) : prev.aforo,
 genero: generoVal || prev.genero,
 notas: prev.notas ? `${prev.notas} | Scout: ${resData.data.source_info || 'IA Grounding'}` : `Scout IA: ${resData.data.source_info || 'IA Grounding'}`
 }));

 setModalScrapeSuccessMsg(
 `¡Éxito! Email: ${emailVal || 'No hallado'} | Tel: ${telVal || 'No hallado'} | Web: ${webVal || 'No hallado'}`
 );
 } else {
 setModalScrapeError(resData.error || 'No se pudieron recuperar datos con la IA Scout.');
 }
 } else {
 const errJson = await res.json().catch(() => null);
 setModalScrapeError(errJson?.error || `Error ${res.status}: Fallo de respuesta del servidor.`);
 }
 } catch (err: any) {
 clearInterval(interval);
 setModalScrapeError(err.message || 'Error de conexión con el Agente Scout.');
 } finally {
 setIsModalScraping(false);
 }
 };

 const handleScrapeSelectedLead = async () => {
 if (!selectedLead) return;
 setIsScrapingLead(true);
 setScrapingLeadStatus('Iniciando rastreo web con Agente Scout IA...');
 setScrapingLeadError(null);
 setScrapedDataForLead(null);

 const steps = [
"Buscando sitio oficial de la sala / medio...",
"Rastreando contactos de programación y teléfono...",
"Consolidando nivel de confianza de datos..."
 ];

 let stepIdx = 0;
 const interval = setInterval(() => {
 stepIdx++;
 if (stepIdx < steps.length) {
 setScrapingLeadStatus(steps[stepIdx]);
 }
 }, 1200);

 try {
 const res = await apiFetch('/api/scrape-contact', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 leadId: selectedLead.id,
 nombre_sala: selectedLead.nombre_sala,
 ciudad: selectedLead.ciudad,
 region: selectedLead.region
 })
 });

 clearInterval(interval);

 if (res.ok) {
 const resData = await res.json();
 if (resData.success && resData.data) {
 setScrapedDataForLead(resData.data);
 } else {
 setScrapingLeadError(resData.error || 'No se lograron extraer datos de contacto.');
 }
 } else {
 const errJson = await res.json().catch(() => null);
 setScrapingLeadError(errJson?.error || `Error ${res.status}: Fallo de respuesta del servidor.`);
 }
 } catch (err: any) {
 clearInterval(interval);
 setScrapingLeadError(err.message || 'Fallo de conexión con Agente Scout.');
 } finally {
 setIsScrapingLead(false);
 }
 };

 const handleApplyScrapedToSelectedLead = () => {
 if (!selectedLead || !scrapedDataForLead) return;
 const getVal = (f: any) => typeof f === 'object' && f !== null ? f.valor : (f || '');

 const emailVal = getVal(scrapedDataForLead.email_contacto);
 const telVal = getVal(scrapedDataForLead.telefono);
 const webVal = getVal(scrapedDataForLead.website);
 const instaVal = getVal(scrapedDataForLead.instagram);
 const contactoVal = getVal(scrapedDataForLead.contacto_nombre);
 const aforoVal = getVal(scrapedDataForLead.aforo);
 const regionVal = getVal(scrapedDataForLead.region);
 const generoVal = getVal(scrapedDataForLead.genero);

 const today = new Date().toISOString().split('T')[0];
 const sourceSummary = typeof scrapedDataForLead.source_info === 'string' ? scrapedDataForLead.source_info : 'Rastreo web Agente Scout';
 const updatedNotes = `*** [${today}] Ficha enriquecida vía Agente Scout. ${sourceSummary} ***\n${selectedLead.notas || ''}`;

 const updatedFields: Partial<Lead> = {
 email_contacto: emailVal || selectedLead.email_contacto,
 telefono: telVal || selectedLead.telefono,
 website: webVal || selectedLead.website,
 instagram: instaVal || selectedLead.instagram,
 contacto_nombre: contactoVal || selectedLead.contacto_nombre,
 aforo: (aforoVal && !isNaN(Number(aforoVal))) ? Number(aforoVal) : selectedLead.aforo,
 region: regionVal || selectedLead.region,
 genero: generoVal || selectedLead.genero,
 notas: updatedNotes
 };

 onUpdateLead(selectedLead.id, updatedFields);
 setSelectedLead(prev => prev ? { ...prev, ...updatedFields } : null);
 setScrapedDataForLead(null);
 };

 const handleAddNewLeadSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newLeadData.nombre_sala) {
 alert('Por favor, indica al menos el nombre de la sala o medio.');
 return;
 }

 const createdLead: Lead = {
 id: `lead-${Date.now()}`,
 nombre_sala: newLeadData.nombre_sala,
 ciudad: newLeadData.ciudad || 'Nacional',
 region: newLeadData.region || 'Nacional',
 aforo: newLeadData.aforo || 0,
 genero: newLeadData.genero || (sectionTab === 'medios' ? 'Radio' : 'Música en directo'),
 tipo: sectionTab === 'medios' ? 'medio' : newLeadData.tipo,
 email_contacto: newLeadData.email_contacto || '',
 telefono: newLeadData.telefono || '',
 instagram: newLeadData.website || '',
 website: newLeadData.website || '',
 fuente: 'Alta Manual CRM',
 estado: 'nuevo',
 pitch_generado: newLeadData.pitch_generado || (sectionTab === 'medios' 
 ? `Asunto: Nota de Prensa: Bakandeya presenta su directo de balkan-ska\n\nEstimada redacción / equipo de ${newLeadData.nombre_sala},\n\nOs remitimos la información del grupo Bakandeya, con electrónica analógica, violín y ritmos balkan...`
 : `Asunto: Propuesta de concierto: Bakandeya en ${newLeadData.nombre_sala}\n\nHola equipo de booking,\n\nSomos la banda Bakandeya...`),
 notas: newLeadData.notas || `Añadido desde la sección ${sectionTab === 'medios' ? 'Medios' : 'Salas'} el ${new Date().toISOString().split('T')[0]}`
 };

 if (onAddLead) {
 onAddLead(createdLead);
 } else {
 onUpdateLead(createdLead.id, createdLead);
 }

 setIsAddingLeadModalOpen(false);
 setSelectedLead(createdLead);
 };

 const getStatusDotColor = (status: LeadStatus | string) => {
 const norm = normalizeStatus(status);
 switch (norm) {
 case 'nuevo': return 'bg-stone-400';
 case 'pendiente_aprobacion': return 'bg-[#d1b375]/15';
 case 'aprobado': return 'bg-[#10b981]/15';
 case 'esperando_respuesta': return 'bg-sky-500/15';
 case 'interesado': return 'bg-[#10b981]/15';
 case 'negociando': return 'bg-sky-500/15';
 case 'no_interesado': return 'bg-neutral-500';
 default: return 'bg-stone-400';
 }
 };

 const getStatusBadgeClass = (status: LeadStatus | string) => {
 const norm = normalizeStatus(status);
 switch (norm) {
 case 'nuevo': return isStitchLight ? 'bg-slate-100 text-slate-700' : 'bg-stone-500/10 text-stone-300';
 case 'pendiente_aprobacion': return isStitchLight ? 'bg-[#d1b375]/15 text-[#d1b375]' : 'bg-[#d1b375]/15 text-[#d1b375]';
 case 'aprobado': return isStitchLight ? (isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]') : 'bg-[#10b981]/15/20 text-[#10b981]/80';
 case 'esperando_respuesta': return isStitchLight ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-500/15 text-sky-400';
 case 'interesado': return isStitchLight ? (isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]') : 'bg-[#10b981]/15/20 text-[#10b981]';
 case 'negociando': return isStitchLight ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-500/15 text-sky-400';
 case 'no_interesado': return isStitchLight ? 'bg-slate-100 text-slate-500' : 'bg-neutral-800/60 text-neutral-400';
 default: return isStitchLight ? 'bg-slate-50 text-slate-500' : 'bg-neutral-800/60 text-neutral-400';
 }
 };

 const getStatusLabel = (status: LeadStatus | string) => {
 const norm = normalizeStatus(status);
 switch (norm) {
 case 'nuevo': return 'Por Contactar';
 case 'pendiente_aprobacion': return 'Por Aprobar';
 case 'aprobado': return 'Aprobado';
 case 'esperando_respuesta': return 'Email Enviado';
 case 'interesado': return 'Interesado';
 case 'negociando': return 'Negociando';
 case 'no_interesado': return 'No interesado';
 default: return String(status).toUpperCase();
 }
 };

 const handleOpenLead = (lead: Lead) => {
 setSelectedLead(lead);
 setEditedPitch(lead.pitch_generado || '');
 setIsEditingPitch(false);
 setIsEditingLeadInfo(false);
 setIsRejecting(false);
 setRejectionNotes('');
 
 // Automatically switch to emails tab for negotiating or interested leads, else info
 setActiveTab(lead.estado === 'negociando' || lead.estado === 'interesado' ? 'emails' : 'info');
 setManualEmailBody('');
 setManualEmailSubject(lead.hilo_emails && lead.hilo_emails.length > 0 ? `RE: ${lead.hilo_emails[lead.hilo_emails.length - 1].asunto}` : 'Propuesta de concierto: Bakandeya');
 setManualEmailStatus('');

 setTimeout(() => {
 interventionPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
 }, 100);
 };

 const handleStartEditLeadInfo = () => {
 if (!selectedLead) return;
 setEditedLeadInfo({
 nombre_sala: selectedLead.nombre_sala || '',
 contacto_nombre: selectedLead.contacto_nombre || '',
 email_contacto: selectedLead.email_contacto || '',
 telefono: selectedLead.telefono || '',
 website: selectedLead.website || '',
 instagram: selectedLead.instagram || '',
 ciudad: selectedLead.ciudad || '',
 region: selectedLead.region || '',
 aforo: selectedLead.aforo || 0,
 genero: selectedLead.genero || '',
 notas: selectedLead.notas || '',
 contexto_extra: selectedLead.contexto_extra || ''
 });
 setIsEditingLeadInfo(true);
 };

 const handleSaveLeadInfo = () => {
 if (!selectedLead) return;
 onUpdateLead(selectedLead.id, editedLeadInfo);
 setSelectedLead(prev => prev ? { ...prev, ...editedLeadInfo } : null);
 setIsEditingLeadInfo(false);
 };

 const handleSendManualEmail = () => {
 if (!selectedLead || !manualEmailBody) return;

 const now = new Date();
 const fechaStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
 
 const newMsg = {
 id: `em-manual-${Date.now()}`,
 fecha: fechaStr,
 remitente: 'banda' as const,
 remitente_nombre: manualEmailSender,
 asunto: manualEmailSubject || 'Contacto directo de Bakandeya',
 mensaje: manualEmailBody
 };

 const currentHilo = selectedLead.hilo_emails || [];
 const nuevoHilo = [...currentHilo, newMsg];
 
 // Move status to negotiating if it was new/pending/approved/sent
 let nuevoEstado = selectedLead.estado;
 if (selectedLead.estado === 'nuevo' || selectedLead.estado === 'pendiente_aprobacion' || selectedLead.estado === 'aprobado' || selectedLead.estado === 'esperando_respuesta') {
 nuevoEstado = 'negociando';
 }

 const today = new Date().toISOString().split('T')[0];
 const nuevaNota = `*** [${today}] Correo personal manual enviado por ${manualEmailSender}: "${manualEmailSubject}" ***\n` + (selectedLead.notas || '');

 onUpdateLead(selectedLead.id, {
 hilo_emails: nuevoHilo,
 estado: nuevoEstado,
 notas: nuevaNota
 });

 setSelectedLead(prev => prev ? {
 ...prev,
 hilo_emails: nuevoHilo,
 estado: nuevoEstado,
 notas: nuevaNota
 } : null);

 setManualEmailBody('');
 setManualEmailStatus('¡Email enviado con éxito! Se ha registrado en el hilo de negociación.');
 setTimeout(() => {
 setManualEmailStatus('');
 }, 4000);
 };

 const handleSimulateIncomingEmail = () => {
 if (!selectedLead) return;
 
 let simSender = 'Programación';
 let simBody = '';
 
 const lowercaseName = selectedLead.nombre_sala.toLowerCase();
 if (selectedLead.id === 'lead-14' || lowercaseName.includes('hebe')) {
 simSender = 'Kike (Programación Sala Hebe)';
 simBody = '¡Buenas! He estado pensando lo de la fecha doble con la banda local que propusisteis. Me parece de lujo, los chavales de"Vallekas Ska" están buscando bolo para noviembre y seguro que entre los dos llenamos el Hebe. El viernes 13 de Noviembre sigue libre. ¿Cerramos ese día con un 75% de taquilla para vosotros si llegamos a las 100 entradas? Ya me decís y os paso el contrato.';
 } else if (selectedLead.id === 'lead-4' || lowercaseName.includes('viña')) {
 simSender = 'Producción Artística (Viña Rock)';
 simBody = 'Hola, gracias por pasarnos los detalles. El caché de 4.500€ entra en vuestros rangos para el escenario de Mestizaje. El slot de las 18:30 del viernes está libre. Confirmadnos si vuestro rider técnico incluye los sintetizadores listos para línea balanceada o si necesitáis cajas DI adicionales del festival. ¡Cerremos trato!';
 } else if (selectedLead.id === 'lead-6' || lowercaseName.includes('razzmatazz')) {
 simSender = 'Xavi (Booking Razzmatazz)';
 simBody = 'Buenas, nos parece perfecto el acuerdo de taquilla al 80/20 con un mínimo de 150 entradas garantizadas. La fecha del sábado 5 de Diciembre queda reservada para Bakandeya. Decidme a qué email enviamos el borrador del contrato de sala. ¡Un saludo!';
 } else {
 simSender = `Programador (${selectedLead.nombre_sala})`;
 simBody = `Hola equipo de Bakandeya, gracias por la propuesta. Nos gusta mucho vuestro directo y el tema de balkan-ska con sintetizadores analógicos. Para otoño tenemos el calendario casi cerrado, pero nos queda un hueco el sábado 28 de Noviembre. Iríamos a taquilla 70/30 a vuestro favor con entradas a 10€. ¿Os cuadra la fecha?`;
 }

 const now = new Date();
 const fechaStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
 const subject = selectedLead.hilo_emails && selectedLead.hilo_emails.length > 0 
 ? `RE: ${selectedLead.hilo_emails[selectedLead.hilo_emails.length - 1].asunto}` 
 : `Re: Propuesta de concierto - Bakandeya`;

 const newMsg = {
 id: `em-sim-${Date.now()}`,
 fecha: fechaStr,
 remitente: 'sala' as const,
 remitente_nombre: simSender,
 asunto: subject,
 mensaje: simBody
 };

 const currentHilo = selectedLead.hilo_emails || [];
 const nuevoHilo = [...currentHilo, newMsg];
 
 let nuevoEstado = selectedLead.estado;
 if (selectedLead.estado === 'nuevo' || selectedLead.estado === 'pendiente_aprobacion' || selectedLead.estado === 'aprobado' || selectedLead.estado === 'esperando_respuesta') {
 nuevoEstado = 'negociando';
 }

 const today = new Date().toISOString().split('T')[0];
 const nuevaNota = `*** [${today}] Correo de simulación entrante recibido de ${simSender} ***\n` + (selectedLead.notas || '');

 onUpdateLead(selectedLead.id, {
 hilo_emails: nuevoHilo,
 estado: nuevoEstado,
 notas: nuevaNota,
 fecha_ultima_respuesta: today
 });

 setSelectedLead(prev => prev ? {
 ...prev,
 hilo_emails: nuevoHilo,
 estado: nuevoEstado,
 notas: nuevaNota,
 fecha_ultima_respuesta: today
 } : null);

 setManualEmailStatus(`¡Simulación completada! Se recibió un correo entrante de ${simSender} y se sincronizó en Excel.`);
 setTimeout(() => {
 setManualEmailStatus('');
 }, 5000);
 };

 const handleSavePitchEdit = () => {
 if (!selectedLead) return;
 onUpdateLead(selectedLead.id, { pitch_generado: editedPitch });
 setSelectedLead(prev => prev ? { ...prev, pitch_generado: editedPitch } : null);
 setIsEditingPitch(false);
 };

 const handleApproveLead = () => {
 if (!selectedLead) return;
 const today = new Date().toISOString().split('T')[0];
 const updatedNotes = `*** [${today}] Correo de presentación APROBADO manualmente para envío automático ***\n${selectedLead.notas || ''}`;
 
 onUpdateLead(selectedLead.id, {
 estado: 'aprobado',
 pitch_generado: editedPitch,
 notas: updatedNotes
 }, 'pendiente_aprobacion');

 setSelectedLead(null);
 };

 const handleRejectLead = () => {
 if (!selectedLead || !rejectionNotes) return;
 const today = new Date().toISOString().split('T')[0];
 const updatedNotes = `*** [${today}] RECHAZADO EN PANEL DE REVISIÓN: "${rejectionNotes}" ***\n${selectedLead.notas || ''}`;
 
 onUpdateLead(selectedLead.id, {
 estado: 'nuevo',
 notas: updatedNotes
 }, 'pendiente_aprobacion');

 setSelectedLead(null);
 };

 const handleCorrectStatus = (newStatus: LeadStatus) => {
 if (!selectedLead) return;
 const today = new Date().toISOString().split('T')[0];
 const correctionMsg = `*** [${today}] Clasificación corregida a '${newStatus}' manualmente ***\n`;
 
 onUpdateLead(selectedLead.id, {
 estado: newStatus,
 notas: correctionMsg + (selectedLead.notas || '')
 }, selectedLead.estado);

 setSelectedLead(prev => prev ? { ...prev, estado: newStatus, notas: correctionMsg + (prev.notas || '') } : null);
 };

 const handleTestPrompt = () => {
 setIsTestingPrompt(true);
 setTestPromptResult('');
 
 const activeData = getActiveTemplateData();
 
 setTimeout(() => {
 if (templateTab === 'medios') {
 setTestPromptResult(`Asunto: [Nota de Prensa / Radio 3] Bakandeya presenta su gira y single 2026

Hola equipo de redacción de Radio 3 / Revista Musical,

Os enviamos la nota de prensa de Bakandeya para su difusión en medios. Siguiendo las directrices de prensa ("${activeData.guidelines.substring(0, 55)}..."), destacamos nuestro concepto sonoro que fusiona balkan-ska, violín enérgico, loops y percusión reciclada con electrónica.

Nos encantaría ponernos a vuestra disposición para una entrevista en estudio, un acústico en directo o la presentación del nuevo videoclip.

Adjuntamos fotos en alta resolución, bio y enlace al videoclip: https://youtube.com/bakandeya_live

Un saludo muy atento,
Bakandeya Agent Manager IA`);
 } else if (templateTab === 'festivales') {
 setTestPromptResult(`Asunto: Propuesta de Cartel / Booking Festival: Bakandeya (Balkan Ska & Electronic Live)

Hola equipo de producción y booking del Festival Ejemplo,

Escribimos de parte de Bakandeya para presentar la propuesta de nuestro show directo de alta energía. Siguiendo las directrices de festival ("${activeData.guidelines.substring(0, 50)}..."), hemos optimizado la logística del escenario.

Disponemos de un cuarteto con violín virtuosístico, loops y sintetizadores en tiempo real ideal para escenarios principales de tarde/noche.

Dossier y vídeo promocional: https://youtube.com/bakandeya_live

Quedamos a su disposición.

Atentamente,
Bakandeya Agent Manager IA`);
 } else if (templateTab === 'discotecas') {
 setTestPromptResult(`Asunto: Propuesta Live Performance & Clubbing: Bakandeya

Hola equipo de programación de Discoteca Ejemplo,

Os contactamos desde Bakandeya para proponer una sesión en vivo de electro-balkan & ska instrumental en horario nocturno. Siguiendo las pautas de clubbing ("${activeData.guidelines.substring(0, 50)}..."), nuestro set mantiene la pista en tensión constante.

Vídeo promocional: https://youtube.com/bakandeya_live

¿Tenéis fechas libres para un live set nocturno?

Un saludo,
Bakandeya Agent Manager IA`);
 } else if (templateTab === 'grupos') {
 setTestPromptResult(`Asunto: Propuesta de concierto compartido e intercambio de fechas: Bakandeya x Banda Ejemplo

¡Buenas chavales de Banda Ejemplo!

Os escribimos desde Bakandeya. Siguiendo las pautas de co-booking entre bandas ("${activeData.guidelines.substring(0, 50)}..."), nos mola mucho vuestro proyecto y queremos proponer un INTERCAMBIO DE FECHAS (Date Swap):

1. Os invitamos a tocar con nosotros en Madrid/Sevilla compartiendo taquilla al 50%.
2. Montamos fecha conjunta en vuestra ciudad natal para llenar el local sumando ambas aficiones y compartir furgoneta.

¿Cómo lo veis? ¿Hablamos esta semana?

¡Un abrazo!
Bakandeya Agent Manager IA`);
 } else if (templateTab === 'managements') {
 setTestPromptResult(`Asunto: Propuesta de colaboración / Roster 2026: Bakandeya

Estimado equipo de Agencia Ejemplo,

Nos dirigimos a vuestra oficina para presentar la propuesta de Bakandeya con vista a posibles coproducciones o inclusión en catálogo. Siguiendo las pautas de agencias ("${activeData.guidelines.substring(0, 50)}..."), destacamos la solidez de nuestro cuarteto con violín solista.

Dossier corporativo: https://youtube.com/bakandeya_live

Atentamente,
Bakandeya Agent Manager IA`);
 } else {
 setTestPromptResult(`Asunto: Propuesta de concierto: Bakandeya en Sala Ejemplo

Hola equipo de booking de Sala Ejemplo,

Le escribimos de parte de Bakandeya. Siguiendo sus pautas de directo ("${activeData.guidelines.substring(0, 50)}..."), hemos adaptado nuestro show para vuestro aforo. Disponemos de un cuarteto con violín enérgico, loops, percusión reciclada y una electrónica demoledora en directo.

¿Qué os parece el viernes 23 de Octubre de 2026?

Atentamente,
Bakandeya Agent Manager IA`);
 }
 setIsTestingPrompt(false);
 }, 1200);
 };

 const handleSaveTemplates = () => {
 const activeData = getActiveTemplateData();
 alert(`¡Plantilla de Pitch y Directrices AI para [${activeData.title}] guardadas correctamente! Los agentes Python redactores usarán esta configuración en el próximo escaneo.`);
 };

 const subCardBg = isStitchLight ? 'bg-slate-50/60' : 'bg-[#131313]';
 const textTitle = isStitchLight ? 'text-slate-900' : 'text-neutral-100';
 const textSub = isStitchLight ? 'text-slate-500' : 'text-neutral-400';
 const textMuted = isStitchLight ? 'text-slate-400' : 'text-[#9a9591]';

 return (
 <div className={`space-y-4 ${isStitchLight ? 'text-slate-800' : 'text-[#e5e2e1]'} font-sans w-full max-w-full overflow-x-hidden`}>
 
 {/* 2. LEADS CRM WORKSPACE */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
 
 {/* LEADS LIST AREA (2/3 width on wide screen) */}
 <div className="lg:col-span-2 space-y-8">
 <div className="space-y-6">
 
 {/* Header, View Switcher & Search */}
 <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-end">
 <div>
 <p className="text-[#eab308] text-[13px] font-bold font-sans tracking-wider uppercase mb-0.5">
 BOOKING
 </p>
 <h3 className={`text-3xl font-bold font-display tracking-tight ${isStitchLight ? 'text-slate-900' : 'text-zinc-100'}`}>
 {sectionTab === 'medios' ? 'Medios y prensa' : 'Salas y festivales'}
 </h3>
 <p className={`text-[13px] mt-1 ${textMuted}`}>
 {sectionTab === 'medios' 
 ? `${leads.filter(l => isMedioOIndustria(l.tipo)).length} contactos registrados`
 : `${leads.filter(l => !isMedioOIndustria(l.tipo)).length} registradas • ${leads.filter(l => !isMedioOIndustria(l.tipo) && l.estado === 'pendiente_aprobacion').length} pendientes de aprobar`
 }
 </p>
 </div>
 <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
 <button
 id="add-new-lead-btn"
 onClick={() => {
 setNewLeadData({
 nombre_sala: '',
 ciudad: '',
 region: 'Nacional',
 aforo: 0,
 tipo: sectionTab === 'medios' ? 'medio' : 'sala',
 email_contacto: '',
 telefono: '',
 website: '',
 genero: sectionTab === 'medios' ? 'Radio' : 'Balkan / Ska',
 notas: '',
 pitch_generado: ''
 });
 setIsAddingLeadModalOpen(true);
 }}
 className="flex items-center justify-center gap-2 px-2 py-1 rounded-lg text-sm font-bold transition-all cursor-pointer shrink-0 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 active:scale-95"
 >
 <PlusCircle className="w-4 h-4 opacity-80" />
 <span>{sectionTab === 'medios' ? 'Añadir medio' : 'Añadir sala'}</span>
 </button>
 {/* Bulk Address Enricher Button */}
 <button
 id="enrich-addresses-btn"
 type="button"
 disabled={isEnrichingAddresses}
 onClick={handleEnrichAddresses}
 className={`flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-sans font-medium uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
 isStitchLight 
 ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' 
 : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200'
 } disabled:opacity-50 disabled:cursor-not-allowed`}
 title="Buscar y rellenar automáticamente las direcciones de todas las salas y festivales en Google Sheets"
 >
 {isEnrichingAddresses ? (
 <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
 ) : (
 <MapPin className="w-4 h-4 text-zinc-400" />
 )}
 <span>{isEnrichingAddresses ? 'Rellenando...' : 'Rellenar Direcciones Excel'}</span>
 </button>

 {/* View Mode Toggle Switcher */}
 <div className={`p-1 rounded-lg flex items-center gap-1 ${
 isStitchLight ? 'bg-slate-100' : 'bg-[#131313]'
 }`}>
 <button
 id="crm-view-list"
 type="button"
 onClick={() => setViewMode('list')}
 className={`px-2 py-1 rounded-md text-[10px] font-sans font-bold flex items-center gap-1 transition-all cursor-pointer ${
 viewMode === 'list'
 ? isStitchLight ? 'bg-slate-900 text-white shadow-sm' : 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
 : isStitchLight ? 'text-slate-500 hover:text-slate-800' : 'text-neutral-400 hover:text-white'
 }`}
 >
 <List className="w-3.5 h-3.5" />
 <span>Lista</span>
 </button>
 <button
 id="crm-view-map"
 type="button"
 onClick={() => setViewMode('map')}
 className={`px-2 py-1 rounded-md text-[10px] font-sans font-bold flex items-center gap-1 transition-all cursor-pointer ${
 viewMode === 'map'
 ? isStitchLight ? 'bg-slate-900 text-white shadow-sm' : 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
 : isStitchLight ? 'text-slate-500 hover:text-slate-800' : 'text-neutral-400 hover:text-white'
 }`}
 >
 <MapIcon className="w-3.5 h-3.5" />
 <span>Mapa GPS</span>
 </button>
 </div>

 <div className="relative flex-1 sm:w-48">
 <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
 <input
 id="crm-search"
 type="text"
 placeholder={sectionTab === 'medios' ?"Buscar medio..." :"Buscar sala..."}
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className={`w-full rounded-lg pl-9 ${searchTerm ? 'pr-8' : 'pr-3'} py-1.5 text-[10px] focus:outline-none font-sans transition-all ${
 isStitchLight 
 ? 'bg-white text-slate-800 focus:-indigo-500 placeholder:text-slate-400' 
 : 'bg-[#131313] text-[#e5e2e1] focus:-[#f2ca50]/50 placeholder:text-neutral-600'
 }`}
 />
 {searchTerm && (
 <button
 id="crm-search-clear"
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
 </div>
 </div>

 {/* Enrich Status Banner */}
 {enrichStatusMsg && (
 <div className={`p-2.5 rounded-lg text-[10px] font-sans flex items-center justify-between gap-2 animate-fadeIn ${
 enrichStatusMsg.includes('¡Éxito!')
 ? isStitchLight ? (isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]') : 'bg-[#10b981]/15/30 text-[#10b981]'
 : isStitchLight ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-500/15 text-sky-400'
 }`}>
 <div className="flex items-center gap-2">
 <MapPin className="w-4 h-4 text-sky-400 shrink-0 animate-bounce" />
 <span>{enrichStatusMsg}</span>
 </div>
 <button 
 type="button" 
 onClick={() => setEnrichStatusMsg('')}
 className="p-0.5 rounded hover:opacity-75 cursor-pointer"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 )}

 {/* Dynamic & Configurable City Quick Filter Chips */}
 <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin text-[10px] font-sans">
 <span className={`text-[10px] uppercase tracking-wider font-bold shrink-0 flex items-center gap-1 ${isStitchLight ? 'text-slate-400' : 'text-neutral-500'}`}>
 <MapPin className="w-3 h-3 text-[#d1b375]/80" />
 <span>Ciudad:</span>
 </span>

 {/* All Cities Chip */}
 <button
 type="button"
 onClick={() => setSelectedCityFilter('')}
 className={`px-2 py-1 rounded-full font-sans text-[10px] font-medium shrink-0 transition-all cursor-pointer ${
 selectedCityFilter === ''
 ? 'bg-[#22211F] text-[#eab308] font-bold'
 : 'text-[#9a9591] hover:text-[#e5e2e1]'
 }`}
 >
 Todas ({activeLeadsForSection.length})
 </button>

 {/* Dynamic & Custom City Chips */}
 {displayCityChips.map(cityName => {
 const isSelected = selectedCityFilter.toLowerCase() === cityName.toLowerCase();
 const count = cityCounts[cityName] || 0;
 const isCustom = customCityChips.includes(cityName);

 return (
 <div key={cityName} className="relative group shrink-0 flex items-center">
 <button
 type="button"
 onClick={() => setSelectedCityFilter(isSelected ? '' : cityName)}
 className={`px-2 py-1 rounded-full font-sans text-[13px] transition-all cursor-pointer flex items-center gap-1.5 ${ isSelected
 ? ' text-[#eab308] bg-[#eab308]/10 font-bold' : ' text-[#9a9591] hover:text-white hover:-[#666]' }`}
 >
 <span>{cityName}</span>
 {count > 0 && (
 <span className="opacity-70">
 ({count})
 </span>
 )}
 {isCustom && (
 <span
 onClick={(e) => handleRemoveCustomCity(cityName, e)}
 title="Eliminar esta ciudad de tus accesos rápidos"
 className="hover:text-rose-400 ml-0.5 text-[10px] transition-colors p-0.5 rounded-full"
 >
 <X className="w-3 h-3" />
 </span>
 )}
 </button>
 </div>
 );
 })}

 {/* Inline Add Custom City Chip Form */}
 {isAddingCityChip ? (
 <form onSubmit={handleAddCustomCity} className="flex items-center gap-1 shrink-0">
 <input
 type="text"
 autoFocus
 placeholder="Escribe ciudad..."
 value={newCityInput}
 onChange={(e) => setNewCityInput(e.target.value)}
 className={`px-2 py-1 text-[10px] rounded-md focus:outline-none font-sans ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#181818] text-white'
 }`}
 />
 <button
 type="submit"
 className="p-1 rounded bg-[#10b981]/15 hover:bg-[#10b981]/15 text-white transition-colors"
 >
 <Check className="w-3 h-3" />
 </button>
 <button
 type="button"
 onClick={() => { setIsAddingCityChip(false); setNewCityInput(''); }}
 className="p-1 rounded bg-neutral-700 hover:bg-neutral-600 text-white transition-colors"
 >
 <X className="w-3 h-3" />
 </button>
 </form>
 ) : (
 <button
 type="button"
 onClick={() => setIsAddingCityChip(true)}
 className={`px-2 py-1 rounded-md -dashed font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
 isStitchLight 
 ? '-slate-300 hover:-indigo-500 text-slate-500 hover:text-sky-400 bg-slate-50/50' 
 : '-neutral-700 text-neutral-400 hover:text-[#f2ca50] bg-[#121110]'
 }`}
 >
 <Plus className="w-3 h-3" /> Añadir
 </button>
 )}
 </div>

 {/* Filter Pill Tabs */}
 <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-thin">
 {([
 { key: 'todos', label: 'Todos' },
 { key: 'nuevo', label: 'Por contactar' },
 { key: 'pendiente_aprobacion', label: 'Por aprobar' },
 { key: 'aprobado', label: 'Aprobados' },
 { key: 'esperando_respuesta', label: 'Enviados' },
 { key: 'interesado', label: 'Interesados' },
 { key: 'negociando', label: 'Negociando' },
 { key: 'no_interesado', label: 'No interesados' }
 ] as const).map(tab => {
 const count = tab.key === 'todos' ? sectionLeads.length : sectionLeads.filter(l => normalizeStatus(l.estado) === tab.key).length;
 const isSelected = statusFilter === tab.key;

 return (
 <button
 id={`crm-filter-${tab.key}`}
 key={tab.key}
 onClick={() => setStatusFilter(tab.key)}
 className={`py-2 text-[13px] font-sans font-medium transition-all shrink-0 cursor-pointer ${ isSelected ? '-[#eab308] text-white' : '-transparent text-[#9a9591] hover:text-white hover:-[#666]' }`}
 >
 <span>{tab.label}</span>
 <span className="ml-1 opacity-70">({count})</span>
 </button>
 );
 })}
 </div>

 {/* Main Display Area: Map vs List */}
 {viewMode === 'map' ? (
 <VenueMap
 leads={filteredLeads}
 selectedLead={selectedLead}
 onSelectLead={handleOpenLead}
 onUpdateLead={onUpdateLead}
 isStitchLight={isStitchLight}
 activeCityFilter={selectedCityFilter}
 activeRegionFilter=""
 />
 ) : (
 <div className="space-y-4 pb-10">
 {filteredLeads.map(lead => {
 const isSelected = selectedLead?.id === lead.id;
 return (
 <div 
 key={lead.id}
 onClick={() => handleOpenLead(lead)}
 className={`p-4 rounded-2xl transition-all cursor-pointer flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ${ isSelected ? 'bg-[#1A1918]' : 'bg-[#121110] -transparent hover:bg-[#1A1918]' }`}
 >
 <div className="flex items-center gap-4 min-w-0">
 <div className="w-10 h-10 rounded flex items-center justify-center shrink-0 bg-[#2A2928] text-[#9A9591] font-display font-bold text-lg">
 {lead.nombre_sala.charAt(0).toUpperCase()}
 </div>
 <div className="flex flex-col min-w-0">
 <div className="flex items-center gap-2">
 <span className="font-display font-bold text-sm tracking-wide text-zinc-100 truncate">{lead.nombre_sala}</span>
 <span className={`inline-flex items-center text-[10px] px-2 py-1 rounded-full font-sans font-medium ${getStatusBadgeClass(lead.estado)}`}>
 {getStatusLabel(lead.estado)}
 </span>
 </div>
 <div className="flex gap-1.5 text-[10px] font-sans text-[#9a9591] truncate mt-1">
 <span>{lead.ciudad}</span>
 <span>·</span>
 <span>{lead.aforo || 'Desconocido'} pax</span>
 <span>·</span>
 <span>{lead.genero}</span>
 </div>
 </div>
 </div>
 
 <div className="flex items-center gap-4 shrink-0 mt-3 sm:mt-0 self-end sm:self-auto">
 <div className="text-[10px] font-sans text-[#9a9591] hidden sm:block">
 ★ 4.2 (120)
 </div>
 <button
 onClick={(e) => {
 e.stopPropagation();
 handleOpenLead(lead);
 }}
 className={`px-2 py-1 rounded-lg text-[13px] font-sans transition-colors cursor-pointer ${ isSelected ? 'bg-white text-[#121110] -transparent font-bold' : '-[#333130] text-zinc-300 hover:bg-[#22211F] hover:text-white' }`}
 >
 Intervenir
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>

 {/* DETAILED WORKSPACE PANEL (1/3 width) */}
 <div ref={interventionPanelRef} className="space-y-6">
 {selectedLead ? (
 <div className="space-y-6 relative">
 
 {/* Header */}
 <div className="flex justify-between items-start">
 <div>
 <h3 className="text-3xl font-bold font-display tracking-tight text-zinc-50">{selectedLead.nombre_sala}</h3>
 <p className="text-[13px] font-sans mt-2 text-[#9a9591]">{selectedLead.ciudad} • {selectedLead.genero || 'Variado'} • {selectedLead.aforo || '?'} pax</p>
 
 </div>
 <div className="flex items-center gap-2">
 <button
 id="crm-btn-edit-lead-info"
 onClick={handleStartEditLeadInfo}
 className="p-2 rounded-lg bg-[#22211f] hover:bg-[#2A2928] text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
 title="Editar y corregir datos completos de esta ficha"
 >
 <Edit3 className="w-4 h-4" />
 </button>
 <button 
 onClick={() => setSelectedLead(null)}
 className="p-2 rounded-lg bg-[#22211f] hover:bg-[#2A2928] text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Contact Card */}
 <div className="bg-[#1A1918] rounded-xl p-5 space-y-2">
 <p className="text-[10px] font-sans text-[#9a9591] mb-3">Contacto</p>
 {selectedLead.direccion ? (
 <p className="text-[13px] font-sans font-bold text-zinc-100">{selectedLead.direccion}</p>
 ) : (
 <button
 id="btn-autodetect-address"
 onClick={() => {
 const detected = autoDetectVenueAddress(selectedLead.nombre_sala, selectedLead.ciudad);
 onUpdateLead(selectedLead.id, { direccion: detected });
 setSelectedLead(prev => prev ? { ...prev, direccion: detected } : null);
 }}
 className="text-[10px] font-sans font-bold text-[#eab308] hover:text-[#facc15] cursor-pointer flex items-center gap-1.5"
 >
 <Sparkles className="w-3.5 h-3.5" />
 Auto-detectar dirección exacta
 </button>
 )}
 {selectedLead.telefono && (
 <p className="text-[13px] font-sans text-zinc-100">{selectedLead.telefono}</p>
 )}
 <div className="text-[13px] font-sans text-zinc-100 mt-1">
 Google rating: 3.8 <span className="text-[#9a9591]">(114 reseñas)</span>
 </div>
 
 <div className="pt-2">
 <a
 id="btn-lead-google-maps"
 href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLead.direccion || `${selectedLead.nombre_sala}, ${selectedLead.ciudad}`)}`}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold text-[#9a9591] hover:text-zinc-100 transition-colors"
 >
 <MapPin className="w-3.5 h-3.5" />
 Cómo llegar (Google Maps)
 </a>
 </div>
 </div>

 {/* Status Section Card */}
 <div className="bg-[#1A1918] rounded-xl p-5 space-y-2">
 <p className="text-[10px] font-sans text-[#9a9591] mb-2">Estado</p>
 <div className="flex items-center gap-2">
 <span className={`w-2 h-2 rounded-full ${getStatusDotColor(selectedLead.estado)}`} />
 <select
 id="crm-status-selector"
 value={normalizeStatus(selectedLead.estado)}
 onChange={(e) => handleCorrectStatus(e.target.value as LeadStatus)}
 className="text-[13px] font-sans font-bold text-zinc-100 bg-transparent cursor-pointer focus:outline-none appearance-none"
 title="Cambiar estado del lead manualmente"
 >
 <option value="nuevo">Por contactar (nuevo)</option>
 <option value="pendiente_aprobacion">Por aprobar (pendiente)</option>
 <option value="aprobado">Aprobado para envío</option>
 <option value="esperando_respuesta">Email enviado • esperando respuesta</option>
 <option value="interesado">Interesado</option>
 <option value="negociando">Negociando</option>
 <option value="no_interesado">No interesado</option>
 </select>
 </div>
 </div>

 {/* Tab Navigation inside Intervention Panel */}
 <div className="flex dark:-neutral-800 gap-2 pt-1">
 <button
 type="button"
 id="crm-tab-info"
 onClick={() => setActiveTab('info')}
 className={`pb-2 text-[10px] font-sans tracking-wider uppercase transition-all px-2 cursor-pointer ${
 activeTab === 'info'
 ? isStitchLight
 ? '-indigo-600 text-sky-400 font-bold'
 : '-[#f2ca50] text-[#f2ca50] font-bold'
 : '-transparent text-neutral-400 hover:text-neutral-200'
 }`}
 >
 Detalle y Borrador
 </button>
 <button
 type="button"
 id="crm-tab-emails"
 onClick={() => setActiveTab('emails')}
 className={`pb-2 text-[10px] font-sans tracking-wider uppercase transition-all px-2 flex items-center gap-1.5 cursor-pointer ${
 activeTab === 'emails'
 ? isStitchLight
 ? '-indigo-600 text-sky-400 font-bold'
 : '-[#f2ca50] text-[#f2ca50] font-bold'
 : '-transparent text-neutral-400 hover:text-neutral-200'
 }`}
 >
 <Mail className="w-3.5 h-3.5" />
 <span>Hilo de Emails</span>
 {selectedLead.hilo_emails && selectedLead.hilo_emails.length > 0 && (
 <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
 isStitchLight ? 'bg-sky-500/15 text-sky-400' : 'bg-[#f2ca50] text-[#3c2f00]'
 }`}>
 {selectedLead.hilo_emails.length}
 </span>
 )}
 </button>
 </div>

 {activeTab === 'info' ? (
 <>
 {/* Lead Info Edit Form (When activated) */}
 {isEditingLeadInfo && (
 <div className={`p-4 rounded-xl space-y-3 font-sans text-[10px] shadow-lg animate-in fade-in duration-200 ${
 isStitchLight
 ? 'bg-sky-500/15 text-slate-800'
 : 'bg-[#181818] text-[#e5e2e1]'
 }`}>
 <div className="flex justify-between items-center pb-2.5">
 <span className="font-bold uppercase text-[10px] tracking-wider text-sky-400 dark:text-[#f2ca50] flex items-center gap-1.5">
 <Edit3 className="w-3.5 h-3.5" /> Editar Ficha Directa ({selectedLead.nombre_sala})
 </span>
 <div className="flex gap-2">
 <button
 onClick={() => setIsEditingLeadInfo(false)}
 className={`px-2 py-1 text-[10px] rounded font-sans cursor-pointer ${
 isStitchLight ? 'bg-white text-slate-600 hover:bg-slate-100' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
 }`}
 >
 Cancelar
 </button>
 <button
 onClick={handleSaveLeadInfo}
 className="px-2 py-1 text-[10px] rounded bg-[#10b981]/15 text-white font-bold hover:bg-[#10b981]/15 cursor-pointer shadow"
 >
 Guardar Cambios
 </button>
 </div>
 </div>

 <div className="space-y-3">
 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>Nombre de {sectionTab === 'salas' ? 'la Sala / Club' : 'del Medio / Prensa'}</label>
 <input
 type="text"
 value={editedLeadInfo.nombre_sala || ''}
 onChange={(e) => setEditedLeadInfo({ ...editedLeadInfo, nombre_sala: e.target.value })}
 className={`w-full mt-1 p-2 rounded text-[10px] font-sans focus:outline-none ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#101010] text-neutral-100'
 }`}
 />
 </div>

 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>Contacto (Persona)</label>
 <input
 type="text"
 value={editedLeadInfo.contacto_nombre || ''}
 onChange={(e) => setEditedLeadInfo({ ...editedLeadInfo, contacto_nombre: e.target.value })}
 className={`w-full mt-1 p-2 rounded text-[10px] font-sans focus:outline-none ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#101010] text-neutral-100'
 }`}
 />
 </div>
 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>Email de Contacto</label>
 <input
 type="email"
 value={editedLeadInfo.email_contacto || ''}
 onChange={(e) => setEditedLeadInfo({ ...editedLeadInfo, email_contacto: e.target.value })}
 className={`w-full mt-1 p-2 rounded text-[10px] font-sans focus:outline-none ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#101010] text-neutral-100'
 }`}
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>Teléfono</label>
 <input
 type="text"
 value={editedLeadInfo.telefono || ''}
 onChange={(e) => setEditedLeadInfo({ ...editedLeadInfo, telefono: e.target.value })}
 className={`w-full mt-1 p-2 rounded text-[10px] font-sans focus:outline-none ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#101010] text-neutral-100'
 }`}
 />
 </div>
 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>Aforo / Alcance</label>
 <input
 type="number"
 value={editedLeadInfo.aforo || 0}
 onChange={(e) => setEditedLeadInfo({ ...editedLeadInfo, aforo: Number(e.target.value) })}
 className={`w-full mt-1 p-2 rounded text-[10px] font-sans focus:outline-none ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#101010] text-neutral-100'
 }`}
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>Ciudad</label>
 <input
 type="text"
 value={editedLeadInfo.ciudad || ''}
 onChange={(e) => setEditedLeadInfo({ ...editedLeadInfo, ciudad: e.target.value })}
 className={`w-full mt-1 p-2 rounded text-[10px] font-sans focus:outline-none ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#101010] text-neutral-100'
 }`}
 />
 </div>
 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>Región</label>
 <input
 type="text"
 value={editedLeadInfo.region || ''}
 onChange={(e) => setEditedLeadInfo({ ...editedLeadInfo, region: e.target.value })}
 className={`w-full mt-1 p-2 rounded text-[10px] font-sans focus:outline-none ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#101010] text-neutral-100'
 }`}
 />
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between">
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>Dirección Exacta (Calle, Número, CP)</label>
 <button
 type="button"
 onClick={() => {
 const detected = autoDetectVenueAddress(editedLeadInfo.nombre_sala || '', editedLeadInfo.ciudad || '');
 setEditedLeadInfo({ ...editedLeadInfo, direccion: detected });
 }}
 className={`text-[10px] font-sans font-bold flex items-center gap-1 cursor-pointer transition-colors ${
 isStitchLight ? 'text-sky-400 hover:text-sky-400' : 'text-[#f2ca50] hover:text-[#d1b375]'
 }`}
 >
 <Sparkles className="w-2.5 h-2.5" />
 <span>Auto-completar</span>
 </button>
 </div>
 <input
 type="text"
 placeholder="Ej: Calle San Vicente, 12, 46002 Valencia"
 value={editedLeadInfo.direccion || ''}
 onChange={(e) => setEditedLeadInfo({ ...editedLeadInfo, direccion: e.target.value })}
 className={`w-full mt-1 p-2 rounded text-[10px] font-sans focus:outline-none ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#101010] text-neutral-100'
 }`}
 />
 </div>

 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>Sitio Web / URL</label>
 <input
 type="text"
 value={editedLeadInfo.website || ''}
 onChange={(e) => setEditedLeadInfo({ ...editedLeadInfo, website: e.target.value })}
 className={`w-full mt-1 p-2 rounded text-[10px] font-sans focus:outline-none ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#101010] text-neutral-100'
 }`}
 />
 </div>
 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>Estilo / Género</label>
 <input
 type="text"
 value={editedLeadInfo.genero || ''}
 onChange={(e) => setEditedLeadInfo({ ...editedLeadInfo, genero: e.target.value })}
 className={`w-full mt-1 p-2 rounded text-[10px] font-sans focus:outline-none ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#101010] text-neutral-100'
 }`}
 />
 </div>
 </div>

 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>Notas de la Fila</label>
 <textarea
 rows={3}
 value={editedLeadInfo.notas || ''}
 onChange={(e) => setEditedLeadInfo({ ...editedLeadInfo, notas: e.target.value })}
 className={`w-full mt-1 p-2 rounded text-[10px] font-sans focus:outline-none ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#101010] text-neutral-100'
 }`}
 />
 </div>
 </div>
 </div>
 )}

 {/* CRM Actions (Conditional based on current status) */}
 <div className="bg-[#1A1918] rounded-xl p-5">
 <p className="text-[10px] font-sans text-[#9a9591] mb-4">Acciones de Booking</p>
 
 {selectedLead.estado === 'pendiente_aprobacion' ? (
 <div className="space-y-3">
 {/* Reject Pitch */}
 {!isRejecting ? (
 <button
 id="crm-btn-reject-start"
 onClick={() => setIsRejecting(true)}
 className="w-full py-2.5 bg-[#22211f] hover:bg-[#2A2928] text-rose-400 font-sans font-bold text-[13px] rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
 >
 <X className="w-4 h-4" /> Rechazar borrador
 </button>
 ) : (
 <div className="space-y-3 animate-in slide-in-from-top-1 duration-200">
 <label className="block text-[10px] font-sans text-[#9a9591]">Motivo del Rechazo / Directriz de Edición</label>
 <textarea
 id="crm-rejection-notes"
 rows={3}
 value={rejectionNotes}
 onChange={(e) => setRejectionNotes(e.target.value)}
 placeholder="Ej: El cachet propuesto es muy bajo..."
 className="w-full bg-[#121110] rounded-lg p-3 text-[13px] font-sans text-zinc-100 focus:outline-none focus:ring-1 focus:ring-rose-500/50 resize-none"
 />
 <div className="flex gap-2">
 <button
 id="crm-btn-reject-cancel"
 onClick={() => setIsRejecting(false)}
 className="flex-1 py-2 bg-[#22211f] hover:bg-[#2A2928] text-neutral-300 font-sans text-[13px] rounded-lg cursor-pointer transition-colors"
 >
 Cancelar
 </button>
 <button
 id="crm-btn-reject-submit"
 onClick={handleRejectLead}
 disabled={!rejectionNotes}
 className="flex-1 py-2 bg-rose-500/15 hover:bg-rose-500/15 text-white font-sans font-bold text-[13px] rounded-lg disabled:opacity-40 cursor-pointer transition-colors"
 >
 Confirmar Rechazo
 </button>
 </div>
 </div>
 )}
 </div>
 ) : (
 <div className="space-y-3">
 <p className="text-[10px] font-sans text-[#9a9591] mb-2">
 Corrige manualmente la respuesta:
 </p>
 <div className="grid grid-cols-1 gap-2">
 <button
 id="crm-correct-interesado"
 onClick={() => handleCorrectStatus('interesado')}
 className={`py-2 px-3 rounded-lg text-[13px] font-sans text-left transition-colors flex justify-between items-center ${
 selectedLead.estado === 'interesado'
 ? 'bg-[#10b981]/15 text-[#10b981]/80'
 : 'bg-[#22211f] hover:bg-[#2A2928] text-neutral-300'
 }`}
 >
 <span>Interesado</span>
 {selectedLead.estado === 'interesado' && <Check className="w-4 h-4 text-[#10b981]/80" />}
 </button>
 <button
 id="crm-correct-negociando"
 onClick={() => handleCorrectStatus('negociando')}
 className={`py-2 px-3 rounded-lg text-[13px] font-sans text-left transition-colors flex justify-between items-center ${
 selectedLead.estado === 'negociando'
 ? 'bg-sky-500/15 text-sky-400'
 : 'bg-[#22211f] hover:bg-[#2A2928] text-neutral-300'
 }`}
 >
 <span>Negociando</span>
 {selectedLead.estado === 'negociando' && <Check className="w-4 h-4 text-sky-400" />}
 </button>
 <button
 id="crm-correct-no-interesado"
 onClick={() => handleCorrectStatus('no_interesado')}
 className={`py-2 px-3 rounded-lg text-[13px] font-sans text-left transition-colors flex justify-between items-center ${
 selectedLead.estado === 'no_interesado'
 ? 'bg-neutral-800 text-neutral-400'
 : 'bg-[#22211f] hover:bg-[#2A2928] text-neutral-300'
 }`}
 >
 <span>No interesado</span>
 {selectedLead.estado === 'no_interesado' && <Check className="w-4 h-4 text-neutral-500" />}
 </button>
 </div>
 </div>
 )}
 </div>

 {/* Contacto & Contexto Extra Info */}
 <div className={`space-y-3 pt-4 ${isStitchLight ? '-slate-100' : '-[#99907c]/15'}`}>
 <div className="flex justify-between items-center">
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>Ficha de Contacto</label>
 <button
 id="crm-btn-scrape-selected-lead"
 onClick={handleScrapeSelectedLead}
 disabled={isScrapingLead}
 className={`px-2 py-1 text-[10px] font-sans rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
 isStitchLight
 ? 'bg-[#d1b375]/15 hover:bg-[#d1b375]/15 text-[#d1b375] disabled:opacity-50'
 : 'bg-[#f2ca50]/10 hover:bg-[#f2ca50]/20 text-[#f2ca50] disabled:opacity-50'
 }`}
 title="Buscar emails de booking, teléfono o aforo en Google con Agente Scout IA"
 >
 {isScrapingLead ? (
 <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d1b375]/80" />
 ) : (
 <Sparkles className="w-3.5 h-3.5 text-[#d1b375]/80 dark:text-[#f2ca50]" />
 )}
 <span>{isScrapingLead ? 'Buscando con IA...' : '✨ Buscar con IA Scout'}</span>
 </button>
 </div>

 <div className="space-y-1.5 font-sans text-[10px]">
 <div className={`p-2.5 rounded-lg flex items-center justify-between ${
 selectedLead.email_contacto
 ? isStitchLight ? 'bg-slate-50 text-slate-800' : 'bg-[#131313] text-neutral-200'
 : isStitchLight ? 'bg-[#d1b375]/15 text-[#d1b375]' : 'bg-[#d1b375]/15/30 text-[#d1b375]'
 }`}>
 <div className="flex items-center gap-2 overflow-hidden">
 <Mail className="w-4 h-4 shrink-0 text-sky-400 dark:text-[#f2ca50]" />
 <span className="truncate">{selectedLead.email_contacto || 'Sin email de contacto registrado'}</span>
 </div>
 {!selectedLead.email_contacto && (
 <span className="text-[10px] font-bold px-2 py-1 rounded bg-[#d1b375]/15 text-[#d1b375] dark:text-[#d1b375] shrink-0">
 Falta Email
 </span>
 )}
 </div>

 <div className="grid grid-cols-2 gap-2 text-[10px]">
 <div className={`p-2 rounded flex items-center gap-1.5 ${
 isStitchLight ? 'bg-slate-50 text-slate-700' : 'bg-[#131313] text-neutral-300'
 }`}>
 <span className="text-neutral-400">👤</span>
 <span className="truncate">{selectedLead.contacto_nombre || 'Sin contacto'}</span>
 </div>
 <div className={`p-2 rounded flex items-center gap-1.5 ${
 isStitchLight ? 'bg-slate-50 text-slate-700' : 'bg-[#131313] text-neutral-300'
 }`}>
 <Globe className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
 <span className="truncate">{selectedLead.website || selectedLead.telefono || 'Sin web/tel'}</span>
 </div>
 </div>
 </div>

 {/* Scraping Loading */}
 {isScrapingLead && (
 <div className={`p-3 rounded-lg text-[10px] font-sans space-y-2 animate-pulse ${
 isStitchLight ? 'bg-[#d1b375]/15 text-[#d1b375]' : 'bg-[#1f1a10]/30 text-[#d1b375]'
 }`}>
 <div className="flex items-center gap-2">
 <Loader2 className="w-4 h-4 animate-spin text-[#d1b375]/80" />
 <span className="font-bold">{scrapingLeadStatus}</span>
 </div>
 <p className="text-[10px] opacity-80">
 Google Search Grounding está consultando páginas oficiales y directorios reales de salas para extraer correos verificados.
 </p>
 </div>
 )}

 {/* Scraping Error */}
 {scrapingLeadError && (
 <div className="p-3 rounded-lg text-[10px] font-sans text-rose-400 bg-rose-500/15 dark:bg-rose-500/15 dark:-rose-800/50 dark:text-rose-400">
 ⚠️ {scrapingLeadError}
 </div>
 )}

 {/* Scraped Data Card */}
 {scrapedDataForLead && (
 <div className={`p-3.5 rounded-xl font-sans text-[10px] space-y-3 shadow-md animate-in fade-in duration-200 ${
 isStitchLight ? 'bg-sky-500/15 text-slate-800' : 'bg-[#18181c] text-[#e5e2e1]'
 }`}>
 <div className="flex justify-between items-center pb-2">
 <span className="font-bold text-[10px] uppercase text-sky-400 dark:text-[#f2ca50] flex items-center gap-1.5">
 <Sparkles className="w-3.5 h-3.5 text-[#d1b375]/80" /> Resultados del Agente Scout
 </span>
 <button
 onClick={() => setScrapedDataForLead(null)}
 className="text-[10px] text-neutral-400 hover:text-white cursor-pointer"
 >
 Cerrar
 </button>
 </div>

 <div className="space-y-2 text-[10px]">
 {scrapedDataForLead.email_contacto?.valor && (
 <div className="flex justify-between items-center bg-white/60 dark:bg-black/30 p-2 rounded dark:-neutral-800">
 <span className="font-bold text-[#10b981] dark:text-[#10b981]/80">Email: {scrapedDataForLead.email_contacto.valor}</span>
 <span className="text-[10px] uppercase px-2 py-1 rounded bg-[#10b981]/15 text-[#10b981] dark:text-[#10b981] font-bold">
 {scrapedDataForLead.email_contacto.confianza || 'Alta'}
 </span>
 </div>
 )}
 {scrapedDataForLead.telefono?.valor && (
 <div className="flex justify-between items-center bg-white/60 dark:bg-black/30 p-2 rounded dark:-neutral-800">
 <span>Teléfono: {scrapedDataForLead.telefono.valor}</span>
 </div>
 )}
 {scrapedDataForLead.website?.valor && (
 <div className="truncate bg-white/60 dark:bg-black/30 p-2 rounded dark:-neutral-800">
 <span>Web: {scrapedDataForLead.website.valor}</span>
 </div>
 )}
 {scrapedDataForLead.source_info && (
 <p className="text-[10px] italic text-neutral-500 dark:text-neutral-400 leading-tight">
 {scrapedDataForLead.source_info}
 </p>
 )}
 </div>

 <button
 onClick={handleApplyScrapedToSelectedLead}
 className="w-full py-2 bg-[#10b981]/15 hover:bg-[#10b981]/15 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer transition-all shadow-sm flex items-center justify-center gap-1.5"
 >
 <Check className="w-3.5 h-3.5" /> Aplicar Datos y Guardar Ficha
 </button>
 </div>
 )}

 {selectedLead.contexto_extra && (
 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>Contexto de la Sala / Programación</label>
 <div className={`text-[10px] font-sans mt-1 p-2.5 rounded whitespace-pre-wrap leading-relaxed ${
 isStitchLight ? 'bg-slate-50 text-slate-700' : 'bg-[#131313] text-neutral-300'
 }`}>
 {selectedLead.contexto_extra}
 </div>
 </div>
 )}
 </div>

 {/* Pitch Email Draft Section */}
 <div className="bg-[#1A1918] rounded-xl p-5 space-y-3">
 <div className="flex justify-between items-center">
 <p className="text-[10px] font-sans text-[#9a9591]">Borrador de correo</p>
 {!isEditingPitch ? (
 <button
 id="crm-edit-pitch-start"
 onClick={() => setIsEditingPitch(true)}
 className="text-[10px] font-sans font-bold text-[#eab308] hover:text-[#facc15] flex items-center gap-1.5 cursor-pointer transition-colors"
 >
 <Edit3 className="w-3.5 h-3.5" /> Editar
 </button>
 ) : (
 <div className="flex gap-3">
 <button
 id="crm-edit-pitch-cancel"
 onClick={() => {
 setEditedPitch(selectedLead.pitch_generado || '');
 setIsEditingPitch(false);
 }}
 className="text-[10px] font-sans text-[#9a9591] hover:text-zinc-100 cursor-pointer transition-colors"
 >
 Cancelar
 </button>
 <button
 id="crm-edit-pitch-save"
 onClick={handleSavePitchEdit}
 className="text-[10px] font-sans font-bold text-[#eab308] hover:text-[#facc15] cursor-pointer transition-colors"
 >
 Guardar
 </button>
 </div>
 )}
 </div>

 {isEditingPitch ? (
 <textarea
 id="crm-pitch-editor"
 rows={8}
 value={editedPitch}
 onChange={(e) => setEditedPitch(e.target.value)}
 className="w-full bg-[#121110] rounded-lg p-4 text-[13px] font-sans text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-shadow resize-y min-h-[200px]"
 />
 ) : (
 <div className="w-full bg-[#121110] rounded-lg p-4 max-h-56 overflow-y-auto text-[13px] font-sans text-zinc-100 leading-relaxed whitespace-pre-wrap select-text">
 {selectedLead.pitch_generado || 'No hay correo redactado todavía para este contacto.'}
 </div>
 )}
 
 {selectedLead.estado === 'pendiente_aprobacion' && (
 <button
 onClick={handleApproveLead}
 className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-sans font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
 >
 Aprobar y enviar
 </button>
 )}
 </div>

 {/* History / Notes Log */}
 <div className={`space-y-2 pt-4 ${isStitchLight ? '-slate-100' : '-[#99907c]/15'}`}>
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>Historial y Notas de la Fila</label>
 <div className={` rounded-lg p-2.5 max-h-36 overflow-y-auto text-[10px] font-sans whitespace-pre-wrap leading-normal ${
 isStitchLight
 ? 'bg-slate-100/50 text-slate-500'
 : 'bg-[#131313]/45 text-neutral-400'
 }`}>
 {selectedLead.notas || 'Sin notas.'}
 </div>
 </div>
 </>
 ) : (
 // Emails Tab (Interaction & Thread history)
 <div className="space-y-4 animate-in fade-in duration-200">
 {/* Contact Header info */}
 <div className={` rounded-lg p-3 text-[10px] font-sans flex items-center justify-between ${
 isStitchLight ? 'bg-slate-50 text-slate-700' : 'bg-[#131313] text-neutral-300'
 }`}>
 <span className="flex items-center gap-1.5">
 <Mail className="w-3.5 h-3.5 text-neutral-500" />
 <span>{selectedLead.email_contacto}</span>
 </span>
 {selectedLead.telefono && (
 <span className="text-neutral-500">{selectedLead.telefono}</span>
 )}
 </div>

 {/* Google Gmail Live Integration Widget */}
 <div className={` rounded-xl p-3.5 space-y-3 transition-all ${
 isStitchLight 
 ? 'bg-sky-500/15' 
 : 'bg-neutral-900/60 shadow-[0_4px_12px_rgba(0,0,0,0.2)]'
 }`}>
 <div className="flex justify-between items-center flex-wrap gap-2">
 <div className="flex items-center gap-2">
 <div className={`w-2.5 h-2.5 rounded-full ${gmailUser ? 'bg-[#10b981]/15 animate-pulse' : 'bg-[#d1b375]/15'}`} />
 <div>
 <span className="text-[10px] uppercase font-sans tracking-wider font-extrabold text-neutral-400">
 Conexión de Gmail
 </span>
 <p className="text-[10px] font-sans font-bold">
 {gmailUser ? `Conectado como ${gmailUser.email}` : 'No conectado a Gmail (Lectura Directa)'}
 </p>
 </div>
 </div>

 {gmailUser ? (
 <div className="flex items-center gap-2">
 <button
 id="gmail-sync-btn"
 onClick={handleSyncGmailForLead}
 disabled={isSyncingGmail}
 className={`py-1 px-2.5 rounded font-sans text-[10px] uppercase font-extrabold flex items-center gap-1.5 cursor-pointer select-none transition-all active:scale-95 ${
 isStitchLight
 ? 'bg-sky-500/15 hover:bg-sky-500/15 text-white shadow-sm'
 : 'bg-[#f2ca50] hover:bg-[#dfb73c] text-[#3c2f00] font-black'
 } disabled:opacity-50`}
 >
 {isSyncingGmail ? (
 <Loader2 className="w-3 h-3 animate-spin" />
 ) : (
 <RefreshCw className="w-3 h-3" />
 )}
 Sincronizar Gmail
 </button>
 <button
 id="gmail-logout-btn"
 onClick={handleGmailLogout}
 className={`p-1 px-1.5 rounded font-sans text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer transition-colors ${
 isStitchLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white'
 }`}
 title="Desconectar cuenta"
 >
 <LogOut className="w-3 h-3" />
 </button>
 </div>
 ) : (
 <button
 id="gmail-login-btn"
 onClick={handleGmailLogin}
 className={`py-1.5 px-3 rounded-lg font-sans text-[10px] uppercase font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-95 ${
 isStitchLight 
 ? 'bg-white text-slate-700 hover:bg-slate-50 hover:-slate-400' 
 : 'bg-neutral-950 text-[#f2ca50] hover:bg-neutral-900 hover:-neutral-700'
 }`}
 >
 <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-3.5 h-3.5">
 <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
 <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
 <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
 <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
 </svg>
 <span>Conectar con Google</span>
 </button>
 )}
 </div>

 {gmailStatusMsg && (
 <p className={`text-[10px] font-sans leading-normal mt-1 pt-1.5 ${
 gmailStatusMsg.includes('Error') || gmailStatusMsg.includes('No se pudo') || gmailStatusMsg.includes('⚠️')
 ? 'text-rose-400'
 : isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'
 }`}>
 {gmailStatusMsg}
 </p>
 )}

 {window.self !== window.top && !gmailUser && (
 <div className={`text-[10px] font-sans leading-normal rounded p-2.5 space-y-1.5 mt-1.5 ${
 isStitchLight 
 ? 'bg-[#d1b375]/15 text-[#d1b375]' 
 : 'bg-[#d1b375]/15 text-[#d1b375]/80'
 }`}>
 <p>
 ⚠️ <strong>Restricción del Iframe:</strong> Para conectar tu cuenta de Google, abre la app en una <strong>pestaña nueva</strong> para evitar que el navegador bloquee la autenticación.
 </p>
 <a
 href={window.location.href}
 target="_blank"
 rel="noopener noreferrer"
 className={`inline-flex items-center gap-1.5 px-2 py-1 rounded font-sans font-bold uppercase text-[10px] transition-all select-none cursor-pointer active:scale-95 ${
 isStitchLight
 ? 'bg-sky-500/15 hover:bg-sky-500/15 text-white shadow-sm'
 : 'bg-[#f2ca50] hover:bg-[#dfb73c] text-[#3c2f00] font-extrabold'
 }`}
 >
 Abrir en pestaña nueva ↗
 </a>
 </div>
 )}
 </div>

 {/* Thread messages list */}
 <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
 <div className="flex justify-between items-center">
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>Bandeja del Historial del Trato</label>
 <button
 type="button"
 onClick={handleOpenAdvancedSimulation}
 className={`text-[10px] font-sans uppercase tracking-wider rounded px-2 py-1 transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
 isStitchLight
 ? 'bg-[#d1b375]/15 hover:bg-[#d1b375]/15 text-[#d1b375] hover:-amber-300'
 : 'bg-[#d1b375]/15 hover:bg-[#d1b375]/15/30 text-[#f2ca50] hover:-[#f2ca50]/50'
 }`}
 title="Simular correo electrónico personalizado de respuesta (Sala o Banda)"
 >
 <Sparkles className="w-2.5 h-2.5 text-[#d1b375]/80 animate-pulse" />
 <span>Simular Negociación</span>
 </button>
 </div>
 
 {!selectedLead.hilo_emails || selectedLead.hilo_emails.length === 0 ? (
 <div className={` -dashed rounded-lg p-6 text-center text-[10px] font-sans py-10 ${
 isStitchLight ? '-slate-200 text-slate-400' : '-neutral-800 text-neutral-500'
 }`}>
 No hay correos anteriores registrados. ¡Escribe el primer mensaje abajo para iniciar la negociación!
 </div>
 ) : (
 selectedLead.hilo_emails.map((email) => {
 const isBanda = email.remitente === 'banda';
 return (
 <div 
 key={email.id} 
 className={` rounded-lg p-3 text-[10px] leading-relaxed transition-all ${
 isBanda 
 ? isStitchLight
 ? 'bg-sky-500/15 text-slate-800 shadow-[0_1px_4px_rgba(79,70,229,0.02)]'
 : 'bg-[#ffb596]/10 text-[#e5e2e1]'
 : isStitchLight
 ? 'bg-[#d1b375]/15 text-slate-800'
 : 'bg-neutral-800/40 text-[#e5e2e1]'
 }`}
 >
 <div className="flex justify-between items-start mb-1.5 pb-1 dark:-neutral-800/50 flex-wrap gap-1">
 <div>
 <span className="font-bold font-sans tracking-wide">
 {email.remitente_nombre}
 </span>
 <span className={`ml-1.5 px-2 py-1 rounded text-[10px] font-sans uppercase font-extrabold ${
 isBanda 
 ? 'bg-sky-500/15 text-sky-400 dark:text-sky-400' 
 : 'bg-[#d1b375]/15 text-[#d1b375]/80 dark:text-[#f2ca50]/20'
 }`}>
 {isBanda ? 'Banda' : 'Sala'}
 </span>
 </div>
 <span className="text-[10px] font-sans text-neutral-500 flex items-center gap-1">
 <Clock className="w-2.5 h-2.5" />
 {email.fecha}
 </span>
 </div>
 <div className="font-sans text-[10px] text-neutral-500 mb-1 font-bold">Asunto: {email.asunto}</div>
 <p className="whitespace-pre-wrap font-sans text-[10px] text-neutral-800 dark:text-neutral-300">{email.mensaje}</p>
 </div>
 );
 })
 )}
 </div>

 {/* Manual compose editor */}
 <div className={` rounded-lg p-3.5 space-y-3 ${
 isStitchLight ? 'bg-slate-50' : 'bg-[#131313]/70'
 }`}>
 <div className="flex items-center gap-1.5 dark:-neutral-800 pb-2">
 <Edit3 className={`w-4 h-4 ${isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'}`} />
 <h4 className={`text-[10px] font-sans uppercase tracking-widest ${textTitle}`}>Intervención Personal (Enviar Email en Persona)</h4>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
 <div className="space-y-1">
 <label className={`block text-[10px] uppercase font-sans ${textSub}`}>Asunto</label>
 <input 
 type="text"
 value={manualEmailSubject}
 onChange={(e) => setManualEmailSubject(e.target.value)}
 placeholder="Re: Propuesta de concierto..."
 className={`w-full rounded px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight ? 'bg-white text-slate-800 focus:-indigo-500' : 'bg-[#1c1b1b] text-[#e5e2e1] focus:-[#f2ca50]'
 }`}
 />
 </div>
 <div className="space-y-1">
 <label className={`block text-[10px] uppercase font-sans ${textSub}`}>Quién envía</label>
 <select 
 value={manualEmailSender}
 onChange={(e) => setManualEmailSender(e.target.value)}
 className={`w-full rounded px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight ? 'bg-white text-slate-800 focus:-indigo-500' : 'bg-[#1c1b1b] text-[#e5e2e1] focus:-[#f2ca50]'
 }`}
 >
 <option value="Bakandeya Agent Manager IA">Bakandeya Agent Manager IA</option>
 <option value="Diego (Guitarrista de Bakandeya)">Diego (Guitarra)</option>
 <option value="Filgue (Bajo de Bakandeya)">Filgue (Bajo)</option>
 </select>
 </div>
 </div>

 <div className="space-y-1">
 <label className={`block text-[10px] uppercase font-sans ${textSub}`}>Cuerpo del Correo Personal</label>
 <textarea
 rows={5}
 value={manualEmailBody}
 onChange={(e) => setManualEmailBody(e.target.value)}
 placeholder="Redacta el mensaje de manera personal para concretar el concierto (caché, horarios, repartos)..."
 className={`w-full rounded p-2 text-[10px] focus:outline-none font-sans leading-relaxed ${
 isStitchLight ? 'bg-white text-slate-800 focus:-indigo-500' : 'bg-[#1c1b1b] text-[#e5e2e1] focus:-[#f2ca50]'
 }`}
 />
 </div>

 {manualEmailStatus && (
 <p className="text-[10px] font-sans text-[#10b981]/80 font-bold animate-pulse">{manualEmailStatus}</p>
 )}

 <div className="flex gap-2 pt-1 items-center justify-between">
 <span className={`text-[10px] font-sans leading-none max-w-[150px] ${textMuted}`}>
 Nota: Al enviar, se actualizará el estado del contacto a negociando de inmediato.
 </span>
 <button
 type="button"
 onClick={handleSendManualEmail}
 disabled={!manualEmailBody}
 className={`px-2 py-1 font-sans font-bold text-[10px] uppercase tracking-wider rounded-md flex items-center gap-1.5 cursor-pointer shadow active:scale-[0.98] disabled:opacity-40 transition-all ${
 isStitchLight
 ? 'bg-sky-500/15 hover:bg-sky-500/15 text-white shadow-indigo-100'
 : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
 }`}
 >
 <Send className="w-3.5 h-3.5" /> Enviar en Persona
 </button>
 </div>
 </div>
 </div>
 )}

 </div>
 ) : (
 <div className={` rounded-xl p-6 text-center py-24 space-y-3 ${
 isStitchLight
 ? 'bg-slate-50/50 -dashed text-slate-400'
 : 'bg-[#1c1b1b]/95 text-neutral-500'
 }`}>
 <Bot className={`w-10 h-10 mx-auto animate-pulse ${isStitchLight ? 'text-sky-400/50' : 'text-[#f2ca50]/55'}`} />
 <h4 className={`text-[10px] font-sans uppercase tracking-widest ${isStitchLight ? 'text-sky-400/80' : 'text-[#f2ca50]/80'}`}>Intervención de Booking</h4>
 <p className="text-[10px] leading-relaxed max-w-[200px] mx-auto">
 Selecciona cualquier sala o medio a la izquierda para editar su borrador de correo, validar el mensaje antes de enviar o reclasificar su respuesta.
 </p>
 </div>
 )}
 </div>

 </div>

 {/* 3. EMAIL TEMPLATES & AI SETTINGS EDITOR CARD */}
 <div className={`${colors.card} p-5 space-y-6`}>
 <div className={` pb-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3 ${isStitchLight ? '-slate-100' : '-[#99907c]/15'}`}>
 <div>
 <h3 className={`text-sm font-bold font-display uppercase tracking-widest flex items-center gap-2 ${isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'}`}>
 <Settings className={`w-4 h-4 ${isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'}`} /> Configuración de Plantillas y Pautas AI por Categoría (Redactor)
 </h3>
 <p className={`text-[10px] font-sans mt-1 ${textSub}`}>
 Personaliza el correo por defecto y las pautas de IA diferenciadas para Salas, Festivales, Discotecas, Medios, Grupos y Managements.
 </p>
 </div>

 {/* Template Tab Selector (6 Categories) */}
 <div className={`flex flex-wrap items-center gap-1 p-1 rounded-xl shrink-0 ${
 isStitchLight ? 'bg-slate-100' : 'bg-[#121215]'
 }`}>
 {[
 { id: 'salas', label: '🏛️ Salas', icon: Building2 },
 { id: 'festivales', label: '🎪 Festivales', icon: Tent },
 { id: 'discotecas', label: '🪩 Discotecas', icon: Disc3 },
 { id: 'medios', label: '📻 Medios', icon: Radio },
 { id: 'grupos', label: '🎸 Grupos', icon: Users },
 { id: 'managements', label: '💼 Managements', icon: Briefcase }
 ].map((tab) => {
 const isActive = templateTab === tab.id;
 const IconComp = tab.icon;
 return (
 <button
 key={tab.id}
 type="button"
 id={`template-tab-${tab.id}`}
 onClick={() => setTemplateTab(tab.id as TemplateCategory)}
 className={`py-1.5 px-2.5 rounded-lg text-[10px] font-sans font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
 isActive
 ? isStitchLight
 ? 'bg-white text-sky-400 shadow-sm'
 : 'bg-[#f2ca50] text-[#3c2f00] font-extrabold shadow-md'
 : isStitchLight
 ? 'text-slate-500 hover:text-slate-800'
 : 'text-neutral-400 hover:text-neutral-200'
 }`}
 >
 <IconComp className="w-3.5 h-3.5" />
 <span>{tab.label}</span>
 </button>
 );
 })}
 </div>
 </div>

 {/* Category Notice Banner */}
 {(() => {
 const activeTemplate = getActiveTemplateData();
 return (
 <>
 <div className={`p-3 rounded-xl text-[10px] font-sans flex items-center justify-between ${
 templateTab === 'medios'
 ? isStitchLight ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-500/15 text-rose-400'
 : templateTab === 'grupos'
 ? isStitchLight ? (isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]') : 'bg-[#10b981]/15/30 text-[#10b981]'
 : templateTab === 'discotecas'
 ? isStitchLight ? 'bg-purple-50 text-purple-900' : 'bg-purple-500/10 text-purple-300'
 : isStitchLight ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-500/15 text-sky-400'
 }`}>
 <div>
 <strong>{activeTemplate.title}</strong>
 <p className="text-[10px] opacity-80 mt-0.5">
 {activeTemplate.desc}
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Form Side */}
 <div className="space-y-4">
 <div className="space-y-1.5">
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${isStitchLight ? 'text-slate-600' : 'text-neutral-300'}`}>Asunto del Email por Defecto</label>
 <input
 id="template-subject"
 type="text"
 value={activeTemplate.subject}
 onChange={(e) => activeTemplate.setSubject(e.target.value)}
 className={`w-full rounded-lg px-2 py-1 text-[10px] focus:outline-none transition-all font-sans ${
 isStitchLight
 ? 'bg-white text-slate-800 focus:-indigo-500 focus:ring-1 focus:ring-indigo-500'
 : 'bg-[#131313] text-[#e5e2e1] focus:-[#f2ca50]/50'
 }`}
 />
 </div>

 <div className="space-y-1.5">
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${isStitchLight ? 'text-slate-600' : 'text-neutral-300'}`}>Cuerpo de la Plantilla de Correo de Presentación</label>
 <textarea
 id="template-body"
 rows={8}
 value={activeTemplate.body}
 onChange={(e) => activeTemplate.setBody(e.target.value)}
 className={`w-full rounded-lg p-3 text-[10px] focus:outline-none transition-all font-sans leading-relaxed ${
 isStitchLight
 ? 'bg-white text-slate-800 focus:-indigo-500 focus:ring-1 focus:ring-indigo-500'
 : 'bg-[#131313] text-[#e5e2e1] focus:-[#f2ca50]/50'
 }`}
 placeholder="Escribe el cuerpo de la plantilla usando {{nombre_sala}}, {{ciudad}} etc..."
 />
 </div>

 <div className="space-y-1.5">
 <label className={`block text-[10px] uppercase font-sans tracking-wider flex items-center gap-1.5 ${isStitchLight ? 'text-sky-400' : 'text-[#ffb596]'}`}>
 <Sparkles className="w-3.5 h-3.5" /> Pautas AI (Directrices de Redacción Subjetiva)
 </label>
 <textarea
 id="template-guidelines"
 rows={4}
 value={activeTemplate.guidelines}
 onChange={(e) => activeTemplate.setGuidelines(e.target.value)}
 className={`w-full rounded-lg p-3 text-[10px] focus:outline-none transition-all font-sans leading-relaxed ${
 isStitchLight
 ? 'bg-white text-slate-800 focus:-indigo-500'
 : 'bg-[#131313] text-[#e5e2e1] focus:-[#ffb596]/50'
 }`}
 placeholder="Ej: Mantén un tono periodístico, enfatiza el lanzamiento del single..."
 />
 </div>

 <div className="flex gap-3 pt-2">
 <button
 id="template-btn-test"
 onClick={handleTestPrompt}
 disabled={isTestingPrompt}
 className={`px-2 py-1 font-sans text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
 isStitchLight
 ? 'bg-white hover:bg-slate-50 text-slate-700'
 : 'bg-neutral-900 hover:-neutral-700 text-neutral-300'
 }`}
 >
 {isTestingPrompt ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
 <span>Probar Prompt</span>
 </button>
 <button
 id="template-btn-save"
 onClick={handleSaveTemplates}
 className={`flex-1 py-2 font-sans font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center active:scale-95 ${
 isStitchLight
 ? 'bg-sky-500/15 hover:bg-sky-500/15 text-white shadow-md shadow-indigo-100'
 : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 shadow-lg shadow-[#f2ca50]/10'
 }`}
 >
 Guardar Plantillas y Directrices
 </button>
 </div>
 </div>

 {/* Test / Prompt Output side */}
 <div className={` rounded-xl p-4 flex flex-col justify-between ${
 isStitchLight
 ? 'bg-slate-50'
 : 'bg-[#131313]'
 }`}>
 <div className="space-y-3">
 <div className={`flex items-center gap-2 pb-2 ${isStitchLight ? '-slate-200' : '-neutral-900'}`}>
 <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isStitchLight ? 'bg-sky-500/15' : 'bg-[#f2ca50]'}`} />
 <h4 className={`text-[10px] font-sans uppercase tracking-widest ${textSub}`}>Sandbox de Simulación de Redacción AI</h4>
 </div>
 
 <div className={`text-[10px] leading-relaxed font-sans ${textSub}`}>
 Cuando el agente de Python <strong>"Redactor"</strong> corre, lee estas plantillas y pautas, las mezcla con los detalles del contacto capturado por el <strong>"Scout"</strong> (aforo, ubicación, género, redes) y genera un borrador adaptado para que lo revises en esta misma pantalla.
 </div>

 {testPromptResult ? (
 <div className={` rounded-lg p-3.5 text-[10px] font-sans whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto animate-in fade-in duration-300 select-text ${
 isStitchLight
 ? 'bg-white text-slate-700'
 : 'bg-[#1c1b1b] text-neutral-300'
 }`}>
 {testPromptResult}
 </div>
 ) : (
 <div className={` -dashed rounded-lg p-12 text-center text-[10px] font-sans ${
 isStitchLight
 ? '-slate-200 text-slate-400'
 : '-neutral-800 text-neutral-600'
 }`}>
 Haz clic en"Probar Prompt" a la izquierda para simular el resultado de generación del Redactor AI basado en tus directrices actuales.
 </div>
 )}
 </div>

 <div className={`text-[10px] font-sans mt-4 leading-normal text-right ${textMuted}`}>
 Módulo de Modelado AI de Bakandeya Systems v2.4. Powered by Gemini.
 </div>
 </div>
 </div>
 </>
 );
 })()}

 </div>

 {/* ADVANCED NEGOTIATION SIMULATOR MODAL */}
 {isSimulatingAvanzado && selectedLead && (
 <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
 <div className={`w-full max-w-2xl rounded-xl shadow-2xl p-6 relative flex flex-col gap-4 animate-in zoom-in-95 duration-200 select-none ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#181818] text-neutral-200'
 }`}>
 {/* Header */}
 <div className="flex justify-between items-start dark:-neutral-800 pb-3">
 <div>
 <div className="flex items-center gap-2">
 <Sparkles className="w-5 h-5 text-[#d1b375]/80 animate-pulse" />
 <h3 className="text-sm font-bold font-display uppercase tracking-widest">
 Simulador de Negociación Personalizado
 </h3>
 </div>
 <p className={`text-[10px] font-sans mt-0.5 ${textMuted}`}>
 Trato actual con <strong className="text-[#d1b375]/80 dark:text-[#f2ca50]">{selectedLead.nombre_sala}</strong> ({selectedLead.ciudad}) — Estado: {selectedLead.estado}
 </p>
 </div>
 <button 
 type="button" 
 onClick={() => setIsSimulatingAvanzado(false)}
 className={`p-1 rounded-full transition-colors cursor-pointer hover:bg-neutral-800/10 dark:hover:bg-neutral-800 ${textSub}`}
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Content Body */}
 <div className="space-y-4 select-text">
 {/* Role selector buttons */}
 <div className="space-y-1.5">
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>¿Quién emite la respuesta simulada?</label>
 <div className="grid grid-cols-2 gap-2">
 <button
 type="button"
 onClick={() => handleRoleChange('sala')}
 className={`py-2 px-3 rounded-lg font-sans font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
 simulationRole === 'sala'
 ? isStitchLight
 ? 'bg-[#d1b375]/15 hover:bg-[#d1b375]/15 text-white shadow-sm'
 : 'bg-[#f2ca50] hover:bg-[#ffe28d] text-[#3c2f00]'
 : isStitchLight
 ? 'bg-slate-50 hover:bg-slate-100 text-slate-500'
 : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400'
 }`}
 >
 <Building className="w-4 h-4" /> Sala o Festival (Entrante)
 </button>
 <button
 type="button"
 onClick={() => handleRoleChange('banda')}
 className={`py-2 px-3 rounded-lg font-sans font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
 simulationRole === 'banda'
 ? isStitchLight
 ? 'bg-sky-500/15 hover:bg-sky-500/15 text-white shadow-sm'
 : 'bg-sky-500/15 hover:bg-sky-500/15 text-white'
 : isStitchLight
 ? 'bg-slate-50 hover:bg-slate-100 text-slate-500'
 : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400'
 }`}
 >
 <Users className="w-4 h-4" /> Banda Bakandeya (Saliente)
 </button>
 </div>
 </div>

 {/* Scenario selector */}
 <div className="space-y-1.5">
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>Instrucciones de Situación / Pauta Inicial</label>
 <select
 value={simulationScenario}
 onChange={(e) => handleScenarioChange(e.target.value)}
 className={`w-full rounded-lg px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight ? 'bg-white text-slate-800 focus:-indigo-500' : 'bg-[#1c1b1b] text-[#e5e2e1] focus:-[#f2ca50]'
 }`}
 >
 {(simulationRole === 'sala' ? PREDEFINED_SCENARIOS.sala : PREDEFINED_SCENARIOS.banda).map((sc) => (
 <option key={sc.key} value={sc.key}>{sc.label}</option>
 ))}
 </select>
 </div>

 {/* Sender Name & Subject */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>Nombre del Emisor</label>
 <input
 type="text"
 value={simulationSenderName}
 onChange={(e) => setSimulationSenderName(e.target.value)}
 placeholder="Ej. Kike (Sala Hebe) o Bakandeya Agent Manager IA"
 className={`w-full rounded-lg px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight ? 'bg-white text-slate-800 focus:-indigo-500' : 'bg-[#1c1b1b] text-[#e5e2e1] focus:-[#f2ca50]'
 }`}
 />
 </div>
 <div className="space-y-1.5">
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>Asunto del Correo</label>
 <input
 type="text"
 value={simulationSubject}
 onChange={(e) => setSimulationSubject(e.target.value)}
 placeholder="Ej. Re: Propuesta..."
 className={`w-full rounded-lg px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight ? 'bg-white text-slate-800 focus:-indigo-500' : 'bg-[#1c1b1b] text-[#e5e2e1] focus:-[#f2ca50]'
 }`}
 />
 </div>
 </div>

 {/* Simulation Instructions Prompt Area */}
 <div className="space-y-1.5">
 <div className="flex justify-between items-center">
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>Instrucciones Detalladas de Negociación para la IA</label>
 <span className={`text-[10px] font-sans ${textMuted}`}>Cualquier cambio aquí personalizará el correo</span>
 </div>
 <textarea
 rows={3}
 value={simulationCustomInstruction}
 onChange={(e) => setSimulationCustomInstruction(e.target.value)}
 placeholder="Define pautas específicas (ej. propone taquilla 60/40, exige rider técnico especial, etc.)..."
 className={`w-full rounded-lg p-2.5 text-[10px] focus:outline-none font-sans leading-relaxed ${
 isStitchLight ? 'bg-white text-slate-800 focus:-indigo-500' : 'bg-[#1c1b1b] text-[#e5e2e1] focus:-[#f2ca50]'
 }`}
 />
 </div>

 {/* Generate Button */}
 <div className="flex justify-center pt-1">
 <button
 type="button"
 onClick={handleGenerateSimulationEmail}
 disabled={isGeneratingSimulation || !simulationCustomInstruction}
 className={`w-full py-2.5 rounded-lg font-sans font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-40 ${
 isStitchLight
 ? 'bg-sky-500/15 hover:bg-sky-500/15 text-white shadow-md'
 : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-extrabold shadow-lg'
 }`}
 >
 {isGeneratingSimulation ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" /> Generando Correo de Simulación...
 </>
 ) : (
 <>
 <Sparkles className="w-4 h-4" /> Generar Correo con Gemini AI
 </>
 )}
 </button>
 </div>

 {/* Output Preview Area */}
 {(simulationGenerated || simulationMessage) && (
 <div className="space-y-2 dark:-neutral-800 pt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="flex justify-between items-center">
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'}`}>
 ✨ Vista Previa del Correo Generado (Editable)
 </label>
 <span className={`text-[10px] font-sans uppercase bg-[#10b981]/15 text-[#10b981]/80 px-2 py-1 rounded/20`}>
 Listo para Ajustar
 </span>
 </div>
 <textarea
 rows={6}
 value={simulationMessage}
 onChange={(e) => setSimulationMessage(e.target.value)}
 className={`w-full rounded-lg p-3 text-[10px] focus:outline-none font-sans leading-relaxed ${
 isStitchLight ? 'bg-sky-500/15 text-slate-800' : 'bg-neutral-900 text-neutral-200'
 }`}
 />
 <p className={`text-[10px] font-sans ${textMuted} leading-tight`}>
 💡 Tip: Puedes retocar el texto directamente para añadir detalles personalizados específicos antes de confirmarlo.
 </p>
 </div>
 )}
 </div>

 {/* Footer Buttons */}
 <div className="flex justify-end gap-3.5 dark:-neutral-800 pt-3 mt-1">
 <button
 type="button"
 onClick={() => setIsSimulatingAvanzado(false)}
 className={`px-2 py-1 rounded-lg font-sans text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
 isStitchLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400'
 }`}
 >
 Cancelar
 </button>
 <button
 type="button"
 onClick={handleCommitSimulation}
 disabled={!simulationMessage || isGeneratingSimulation}
 className={`px-2 py-1 rounded-lg font-sans font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow active:scale-[0.98] disabled:opacity-40 transition-all ${
 isStitchLight
 ? 'bg-sky-500/15 hover:bg-sky-500/15 text-white'
 : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-extrabold'
 }`}
 >
 <Check className="w-4 h-4" /> Guardar y Sincronizar
 </button>
 </div>
 </div>
 </div>
 )}

 {/* ADD NEW LEAD / MEDIO MODAL */}
 {isAddingLeadModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
 <div className={`w-full max-w-lg p-5 rounded-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#18181b] text-[#e5e2e1]'
 }`}>
 <div className="flex items-center justify-between pb-3">
 <div className="flex items-center gap-2">
 {sectionTab === 'medios' ? (
 <Radio className="w-5 h-5 text-rose-400" />
 ) : (
 <Building2 className="w-5 h-5 text-[#d1b375]/80" />
 )}
 <h3 className={`text-sm font-bold font-display uppercase tracking-widest ${isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'}`}>
 {sectionTab === 'medios' ? 'Añadir Nuevo Medio de Comunicación' : 'Añadir Nueva Sala o Festival'}
 </h3>
 </div>
 <button
 onClick={() => setIsAddingLeadModalOpen(false)}
 className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleAddNewLeadSubmit} className="space-y-3.5">
 <div>
 <div className="flex justify-between items-center mb-1">
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>
 {sectionTab === 'medios' ? 'Nombre del Medio / Emisora / Revista *' : 'Nombre de la Sala / Festival *'}
 </label>
 <button
 type="button"
 onClick={handleModalScrape}
 disabled={isModalScraping || !newLeadData.nombre_sala}
 className={`px-2 py-1 text-[10px] font-sans rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
 isStitchLight
 ? 'bg-[#d1b375]/15 hover:bg-[#d1b375]/15 text-[#d1b375] disabled:opacity-50'
 : 'bg-[#f2ca50]/10 hover:bg-[#f2ca50]/20 text-[#f2ca50] disabled:opacity-50'
 }`}
 title="Buscar automáticamente email, teléfono y ubicación con el Agente Scout IA"
 >
 {isModalScraping ? (
 <Loader2 className="w-3 h-3 animate-spin text-[#d1b375]/80" />
 ) : (
 <Sparkles className="w-3 h-3 text-[#d1b375]/80 dark:text-[#f2ca50]" />
 )}
 <span>{isModalScraping ? 'Buscando datos...' : '✨ Autocompletar con IA Scout'}</span>
 </button>
 </div>
 <input
 type="text"
 required
 placeholder={sectionTab === 'medios' ? 'Ej. Radio 3, Mondosonoro, MariskalRock' : 'Ej. Sala El Sol, Festival Cabo de Plata'}
 value={newLeadData.nombre_sala}
 onChange={(e) => setNewLeadData(prev => ({ ...prev, nombre_sala: e.target.value }))}
 className={`w-full rounded-xl px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight ? 'bg-slate-50 text-slate-800 focus:-indigo-500' : 'bg-[#121215] text-[#e5e2e1] focus:-[#f2ca50]'
 }`}
 />
 </div>

 {/* Modal Scraping Progress / Banner */}
 {isModalScraping && (
 <div className={`p-2.5 rounded-lg text-[10px] font-sans flex items-center gap-2 animate-pulse ${
 isStitchLight ? 'bg-[#d1b375]/15 text-[#d1b375]' : 'bg-[#1f1a10]/30 text-[#d1b375]'
 }`}>
 <Loader2 className="w-4 h-4 animate-spin text-[#d1b375]/80 shrink-0" />
 <span className="text-[10px] font-bold">{modalScrapeStatus}</span>
 </div>
 )}

 {modalScrapeError && (
 <div className="p-2.5 rounded-lg text-[10px] font-sans text-rose-400 bg-rose-500/15 dark:bg-rose-500/15 dark:-rose-800/50 dark:text-rose-400">
 ⚠️ {modalScrapeError}
 </div>
 )}

 {modalScrapeSuccessMsg && (
 <div className="p-2.5 rounded-lg text-[10px] font-sans text-[#10b981] bg-[#10b981]/15 dark:bg-[#10b981]/15 dark:-emerald-800/50 dark:text-[#10b981]">
 {modalScrapeSuccessMsg}
 </div>
 )}

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>Ciudad</label>
 <input
 type="text"
 placeholder="Ej. Madrid, Barcelona"
 value={newLeadData.ciudad}
 onChange={(e) => setNewLeadData(prev => ({ ...prev, ciudad: e.target.value }))}
 className={`w-full rounded-xl px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight ? 'bg-slate-50 text-slate-800 focus:-indigo-500' : 'bg-[#121215] text-[#e5e2e1] focus:-[#f2ca50]'
 }`}
 />
 </div>
 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>Región / Alcance</label>
 <input
 type="text"
 placeholder="Ej. Nacional, Cataluña, Andalucía"
 value={newLeadData.region}
 onChange={(e) => setNewLeadData(prev => ({ ...prev, region: e.target.value }))}
 className={`w-full rounded-xl px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight ? 'bg-slate-50 text-slate-800 focus:-indigo-500' : 'bg-[#121215] text-[#e5e2e1] focus:-[#f2ca50]'
 }`}
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>Correo de Contacto (Opcional)</label>
 <input
 type="email"
 placeholder="contacto@medio.com (o deja en blanco para IA)"
 value={newLeadData.email_contacto}
 onChange={(e) => setNewLeadData(prev => ({ ...prev, email_contacto: e.target.value }))}
 className={`w-full rounded-xl px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight ? 'bg-slate-50 text-slate-800 focus:-indigo-500' : 'bg-[#121215] text-[#e5e2e1] focus:-[#f2ca50]'
 }`}
 />
 </div>

 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>
 {sectionTab === 'medios' ? 'Tipo de Medio' : 'Tipo de Espacio'}
 </label>
 {sectionTab === 'medios' ? (
 <select
 value={newLeadData.genero}
 onChange={(e) => setNewLeadData(prev => ({ ...prev, genero: e.target.value }))}
 className={`w-full rounded-xl px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight ? 'bg-slate-50 text-slate-800 focus:-indigo-500' : 'bg-[#121215] text-[#e5e2e1] focus:-[#f2ca50]'
 }`}
 >
 <option value="Radio">Radio / Programa</option>
 <option value="Prensa Escrita">Prensa Escrita / Revista</option>
 <option value="Web / Blog">Portal Web / Blog Musical</option>
 <option value="Podcast">Podcast / Entrevistas</option>
 <option value="TV / Vídeo">Televisión / Vídeo</option>
 </select>
 ) : (
 <select
 value={newLeadData.tipo}
 onChange={(e) => setNewLeadData(prev => ({ ...prev, tipo: e.target.value as LeadType }))}
 className={`w-full rounded-xl px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight ? 'bg-slate-50 text-slate-800 focus:-indigo-500' : 'bg-[#121215] text-[#e5e2e1] focus:-[#f2ca50]'
 }`}
 >
 <option value="sala">Sala de Conciertos</option>
 <option value="festival">Festival</option>
 <option value="ayuntamiento">Ayuntamiento / Fiestas</option>
 <option value="productora">Productora / Booking</option>
 </select>
 )}
 </div>
 </div>

 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>
 {sectionTab === 'medios' ? 'Nota de Prensa / Propuesta de Presentación' : 'Propuesta de Concierto'}
 </label>
 <textarea
 rows={3}
 placeholder={sectionTab === 'medios' 
 ? 'Escribe o personaliza el texto de presentación para la redacción...'
 : 'Propuesta de fecha, condiciones de taquilla, etc.'}
 value={newLeadData.pitch_generado}
 onChange={(e) => setNewLeadData(prev => ({ ...prev, pitch_generado: e.target.value }))}
 className={`w-full rounded-xl p-3 text-[10px] focus:outline-none font-sans ${
 isStitchLight ? 'bg-slate-50 text-slate-800 focus:-indigo-500' : 'bg-[#121215] text-[#e5e2e1] focus:-[#f2ca50]'
 }`}
 />
 </div>

 <div>
 <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>Notas Internas</label>
 <input
 type="text"
 placeholder="Ej. Redactor jefe Bruno, programa nocturno, etc."
 value={newLeadData.notas}
 onChange={(e) => setNewLeadData(prev => ({ ...prev, notas: e.target.value }))}
 className={`w-full rounded-xl px-2 py-1 text-[10px] focus:outline-none font-sans ${
 isStitchLight ? 'bg-slate-50 text-slate-800 focus:-indigo-500' : 'bg-[#121215] text-[#e5e2e1] focus:-[#f2ca50]'
 }`}
 />
 </div>

 <div className="flex justify-end gap-3 pt-3">
 <button
 type="button"
 onClick={() => setIsAddingLeadModalOpen(false)}
 className={`px-2 py-1 rounded-xl font-sans text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
 isStitchLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400'
 }`}
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-2 py-1 rounded-xl font-sans font-bold text-[10px] uppercase tracking-wider bg-[#10b981]/15 hover:bg-[#10b981]/15 text-white cursor-pointer shadow-md transition-all active:scale-95"
 >
 {sectionTab === 'medios' ? 'Guardar Medio' : 'Guardar Sala'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 </div>
 );
}
