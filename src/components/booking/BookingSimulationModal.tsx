import React, { useState } from 'react';
import { Lead, ThemeColors } from '../../types';
import { apiFetch } from '../../utils/api';
import { Bot, Sparkles, X, Play, CheckCircle2 } from 'lucide-react';

interface BookingSimulationModalProps {
  colors: ThemeColors;
  lead: Lead;
  onClose: () => void;
  onCommit: (
    simulationRole: string,
    senderName: string,
    subject: string,
    message: string
  ) => void;
}

export const BookingSimulationModal: React.FC<BookingSimulationModalProps> = ({
  colors,
  lead,
  onClose,
  onCommit,
}) => {
  const [simulationRole, setSimulationRole] = useState<'sala' | 'banda'>('sala');
  const [simulationScenario, setSimulationScenario] = useState('taquilla');
  const [simulationSenderName, setSimulationSenderName] = useState(
    `Programador de ${lead.nombre_sala}`
  );
  const [simulationSubject, setSimulationSubject] = useState(
    lead.hilo_emails && lead.hilo_emails.length > 0
      ? `RE: ${lead.hilo_emails[lead.hilo_emails.length - 1].asunto}`
      : 'Re: Propuesta de concierto - Bakandeya'
  );
  const [simulationCustomInstruction, setSimulationCustomInstruction] = useState(
    'La sala muestra gran interés por el directo. Propone una fecha de viernes o sábado de noviembre, un reparto de taquilla del 70/30 a favor de la banda, y entradas a 12€.'
  );
  const [simulationMessage, setSimulationMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [simulationGenerated, setSimulationGenerated] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await apiFetch('/api/generate-simulated-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          role: simulationRole,
          scenario: simulationScenario,
          customInstruction: simulationCustomInstruction,
          senderName: simulationSenderName,
        }),
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
      setIsGenerating(false);
    }
  };

  const handleCommit = () => {
    if (!simulationMessage) return;
    onCommit(
      simulationRole,
      simulationSenderName,
      simulationSubject,
      simulationMessage
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <div
          className="p-5 border-b flex items-center justify-between"
          style={{ borderColor: colors.border }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: colors.text }}>
                Simulador de Correo Entrante / Saliente
              </h3>
              <p className="text-xs text-slate-400">
                Genera una respuesta realista con IA para probar el flujo de hilo de correos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Rol del Remitente</label>
              <select
                value={simulationRole}
                onChange={(e) => {
                  const role = e.target.value as 'sala' | 'banda';
                  setSimulationRole(role);
                  setSimulationSenderName(
                    role === 'sala'
                      ? `Programador de ${lead.nombre_sala}`
                      : 'Booking Bakandeya'
                  );
                }}
                className="w-full p-2.5 rounded-xl border bg-slate-900/60 text-slate-200 outline-none"
                style={{ borderColor: colors.border }}
              >
                <option value="sala">Sala / Promotor (Respuesta Entrante)</option>
                <option value="banda">Banda Bakandeya (Respuesta Saliente)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Escenario</label>
              <select
                value={simulationScenario}
                onChange={(e) => setSimulationScenario(e.target.value)}
                className="w-full p-2.5 rounded-xl border bg-slate-900/60 text-slate-200 outline-none"
                style={{ borderColor: colors.border }}
              >
                <option value="taquilla">Propuesta de Taquilla (70/30)</option>
                <option value="cache">Propuesta de Caché Fijo</option>
                <option value="rechazo">Agenda Llena / Rechazo Amable</option>
                <option value="mas_info">Petición de EPK / Dossier técnico</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Nombre del Remitente</label>
            <input
              type="text"
              value={simulationSenderName}
              onChange={(e) => setSimulationSenderName(e.target.value)}
              className="w-full p-2.5 rounded-xl border bg-slate-900/60 text-slate-200 outline-none"
              style={{ borderColor: colors.border }}
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Instrucción Especial / Contexto</label>
            <textarea
              rows={2}
              value={simulationCustomInstruction}
              onChange={(e) => setSimulationCustomInstruction(e.target.value)}
              placeholder="Ej: La sala acepta la fecha del 15 de noviembre y pide cartel..."
              className="w-full p-2.5 rounded-xl border bg-slate-900/60 text-slate-200 outline-none"
              style={{ borderColor: colors.border }}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-2.5 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
          >
            {isGenerating ? (
              <span className="animate-pulse">Generando respuesta con Gemini IA...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generar Correo Simulado con IA
              </>
            )}
          </button>

          {simulationGenerated && (
            <div className="p-4 rounded-xl border bg-slate-900/80 space-y-3" style={{ borderColor: colors.border }}>
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: colors.border }}>
                <span className="font-semibold text-slate-300">Vista Previa del Mensaje</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  Listo para registrar
                </span>
              </div>
              <textarea
                rows={5}
                value={simulationMessage}
                onChange={(e) => setSimulationMessage(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-950 border text-slate-200 font-mono text-[11px] outline-none"
                style={{ borderColor: colors.border }}
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-3" style={{ borderColor: colors.border }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCommit}
            disabled={!simulationMessage}
            className="px-5 py-2 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            Registrar en Hilo de Emails
          </button>
        </div>
      </div>
    </div>
  );
};
