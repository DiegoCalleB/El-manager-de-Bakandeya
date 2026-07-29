import React, { useState } from 'react';
import { Lead, LeadStatus, LeadType, ThemeColors } from '../types';
import { 
  Search, ShieldCheck, Mail, Clock, Check, X, RefreshCw, 
  MapPin, Users, Bot, MessageSquare, Edit3, Settings, Sparkles, Send, LogOut, Loader2, Building, Radio, Building2, Tent, Landmark, Disc3, Briefcase
} from 'lucide-react';
import { initAuth, googleSignIn, logout, fetchGmailThreadsForEmail } from '../utils/gmail';

interface BookingCRMProps {
  leads: Lead[];
  colors: ThemeColors;
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
}

export default function BookingCRM({ leads, colors, onUpdateLead }: BookingCRMProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'todos'>('todos');
  const [typeFilter, setTypeFilter] = useState<LeadType | 'todos'>('todos');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditingPitch, setIsEditingPitch] = useState(false);
  const [editedPitch, setEditedPitch] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Gmail integration states
  const [gmailUser, setGmailUser] = useState<any>(null);
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [isSyncingGmail, setIsSyncingGmail] = useState(false);
  const [gmailStatusMsg, setGmailStatusMsg] = useState('');

  // Email thread and manual dispatch states
  const [activeTab, setActiveTab] = useState<'info' | 'emails'>('info');
  const [manualEmailBody, setManualEmailBody] = useState('');
  const [manualEmailSubject, setManualEmailSubject] = useState('');
  const [manualEmailSender, setManualEmailSender] = useState('Jon (Cantante de Bakandeya)');
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
      { key: 'rider', label: 'Exigencias de Rider Técnico y horarios', defaultInstruction: 'La sala está interesada pero exige revisar detalladamente el rider de vientos, violín y sintetizadores analógicos, y pregunta por la hora de montaje de Bakandeya.' },
      { key: 'lleno', label: 'Rechazo amable por calendario lleno', defaultInstruction: 'La sala felicita a la banda por su dossier pero explica que tiene el calendario de otoño cerrado. Ofrece dejar el contacto para la gira de primavera.' },
      { key: 'contrato', label: 'Aceptación final y petición de datos fiscales', defaultInstruction: 'La sala confirma la fecha sugerida en el pitch, acepta las condiciones de la banda y solicita los datos fiscales (CIF, dirección, representante) para redactar el contrato oficial.' },
      { key: 'custom', label: 'Instrucción libre personalizada...', defaultInstruction: '' }
    ],
    banda: [
      { key: 'contrapropuesta', label: 'Contrapropuesta de fecha (Fin de semana) y co-organización', defaultInstruction: 'Larra (mánager) responde sugiriendo cambiar un concierto propuesto en miércoles a un viernes o sábado de noviembre, y sugiere compartir cartel con una banda local para asegurar aforo.' },
      { key: 'aceptacion_rider', label: 'Aceptación de condiciones y especificación de sintetizadores', defaultInstruction: 'Jon (cantante) responde aceptando el reparto de taquilla propuesto y especifica que los sintetizadores analógicos van listos en dos líneas estéreo balanceadas.' },
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
      setSimulationSenderName('Larra (Mánager de Bakandeya)');
      setSimulationScenario('contrapropuesta');
      setSimulationSubject(selectedLead?.hilo_emails && selectedLead.hilo_emails.length > 0
        ? `RE: ${selectedLead.hilo_emails[selectedLead.hilo_emails.length - 1].asunto}`
        : 'Re: Propuesta de concierto - Bakandeya');
      setSimulationCustomInstruction('Larra (mánager) responde sugiriendo cambiar un concierto propuesto en miércoles a un viernes o sábado de noviembre, y sugiere compartir cartel con una banda local para asegurar aforo.');
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
      const res = await fetch('/api/generate-simulated-email', {
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
          'Para poder conectar tu cuenta, haz clic en el botón "Abrir en pestaña nueva" ' +
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

  // Template states
  const [subjectTemplate, setSubjectTemplate] = useState('Propuesta de concierto: Bakandeya (Ska / Reggae / Mestizaje)');
  const [bodyTemplate, setBodyTemplate] = useState(`Hola equipo de booking de {{nombre_sala}},

Somos Bakandeya, banda que fusiona balkan-ska, roots reggae, violín salvaje, percusión reciclada y electrónica. Hemos visto su programación en {{ciudad}} y creemos que nuestra propuesta encaja perfecto para su público.

Disponemos de fechas abiertas para nuestra gira 2026. Les invitamos a ver nuestros directos de alta energía: https://youtube.com/bakandeya_live

Un saludo,
Jon (Cantante de Bakandeya)`);
  const [aiGuidelines, setAiGuidelines] = useState('Escribe siempre en un tono enérgico, cercano pero muy respetuoso con los programadores de salas. Enfatiza que disponemos de un potente show con violín enérgico, loops en directo y percusión reciclada, y que aseguramos llenar el aforo gracias a nuestra campaña de promo local.');
  const [testPromptResult, setTestPromptResult] = useState('');
  const [isTestingPrompt, setIsTestingPrompt] = useState(false);

  // Helper to normalize status strings from Excel or UI
  const normalizeStatus = (s: any): LeadStatus => {
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
  const normalizeType = (t: any): LeadType => {
    if (!t) return 'sala';
    const s = String(t).trim().toLowerCase();
    if (s.includes('festiv') || s === 'festival') return 'festival';
    if (s.includes('ayunt') || s.includes('fiesta') || s.includes('municip') || s === 'ayuntamiento') return 'ayuntamiento';
    if (s.includes('grup') || s.includes('artist') || s.includes('banda') || s === 'grupo') return 'grupo';
    if (s.includes('product') || s.includes('agencia') || s.includes('manag') || s === 'productora') return 'productora';
    if (s.includes('medio') || s.includes('radio') || s.includes('prensa') || s.includes('tv') || s.includes('podc') || s === 'medio') return 'medio';
    return 'sala';
  };

  const isStitchLight = colors.accent === 'text-indigo-600';

  const getTypeBadgeClass = (typeVal: any) => {
    const norm = normalizeType(typeVal);
    switch (norm) {
      case 'sala': return isStitchLight ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400';
      case 'festival': return isStitchLight ? 'bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-700' : 'bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400';
      case 'ayuntamiento': return isStitchLight ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-amber-500/10 border border-amber-500/30 text-amber-400';
      case 'grupo': return isStitchLight ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400';
      case 'productora': return isStitchLight ? 'bg-cyan-50 border border-cyan-200 text-cyan-700' : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400';
      case 'medio': return isStitchLight ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400';
      default: return isStitchLight ? 'bg-slate-50 border border-slate-200 text-slate-700' : 'bg-neutral-800 border border-neutral-700 text-neutral-300';
    }
  };

  const getTypeLabel = (typeVal: any) => {
    const norm = normalizeType(typeVal);
    switch (norm) {
      case 'sala': return '🏛️ Sala / Teatro';
      case 'festival': return '🎪 Festival';
      case 'ayuntamiento': return '🎆 Ayuntamiento / Fiestas';
      case 'grupo': return '🎸 Grupo / Artista';
      case 'productora': return '💼 Productora / Agencia';
      case 'medio': return '📻 Medio (Radio 3 / Prensa)';
      default: return '🏛️ Sala / Teatro';
    }
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nombre_sala.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.region.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || normalizeStatus(lead.estado) === statusFilter;
    const matchesType = typeFilter === 'todos' || normalizeType(lead.tipo) === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadgeClass = (status: LeadStatus | string) => {
    const norm = normalizeStatus(status);
    switch (norm) {
      case 'nuevo': return isStitchLight ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-[#ffb596]/10 border border-[#ffb596]/30 text-[#ffb596]';
      case 'pendiente_aprobacion': return isStitchLight ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 animate-pulse' : 'bg-[#f2ca50]/10 border border-[#f2ca50]/30 text-[#f2ca50] animate-pulse';
      case 'aprobado': return isStitchLight ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-[#b8d6b8]/15 border border-[#b8d6b8]/40 text-[#b8d6b8]';
      case 'esperando_respuesta': return isStitchLight ? 'bg-sky-50 border border-sky-200 text-sky-700' : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400';
      case 'interesado': return isStitchLight ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold';
      case 'negociando': return isStitchLight ? 'bg-purple-50 border border-purple-200 text-purple-700' : 'bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400';
      case 'no_interesado': return isStitchLight ? 'bg-slate-100 border border-slate-200 text-slate-500' : 'bg-neutral-800 border border-neutral-700 text-neutral-500';
      default: return isStitchLight ? 'bg-slate-50 border border-slate-200 text-slate-500' : 'bg-neutral-800 border border-neutral-700 text-neutral-400';
    }
  };

  const getStatusLabel = (status: LeadStatus | string) => {
    const norm = normalizeStatus(status);
    switch (norm) {
      case 'nuevo': return 'Por Contactar';
      case 'pendiente_aprobacion': return 'Por Aprobar';
      case 'aprobado': return 'Aprobado (Listo)';
      case 'esperando_respuesta': return 'Email Enviado';
      case 'interesado': return 'Interesado 🔥';
      case 'negociando': return 'Negociando 💬';
      case 'no_interesado': return 'No interesado';
      default: return String(status).toUpperCase();
    }
  };

  const handleOpenLead = (lead: Lead) => {
    setSelectedLead(lead);
    setEditedPitch(lead.pitch_generado || '');
    setIsEditingPitch(false);
    setIsRejecting(false);
    setRejectionNotes('');
    
    // Automatically switch to emails tab for negotiating or interested leads, else info
    setActiveTab(lead.estado === 'negociando' || lead.estado === 'interesado' ? 'emails' : 'info');
    setManualEmailBody('');
    setManualEmailSubject(lead.hilo_emails && lead.hilo_emails.length > 0 ? `RE: ${lead.hilo_emails[lead.hilo_emails.length - 1].asunto}` : 'Propuesta de concierto: Bakandeya');
    setManualEmailStatus('');
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
      simBody = '¡Buenas Larra! He estado pensando lo de la fecha doble con la banda local que propusiste. Me parece de lujo, los chavales de "Vallekas Ska" están buscando bolo para noviembre y seguro que entre los dos llenamos el Hebe. El viernes 13 de Noviembre sigue libre. ¿Cerramos ese día con un 75% de taquilla para vosotros si llegamos a las 100 entradas? Ya me dices y os paso el contrato.';
    } else if (selectedLead.id === 'lead-4' || lowercaseName.includes('viña')) {
      simSender = 'Producción Artística (Viña Rock)';
      simBody = 'Hola Larra, gracias por pasarnos los detalles. El caché de 4.500€ entra en vuestros rangos para el escenario de Mestizaje. El slot de las 18:30 del viernes está libre. Confirmadnos si vuestro rider técnico incluye los sintetizadores listos para línea balanceada o si necesitáis cajas DI adicionales del festival. ¡Cerremos trato!';
    } else if (selectedLead.id === 'lead-6' || lowercaseName.includes('razzmatazz')) {
      simSender = 'Xavi (Booking Razzmatazz)';
      simBody = 'Buenas Larra, nos parece perfecto el acuerdo de taquilla al 80/20 con un mínimo de 150 entradas garantizadas. La fecha del sábado 5 de Diciembre queda reservada para Bakandeya. Decidme a qué email enviamos el borrador del contrato de sala. ¡Un saludo!';
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
    const correctionMsg = `*** [${today}] Clasificación corregida a '${newStatus}' manualmente por Jon ***\n`;
    
    onUpdateLead(selectedLead.id, {
      estado: newStatus,
      notas: correctionMsg + (selectedLead.notas || '')
    }, selectedLead.estado);

    setSelectedLead(prev => prev ? { ...prev, estado: newStatus, notas: correctionMsg + (prev.notas || '') } : null);
  };

  const handleTestPrompt = () => {
    setIsTestingPrompt(true);
    setTestPromptResult('');
    
    // Simulate generation based on template and guideline
    setTimeout(() => {
      setTestPromptResult(`Asunto: RE: Propuesta de concierto: Bakandeya en Sala Ejemplo

Hola equipo de booking de Sala Ejemplo,

Le escribimos de parte de la banda de ska/reggae Bakandeya. Siguiendo sus pautas de directo ("${aiGuidelines.substring(0, 50)}..."), hemos adaptado nuestro directo para encajar a la perfección. Disponemos de un espectacular cuarteto con violín enérgico, loops, percusión reciclada y una electrónica demoledora en directo que asegura una fiesta inolvidable.

¿Qué os parece el viernes 23 de Octubre de 2026? Quedamos a vuestra disposición.

Salud,
Jon`);
      setIsTestingPrompt(false);
    }, 1200);
  };

  const handleSaveTemplates = () => {
    alert('¡Plantilla de Pitch y Directrices AI guardadas correctamente! Los agentes Python redactores usarán esta configuración en el próximo escaneo.');
  };

  const subCardBg = isStitchLight ? 'bg-slate-50/60 border border-slate-200/80' : 'bg-[#131313] border border-[#99907c]/15';
  const textTitle = isStitchLight ? 'text-slate-900' : 'text-neutral-100';
  const textSub = isStitchLight ? 'text-slate-500' : 'text-neutral-400';
  const textMuted = isStitchLight ? 'text-slate-400' : 'text-neutral-500';

  return (
    <div className={`space-y-6 ${isStitchLight ? 'text-slate-800' : 'text-[#e5e2e1]'} font-sans w-full max-w-full overflow-x-hidden`}>
      
      {/* 1. ACTIVE AGENTS PANEL (Row of 3 beautiful micro-cards matching design doc) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Agent 1 */}
        <div className={`${colors.card} p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
              isStitchLight ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-[#f2ca50]/10 border-[#f2ca50]/20 text-[#f2ca50]'
            }`}>
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className={`text-xs font-bold font-display uppercase tracking-wider ${textTitle}`}>Agente Scout de Salas</h4>
              <p className={`text-[10px] font-mono mt-0.5 ${textSub}`}>Enriquecimiento de leads</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-[#b8d6b8] font-bold">
              ● ACTIVE
            </span>
            <div className={`text-[11px] font-mono font-bold mt-1 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>92 salas enriquecidas</div>
          </div>
        </div>

        {/* Agent 1.5 (Scout Descubridor) */}
        <div className={`${colors.card} p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
              isStitchLight ? 'bg-cyan-50 border-cyan-200 text-cyan-600' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
            }`}>
              <Sparkles className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className={`text-xs font-bold font-display uppercase tracking-wider ${textTitle}`}>Scout Descubridor</h4>
              <p className={`text-[10px] font-mono mt-0.5 ${textSub}`}>Búsqueda de salas y festis</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-[#b8d6b8] font-bold">
              ● ACTIVE
            </span>
            <div className={`text-[11px] font-mono font-bold mt-1 ${isStitchLight ? 'text-indigo-600' : 'text-cyan-400'}`}>31 nuevos hallazgos</div>
          </div>
        </div>

        {/* Agent 2 */}
        <div className={`${colors.card} p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
              isStitchLight ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-[#ffb596]/10 border-[#ffb596]/20 text-[#ffb596]'
            }`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className={`text-xs font-bold font-display uppercase tracking-wider ${textTitle}`}>Agente Negociador AI</h4>
              <p className={`text-[10px] font-mono mt-0.5 ${textSub}`}>Lector e interactuador</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-[#b8d6b8] font-bold">
              ● STANDBY
            </span>
            <div className={`text-[11px] font-mono font-bold mt-1 ${isStitchLight ? 'text-indigo-500' : 'text-[#ffb596]'}`}>4 hilos de negociación</div>
          </div>
        </div>
      </div>

      {/* Security Rule Notice */}
      <div className={`rounded-xl p-4 flex gap-3 items-start border ${
        isStitchLight ? 'bg-indigo-50 border-indigo-100 text-indigo-950' : 'bg-[#f2ca50]/5 border-[#f2ca50]/15'
      }`}>
        <ShieldCheck className={`w-5 h-5 shrink-0 mt-0.5 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`} />
        <div className="text-xs leading-relaxed">
          <strong className={`uppercase font-mono tracking-wider text-[10px] block mb-1 ${textTitle}`}>Regla de Oro de Bakandeya</strong>
          Ningún correo de presentación se envía sin aprobación explícita de Jon o Filgue. Al hacer clic en <strong className={isStitchLight ? 'text-indigo-600 font-extrabold' : 'text-[#f2ca50]'}>"Aprobar"</strong>, el correo se prepara para que el script de envío independiente de Python lo envíe en su próxima ronda programada.
        </div>
      </div>

      {/* 2. LEADS CRM WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEADS LIST AREA (2/3 width on wide screen) */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`${colors.card} p-4 space-y-4`}>
            
            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <h3 className={`text-sm font-bold font-display uppercase tracking-widest ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>Bandeja de Leads y Gestión CRM</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                <input
                  id="crm-search"
                  type="text"
                  placeholder="Buscar sala, ciudad o región..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full border rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none font-mono transition-all ${
                    isStitchLight 
                      ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500 placeholder:text-slate-400' 
                      : 'bg-[#131313] border-[#99907c]/25 text-[#e5e2e1] focus:border-[#f2ca50]/50 placeholder:text-neutral-600'
                  }`}
                />
              </div>
            </div>

            {/* Filter Pill Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin">
              {([
                { key: 'todos', label: 'Todos' },
                { key: 'nuevo', label: 'Por Contactar' },
                { key: 'pendiente_aprobacion', label: 'Por Aprobar' },
                { key: 'aprobado', label: 'Aprobados' },
                { key: 'esperando_respuesta', label: 'Enviados' },
                { key: 'interesado', label: 'Interesados' },
                { key: 'negociando', label: 'Negociando' },
                { key: 'no_interesado', label: 'No Interesados' }
              ] as const).map(tab => {
                const count = tab.key === 'todos' ? leads.length : leads.filter(l => normalizeStatus(l.estado) === tab.key).length;
                const isSelected = statusFilter === tab.key;
                return (
                  <button
                    id={`crm-filter-${tab.key}`}
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? colors.primary
                        : isStitchLight
                          ? 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                          : 'bg-[#131313] border border-[#99907c]/15 text-neutral-400 hover:text-neutral-100 hover:border-[#99907c]/30'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="ml-1.5 text-[9px] font-bold opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Leads Table/Grid List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredLeads.length === 0 ? (
                <div className={`text-center py-12 text-xs font-mono ${isStitchLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                  No se encontraron leads que coincidan con los filtros seleccionados.
                </div>
              ) : (
                filteredLeads.map(lead => {
                  const isSelected = selectedLead?.id === lead.id;
                  return (
                    <div 
                      key={lead.id}
                      onClick={() => handleOpenLead(lead)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between ${
                        isSelected 
                          ? isStitchLight
                            ? 'bg-indigo-50/70 border-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.05)]'
                            : 'bg-[#f2ca50]/5 border-[#f2ca50]/50 shadow-[0_0_15px_rgba(242,202,80,0.05)]'
                          : isStitchLight
                            ? 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/35'
                            : 'bg-[#131313] border-[#99907c]/15 hover:border-[#99907c]/35 hover:bg-[#1c1b1b]/30'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-display font-bold text-sm tracking-wide ${isStitchLight ? 'text-slate-900' : 'text-neutral-100'}`}>{lead.nombre_sala}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-semibold tracking-wider ${getStatusBadgeClass(lead.estado)}`}>
                            {getStatusLabel(lead.estado)}
                          </span>
                        </div>
                        <div className={`flex gap-3 text-[10px] font-mono flex-wrap ${textSub}`}>
                          <span className="flex items-center gap-1">
                            <MapPin className={`w-3 h-3 ${isStitchLight ? 'text-slate-400' : 'text-neutral-500'}`} /> {lead.ciudad} ({lead.region || 'N/A'})
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className={`w-3 h-3 ${isStitchLight ? 'text-slate-400' : 'text-neutral-500'}`} /> {lead.aforo || 'Desconocido'} pax
                          </span>
                          <span className={isStitchLight ? 'text-amber-700' : 'text-[#ffb596]/80'}>{lead.genero}</span>
                        </div>
                        {lead.notas && (
                          <p className={`text-[10px] truncate mt-1 italic font-mono max-w-xl ${textMuted}`}>
                            {lead.notas.split('\n')[0]}
                          </p>
                        )}
                      </div>

                      <button
                        id={`crm-take-over-${lead.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenLead(lead);
                        }}
                        className={`px-3 py-1.5 border rounded-md font-mono text-[9px] uppercase tracking-wider cursor-pointer font-bold active:scale-95 transition-all self-end sm:self-auto shrink-0 ${
                          isStitchLight
                            ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
                            : 'bg-[#ffb596]/10 hover:bg-[#ffb596]/20 border-[#ffb596]/30 text-[#ffb596]'
                        }`}
                      >
                        Intervenir
                      </button>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* DETAILED WORKSPACE PANEL (1/3 width) */}
        <div className="space-y-4">
          {selectedLead ? (
            <div className={`border rounded-xl p-5 space-y-5 relative overflow-hidden ${
              isStitchLight
                ? 'bg-white border-indigo-200 shadow-sm'
                : 'bg-[#1c1b1b]/95 border-[#f2ca50]/30 shadow-[0_4px_30px_rgba(0,0,0,0.6)]'
            }`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 dark:bg-[#f2ca50]/5 rounded-full blur-2xl pointer-events-none" />
              
              {/* Header */}
              <div className={`flex justify-between items-start border-b pb-3 ${isStitchLight ? 'border-slate-100' : 'border-[#99907c]/15'}`}>
                <div>
                  <h4 className={`text-xs font-mono uppercase tracking-widest ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>Panel de Intervención</h4>
                  <h3 className={`text-base font-bold font-display tracking-wide mt-1 ${textTitle}`}>{selectedLead.nombre_sala}</h3>
                  <p className={`text-[10px] font-mono mt-0.5 ${textSub}`}>{selectedLead.ciudad} • {selectedLead.region}</p>
                </div>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
                    isStitchLight
                      ? 'hover:bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                      : 'hover:bg-[#131313] border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Section */}
              <div className="space-y-1.5">
                <label className={`block text-[9px] uppercase font-mono tracking-wider ${textSub}`}>Estado de Booking Actual</label>
                <div className="flex items-center gap-2">
                  <select
                    id="crm-status-selector"
                    value={normalizeStatus(selectedLead.estado)}
                    onChange={(e) => handleCorrectStatus(e.target.value as LeadStatus)}
                    className={`text-[11px] px-3 py-1.5 rounded-lg font-mono font-bold uppercase tracking-wider cursor-pointer border focus:outline-none transition-all ${
                      getStatusBadgeClass(selectedLead.estado)
                    }`}
                    title="Cambiar estado del lead manualmente"
                  >
                    <option value="nuevo">Por Contactar (Nuevo)</option>
                    <option value="pendiente_aprobacion">Por Aprobar (Pendiente)</option>
                    <option value="aprobado">Aprobado para Envío</option>
                    <option value="esperando_respuesta">Enviado (Esperando Respuesta)</option>
                    <option value="interesado">Interesado 🔥</option>
                    <option value="negociando">Negociando 💬</option>
                    <option value="no_interesado">No Interesado 💤</option>
                  </select>
                </div>
              </div>

              {/* Tab Navigation inside Intervention Panel */}
              <div className="flex border-b border-neutral-800/15 dark:border-neutral-800 gap-2 pt-1">
                <button
                  type="button"
                  id="crm-tab-info"
                  onClick={() => setActiveTab('info')}
                  className={`pb-2 text-xs font-mono tracking-wider uppercase border-b-2 transition-all px-2 cursor-pointer ${
                    activeTab === 'info'
                      ? isStitchLight
                        ? 'border-indigo-600 text-indigo-600 font-bold'
                        : 'border-[#f2ca50] text-[#f2ca50] font-bold'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Detalle y Pitch
                </button>
                <button
                  type="button"
                  id="crm-tab-emails"
                  onClick={() => setActiveTab('emails')}
                  className={`pb-2 text-xs font-mono tracking-wider uppercase border-b-2 transition-all px-2 flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'emails'
                      ? isStitchLight
                        ? 'border-indigo-600 text-indigo-600 font-bold'
                        : 'border-[#f2ca50] text-[#f2ca50] font-bold'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Hilo de Emails</span>
                  {selectedLead.hilo_emails && selectedLead.hilo_emails.length > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      isStitchLight ? 'bg-indigo-100 text-indigo-700' : 'bg-[#f2ca50] text-[#3c2f00]'
                    }`}>
                      {selectedLead.hilo_emails.length}
                    </span>
                  )}
                </button>
              </div>

              {activeTab === 'info' ? (
                <>
                  {/* CRM Actions (Conditional based on current status) */}
                  <div className={`border rounded-lg p-3.5 ${
                    isStitchLight
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-[#131313]/50 border-[#99907c]/15'
                  }`}>
                    <h4 className={`text-[10px] font-mono uppercase tracking-widest border-b pb-1.5 ${
                      isStitchLight ? 'text-slate-500 border-slate-200' : 'text-neutral-400 border-neutral-800'
                    }`}>Flujo de Estados Permitido</h4>
                    
                    {selectedLead.estado === 'pendiente_aprobacion' ? (
                      <div className="space-y-2.5">
                        {/* Approve Pitch */}
                        {!isRejecting ? (
                          <>
                            <button
                              id="crm-btn-approve"
                              onClick={handleApproveLead}
                              className={`w-full py-2 font-mono font-bold text-xs rounded-md uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-[0.98] ${
                                isStitchLight
                                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-100'
                                  : 'bg-[#b8d6b8] hover:bg-[#cceacc] text-[#1d3621] shadow-emerald-950/10'
                              }`}
                            >
                              <Check className="w-4 h-4" /> Aprobar para Envío
                            </button>
                            
                            <button
                              id="crm-btn-reject-start"
                              onClick={() => setIsRejecting(true)}
                              className={`w-full py-2 border font-mono font-bold text-[10px] rounded-md uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                isStitchLight
                                  ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                                  : 'bg-[#ffb4ab]/10 hover:bg-[#ffb4ab]/20 border-[#ffb4ab]/30 text-[#ffb4ab]'
                              }`}
                            >
                              <X className="w-4 h-4" /> Rechazar / Re-editar
                            </button>
                          </>
                        ) : (
                          <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                            <label className={`block text-[9px] uppercase font-mono ${textSub}`}>Motivo del Rechazo / Directriz de Edición</label>
                            <textarea
                              id="crm-rejection-notes"
                              rows={3}
                              value={rejectionNotes}
                              onChange={(e) => setRejectionNotes(e.target.value)}
                              placeholder="Ej: El cachet propuesto es muy bajo, pon que cobramos mínimo 1.500€..."
                              className={`w-full border rounded px-2.5 py-1.5 text-xs focus:outline-none font-sans ${
                                isStitchLight
                                  ? 'bg-white border-rose-200 text-slate-800 placeholder:text-slate-400 focus:border-rose-500'
                                  : 'bg-[#131313] border-[#ffb4ab]/30 text-[#e5e2e1] placeholder:text-neutral-700 focus:border-[#ffb4ab]'
                              }`}
                            />
                            <div className="flex gap-2">
                              <button
                                id="crm-btn-reject-cancel"
                                onClick={() => setIsRejecting(false)}
                                className={`flex-1 py-1.5 border font-mono text-[9px] uppercase rounded ${
                                  isStitchLight
                                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-500'
                                    : 'bg-[#131313] hover:bg-neutral-800 border-neutral-800 text-neutral-400'
                                }`}
                              >
                                Cancelar
                              </button>
                              <button
                                id="crm-btn-reject-submit"
                                onClick={handleRejectLead}
                                disabled={!rejectionNotes}
                                className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-[9px] uppercase rounded disabled:opacity-40 cursor-pointer"
                              >
                                Confirmar Rechazo
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className={`text-[10px] leading-normal mb-2 font-mono ${textSub}`}>
                          Corrige o reclasifica manualmente el interés de la respuesta:
                        </p>
                        <div className="grid grid-cols-1 gap-1.5">
                          <button
                            id="crm-correct-interesado"
                            onClick={() => handleCorrectStatus('interesado')}
                            className={`py-1.5 px-2.5 rounded text-[10px] font-mono uppercase text-left transition-all flex justify-between items-center border ${
                              selectedLead.estado === 'interesado'
                                ? isStitchLight
                                  ? 'bg-emerald-50 text-emerald-700 font-bold border-emerald-300'
                                  : 'bg-[#ffb596]/10 border-[#ffb596]/30 text-[#ffb596]'
                                : isStitchLight
                                  ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                  : 'bg-[#131313] text-neutral-400 hover:text-white border-neutral-800/80 hover:border-neutral-700'
                            }`}
                          >
                            <span>Interesado 🔥</span>
                            {selectedLead.estado === 'interesado' && <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />}
                          </button>
                          <button
                            id="crm-correct-negociando"
                            onClick={() => handleCorrectStatus('negociando')}
                            className={`py-1.5 px-2.5 rounded text-[10px] font-mono uppercase text-left transition-all flex justify-between items-center border ${
                              selectedLead.estado === 'negociando'
                                ? isStitchLight
                                  ? 'bg-purple-50 text-purple-700 font-bold border-purple-300'
                                  : 'bg-[#f2ca50]/10 border-[#f2ca50]/30 text-[#f2ca50]'
                                : isStitchLight
                                  ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                  : 'bg-[#131313] text-neutral-400 hover:text-white border-neutral-800/80 hover:border-neutral-700'
                            }`}
                          >
                            <span>Negociando 💬</span>
                            {selectedLead.estado === 'negociando' && <Check className="w-3.5 h-3.5 text-purple-500 dark:text-fuchsia-400" />}
                          </button>
                          <button
                            id="crm-correct-no-interesado"
                            onClick={() => handleCorrectStatus('no_interesado')}
                            className={`py-1.5 px-2.5 rounded text-[10px] font-mono uppercase text-left transition-all flex justify-between items-center border ${
                              selectedLead.estado === 'no_interesado'
                                ? isStitchLight
                                  ? 'bg-slate-100 text-slate-600 font-bold border-slate-300'
                                  : 'bg-neutral-800 text-neutral-400 font-bold border-neutral-700'
                                : isStitchLight
                                  ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                  : 'bg-[#131313] text-neutral-400 hover:text-white border-neutral-800/80 hover:border-neutral-700'
                            }`}
                          >
                            <span>No Interesado 💤</span>
                            {selectedLead.estado === 'no_interesado' && <Check className="w-3.5 h-3.5 text-slate-400" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pitch Email Draft Section */}
                  <div className={`space-y-2 border-t pt-4 ${isStitchLight ? 'border-slate-100' : 'border-[#99907c]/15'}`}>
                    <div className="flex justify-between items-center">
                      <label className={`block text-[9px] uppercase font-mono tracking-wider ${textSub}`}>Borrador de Presentación (Pitch)</label>
                      {!isEditingPitch ? (
                        <button
                          id="crm-edit-pitch-start"
                          onClick={() => setIsEditingPitch(true)}
                          className={`text-[9px] font-mono hover:underline flex items-center gap-1 cursor-pointer ${
                            isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'
                          }`}
                        >
                          <Edit3 className="w-3 h-3" /> Editar
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            id="crm-edit-pitch-cancel"
                            onClick={() => {
                              setEditedPitch(selectedLead.pitch_generado || '');
                              setIsEditingPitch(false);
                            }}
                            className={`text-[9px] font-mono hover:underline cursor-pointer ${textMuted}`}
                          >
                            Cancelar
                          </button>
                          <button
                            id="crm-edit-pitch-save"
                            onClick={handleSavePitchEdit}
                            className="text-[9px] font-mono text-emerald-500 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
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
                        className={`w-full border rounded-lg p-3 text-xs focus:outline-none font-mono leading-relaxed ${
                          isStitchLight
                            ? 'bg-white border-indigo-200 text-slate-800 focus:border-indigo-500'
                            : 'bg-[#131313] border-[#f2ca50]/30 text-[#e5e2e1] focus:border-[#f2ca50]'
                        }`}
                      />
                    ) : (
                      <div className={`w-full border rounded-lg p-3.5 max-h-56 overflow-y-auto text-xs font-mono leading-relaxed whitespace-pre-wrap select-text ${
                        isStitchLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-[#131313] border-neutral-900 text-neutral-300'
                      }`}>
                        {selectedLead.pitch_generado || 'No hay correo redactado todavía para este lead.'}
                      </div>
                    )}
                  </div>

                  {/* History / Notes Log */}
                  <div className={`space-y-2 border-t pt-4 ${isStitchLight ? 'border-slate-100' : 'border-[#99907c]/15'}`}>
                    <label className={`block text-[9px] uppercase font-mono tracking-wider ${textSub}`}>Historial y Notas de la Fila</label>
                    <div className={`border rounded-lg p-2.5 max-h-36 overflow-y-auto text-[10px] font-mono whitespace-pre-wrap leading-normal ${
                      isStitchLight
                        ? 'bg-slate-100/50 border-slate-200 text-slate-500'
                        : 'bg-[#131313]/45 border-neutral-900 text-neutral-400'
                    }`}>
                      {selectedLead.notas || 'Sin notas.'}
                    </div>
                  </div>
                </>
              ) : (
                // Emails Tab (Interaction & Thread history)
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Contact Header info */}
                  <div className={`border rounded-lg p-3 text-[11px] font-mono flex items-center justify-between ${
                    isStitchLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#131313] border-neutral-800 text-neutral-300'
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
                  <div className={`border rounded-xl p-3.5 space-y-3 transition-all ${
                    isStitchLight 
                      ? 'bg-indigo-50/40 border-indigo-100' 
                      : 'bg-neutral-900/60 border-neutral-800/80 shadow-[0_4px_12px_rgba(0,0,0,0.2)]'
                  }`}>
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${gmailUser ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        <div>
                          <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-neutral-400">
                            Conexión de Gmail
                          </span>
                          <p className="text-[11px] font-mono font-bold">
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
                            className={`py-1 px-2.5 rounded font-mono text-[9px] uppercase font-extrabold flex items-center gap-1.5 cursor-pointer select-none transition-all active:scale-95 ${
                              isStitchLight
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
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
                            className={`p-1 px-1.5 rounded font-mono text-[9px] uppercase font-bold flex items-center gap-1 cursor-pointer transition-colors ${
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
                          className={`py-1.5 px-3 rounded-lg font-mono text-[10px] uppercase font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-95 border ${
                            isStitchLight 
                              ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400' 
                              : 'bg-neutral-950 border-neutral-800 text-[#f2ca50] hover:bg-neutral-900 hover:border-neutral-700'
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
                      <p className={`text-[10px] font-mono leading-normal mt-1 border-t pt-1.5 ${
                        gmailStatusMsg.includes('Error') || gmailStatusMsg.includes('No se pudo') || gmailStatusMsg.includes('⚠️')
                          ? 'text-rose-400 border-rose-500/10'
                          : isStitchLight ? 'text-indigo-600 border-indigo-100' : 'text-[#f2ca50] border-[#f2ca50]/10'
                      }`}>
                        {gmailStatusMsg}
                      </p>
                    )}

                    {window.self !== window.top && !gmailUser && (
                      <div className={`text-[10px] font-mono leading-normal rounded p-2.5 space-y-1.5 mt-1.5 border ${
                        isStitchLight 
                          ? 'bg-amber-50 border-amber-200 text-amber-800' 
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      }`}>
                        <p>
                          ⚠️ <strong>Restricción del Iframe:</strong> Para conectar tu cuenta de Google, abre la app en una <strong>pestaña nueva</strong> para evitar que el navegador bloquee la autenticación.
                        </p>
                        <a
                          href={window.location.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono font-bold uppercase text-[9px] transition-all select-none cursor-pointer active:scale-95 ${
                            isStitchLight
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
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
                      <label className={`block text-[9px] uppercase font-mono tracking-wider ${textSub}`}>Bandeja del Historial del Trato</label>
                      <button
                        type="button"
                        onClick={handleOpenAdvancedSimulation}
                        className={`text-[9px] font-mono uppercase tracking-wider border rounded px-2 py-0.5 transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                          isStitchLight
                            ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 hover:border-amber-300'
                            : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-[#f2ca50] hover:border-[#f2ca50]/50'
                        }`}
                        title="Simular correo electrónico personalizado de respuesta (Sala o Banda)"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                        <span>Simular Negociación</span>
                      </button>
                    </div>
                    
                    {!selectedLead.hilo_emails || selectedLead.hilo_emails.length === 0 ? (
                      <div className={`border border-dashed rounded-lg p-6 text-center text-xs font-mono py-10 ${
                        isStitchLight ? 'border-slate-200 text-slate-400' : 'border-neutral-800 text-neutral-500'
                      }`}>
                        No hay correos anteriores registrados. ¡Escribe el primer mensaje abajo para iniciar la negociación!
                      </div>
                    ) : (
                      selectedLead.hilo_emails.map((email) => {
                        const isBanda = email.remitente === 'banda';
                        return (
                          <div 
                            key={email.id} 
                            className={`border rounded-lg p-3 text-xs leading-relaxed transition-all ${
                              isBanda 
                                ? isStitchLight
                                  ? 'bg-indigo-50/60 border-indigo-200 text-slate-800 shadow-[0_1px_4px_rgba(79,70,229,0.02)]'
                                  : 'bg-[#ffb596]/10 border-[#ffb596]/20 text-[#e5e2e1]'
                                : isStitchLight
                                  ? 'bg-amber-50/60 border-amber-200 text-slate-800'
                                  : 'bg-neutral-800/40 border-neutral-700/50 text-[#e5e2e1]'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1.5 border-b pb-1 border-neutral-700/10 dark:border-neutral-800/50 flex-wrap gap-1">
                              <div>
                                <span className="font-bold font-mono tracking-wide">
                                  {email.remitente_nombre}
                                </span>
                                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-extrabold ${
                                  isBanda 
                                    ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20' 
                                    : 'bg-amber-500/10 text-amber-500 dark:text-[#f2ca50] border border-amber-500/20'
                                }`}>
                                  {isBanda ? 'Banda' : 'Sala'}
                                </span>
                              </div>
                              <span className="text-[9px] font-mono text-neutral-500 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {email.fecha}
                              </span>
                            </div>
                            <div className="font-mono text-[10px] text-neutral-500 mb-1 font-bold">Asunto: {email.asunto}</div>
                            <p className="whitespace-pre-wrap font-sans text-[11px] text-neutral-800 dark:text-neutral-300">{email.mensaje}</p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Manual compose editor */}
                  <div className={`border rounded-lg p-3.5 space-y-3 ${
                    isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131313]/70 border-neutral-800/90'
                  }`}>
                    <div className="flex items-center gap-1.5 border-b border-neutral-800/10 dark:border-neutral-800 pb-2">
                      <Edit3 className={`w-4 h-4 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`} />
                      <h4 className={`text-[10px] font-mono uppercase tracking-widest ${textTitle}`}>Intervención Personal (Enviar Email en Persona)</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className={`block text-[9px] uppercase font-mono ${textSub}`}>Asunto</label>
                        <input 
                          type="text"
                          value={manualEmailSubject}
                          onChange={(e) => setManualEmailSubject(e.target.value)}
                          placeholder="Re: Propuesta de concierto..."
                          className={`w-full border rounded px-2.5 py-1.5 text-xs focus:outline-none font-sans ${
                            isStitchLight ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500' : 'bg-[#1c1b1b] border-neutral-800 text-[#e5e2e1] focus:border-[#f2ca50]'
                          }`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={`block text-[9px] uppercase font-mono ${textSub}`}>Quién envía</label>
                        <select 
                          value={manualEmailSender}
                          onChange={(e) => setManualEmailSender(e.target.value)}
                          className={`w-full border rounded px-2.5 py-1.5 text-xs focus:outline-none font-sans ${
                            isStitchLight ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500' : 'bg-[#1c1b1b] border-neutral-800 text-[#e5e2e1] focus:border-[#f2ca50]'
                          }`}
                        >
                          <option value="Jon (Cantante de Bakandeya)">Jon (Cantante)</option>
                          <option value="Diego (Guitarrista de Bakandeya)">Diego (Guitarra)</option>
                          <option value="Larra (Mánager de Bakandeya)">Larra (Mánager)</option>
                          <option value="Filgue (Bajo de Bakandeya)">Filgue (Bajo)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className={`block text-[9px] uppercase font-mono ${textSub}`}>Cuerpo del Correo Personal</label>
                      <textarea
                        rows={5}
                        value={manualEmailBody}
                        onChange={(e) => setManualEmailBody(e.target.value)}
                        placeholder="Redacta el mensaje de manera personal para concretar el concierto (caché, horarios, repartos)..."
                        className={`w-full border rounded p-2 text-xs focus:outline-none font-sans leading-relaxed ${
                          isStitchLight ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500' : 'bg-[#1c1b1b] border-neutral-800 text-[#e5e2e1] focus:border-[#f2ca50]'
                        }`}
                      />
                    </div>

                    {manualEmailStatus && (
                      <p className="text-[10px] font-mono text-emerald-500 font-bold animate-pulse">{manualEmailStatus}</p>
                    )}

                    <div className="flex gap-2 pt-1 items-center justify-between">
                      <span className={`text-[9px] font-mono leading-none max-w-[150px] ${textMuted}`}>
                        Nota: Al enviar, se actualizará el estado del lead a negociando de inmediato.
                      </span>
                      <button
                        type="button"
                        onClick={handleSendManualEmail}
                        disabled={!manualEmailBody}
                        className={`px-4 py-2 font-mono font-bold text-xs uppercase tracking-wider rounded-md flex items-center gap-1.5 cursor-pointer shadow active:scale-[0.98] disabled:opacity-40 transition-all ${
                          isStitchLight
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-100'
                            : 'bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00]'
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
            <div className={`border rounded-xl p-6 text-center py-24 space-y-3 ${
              isStitchLight
                ? 'bg-slate-50/50 border-dashed border-slate-200 text-slate-400'
                : 'bg-[#1c1b1b]/95 border-[#99907c]/15 text-neutral-500'
            }`}>
              <Bot className={`w-10 h-10 mx-auto animate-pulse ${isStitchLight ? 'text-indigo-400/50' : 'text-[#f2ca50]/55'}`} />
              <h4 className={`text-xs font-mono uppercase tracking-widest ${isStitchLight ? 'text-indigo-500/80' : 'text-[#f2ca50]/80'}`}>Intervención de Booking</h4>
              <p className="text-[11px] leading-relaxed max-w-[200px] mx-auto">
                Selecciona cualquier sala del CRM a la izquierda para editar su pitch, validar el correo antes de enviar o reclasificar su respuesta.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* 3. EMAIL TEMPLATES & AI SETTINGS EDITOR CARD */}
      <div className={`${colors.card} p-5 space-y-6`}>
        <div className={`border-b pb-3 ${isStitchLight ? 'border-slate-100' : 'border-[#99907c]/15'}`}>
          <h3 className={`text-sm font-bold font-display uppercase tracking-widest flex items-center gap-2 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>
            <Settings className={`w-4 h-4 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`} /> Configuración de Plantillas y Pautas AI (Redactor)
          </h3>
          <p className={`text-[10px] font-mono mt-1 ${textSub}`}>
            Define la estructura general de los correos que genera el Redactor y las pautas que el modelo AI debe incorporar subjetivamente.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Side */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className={`block text-[10px] uppercase font-mono tracking-wider ${isStitchLight ? 'text-slate-600' : 'text-neutral-300'}`}>Asunto del Email por Defecto</label>
              <input
                id="template-subject"
                type="text"
                value={subjectTemplate}
                onChange={(e) => setSubjectTemplate(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none transition-all font-mono ${
                  isStitchLight
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    : 'bg-[#131313] border-[#99907c]/25 text-[#e5e2e1] focus:border-[#f2ca50]/50'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`block text-[10px] uppercase font-mono tracking-wider ${isStitchLight ? 'text-slate-600' : 'text-neutral-300'}`}>Cuerpo de la Plantilla de Pitch</label>
              <textarea
                id="template-body"
                rows={8}
                value={bodyTemplate}
                onChange={(e) => setBodyTemplate(e.target.value)}
                className={`w-full border rounded-lg p-3 text-xs focus:outline-none transition-all font-mono leading-relaxed ${
                  isStitchLight
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    : 'bg-[#131313] border-[#99907c]/25 text-[#e5e2e1] focus:border-[#f2ca50]/50'
                }`}
                placeholder="Escribe el cuerpo de la plantilla usando {{nombre_sala}}, {{ciudad}} etc..."
              />
            </div>

            <div className="space-y-1.5">
              <label className={`block text-[10px] uppercase font-mono tracking-wider flex items-center gap-1.5 ${isStitchLight ? 'text-indigo-600' : 'text-[#ffb596]'}`}>
                <Sparkles className="w-3.5 h-3.5" /> Pautas AI (Directrices de Redacción Subjetiva)
              </label>
              <textarea
                id="template-guidelines"
                rows={4}
                value={aiGuidelines}
                onChange={(e) => setAiGuidelines(e.target.value)}
                className={`w-full border rounded-lg p-3 text-xs focus:outline-none transition-all font-sans leading-relaxed ${
                  isStitchLight
                    ? 'bg-white border-indigo-200 text-slate-800 focus:border-indigo-500'
                    : 'bg-[#131313] border-[#ffb596]/30 text-[#e5e2e1] focus:border-[#ffb596]/50'
                }`}
                placeholder="Ej: Mantén un tono canalla, enfatiza la potencia del directo, di que somos 8 músicos..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                id="template-btn-test"
                onClick={handleTestPrompt}
                disabled={isTestingPrompt}
                className={`px-4 py-2 border font-mono text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  isStitchLight
                    ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                {isTestingPrompt ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Probar Prompt</span>
              </button>
              <button
                id="template-btn-save"
                onClick={handleSaveTemplates}
                className={`flex-1 py-2 font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center active:scale-95 ${
                  isStitchLight
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-100'
                    : 'bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00] shadow-lg shadow-[#f2ca50]/10'
                }`}
              >
                Guardar Plantillas y Directrices
              </button>
            </div>
          </div>

          {/* Test / Prompt Output side */}
          <div className={`border rounded-xl p-4 flex flex-col justify-between ${
            isStitchLight
              ? 'bg-slate-50 border-slate-200'
              : 'bg-[#131313] border-[#99907c]/15'
          }`}>
            <div className="space-y-3">
              <div className={`flex items-center gap-2 border-b pb-2 ${isStitchLight ? 'border-slate-200' : 'border-neutral-900'}`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isStitchLight ? 'bg-indigo-600' : 'bg-[#f2ca50]'}`} />
                <h4 className={`text-[10px] font-mono uppercase tracking-widest ${textSub}`}>Sandbox de Simulación de Redacción AI</h4>
              </div>
              
              <div className={`text-[11px] leading-relaxed font-sans ${textSub}`}>
                Cuando el agente de Python <strong>"Redactor"</strong> corre, lee estas plantillas y pautas, las mezcla con los detalles del lead capturado por el <strong>"Scout"</strong> (aforo, ubicación, género, redes) y genera un borrador adaptado para que lo revises en esta misma pantalla.
              </div>

              {testPromptResult ? (
                <div className={`border rounded-lg p-3.5 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto animate-in fade-in duration-300 select-text ${
                  isStitchLight
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-[#1c1b1b] border-[#99907c]/20 text-neutral-300'
                }`}>
                  {testPromptResult}
                </div>
              ) : (
                <div className={`border border-dashed rounded-lg p-12 text-center text-xs font-mono ${
                  isStitchLight
                    ? 'border-slate-200 text-slate-400'
                    : 'border-neutral-800 text-neutral-600'
                }`}>
                  Haz clic en "Probar Prompt" a la izquierda para simular el resultado de generación del Redactor AI basado en tus directrices actuales.
                </div>
              )}
            </div>

            <div className={`text-[9px] font-mono mt-4 leading-normal text-right ${textMuted}`}>
              Módulo de Modelado AI de Bakandeya Systems v2.4. Powered by Gemini.
            </div>
          </div>
        </div>

      </div>

      {/* ADVANCED NEGOTIATION SIMULATOR MODAL */}
      {isSimulatingAvanzado && selectedLead && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className={`w-full max-w-2xl border rounded-xl shadow-2xl p-6 relative flex flex-col gap-4 animate-in zoom-in-95 duration-200 select-none ${
            isStitchLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#181818] border-neutral-800 text-neutral-200'
          }`}>
            {/* Header */}
            <div className="flex justify-between items-start border-b border-neutral-800/10 dark:border-neutral-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  <h3 className="text-sm font-bold font-display uppercase tracking-widest">
                    Simulador de Negociación Personalizado
                  </h3>
                </div>
                <p className={`text-[10px] font-mono mt-0.5 ${textMuted}`}>
                  Trato actual con <strong className="text-amber-500 dark:text-[#f2ca50]">{selectedLead.nombre_sala}</strong> ({selectedLead.ciudad}) — Estado: {selectedLead.estado}
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
                <label className={`block text-[9px] uppercase font-mono tracking-wider ${textSub}`}>¿Quién emite la respuesta simulada?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('sala')}
                    className={`py-2 px-3 rounded-lg border font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      simulationRole === 'sala'
                        ? isStitchLight
                          ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-[#f2ca50] hover:bg-[#ffe28d] text-[#3c2f00] border-[#f2ca50]'
                        : isStitchLight
                          ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500'
                          : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <Building className="w-4 h-4" /> Sala o Festival (Entrante)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('banda')}
                    className={`py-2 px-3 rounded-lg border font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      simulationRole === 'banda'
                        ? isStitchLight
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-sm'
                          : 'bg-indigo-500 hover:bg-indigo-400 text-white border-indigo-500'
                        : isStitchLight
                          ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500'
                          : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <Users className="w-4 h-4" /> Banda Bakandeya (Saliente)
                  </button>
                </div>
              </div>

              {/* Scenario selector */}
              <div className="space-y-1.5">
                <label className={`block text-[9px] uppercase font-mono tracking-wider ${textSub}`}>Instrucciones de Situación / Pauta Inicial</label>
                <select
                  value={simulationScenario}
                  onChange={(e) => handleScenarioChange(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none font-sans ${
                    isStitchLight ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500' : 'bg-[#1c1b1b] border-neutral-800 text-[#e5e2e1] focus:border-[#f2ca50]'
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
                  <label className={`block text-[9px] uppercase font-mono tracking-wider ${textSub}`}>Nombre del Emisor</label>
                  <input
                    type="text"
                    value={simulationSenderName}
                    onChange={(e) => setSimulationSenderName(e.target.value)}
                    placeholder="Ej. Kike (Sala Hebe) o Larra"
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none font-sans ${
                      isStitchLight ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500' : 'bg-[#1c1b1b] border-neutral-800 text-[#e5e2e1] focus:border-[#f2ca50]'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={`block text-[9px] uppercase font-mono tracking-wider ${textSub}`}>Asunto del Correo</label>
                  <input
                    type="text"
                    value={simulationSubject}
                    onChange={(e) => setSimulationSubject(e.target.value)}
                    placeholder="Ej. Re: Propuesta..."
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none font-sans ${
                      isStitchLight ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500' : 'bg-[#1c1b1b] border-neutral-800 text-[#e5e2e1] focus:border-[#f2ca50]'
                    }`}
                  />
                </div>
              </div>

              {/* Simulation Instructions Prompt Area */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className={`block text-[9px] uppercase font-mono tracking-wider ${textSub}`}>Instrucciones Detalladas de Negociación para la IA</label>
                  <span className={`text-[8px] font-mono ${textMuted}`}>Cualquier cambio aquí personalizará el correo</span>
                </div>
                <textarea
                  rows={3}
                  value={simulationCustomInstruction}
                  onChange={(e) => setSimulationCustomInstruction(e.target.value)}
                  placeholder="Define pautas específicas (ej. propone taquilla 60/40, exige rider técnico especial, etc.)..."
                  className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none font-sans leading-relaxed ${
                    isStitchLight ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500' : 'bg-[#1c1b1b] border-neutral-800 text-[#e5e2e1] focus:border-[#f2ca50]'
                  }`}
                />
              </div>

              {/* Generate Button */}
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={handleGenerateSimulationEmail}
                  disabled={isGeneratingSimulation || !simulationCustomInstruction}
                  className={`w-full py-2.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-40 ${
                    isStitchLight
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                      : 'bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00] font-extrabold shadow-lg'
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
                <div className="space-y-2 border-t border-neutral-800/10 dark:border-neutral-800 pt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex justify-between items-center">
                    <label className={`block text-[9px] uppercase font-mono tracking-wider ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>
                      ✨ Vista Previa del Correo Generado (Editable)
                    </label>
                    <span className={`text-[8px] font-mono uppercase bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20`}>
                      Listo para Ajustar
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={simulationMessage}
                    onChange={(e) => setSimulationMessage(e.target.value)}
                    className={`w-full border rounded-lg p-3 text-xs focus:outline-none font-sans leading-relaxed ${
                      isStitchLight ? 'bg-indigo-50/20 border-indigo-200 text-slate-800' : 'bg-neutral-900 border-neutral-800 text-neutral-200'
                    }`}
                  />
                  <p className={`text-[9px] font-mono ${textMuted} leading-tight`}>
                    💡 Tip: Puedes retocar el texto directamente para añadir detalles personalizados específicos antes de confirmarlo.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3.5 border-t border-neutral-800/10 dark:border-neutral-800 pt-3 mt-1">
              <button
                type="button"
                onClick={() => setIsSimulatingAvanzado(false)}
                className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                  isStitchLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800/50'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCommitSimulation}
                disabled={!simulationMessage || isGeneratingSimulation}
                className={`px-5 py-2 rounded-lg font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow active:scale-[0.98] disabled:opacity-40 transition-all ${
                  isStitchLight
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00] font-extrabold'
                }`}
              >
                <Check className="w-4 h-4" /> Guardar y Sincronizar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
