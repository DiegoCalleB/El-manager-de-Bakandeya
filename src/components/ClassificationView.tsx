import React, { useState } from 'react';
import { Lead, LeadStatus, ThemeColors } from '../types';
import { RefreshCw, MessageSquare, AlertCircle, Sparkles, HelpCircle, Check, ArrowRight, X } from 'lucide-react';

interface ClassificationViewProps {
  leads: Lead[];
  colors: ThemeColors;
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
}

export default function ClassificationView({ leads, colors, onUpdateLead }: ClassificationViewProps) {
  const [activeTab, setActiveTab] = useState<'todos' | 'interesado' | 'negociando' | 'no_interesado'>('todos');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter leads that are in classified statuses
  const classifiedLeads = leads.filter(l => 
    l.estado === 'interesado' || l.estado === 'negociando' || l.estado === 'no_interesado'
  );

  const filteredLeads = classifiedLeads.filter(l => {
    if (activeTab === 'todos') return true;
    return l.estado === activeTab;
  });

  const handleUpdateStatus = (lead: Lead, newStatus: LeadStatus) => {
    if (lead.estado === newStatus) return;
    const today = new Date().toISOString().split('T')[0];
    const correctionMsg = `*** [${today}] Clasificación corregida a '${newStatus}' manualmente ***\n`;
    
    onUpdateLead(lead.id, {
      estado: newStatus,
      notas: correctionMsg + (lead.notas || '')
    }, lead.estado);
    setEditingId(null);
  };

  const getStatusStyle = (status: LeadStatus) => {
    switch (status) {
      case 'interesado': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'negociando': return 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20';
      case 'no_interesado': return 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20';
      default: return 'text-neutral-400 bg-neutral-900 border-neutral-800';
    }
  };

  const getStatusLabel = (status: LeadStatus) => {
    switch (status) {
      case 'interesado': return 'Interesado 🔥';
      case 'negociando': return 'Negociando 💬';
      case 'no_interesado': return 'No Interesado 💤';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Explanation Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row gap-3.5 items-start md:items-center justify-between">
        <div className="flex gap-3 items-start">
          <Sparkles className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5 md:mt-0" />
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-cyan-400 font-mono">Bandeja de Clasificación Automática</h4>
            <p className="text-xs text-neutral-400 mt-1">
              El agente <code>Lector de Bandeja AI</code> revisa las respuestas de correo que entran. Si el bot comete algún error al detectar la intención de la sala, puedes corregir su clasificación manualmente abajo. La corrección se registrará en las notas de la sala.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-neutral-800">
        {(['todos', 'interesado', 'negociando', 'no_interesado'] as const).map((tab) => {
          const count = tab === 'todos' ? classifiedLeads.length : classifiedLeads.filter(l => l.estado === tab).length;
          const isActive = activeTab === tab;
          return (
            <button
              id={`tab-classification-${tab}`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-mono font-medium border-b-2 capitalize transition-all relative ${
                isActive 
                  ? 'border-neutral-100 text-neutral-100 font-bold' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>{tab === 'todos' ? 'Ver Todos' : tab.replace('_', ' ')}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-sans font-black ${
                  isActive ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-950 text-neutral-600'
                }`}>
                  {count}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/10">
          <HelpCircle className="w-10 h-10 text-neutral-600 mb-3" />
          <p className="text-sm font-semibold text-neutral-400">No hay salas en esta categoría</p>
          <p className="text-xs text-neutral-500 mt-1">
            {activeTab === 'todos' ? 'Aún no se han recibido respuestas clasificadas por el agente.' : 'Filtra por otra categoría.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredLeads.map((lead) => {
            const isEditing = editingId === lead.id;
            return (
              <div
                key={lead.id}
                className={`p-5 rounded-xl border bg-neutral-900/40 hover:border-neutral-700/80 transition-all flex flex-col gap-4 ${colors.neonShadow}`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-neutral-100">{lead.nombre_sala}</h4>
                      <span className="text-[10px] font-mono text-neutral-400 bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded">
                        {lead.ciudad}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Email de contacto: <a href={`mailto:${lead.email_contacto}`} className="text-cyan-400 hover:underline">{lead.email_contacto}</a>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1.5 ${getStatusStyle(lead.estado)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {getStatusLabel(lead.estado)}
                    </span>
                  </div>
                </div>

                {/* Sub info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-neutral-800/60 py-3 text-xs">
                  <div>
                    <span className="font-mono text-[9px] uppercase text-neutral-500 block mb-1">Última Respuesta del Promotor</span>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-neutral-500 shrink-0" />
                      <span className="text-neutral-300 font-mono text-[11px]">
                        {lead.fecha_ultima_respuesta ? `Registrada el ${lead.fecha_ultima_respuesta}` : 'Respuestas en bandeja monitorizada'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase text-neutral-500 block mb-1">Oyentes estimados en Región</span>
                    <p className="text-neutral-300">
                      Aforo sala: <strong className="font-mono text-neutral-100">{lead.aforo?.toLocaleString() || 'N/D'}</strong> personas | Gasto estimado de barra habitual
                    </p>
                  </div>
                </div>

                {/* Lead notes */}
                <div className="space-y-1">
                  <span className="font-mono text-[9px] uppercase text-neutral-500 block">Notas de la Negociación</span>
                  <p className="text-neutral-300 text-xs leading-relaxed whitespace-pre-line bg-neutral-950 p-3 rounded-lg border border-neutral-900 font-sans">
                    {lead.notas || 'No hay notas del proceso.'}
                  </p>
                </div>

                {/* Correction Controls */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-neutral-900">
                  <div className="text-[10px] font-mono text-neutral-500 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>Lector de Bandeja AI monitorizando de forma segura</span>
                  </div>

                  <div className="flex gap-1.5 justify-end">
                    {!isEditing ? (
                      <button
                        id={`start-correction-${lead.id}`}
                        onClick={() => setEditingId(lead.id)}
                        className="text-xs text-neutral-300 hover:text-white bg-neutral-800 border border-neutral-700 px-3 py-1.5 rounded font-mono transition-all"
                      >
                        Corregir Clasificación Manual
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 flex-wrap">
                        <span className="text-[9px] font-mono text-neutral-400 px-2 uppercase">Mover a:</span>
                        <button
                          id={`correct-to-interesado-${lead.id}`}
                          onClick={() => handleUpdateStatus(lead, 'interesado')}
                          className="px-2.5 py-1 text-[10px] font-mono font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded transition-all"
                        >
                          Interesado
                        </button>
                        <button
                          id={`correct-to-negociando-${lead.id}`}
                          onClick={() => handleUpdateStatus(lead, 'negociando')}
                          className="px-2.5 py-1 text-[10px] font-mono font-bold bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-400 rounded transition-all"
                        >
                          Negociando
                        </button>
                        <button
                          id={`correct-to-no-interesado-${lead.id}`}
                          onClick={() => handleUpdateStatus(lead, 'no_interesado')}
                          className="px-2.5 py-1 text-[10px] font-mono font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded transition-all"
                        >
                          No interesado
                        </button>
                        <button
                          id={`cancel-correction-${lead.id}`}
                          onClick={() => setEditingId(null)}
                          className="p-1 text-neutral-500 hover:text-white"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
