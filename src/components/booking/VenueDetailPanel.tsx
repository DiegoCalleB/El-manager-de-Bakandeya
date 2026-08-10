import React, { useState } from 'react';
import { Lead, LeadStatus, InteractionLog } from '../../types';
import { LeadHealthBadge } from './LeadHealthBadge';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { ReliabilityBadge } from '../common/ReliabilityBadge';
import { FavoriteButton } from '../common/FavoriteButton';
import { isLeadVerificado } from '../../utils/leadReliability';
import DirectionsCard from '../DirectionsCard';
import {
  Edit3,
  X,
  Sparkles,
  MessageCircle,
  PhoneCall,
  Mail,
  CheckCircle2,
  History,
  Save,
  Trash2,
  ChevronDown,
  Send,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';

interface VenueDetailPanelProps {
  selectedLead: Lead | null;
  onClose: () => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  getStatusBadgeClass: (status: LeadStatus | string) => string;
  getStatusLabel: (status: LeadStatus | string) => string;
  getStatusDotColor: (status: LeadStatus | string) => string;
  normalizeStatus: (status: string) => LeadStatus;
  normalizeType: (type?: string) => string;
  autoDetectVenueAddress: (venueName: string, city: string) => string;
  sectionTab: 'salas' | 'medios' | 'grupos';
  isStitchLight?: boolean;
}

export const VenueDetailPanel: React.FC<VenueDetailPanelProps> = ({
  selectedLead,
  onClose,
  onUpdateLead,
  getStatusBadgeClass,
  getStatusLabel,
  getStatusDotColor,
  normalizeStatus,
  normalizeType,
  autoDetectVenueAddress,
  sectionTab,
  isStitchLight = false
}) => {
  if (!selectedLead) return null;

  // Active Tab inside panel
  const [activeTab, setActiveTab] = useState<'info' | 'emails' | 'bitacora'>('info');

  // Edit Lead State
  const [isEditingLeadInfo, setIsEditingLeadInfo] = useState(false);
  const [editedLeadInfo, setEditedLeadInfo] = useState<Partial<Lead>>({ ...selectedLead });

  // Pitch Editing State
  const [isEditingPitch, setIsEditingPitch] = useState(false);
  const [editedPitch, setEditedPitch] = useState(selectedLead.pitch_generado || '');

  // Bitácora state
  const [interactionType, setInteractionType] = useState<InteractionLog['tipo']>('Llamada');
  const [interactionAutor, setInteractionAutor] = useState('Diego (Manager)');
  const [interactionNotes, setInteractionNotes] = useState('');
  const [interactionResultado, setInteractionResultado] = useState<InteractionLog['resultado']>('Interesado');

  // Quick Copy status
  const [copiedPitch, setCopiedPitch] = useState(false);

  // Sync edits when lead changes
  const handleStartEdit = () => {
    setEditedLeadInfo({ ...selectedLead });
    setIsEditingLeadInfo(true);
  };

  const handleSaveLeadInfo = () => {
    if (!editedLeadInfo.nombre_sala) return;
    onUpdateLead(selectedLead.id, editedLeadInfo);
    setIsEditingLeadInfo(false);
  };

  const handleCorrectStatus = (newStatus: LeadStatus) => {
    onUpdateLead(selectedLead.id, { estado: newStatus });
  };

  const handleSavePitch = () => {
    onUpdateLead(selectedLead.id, { pitch_generado: editedPitch, estado: 'aprobado' });
    setIsEditingPitch(false);
  };

  const handleApprovePitchDirectly = () => {
    onUpdateLead(selectedLead.id, { estado: 'aprobado' });
  };

  const handleAddInteractionLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionNotes.trim()) return;

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

    setInteractionNotes('');
  };

  const handleDeleteInteractionLog = (logId: string) => {
    if (!selectedLead.historial_contacto) return;
    const updated = selectedLead.historial_contacto.filter((l) => l.id !== logId);
    onUpdateLead(selectedLead.id, { historial_contacto: updated });
  };

  const handleCopyPitch = () => {
    if (selectedLead.pitch_generado) {
      navigator.clipboard.writeText(selectedLead.pitch_generado);
      setCopiedPitch(true);
      setTimeout(() => setCopiedPitch(false), 2000);
    }
  };

  const phoneClean = selectedLead.telefono ? selectedLead.telefono.replace(/\D/g, '') : '';

  return (
    <div className="w-full space-y-5 relative">
      {/* HEADER CARD */}
      <div className="bg-[#1A1918] rounded-2xl p-4 sm:p-5 border border-zinc-800 shadow-xl space-y-4">
        {/* Title Bar */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3">
            {selectedLead.imagen_url ? (
              <img
                src={selectedLead.imagen_url}
                alt={selectedLead.nombre_sala}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#f2ca50] shrink-0 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[#2A2928] border border-zinc-700 flex items-center justify-center shrink-0 text-3xl shadow-inner">
                {selectedLead.icono ||
                  (normalizeType(selectedLead.tipo) === 'medio'
                    ? '📻'
                    : normalizeType(selectedLead.tipo) === 'festival'
                    ? '🎪'
                    : normalizeType(selectedLead.tipo) === 'discoteca'
                    ? '🪩'
                    : '🏛️')}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-zinc-50">
                  {selectedLead.nombre_sala}
                </h3>
                <VerifiedBadge isVerified={isLeadVerificado(selectedLead)} size="md" showLabel={true} />
              </div>
              <p className="text-xs sm:text-sm font-sans mt-0.5 text-zinc-300">
                {selectedLead.ciudad} • {selectedLead.genero || 'Variado'} •{' '}
                {selectedLead.aforo ? `${selectedLead.aforo} pax` : 'Aforo n/d'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <FavoriteButton 
              isFavorite={!!selectedLead.es_favorito}
              onToggle={(newVal) => onUpdateLead(selectedLead.id, { es_favorito: newVal })}
              size="md"
            />
            <button
              onClick={handleStartEdit}
              className="p-2 rounded-xl bg-[#252423] hover:bg-[#2e2d2b] text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-700/60"
              title="Editar ficha completa"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#252423] hover:bg-[#2e2d2b] text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-700/60"
              title="Cerrar panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lead Health / Temperature Badge & Quality Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <LeadHealthBadge lead={selectedLead} showDescription={true} size="md" />
            <ReliabilityBadge item={selectedLead} size="md" />
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-1.5 bg-[#121110] px-2.5 py-1 rounded-xl border border-zinc-800">
            <span className={`w-2 h-2 rounded-full ${getStatusDotColor(selectedLead.estado)}`} />
            <select
              value={normalizeStatus(selectedLead.estado)}
              onChange={(e) => handleCorrectStatus(e.target.value as LeadStatus)}
              className="text-xs font-sans font-bold text-zinc-100 bg-transparent cursor-pointer focus:outline-none"
            >
              <option value="nuevo" className="bg-zinc-900">
                Por contactar (nuevo)
              </option>
              <option value="pendiente_aprobacion" className="bg-zinc-900">
                Por aprobar (pendiente)
              </option>
              <option value="aprobado" className="bg-zinc-900">
                Aprobado para envío
              </option>
              <option value="esperando_respuesta" className="bg-zinc-900">
                Email enviado • esperando
              </option>
              <option value="interesado" className="bg-zinc-900">
                Interesado
              </option>
              <option value="negociando" className="bg-zinc-900">
                Negociando
              </option>
              <option value="no_interesado" className="bg-zinc-900">
                No interesado
              </option>
            </select>
          </div>
        </div>

        {/* Quick Action Bar for Booking Manager */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {phoneClean ? (
            <a
              href={`https://wa.me/${phoneClean}`}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Directo</span>
            </a>
          ) : null}

          {selectedLead.telefono ? (
            <a
              href={`tel:${selectedLead.telefono}`}
              className="py-2.5 px-3 bg-sky-950/90 hover:bg-sky-900 border border-sky-700/80 text-sky-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <PhoneCall className="w-4 h-4 text-sky-400" />
              <span>Llamar por Tel</span>
            </a>
          ) : null}
        </div>
      </div>

      {/* CONTACT & LOCATION CARD */}
      <div className="bg-[#1A1918] rounded-xl p-4 space-y-2.5 border border-zinc-800">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-400">
            Ficha de Contacto & Ubicación
          </p>
          {selectedLead.email_contacto && (
            <span className="text-xs text-amber-300 font-mono font-medium truncate max-w-[180px]">
              {selectedLead.email_contacto}
            </span>
          )}
        </div>

        {selectedLead.direccion ? (
          <p className="text-xs font-sans font-bold text-zinc-100">{selectedLead.direccion}</p>
        ) : (
          <button
            onClick={() => {
              const detected = autoDetectVenueAddress(selectedLead.nombre_sala, selectedLead.ciudad);
              onUpdateLead(selectedLead.id, { direccion: detected });
            }}
            className="text-xs font-sans font-bold text-[#eab308] hover:text-[#facc15] cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Auto-detectar dirección exacta
          </button>
        )}

        <div className="pt-1 flex justify-center">
          <DirectionsCard
            query={
              selectedLead.direccion || `${selectedLead.nombre_sala}, ${selectedLead.ciudad}`
            }
            locationName={selectedLead.nombre_sala}
            address={selectedLead.direccion || selectedLead.ciudad}
            isStitchLight={isStitchLight}
          />
        </div>
      </div>

      {/* NAVIGATION TABS (Pitch/Info | Email Thread | Bitácora) */}
      <div className="flex border-b border-zinc-800 gap-2 pt-1">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`pb-2 text-xs font-sans font-bold tracking-wide uppercase transition-all px-3 cursor-pointer ${
            activeTab === 'info'
              ? 'border-b-2 border-[#f2ca50] text-[#f2ca50]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Propuesta / Pitch
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('emails')}
          className={`pb-2 text-xs font-sans font-bold tracking-wide uppercase transition-all px-3 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'emails'
              ? 'border-b-2 border-[#f2ca50] text-[#f2ca50]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Correos</span>
          {selectedLead.hilo_emails && selectedLead.hilo_emails.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#f2ca50] text-[#3c2f00]">
              {selectedLead.hilo_emails.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bitacora')}
          className={`pb-2 text-xs font-sans font-bold tracking-wide uppercase transition-all px-3 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'bitacora'
              ? 'border-b-2 border-[#f2ca50] text-[#f2ca50]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Bitácora ({selectedLead.historial_contacto?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: PITCH & DIRECT EDITING FORM */}
      {activeTab === 'info' && (
        <div className="space-y-4">
          {/* Edit Form Modal/Inline */}
          {isEditingLeadInfo && (
            <div className="p-4 rounded-xl space-y-3 bg-[#181818] border border-amber-500/40 text-zinc-100 shadow-xl">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" /> Editar Ficha ({selectedLead.nombre_sala})
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingLeadInfo(false)}
                    className="px-2.5 py-1 text-xs rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveLeadInfo}
                    className="px-3 py-1 text-xs rounded bg-amber-500 text-black font-bold hover:bg-amber-400 cursor-pointer shadow-sm"
                  >
                    Guardar
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">
                    Nombre Sala / Espacio
                  </label>
                  <input
                    type="text"
                    value={editedLeadInfo.nombre_sala || ''}
                    onChange={(e) =>
                      setEditedLeadInfo({ ...editedLeadInfo, nombre_sala: e.target.value })
                    }
                    className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">
                      Contacto
                    </label>
                    <input
                      type="text"
                      value={editedLeadInfo.contacto_nombre || ''}
                      onChange={(e) =>
                        setEditedLeadInfo({ ...editedLeadInfo, contacto_nombre: e.target.value })
                      }
                      className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editedLeadInfo.email_contacto || ''}
                      onChange={(e) =>
                        setEditedLeadInfo({ ...editedLeadInfo, email_contacto: e.target.value })
                      }
                      className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={editedLeadInfo.telefono || ''}
                      onChange={(e) =>
                        setEditedLeadInfo({ ...editedLeadInfo, telefono: e.target.value })
                      }
                      className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">
                      Aforo
                    </label>
                    <input
                      type="number"
                      value={editedLeadInfo.aforo || 0}
                      onChange={(e) =>
                        setEditedLeadInfo({ ...editedLeadInfo, aforo: Number(e.target.value) })
                      }
                      className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pitch Generator Section */}
          <div className="bg-[#1A1918] rounded-xl p-4 space-y-3 border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-sans uppercase text-amber-400 tracking-wider">
                Propuesta de Pitch Redactada
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyPitch}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[11px] text-zinc-200 font-sans flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedPitch ? '¡Copiado!' : 'Copiar'}</span>
                </button>

                {selectedLead.estado === 'pendiente_aprobacion' || selectedLead.estado === 'nuevo' ? (
                  <button
                    type="button"
                    onClick={handleApprovePitchDirectly}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-xs flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aprobar Pitch</span>
                  </button>
                ) : null}
              </div>
            </div>

            {isEditingPitch ? (
              <div className="space-y-2">
                <textarea
                  rows={6}
                  value={editedPitch}
                  onChange={(e) => setEditedPitch(e.target.value)}
                  className="w-full p-3 bg-black/60 rounded-xl border border-amber-500/50 text-xs text-zinc-100 font-sans focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingPitch(false)}
                    className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded text-xs hover:bg-zinc-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSavePitch}
                    className="px-3 py-1 bg-amber-500 text-black font-bold rounded text-xs hover:bg-amber-400 cursor-pointer"
                  >
                    Guardar y Aprobar
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  setEditedPitch(selectedLead.pitch_generado || '');
                  setIsEditingPitch(true);
                }}
                className="p-3 bg-[#121110] rounded-xl border border-zinc-800 text-xs text-zinc-200 font-sans whitespace-pre-wrap leading-relaxed cursor-pointer hover:border-amber-500/40 transition-colors group relative"
              >
                {selectedLead.pitch_generado || 'Sin pitch generado.'}
                <span className="absolute bottom-2 right-2 text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  Clic para editar ✏️
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EMAIL THREAD & REPLY SIMULATION */}
      {activeTab === 'emails' && (
        <div className="space-y-3">
          {(selectedLead.hilo_emails || []).length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-[#1A1918] border border-zinc-800 text-zinc-400 text-xs italic">
              No hay correos registrados en el historial de esta sala aún.
            </div>
          ) : (
            (selectedLead.hilo_emails || []).map((msg) => (
              <div
                key={msg.id}
                className={`p-3.5 rounded-xl border space-y-1.5 text-xs font-sans ${
                  msg.remitente === 'sala'
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-100'
                    : 'bg-[#121110] border-zinc-800 text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-[11px]">
                  <span className={msg.remitente === 'sala' ? 'text-amber-400' : 'text-sky-400'}>
                    {msg.remitente_nombre} ({msg.remitente === 'sala' ? 'Programador' : 'Bakandeya'})
                  </span>
                  <span className="text-zinc-500 text-[10px] font-mono">{msg.fecha}</span>
                </div>
                <div className="font-bold text-zinc-100">{msg.asunto}</div>
                <p className="whitespace-pre-wrap text-zinc-300 leading-snug">{msg.mensaje}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: CONTACT BITÁCORA */}
      {activeTab === 'bitacora' && (
        <div className="bg-[#1A1918] rounded-xl p-4 space-y-3 border border border-amber-500/20">
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
          <form
            onSubmit={handleAddInteractionLog}
            className="space-y-3 bg-[#121110] p-3 rounded-xl border border-zinc-800"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Interaction Type Selector */}
              <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-zinc-800">
                {(['Llamada', 'WhatsApp', 'Email', 'Reunión', 'Otro'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setInteractionType(type)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      interactionType === type
                        ? 'bg-[#eab308] text-black font-bold shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {type === 'Llamada'
                      ? '📞'
                      : type === 'WhatsApp'
                      ? '💬'
                      : type === 'Email'
                      ? '✉️'
                      : type === 'Reunión'
                      ? '🤝'
                      : '📝'}{' '}
                    {type}
                  </button>
                ))}
              </div>

              {/* Author input */}
              <input
                type="text"
                value={interactionAutor}
                onChange={(e) => setInteractionAutor(e.target.value)}
                placeholder="Tu nombre..."
                className="px-2 py-1 text-[10px] bg-zinc-900 border border-zinc-800 rounded text-neutral-300 w-28 focus:outline-none"
              />
            </div>

            {/* Result Outcome Pills */}
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-sans">
                Resultado del contacto:
              </span>
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    'Interesado',
                    'Enviar propuesta',
                    'Seguimiento pendiente',
                    'Acuerdo cerrado',
                    'Rechazado',
                    'Info recibida'
                  ] as const
                ).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setInteractionResultado(res)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                      interactionResultado === res
                        ? res === 'Interesado' || res === 'Acuerdo cerrado'
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/60 font-bold'
                          : res === 'Rechazado'
                          ? 'bg-rose-500/30 text-rose-300 border border-rose-500/60 font-bold'
                          : 'bg-sky-500/30 text-sky-300 border border-sky-500/60 font-bold'
                        : 'bg-zinc-900 text-neutral-400 hover:text-white border border-zinc-800'
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
              placeholder="Ej: Hablé con Carlos por WhatsApp. Pide propuesta de fechas para Noviembre..."
              className="w-full bg-black/50 rounded-lg p-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 resize-none font-sans"
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
              <p className="text-[11px] text-zinc-500 italic text-center py-3">
                No hay llamadas ni mensajes registrados aún para esta sala.
              </p>
            ) : (
              (selectedLead.historial_contacto || []).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-[#121110] border border-zinc-800 space-y-1.5 text-xs font-sans relative group"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300">
                        {log.tipo === 'Llamada'
                          ? '📞 Llamada'
                          : log.tipo === 'WhatsApp'
                          ? '💬 WhatsApp'
                          : log.tipo === 'Email'
                          ? '✉️ Email'
                          : log.tipo === 'Reunión'
                          ? '🤝 Reunión'
                          : '📝 Nota'}
                      </span>
                      <span className="text-zinc-400">{log.autor || 'Agente'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 font-mono">{log.fecha}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteInteractionLog(log.id)}
                        className="text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                        title="Borrar entrada"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {log.resultado && (
                    <div>
                      <span
                        className={`inline-block text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          log.resultado === 'Interesado' || log.resultado === 'Acuerdo cerrado'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : log.resultado === 'Rechazado'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-sky-500/20 text-sky-400'
                        }`}
                      >
                        {log.resultado}
                      </span>
                    </div>
                  )}

                  <p className="text-zinc-200 text-[11px] leading-snug whitespace-pre-wrap select-text">
                    {log.notas}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
