import React, { useState, useEffect, useMemo } from 'react';
import { Lead, LeadStatus, LeadType, ThemeColors, EPKConfig, InteractionLog, SavedFilter } from '../types';
import DirectionsCard from './DirectionsCard';
import { apiFetch } from '../utils/api';
import { uploadFileToServer } from '../utils/audioStorage';
import { 
 Search, ShieldCheck, Mail, Clock, Check, X, RefreshCw, 
 MapPin, Users, Bot, MessageSquare, Edit3, Settings, Sparkles, Send, LogOut, Loader2, Building, Radio, Building2, Tent, Landmark, Disc3, Briefcase,
 PlusCircle, Newspaper, Tv, Headphones, Globe, FileText, Plus, SlidersHorizontal, Map as MapIcon, List, LayoutGrid,
 Share2, Repeat, Truck, Handshake, Music, Zap, Upload, Image as ImageIcon, Download, Phone, PhoneCall, MessageCircle, Bookmark, BookmarkCheck, Filter, Trash2, History, Calendar, ListFilter, CheckCircle2, Save
} from 'lucide-react';
import { initAuth, googleSignIn, logout, fetchGmailThreadsForEmail } from '../utils/gmail';
import { VenueMap } from './VenueMap';
import { AddLeadModal } from './booking/AddLeadModal';
import { TemplateConfigSection } from './booking/TemplateConfigSection';
import { NegotiationSimulationModal } from './booking/NegotiationSimulationModal';

export type TemplateCategory = 'salas' | 'festivales' | 'discotecas' | 'medios' | 'grupos' | 'managements';

interface BookingCRMProps {
 leads: Lead[];
 colors: ThemeColors;
 onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
 onAddLead?: (lead: Lead) => void;
 initialSection?: 'salas' | 'medios' | 'grupos';
 initialStatusFilter?: LeadStatus | 'todos';
 initialSelectedLeadId?: string;
 epkConfig?: Partial<EPKConfig>;
 onUpdateEpkConfig?: (newConfig: Partial<EPKConfig>) => void;
}

import { 
  normalizeStatus, 
  normalizeType, 
  autoDetectVenueAddress, 
  VENUE_ADDRESS_DATABASE 
} from '../utils/bookingUtils';

export { 
  normalizeStatus, 
  normalizeType, 
  autoDetectVenueAddress, 
  VENUE_ADDRESS_DATABASE 
};

export default function BookingCRM({ 
 leads, 
 colors, 
 onUpdateLead, 
 onAddLead, 
 initialSection = 'salas',
 initialStatusFilter = 'todos',
 initialSelectedLeadId,
 epkConfig,
 onUpdateEpkConfig
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
 const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map'>('grid');
 const [selectedCityFilter, setSelectedCityFilter] = useState<string>('');
 
 // Custom City Chips state (persisted per band/user session)
 const [customCityChips, setCustomCityChips] = useState<string[]>(() => {
   if (epkConfig?.ciudadesConfig && Array.isArray(epkConfig.ciudadesConfig) && epkConfig.ciudadesConfig.length > 0) {
     return epkConfig.ciudadesConfig;
   }
   try {
     const saved = localStorage.getItem('bakandeya_custom_cities');
     return saved ? JSON.parse(saved) : ['Madrid', 'Sevilla', 'Barcelona', 'Málaga', 'Valencia', 'Granada', 'Cádiz'];
   } catch {
     return ['Madrid', 'Sevilla', 'Barcelona', 'Málaga', 'Valencia', 'Granada', 'Cádiz'];
   }
 });

 useEffect(() => {
   if (epkConfig?.ciudadesConfig && Array.isArray(epkConfig.ciudadesConfig) && epkConfig.ciudadesConfig.length > 0) {
     setCustomCityChips(epkConfig.ciudadesConfig);
   }
 }, [epkConfig?.ciudadesConfig]);
 const [isAddingCityChip, setIsAddingCityChip] = useState(false);
 const [newCityInput, setNewCityInput] = useState('');

  // --- SAVED FILTERS & QUICK SEARCH PRESETS STATE ---
  const DEFAULT_PRESET_FILTERS: SavedFilter[] = [
    {
      id: 'preset-bcn-300',
      nombre: 'Salas Cataluña / BCN (Aforo > 300) pendientes',
      sectionTab: 'salas',
      selectedCityFilter: 'Barcelona',
      statusFilter: 'nuevo',
      minCapacityFilter: 300
    },
    {
      id: 'preset-festivales-pendientes',
      nombre: 'Festivales pendientes de respuesta',
      sectionTab: 'salas',
      typeFilter: 'festival',
      statusFilter: 'esperando_respuesta'
    },
    {
      id: 'preset-prensa-madrid',
      nombre: 'Medios y prensa en Madrid',
      sectionTab: 'medios',
      selectedCityFilter: 'Madrid',
      typeFilter: 'medio'
    },
    {
      id: 'preset-interesados-negociando',
      nombre: 'Salas interesadas / Negociando',
      sectionTab: 'salas',
      statusFilter: 'interesado'
    }
  ];

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    try {
      const saved = localStorage.getItem('bakandeya_saved_crm_filters');
      return saved ? JSON.parse(saved) : DEFAULT_PRESET_FILTERS;
    } catch {
      return DEFAULT_PRESET_FILTERS;
    }
  });

  const [minCapacityFilter, setMinCapacityFilter] = useState<number>(0);
  const [isSavingFilterOpen, setIsSavingFilterOpen] = useState<boolean>(false);
  const [newFilterName, setNewFilterName] = useState<string>('');
  const [activeSavedFilterId, setActiveSavedFilterId] = useState<string | null>(null);

  // --- BITÁCORA DE CONTACTO (LLAMADAS & WHATSAPP) STATE ---
  const [interactionType, setInteractionType] = useState<'Llamada' | 'WhatsApp' | 'Email' | 'Reunión' | 'Otro'>('Llamada');
  const [interactionNotes, setInteractionNotes] = useState<string>('');
  const [interactionResultado, setInteractionResultado] = useState<'Interesado' | 'Enviar propuesta' | 'Seguimiento pendiente' | 'Rechazado' | 'Info recibida' | 'Acuerdo cerrado'>('Seguimiento pendiente');
  const [interactionAutor, setInteractionAutor] = useState<string>('Diego / Filgue');

  const handleApplySavedFilter = (sf: SavedFilter) => {
    setActiveSavedFilterId(sf.id);
    if (sf.sectionTab) setSectionTab(sf.sectionTab);
    setSearchTerm(sf.searchTerm || '');
    setSelectedCityFilter(sf.selectedCityFilter || '');
    setStatusFilter(sf.statusFilter || 'todos');
    setTypeFilter(sf.typeFilter || 'todos');
    setMinCapacityFilter(sf.minCapacityFilter || 0);
  };

  const handleSaveCurrentFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilterName.trim()) return;

    const newSf: SavedFilter = {
      id: `filter-${Date.now()}`,
      nombre: newFilterName.trim(),
      sectionTab,
      searchTerm,
      selectedCityFilter,
      statusFilter,
      typeFilter,
      minCapacityFilter
    };

    const updated = [newSf, ...savedFilters];
    setSavedFilters(updated);
    try {
      localStorage.setItem('bakandeya_saved_crm_filters', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setActiveSavedFilterId(newSf.id);
    setNewFilterName('');
    setIsSavingFilterOpen(false);
  };

  const handleDeleteSavedFilter = (filterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updated);
    try {
      localStorage.setItem('bakandeya_saved_crm_filters', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    if (activeSavedFilterId === filterId) {
      setActiveSavedFilterId(null);
    }
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setSelectedCityFilter('');
    setStatusFilter('todos');
    setTypeFilter('todos');
    setMinCapacityFilter(0);
    setActiveSavedFilterId(null);
  };

  const handleAddInteractionLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !interactionNotes.trim()) return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newLog: InteractionLog = {
      id: `log-${Date.now()}`,
      fecha: nowStr,
      tipo: interactionType,
      autor: interactionAutor,
      notas: interactionNotes.trim(),
      resultado: interactionResultado
    };

    const existingLogs = selectedLead.historial_contacto || [];
    const updatedLogs = [newLog, ...existingLogs];

    let newStatus = selectedLead.estado;
    if (interactionResultado === 'Interesado' && selectedLead.estado !== 'interesado') {
      newStatus = 'interesado';
    } else if (interactionResultado === 'Acuerdo cerrado' && selectedLead.estado !== 'negociando') {
      newStatus = 'negociando';
    } else if (interactionResultado === 'Rechazado' && selectedLead.estado !== 'no_interesado') {
      newStatus = 'no_interesado';
    }

    onUpdateLead(selectedLead.id, {
      historial_contacto: updatedLogs,
      estado: newStatus,
      fecha_ultima_respuesta: new Date().toISOString().slice(0, 10)
    });

    setSelectedLead(prev => prev ? {
      ...prev,
      historial_contacto: updatedLogs,
      estado: newStatus,
      fecha_ultima_respuesta: new Date().toISOString().slice(0, 10)
    } : null);

    setInteractionNotes('');
  };

  const handleDeleteInteractionLog = (logId: string) => {
    if (!selectedLead || !selectedLead.historial_contacto) return;
    const updated = selectedLead.historial_contacto.filter(l => l.id !== logId);
    onUpdateLead(selectedLead.id, { historial_contacto: updated });
    setSelectedLead(prev => prev ? { ...prev, historial_contacto: updated } : null);
  };

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
 if (onUpdateEpkConfig) {
 onUpdateEpkConfig({ ciudadesConfig: updated });
 }
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
 if (onUpdateEpkConfig) {
 onUpdateEpkConfig({ ciudadesConfig: updated });
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
 pitch_generado: '',
 icono: '📻',
 imagen_url: ''
 });

 const [isUploadingLeadLogo, setIsUploadingLeadLogo] = useState(false);

 const handleLeadLogoUpload = async (file: File, isEdit: boolean) => {
 try {
 setIsUploadingLeadLogo(true);
 const url = await uploadFileToServer(file, { bandId: 'bakandeya', category: 'leads' });
 if (url) {
 if (isEdit) {
 setEditedLeadInfo(prev => ({ ...prev, imagen_url: url }));
 } else {
 setNewLeadData(prev => ({ ...prev, imagen_url: url }));
 }
 }
 } catch (err) {
 console.error('Error uploading lead logo:', err);
 alert('Error al subir la imagen del logo a Supabase');
 } finally {
 setIsUploadingLeadLogo(false);
 }
 };

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
  const matchesCapacity = !minCapacityFilter || (lead.aforo >= minCapacityFilter);
  return matchesSearch && matchesStatus && matchesType && matchesCity && matchesCapacity;
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
 const imgVal = getVal(resData.data.imagen_url);
 const iconVal = getVal(resData.data.icono);

 setNewLeadData(prev => ({
 ...prev,
 email_contacto: emailVal || prev.email_contacto,
 telefono: telVal || prev.telefono,
 website: webVal || prev.website,
 region: regionVal || prev.region,
 aforo: (aforoVal && !isNaN(Number(aforoVal))) ? Number(aforoVal) : prev.aforo,
 genero: generoVal || prev.genero,
 imagen_url: imgVal || prev.imagen_url,
 icono: iconVal || prev.icono,
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
 const imgVal = getVal(scrapedDataForLead.imagen_url);
 const iconVal = getVal(scrapedDataForLead.icono);

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
 imagen_url: imgVal || selectedLead.imagen_url,
 icono: iconVal || selectedLead.icono,
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
 icono: newLeadData.icono || (sectionTab === 'medios' ? '📻' : '🏛️'),
 imagen_url: newLeadData.imagen_url || '',
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
 <button
 id="export-approved-csv-btn"
 type="button"
 onClick={() => {
 const approvedLeads = leads.filter(l => l.estado === 'aprobado');
 if (approvedLeads.length === 0) {
 alert("No hay ninguna sala o contacto en estado 'aprobado' todavía.");
 return;
 }
 const headers = ["ID", "Nombre Sala / Contacto", "Ciudad", "Región", "Aforo", "Tipo", "Email Contacto", "Fuente", "Estado", "Pitch Generado", "Notas"];
 const rows = approvedLeads.map(l => [
 `"${(l.id || '').replace(/"/g, '""')}"`,
 `"${(l.nombre_sala || '').replace(/"/g, '""')}"`,
 `"${(l.ciudad || '').replace(/"/g, '""')}"`,
 `"${(l.region || '').replace(/"/g, '""')}"`,
 l.aforo || 0,
 `"${(l.tipo || '').replace(/"/g, '""')}"`,
 `"${(l.email_contacto || '').replace(/"/g, '""')}"`,
 `"${(l.fuente || '').replace(/"/g, '""')}"`,
 `"${(l.estado || '').replace(/"/g, '""')}"`,
 `"${(l.pitch_generado || '').replace(/"/g, '""')}"`,
 `"${(l.notas || '').replace(/"/g, '""')}"`
 ]);

 const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
 const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement("a");
 link.setAttribute("href", url);
 link.setAttribute("download", `Bakandeya_Aprobados_${new Date().toISOString().slice(0, 10)}.csv`);
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 }}
 className={`flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-sans font-medium uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
 isStitchLight 
 ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300' 
 : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60'
 }`}
 title="Exportar la lista de correos y salas aprobadas a CSV/Excel"
 >
 <Download className="w-3.5 h-3.5 text-emerald-400" />
 <span>Exportar Aprobados CSV</span>
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
 <div className={`p-1 rounded-lg flex items-center gap-1.5 ${
 isStitchLight ? 'bg-slate-100 border border-slate-200' : 'bg-[#131313] border border-white/5'
 }`}>
 <button
 id="crm-view-grid"
 type="button"
 onClick={() => setViewMode('grid')}
 className={`px-2.5 py-1.5 rounded-md text-[11px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
 viewMode === 'grid'
 ? isStitchLight ? 'bg-slate-900 text-white shadow-sm' : 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow-sm'
 : isStitchLight ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white'
 }`}
 title="Vista en Tarjetas"
 >
 <LayoutGrid className="w-3.5 h-3.5" />
 <span>Tarjetas</span>
 </button>
 <button
 id="crm-view-table"
 type="button"
 onClick={() => setViewMode('table')}
 className={`px-2.5 py-1.5 rounded-md text-[11px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
 viewMode === 'table'
 ? isStitchLight ? 'bg-slate-900 text-white shadow-sm' : 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow-sm'
 : isStitchLight ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white'
 }`}
 title="Vista en Detalles / Tabla"
 >
 <List className="w-3.5 h-3.5" />
 <span>Detalles</span>
 </button>
 <button
 id="crm-view-map"
 type="button"
 onClick={() => setViewMode('map')}
 className={`px-3 py-1.5 rounded-md text-[11px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
 viewMode === 'map'
 ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
 : isStitchLight
 ? 'bg-sky-50 text-sky-700 border border-sky-300 hover:bg-sky-100 shadow-sm'
 : 'bg-sky-500/15 text-sky-300 border border-sky-500/40 hover:bg-sky-500/25'
 }`}
 title="Vista en Mapa GPS Interactivo"
 >
 <MapIcon className={`w-3.5 h-3.5 ${viewMode === 'map' ? 'text-slate-950' : 'text-sky-400 animate-pulse'}`} />
 <span>🗺️ Ver Mapa</span>
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

 {/* 📌 FILTROS GUARDADOS & BUSQUEDAS FRECUENTES BAR */}
  <div className={`p-3 rounded-xl border space-y-2 transition-all ${
    isStitchLight ? "bg-slate-50 border-slate-200" : "bg-[#181716] border-neutral-800"
  }`}>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
      <div className="flex items-center gap-2">
        <Bookmark className="w-4 h-4 text-[#eab308]" />
        <span className="font-bold text-zinc-100 dark:text-zinc-200">Filtros Guardados:</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Min Capacity Filter Input */}
        <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-neutral-800 text-[11px]">
          <span className="text-neutral-400">Aforo mín:</span>
          <input
            type="number"
            placeholder="Ej: 300"
            value={minCapacityFilter || ""}
            onChange={(e) => setMinCapacityFilter(Number(e.target.value) || 0)}
            className="w-16 bg-transparent text-[#eab308] font-bold focus:outline-none"
          />
          {minCapacityFilter > 0 && (
            <button
              type="button"
              onClick={() => setMinCapacityFilter(0)}
              className="text-neutral-500 hover:text-white"
              title="Quitar filtro de aforo"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Button to save current filter */}
        {!isSavingFilterOpen ? (
          <button
            type="button"
            onClick={() => setIsSavingFilterOpen(true)}
            className="px-2.5 py-1 bg-[#eab308]/15 hover:bg-[#eab308]/25 text-[#eab308] rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all border border-[#eab308]/30 cursor-pointer"
            title="Guardar la combinación de filtros actual en 1 clic"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-[#eab308]" />
            <span>💾 Guardar búsqueda actual</span>
          </button>
        ) : (
          <form onSubmit={handleSaveCurrentFilter} className="flex items-center gap-1.5 animate-fadeIn">
            <input
              type="text"
              autoFocus
              placeholder="Nombre del filtro (ej: Salas BCN > 300)..."
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-[#eab308]/50 text-white focus:outline-none w-52 sm:w-64"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setIsSavingFilterOpen(false)}
              className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {(searchTerm || selectedCityFilter || statusFilter !== "todos" || typeFilter !== "todos" || minCapacityFilter > 0 || activeSavedFilterId) && (
          <button
            type="button"
            onClick={handleClearAllFilters}
            className="px-2 py-1 text-[11px] text-zinc-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
            title="Restablecer todos los filtros"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Limpiar</span>
          </button>
        )}
      </div>
    </div>

    {/* Pills list of Saved Filters */}
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
      {savedFilters.map((sf) => {
        const isActive = activeSavedFilterId === sf.id;
        return (
          <div
            key={sf.id}
            className={`group relative shrink-0 flex items-center rounded-full border transition-all cursor-pointer ${
              isActive
                ? "bg-[#eab308]/20 border-[#eab308] text-[#eab308] font-bold shadow-xs"
                : "bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-neutral-300"
            }`}
          >
            <button
              type="button"
              onClick={() => handleApplySavedFilter(sf)}
              className="px-3 py-1 text-[11px] font-sans flex items-center gap-1.5"
            >
              <span>📌 {sf.nombre}</span>
              {sf.minCapacityFilter ? (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#eab308]/30 text-amber-200">
                  &gt;{sf.minCapacityFilter}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={(e) => handleDeleteSavedFilter(sf.id, e)}
              className="pr-2 text-neutral-500 hover:text-rose-400 transition-colors p-0.5 rounded-full"
              title="Eliminar filtro guardado"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  </div>

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
 ) : viewMode === 'grid' ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-10">
 {filteredLeads.map(lead => {
 const isSelected = selectedLead?.id === lead.id;
 return (
 <div 
 key={lead.id}
 onClick={() => handleOpenLead(lead)}
 className={`p-4 rounded-2xl transition-all cursor-pointer flex flex-col justify-between gap-3 ${ isSelected ? 'bg-[#1A1918] border border-[#f2ca50]/50 shadow-md' : 'bg-[#121110] border border-zinc-800/70 hover:bg-[#1A1918] hover:border-zinc-700' }`}
 >
 <div className="flex items-start gap-3 min-w-0 w-full">
 {lead.imagen_url ? (
 <img src={lead.imagen_url} alt={lead.nombre_sala} className="w-11 h-11 rounded-xl object-cover border border-[#f2ca50]/50 shrink-0 shadow-sm" />
 ) : (
 <div className="w-11 h-11 rounded-xl bg-[#2A2928] border border-zinc-700/60 flex items-center justify-center shrink-0 text-xl shadow-inner">
 {lead.icono || (normalizeType(lead.tipo) === 'medio' ? '📻' : normalizeType(lead.tipo) === 'festival' ? '🎪' : normalizeType(lead.tipo) === 'discoteca' ? '🪩' : '🏛️')}
 </div>
 )}
 <div className="flex flex-col min-w-0 flex-1">
 <div className="flex items-center justify-between gap-2">
 <span className="font-display font-bold text-sm tracking-wide text-zinc-100 truncate flex-1 min-w-0">{lead.nombre_sala}</span>
 <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-sans font-medium shrink-0 ${getStatusBadgeClass(lead.estado)}`}>
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
 
 <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/60 text-[11px] font-sans text-[#9a9591] w-full mt-1">
 <div className="flex items-center gap-1">
 <span className="text-[#f2ca50]">★</span> 4.2 <span className="text-zinc-600">(120)</span>
 </div>
 <button
 onClick={(e) => {
 e.stopPropagation();
 handleOpenLead(lead);
 }}
 className={`px-3 py-1 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer ${ isSelected ? 'bg-[#f2ca50] text-[#3c2f00] font-bold' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700' }`}
 >
 Intervenir
 </button>
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-[#121110] shadow-lg pb-10">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-400 bg-black/40">
 <th className="py-3 px-4">Espacio / Sala</th>
 <th className="py-3 px-4">Ciudad</th>
 <th className="py-3 px-4">Aforo</th>
 <th className="py-3 px-4">Género</th>
 <th className="py-3 px-4">Estado</th>
 <th className="py-3 px-4">Contacto / Email</th>
 <th className="py-3 px-4 text-right">Acción</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-800/60 text-xs font-mono">
 {filteredLeads.map(lead => {
 const isSelected = selectedLead?.id === lead.id;
 return (
 <tr
 key={lead.id}
 onClick={() => handleOpenLead(lead)}
 className={`transition-colors cursor-pointer ${isSelected ? 'bg-[#1A1918]' : 'hover:bg-zinc-900/60'}`}
 >
 <td className="py-3 px-4 font-bold text-zinc-100 flex items-center gap-2">
 {lead.imagen_url ? (
 <img src={lead.imagen_url} alt={lead.nombre_sala} className="w-6 h-6 rounded-md object-cover border border-[#f2ca50]/50 shrink-0" />
 ) : (
 <span className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-xs shrink-0">
 {lead.icono || (normalizeType(lead.tipo) === 'medio' ? '📻' : normalizeType(lead.tipo) === 'festival' ? '🎪' : normalizeType(lead.tipo) === 'discoteca' ? '🪩' : '🏛️')}
 </span>
 )}
 <span className="truncate">{lead.nombre_sala}</span>
 </td>
 <td className="py-3 px-4 text-zinc-300">{lead.ciudad || '-'}</td>
 <td className="py-3 px-4 text-zinc-300">{lead.aforo || '-'}</td>
 <td className="py-3 px-4 text-zinc-300">{lead.genero || '-'}</td>
 <td className="py-3 px-4">
 <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-mono ${getStatusBadgeClass(lead.estado)}`}>
 {getStatusLabel(lead.estado)}
 </span>
 </td>
 <td className="py-3 px-4 text-zinc-400 truncate max-w-[180px]">{lead.email_contacto || '-'}</td>
 <td className="py-3 px-4 text-right">
 <button
 type="button"
 onClick={(e) => { e.stopPropagation(); handleOpenLead(lead); }}
 className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
 isSelected ? 'bg-[#f2ca50] text-[#3c2f00]' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
 }`}
 >
 Ver
 </button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
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
 <div className="flex items-center gap-3">
 {selectedLead.imagen_url ? (
 <img src={selectedLead.imagen_url} alt={selectedLead.nombre_sala} className="w-14 h-14 rounded-2xl object-cover border-2 border-[#f2ca50] shrink-0 shadow-md" />
 ) : (
 <div className="w-14 h-14 rounded-2xl bg-[#2A2928] border border-zinc-700 flex items-center justify-center shrink-0 text-3xl shadow-inner">
 {selectedLead.icono || (normalizeType(selectedLead.tipo) === 'medio' ? '📻' : normalizeType(selectedLead.tipo) === 'festival' ? '🎪' : normalizeType(selectedLead.tipo) === 'discoteca' ? '🪩' : '🏛️')}
 </div>
 )}
 <div>
 <h3 className="text-2xl font-bold font-display tracking-tight text-zinc-50">{selectedLead.nombre_sala}</h3>
 <p className="text-[13px] font-sans mt-1 text-[#9a9591]">{selectedLead.ciudad} • {selectedLead.genero || 'Variado'} • {selectedLead.aforo || '?'} pax</p>
 </div>
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
 
 <div className="pt-2 flex justify-center">
 <DirectionsCard 
 query={selectedLead.direccion || `${selectedLead.nombre_sala}, ${selectedLead.ciudad}`} 
 locationName={selectedLead.nombre_sala} 
 address={selectedLead.direccion || selectedLead.ciudad} 
 isStitchLight={colors.name === 'stitch_light'} 
 />
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

 {/* Icono & Imagen / Logo Selector */}
 <div className="p-3 rounded-xl border border-zinc-800 space-y-2.5 bg-black/40">
 <div className="flex items-center justify-between">
 <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>
 Icono o Logo del Medio / Sala
 </label>
 <label className="cursor-pointer px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] rounded-lg flex items-center gap-1.5 font-bold transition-all border border-zinc-700">
 <Upload className="w-3 h-3 text-[#f2ca50]" />
 <span>{isUploadingLeadLogo ? 'Subiendo...' : 'Subir Logo Supabase'}</span>
 <input 
 type="file" 
 accept="image/*" 
 className="hidden" 
 onChange={(e) => {
 if (e.target.files && e.target.files[0]) {
 handleLeadLogoUpload(e.target.files[0], true);
 }
 }}
 disabled={isUploadingLeadLogo}
 />
 </label>
 </div>

 {editedLeadInfo.imagen_url ? (
 <div className="flex items-center gap-3 p-2 bg-zinc-950 rounded-lg border border-zinc-800">
 <img src={editedLeadInfo.imagen_url} alt="Logo" className="w-10 h-10 rounded-lg object-cover border border-[#f2ca50]/50 shrink-0" />
 <div className="flex-1 min-w-0">
 <p className="text-[10px] text-zinc-300 font-bold truncate">{editedLeadInfo.imagen_url}</p>
 <p className="text-[9px] text-zinc-500">Logo subido a Supabase</p>
 </div>
 <button
 type="button"
 onClick={() => setEditedLeadInfo(prev => ({ ...prev, imagen_url: '' }))}
 className="text-[10px] text-rose-400 hover:underline px-2 py-1 cursor-pointer"
 >
 Quitar
 </button>
 </div>
 ) : (
 <div className="space-y-1.5">
 <p className="text-[9px] text-zinc-400">Selecciona un emoji característico:</p>
 <div className="flex flex-wrap gap-1.5">
 {['📻', '📰', '🌐', '🎙️', '📺', '🏛️', '🎪', '🪩', '🎸', '💼', '🎆', '⚡', '🔥'].map(emoji => (
 <button
 key={emoji}
 type="button"
 onClick={() => setEditedLeadInfo(prev => ({ ...prev, icono: emoji }))}
 className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
 editedLeadInfo.icono === emoji 
 ? 'bg-[#f2ca50] text-[#3c2f00] font-bold scale-110 shadow-md border border-[#f2ca50]' 
 : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
 }`}
 >
 {emoji}
 </button>
 ))}
 </div>
 </div>
 )}
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
  {/* Quick WhatsApp & Call Direct Actions Bar */}
  {selectedLead.telefono && (
    <div className="flex gap-2 pt-1.5">
      <a
        href={`https://wa.me/${selectedLead.telefono.replace(/\D/g, "")}`}
        target="_blank"
        rel="noreferrer"
        className="flex-1 py-2 px-3 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
      >
        <MessageCircle className="w-4 h-4 text-emerald-400" />
        <span>WhatsApp Directo</span>
      </a>
      <a
        href={`tel:${selectedLead.telefono}`}
        className="flex-1 py-2 px-3 bg-sky-950/80 hover:bg-sky-900 border border-sky-700/60 text-sky-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
      >
        <PhoneCall className="w-4 h-4 text-sky-400" />
        <span>Llamar</span>
      </a>
    </div>
  )}

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
  {/* 📋 BITÁCORA RÁPIDA DE CONTACTO (Llamadas, WhatsApp, Notas) */}
  <div className="bg-[#1A1918] rounded-xl p-4 space-y-3.5 border border-[#eab308]/20 mt-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-[#eab308]" />
        <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-sans">
          Bitácora de Contacto y Llamadas
        </h4>
      </div>
      <span className="text-[10px] text-[#eab308]/80 font-mono">
        {(selectedLead.historial_contacto || []).length} registros
      </span>
    </div>

    {/* Log Form */}
    <form onSubmit={handleAddInteractionLog} className="space-y-3 bg-[#121110] p-3 rounded-lg border border-neutral-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Interaction Type Selector */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-neutral-800">
          {(["Llamada", "WhatsApp", "Email", "Reunión", "Otro"] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setInteractionType(type)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                interactionType === type
                  ? "bg-[#eab308] text-black font-bold shadow-xs"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {type === "Llamada" ? "📞" : type === "WhatsApp" ? "💬" : type === "Email" ? "✉️" : type === "Reunión" ? "🤝" : "📝"} {type}
            </button>
          ))}
        </div>

        {/* Author input */}
        <input
          type="text"
          value={interactionAutor}
          onChange={(e) => setInteractionAutor(e.target.value)}
          placeholder="Tu nombre..."
          className="px-2 py-1 text-[10px] bg-zinc-900 border border-neutral-800 rounded text-neutral-300 w-28 focus:outline-none"
        />
      </div>

      {/* Result Outcome Pills */}
      <div className="space-y-1">
        <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-sans">Resultado del contacto:</span>
        <div className="flex flex-wrap gap-1">
          {(["Interesado", "Enviar propuesta", "Seguimiento pendiente", "Acuerdo cerrado", "Rechazado", "Info recibida"] as const).map(res => (
            <button
              key={res}
              type="button"
              onClick={() => setInteractionResultado(res)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                interactionResultado === res
                  ? res === "Interesado" || res === "Acuerdo cerrado"
                    ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/60 font-bold"
                    : res === "Rechazado"
                    ? "bg-rose-500/30 text-rose-300 border border-rose-500/60 font-bold"
                    : "bg-sky-500/30 text-sky-300 border border-sky-500/60 font-bold"
                  : "bg-zinc-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              {res}
            </button>
          ))}
        </div>
      </div>

      {/* Notes textarea */}
      <textarea
        rows={2}
        required
        value={interactionNotes}
        onChange={(e) => setInteractionNotes(e.target.value)}
        placeholder="Ej: Hablé con Carlos por WhatsApp. Pide propuesta de fechas para Noviembre y 70/30 en taquilla..."
        className="w-full bg-black/50 rounded-lg p-2.5 text-xs text-zinc-100 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 resize-none font-sans"
      />

      <button
        type="submit"
        className="w-full py-2 bg-[#eab308] hover:bg-[#eab308]/90 text-black font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
      >
        <Save className="w-3.5 h-3.5" />
        <span>Anotar en Bitácora</span>
      </button>
    </form>

    {/* Timeline Feed */}
    <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
      {(selectedLead.historial_contacto || []).length === 0 ? (
        <p className="text-[11px] text-neutral-500 italic text-center py-3">
          No hay llamadas ni mensajes de WhatsApp registrados aún para esta sala.
        </p>
      ) : (
        (selectedLead.historial_contacto || []).map((log) => (
          <div
            key={log.id}
            className="p-2.5 rounded-lg bg-[#121110] border border-neutral-800 space-y-1.5 text-xs font-sans relative group"
          >
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300">
                  {log.tipo === "Llamada" ? "📞 Llamada" : log.tipo === "WhatsApp" ? "💬 WhatsApp" : log.tipo === "Email" ? "✉️ Email" : log.tipo === "Reunión" ? "🤝 Reunión" : "📝 Nota"}
                </span>
                <span className="text-neutral-400">{log.autor || "Agente"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-mono">{log.fecha}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteInteractionLog(log.id)}
                  className="text-neutral-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                  title="Borrar entrada"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {log.resultado && (
              <div>
                <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded font-bold ${
                  log.resultado === "Interesado" || log.resultado === "Acuerdo cerrado"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : log.resultado === "Rechazado"
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-sky-500/20 text-sky-400"
                }`}>
                  {log.resultado}
                </span>
              </div>
            )}

            <p className="text-neutral-200 text-[11px] leading-snug whitespace-pre-wrap select-text">
              {log.notas}
            </p>
          </div>
        ))
      )}
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
 <div className={`border-2 border-dashed rounded-lg p-12 text-center text-[10px] font-sans ${
 isStitchLight
 ? 'border-slate-200 text-slate-400'
 : 'border-neutral-800 text-neutral-600'
 }`}>
 Haz clic en "Probar Prompt" a la izquierda para simular el resultado de generación del Redactor AI basado en tus directrices actuales.
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

  {/* ADD NEW LEAD / MEDIO MODAL */}
  <NegotiationSimulationModal
    isOpen={isSimulatingAvanzado}
    selectedLead={selectedLead}
    isStitchLight={isStitchLight}
    textSub={textSub}
    textMuted={textMuted}
    simulationRole={simulationRole}
    simulationScenario={simulationScenario}
    simulationSenderName={simulationSenderName}
    simulationSubject={simulationSubject}
    simulationCustomInstruction={simulationCustomInstruction}
    simulationMessage={simulationMessage}
    simulationGenerated={simulationGenerated}
    isGeneratingSimulation={isGeneratingSimulation}
    predefinedScenarios={PREDEFINED_SCENARIOS}
    onClose={() => setIsSimulatingAvanzado(false)}
    onRoleChange={handleRoleChange}
    onScenarioChange={handleScenarioChange}
    onSenderNameChange={setSimulationSenderName}
    onSubjectChange={setSimulationSubject}
    onCustomInstructionChange={setSimulationCustomInstruction}
    onMessageChange={setSimulationMessage}
    onGenerate={handleGenerateSimulationEmail}
    onCommit={handleCommitSimulation}
  />

  <AddLeadModal
    isOpen={isAddingLeadModalOpen}
    sectionTab={sectionTab}
    isStitchLight={isStitchLight}
    textSub={textSub}
    newLeadData={newLeadData}
    setNewLeadData={setNewLeadData}
    isModalScraping={isModalScraping}
    modalScrapeStatus={modalScrapeStatus}
    modalScrapeError={modalScrapeError}
    modalScrapeSuccessMsg={modalScrapeSuccessMsg}
    isUploadingLeadLogo={isUploadingLeadLogo}
    onClose={() => setIsAddingLeadModalOpen(false)}
    onSubmit={handleAddNewLeadSubmit}
    onModalScrape={handleModalScrape}
    onLeadLogoUpload={(file) => handleLeadLogoUpload(file, false)}
  />

 </div>
 );
}
