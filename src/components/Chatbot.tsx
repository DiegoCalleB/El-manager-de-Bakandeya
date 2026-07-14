import React, { useState, useRef, useEffect } from 'react';
import { Message as MessageType, Lead, Rehearsal, Concert, ThemeColors } from '../types';
import { Send, Bot, User, Sparkles, RefreshCw, AlertCircle, CheckCircle, HelpCircle, Calendar, ShieldAlert, X } from 'lucide-react';

interface ProposedAction {
  type: 'propose_lead_approval' | 'propose_rehearsal' | 'propose_status_change' | 'propose_agent_trigger';
  leadId?: string;
  leadName?: string;
  description: string;
  newStatus?: string;
  agentName?: string;
  params?: any;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  proposedActions?: ProposedAction[];
  actionStatus?: 'pending' | 'applied' | 'dismissed';
}

interface ChatbotProps {
  colors: ThemeColors;
  leads: Lead[];
  rehearsals: Rehearsal[];
  concerts: Concert[];
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
  onAddRehearsal: (rehearsal: Rehearsal) => void;
  isFloating?: boolean;
  onClose?: () => void;
}

export default function Chatbot({ colors, leads, rehearsals, concerts, onUpdateLead, onAddRehearsal, isFloating, onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: '🎷 **¡Buenas, Diego/Larra!** Soy tu **Manager Virtual de Bakandeya**.\n\nEstoy conectado en tiempo real con vuestra hoja de datos de Google Sheets (salas), el calendario de ensayos de banda, la contabilidad y la logística de redes.\n\nPuedes preguntarme cosas como:\n- *¿Qué salas tengo pendientes de aprobación en Madrid o Granada?*\n- *Resúmeme el estado de la semana o hazme una lista de tareas para hoy.*\n- *¿Cuántas salas de Ska o Reggae tenemos registradas?*\n\nSi necesitas, puedo **proponer cambios directos** en las salas (como aprobar un correo de contacto) o agendar ensayos, pidiéndote confirmación antes de actuar.',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isStitchLight = colors.accent === 'text-indigo-600';

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Bullets
      if (line.trim().startsWith('- ')) {
        const bulletText = line.trim().slice(2);
        return (
          <li key={idx} className="ml-4 list-disc mt-1 text-xs">
            {formatBold(bulletText)}
          </li>
        );
      }
      return (
        <p key={idx} className="min-h-[1.2em] text-xs leading-relaxed mt-1">
          {formatBold(line)}
        </p>
      );
    });
  };

  const formatBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className={`font-bold ${isStitchLight ? 'text-indigo-950' : 'text-neutral-100'}`}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsgText = inputText;
    setInputText('');

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsgText,
          chatHistory: messages.slice(-8).map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      if (!response.ok) {
        throw new Error('Response error from server');
      }

      const data = await response.json();
      
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.text || 'He recibido los datos correctamente.',
        timestamp: new Date(),
        proposedActions: data.proposedActions || [],
        actionStatus: (data.proposedActions && data.proposedActions.length > 0) ? 'pending' : undefined
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: '⚠️ **Error de Conexión:** Ha habido un problema conectando con el servicio de Inteligencia Artificial. Por favor, inténtalo de nuevo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm action callback
  const handleConfirmAction = async (msgId: string, action: ProposedAction) => {
    // 1. Apply changes
    if (action.type === 'propose_lead_approval' && action.leadId) {
      const targetLead = leads.find(l => l.id === action.leadId);
      if (targetLead) {
        const today = new Date().toISOString().split('T')[0];
        const updatedNotes = `*** [${today}] Correo APROBADO vía Chatbot AI Assistant ***\n${targetLead.notas || ''}`;
        
        onUpdateLead(action.leadId, {
          estado: 'aprobado',
          notas: updatedNotes
        }, targetLead.estado);
      }

      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return { ...m, actionStatus: 'applied' };
        }
        return m;
      }));

      const successMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: 'bot',
        text: `✅ **Acción Ejecutada con éxito:** Se ha procesado la propuesta para **"${action.leadName || 'Sala'}"**. El estado ha sido modificado y se ha persistido el log correspondiente en la base de datos de Google Sheets. El agente Enviador re-procesará la cola esta tarde.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMsg]);

    } else if (action.type === 'propose_status_change' && action.leadId && action.newStatus) {
      const targetLead = leads.find(l => l.id === action.leadId);
      if (targetLead) {
        const today = new Date().toISOString().split('T')[0];
        const updatedNotes = `*** [${today}] Clasificación editada vía Chatbot AI a '${action.newStatus}' ***\n${targetLead.notas || ''}`;
        
        onUpdateLead(action.leadId, {
          estado: action.newStatus as any,
          notas: updatedNotes
        }, targetLead.estado);
      }

      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return { ...m, actionStatus: 'applied' };
        }
        return m;
      }));

      const successMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: 'bot',
        text: `✅ **Acción Ejecutada con éxito:** Se ha procesado la propuesta para **"${action.leadName || 'Sala'}"**. El estado ha sido modificado y se ha persistido el log correspondiente en la base de datos de Google Sheets.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMsg]);

    } else if (action.type === 'propose_agent_trigger' && action.agentName) {
      setIsLoading(true);
      try {
        const pat = localStorage.getItem('bakandeya_github_pat') || '';
        const owner = localStorage.getItem('bakandeya_github_owner') || '';
        const repo = localStorage.getItem('bakandeya_github_repo') || '';
        const ref = localStorage.getItem('bakandeya_github_ref') || 'main';

        const customHeaders: Record<string, string> = {
          'Content-Type': 'application/json'
        };

        if (pat) customHeaders['x-github-pat'] = pat;
        if (owner) customHeaders['x-github-owner'] = owner;
        if (repo) customHeaders['x-github-repo'] = repo;
        if (ref) customHeaders['x-github-ref'] = ref;

        const response = await fetch('/api/trigger-agent', {
          method: 'POST',
          headers: customHeaders,
          body: JSON.stringify({
            agentName: action.agentName,
            params: action.params
          })
        });

        if (!response.ok) {
          let errorText = 'Fallo al disparar el agente.';
          try {
            const errData = await response.json();
            if (errData && errData.error) {
              errorText = errData.error;
            }
          } catch (_) {
            // fallback if JSON parsing fails
          }
          throw new Error(errorText);
        }

        const data = await response.json();

        if (data.detectedRef) {
          localStorage.setItem('bakandeya_github_ref', data.detectedRef);
          window.dispatchEvent(new Event('github-ref-updated'));
        }

        setMessages(prev => prev.map(m => {
          if (m.id === msgId) {
            return { ...m, actionStatus: 'applied' };
          }
          return m;
        }));

        const isSim = data.simulated;
        const successMsg: ChatMessage = {
          id: `sys-${Date.now()}`,
          sender: 'bot',
          text: isSim 
            ? `⚙️ **Simulación del Agente '${action.agentName}':**\n\n${data.message}`
            : `🚀 **Agente '${action.agentName}' Iniciado:**\n\n${data.message}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMsg]);

      } catch (err: any) {
        console.error(err);
        const errorMsg: ChatMessage = {
          id: `sys-err-${Date.now()}`,
          sender: 'bot',
          text: `❌ **Error al ejecutar el agente:** ${err.message || 'No se pudo contactar con el backend.'}\n\nAsegúrate de configurar tu **GITHUB_PAT** y los datos de repositorio correctos en la sección de configuración de GitHub de arriba.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDismissAction = (msgId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        return { ...m, actionStatus: 'dismissed' };
      }
      return m;
    }));
  };

  return (
    <div className={`flex flex-col ${isFloating ? 'h-full' : 'h-[550px]'} ${isStitchLight ? 'bg-white border-slate-200' : 'bg-[#0c0c10]/95 border-neutral-900'} border rounded-2xl overflow-hidden font-sans backdrop-blur-xl shadow-2xl`}>
      {/* Bot Header */}
      <div className={`px-5 py-4 border-b flex items-center justify-between ${isStitchLight ? 'bg-slate-50 border-slate-200/80' : 'bg-[#050507]/90 border-neutral-900/60'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg border ${isStitchLight ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}>
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h4 className={`text-xs font-display font-medium tracking-widest flex items-center gap-1.5 uppercase ${isStitchLight ? 'text-slate-800' : 'text-neutral-100'}`}>
              Mánager Virtual AI <span className={`w-1.5 h-1.5 rounded-full inline-block animate-pulse ${isStitchLight ? 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.8)]' : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]'}`} />
            </h4>
            <span className="text-[9px] font-mono text-neutral-500">SYSTEM CORES ACTIVE // SHEETS INTEGRATION</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="clear-chat-btn"
            onClick={() => setMessages([
              {
                id: 'welcome-1',
                sender: 'bot',
                text: '🎷 **¡Buenas, Diego/Larra!** He limpiado el hilo del chat.\n\n¿En qué os puedo ayudar para organizar los conciertos de la banda, el calendario de redes o revisar los correos para las salas hoy?',
                timestamp: new Date()
              }
            ])}
            className={`text-[9px] font-mono tracking-wider uppercase transition-all flex items-center gap-1 hover:underline cursor-pointer active:scale-95 ${isStitchLight ? 'text-slate-400 hover:text-indigo-600' : 'text-neutral-500 hover:text-cyan-400'}`}
          >
            Limpiar Hilo
          </button>
          {onClose && (
            <button
              id="close-floating-chat-btn"
              onClick={onClose}
              className={`p-1.5 rounded transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
                isStitchLight 
                  ? 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800' 
                  : 'bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title="Cerrar Chat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className={`flex-1 p-4 overflow-y-auto space-y-4 ${isStitchLight ? 'bg-slate-50/50' : 'bg-neutral-950/20'}`}>
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div key={msg.id} className={`flex gap-3 max-w-[90%] ${isBot ? 'self-start' : 'self-end ml-auto flex-row-reverse'}`}>
              {/* Avatar circle */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                isBot 
                  ? (isStitchLight ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400') 
                  : (isStitchLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-neutral-900 border-neutral-800 text-neutral-400')
              }`}>
                {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              <div className="space-y-2">
                {/* Text Bubble */}
                <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  isBot 
                    ? (isStitchLight 
                        ? 'bg-white border-slate-200 text-slate-800 rounded-tl-none shadow-sm' 
                        : 'bg-neutral-900/50 border-neutral-900/80 rounded-tl-none text-neutral-300') 
                    : (isStitchLight 
                        ? 'bg-indigo-50 border-indigo-100 text-indigo-950 rounded-tr-none' 
                        : 'bg-cyan-950/20 border-cyan-500/10 rounded-tr-none text-neutral-300')
                }`}>
                  <div className="space-y-1">{parseMarkdown(msg.text)}</div>
                  <span className="text-[8px] font-mono text-neutral-600 block mt-2 text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Proposed actions box within chat */}
                {isBot && msg.proposedActions && msg.proposedActions.length > 0 && (
                  <div className={`border rounded-2xl p-4 space-y-3 max-w-sm mt-1 backdrop-blur-md ${isStitchLight ? 'border-indigo-100 bg-indigo-50/20' : 'border-cyan-500/20 bg-cyan-500/5'}`}>
                    <div className={`flex items-center gap-1.5 ${isStitchLight ? 'text-indigo-600' : 'text-cyan-400'}`}>
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      <h5 className="font-mono font-bold text-[9px] tracking-widest uppercase">Propuesta del Manager de IA</h5>
                    </div>
                    
                    {msg.proposedActions.map((act, aIdx) => (
                      <div key={aIdx} className="space-y-2.5">
                        <p className={`text-[11px] leading-relaxed p-2.5 rounded-xl border font-mono ${isStitchLight ? 'text-slate-800 bg-white border-slate-200' : 'text-neutral-300 bg-neutral-950 border-neutral-900'}`}>
                          {act.description}
                        </p>

                        {msg.actionStatus === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              id={`confirm-proposal-btn-${msg.id}`}
                              onClick={() => handleConfirmAction(msg.id, act)}
                              className={`flex-1 text-[10px] font-bold font-mono tracking-wider uppercase py-2 rounded-lg transition-all cursor-pointer active:scale-95 active:opacity-90 ${isStitchLight ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' : 'bg-cyan-500 hover:bg-cyan-600 text-neutral-950'}`}
                            >
                              ✓ Aplicar Cambio
                            </button>
                            <button
                              id={`dismiss-proposal-btn-${msg.id}`}
                              onClick={() => handleDismissAction(msg.id)}
                              className={`px-3 py-2 text-[10px] font-mono rounded-lg border transition-colors cursor-pointer active:scale-95 active:opacity-90 ${
                                isStitchLight 
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border-slate-200' 
                                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border-neutral-800'
                              }`}
                            >
                              Descartar
                            </button>
                          </div>
                        ) : msg.actionStatus === 'applied' ? (
                          <div className="text-[10px] font-mono text-emerald-600 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" /> Cambio de estado aplicado
                          </div>
                        ) : (
                          <div className={`text-[10px] font-mono border rounded-lg p-2 ${isStitchLight ? 'text-slate-400 bg-slate-50 border-slate-100' : 'text-neutral-500 bg-neutral-900 border-neutral-800'}`}>
                            Propuesta descartada / expirada
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-[80%] self-start">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center animate-pulse border ${isStitchLight ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}>
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className={`p-3.5 rounded-xl border rounded-tl-none text-[11px] font-mono flex items-center gap-2 ${isStitchLight ? 'bg-white border-slate-200 text-slate-500 shadow-sm' : 'bg-neutral-900/50 border-neutral-900 text-neutral-500'}`}>
              <RefreshCw className={`w-3.5 h-3.5 animate-spin ${isStitchLight ? 'text-indigo-600' : 'text-cyan-400'}`} /> Analizando base de datos Sheets...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Form Footer */}
      <form onSubmit={handleSendMessage} className={`p-3 border-t flex gap-2 ${isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-[#050507]/90 border-neutral-900/60'}`}>
        <input
          id="chatbot-text-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribe una pregunta sobre salas, ensayos o tareas para hoy..."
          className={`flex-1 border rounded-xl px-3.5 py-2 text-xs focus:outline-none transition-all font-sans ${isStitchLight ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500 placeholder:text-slate-400' : 'bg-neutral-950/60 border-neutral-900 text-neutral-200 focus:border-cyan-500/50 placeholder:text-neutral-600'}`}
        />
        <button
          id="chatbot-send-btn"
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className={`p-2.5 rounded-xl font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer active:scale-95 active:opacity-90 ${
            inputText.trim() 
              ? (isStitchLight ? 'bg-indigo-600 text-white' : colors.primary) 
              : (isStitchLight ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'bg-neutral-900 text-neutral-600 border border-neutral-800/40')
          }`}
        >
          <Send className={`w-4 h-4 ${isStitchLight && inputText.trim() ? 'text-white' : 'text-zinc-950'}`} />
        </button>
      </form>
    </div>
  );
}
