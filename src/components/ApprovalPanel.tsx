import React, { useState } from 'react';
import { Lead, ThemeColors } from '../types';
import { Check, Edit2, X, RefreshCw, Send, AlertTriangle, ShieldCheck, Mail, Clock } from 'lucide-react';

interface ApprovalPanelProps {
  leads: Lead[];
  colors: ThemeColors;
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
}

export default function ApprovalPanel({ leads, colors, onUpdateLead }: ApprovalPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedPitch, setEditedPitch] = useState<string>('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<string>('');

  // Only show leads in "pendiente_aprobacion"
  const pendingLeads = leads.filter(l => l.estado === 'pendiente_aprobacion');

  const handleStartEdit = (lead: Lead) => {
    setEditingId(lead.id);
    setEditedPitch(lead.pitch_generado);
  };

  const handleSaveEdit = (leadId: string) => {
    onUpdateLead(leadId, { pitch_generado: editedPitch });
    setEditingId(null);
  };

  const handleApprove = (lead: Lead) => {
    const today = new Date().toISOString().split('T')[0];
    const updatedNotes = `*** [${today}] Lead APROBADO por humano para envío cron ***\n${lead.notas || ''}`;
    onUpdateLead(lead.id, { 
      estado: 'aprobado', 
      pitch_generado: editingId === lead.id ? editedPitch : lead.pitch_generado,
      notas: updatedNotes
    }, 'pendiente_aprobacion');
    setEditingId(null);
  };

  const handleRejectSubmit = (lead: Lead) => {
    if (!rejectionNotes) return;
    const today = new Date().toISOString().split('T')[0];
    const updatedNotes = `*** [${today}] RECHAZADO EN PANEL DE APROBACIÓN: "${rejectionNotes}" ***\n${lead.notas || ''}`;
    onUpdateLead(lead.id, {
      estado: 'nuevo',
      notas: updatedNotes
    }, 'pendiente_aprobacion');
    setRejectingId(null);
    setRejectionNotes('');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Security notice card */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col md:flex-row gap-3.5 items-start md:items-center justify-between">
        <div className="flex gap-3 items-start">
          <ShieldCheck className="w-6 h-6 text-amber-500 shrink-0 mt-0.5 md:mt-0" />
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-amber-500 font-mono">Regla de Seguridad de Envío</h4>
            <p className="text-xs text-neutral-400 mt-1">
              Esta app <strong>nunca envía emails directamente</strong>. Al hacer click en "Aprobar", el estado pasa a <code>aprobado</code>. El script Python <code>agents/enviador_cron.py</code> ejecutará el envío real desde su servidor seguro e independiente en el próximo ciclo programado.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded border border-amber-500/20 shrink-0 select-none">
          MODO SEGURO ACTIVO
        </span>
      </div>

      {pendingLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/10">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mb-3" />
          <h3 className="text-sm font-bold text-neutral-300">¡Bandeja de Aprobación Vacía!</h3>
          <p className="text-xs text-neutral-500 max-w-sm mt-1 leading-relaxed">
            Todos los pitches de email propuestos por el agente Redactor ya han sido validados o rechazados. El agente Scout sigue rastreando más bolos potenciales.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${colors.accent}`} />
            <h3 className="font-bold tracking-tight text-sm uppercase text-neutral-300 font-mono">
              Pitches esperando revisión ({pendingLeads.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {pendingLeads.map((lead) => {
              const isEditing = editingId === lead.id;
              const isRejecting = rejectingId === lead.id;

              return (
                <div
                  key={lead.id}
                  className={`border rounded-xl overflow-hidden transition-all duration-300 ${
                    isEditing ? 'border-neutral-200 bg-neutral-900/40' : `${colors.border} bg-neutral-900/10`
                  }`}
                >
                  {/* Card Header */}
                  <div className="bg-neutral-950 px-5 py-4 border-b border-neutral-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-neutral-100">{lead.nombre_sala}</h4>
                        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                          {lead.ciudad} ({lead.region})
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        Aforo: <strong className="text-neutral-400 font-mono">{lead.aforo?.toLocaleString() || 'N/D'}</strong> pax | Estilo: <strong className="text-neutral-400">{lead.genero}</strong>
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {!isEditing ? (
                        <button
                          id={`edit-pitch-btn-${lead.id}`}
                          onClick={() => handleStartEdit(lead)}
                          className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 text-xs font-mono flex items-center gap-1.5 transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Editar Texto
                        </button>
                      ) : (
                        <button
                          id={`cancel-pitch-edit-${lead.id}`}
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 rounded border border-neutral-800 text-xs font-mono flex items-center gap-1 transition-all"
                        >
                          <X className="w-3.5 h-3.5" /> Cancelar
                        </button>
                      )}

                      <button
                        id={`reject-pitch-btn-${lead.id}`}
                        onClick={() => {
                          setRejectingId(lead.id);
                          setEditingId(null);
                        }}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded border border-rose-500/20 text-xs font-mono flex items-center gap-1 transition-all"
                      >
                        <X className="w-3.5 h-3.5" /> Rechazar
                      </button>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Pitch Editor / Viewer */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> PROPUESTA DE EMAIL PARA: {lead.email_contacto || 'sin-email@contacto.com'}
                        </span>
                        {isEditing && (
                          <span className="text-[10px] font-mono text-amber-500">
                            ✏️ Editando contenido en vivo
                          </span>
                        )}
                      </div>

                      {isEditing ? (
                        <textarea
                          id={`pitch-textarea-${lead.id}`}
                          rows={12}
                          value={editedPitch}
                          onChange={(e) => setEditedPitch(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-4 text-xs font-mono text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400 leading-relaxed"
                        />
                      ) : (
                        <div className="w-full bg-neutral-950/80 border border-neutral-900 rounded-lg p-4 text-xs font-mono text-neutral-300 leading-relaxed whitespace-pre-wrap select-text">
                          {lead.pitch_generado}
                        </div>
                      )}
                    </div>

                    {/* Notes detail */}
                    {lead.notas && (
                      <div className="bg-neutral-900/40 p-3 rounded-lg border border-neutral-900 text-xs">
                        <span className="font-mono text-[10px] text-neutral-500 block mb-1">NOTAS DEL DESCUBRIMIENTO:</span>
                        <p className="text-neutral-400 leading-relaxed">{lead.notas}</p>
                      </div>
                    )}

                    {/* Rejection Interface inline */}
                    {isRejecting && (
                      <div className="bg-rose-950/10 border border-rose-900/30 rounded-lg p-4 space-y-3">
                        <div className="flex gap-1.5 items-center">
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          <h5 className="font-bold text-xs uppercase font-mono text-rose-400">Rechazar Pitch y Devolver a "Nuevo"</h5>
                        </div>
                        <p className="text-xs text-neutral-400 leading-normal">
                          Por favor, describe brevemente qué corrección necesita este correo. El lead volverá al estado <code>nuevo</code> y el agente Redactor de IA lo re-procesará usando tu sugerencia como pauta.
                        </p>
                        <div className="flex gap-2">
                          <input
                            id={`rejection-input-${lead.id}`}
                            type="text"
                            value={rejectionNotes}
                            onChange={(e) => setRejectionNotes(e.target.value)}
                            placeholder="Ej: Destacar que ya llenamos en su misma provincia hace poco, corregir tono demasiado serio..."
                            className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-rose-800"
                          />
                          <button
                            id={`submit-rejection-${lead.id}`}
                            onClick={() => handleRejectSubmit(lead)}
                            className="bg-rose-600 hover:bg-rose-700 text-neutral-100 px-4 py-2 rounded text-xs font-bold transition-all font-mono shrink-0"
                          >
                            Rechazar Pitch
                          </button>
                          <button
                            id={`cancel-rejection-${lead.id}`}
                            onClick={() => setRejectingId(null)}
                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-2 rounded text-xs transition-all font-mono"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Panel Footer */}
                    {!isRejecting && (
                      <div className="pt-3 border-t border-neutral-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 text-cyan-500 shrink-0" />
                          <span>Petición generada por el agente Redactor AI</span>
                        </div>

                        <div className="flex gap-2 justify-end self-stretch sm:self-auto">
                          {isEditing && (
                            <button
                              id={`save-pitch-draft-${lead.id}`}
                              onClick={() => handleSaveEdit(lead.id)}
                              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                              <Check className="w-4 h-4 text-emerald-400" /> Guardar Borrador
                            </button>
                          )}

                          <button
                            id={`approve-pitch-btn-${lead.id}`}
                            onClick={() => handleApprove(lead)}
                            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${colors.primary}`}
                          >
                            <Send className="w-4 h-4 text-zinc-950" /> Aprobar para Envío
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
