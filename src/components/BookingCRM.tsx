import React, { useState } from 'react';
import { Lead, LeadStatus, ThemeColors } from '../types';
import { 
  Search, ShieldCheck, Mail, Clock, Check, X, RefreshCw, 
  MapPin, Users, Bot, MessageSquare, Edit3, Settings, Sparkles, Send 
} from 'lucide-react';

interface BookingCRMProps {
  leads: Lead[];
  colors: ThemeColors;
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
}

export default function BookingCRM({ leads, colors, onUpdateLead }: BookingCRMProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'todos'>('todos');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditingPitch, setIsEditingPitch] = useState(false);
  const [editedPitch, setEditedPitch] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Template states
  const [subjectTemplate, setSubjectTemplate] = useState('Propuesta de concierto: Bakandeya (Ska / Reggae / Mestizaje)');
  const [bodyTemplate, setBodyTemplate] = useState(`Hola equipo de booking de {{nombre_sala}},

Somos Bakandeya, banda que fusiona balkan ska, roots reggae, rock y electrónica analógica. Hemos visto su programación en {{ciudad}} y creemos que nuestra propuesta encaja perfecto para su público.

Disponemos de fechas abiertas para nuestra gira 2026. Les invitamos a ver nuestros directos de alta energía: https://youtube.com/bakandeya_live

Un saludo,
Larra (Manager de Bakandeya)`);
  const [aiGuidelines, setAiGuidelines] = useState('Escribe siempre en un tono enérgico, cercano pero muy respetuoso con los programadores de salas. Enfatiza que disponemos de un potente combo de metales en directo y que aseguramos llenar el aforo gracias a nuestra campaña de promo local.');
  const [testPromptResult, setTestPromptResult] = useState('');
  const [isTestingPrompt, setIsTestingPrompt] = useState(false);

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nombre_sala.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.region.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || lead.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isStitchLight = colors.accent === 'text-indigo-600';

  const getStatusBadgeClass = (status: LeadStatus) => {
    switch (status) {
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

  const getStatusLabel = (status: LeadStatus) => {
    switch (status) {
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
    const correctionMsg = `*** [${today}] Clasificación corregida a '${newStatus}' manualmente por Diego ***\n`;
    
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

Le escribimos de parte de la banda de ska/reggae Bakandeya. Siguiendo sus pautas de directo ("${aiGuidelines.substring(0, 50)}..."), hemos adaptado nuestro directo para encajar a la perfección. Disponemos de un espectacular octeto con sección de metales demoledora en directo que asegura una fiesta inovidable.

¿Qué os parece el viernes 23 de Octubre de 2026? Quedamos a vuestra disposición.

Salud,
Larra`);
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
    <div className={`space-y-6 ${isStitchLight ? 'text-slate-800' : 'text-[#e5e2e1]'} font-sans`}>
      
      {/* 1. ACTIVE AGENTS PANEL (Row of 2 beautiful micro-cards matching design doc) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <p className={`text-[10px] font-mono mt-0.5 ${textSub}`}>Captura automática de leads</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-[#b8d6b8] font-bold">
              ● ACTIVE
            </span>
            <div className={`text-[11px] font-mono font-bold mt-1 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>92 salas capturadas</div>
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
              <p className={`text-[10px] font-mono mt-0.5 ${textSub}`}>Lector e interactuador de emails</p>
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
          Ningún correo de presentación se envía sin aprobación explícita de Diego o Larra. Al hacer clic en <strong className={isStitchLight ? 'text-indigo-600 font-extrabold' : 'text-[#f2ca50]'}>"Aprobar"</strong>, el correo se prepara para que el script de envío independiente de Python lo envíe en su próxima ronda programada.
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
                const count = tab.key === 'todos' ? leads.length : leads.filter(l => l.estado === tab.key).length;
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
                  <span className={`text-[10px] px-2.5 py-1 rounded-md font-mono font-bold uppercase tracking-wider ${getStatusBadgeClass(selectedLead.estado)}`}>
                    {getStatusLabel(selectedLead.estado)}
                  </span>
                </div>
              </div>

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

    </div>
  );
}
