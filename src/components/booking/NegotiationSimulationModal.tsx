import React from 'react';
import { Sparkles, X, Building, Users, Loader2, Check } from 'lucide-react';
import { Lead } from '../../types';

interface PredefinedScenario {
  key: string;
  label: string;
  defaultInstruction?: string;
  customText?: string;
}

interface PredefinedScenarios {
  sala: PredefinedScenario[];
  banda: PredefinedScenario[];
}

interface NegotiationSimulationModalProps {
  isOpen: boolean;
  selectedLead: Lead | null;
  isStitchLight: boolean;
  textSub: string;
  textMuted: string;
  simulationRole: 'sala' | 'banda';
  simulationScenario: string;
  simulationSenderName: string;
  simulationSubject: string;
  simulationCustomInstruction: string;
  simulationMessage: string;
  simulationGenerated: boolean;
  isGeneratingSimulation: boolean;
  predefinedScenarios: PredefinedScenarios;
  onClose: () => void;
  onRoleChange: (role: 'sala' | 'banda') => void;
  onScenarioChange: (scenarioKey: string) => void;
  onSenderNameChange: (val: string) => void;
  onSubjectChange: (val: string) => void;
  onCustomInstructionChange: (val: string) => void;
  onMessageChange: (val: string) => void;
  onGenerate: () => void;
  onCommit: () => void;
}

export function NegotiationSimulationModal({
  isOpen,
  selectedLead,
  isStitchLight,
  textSub,
  textMuted,
  simulationRole,
  simulationScenario,
  simulationSenderName,
  simulationSubject,
  simulationCustomInstruction,
  simulationMessage,
  simulationGenerated,
  isGeneratingSimulation,
  predefinedScenarios,
  onClose,
  onRoleChange,
  onScenarioChange,
  onSenderNameChange,
  onSubjectChange,
  onCustomInstructionChange,
  onMessageChange,
  onGenerate,
  onCommit,
}: NegotiationSimulationModalProps) {
  if (!isOpen || !selectedLead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-2xl p-5 rounded-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
          isStitchLight ? 'bg-white text-slate-800' : 'bg-[#18181b] text-[#e5e2e1]'
        }`}
      >
        <div className="flex justify-between items-start border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#d1b375]/80 animate-pulse" />
              <h3 className="text-sm font-bold font-display uppercase tracking-widest">
                Simulador de Negociación Personalizado
              </h3>
            </div>
            <p className={`text-[10px] font-sans mt-0.5 ${textMuted}`}>
              Trato actual con{' '}
              <strong className="text-[#d1b375]/80 dark:text-[#f2ca50]">
                {selectedLead.nombre_sala}
              </strong>{' '}
              ({selectedLead.ciudad}) — Estado: {selectedLead.estado}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded-full transition-colors cursor-pointer hover:bg-neutral-800/10 dark:hover:bg-neutral-800 ${textSub}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 select-text">
          {/* Role selector buttons */}
          <div className="space-y-1.5">
            <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>
              ¿Quién emite la respuesta simulada?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onRoleChange('sala')}
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
                onClick={() => onRoleChange('banda')}
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
            <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>
              Instrucciones de Situación / Pauta Inicial
            </label>
            <select
              value={simulationScenario}
              onChange={(e) => onScenarioChange(e.target.value)}
              className={`w-full rounded-lg px-2 py-1 text-[10px] focus:outline-none font-sans ${
                isStitchLight
                  ? 'bg-white text-slate-800 focus:border-indigo-500'
                  : 'bg-[#1c1b1b] text-[#e5e2e1] focus:border-[#f2ca50]'
              }`}
            >
              {(simulationRole === 'sala'
                ? predefinedScenarios.sala
                : predefinedScenarios.banda
              ).map((sc) => (
                <option key={sc.key} value={sc.key}>
                  {sc.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sender Name & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>
                Nombre del Emisor
              </label>
              <input
                type="text"
                value={simulationSenderName}
                onChange={(e) => onSenderNameChange(e.target.value)}
                placeholder="Ej. Kike (Sala Hebe) o Bakandeya Agent Manager IA"
                className={`w-full rounded-lg px-2 py-1 text-[10px] focus:outline-none font-sans ${
                  isStitchLight
                    ? 'bg-white text-slate-800 focus:border-indigo-500'
                    : 'bg-[#1c1b1b] text-[#e5e2e1] focus:border-[#f2ca50]'
                }`}
              />
            </div>
            <div className="space-y-1.5">
              <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>
                Asunto del Correo
              </label>
              <input
                type="text"
                value={simulationSubject}
                onChange={(e) => onSubjectChange(e.target.value)}
                placeholder="Ej. Re: Propuesta..."
                className={`w-full rounded-lg px-2 py-1 text-[10px] focus:outline-none font-sans ${
                  isStitchLight
                    ? 'bg-white text-slate-800 focus:border-indigo-500'
                    : 'bg-[#1c1b1b] text-[#e5e2e1] focus:border-[#f2ca50]'
                }`}
              />
            </div>
          </div>

          {/* Simulation Instructions Prompt Area */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>
                Instrucciones Detalladas de Negociación para la IA
              </label>
              <span className={`text-[10px] font-sans ${textMuted}`}>
                Cualquier cambio aquí personalizará el correo
              </span>
            </div>
            <textarea
              rows={3}
              value={simulationCustomInstruction}
              onChange={(e) => onCustomInstructionChange(e.target.value)}
              placeholder="Define pautas específicas (ej. propone taquilla 60/40, exige rider técnico especial, etc.)..."
              className={`w-full rounded-lg p-2.5 text-[10px] focus:outline-none font-sans leading-relaxed ${
                isStitchLight
                  ? 'bg-white text-slate-800 focus:border-indigo-500'
                  : 'bg-[#1c1b1b] text-[#e5e2e1] focus:border-[#f2ca50]'
              }`}
            />
          </div>

          {/* Generate Button */}
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={onGenerate}
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
            <div className="space-y-2 border-t border-neutral-200 dark:border-neutral-800 pt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center">
                <label
                  className={`block text-[10px] uppercase font-sans tracking-wider ${
                    isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'
                  }`}
                >
                  ✨ Vista Previa del Correo Generado (Editable)
                </label>
                <span className="text-[10px] font-sans uppercase bg-[#10b981]/15 text-[#10b981]/80 px-2 py-1 rounded">
                  Listo para Ajustar
                </span>
              </div>
              <textarea
                rows={6}
                value={simulationMessage}
                onChange={(e) => onMessageChange(e.target.value)}
                className={`w-full rounded-lg p-3 text-[10px] focus:outline-none font-sans leading-relaxed ${
                  isStitchLight
                    ? 'bg-sky-500/15 text-slate-800'
                    : 'bg-neutral-900 text-neutral-200'
                }`}
              />
              <p className={`text-[10px] font-sans ${textMuted} leading-tight`}>
                💡 Tip: Puedes retocar el texto directamente para añadir detalles personalizados
                específicos antes de confirmarlo.
              </p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3.5 border-t border-neutral-200 dark:border-neutral-800 pt-3 mt-1">
          <button
            type="button"
            onClick={onClose}
            className={`px-2 py-1 rounded-lg font-sans text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
              isStitchLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400'
            }`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onCommit}
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
  );
}
