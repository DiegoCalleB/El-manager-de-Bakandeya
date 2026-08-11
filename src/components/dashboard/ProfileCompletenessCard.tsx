import React, { useState } from 'react';
import { EPKConfig, Lead, Concert, Rehearsal, SocialMetric, Fan, Tour } from '../../types';
import { 
  Sparkles, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, 
  HelpCircle, ChevronDown, ChevronUp, Bot, FileText, Disc3, Calendar,
  Activity, Heart, Truck, X, BookOpen, Layers, Sliders
} from 'lucide-react';

interface ProfileCompletenessCardProps {
  epkConfig?: Partial<EPKConfig>;
  leads: Lead[];
  concerts: Concert[];
  rehearsals: Rehearsal[];
  metrics: SocialMetric[];
  fans?: Fan[];
  tours?: Tour[];
  isStitchLight?: boolean;
  bandName?: string;
  onNavigate?: (view: any, options?: any) => void;
  onOpenAutonomyModal?: () => void;
}

export const ProfileCompletenessCard: React.FC<ProfileCompletenessCardProps> = ({
  epkConfig,
  leads = [],
  concerts = [],
  rehearsals = [],
  metrics = [],
  fans = [],
  tours = [],
  isStitchLight = false,
  bandName = 'Tu Banda',
  onNavigate,
  onOpenAutonomyModal
}) => {
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Read stored songs from localStorage safely
  const storedSongsCount = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('bakandeya_songs_catalog') || localStorage.getItem('bakandeya_songs');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.length;
      }
      return 0;
    } catch {
      return 0;
    }
  }, []);

  const storedSetlistsCount = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('bakandeya_setlists_data') || localStorage.getItem('bakandeya_setlists');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.length;
      }
      return 0;
    } catch {
      return 0;
    }
  }, []);

  // Compute profile completeness pillars
  const pillars = React.useMemo(() => {
    const hasBio = Boolean(
      epkConfig?.biografia && 
      epkConfig.biografia.trim().length >= 80 && 
      !epkConfig.biografia.toLowerCase().includes('por definir') &&
      !epkConfig.biografia.includes('Propuesta musical en directo')
    );
    const hasPhotoLogo = Boolean(epkConfig?.logoUrl || (epkConfig?.bandPhotos && epkConfig.bandPhotos.length > 0));
    const hasDossierPdf = Boolean(
      (epkConfig?.dossierPdfUrl && epkConfig.dossierPdfUrl.trim().length > 5) || 
      (epkConfig?.dossierDocumentUrl && epkConfig.dossierDocumentUrl.trim().length > 5) || 
      (epkConfig?.dossierTextoExtra && epkConfig.dossierTextoExtra.trim().length >= 80 && !epkConfig.dossierTextoExtra.toLowerCase().includes('por definir'))
    );
    const hasRiderPdf = Boolean(
      (epkConfig?.riderPdfUrl && epkConfig.riderPdfUrl.trim().length > 5) || 
      (epkConfig?.riderTecnico && epkConfig.riderTecnico.trim().length >= 80 && !epkConfig.riderTecnico.toLowerCase().includes('por definir'))
    );
    const hasLeads = leads.length > 0;
    const hasVerifiedEmails = leads.some(l => l.email_contacto && l.email_contacto.includes('@'));
    const hasSongs = storedSongsCount > 0;
    const hasAgenda = concerts.length > 0 || rehearsals.length > 0;
    const hasMetrics = metrics.length > 0;
    const hasFans = fans.length > 0 || Boolean(epkConfig?.incentivoFans?.enlaceDescarga || epkConfig?.incentivoFans?.codigoDescuento);

    return [
      {
        id: 'epk_bio',
        title: 'Biografía & Logo (EPK)',
        completed: hasBio && hasPhotoLogo,
        weight: 10,
        view: 'epk',
        missingLabel: 'Rellenar Bio (mín 80 chars)',
        agentImpact: 'El Agente Redactor usa la Bio e identidad de la banda para los emails de presentación.'
      },
      {
        id: 'dossier_pdf',
        title: 'Dossier Promocional PDF',
        completed: hasDossierPdf,
        weight: 15,
        view: 'epk',
        missingLabel: 'Subir Dossier (mín 80 chars)',
        agentImpact: 'Los programadores de salas solicitan el Dossier PDF adjunto para valorar el proyecto de un vistazo.'
      },
      {
        id: 'rider_pdf',
        title: 'Rider Técnico / Input List',
        completed: hasRiderPdf,
        weight: 15,
        view: 'epk',
        missingLabel: 'Subir Rider (mín 80 chars)',
        agentImpact: 'Las salas necesitan confirmar qué microfonía y líneas requiere la banda antes de reservar fecha.'
      },
      {
        id: 'leads',
        title: 'Directorio de Booking & Salas',
        completed: hasLeads && hasVerifiedEmails,
        weight: 20,
        view: 'booking',
        missingLabel: 'Añadir Salas / Scout',
        agentImpact: 'Scout y el Redactor usan los contactos en Hoja para enviar campañas automáticas de booking.'
      },
      {
        id: 'repertorio',
        title: 'Discografía & Repertorio',
        completed: hasSongs,
        weight: 15,
        view: 'repertorio',
        missingLabel: 'Cargar Canciones',
        agentImpact: 'Permite al Mánager AI crear setlists ajustados exactamente al tiempo de show permitido (45m, 60m, 90m).'
      },
      {
        id: 'agenda',
        title: 'Agenda & Conciertos',
        completed: hasAgenda,
        weight: 10,
        view: 'calendario',
        missingLabel: 'Agendar Evento',
        agentImpact: 'El bot verifica huecos libres en tu calendario antes de proponer fechas a las salas.'
      },
      {
        id: 'metrics_fans',
        title: 'Métricas & Comunidad Fans',
        completed: hasMetrics || hasFans,
        weight: 15,
        view: 'reels',
        missingLabel: 'Métricas / Regalo Fans',
        agentImpact: 'El agente utiliza tus seguidores y escuchas en Spotify como argumento de venta de entradas.'
      }
    ];
  }, [epkConfig, leads, storedSongsCount, concerts, rehearsals, metrics, fans]);

  const totalCompletedWeight = pillars.reduce((acc, p) => p.completed ? acc + p.weight : acc, 0);
  const totalPossibleWeight = pillars.reduce((acc, p) => acc + p.weight, 0);
  const percentage = Math.min(100, Math.round((totalCompletedWeight / totalPossibleWeight) * 100));

  const getStatusBadge = () => {
    if (percentage >= 85) return { label: 'Perfil Optimizado (100% Agéntico)', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (percentage >= 50) return { label: 'Perfil Intermedio', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    return { label: 'Perfil Inicial (Requiere Datos)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
  };

  const badgeInfo = getStatusBadge();

  return (
    <div className={`p-5 rounded-2xl transition-all border shadow-lg ${
      isStitchLight 
        ? 'bg-gradient-to-br from-slate-50 via-white to-slate-100 border-slate-200 text-slate-800' 
        : 'bg-gradient-to-br from-[#1c1a18] via-[#141312] to-[#0d0c0b] border-amber-500/20 text-zinc-100'
    }`}>
      {/* Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-amber-500/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-zinc-100">
                Salud del Perfil para Agentes AI
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${badgeInfo.color}`}>
                {badgeInfo.label}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 font-sans">
              Cuanto más completo esté el perfil de <span className="text-amber-400 font-bold">{bandName}</span>, mejor negociarán el Chatbot y los Agentes de Booking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end flex-wrap">
          <button
            onClick={() => onOpenAutonomyModal && onOpenAutonomyModal()}
            className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>Autonomía AI</span>
          </button>

          <button
            onClick={() => setShowAuditModal(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Auditoría AI</span>
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
            title="Expandir/colapsar checklist"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar Row */}
      <div className="pt-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-400 uppercase tracking-wider font-bold">
            Completado: <strong className="text-amber-400">{percentage}%</strong>
          </span>
          <span className="text-neutral-500">
            {pillars.filter(p => p.completed).length} de {pillars.length} pilares listos
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-neutral-950 p-0.5 border border-neutral-800 overflow-hidden relative">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-emerald-400 transition-all duration-700 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Pill Quick Grid */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {pillars.map(pillar => (
          <button
            key={pillar.id}
            onClick={() => onNavigate && onNavigate(pillar.view)}
            className={`p-2 rounded-xl text-left transition-all border flex flex-col justify-between gap-1.5 cursor-pointer group hover:scale-[1.02] ${
              pillar.completed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-200 hover:bg-amber-500/20'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono font-bold truncate">{pillar.title.split(' ')[0]}</span>
              {pillar.completed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
              )}
            </div>

            <span className={`text-[9px] font-mono font-semibold truncate ${
              pillar.completed ? 'text-emerald-400/80' : 'text-amber-400 group-hover:underline'
            }`}>
              {pillar.completed ? 'Listo' : pillar.missingLabel}
            </span>
          </button>
        ))}
      </div>

      {/* Detailed Accordion Section if Expanded */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-amber-500/10 space-y-3 animate-in fade-in duration-200">
          <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-amber-400">
            Checklist de Preparación para Agentes
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
            {pillars.map(pillar => (
              <div 
                key={`exp-${pillar.id}`}
                className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                  pillar.completed ? 'bg-neutral-900/60 border-neutral-800' : 'bg-amber-500/5 border-amber-500/20'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {pillar.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="font-bold text-zinc-100">{pillar.title}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    {pillar.agentImpact}
                  </p>
                </div>

                {!pillar.completed && (
                  <button
                    onClick={() => onNavigate && onNavigate(pillar.view)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 font-mono font-bold text-[10px] shrink-0 hover:bg-amber-400 transition-colors cursor-pointer"
                  >
                    Ir
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUDIT MODAL */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#181716] border border-amber-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display uppercase tracking-wider text-zinc-100">
                    ¿Por qué importa completar el Perfil de {bandName}?
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono">
                    Cómo funcionan autónomamente los 4 agentes Python con tu información
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-zinc-300 font-sans leading-relaxed">
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                <h4 className="font-bold text-amber-400 flex items-center gap-2 text-sm font-display">
                  <Bot className="w-4 h-4" /> 1. Agente Scout (Búsqueda e Investigación de Salas)
                </h4>
                <p>
                  Busca automáticamente salas, festivales y fiestas patronales en las regiones que solicites. Utiliza tu género musical (<strong className="text-zinc-100">Ska / Reggae / Mestizaje</strong>) y tu aforo promedio para descartar recintos incompatibles.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                <h4 className="font-bold text-amber-400 flex items-center gap-2 text-sm font-display">
                  <FileText className="w-4 h-4" /> 2. Agente Redactor (Redacción de Pitches de Booking)
                </h4>
                <p>
                  Redacta automáticamente las propuestas por correo para las salas. Extrae párrafos clave de tu <strong className="text-zinc-100">Biografía</strong>, adjunta el enlace a tu <strong className="text-zinc-100">Dossier PDF</strong> y menciona tu récord de aforo o número de seguidores en redes.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                <h4 className="font-bold text-amber-400 flex items-center gap-2 text-sm font-display">
                  <Disc3 className="w-4 h-4" /> 3. Agente Mánager AI (Chatbot y Negociación de Fechas)
                </h4>
                <p>
                  Cuando una sala responde solicitando fecha, caché o rider técnico, el Mánager AI consulta tu <strong className="text-zinc-100">Rider Técnico</strong> y tu <strong className="text-zinc-100">Calendario</strong> para proponer opciones sin solapar ensayos ni otros bolos.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                <h4 className="font-bold text-amber-400 flex items-center gap-2 text-sm font-display">
                  <Heart className="w-4 h-4" /> 4. Agente Lector de Bandeja (Clasificación de Correos)
                </h4>
                <p>
                  Monitoriza las respuestas recibidas en la bandeja de entrada y clasifica si el programador está interesado, si pide presupuesto o si rechaza la propuesta.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold font-mono text-xs hover:bg-amber-400 transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
