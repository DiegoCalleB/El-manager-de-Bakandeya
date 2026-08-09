import React, { useState, useEffect } from 'react';
import { 
  Bot, ShieldCheck, Sliders, CheckCircle2, AlertTriangle, X, Sparkles, 
  Send, FileEdit, Clock, Euro, Calendar, Lock, ShieldAlert, ArrowRight, Save, Loader2
} from 'lucide-react';
import { api } from '../../services/api';

export type DispatchAutonomyLevel = 'draft_only' | 'scheduled_window' | 'autonomous_first_contact';
export type NegotiationDepthLevel = 'outreach_only' | 'filter_conditions' | 'advanced_negotiation';

export interface AgentAutonomyConfig {
  dispatchLevel: DispatchAutonomyLevel;
  negotiationDepth: NegotiationDepthLevel;
  minCacheThreshold: number;
  maxCacheThreshold: number;
  autoDeclineUnderMinCache: boolean;
  notifyOnEveryProposal: boolean;
  requireHumanForFinalSignOff: boolean; // Siempre true por regla de negocio
}

interface AgentAutonomySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bandName?: string;
  initialConfig?: Partial<AgentAutonomyConfig>;
  onSaveConfig?: (config: AgentAutonomyConfig) => void;
}

export const AgentAutonomySettingsModal: React.FC<AgentAutonomySettingsModalProps> = ({
  isOpen,
  onClose,
  bandName = 'Tu Banda',
  initialConfig,
  onSaveConfig
}) => {
  const [config, setConfig] = useState<AgentAutonomyConfig>({
    dispatchLevel: initialConfig?.dispatchLevel || 'draft_only',
    negotiationDepth: initialConfig?.negotiationDepth || 'filter_conditions',
    minCacheThreshold: initialConfig?.minCacheThreshold || 300,
    maxCacheThreshold: initialConfig?.maxCacheThreshold || 800,
    autoDeclineUnderMinCache: initialConfig?.autoDeclineUnderMinCache ?? false,
    notifyOnEveryProposal: initialConfig?.notifyOnEveryProposal ?? true,
    requireHumanForFinalSignOff: true // Regla fija
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsLoading(true);
    api.getAutonomyConfig()
      .then((serverConfig) => {
        if (isMounted && serverConfig && serverConfig.dispatchLevel) {
          setConfig({
            dispatchLevel: serverConfig.dispatchLevel || 'draft_only',
            negotiationDepth: serverConfig.negotiationDepth || 'filter_conditions',
            minCacheThreshold: serverConfig.minCacheThreshold ?? 300,
            maxCacheThreshold: serverConfig.maxCacheThreshold ?? 800,
            autoDeclineUnderMinCache: !!serverConfig.autoDeclineUnderMinCache,
            notifyOnEveryProposal: serverConfig.notifyOnEveryProposal !== false,
            requireHumanForFinalSignOff: true
          });
          try {
            localStorage.setItem('bakandeya_agent_autonomy', JSON.stringify(serverConfig));
          } catch (e) {}
        }
      })
      .catch((err) => {
        console.warn('Notice fetching autonomy config from server:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('bakandeya_agent_autonomy', JSON.stringify(config));
      window.dispatchEvent(new Event('autonomy-settings-changed'));
      
      // Persist in Google Sheets & Backend Database
      await api.updateAutonomyConfig(config);
    } catch (e) {
      console.error("Error saving autonomy config to API/Sheets:", e);
    } finally {
      setIsSaving(false);
    }

    if (onSaveConfig) onSaveConfig(config);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#181716] border border-amber-500/30 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 bg-[#141312] border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-display uppercase tracking-wider text-zinc-100">
                  Nivel de Autonomía y Negociación AI
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                  Agentes Python
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Configura los límites de actuación para el Mánager AI y el Agente Redactor de <span className="text-amber-400 font-bold">{bandName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* REGLA NO NEGOCIABLE NOTICE */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <strong className="font-bold text-amber-300">Garantía de Control Humano (Cierre Inviolable):</strong>
              <p className="text-neutral-300 text-[11px]">
                Incluso con la máxima autonomía, <strong className="text-white">ningún trato o contrato se da por cerrado ni ningún email final de confirmación se envía sin la validación previa del mánager</strong> o un miembro de {bandName}.
              </p>
            </div>
          </div>

          {/* DIMENSIÓN 1: MODO DE ENVÍO Y APROBACIÓN */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Send className="w-4 h-4" /> 1. Autonomía de Envío (Modo de Ejecución)
              </h4>
              <span className="text-[10px] text-neutral-500 font-mono">¿Cuándo se envían los correos?</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Draft Only */}
              <button
                type="button"
                onClick={() => setConfig({ ...config, dispatchLevel: 'draft_only' })}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  config.dispatchLevel === 'draft_only'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                    : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-zinc-200 hover:bg-neutral-900'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FileEdit className="w-5 h-5 text-amber-400" />
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      100% Manual
                    </span>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold font-display text-zinc-100">Borrador & Aprobación</h5>
                    <p className="text-[11px] text-neutral-400 font-sans mt-1 leading-snug">
                      Todos los correos generados se guardan como borrador en la pestaña <strong className="text-zinc-200">Pendiente de Aprobación</strong>. Requiere clic directo.
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-mono font-semibold text-amber-400/90 pt-2 border-t border-neutral-800/80">
                  Ideal para empezar con la app.
                </div>
              </button>

              {/* Scheduled Window */}
              <button
                type="button"
                onClick={() => setConfig({ ...config, dispatchLevel: 'scheduled_window' })}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  config.dispatchLevel === 'scheduled_window'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                    : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-zinc-200 hover:bg-neutral-900'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
                      Ventana 3h
                    </span>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold font-display text-zinc-100">Envío con Retardo (3h)</h5>
                    <p className="text-[11px] text-neutral-400 font-sans mt-1 leading-snug">
                      El agente prepara la respuesta y avisa. Si en 3 horas no la cancelas o editas, el sistema la envía automáticamente.
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-mono font-semibold text-sky-400/90 pt-2 border-t border-neutral-800/80">
                  Agiliza respuestas sin bloquear.
                </div>
              </button>

              {/* Autonomous First Contact */}
              <button
                type="button"
                onClick={() => setConfig({ ...config, dispatchLevel: 'autonomous_first_contact' })}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  config.dispatchLevel === 'autonomous_first_contact'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                    : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-zinc-200 hover:bg-neutral-900'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Bot className="w-5 h-5 text-amber-400" />
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      Autónomo Inicial
                    </span>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold font-display text-zinc-100">Pitch Inicial Automático</h5>
                    <p className="text-[11px] text-neutral-400 font-sans mt-1 leading-snug">
                      El primer contacto de presentación (Scout) se envía directamente a salas compatibles. Las respuestas posteriores pasan a borrador.
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-mono font-semibold text-emerald-400/90 pt-2 border-t border-neutral-800/80">
                  Máxima velocidad de prospección.
                </div>
              </button>
            </div>
          </div>

          {/* DIMENSIÓN 2: ALCANCE DE NEGOCIACIÓN */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Bot className="w-4 h-4" /> 2. Alcance de Negociación del Mánager AI
              </h4>
              <span className="text-[10px] text-neutral-500 font-mono">¿Qué temas puede tratar?</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Outreach Only */}
              <button
                type="button"
                onClick={() => setConfig({ ...config, negotiationDepth: 'outreach_only' })}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  config.negotiationDepth === 'outreach_only'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                    : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-zinc-200 hover:bg-neutral-900'
                }`}
              >
                <div className="space-y-2">
                  <span className="text-[9px] font-mono uppercase tracking-widest font-bold text-amber-400">Nivel A</span>
                  <h5 className="text-sm font-bold font-display text-zinc-100">Solo "Llamada a la puerta"</h5>
                  <p className="text-[11px] text-neutral-400 font-sans leading-snug">
                    El agente solo saluda y envía el Dossier EPK. En cuanto la sala responde con cualquier duda de precio o fecha, el bot se detiene y pasa el control al humano.
                  </p>
                </div>
              </button>

              {/* Filter & Conditions */}
              <button
                type="button"
                onClick={() => setConfig({ ...config, negotiationDepth: 'filter_conditions' })}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  config.negotiationDepth === 'filter_conditions'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                    : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-zinc-200 hover:bg-neutral-900'
                }`}
              >
                <div className="space-y-2">
                  <span className="text-[9px] font-mono uppercase tracking-widest font-bold text-sky-400">Nivel B</span>
                  <h5 className="text-sm font-bold font-display text-zinc-100">Filtro de Requisitos & Fechas</h5>
                  <p className="text-[11px] text-neutral-400 font-sans leading-snug">
                    Responde preguntas sobre disponibilidad de calendario y rider técnico. Confirma si la sala ofrece taquilla/caché dentro de tus límites configurables.
                  </p>
                </div>
              </button>

              {/* Advanced Negotiation */}
              <button
                type="button"
                onClick={() => setConfig({ ...config, negotiationDepth: 'advanced_negotiation' })}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  config.negotiationDepth === 'advanced_negotiation'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                    : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-zinc-200 hover:bg-neutral-900'
                }`}
              >
                <div className="space-y-2">
                  <span className="text-[9px] font-mono uppercase tracking-widest font-bold text-purple-400">Nivel C</span>
                  <h5 className="text-sm font-bold font-display text-zinc-100">Negociador hasta Pre-Cierre</h5>
                  <p className="text-[11px] text-neutral-400 font-sans leading-snug">
                    Ofrece alternativas de fechas si hay solapamiento y propone contraofertas dentro de tu rango de caché predeterminado. Deja el trato listo para firma.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* PARÁMETROS ECONÓMICOS Y LÍMITES */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Euro className="w-4 h-4" /> Umbrales Económicos de Negociación para {bandName}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 font-semibold block">
                  Caché Mínimo Aceptable (€)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={config.minCacheThreshold}
                    onChange={(e) => setConfig({ ...config, minCacheThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-zinc-100 text-xs font-mono focus:border-amber-500 focus:outline-none"
                    placeholder="300"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-neutral-500 font-mono">EUR</span>
                </div>
                <p className="text-[10px] text-neutral-500">
                  Si una sala ofrece menos de esto, el agente no aceptará sin tu permiso.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 font-semibold block">
                  Caché Objetivo / Ideal (€)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={config.maxCacheThreshold}
                    onChange={(e) => setConfig({ ...config, maxCacheThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-zinc-100 text-xs font-mono focus:border-amber-500 focus:outline-none"
                    placeholder="800"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-neutral-500 font-mono">EUR</span>
                </div>
                <p className="text-[10px] text-neutral-500">
                  Cifra inicial que el agente utilizará en la primera propuesta.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-300 font-sans">
                <input
                  type="checkbox"
                  checked={config.autoDeclineUnderMinCache}
                  onChange={(e) => setConfig({ ...config, autoDeclineUnderMinCache: e.target.checked })}
                  className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
                />
                <span>Rechazar amablemente si la sala no llega al caché mínimo</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-neutral-300 font-sans">
                <input
                  type="checkbox"
                  checked={config.notifyOnEveryProposal}
                  onChange={(e) => setConfig({ ...config, notifyOnEveryProposal: e.target.checked })}
                  className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
                />
                <span>Notificar en el panel cada vez que se prepare un correo</span>
              </label>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#141312] border-t border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Regla Inviolable: Cierre siempre por humano</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 text-zinc-300 text-xs font-mono font-bold hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-5 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-mono font-bold hover:bg-amber-400 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                  <span>Guardando en Google Sheets...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                  <span>¡Configuración Guardada!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Ajustes</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
